import * as THREE from 'three';

/* Procedural models — no external GLB needed.
   Both models are built to fit roughly inside a unit sphere (radius ≈ 1)
   so the stage can scale them to the size of their DOM anchor. */

const rand = mulberry32(7);
function mulberry32(a) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function canvasTexture(size, draw) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  draw(c.getContext('2d'), size);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/* ---------------- Greek yogurt bowl ---------------- */
export function createYogurtBowl() {
  const group = new THREE.Group();

  // Bowl — lathe profile (outer wall up, rim, inner wall down)
  const pts = [];
  const outer = (t) => new THREE.Vector2(0.38 + 0.62 * Math.sin(t * Math.PI * 0.5), -0.55 + 0.72 * (1 - Math.cos(t * Math.PI * 0.5)) ** 0.9);
  pts.push(new THREE.Vector2(0, -0.55));
  pts.push(new THREE.Vector2(0.34, -0.55));
  pts.push(new THREE.Vector2(0.36, -0.6));
  pts.push(new THREE.Vector2(0.4, -0.6));
  for (let i = 0; i <= 24; i++) pts.push(outer(i / 24));
  pts.push(new THREE.Vector2(1.0, 0.2));
  pts.push(new THREE.Vector2(0.95, 0.2));
  for (let i = 24; i >= 0; i--) {
    const p = outer(i / 24);
    pts.push(new THREE.Vector2(Math.max(0, p.x - 0.06), p.y + 0.04));
  }
  const bowlGeo = new THREE.LatheGeometry(pts, 96);
  bowlGeo.computeVertexNormals();
  const ceramic = new THREE.MeshPhysicalMaterial({ color: 0xf6f3ec, roughness: 0.32, clearcoat: 0.7, clearcoatRoughness: 0.2 });
  group.add(new THREE.Mesh(bowlGeo, ceramic));

  // Yogurt mound
  const surfaceY = (r) => 0.24 - 0.12 * (r / 0.93) ** 2;
  const yPts = [];
  for (let i = 0; i <= 20; i++) {
    const r = (i / 20) * 0.93;
    yPts.push(new THREE.Vector2(r, surfaceY(r)));
  }
  yPts.push(new THREE.Vector2(0.9, 0.0));
  const yogurtGeo = new THREE.LatheGeometry(yPts.reverse(), 96);
  // gentle creamy ripples
  const pos = yogurtGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i), y = pos.getY(i);
    if (y > 0.05) pos.setY(i, y + 0.015 * Math.sin(x * 9 + z * 4) * Math.cos(z * 7));
  }
  yogurtGeo.computeVertexNormals();
  const yogurt = new THREE.MeshPhysicalMaterial({ color: 0xfdfcf8, roughness: 0.42, clearcoat: 0.35, sheen: 0.4, sheenColor: 0xffffff });
  group.add(new THREE.Mesh(yogurtGeo, yogurt));

  const onSurface = (r, a, lift = 0) => new THREE.Vector3(Math.cos(a) * r, surfaceY(r) + lift, Math.sin(a) * r);

  // Blueberries
  const berryGeo = new THREE.SphereGeometry(0.085, 24, 16);
  const berryMat = new THREE.MeshPhysicalMaterial({ color: 0x27304f, roughness: 0.38, clearcoat: 0.3, sheen: 0.6, sheenColor: 0x7d8bb8 });
  [[0.72, 0.2], [0.78, 0.55], [0.62, 0.85], [0.8, 2.2], [0.7, 2.5], [0.55, 4.0], [0.78, 4.3], [0.66, 5.6], [0.3, 1.2], [0.82, 3.3]].forEach(([r, a]) => {
    const m = new THREE.Mesh(berryGeo, berryMat);
    m.position.copy(onSurface(r, a, 0.06));
    m.scale.set(1, 0.85, 1);
    group.add(m);
  });

  // Strawberries (halved look: lathe heart, lying on the yogurt)
  const sPts = [];
  for (let i = 0; i <= 16; i++) {
    const t = i / 16;
    sPts.push(new THREE.Vector2(Math.sin(t * Math.PI) ** 0.8 * 0.13 * (1 - 0.35 * t), -0.16 + t * 0.32));
  }
  const strawGeo = new THREE.LatheGeometry(sPts, 32);
  const strawMat = new THREE.MeshPhysicalMaterial({ color: 0xd52f3b, roughness: 0.35, clearcoat: 0.6 });
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x4f8a3a, roughness: 0.6 });
  [[0.55, 1.6], [0.6, 3.6], [0.45, 5.1]].forEach(([r, a], i) => {
    const s = new THREE.Mesh(strawGeo, strawMat);
    s.position.copy(onSurface(r, a, 0.08));
    s.rotation.set(Math.PI / 2.4, a + i, 0.3);
    group.add(s);
    const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.04, 6), leafMat);
    leaf.position.set(0, 0.17, 0);
    s.add(leaf);
  });

  // Kiwi slices
  const kiwiTop = canvasTexture(256, (g, s) => {
    const grd = g.createRadialGradient(s / 2, s / 2, 4, s / 2, s / 2, s / 2);
    grd.addColorStop(0, '#f7f3d2'); grd.addColorStop(0.18, '#e9eeb0'); grd.addColorStop(0.45, '#8dbb38'); grd.addColorStop(0.9, '#6a9e22'); grd.addColorStop(1, '#6b5530');
    g.fillStyle = grd; g.fillRect(0, 0, s, s);
    g.fillStyle = '#1d1a12';
    for (let i = 0; i < 26; i++) {
      const a = (i / 26) * Math.PI * 2, r = s * 0.2 + (i % 2) * 6;
      g.beginPath(); g.ellipse(s / 2 + Math.cos(a) * r, s / 2 + Math.sin(a) * r, 4, 2, a, 0, Math.PI * 2); g.fill();
    }
  });
  const kiwiSide = new THREE.MeshStandardMaterial({ color: 0x6b5530, roughness: 0.9 });
  const kiwiFace = new THREE.MeshPhysicalMaterial({ map: kiwiTop, roughness: 0.3, clearcoat: 0.5 });
  const kiwiGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.045, 40);
  [[0.5, 0.35, 0.25], [0.45, 2.9, -0.3]].forEach(([r, a, tilt]) => {
    const k = new THREE.Mesh(kiwiGeo, [kiwiSide, kiwiFace, kiwiFace]);
    k.position.copy(onSurface(r, a, 0.05));
    k.rotation.set(tilt, a, 0.2);
    group.add(k);
  });

  // Banana slices
  const bananaTop = canvasTexture(128, (g, s) => {
    const grd = g.createRadialGradient(s / 2, s / 2, 2, s / 2, s / 2, s / 2);
    grd.addColorStop(0, '#e7d79a'); grd.addColorStop(0.3, '#f7ecc4'); grd.addColorStop(0.95, '#f3e2a6'); grd.addColorStop(1, '#d9c27a');
    g.fillStyle = grd; g.fillRect(0, 0, s, s);
  });
  const banGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.06, 32);
  const banSide = new THREE.MeshStandardMaterial({ color: 0xeedc9c, roughness: 0.6 });
  const banFace = new THREE.MeshStandardMaterial({ map: bananaTop, roughness: 0.45 });
  [[0.25, 4.6], [0.38, 0.0], [0.18, 2.4]].forEach(([r, a]) => {
    const b = new THREE.Mesh(banGeo, [banSide, banFace, banFace]);
    b.position.copy(onSurface(r, a, 0.06));
    b.rotation.set(0.25 * (rand() - 0.5), 0, 0.25 * (rand() - 0.5));
    group.add(b);
  });

  // Granola clusters
  const granGeo = new THREE.DodecahedronGeometry(0.05, 0);
  const gp = granGeo.attributes.position;
  for (let i = 0; i < gp.count; i++) gp.setXYZ(i, gp.getX(i) * (0.8 + rand() * 0.5), gp.getY(i) * (0.6 + rand() * 0.4), gp.getZ(i) * (0.8 + rand() * 0.5));
  granGeo.computeVertexNormals();
  const granMats = [0xb67a3a, 0x9a6128, 0xc99a5a].map((c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.85, flatShading: true }));
  for (let i = 0; i < 34; i++) {
    const a = -0.6 + rand() * 1.3 + (i % 2 ? Math.PI : 0);
    const r = 0.1 + rand() * 0.5;
    const m = new THREE.Mesh(granGeo, granMats[i % 3]);
    m.position.copy(onSurface(r, a, 0.03 + rand() * 0.03));
    m.rotation.set(rand() * 6, rand() * 6, rand() * 6);
    m.scale.setScalar(0.7 + rand() * 0.8);
    group.add(m);
  }

  // Honey drizzle
  const honeyPts = [];
  for (let i = 0; i <= 80; i++) {
    const t = i / 80;
    const a = t * Math.PI * 3.2;
    const r = 0.12 + t * 0.55 + 0.05 * Math.sin(t * 30);
    honeyPts.push(onSurface(Math.min(r, 0.85), a, 0.035));
  }
  const honeyGeo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(honeyPts), 300, 0.022, 10, false);
  const honeyMat = new THREE.MeshPhysicalMaterial({ color: 0xe0a032, roughness: 0.08, clearcoat: 1, transparent: true, opacity: 0.88 });
  group.add(new THREE.Mesh(honeyGeo, honeyMat));

  // Mint leaf
  const mint = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 8), new THREE.MeshStandardMaterial({ color: 0x3f8f4e, roughness: 0.5 }));
  mint.scale.set(1, 0.18, 0.55);
  mint.position.copy(onSurface(0.05, 0, 0.1));
  mint.rotation.y = 0.6;
  group.add(mint);

  group.position.y = 0.1;
  return group;
}

