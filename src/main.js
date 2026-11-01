import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { STRINGS, PARTNERS, CONTACT } from './data/i18n.js';
import products from './data/products.json';
import { createGlassFold } from './effects/glass-fold/createGlassFold.js';
import { mountCircularGallery } from './effects/circular-gallery.js';
import { mountLiquidNavbar } from './effects/liquid-navbar.js';

gsap.registerPlugin(ScrollTrigger);

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
if (reduced) document.documentElement.classList.add('reduced');

/** @type {{ setActive: Function, refresh: Function, destroy: Function } | null} */
let liquidNav = null;

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

  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    const value = getByPath(dict, el.dataset.i18nPlaceholder);
    if (typeof value === 'string') el.setAttribute('placeholder', value);
  });

  document.querySelectorAll('[data-i18n-aria]').forEach((el) => {
    const value = getByPath(dict, el.dataset.i18nAria);
    if (typeof value === 'string') el.setAttribute('aria-label', value);
  });

  document.querySelectorAll('.produce-name[data-name-ar]').forEach((el) => {
    el.textContent = locale === 'en' ? el.dataset.nameEn : el.dataset.nameAr;
  });

  document.querySelectorAll('.lang__btn').forEach((btn) => {
    btn.classList.toggle('is-active', btn.dataset.lang === locale);
  });

  // Re-measure liquid blob after AR/EN label width changes
  requestAnimationFrame(() => liquidNav?.refresh?.());

  localStorage.setItem('lang', locale);
  renderProducts();
  galleryApi?.setLabels?.(locale);
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

function produceType(cat, locale = langNow()) {
  const fruit = cat === 'fruit';
  if (locale === 'en') return fruit ? STRINGS.en.products.typeFruit : STRINGS.en.products.typeVeg;
  return fruit ? STRINGS.ar.products.typeFruit : STRINGS.ar.products.typeVeg;
}

/** Catalog grid removed — keep stub so i18n/lang refresh stays safe. */
function renderProducts() {}

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

function toGalleryItem(p) {
  const fruit = p.cat === 'fruit';
  return {
    id: p.slug,
    image: `/img/products/${p.slug}.jpg`,
    titleAr: p.ar,
    titleEn: p.en,
    cat: p.cat,
    typeAr: fruit ? STRINGS.ar.products.typeFruit : STRINGS.ar.products.typeVeg,
    typeEn: fruit ? STRINGS.en.products.typeFruit : STRINGS.en.products.typeVeg,
  };
}

const PRODUCT_GALLERY_ITEMS = products.map(toGalleryItem);
const FILTER_COUNTS = {
  all: products.length,
  veg: products.filter((p) => p.cat === 'veg').length,
  leaf: products.filter((p) => p.cat === 'leaf').length,
  fruit: products.filter((p) => p.cat === 'fruit').length,
};

let galleryApi = null;
let activeGalleryFilter = 'all';

/** Cap dots in the clip gallery so the square frame stays readable. */
const GALLERY_CAP = 12;

function galleryItemsFor(filter = 'all', query = '') {
  const q = query.trim().toLowerCase();
  const list = PRODUCT_GALLERY_ITEMS.filter((item) => {
    if (filter !== 'all' && item.cat !== filter) return false;
    if (!q) return true;
    const type = `${item.typeAr} ${item.typeEn}`;
    return `${item.titleAr} ${item.titleEn} ${item.id} ${type}`.toLowerCase().includes(q);
  });
  return list.slice(0, GALLERY_CAP);
}

function syncFilterCounts() {
  Object.entries(FILTER_COUNTS).forEach(([key, count]) => {
    document.querySelectorAll(`[data-filter-count="${key}"]`).forEach((el) => {
      el.textContent = String(count);
    });
  });
}

function setGalleryFilter(filter, { fromSearch = false } = {}) {
  activeGalleryFilter = filter || 'all';
  document.querySelectorAll('#productFilters .filter-pill').forEach((btn) => {
    const on = btn.dataset.filter === activeGalleryFilter;
    btn.classList.toggle('is-active', on);
    btn.setAttribute('aria-selected', String(on));
  });
  const q = document.querySelector('#productSearch')?.value || '';
  const next = galleryItemsFor(activeGalleryFilter, q);
  galleryApi?.setItems?.(next, { animate: !fromSearch });
}

