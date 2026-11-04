/**
 * Full-catalog glass product slider — one slide per produce item (~75).
 * Photo and copy never overlap (side-by-side glass panels).
 */

import catalog from '../../data/products.json';

const CTA = {
  ar: 'اطلب هذا الصنف',
  en: 'Request this item',
};

/**
 * @param {HTMLElement} section
 * @param {{ reduced?: boolean, locale?: 'ar'|'en' }} [opts]
 */
export function mountProduceSlider(section, opts = {}) {
  if (!section) return { destroy() {}, setLocale() {}, goTo() {} };

  const stage = section.querySelector('.slider-stage');
  const active = section.querySelector('.active-slide');
  const prev = section.querySelector('.nav-prev');
  const next = section.querySelector('.nav-next');
  const pagination = section.querySelector('.pagination');
  const progress = section.querySelector('.progress-bar');
  const pauseButton = section.querySelector('.autoplay-toggle');
  const filterNav = section.querySelector('.category-nav');
  const reduceMotion =
    opts.reduced ?? matchMedia('(prefers-reduced-motion: reduce)').matches;

  /** @type {typeof catalog} */
  const all = Array.isArray(catalog) ? catalog : [];
  let filter = 'all'; // all | fruit | veg
  let data = all.slice();
  let index = 0;
  let lang = opts.locale === 'en' ? 'en' : 'ar';
  let timer = null;
  let paused = reduceMotion;
  let startX = 0;
  let startY = 0;
  let pointerDown = false;
  let dragLocked = null; // null | 'x' | 'y'
  let activePointerId = null;
  const interval = 4500;
  const DRAG_LOCK = 10;
  const DRAG_FLIP = 48;

  function typeLabel(cat) {
    if (lang === 'en') return cat === 'fruit' ? 'Fruit' : 'Vegetable';
    return cat === 'fruit' ? 'فاكهة' : 'خضار';
  }

  /** Windowed dots — avoids a 75-wide strip that forces a white scrollbar. */
  const DOT_WINDOW = 15;

  function rebuildDots() {
    if (!pagination) return;
    pagination.innerHTML = '';
    if (!data.length) return;

    let start = Math.max(0, index - Math.floor(DOT_WINDOW / 2));
    let end = Math.min(data.length, start + DOT_WINDOW);
    start = Math.max(0, end - DOT_WINDOW);

    if (start > 0) {
      const more = document.createElement('span');
      more.className = 'pagination-more';
      more.setAttribute('aria-hidden', 'true');
      more.textContent = '···';
      pagination.appendChild(more);
    }

    for (let i = start; i < end; i++) {
      const item = data[i];
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.dataset.go = String(i);
      btn.setAttribute('aria-label', lang === 'en' ? item.en : item.ar);
      if (i === index) btn.classList.add('is-active');
      btn.addEventListener('click', () => goTo(i));
      pagination.appendChild(btn);
    }

    if (end < data.length) {
      const more = document.createElement('span');
      more.className = 'pagination-more';
      more.setAttribute('aria-hidden', 'true');
      more.textContent = '···';
      pagination.appendChild(more);
    }
  }

  function applyPhoto(el, item) {
    const photo = el?.querySelector('.slide-photo');
    if (!photo || !item) return;
    const src = `/img/products/${item.slug}.jpg`;
    photo.classList.remove('is-collage');
    photo.classList.add('is-single');
    photo.style.backgroundImage = 'none';
    photo.innerHTML = `<img class="produce-shot" src="${src}" alt="" loading="eager" decoding="async" draggable="false" />`;
  }

  function syncStaticCopy() {
    section.querySelectorAll('[data-ar][data-en]').forEach((el) => {
      el.textContent = lang === 'en' ? el.dataset.en : el.dataset.ar;
    });
    const headingEn = section.querySelector('.heading-en');
    if (headingEn) {
      headingEn.textContent =
        lang === 'en' ? 'FRESHNESS IN EVERY HARVEST' : 'Our Fresh Products';
    }
  }

  function render() {
    if (!data.length || !active) return;
    index = ((index % data.length) + data.length) % data.length;
    const current = data[index];

    active.dataset.index = String(index);
    applyPhoto(active, current);

    const typeEl = active.querySelector('.copy-kicker, .product-type');
    const title = active.querySelector('.active-copy h3, .active-copy h2');
    const enLine = active.querySelector('.active-en');
    const p = active.querySelector('.active-copy p');
    const cta = active.querySelector('.product-cta span');
    const count = active.querySelector('.slide-count');
    const tag = active.querySelector('.photo-tag');

    if (typeEl) typeEl.textContent = typeLabel(current.cat);
    if (title) title.textContent = lang === 'ar' ? current.ar : current.en;
    if (enLine) {
      enLine.textContent = current.en;
      enLine.hidden = lang === 'en';
    }
    if (p) {
      p.textContent =
        lang === 'ar'
          ? current.cat === 'fruit'
            ? 'فاكهة طازجة مختارة بعناية من أجود المصادر.'
            : 'خضار طازج مختار بعناية من أجود المصادر.'
          : current.cat === 'fruit'
            ? 'Fresh fruit, carefully selected from trusted sources.'
            : 'Fresh vegetables, carefully selected from trusted sources.';
    }
    if (cta) cta.textContent = lang === 'ar' ? CTA.ar : CTA.en;
    if (count) {
      count.innerHTML = `<strong>${String(index + 1).padStart(2, '0')}</strong> / ${String(data.length).padStart(2, '0')}`;
    }
    if (tag) {
      tag.textContent = lang === 'ar' ? 'مختارة بعناية' : 'CAREFULLY SELECTED';
    }

    const leftIndex = (index + data.length - 1) % data.length;
    const rightIndex = (index + 1) % data.length;
    const left = section.querySelector('.side-slide[data-slot="0"]');
    const right = section.querySelector('.side-slide[data-slot="2"]');
    if (left) {
      left.dataset.index = String(leftIndex);
      applyPhoto(left, data[leftIndex]);
      const leftTitle = left.querySelector('.side-copy h3, .side-copy h2');
      const leftEn = left.querySelector('.side-en');
      const leftType = left.querySelector('.side-copy .category-icon, .side-type');
      if (leftTitle) leftTitle.textContent = lang === 'ar' ? data[leftIndex].ar : data[leftIndex].en;
      if (leftEn) leftEn.textContent = typeLabel(data[leftIndex].cat).toUpperCase();
      if (leftType) leftType.textContent = data[leftIndex].cat === 'fruit' ? '✿' : '♢';
    }
    if (right) {
      right.dataset.index = String(rightIndex);
      applyPhoto(right, data[rightIndex]);
      const rightTitle = right.querySelector('.side-copy h3, .side-copy h2');
      const rightEn = right.querySelector('.side-en');
      const rightType = right.querySelector('.side-copy .category-icon, .side-type');
      if (rightTitle) rightTitle.textContent = lang === 'ar' ? data[rightIndex].ar : data[rightIndex].en;
      if (rightEn) rightEn.textContent = typeLabel(data[rightIndex].cat).toUpperCase();
      if (rightType) rightType.textContent = data[rightIndex].cat === 'fruit' ? '✿' : '♢';
    }

    rebuildDots();

    filterNav?.querySelectorAll('button[data-filter]').forEach((btn) => {
      btn.classList.toggle('is-active', btn.dataset.filter === filter);
    });

    if (progress) {
      progress.style.transition = 'none';
      progress.style.width = '0%';
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          if (!paused && !reduceMotion) {
            progress.style.transition = `width ${interval}ms linear`;
            progress.style.width = '100%';
          }
        }),
      );
    }
  }

  function goTo(nextIndex) {
    if (!data.length) return;
    index = ((nextIndex % data.length) + data.length) % data.length;
    render();
    restartTimer();
  }

  function setFilter(next) {
    filter = next === 'fruit' || next === 'veg' ? next : 'all';
    data = filter === 'all' ? all.slice() : all.filter((p) => p.cat === filter);
    index = 0;
    rebuildDots();
    render();
    restartTimer();
  }

  function restartTimer() {
    clearInterval(timer);
    timer = null;
    if (!paused && !reduceMotion && data.length > 1) {
      timer = setInterval(() => {
        index = (index + 1) % data.length;
        render();
      }, interval);
    }
  }

  function setPaused(value) {
    paused = value;
    if (pauseButton) {
      const span = pauseButton.querySelector('span');
      if (span) span.textContent = paused ? '▶' : 'Ⅱ';
      pauseButton.setAttribute('aria-label', paused ? 'Start autoplay' : 'Pause autoplay');
    }
    restartTimer();
    if (paused && progress) progress.style.transition = 'none';
  }

  function setLocale(next) {
    lang = next === 'en' ? 'en' : 'ar';
    syncStaticCopy();
    rebuildDots();
    render();
  }

  prev?.addEventListener('click', () => goTo(index - 1));
  next?.addEventListener('click', () => goTo(index + 1));
  pauseButton?.addEventListener('click', () => setPaused(!paused));

  filterNav?.querySelectorAll('button[data-filter]').forEach((btn) => {
    btn.addEventListener('click', () => setFilter(btn.dataset.filter || 'all'));
  });

  const onEnter = () => {
    if (!paused) {
      clearInterval(timer);
      if (progress) progress.style.transition = 'none';
    }
  };
  section.addEventListener('mouseenter', onEnter);
  section.addEventListener('mouseleave', restartTimer);
  section.addEventListener('focusin', () => clearInterval(timer));
  section.addEventListener('focusout', restartTimer);

  function isDragIgnoreTarget(t) {
    return !!t?.closest?.(
      'a, button, input, textarea, select, label, .nav-arrow, .autoplay-toggle, .pagination, .category-nav',
    );
  }

  function endDrag(e) {
    if (!pointerDown) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    const wasHorizontal = dragLocked === 'x';
    if (activePointerId != null && stage?.hasPointerCapture?.(activePointerId)) {
      try {
        stage.releasePointerCapture(activePointerId);
      } catch {
        /* ignore */
      }
    }
    stage?.classList.remove('is-dragging');
    pointerDown = false;
    dragLocked = null;
    activePointerId = null;

    if (wasHorizontal && Math.abs(dx) >= DRAG_FLIP && Math.abs(dx) > Math.abs(dy)) {
      // Natural media feel: drag left → next in LTR; RTL reverses
      const rtl = document.documentElement.dir === 'rtl';
      goTo(index + ((dx < 0) === rtl ? 1 : -1));
    } else {
      restartTimer();
    }
  }

  const onDown = (e) => {
    if (e.button != null && e.button !== 0) return;
    if (isDragIgnoreTarget(e.target)) return;
    pointerDown = true;
    dragLocked = null;
    activePointerId = e.pointerId;
    startX = e.clientX;
    startY = e.clientY;
    // Do NOT capture yet — allow vertical page scroll until we lock to X
  };

  const onMove = (e) => {
    if (!pointerDown || e.pointerId !== activePointerId) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    if (!dragLocked) {
      if (Math.abs(dx) < DRAG_LOCK && Math.abs(dy) < DRAG_LOCK) return;
      if (Math.abs(dy) > Math.abs(dx)) {
        // Vertical intent — abandon carousel drag, let the page scroll
        dragLocked = 'y';
        pointerDown = false;
        activePointerId = null;
        return;
      }
      dragLocked = 'x';
      stage?.classList.add('is-dragging');
      clearInterval(timer);
      if (progress) progress.style.transition = 'none';
      try {
        stage?.setPointerCapture?.(e.pointerId);
      } catch {
        /* ignore */
      }
    }

    if (dragLocked === 'x') {
      // Stop the browser from treating this as text-select / pan
      e.preventDefault();
    }
  };

  const onUp = (e) => endDrag(e);
  const onCancel = (e) => {
    if (e.pointerId !== activePointerId) return;
    pointerDown = false;
    dragLocked = null;
    activePointerId = null;
    stage?.classList.remove('is-dragging');
    restartTimer();
  };

  stage?.addEventListener('pointerdown', onDown);
  stage?.addEventListener('pointermove', onMove, { passive: false });
  stage?.addEventListener('pointerup', onUp);
  stage?.addEventListener('pointercancel', onCancel);
  stage?.addEventListener('lostpointercapture', onCancel);

  const io = new IntersectionObserver(
    ([entry]) => {
      if (!entry) return;
      if (entry.isIntersecting) restartTimer();
      else {
        clearInterval(timer);
        timer = null;
      }
    },
    { threshold: 0.2 },
  );
  io.observe(section);

  setLocale(lang);
  setPaused(reduceMotion);

  return {
    goTo,
    setLocale,
    setFilter,
    destroy() {
      clearInterval(timer);
      io.disconnect();
      section.removeEventListener('mouseenter', onEnter);
      section.removeEventListener('mouseleave', restartTimer);
      stage?.removeEventListener('pointerdown', onDown);
      stage?.removeEventListener('pointermove', onMove);
      stage?.removeEventListener('pointerup', onUp);
      stage?.removeEventListener('pointercancel', onCancel);
      stage?.removeEventListener('lostpointercapture', onCancel);
      stage?.classList.remove('is-dragging');
    },
  };
}

export default mountProduceSlider;