/* ---------------- Cocktail (coupe) ---------------- */
export function createCocktail() {
  const group = new THREE.Group();

  const bowl = (t) => new THREE.Vector2(0.05 + 0.72 * Math.sin(t * Math.PI * 0.5) ** 0.85, -0.12 + 0.6 * t ** 1.6);
  const pts = [];
  pts.push(new THREE.Vector2(0, -1.0));
  pts.push(new THREE.Vector2(0.48, -1.0));
  pts.push(new THREE.Vector2(0.5, -0.98));
  pts.push(new THREE.Vector2(0.12, -0.92));
  pts.push(new THREE.Vector2(0.045, -0.82));
  pts.push(new THREE.Vector2(0.04, -0.3));
  pts.push(new THREE.Vector2(0.07, -0.16));
  for (let i = 0; i <= 24; i++) pts.push(bowl(i / 24));
  const rim = bowl(1);
  pts.push(new THREE.Vector2(rim.x - 0.025, rim.y));
  for (let i = 24; i >= 2; i--) {
    const p = bowl(i / 24);
    pts.push(new THREE.Vector2(Math.max(0.001, p.x - 0.03), p.y + 0.01));
  }
  pts.push(new THREE.Vector2(0.001, -0.09));
  const glassGeo = new THREE.LatheGeometry(pts, 96);
  glassGeo.computeVertexNormals();
  const glass = new THREE.MeshPhysicalMaterial({
    color: 0xffffff, roughness: 0.04, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.03,
    transparent: true, opacity: 0.28, envMapIntensity: 1.6, side: THREE.DoubleSide, depthWrite: false,
  });
  const glassMesh = new THREE.Mesh(glassGeo, glass);
  glassMesh.renderOrder = 2;

  // Liquid
  const lPts = [new THREE.Vector2(0, -0.08)];
  const fill = 0.82;
  for (let i = 2; i <= 24 * fill; i++) {
    const p = bowl(i / 24);
    lPts.push(new THREE.Vector2(p.x - 0.035, p.y + 0.012));
  }
  const top = lPts[lPts.length - 1];
  lPts.push(new THREE.Vector2(0, top.y));
  const liquid = new THREE.Mesh(
    new THREE.LatheGeometry(lPts, 96),
    new THREE.MeshPhysicalMaterial({ color: 0x9e1f36, roughness: 0.08, clearcoat: 1, transparent: true, opacity: 0.92, sheen: 0.3, sheenColor: 0xff8a8a })
  );
  liquid.renderOrder = 1;
  group.add(liquid);
  group.add(glassMesh);

  // Orange wheel on the rim
  const orangeTex = canvasTexture(256, (g, s) => {
    g.fillStyle = '#f08a24'; g.beginPath(); g.arc(s / 2, s / 2, s / 2, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#fbe3b8'; g.beginPath(); g.arc(s / 2, s / 2, s * 0.44, 0, Math.PI * 2); g.fill();
    for (let i = 0; i < 10; i++) {
      const a0 = (i / 10) * Math.PI * 2 + 0.05, a1 = ((i + 1) / 10) * Math.PI * 2 - 0.05;
      g.fillStyle = i % 2 ? '#f6a33a' : '#f39a2c';
      g.beginPath(); g.moveTo(s / 2, s / 2); g.arc(s / 2, s / 2, s * 0.41, a0, a1); g.closePath(); g.fill();
    }
  });
  const peel = new THREE.MeshStandardMaterial({ color: 0xee7d1c, roughness: 0.5 });
  const face = new THREE.MeshPhysicalMaterial({ map: orangeTex, roughness: 0.35, clearcoat: 0.6 });
  const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.035, 48), [peel, face, face]);
  wheel.rotation.set(Math.PI / 2, 0, 0.1);
  wheel.position.set(rim.x - 0.08, rim.y + 0.06, 0);
  wheel.rotation.z = Math.PI / 2 + 0.25;
  wheel.rotation.y = Math.PI / 2;
  group.add(wheel);

  // Cherry
  const cherry = new THREE.Mesh(new THREE.SphereGeometry(0.11, 24, 16), new THREE.MeshPhysicalMaterial({ color: 0x8e0d1e, roughness: 0.15, clearcoat: 1 }));
  cherry.position.set(-0.22, top.y + 0.06, 0.18);
  group.add(cherry);
  const stemCurve = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(-0.22, top.y + 0.15, 0.18),
    new THREE.Vector3(-0.18, top.y + 0.38, 0.12),
    new THREE.Vector3(-0.02, top.y + 0.5, 0.1)
  );
  group.add(new THREE.Mesh(new THREE.TubeGeometry(stemCurve, 20, 0.012, 6), new THREE.MeshStandardMaterial({ color: 0x4d5a22, roughness: 0.7 })));

  group.position.y = 0.2;
  return group;
}
