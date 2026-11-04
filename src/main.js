import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { STRINGS, PARTNERS, CONTACT } from './data/i18n.js';
import { createGlassFold } from './effects/glass-fold/createGlassFold.js';
import { mountLiquidNavbar } from './effects/liquid-navbar.js';
import { mountProduceSlider } from './effects/produce-slider/mount.js';
import { mountChromaKeyVideo } from './effects/chroma-key-video.js';
import './effects/produce-slider/styles.css';

gsap.registerPlugin(ScrollTrigger);

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
if (reduced) document.documentElement.classList.add('reduced');

/** @type {{ setActive: Function, refresh: Function, destroy: Function } | null} */
let liquidNav = null;
/** @type {{ pause: Function, resume: Function, setScrolling: Function, destroy: Function } | null} */
let glassFoldApi = null;
/** @type {{ pause: Function, resume: Function, destroy: Function } | null} */
let heroProduceApi = null;
/** @type {{ setLocale: Function, destroy: Function } | null} */
let produceSliderApi = null;

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
  produceSliderApi?.setLocale?.(locale);
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

function langNow() {
  return document.documentElement.lang === 'en' ? 'en' : 'ar';
}

function renderProducts() {}

function initGlassFold() {
  const canvas = document.querySelector('#glassFold');
  if (!canvas) return null;
  try {
    return createGlassFold(canvas, {
      color1: '#1F6B45',
      color2: '#08291D',
      color3: '#B5D95B',
      speed: 0.34,
      scale: 1.06,
      noise: 0.1,
      dprMax: matchMedia('(pointer: coarse)').matches ? 1 : 1.25,
      fpsIdle: 26,
      fpsScroll: 10,
    });
  } catch (err) {
    console.warn('GlassFold failed', err);
    canvas.classList.add('is-fallback');
    return null;
  }
}

function initProductsGallery() {
  const root = document.querySelector('#produceSlider');
  if (!root) return;
  produceSliderApi?.destroy?.();
  produceSliderApi = mountProduceSlider(root, {
    reduced,
    locale: langNow(),
  });
}

function initLogoVideo() {
  // Site-wide translucent logo-video watermark stays off (CPU/GPU win).
  const video = document.querySelector('#logoVideo');
  if (!video) return;
  try {
    video.pause();
    video.removeAttribute('src');
    video.querySelectorAll('source').forEach((s) => s.remove());
    video.load();
  } catch {
    /* ignore */
  }
}

/**
 * Floating hero media: gemini_generated_video_3aac0fe1.mp4
 * Black-plate luma key → soft-edged carrot+metal over GlassFold.
 * Falls back to mix-blend screen if WebGL key unavailable.
 */
