import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { STRINGS, PARTNERS, CONTACT } from './data/i18n.js';
import products from './data/products.json';
import { createGlassFold } from './effects/glass-fold/createGlassFold.js';

gsap.registerPlugin(ScrollTrigger);

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
if (reduced) document.documentElement.classList.add('reduced');

const saved = localStorage.getItem('lang');
const lang = saved === 'en' || saved === 'ar' ? saved : 'ar';

function getByPath(obj, path) {
  return path.split('.').reduce((acc, key) => {
    if (acc == null) return acc;
    const asIndex = Number(key);
    if (Array.isArray(acc) && !Number.isNaN(asIndex)) return acc[asIndex];
    return acc[key];
  }, obj);
}

function applyI18n(locale) {
  const dict = STRINGS[locale];
  document.documentElement.lang = locale;
  document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
  document.title =
    locale === 'ar'
      ? 'العناد الوطنية | توريد الخضار والفواكه'
      : 'Al-Anad National | Fresh produce supply';

  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const value = getByPath(dict, el.dataset.i18n);
    if (typeof value === 'string') el.textContent = value;
  });

  document.querySelectorAll('.lang__btn').forEach((btn) => {
    btn.classList.toggle('is-active', btn.dataset.lang === locale);
  });

  localStorage.setItem('lang', locale);
  renderProducts();
}

function splitHeadings() {
  document.querySelectorAll('[data-split]').forEach((el) => {
    if (el.dataset.splitDone === '1' && el.dataset.splitText === el.textContent.trim()) return;
    const text = el.textContent.trim();
    el.dataset.splitText = text;
    el.dataset.splitDone = '1';
    el.innerHTML = text
      .split(/\s+/)
      .map((w) => `<span class="split-w"><span>${w}</span></span>`)
      .join(' ');
  });
}

function renderPartners() {
  const track = document.querySelector('#marquee');
  if (!track) return;
  const cards = PARTNERS.map(
    (p) =>
      `<div class="logo-card"><img src="/img/partners/${p.id}.png" alt="${p.name}" loading="lazy" width="120" height="52" /></div>`,
  ).join('');
  track.innerHTML = cards + cards;
}

function productLabel(item) {
  return langNow() === 'ar' ? item.ar : item.en;
}

function langNow() {
  return document.documentElement.lang === 'en' ? 'en' : 'ar';
}

function renderProducts(filter = '') {
  const grid = document.querySelector('#productGrid');
  if (!grid) return;
  const q = filter.trim().toLowerCase();
  const list = products.filter((p) => {
    if (!q) return true;
    return `${p.ar} ${p.en} ${p.slug}`.toLowerCase().includes(q);
  });
  grid.innerHTML = list
    .map(
      (p) => `<figure class="pcard" data-cat="${p.cat}">
        <img src="/img/products/${p.slug}.jpg" alt="${p.en}" width="160" height="160" loading="lazy" decoding="async" />
        <figcaption>${productLabel(p)}</figcaption>
      </figure>`,
    )
    .join('');
}

function initGlassFold() {
  const canvas = document.querySelector('#glassFold');
  if (!canvas) return null;
  try {
    return createGlassFold(canvas, {
      color1: '#1F6B45',
      color2: '#08291D',
      color3: '#B5D95B',
      speed: 0.42,
      scale: 1.08,
      noise: 0.11,
    });
  } catch (err) {
    console.warn('GlassFold failed', err);
    canvas.classList.add('is-fallback');
    return null;
  }
}

function initLogoVideo() {
  const video = document.querySelector('#logoVideo');
  const wrap = document.querySelector('.site-bg__video-wrap');
  if (!video) return;

  const canAutoplay =
    !reduced && window.matchMedia('(min-width: 768px)').matches && !matchMedia('(pointer: coarse)').matches;

  const markReady = () => {
    video.classList.add('is-ready');
    wrap?.classList.add('is-playing');
  };

  const tryPlay = () => {
    if (!canAutoplay) return;
    video.muted = true;
    const p = video.play();
    if (p && typeof p.then === 'function') {
      p.then(markReady).catch(() => {
        /* poster stays */
      });
    }
  };

  if (canAutoplay) {
    video.preload = 'auto';
    tryPlay();
  } else {
    video.preload = 'metadata';
    wrap?.classList.add('is-still');
  }

  video.addEventListener('loadeddata', () => {
    if (!video.paused) markReady();
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && !video.paused) video.pause();
    else if (!document.hidden && canAutoplay && video.paused) tryPlay();
  });
}

