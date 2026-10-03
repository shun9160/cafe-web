import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { createStage } from './three/stage.js';

gsap.registerPlugin(ScrollTrigger);

const mqMobile = matchMedia('(max-width: 1023px)');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

/* ---------- Smooth scroll (Lenis + ScrollTrigger) ---------- */
const lenis = new Lenis({ duration: 1.15, smoothWheel: !reduceMotion, anchors: { offset: 0 } });
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((t) => lenis.raf(t * 1000));
gsap.ticker.lagSmoothing(0);

/* ---------- 3D stage ---------- */
const stage = createStage({ canvas: $('[data-stage-canvas]'), anchors: $$('[data-anchor]') });

/* ---------- Preloader (desktop only, like the reference) ---------- */
async function runPreloader() {
  const el = $('[data-preloader]');
  const done = () => {
    el?.classList.add('is-complete');
    if (stage) gsap.to(stage, { intro: 1, duration: reduceMotion ? 0 : 1.6, ease: 'expo.out' });
    introTimeline();
  };
  if (!el || mqMobile.matches || reduceMotion) return done();
  lenis.stop();
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  scrollTo(0, 0);
  const logo = $('[data-preloader-logo]', el);
  const prog = $('[data-preloader-progress]', el);
  const curtain = $('[data-preloader-curtain]', el);
  const counter = { v: 0 };
  const ready = Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1800))]);
  await gsap.to(counter, {
    v: 90, duration: 1.1, ease: 'power2.out',
    onUpdate: () => { prog.textContent = `${Math.round(counter.v)}%`; logo.style.setProperty('--preloader-clip', `${100 - counter.v}%`); },
  });
  await ready;
  await gsap.to(counter, { v: 100, duration: 0.3, onUpdate: () => { prog.textContent = `${Math.round(counter.v)}%`; logo.style.setProperty('--preloader-clip', `${100 - counter.v}%`); } });
  await gsap.to(logo, { opacity: 0, duration: 0.2 });
  gsap.to(prog, { opacity: 0, y: -24, duration: 0.45, ease: 'power3.inOut' });
  await gsap.to(curtain, { yPercent: -100, duration: 0.8, ease: 'expo.inOut' });
  lenis.start();
  done();
}

function introTimeline() {
  if (reduceMotion) return;
  const tl = gsap.timeline();
  tl.from('[data-hero-word]', { yPercent: 40, opacity: 0, duration: 1.4, ease: 'expo.out' })
    .from('.hero__intro > *, .hero__stats li, .hero__icons li', { y: 24, opacity: 0, stagger: 0.06, duration: 0.9, ease: 'power3.out' }, 0.15)
    .from('.header > *', { y: -16, opacity: 0, stagger: 0.08, duration: 0.8, ease: 'power3.out' }, 0.2);
}

/* ---------- Header: light/dark by section + day/night clock ---------- */
const header = $('[data-header]');
const clockIcon = $('[data-clock-icon]');
const clockTime = $('[data-clock-time]');
const icons = { day: '☀', dusk: '◐', night: '☾' };
function setHeader(sec) {
  header.classList.toggle('is-light', sec.dataset.headerTheme === 'light');
  if (sec.dataset.time) clockTime.textContent = sec.dataset.time;
  const p = sec.dataset.period || 'day';
  if (clockIcon.textContent !== icons[p]) {
    clockIcon.textContent = icons[p];
    gsap.fromTo(clockIcon, { rotate: -90, opacity: 0 }, { rotate: 0, opacity: 1, duration: 0.6, ease: 'back.out(2)' });
  }
  document.querySelector('meta[name="theme-color"]').content = sec.dataset.headerTheme === 'light' ? '#262626' : '#f3f1e9';
}
$$('[data-header-theme]').forEach((sec) => {
  ScrollTrigger.create({
    trigger: sec,
    start: 'top top+=32',
    end: 'bottom top+=32',
    onToggle: (self) => self.isActive && setHeader(sec),
  });
});