function initHeroProduce() {
  const canvas = document.querySelector('#heroProduceKey');
  const videoEl = document.querySelector('#heroProduceVideo');
  const host = document.querySelector('.hero__brand-float');
  if (!host || !videoEl) return null;

  const poster = '/media/hero-poster.jpg';
  const src = '/media/gemini_generated_video_3aac0fe1.mp4';
  videoEl.muted = true;
  videoEl.defaultMuted = true;
  videoEl.playsInline = true;
  videoEl.loop = true;
  videoEl.preload = reduced ? 'none' : 'auto';
  videoEl.setAttribute('muted', '');
  videoEl.setAttribute('playsinline', '');
  videoEl.setAttribute('poster', poster);
  videoEl.crossOrigin = 'anonymous';

  const source = videoEl.querySelector('source');
  if (source) source.setAttribute('src', src);
  else videoEl.src = src;
  try {
    videoEl.load();
  } catch {
    /* ignore */
  }

  /** @type {ReturnType<typeof mountChromaKeyVideo> | null} */
  let keyed = null;

  if (canvas && !reduced) {
    canvas.hidden = false;
    const mounted = mountChromaKeyVideo(canvas, {
      src,
      video: videoEl,
      poster,
      key: 'black',
      similarity: 0.04,
      softness: 0.2,
      dprMax: 1.5,
      reduced,
    });
    if (mounted.hasGl) {
      keyed = mounted;
      host.classList.add('is-keyed');
      host.classList.remove('is-video-fallback');
    } else {
      mounted.destroy();
      keyed = null;
    }
  }

  if (!keyed) {
    if (canvas) canvas.hidden = true;
    host.classList.add('is-video-fallback');
    host.classList.remove('is-keyed');
  }

  const play = () => {
    if (reduced) return;
    if (keyed) keyed.resume();
    else videoEl.play().catch(() => {});
  };
  const pause = () => {
    if (keyed) keyed.pause();
    else videoEl.pause();
  };

  const io = new IntersectionObserver(
    ([entry]) => {
      if (entry?.isIntersecting) play();
      else pause();
    },
    { threshold: 0.15, rootMargin: '8% 0px' },
  );
  io.observe(host);

  const onVis = () => {
    if (document.hidden) pause();
    else if (host.getBoundingClientRect().bottom > 0) play();
  };
  document.addEventListener('visibilitychange', onVis);
  if (keyed) keyed.start();
  else play();

  return {
    pause,
    resume: play,
    destroy() {
      io.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      keyed?.destroy();
      pause();
    },
  };
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
    // Lighter smooth scroll — less work per frame under WebGL load
    duration: 1.2,
    lerp: 0.1,
    wheelMultiplier: 0.72,
    touchMultiplier: 0.8,
    easing: (t) => Math.min(1, 1.001 - 2 ** (-10 * t)),
  });

  let stRaf = 0;
  let scrollIdleTimer = 0;
  lenis.on('scroll', () => {
    glassFoldApi?.setScrolling?.(true);
    if (scrollIdleTimer) window.clearTimeout(scrollIdleTimer);
    scrollIdleTimer = window.setTimeout(() => {
      glassFoldApi?.setScrolling?.(false);
    }, 140);
    if (stRaf) return;
    stRaf = requestAnimationFrame(() => {
      stRaf = 0;
      ScrollTrigger.update();
    });
  });

  gsap.ticker.add((time) => lenis.raf(time * 1000));
  // Keep mild lag smoothing so spikes don't cascade jank
  gsap.ticker.lagSmoothing(500, 33);
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
    .from('.hero__brand-float', { opacity: 0, scale: 0.86, y: 28, duration: 1.05 }, 0.35)
    .from('.hero__badge', { y: 24, opacity: 0, duration: 0.6 }, 0.55)
    .from(
      '.hero__title .split-w > span',
      { yPercent: 110, duration: 0.9, stagger: 0.045 },
      0.65,
    )
    .from('.hero__sub, .hero__lead', { y: 24, opacity: 0, duration: 0.7, stagger: 0.1 }, 0.95)
    .from('.hero__ctas .btn', { y: 20, opacity: 0, duration: 0.55, stagger: 0.08 }, 1.15)
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

  // Sticky show-on-scroll-up — lockY hysteresis (Lenis per-frame dy is tiny)
  const nav = document.querySelector('#nav');
  let lockY = 0;
  let navHidden = false;
  let navRaf = 0;
  let pendingY = 0;

  const applyNavState = (y) => {
    if (!nav) return;
    const menuOpen = document.querySelector('#navLinks')?.classList.contains('is-open');
    const keep = menuOpen || nav.contains(document.activeElement);
    nav.classList.toggle('is-solid', y > 40);

    let nextHidden = navHidden;
    if (keep || y < 72) {
      nextHidden = false;
      lockY = y;
    } else if (!navHidden) {
      if (y - lockY > 24) {
        nextHidden = true;
        lockY = y;
      } else if (y < lockY) {
        lockY = y;
      }
    } else if (lockY - y > 18) {
      nextHidden = false;
      lockY = y;
    } else if (y > lockY) {
      lockY = y;
    }

    if (nextHidden !== navHidden) {
      navHidden = nextHidden;
      nav.classList.toggle('is-hidden', navHidden);
    }
  };

  const onNavScroll = () => {
    pendingY =
      typeof lenis?.scroll === 'number'
        ? lenis.scroll
        : window.scrollY || document.documentElement.scrollTop || 0;
    if (navRaf) return;
    navRaf = requestAnimationFrame(() => {
      navRaf = 0;
      applyNavState(pendingY);
    });
  };

  if (lenis) {
    lenis.on('scroll', onNavScroll);
  }
  // Fallback for non-Lenis / programmatic scroll
  window.addEventListener('scroll', onNavScroll, { passive: true });
  nav?.addEventListener('focusin', () => {
    navHidden = false;
    lockY = pendingY;
    nav?.classList.remove('is-hidden');
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
glassFoldApi = initGlassFold();
initLogoVideo();
heroProduceApi = initHeroProduce();
initAboutMedia();
initTilt();
const lenis = initSmoothScroll();
initProductsGallery();
initMotion(lenis);