function initAboutMedia() {
  const shots = [...document.querySelectorAll('[data-about-shot]')];
  let i = 0;
  if (shots.length > 1 && !reduced) {
    setInterval(() => {
      shots[i].classList.remove('is-on');
      i = (i + 1) % shots.length;
      shots[i].classList.add('is-on');
    }, 4200);
  }

  const playBtn = document.querySelector('#aboutPlay');
  const aboutVideo = document.querySelector('#aboutVideo');
  if (!playBtn || !aboutVideo) return;

  playBtn.addEventListener('click', () => {
    aboutVideo.hidden = false;
    aboutVideo.classList.add('is-playing');
    aboutVideo.controls = true;
    aboutVideo.play().catch(() => {});
    playBtn.style.display = 'none';
  });
}

function initParallax() {
  if (reduced) return;
  const layer = document.querySelector('.hero__produce');
  if (!layer) return;
  const nodes = [...layer.querySelectorAll('[data-depth]')];

  const onMove = (e) => {
    const x = (e.clientX / window.innerWidth - 0.5) * 2;
    const y = (e.clientY / window.innerHeight - 0.5) * 2;
    nodes.forEach((n) => {
      const d = Number(n.dataset.depth || 0.2);
      n.style.transform = `translate3d(${x * d * -28}px, ${y * d * -20}px, 0) rotate(${n.classList.contains('hero__crate') ? -6 : 0}deg)`;
    });
  };
  window.addEventListener('pointermove', onMove, { passive: true });

  gsap.to('.hero__float', {
    y: -16,
    duration: 2.8,
    yoyo: true,
    repeat: -1,
    ease: 'sine.inOut',
    stagger: 0.35,
  });
}

function initTilt() {
  if (reduced) return;
  document.querySelectorAll('[data-tilt]').forEach((card) => {
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = `perspective(800px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg)`;
    });
    card.addEventListener('pointerleave', () => {
      card.style.transform = '';
    });
  });
}

function initSmoothScroll() {
  if (reduced) return null;
  const lenis = new Lenis({
    duration: 1.15,
    easing: (t) => Math.min(1, 1.001 - 2 ** (-10 * t)),
  });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  return lenis;
}

function initMotion(lenis) {
  const preloader = document.querySelector('#preloader');
  const hidePreloader = () => preloader?.classList.add('is-done');

  if (reduced) {
    hidePreloader();
    document.querySelectorAll('[data-reveal]').forEach((el) => {
      el.style.opacity = '1';
      el.style.transform = 'none';
    });
    return;
  }

  splitHeadings();

  const tl = gsap.timeline({
    defaults: { ease: 'power3.out' },
    onComplete: hidePreloader,
  });

  tl.to('.preloader__bar i', { width: '100%', duration: 0.7, ease: 'power2.inOut' }, 0)
    .to('.preloader', { opacity: 0, duration: 0.5, pointerEvents: 'none' }, '+=0.15')
    .set('.preloader', { visibility: 'hidden' })
    .from('.site-bg__video-wrap', { opacity: 0, scale: 1.08, duration: 1.4 }, 0.15)
    .from('.hero__badge', { y: 24, opacity: 0, duration: 0.6 }, 0.55)
    .from(
      '.hero__title .split-w > span',
      { yPercent: 110, duration: 0.9, stagger: 0.045 },
      0.65,
    )
    .from('.hero__sub, .hero__lead', { y: 24, opacity: 0, duration: 0.7, stagger: 0.1 }, 0.95)
    .from('.hero__ctas .btn', { y: 20, opacity: 0, duration: 0.55, stagger: 0.08 }, 1.15)
    .from('.hero__crate, .hero__float', { y: 40, opacity: 0, duration: 0.9, stagger: 0.08 }, 0.85)
    .from('.hero__stats', { y: 40, opacity: 0, duration: 0.8 }, 1.25);

  document.querySelectorAll('[data-reveal]').forEach((el) => {
    gsap.to(el, {
      opacity: 1,
      y: 0,
      duration: 0.9,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: el,
        start: 'top 88%',
        once: true,
      },
    });
  });

  document.querySelectorAll('.h2[data-split]').forEach((el) => {
    const words = el.querySelectorAll('.split-w > span');
    if (!words.length) return;
    gsap.from(words, {
      yPercent: 110,
      duration: 0.85,
      stagger: 0.04,
      ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 85%', once: true },
    });
  });

  // Journey progress feel
  gsap.from('.jstep', {
    opacity: 0,
    y: 36,
    stagger: 0.12,
    duration: 0.8,
    ease: 'power3.out',
    scrollTrigger: { trigger: '#journeyTrack', start: 'top 80%', once: true },
  });

  // Stats count-up
  document.querySelectorAll('[data-count]').forEach((el) => {
    const target = Number(el.dataset.count);
    const suffix = el.dataset.suffix || '';
    const obj = { val: 0 };
    ScrollTrigger.create({
      trigger: el,
      start: 'top 95%',
      once: true,
      onEnter: () => {
        gsap.to(obj, {
          val: target,
          duration: 1.6,
          ease: 'power2.out',
          onUpdate: () => {
            el.textContent = `${Math.round(obj.val)}${suffix}`;
          },
        });
      },
    });
  });

  // Nav solid on scroll
  const nav = document.querySelector('#nav');
  ScrollTrigger.create({
    start: 40,
    onUpdate: (self) => nav?.classList.toggle('is-solid', self.scroll() > 40),
  });

  // Active nav link
  const links = [...document.querySelectorAll('.nav__links a')];
  links.forEach((link) => {
    const id = link.getAttribute('href');
    if (!id || !id.startsWith('#')) return;
    const section = document.querySelector(id);
    if (!section) return;
    ScrollTrigger.create({
      trigger: section,
      start: 'top 45%',
      end: 'bottom 45%',
      onToggle: (self) => {
        if (self.isActive) {
          links.forEach((l) => l.classList.remove('is-active'));
          link.classList.add('is-active');
        }
      },
    });
  });

  // Smooth anchor clicks
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      const target = id && document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      document.querySelector('#navLinks')?.classList.remove('is-open');
      document.querySelector('#burger')?.setAttribute('aria-expanded', 'false');
      if (lenis) lenis.scrollTo(target, { offset: -70, duration: 1.35 });
      else target.scrollIntoView({ behavior: 'smooth' });
    });
  });
}