/* ---------- Mobile menu ---------- */
const menu = $('[data-menu]');
const menuBtn = $('[data-menu-toggle]');
function toggleMenu(open = !menu.classList.contains('is-open')) {
  menu.classList.toggle('is-open', open);
  document.body.classList.toggle('menu-open', open);
  menuBtn.setAttribute('aria-expanded', String(open));
  menuBtn.querySelector('span').textContent = open ? 'Close' : 'Menu';
  open ? lenis.stop() : lenis.start();
}
menuBtn.addEventListener('click', () => toggleMenu());
$$('[data-menu-link]').forEach((a) => a.addEventListener('click', () => toggleMenu(false)));

/* Anchor links through Lenis */
$$('a[href^="#"]').forEach((a) => {
  a.addEventListener('click', (e) => {
    const id = a.getAttribute('href');
    if (id.length < 2) return;
    const target = $(id);
    if (!target) return;
    e.preventDefault();
    lenis.scrollTo(target, { duration: 1.6 });
  });
});

/* ---------- Scroll animations ---------- */
const mm = gsap.matchMedia();

mm.add('(prefers-reduced-motion: no-preference)', () => {
  // Hero wordmark slides as you leave the hero (reference: "Mr.BLACK" drifts)
  gsap.to('[data-hero-word]', {
    xPercent: -18, yPercent: -10, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
  });

  // Concept section: background shifts ivory → olive while the bowl follows
  gsap.fromTo('[data-features]', { backgroundColor: '#f3f1e9' }, {
    backgroundColor: '#afab8e', ease: 'none',
    scrollTrigger: { trigger: '[data-features]', start: 'top 80%', end: 'top 10%', scrub: true },
  });
  gsap.fromTo('.package', { backgroundColor: '#afab8e' }, {
    backgroundColor: '#f3f1e9', ease: 'none',
    scrollTrigger: { trigger: '.package', start: 'top 90%', end: 'top 30%', scrub: true },
  });

  // Fade-up text blocks
  $$('.feature, .package-item, .term, .digital__list li, .benefit, .faq-item, .package__head > *, .key-terms__intro').forEach((el) => {
    gsap.from(el, { y: 40, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%' } });
  });
  $$('.package-item__img').forEach((img) => {
    gsap.fromTo(img, { yPercent: 30 }, { yPercent: -30, ease: 'none', scrollTrigger: { trigger: img, start: 'top bottom', end: 'bottom top', scrub: true } });
  });

  // Day → night stacked cards: each card shrinks & darkens as the next covers it
  const cards = $$('[data-format]');
  cards.forEach((card, i) => {
    const img = $('.format__media img', card);
    gsap.fromTo(img, { yPercent: -8 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: card, start: 'top bottom', end: 'top top', scrub: true } });
    const next = cards[i + 1];
    if (!next) return;
    const shade = document.createElement('div');
    shade.className = 'format__shade';
    card.appendChild(shade);
    const tl = gsap.timeline({ scrollTrigger: { trigger: next, start: 'top bottom', end: 'top top', scrub: true } });
    tl.to(card, { scale: 0.92, ease: 'none' }, 0).to(shade, { opacity: i === cards.length - 2 ? 0.85 : 0.55, ease: 'none' }, 0);
  });

  // Night key-terms: big image drifts inside the sticky frame
  gsap.fromTo('[data-parallax-img]', { yPercent: -6 }, {
    yPercent: 6, ease: 'none',
    scrollTrigger: { trigger: '.key-terms', start: 'top bottom', end: 'bottom top', scrub: true },
  });

  // Phone in hand rises into view
  gsap.from('.phone-hand', {
    yPercent: 45, rotate: 6, ease: 'none',
    scrollTrigger: { trigger: '[data-digital]', start: 'top bottom', end: 'center center', scrub: true },
  });

  // Sticky gallery: photos slide up and pile over each other
  const figs = $$('[data-gallery] .g');
  const gtl = gsap.timeline({ scrollTrigger: { trigger: '[data-gallery]', start: 'top top', end: 'bottom bottom', scrub: 0.6 } });
  figs.forEach((f, i) => {
    gtl.fromTo(f, { yPercent: 160, rotate: i % 2 ? 4 : -4 }, { yPercent: 0, rotate: i % 2 ? 1.5 : -1.5, ease: 'power2.out', duration: 1 }, i * 0.55);
    gtl.fromTo($('img', f), { scale: 1.3 }, { scale: 1, ease: 'none', duration: 1 }, i * 0.55);
  });

  // FAQ title + footer wordmark reveal
  gsap.from('.faq__title', { yPercent: 60, opacity: 0, ease: 'none', scrollTrigger: { trigger: '.faq', start: 'top bottom', end: 'top 30%', scrub: true } });
  gsap.from('[data-footer-word]', { scaleY: 0.2, ease: 'none', scrollTrigger: { trigger: '.footer', start: 'top bottom', end: 'bottom bottom', scrub: true } });
});

/* ---------- Benefit metric flash (reference behaviour) ---------- */
const metricTimers = new WeakMap();
const metricIO = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    clearTimeout(metricTimers.get(e.target));
    if (!e.isIntersecting) return e.target.classList.remove('is-metric-visible');
    e.target.classList.add('is-metric-visible');
    metricTimers.set(e.target, setTimeout(() => e.target.classList.remove('is-metric-visible'), 1800));
  });
}, { threshold: 0.45 });
$$('[data-benefit-card]').forEach((c) => metricIO.observe(c));

