/**
 * Vanilla Vite port of Nimbus-style Liquid Glass Navbar.
 * Dark glass shell + gooey active blob that morphs toward a tomato
 * silhouette on click (with ripple), then settles under the active item.
 */
import gsap from 'gsap';

/**
 * @param {HTMLElement} root  .liquid-nav mount
 * @param {{
 *   reduced?: boolean,
 *   getLocale?: () => 'ar'|'en',
 *   onNavigate?: (href: string) => void,
 * }} [opts]
 */
export function mountLiquidNavbar(root, opts = {}) {
  if (!root) return { destroy() {}, setActive() {}, refresh() {} };

  const reduced =
    opts.reduced ?? matchMedia('(prefers-reduced-motion: reduce)').matches;
  const links = [...root.querySelectorAll('[data-liquid-link]')];
  const blob = root.querySelector('[data-liquid-blob]');
  const glass = root.matches?.('[data-liquid-glass]')
    ? root
    : root.querySelector('[data-liquid-glass]');
  if (!blob || !glass || !links.length) {
    return { destroy() {}, setActive() {}, refresh() {} };
  }

  // Ripple ring for obvious click feedback
  let ripple = root.querySelector('[data-liquid-ripple]');
  if (!ripple) {
    ripple = document.createElement('span');
    ripple.className = 'liquid-nav__ripple';
    ripple.setAttribute('data-liquid-ripple', '');
    ripple.setAttribute('aria-hidden', 'true');
    glass.insertBefore(ripple, blob.nextSibling);
  }

  root.classList.add('liquid-nav');
  root.classList.toggle('liquid-nav--reduced', reduced);
  root.dataset.tone = 'dark';

  let activeHref =
    links.find((l) => l.classList.contains('is-active'))?.getAttribute('href') ||
    links[0].getAttribute('href');
  let morphTween = null;
  let moveTween = null;
  let ignoreIOUntil = 0;

  const linkByHref = (href) => links.find((l) => l.getAttribute('href') === href);

  function measure(link) {
    const gr = glass.getBoundingClientRect();
    const lr = link.getBoundingClientRect();
    return {
      x: lr.left - gr.left,
      y: lr.top - gr.top,
      w: lr.width,
      h: lr.height,
    };
  }

  function placeRipple(target) {
    gsap.killTweensOf(ripple);
    gsap.set(ripple, {
      x: target.x + target.w / 2,
      y: target.y + target.h / 2,
      width: Math.max(target.w * 0.55, 28),
      height: Math.max(target.h * 0.9, 28),
      opacity: 0.9,
      scale: 0.55,
      borderRadius: '999px',
    });
    gsap.to(ripple, {
      scale: 2.35,
      opacity: 0,
      duration: 0.7,
      ease: 'power2.out',
    });
  }

  function placeBlob(link, { immediate = false, morphTomato = false } = {}) {
    if (!link) return;
    const m = measure(link);
    const padX = 6;
    const padY = 4;
    const target = {
      x: m.x - padX,
      y: m.y - padY,
      w: m.w + padX * 2,
      h: m.h + padY * 2,
    };

    gsap.killTweensOf(blob);
    if (morphTween) morphTween.kill();

    if (reduced || immediate) {
      gsap.set(blob, {
        x: target.x,
        y: target.y,
        width: target.w,
        height: target.h,
        borderRadius: '999px',
        scaleX: 1,
        scaleY: 1,
        clearProps: 'clipPath,filter',
      });
      blob.classList.remove('is-tomato', 'is-morphing');
      return;
    }

    if (morphTomato) {
      ignoreIOUntil = performance.now() + 1400;
      blob.classList.add('is-tomato', 'is-morphing');
      placeRipple(target);

      // Stretch → obvious tomato fruit → hold → elastic settle as glass pill
      morphTween = gsap.timeline({
        defaults: { ease: 'power3.out' },
        onComplete: () => {
          blob.classList.remove('is-tomato', 'is-morphing');
          blob.classList.add('is-settled');
        },
      });
      morphTween
        .set(blob, { x: target.x, y: target.y, width: target.w, height: target.h })
        .to(blob, {
          x: target.x + target.w * 0.12,
          y: target.y - 14,
          width: Math.max(target.w * 0.62, 40),
          height: Math.max(target.h * 1.65, 48),
          borderRadius: '50% 50% 46% 46% / 62% 62% 38% 38%',
          scaleX: 1.12,
          scaleY: 1.22,
          duration: 0.32,
          ease: 'back.out(1.6)',
        })
        .to(blob, {
          x: target.x + target.w * 0.16,
          y: target.y - 18,
          width: Math.max(target.w * 0.58, 38),
          height: Math.max(target.h * 1.78, 52),
          borderRadius: '52% 48% 48% 52% / 64% 64% 36% 36%',
          duration: 0.28,
          ease: 'power2.inOut',
        })
        .to({}, { duration: 0.18 }) // hold tomato so the click reads
        .to(blob, {
          x: target.x,
          y: target.y,
          width: target.w,
          height: target.h,
          borderRadius: '999px',
          scaleX: 1,
          scaleY: 1,
          duration: 0.55,
          ease: 'elastic.out(1, 0.48)',
        });
    } else {
      blob.classList.remove('is-tomato', 'is-morphing');
      moveTween = gsap.to(blob, {
        x: target.x,
        y: target.y,
        width: target.w,
        height: target.h,
        borderRadius: '999px',
        scaleX: 1,
        scaleY: 1,
        duration: 0.55,
        ease: 'power3.out',
      });
    }
  }

  function setActive(href, { morph = false, scroll = false } = {}) {
    if (!href) return;
    const link = linkByHref(href);
    if (!link) return;
    activeHref = href;
    links.forEach((l) => {
      const on = l === link;
      l.classList.toggle('is-active', on);
      l.setAttribute('aria-current', on ? 'page' : 'false');
    });
    placeBlob(link, { morphTomato: morph && !reduced });
    if (scroll) opts.onNavigate?.(href);
  }

  requestAnimationFrame(() => {
    const link = linkByHref(activeHref) || links[0];
    placeBlob(link, { immediate: true });
  });

  const onClick = (e) => {
    const link = e.target.closest('[data-liquid-link]');
    if (!link || !glass.contains(link)) return;
    const href = link.getAttribute('href');
    if (!href) return;
    e.preventDefault();
    setActive(href, { morph: true, scroll: true });
  };

  glass.addEventListener('click', onClick);

  const onResize = () => {
    const link = linkByHref(activeHref);
    if (link) placeBlob(link, { immediate: true });
  };
  window.addEventListener('resize', onResize);

  const io = new IntersectionObserver(
    (entries) => {
      if (performance.now() < ignoreIOUntil) return;
      const visible = entries
        .filter((en) => en.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible?.target?.id) return;
      const href = `#${visible.target.id}`;
      if (href === activeHref) return;
      if (!linkByHref(href)) return;
      setActive(href, { morph: false });
    },
    { rootMargin: '-40% 0px -45% 0px', threshold: [0.08, 0.2, 0.4] },
  );

  links.forEach((l) => {
    const id = l.getAttribute('href');
    if (!id?.startsWith('#')) return;
    const section = document.querySelector(id);
    if (section) io.observe(section);
  });

  return {
    setActive,
    refresh: onResize,
    destroy() {
      glass.removeEventListener('click', onClick);
      window.removeEventListener('resize', onResize);
      io.disconnect();
      gsap.killTweensOf(blob);
      gsap.killTweensOf(ripple);
      morphTween?.kill();
      moveTween?.kill();
    },
  };
}

export default mountLiquidNavbar;
