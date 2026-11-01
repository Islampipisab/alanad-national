/**
 * Vanilla port of the Framer Motion 3D cylinder photo carousel
 * (rotateY + translateZ faces, drag-to-spin, click lightbox).
 * Uses GSAP for springy settle — no React.
 */
import gsap from 'gsap';

const CONFIG = {
  cylinderWidth: { mobile: 1600, desktop: 2400 },
  dragSensitivity: 0.35,
  wheelSensitivity: 0.55,
  perspective: 900,
  spring: { duration: 0.75, ease: 'power3.out' },
};

/**
 * @param {HTMLElement} root
 * @param {{
 *   items: Array<{ image: string, titleAr: string, titleEn: string, id?: string }>,
 *   reduced?: boolean,
 *   locale?: 'ar' | 'en',
 *   onSelect?: (index: number) => void,
 *   lenis?: { stop: Function, start: Function } | null,
 * }} opts
 */
export function mountCylinderCarousel(root, opts = {}) {
  const { items = [], reduced = false, onSelect, lenis = null } = opts;
  let locale = opts.locale === 'en' ? 'en' : 'ar';
  if (!root || !items.length) return { destroy() {}, setLabels() {} };

  root.classList.add('cyl');
  root.innerHTML = `
    <div class="cyl__stage" data-cyl-stage tabindex="0" role="region" aria-roledescription="carousel">
      <p class="cyl__hint" data-cyl-hint></p>
      <div class="cyl__viewport" data-cyl-viewport>
        <div class="cyl__ring" data-cyl-ring></div>
      </div>
    </div>
    <div class="cyl__lightbox" data-cyl-lightbox hidden>
      <button type="button" class="cyl__lightbox-close" data-cyl-close aria-label="Close">×</button>
      <figure class="cyl__lightbox-figure">
        <img data-cyl-lightbox-img alt="" />
        <figcaption data-cyl-lightbox-cap></figcaption>
      </figure>
    </div>
  `;

  const stage = root.querySelector('[data-cyl-stage]');
  const viewport = root.querySelector('[data-cyl-viewport]');
  const ring = root.querySelector('[data-cyl-ring]');
  const hint = root.querySelector('[data-cyl-hint]');
  const lightbox = root.querySelector('[data-cyl-lightbox]');
  const lightboxImg = root.querySelector('[data-cyl-lightbox-img]');
  const lightboxCap = root.querySelector('[data-cyl-lightbox-cap]');
  const closeBtn = root.querySelector('[data-cyl-close]');

  const state = {
    rotation: 0,
    dragging: false,
    axis: null, // null | 'x' | 'y' — lock after small threshold
    moved: false,
    lastX: 0,
    lastY: 0,
    velocity: 0,
    lastT: 0,
    pointerId: null,
    lenisPaused: false,
  };
  const proxy = { y: 0 };
  const AXIS_LOCK_PX = 6;

  const isSmall = () => window.matchMedia('(max-width: 768px)').matches;
  const titleOf = (item) => (locale === 'en' ? item.titleEn : item.titleAr);

  const updateHint = () => {
    if (!hint) return;
    const fallback =
      locale === 'en' ? 'Drag to spin · tap to enlarge' : 'اسحب للدوران · اضغط للتكبير';
    hint.textContent =
      locale === 'en' ? opts.hintEn || fallback : opts.hintAr || fallback;
  };
  updateHint();

  const pauseLenis = () => {
    if (!lenis || state.lenisPaused) return;
    lenis.stop?.();
    state.lenisPaused = true;
  };

  const resumeLenis = () => {
    if (!lenis || !state.lenisPaused) return;
    lenis.start?.();
    state.lenisPaused = false;
  };

  function paint(immediate = true) {
    if (immediate) {
      gsap.killTweensOf(proxy);
      proxy.y = state.rotation;
      gsap.set(ring, { rotationY: state.rotation, force3D: true });
    } else {
      gsap.to(proxy, {
        y: state.rotation,
        ...CONFIG.spring,
        onUpdate: () => {
          gsap.set(ring, { rotationY: proxy.y, force3D: true });
        },
      });
    }
  }

  function layout() {
    const cylinderWidth = isSmall() ? CONFIG.cylinderWidth.mobile : CONFIG.cylinderWidth.desktop;
    const faceCount = items.length;
    const faceWidth = cylinderWidth / faceCount;
    const radius = cylinderWidth / (2 * Math.PI);

    viewport.style.perspective = `${CONFIG.perspective}px`;
    gsap.set(ring, {
      width: cylinderWidth,
      transformStyle: 'preserve-3d',
      transformOrigin: '50% 50%',
      force3D: true,
    });

    ring.innerHTML = items
      .map((item, i) => {
        const angle = i * (360 / faceCount);
        return `<div class="cyl__face" role="button" tabindex="0" data-index="${i}" style="width:${faceWidth}px;transform:rotateY(${angle}deg) translateZ(${radius}px)">
          <span class="cyl__card">
            <img src="${item.image}" alt="" draggable="false" loading="${i < 6 ? 'eager' : 'lazy'}" />
            <span class="cyl__label" data-label>${titleOf(item)}</span>
          </span>
        </div>`;
      })
      .join('');

    paint(true);
  }

  layout();

  if (reduced) {
    root.classList.add('cyl--reduced');
    return {
      setLabels(next) {
        locale = next === 'en' ? 'en' : 'ar';
        updateHint();
        root.querySelectorAll('[data-label]').forEach((el, i) => {
          if (items[i]) el.textContent = titleOf(items[i]);
        });
      },
      destroy() {
        root.innerHTML = '';
      },
    };
  }

  const onPointerDown = (e) => {
    if (e.button != null && e.button !== 0) return;
    // Don't preventDefault here — vertical touch/mouse-drag must stay free for page scroll
    state.dragging = true;
    state.axis = null;
    state.moved = false;
    state.lastX = e.clientX;
    state.lastY = e.clientY;
    state.velocity = 0;
    state.lastT = performance.now();
    state.pointerId = e.pointerId;
    gsap.killTweensOf(proxy);
    proxy.y = state.rotation;
  };

  const onPointerMove = (e) => {
    if (!state.dragging) return;
    if (state.pointerId != null && e.pointerId !== state.pointerId) return;

    const dx = e.clientX - state.lastX;
    const dy = e.clientY - state.lastY;

    // Axis lock: vertical intent → abandon rotate, let Lenis/page scroll
    if (!state.axis) {
      if (Math.abs(dx) < AXIS_LOCK_PX && Math.abs(dy) < AXIS_LOCK_PX) return;
      state.axis = Math.abs(dx) >= Math.abs(dy) ? 'x' : 'y';
      if (state.axis === 'y') {
        state.dragging = false;
        state.pointerId = null;
        stage.classList.remove('is-dragging');
        resumeLenis();
        return;
      }
      // Confirmed horizontal rotate
      stage.classList.add('is-dragging');
      pauseLenis();
      try {
        stage.setPointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    }

    if (state.axis !== 'x') return;

    e.preventDefault();
    const now = performance.now();
    if (Math.abs(dx) > 2) state.moved = true;
    const dt = Math.max(8, now - state.lastT);
    state.velocity = dx / dt;
    state.rotation += dx * CONFIG.dragSensitivity;
    state.lastX = e.clientX;
    state.lastY = e.clientY;
    state.lastT = now;
    proxy.y = state.rotation;
    gsap.set(ring, { rotationY: state.rotation, force3D: true });
  };

  const endDrag = (e) => {
    if (!state.dragging && state.axis !== 'x') {
      state.dragging = false;
      state.axis = null;
      state.pointerId = null;
      return;
    }
    if (e && state.pointerId != null && e.pointerId !== state.pointerId) return;
    const wasHorizontal = state.axis === 'x';
    state.dragging = false;
    state.axis = null;
    stage.classList.remove('is-dragging');
    try {
      if (state.pointerId != null) stage.releasePointerCapture(state.pointerId);
    } catch {
      /* ignore */
    }
    state.pointerId = null;
    if (!wasHorizontal) {
      resumeLenis();
      return;
    }
    const momentum = Math.abs(state.velocity) > 0.05 ? state.velocity * 180 : 0;
    state.rotation += momentum;
    paint(false);
    window.setTimeout(resumeLenis, 120);
  };

  const onWheel = (e) => {
    const absX = Math.abs(e.deltaX);
    const absY = Math.abs(e.deltaY);
    // Vertical (or mostly vertical) → never trap; Lenis/page scroll passes through
    if (absY >= absX) return;
    if (!e.deltaX) return;

    e.preventDefault();
    e.stopPropagation();
    pauseLenis();
    gsap.killTweensOf(proxy);
    const clamped = Math.sign(e.deltaX) * Math.min(absX, 120);
    state.rotation = proxy.y + clamped * CONFIG.wheelSensitivity;
    paint(false);
    window.clearTimeout(onWheel._resumeTimer);
    onWheel._resumeTimer = window.setTimeout(resumeLenis, 180);
  };

  const openLightbox = (index) => {
    const item = items[index];
    if (!item) return;
    lightboxImg.src = item.image;
    lightboxCap.textContent = titleOf(item);
    lightbox.hidden = false;
    requestAnimationFrame(() => lightbox.classList.add('is-open'));
    document.documentElement.classList.add('cyl-lightbox-open');
    pauseLenis();
    onSelect?.(index);
  };

  const closeLightbox = () => {
    lightbox.classList.remove('is-open');
    document.documentElement.classList.remove('cyl-lightbox-open');
    window.setTimeout(() => {
      lightbox.hidden = true;
      lightboxImg.removeAttribute('src');
    }, 220);
    resumeLenis();
  };

  const onFaceActivate = (e) => {
    const face = e.target.closest('[data-index]');
    if (!face || state.moved) return;
    e.preventDefault();
    openLightbox(Number(face.dataset.index));
  };

  const onFaceKey = (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const face = e.target.closest('[data-index]');
    if (!face) return;
    e.preventDefault();
    openLightbox(Number(face.dataset.index));
  };

  const onKey = (e) => {
    if (e.key === 'Escape' && !lightbox.hidden) closeLightbox();
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      const dir = e.key === 'ArrowLeft' ? 1 : -1;
      e.preventDefault();
      pauseLenis();
      state.rotation += dir * (360 / Math.max(items.length, 1));
      paint(false);
      window.setTimeout(resumeLenis, 200);
    }
  };

  const onResize = () => {
    layout();
  };

  // Document-level move/up so drag survives leaving the stage / 3D hit gaps
  stage.addEventListener('pointerdown', onPointerDown, { passive: false });
  window.addEventListener('pointermove', onPointerMove, { passive: false });
  window.addEventListener('pointerup', endDrag);
  window.addEventListener('pointercancel', endDrag);
  stage.addEventListener('wheel', onWheel, { passive: false });
  stage.addEventListener('click', onFaceActivate);
  stage.addEventListener('keydown', onFaceKey);
  stage.addEventListener('keydown', onKey);
  closeBtn.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });
  window.addEventListener('keydown', onKey);
  window.addEventListener('resize', onResize);

  return {
    setLabels(next) {
      locale = next === 'en' ? 'en' : 'ar';
      updateHint();
      root.querySelectorAll('[data-label]').forEach((el, i) => {
        if (items[i]) el.textContent = titleOf(items[i]);
      });
      if (!lightbox.hidden) {
        const src = lightboxImg.getAttribute('src');
        const idx = items.findIndex((it) => it.image === src);
        if (idx >= 0) lightboxCap.textContent = titleOf(items[idx]);
      }
    },
    destroy() {
      resumeLenis();
      gsap.killTweensOf(proxy);
      stage.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', endDrag);
      window.removeEventListener('pointercancel', endDrag);
      stage.removeEventListener('wheel', onWheel);
      stage.removeEventListener('click', onFaceActivate);
      stage.removeEventListener('keydown', onFaceKey);
      stage.removeEventListener('keydown', onKey);
      closeBtn.removeEventListener('click', closeLightbox);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onResize);
      document.documentElement.classList.remove('cyl-lightbox-open');
      root.innerHTML = '';
    },
  };
}

export default mountCylinderCarousel;