/* ---------- Accordion (one open at a time, animated height) ---------- */
$$('[data-accordion]').forEach((d) => {
  const summary = $('[data-accordion-summary]', d);
  d.dataset.expanded = String(d.open);
  const animate = (open) => {
    const from = d.getBoundingClientRect().height;
    if (open) d.open = true;
    d.dataset.expanded = String(open);
    const to = open ? d.scrollHeight : summary.offsetHeight + 1;
    d.style.overflow = 'hidden';
    const anim = d.animate([{ height: `${from}px` }, { height: `${to}px` }], { duration: 600, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' });
    anim.onfinish = () => { if (!open) d.open = false; d.style.overflow = ''; ScrollTrigger.refresh(); };
  };
  summary.addEventListener('click', (e) => {
    e.preventDefault();
    if (d.open) return animate(false);
    $$('[data-accordion]', d.parentElement).forEach((o) => o !== d && o.open && o.dataset.expanded === 'true' && $('[data-accordion-summary]', o).click());
    animate(true);
  });
});

/* ---------- Reservation form (front-end only for now) ---------- */
const form = $('[data-form]');
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const status = $('[data-form-status]');
  if (!form.checkValidity()) {
    status.textContent = '必須項目（*）と同意チェックをご確認ください。';
    form.reportValidity();
    return;
  }
  // TODO: connect to Formspree / Google Forms etc.
  status.textContent = '送信ありがとうございます。担当より折り返しご連絡いたします。';
  form.reset();
});

$('[data-scroll-top]')?.addEventListener('click', (e) => { e.preventDefault(); lenis.scrollTo(0, { duration: 2 }); });

/* ---------- Fit giant wordmarks to the viewport width ---------- */
function fitWordmarks() {
  $$('[data-fit]').forEach((el) => {
    el.style.fontSize = '100px';
    const inner = el.firstElementChild || el;
    const range = document.createRange();
    range.selectNodeContents(inner);
    const textW = range.getBoundingClientRect().width;
    const avail = el.clientWidth - (mqMobile.matches ? 16 : 40);
    const size = (100 * avail) / textW;
    el.style.fontSize = `${size}px`;
    el.parentElement.style.setProperty('--wm-size', `${size}px`);
  });
}
fitWordmarks();
document.fonts.ready.then(() => { fitWordmarks(); ScrollTrigger.refresh(); });
addEventListener('resize', fitWordmarks);

/* ---------- Boot ---------- */
setHeader($('.hero'));
addEventListener('load', () => ScrollTrigger.refresh());
runPreloader();
