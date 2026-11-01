/**
 * Vanilla port of the Framer Motion 3D cylinder photo carousel
 * (rotateY + translateZ faces, drag-to-spin, click lightbox).
 * Uses GSAP for springy settle — no React.
 */
import gsap from 'gsap';

const CONFIG = {
  cylinderWidth: { mobile: 1600, desktop: 2400 },
  dragSensitivity: 0.18,
  wheelSensitivity: 0.45,
  perspective: 900,
  spring: { duration: 0.85, ease: 'power3.out' },
};

/**
 * @param {HTMLElement} root
 * @param {{
 *   items: Array<{ image: string, titleAr: string, titleEn: string, id?: string }>,
 *   reduced?: boolean,
 *   locale?: 'ar' | 'en',
 *   onSelect?: (index: number) => void,
 * }} opts
 */
export function mountCylinderCarousel(root, opts = {}) {
  const { items = [], reduced = false, onSelect } = opts;
  let locale = opts.locale === 'en' ? 'en' : 'ar';
  if (!root || !items.length) return { destroy() {}, setLabels() {} };

  root.classList.add('cyl');
  root.innerHTML = `
    <div class="cyl__stage" data-cyl-stage>
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

  const state = { rotation: 0, dragging: false, moved: false, lastX: 0, velocity: 0, lastT: 0 };
  const proxy = { y: 0 };

  const isSmall = () => window.matchMedia('(max-width: 768px)').matches;

  const titleOf = (item) => (locale === 'en' ? item.titleEn : item.titleAr);

  const updateHint = () => {
    if (!hint) return;
    hint.textContent =
      locale === 'en' ? 'Drag to spin · tap to enlarge' : 'اسحب للدوران · اضغط للتكبير';
  };
  updateHint();

  function layout() {
    const cylinderWidth = isSmall() ? CONFIG.cylinderWidth.mobile : CONFIG.cylinderWidth.desktop;
    const faceCount = items.length;
    const faceWidth = cylinderWidth / faceCount;
    const radius = cylinderWidth / (2 * Math.PI);

    viewport.style.perspective = `${CONFIG.perspective}px`;
    ring.style.width = `${cylinderWidth}px`;
    ring.innerHTML = items
      .map((item, i) => {
        const angle = i * (360 / faceCount);
        return `<button type="button" class="cyl__face" data-index="${i}" style="width:${faceWidth}px;transform:rotateY(${angle}deg) translateZ(${radius}px)">
          <span class="cyl__card">
            <img src="${item.image}" alt="" draggable="false" loading="${i < 6 ? 'eager' : 'lazy'}" />
            <span class="cyl__label" data-label>${titleOf(item)}</span>
          </span>
        </button>`;
      })
      .join('');
  }

  function applyRotation(immediate = false) {
    const transform = `rotate3d(0, 1, 0, ${state.rotation}deg)`;
    if (immediate) {
      gsap.set(ring, { transform });
      proxy.y = state.rotation;
    } else {
      gsap.to(proxy, {
        y: state.rotation,
        ...CONFIG.spring,
        onUpdate: () => {
          ring.style.transform = `rotate3d(0, 1, 0, ${proxy.y}deg)`;
        },
      });
    }
  }

  layout();
  applyRotation(true);

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
    state.dragging = true;
    state.moved = false;
    state.lastX = e.clientX;
    state.velocity = 0;
    state.lastT = performance.now();
    gsap.killTweensOf(proxy);
    proxy.y = state.rotation;
    stage.classList.add('is-dragging');
    stage.setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e) => {
    if (!state.dragging) return;
    const now = performance.now();
    const dx = e.clientX - state.lastX;
    if (Math.abs(dx) > 2) state.moved = true;
    const dt = Math.max(16, now - state.lastT);
    state.velocity = (dx / dt) * 16;
    state.rotation += dx * CONFIG.dragSensitivity;
    state.lastX = e.clientX;
    state.lastT = now;
    ring.style.transform = `rotate3d(0, 1, 0, ${state.rotation}deg)`;
    proxy.y = state.rotation;
  };

  const onPointerUp = (e) => {
    if (!state.dragging) return;
    state.dragging = false;
    stage.classList.remove('is-dragging');
    try {
      stage.releasePointerCapture?.(e.pointerId);
    } catch {
      /* ignore */
    }
    const momentum = Math.abs(state.velocity) > 0.4 ? state.velocity * 12 : 0;
    state.rotation += momentum;
    applyRotation(false);
  };

  const onWheel = (e) => {
    e.preventDefault();
    const delta = Math.sign(e.deltaY) * Math.min(Math.abs(e.deltaY), 100);
    gsap.killTweensOf(proxy);
    state.rotation = proxy.y + delta * CONFIG.wheelSensitivity;
    applyRotation(false);
  };

  const openLightbox = (index) => {
    const item = items[index];
    if (!item) return;
    lightboxImg.src = item.image;
    lightboxCap.textContent = titleOf(item);
    lightbox.hidden = false;
    requestAnimationFrame(() => lightbox.classList.add('is-open'));
    document.documentElement.classList.add('cyl-lightbox-open');
    onSelect?.(index);
  };

  const closeLightbox = () => {
    lightbox.classList.remove('is-open');
    document.documentElement.classList.remove('cyl-lightbox-open');
    window.setTimeout(() => {
      lightbox.hidden = true;
      lightboxImg.removeAttribute('src');
    }, 220);
  };

  const onFaceClick = (e) => {
    const face = e.target.closest('[data-index]');
    if (!face || state.moved) return;
    openLightbox(Number(face.dataset.index));
  };

  const onKey = (e) => {
    if (e.key === 'Escape' && !lightbox.hidden) closeLightbox();
  };

  const onResize = () => {
    layout();
    applyRotation(true);
  };

  stage.addEventListener('pointerdown', onPointerDown);
  stage.addEventListener('pointermove', onPointerMove);
  stage.addEventListener('pointerup', onPointerUp);
  stage.addEventListener('pointercancel', onPointerUp);
  stage.addEventListener('wheel', onWheel, { passive: false });
  ring.addEventListener('click', onFaceClick);
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
      gsap.killTweensOf(proxy);
      stage.removeEventListener('pointerdown', onPointerDown);
      stage.removeEventListener('pointermove', onPointerMove);
      stage.removeEventListener('pointerup', onPointerUp);
      stage.removeEventListener('pointercancel', onPointerUp);
      stage.removeEventListener('wheel', onWheel);
      ring.removeEventListener('click', onFaceClick);
      closeBtn.removeEventListener('click', closeLightbox);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onResize);
      document.documentElement.classList.remove('cyl-lightbox-open');
      root.innerHTML = '';
    },
  };
}

export default mountCylinderCarousel;
