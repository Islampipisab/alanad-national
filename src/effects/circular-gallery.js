/**
 * Vanilla port of carousel-circular-image-gallery / Circle Swap Photo Gallery.
 * Square frame · GSAP MotionPath clip (dots → expand full image) · prev/next + horizontal drag.
 * No React/shadcn. Vertical page scroll is not trapped.
 */
import gsap from 'gsap';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';

gsap.registerPlugin(MotionPathPlugin);

const VIEW = 400;
const DOT_R = 7;
const DOT_GAP = 12;
const EXPAND = 700;

/**
 * @param {HTMLElement} root
 * @param {{
 *   items: Array<{ image: string, titleAr: string, titleEn: string, typeAr?: string, typeEn?: string, cat?: string, id?: string }>,
 *   reduced?: boolean,
 *   locale?: 'ar'|'en',
 *   hintAr?: string,
 *   hintEn?: string,
 *   onSelect?: (index: number, item: object) => void,
 * }} opts
 */
export function mountCircularGallery(root, opts = {}) {
  let items = [...(opts.items || [])];
  const reduced = !!opts.reduced;
  const onSelect = opts.onSelect;
  let locale = opts.locale === 'en' ? 'en' : 'ar';
  if (!root) return { destroy() {}, setLabels() {}, goTo() {}, setItems() {} };

  let index = 0;
  let busy = false;
  let layerEls = [];
  let clipEls = [];
  let tabEls = [];
  let uid = Math.random().toString(36).slice(2, 8);

  root.classList.add('ccig');
  root.classList.toggle('ccig--reduced', reduced);
  root.innerHTML = `
    <div class="ccig__shell" data-ccig-shell>
      <p class="ccig__hint" data-ccig-hint></p>
      <button type="button" class="ccig__nav ccig__nav--prev" data-ccig-prev aria-label="Previous">‹</button>
      <div class="ccig__frame" data-ccig-frame tabindex="0" role="region" aria-roledescription="carousel">
        <div class="ccig__stack" data-ccig-stack></div>
        <svg class="ccig__tabs" data-ccig-tabs viewBox="0 0 ${VIEW} ${VIEW}" aria-hidden="true"></svg>
        <div class="ccig__caption produce-label">
          <span class="produce-type" data-ccig-type></span>
          <h3 class="ccig__title produce-name" data-ccig-title></h3>
        </div>
      </div>
      <button type="button" class="ccig__nav ccig__nav--next" data-ccig-next aria-label="Next">›</button>
    </div>
  `;

  const shell = root.querySelector('[data-ccig-shell]');
  const frame = root.querySelector('[data-ccig-frame]');
  const stack = root.querySelector('[data-ccig-stack]');
  const tabsSvg = root.querySelector('[data-ccig-tabs]');
  const hint = root.querySelector('[data-ccig-hint]');
  const typeEl = root.querySelector('[data-ccig-type]');
  const titleEl = root.querySelector('[data-ccig-title]');
  const prevBtn = root.querySelector('[data-ccig-prev]');
  const nextBtn = root.querySelector('[data-ccig-next]');

  const titleOf = (item) => (locale === 'en' ? item.titleEn : item.titleAr);
  const typeOf = (item) => {
    if (!item) return '';
    if (locale === 'en') return item.typeEn || (item.cat === 'fruit' ? 'Fruit' : 'Vegetable');
    return item.typeAr || (item.cat === 'fruit' ? 'فاكهة' : 'خضار');
  };

  const updateHint = () => {
    if (!hint) return;
    hint.textContent =
      locale === 'en'
        ? opts.hintEn || 'Swipe or drag sideways · use arrows'
        : opts.hintAr || 'اسحب أفقياً أو استخدم الأسهم';
  };

  function dotX(i, total) {
    const span = total * (DOT_R * 2 + DOT_GAP) - DOT_GAP;
    return VIEW / 2 - span / 2 + i * (DOT_R * 2 + DOT_GAP) + DOT_R;
  }
  const dotY = () => VIEW - 28;
  const posSmall = (i, total) => ({ x: dotX(i, total), y: dotY(), scale: 1 });
  const posCenter = () => ({ x: VIEW / 2, y: VIEW / 2, scale: 7 });
  const posEnd = () => ({ x: VIEW / 2 - DOT_R * EXPAND, y: VIEW / 2, scale: EXPAND });
  const posStart = () => ({ x: VIEW / 2 + DOT_R * EXPAND, y: VIEW / 2, scale: EXPAND });
  const posAbove = (i, total) => ({ x: dotX(i, total), y: VIEW / 2, scale: 1 });

  function syncCaption() {
    const item = items[index];
    if (!item) {
      if (typeEl) typeEl.textContent = '';
      titleEl.textContent = '';
      return;
    }
    if (typeEl) typeEl.textContent = typeOf(item);
    titleEl.textContent = titleOf(item);
  }

  function setLayerState(i, inPlace) {
    const layer = layerEls[i];
    if (!layer) return;
    const img = layer.querySelector('image, img');
    const g = layer.querySelector('[data-ccig-clipped]');
    if (inPlace) {
      g?.setAttribute('clip-path', `url(#${uid}_${i}_sq)`);
      layer.style.zIndex = String(i + 1);
    } else {
      g?.setAttribute('clip-path', `url(#${uid}_${i}_circ)`);
      layer.style.zIndex = String(items.length + 2);
    }
    if (img) img.setAttribute('href', items[i].image);
  }

  function build() {
    gsap.killTweensOf(clipEls);
    stack.innerHTML = '';
    tabsSvg.innerHTML = '';
    layerEls = [];
    clipEls = [];
    tabEls = [];
    const total = items.length;
    if (!total) {
      syncCaption();
      return;
    }

    items.forEach((item, i) => {
      const layer = document.createElement('div');
      layer.className = 'ccig__layer';
      layer.dataset.index = String(i);
      layer.innerHTML = `
        <svg viewBox="0 0 ${VIEW} ${VIEW}" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <defs>
            <clipPath id="${uid}_${i}_circ"><circle data-ccig-clip cx="0" cy="0" r="${DOT_R}"></circle></clipPath>
            <clipPath id="${uid}_${i}_sq"><rect width="${VIEW}" height="${VIEW}"></rect></clipPath>
          </defs>
          <g data-ccig-clipped clip-path="url(#${uid}_${i}_circ)">
            <image href="${item.image}" xlink:href="${item.image}" width="${VIEW}" height="${VIEW}" preserveAspectRatio="xMidYMid slice"></image>
          </g>
        </svg>
      `;
      stack.appendChild(layer);
      layerEls.push(layer);
      clipEls.push(layer.querySelector('[data-ccig-clip]'));

      const tab = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      tab.setAttribute('class', 'ccig__dot');
      tab.setAttribute('cx', String(dotX(i, total)));
      tab.setAttribute('cy', String(dotY()));
      tab.setAttribute('r', String(DOT_R + 2));
      tab.dataset.index = String(i);
      tab.addEventListener('click', () => goTo(i, true));
      tabsSvg.appendChild(tab);
      tabEls.push(tab);
    });

    // Initial place: active expanded, others as dots
    clipEls.forEach((clip, i) => {
      const open = i === index;
      const p = open ? posEnd() : posSmall(i, total);
      gsap.set(clip, { ...p, transformOrigin: 'center center' });
      setLayerState(i, open);
      tabEls[i]?.classList.toggle('is-active', open);
    });
    syncCaption();
  }

  function animateOpen(i) {
    const clip = clipEls[i];
    const total = items.length;
    if (!clip) return Promise.resolve();
    if (reduced) {
      gsap.set(clip, { ...posEnd(), transformOrigin: 'center center' });
      setLayerState(i, true);
      return Promise.resolve();
    }
    setLayerState(i, false);
    return new Promise((resolve) => {
      gsap
        .timeline({
          defaults: { transformOrigin: 'center center' },
          onComplete: () => {
            setLayerState(i, true);
            resolve();
          },
        })
        .set(clip, { ...posSmall(i, total) })
        .to(clip, { ...posCenter(), duration: 0.55, ease: 'power3.inOut' })
        .to(clip, { ...posEnd(), duration: 0.7, ease: 'power4.in' });
    });
  }

  function animateClose(i) {
    const clip = clipEls[i];
    const total = items.length;
    if (!clip) return Promise.resolve();
    if (reduced) {
      gsap.set(clip, { ...posSmall(i, total), transformOrigin: 'center center' });
      setLayerState(i, false);
      return Promise.resolve();
    }
    setLayerState(i, false);
    return new Promise((resolve) => {
      gsap
        .timeline({
          defaults: { transformOrigin: 'center center' },
          overwrite: true,
          onComplete: resolve,
        })
        .set(clip, { ...posStart() })
        .to(clip, { ...posCenter(), duration: 0.65, ease: 'power4.out' })
        .to(clip, {
          motionPath: [posAbove(i, total), posSmall(i, total)],
          duration: 0.85,
          ease: 'bounce.out',
        });
    });
  }

  async function goTo(nextIndex, animate = true) {
    if (!items.length || busy) return;
    const total = items.length;
    nextIndex = ((nextIndex % total) + total) % total;
    if (nextIndex === index && animate) return;

    const prev = index;
    index = nextIndex;
    tabEls.forEach((t, i) => t.classList.toggle('is-active', i === index));
    syncCaption();

    if (!animate || reduced) {
      clipEls.forEach((clip, i) => {
        gsap.set(clip, {
          ...(i === index ? posEnd() : posSmall(i, total)),
          transformOrigin: 'center center',
        });
        setLayerState(i, i === index);
      });
      onSelect?.(index, items[index]);
      return;
    }

    busy = true;
    root.classList.add('is-busy');
    try {
      await Promise.all([animateClose(prev), animateOpen(index)]);
      onSelect?.(index, items[index]);
    } finally {
      busy = false;
      root.classList.remove('is-busy');
    }
  }

  function stepBy(dir) {
    const rtl = document.documentElement.dir === 'rtl';
    goTo(index + (rtl ? -dir : dir), true);
  }

  function setItems(nextItems, { animate = true } = {}) {
    const prevId = items[index]?.id;
    items = [...(nextItems || [])];
    uid = Math.random().toString(36).slice(2, 8);
    const keep = prevId != null ? items.findIndex((it) => it.id === prevId) : 0;
    index = keep >= 0 ? keep : 0;
    build();
    if (animate && !reduced && items.length) {
      gsap.fromTo(
        tabEls,
        { scale: 0.4, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.35, stagger: 0.03, ease: 'power2.out' },
      );
    }
  }

  updateHint();
  build();

  prevBtn?.addEventListener('click', () => stepBy(-1));
  nextBtn?.addEventListener('click', () => stepBy(1));

  // Horizontal drag on frame — vertical scroll passes through
  let dragging = false;
  let axis = null;
  let startX = 0;
  let startY = 0;
  let moved = false;
  const AXIS = 8;

  const onPointerDown = (e) => {
    if (e.button != null && e.button !== 0 || busy) return;
    if (e.target.closest?.('.ccig__dot')) return;
    dragging = true;
    axis = null;
    moved = false;
    startX = e.clientX;
    startY = e.clientY;
    frame.classList.add('is-dragging');
    try {
      frame.setPointerCapture?.(e.pointerId);
    } catch {
      /* ignore */
    }
  };

  const onPointerMove = (e) => {
    if (!dragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    if (!axis) {
      if (Math.abs(dx) < AXIS && Math.abs(dy) < AXIS) return;
      axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      if (axis === 'y') {
        dragging = false;
        frame.classList.remove('is-dragging');
        try {
          frame.releasePointerCapture?.(e.pointerId);
        } catch {
          /* ignore */
        }
        return;
      }
    }
    if (axis === 'x') {
      e.preventDefault();
      moved = true;
    }
  };

  const onPointerUp = (e) => {
    if (!dragging && axis !== 'x') {
      frame.classList.remove('is-dragging');
      return;
    }
    dragging = false;
    frame.classList.remove('is-dragging');
    try {
      frame.releasePointerCapture?.(e.pointerId);
    } catch {
      /* ignore */
    }
    if (axis === 'x' && moved) {
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 36) stepBy(dx < 0 ? 1 : -1);
    }
    axis = null;
  };

  frame.addEventListener('pointerdown', onPointerDown);
  frame.addEventListener('pointermove', onPointerMove);
  frame.addEventListener('pointerup', onPointerUp);
  frame.addEventListener('pointercancel', onPointerUp);

  let wheelAcc = 0;
  const onWheel = (e) => {
    if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
    e.preventDefault();
    wheelAcc += e.deltaX;
    if (Math.abs(wheelAcc) < 70) return;
    const dir = wheelAcc > 0 ? 1 : -1;
    wheelAcc = 0;
    const rtl = document.documentElement.dir === 'rtl';
    stepBy(rtl ? -dir : dir);
  };
  frame.addEventListener('wheel', onWheel, { passive: false });

  const onKey = (e) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      stepBy(document.documentElement.dir === 'rtl' ? 1 : -1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      stepBy(document.documentElement.dir === 'rtl' ? -1 : 1);
    }
  };
  frame.addEventListener('keydown', onKey);

  return {
    goTo,
    setItems,
    setLabels(nextLocale) {
      locale = nextLocale === 'en' ? 'en' : 'ar';
      updateHint();
      syncCaption();
    },
    destroy() {
      frame.removeEventListener('pointerdown', onPointerDown);
      frame.removeEventListener('pointermove', onPointerMove);
      frame.removeEventListener('pointerup', onPointerUp);
      frame.removeEventListener('pointercancel', onPointerUp);
      frame.removeEventListener('wheel', onWheel);
      frame.removeEventListener('keydown', onKey);
      gsap.killTweensOf(clipEls);
      root.innerHTML = '';
    },
  };
}

export default mountCircularGallery;