function initUI() {
  document.querySelector('#yr').textContent = String(new Date().getFullYear());

  document.querySelectorAll('.lang__btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const next = btn.dataset.lang;
      if (!next || next === langNow()) return;
      applyI18n(next);
      splitHeadings();
      ScrollTrigger.refresh();
    });
  });

  const burger = document.querySelector('#burger');
  const navLinks = document.querySelector('#navLinks');
  burger?.addEventListener('click', () => {
    const open = navLinks.classList.toggle('is-open');
    burger.setAttribute('aria-expanded', String(open));
  });

  const catalog = document.querySelector('#catalog');
  document.querySelector('#toggleCatalog')?.addEventListener('click', () => {
    const hidden = catalog.hasAttribute('hidden');
    if (hidden) catalog.removeAttribute('hidden');
    else catalog.setAttribute('hidden', '');
    if (hidden) catalog.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
  });

  document.querySelectorAll('.cat').forEach((cat) => {
    cat.addEventListener('click', (e) => {
      e.preventDefault();
      catalog?.removeAttribute('hidden');
      const key = cat.dataset.cat;
      const map = { leafy: 'leaf', fruits: 'fruit', vegetables: 'veg', staple: 'veg', seasonal: '' };
      const want = map[key] ?? '';
      document.querySelector('#productSearch').value = '';
      renderProducts();
      if (want) {
        [...document.querySelectorAll('#productGrid .pcard')].forEach((card) => {
          card.hidden = want ? card.dataset.cat !== want : false;
        });
      }
      catalog?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
    });
  });

  document.querySelector('#productSearch')?.addEventListener('input', (e) => {
    renderProducts(e.target.value);
  });

  document.querySelector('#contactForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const body = [
      data.get('name'),
      data.get('company'),
      data.get('phone'),
      data.get('email'),
      data.get('message'),
    ]
      .filter(Boolean)
      .join('\n');
    const subject = encodeURIComponent('Al-Anad National inquiry');
    window.location.href = `mailto:${CONTACT.email}?subject=${subject}&body=${encodeURIComponent(body)}`;
  });
}

applyI18n(lang);
renderPartners();
renderProducts();
initUI();
initGlassFold();
initLogoVideo();
initAboutMedia();
initParallax();
initTilt();
const lenis = initSmoothScroll();
initMotion(lenis);
