import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { createYogurtBowl, createCocktail } from './models.js';

/* One fixed WebGL canvas. The model glides between DOM anchors ([data-anchor]):
   each frame we find the anchors just above / below the viewport center and
   interpolate position + scale between their live screen rects. Anchors set
   data-model="yogurt|cocktail|none" and data-scale. */

const FOV = 30;
const CAM_Z = 10;
const lerp = (a, b, t) => a + (b - a) * t;
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const smooth = (t) => t * t * (3 - 2 * t);

export function createStage({ canvas, anchors }) {
  const isMobile = matchMedia('(max-width: 1023px)').matches;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch (e) {
    console.warn('WebGL unavailable', e);
    return null;
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio, isMobile ? 1.5 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 100);
  camera.position.z = CAM_Z;

  const key = new THREE.DirectionalLight(0xfff1dd, 1.6);
  key.position.set(3, 5, 6);
  scene.add(key, new THREE.HemisphereLight(0xffffff, 0xb9a98a, 0.6));

  const models = {
    yogurt: { obj: createYogurtBowl(), tilt: 0.55 },
    cocktail: { obj: createCocktail(), tilt: 0.12 },
  };
  const pivots = {};
  for (const [name, m] of Object.entries(models)) {
    const pivot = new THREE.Group();
    pivot.add(m.obj);
    pivot.visible = false;
    scene.add(pivot);
    pivots[name] = pivot;
  }

  const state = { intro: 0, mouseX: 0, mouseY: 0, smx: 0, smy: 0, spin: 0 };
  let w = 0, h = 0, worldPerPx = 0;

  function resize() {
    w = innerWidth; h = innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    worldPerPx = (2 * Math.tan(THREE.MathUtils.degToRad(FOV / 2)) * CAM_Z) / h;
  }
  resize();
  addEventListener('resize', resize);

  if (!isMobile) {
    addEventListener('pointermove', (e) => {
      state.mouseX = e.clientX / innerWidth - 0.5;
      state.mouseY = e.clientY / innerHeight - 0.5;
    });
  }

  function read(el) {
    const r = el.getBoundingClientRect();
    return {
      x: r.left + r.width / 2,
      y: r.top + r.height / 2,
      size: Math.min(r.width, r.height) * parseFloat(el.dataset.scale || '1'),
      model: el.dataset.model || 'none',
    };
  }

  function solve() {
    const list = anchors.map(read);
    const cy = h / 2;
    let a = list[0], b = list[0], t = 0;
    if (cy <= list[0].y) {
      a = b = list[0];
    } else if (cy >= list[list.length - 1].y) {
      a = b = list[list.length - 1];
    } else {
      for (let i = 0; i < list.length - 1; i++) {
        if (list[i].y <= cy && list[i + 1].y >= cy) {
          a = list[i]; b = list[i + 1];
          t = smooth(clamp01((cy - a.y) / Math.max(1, b.y - a.y)));
          break;
        }
      }
    }
    let model, scaleK;
    if (a.model === b.model) {
      model = a.model; scaleK = 1;
    } else if (t < 0.5) {
      model = a.model; scaleK = 1 - t * 2;
    } else {
      model = b.model; scaleK = (t - 0.5) * 2;
    }
    // When gliding towards/away from a "none" anchor keep the last real position
    const ax = a.model === 'none' ? b : a;
    const bx = b.model === 'none' ? a : b;
    return {
      model,
      x: lerp(ax.x, bx.x, t),
      y: lerp(ax.y, bx.y, t),
      size: lerp(ax.size, bx.size, t) * scaleK,
      t,
    };
  }

  let last = performance.now();
  let scrollVel = 0, lastScroll = scrollY;
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const s = solve();

    scrollVel = lerp(scrollVel, scrollY - lastScroll, 0.1);
    lastScroll = scrollY;
    state.spin += dt * (reduce ? 0 : 0.35) + scrollVel * 0.0025;
    state.smx = lerp(state.smx, state.mouseX, 0.06);
    state.smy = lerp(state.smy, state.mouseY, 0.06);

    let anyVisible = false;
    for (const [name, pivot] of Object.entries(pivots)) {
      const active = name === s.model && s.size > 1;
      pivot.visible = active;
      if (!active) continue;
      anyVisible = true;
      const k = (s.size * worldPerPx) / 2 * state.intro;
      pivot.scale.setScalar(Math.max(0.0001, k));
      pivot.position.set((s.x - w / 2) * worldPerPx, -(s.y - h / 2) * worldPerPx, 0);
      pivot.rotation.set(models[name].tilt + state.smy * 0.4 + scrollVel * 0.002, state.spin + state.smx * 0.8 + (1 - state.intro) * 2.5, state.smx * -0.1);
    }
    if (anyVisible) renderer.render(scene, camera);
    else renderer.clear();
    raf = requestAnimationFrame(frame);
  }
  let raf = requestAnimationFrame(frame);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) cancelAnimationFrame(raf);
    else { last = performance.now(); raf = requestAnimationFrame(frame); }
  });

  return state;
}
