/**
 * Vanilla mount for DitherHelix carousel (Three.js + WebGL2 pipeline).
 * React Demo lives under internal/dither-helix for reference only.
 */
import { createCarousel } from './dither-helix/gl/scene.js';

function supportsWebGL2() {
  try {
    const c = document.createElement('canvas');
    return !!c.getContext('webgl2');
  } catch {
    return false;
  }
}

function mountFallback(root, items, { onActiveChange, onSelect } = {}) {
  root.classList.add('dither-helix--fallback');
  root.innerHTML = `<div class="dither-helix__fallback" tabindex="0" role="list">
    ${items
      .map(
        (item, i) => `<button type="button" class="dither-helix__fallback-card" data-index="${i}" role="listitem">
        <img src="${item.image}" alt="" loading="lazy" />
        <span data-label>${item.titleAr}</span>
      </button>`,
      )
      .join('')}
  </div>`;

  let active = 0;
  const cards = [...root.querySelectorAll('.dither-helix__fallback-card')];
  const setActive = (i) => {
    active = (i + cards.length) % cards.length;
    cards.forEach((c, n) => c.classList.toggle('is-active', n === active));
    onActiveChange?.(active);
    cards[active]?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
  };
  setActive(0);

  cards.forEach((card) => {
    card.addEventListener('click', () => {
      const i = Number(card.dataset.index);
      setActive(i);
      onSelect?.(i);
    });
  });

  root.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      setActive(active - 1);
    }
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      setActive(active + 1);
    }
  });

  return {
    setLabels() {},
    destroy() {
      root.innerHTML = '';
    },
  };
}

/**
 * @param {HTMLElement} root
 * @param {{ items: Array<{image:string,titleAr:string,titleEn:string,id?:string}>, reduced?: boolean, brand?: string, onActiveChange?: Function, onSelect?: Function }} opts
 */
export function mountDitherHelixCarousel(root, opts = {}) {
  const { items = [], reduced = false, onActiveChange, onSelect } = opts;
  if (!root || !items.length) return { destroy() {}, setLabels() {} };

  const useFallback = reduced || !supportsWebGL2();
  if (useFallback) return mountFallback(root, items, { onActiveChange, onSelect });

  root.classList.add('dither-helix');
  root.innerHTML = `
    <canvas class="dither-helix__canvas" aria-hidden="true"></canvas>
    <div class="dither-helix__labels" aria-live="polite"></div>
    <p class="dither-helix__hint" data-i18n-hint>مرّر / اسحب لاستكشاف الأصناف</p>
  `;

  const canvas = root.querySelector('.dither-helix__canvas');
  const labelsEl = root.querySelector('.dither-helix__labels');
  let active = 0;
  let locale = document.documentElement.lang === 'en' ? 'en' : 'ar';

  const renderLabels = () => {
    labelsEl.innerHTML = items
      .map((item, i) => {
        const title = locale === 'en' ? item.titleEn : item.titleAr;
        return `<button type="button" class="dither-helix__label${i === active ? ' is-active' : ''}" data-index="${i}">${title}</button>`;
      })
      .join('');
  };
  renderLabels();

  labelsEl.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-index]');
    if (!btn) return;
    const i = Number(btn.dataset.index);
    active = i;
    renderLabels();
    onSelect?.(i);
  });

  let dispose = null;
  try {
    dispose = createCarousel(canvas, {
      images: items.map((i) => i.image),
      enableGui: false,
      onActiveChange: (index) => {
        active = index % items.length;
        renderLabels();
        onActiveChange?.(active);
      },
    });
  } catch (err) {
    console.warn('DitherHelix failed, using fallback', err);
    return mountFallback(root, items, { onActiveChange, onSelect });
  }

  const ro = new ResizeObserver(() => {
    // scene listens to window resize; force a window event for embedded size
    window.dispatchEvent(new Event('resize'));
  });
  ro.observe(root);

  return {
    setLabels(nextLocale) {
      locale = nextLocale === 'en' ? 'en' : 'ar';
      renderLabels();
      const hint = root.querySelector('.dither-helix__hint');
      if (hint) {
        hint.textContent =
          locale === 'en' ? 'Scroll / drag to explore varieties' : 'مرّر / اسحب لاستكشاف الأصناف';
      }
    },
    destroy() {
      ro.disconnect();
      dispose?.();
      root.innerHTML = '';
    },
  };
}

export default mountDitherHelixCarousel;