function initProductsGallery() {
  const root = document.querySelector('#productsGallery');
  if (!root) return;
  syncFilterCounts();
  galleryApi = mountCircularGallery(root, {
    items: galleryItemsFor('all'),
    reduced,
    locale: langNow(),
    hintAr: STRINGS.ar.products.carouselHint,
    hintEn: STRINGS.en.products.carouselHint,
  });

  document.querySelectorAll('#productFilters .filter-pill').forEach((btn) => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter || 'all';
      if (filter === activeGalleryFilter) return;
      setGalleryFilter(filter);
    });
  });
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
  // Orbit slots only — trampoline translates the whole .hero__float circle
  const nodes = [...layer.querySelectorAll('.hero__orbit[data-depth]')];

  const onMove = (e) => {
    const x = (e.clientX / window.innerWidth - 0.5) * 2;
    const y = (e.clientY / window.innerHeight - 0.5) * 2;
    nodes.forEach((n) => {
      const d = Number(n.dataset.depth || 0.2);
      n.style.transform = `translate3d(${x * d * -22}px, ${y * d * -14}px, 0)`;
    });
  };
  window.addEventListener('pointermove', onMove, { passive: true });
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
    // Softer page scroll — lower lerp + reduced wheel/touch multipliers
    duration: 1.65,
    lerp: 0.065,
    wheelMultiplier: 0.62,
    touchMultiplier: 0.7,
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
    .from('.hero__orbit', { y: 40, opacity: 0, duration: 0.9, stagger: 0.08 }, 0.85)
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

  // Journey steps — stagger inside the track (track itself uses data-reveal)
  gsap.from('#journeyTrack .jstep', {
    opacity: 0,
    y: 28,
    stagger: 0.14,
    duration: 0.75,
    ease: 'power3.out',
    scrollTrigger: { trigger: '#journeyTrack', start: 'top 85%', once: true },
  });
  gsap.from('#journeyTrack .jstep__chev', {
    opacity: 0,
    scale: 0.6,
    stagger: 0.14,
    duration: 0.55,
    ease: 'back.out(1.6)',
    scrollTrigger: { trigger: '#journeyTrack', start: 'top 85%', once: true },
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

  // Sticky show-on-scroll-up header
  const nav = document.querySelector('#nav');
  let lastY = 0;
  ScrollTrigger.create({
    start: 0,
    onUpdate: (self) => {
      const y = self.scroll();
      nav?.classList.toggle('is-solid', y > 40);
      const menuOpen = document.querySelector('#navLinks')?.classList.contains('is-open');
      if (!nav || menuOpen || y < 48) {
        nav?.classList.remove('is-hidden');
      } else if (y > lastY + 6) {
        nav.classList.add('is-hidden');
      } else if (y < lastY - 6) {
        nav.classList.remove('is-hidden');
      }
      lastY = y;
    },
  });

  // Liquid glass navbar — scroll sync + tomato morph on click
  liquidNav = mountLiquidNavbar(document.querySelector('#navLinks'), {
    reduced,
    getLocale: langNow,
    onNavigate: (href) => {
      const target = document.querySelector(href);
      if (!target) return;
      document.querySelector('#navLinks')?.classList.remove('is-open');
      document.querySelector('#burger')?.setAttribute('aria-expanded', 'false');
      if (lenis) lenis.scrollTo(target, { offset: -70, duration: 1.75 });
      else target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
    },
  });

  // Smooth anchor clicks (non-liquid links: brand, CTAs, footer)
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      if (a.hasAttribute('data-liquid-link')) return;
      const id = a.getAttribute('href');
      const target = id && document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      document.querySelector('#navLinks')?.classList.remove('is-open');
      document.querySelector('#burger')?.setAttribute('aria-expanded', 'false');
      if (lenis) lenis.scrollTo(target, { offset: -70, duration: 1.75 });
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
    if (open) requestAnimationFrame(() => liquidNav?.refresh?.());
  });

  document.querySelector('#productSearch')?.addEventListener('input', (e) => {
    const q = e.target.value;
    galleryApi?.setItems?.(galleryItemsFor(activeGalleryFilter, q), { animate: false });
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
initProductsGallery();
initMotion(lenis);
