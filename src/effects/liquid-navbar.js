/**
 * Vanilla Vite port of Nimbus-style Liquid Glass Navbar.
 * Dark glass shell + gooey active blob that morphs toward a tomato
 * silhouette on click (with ripple), hover preview, keyboard-friendly.
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

  let ripple = root.querySelector('[data-liquid-ripple]');
  if (!ripple) {
    ripple = document.createElement('span');
    ripple.className = 'liquid-nav__ripple';
    ripple.setAttribute('data-liquid-ripple', '');
    ripple.setAttribute('aria-hidden', 'true');
    glass.insertBefore(ripple, blob.nextSibling);
  }

  let hover = root.querySelector('[data-liquid-hover]');
  if (!hover) {
    hover = document.createElement('span');
    hover.className = 'liquid-nav__hover';
    hover.setAttribute('data-liquid-hover', '');
    hover.setAttribute('aria-hidden', 'true');
    glass.insertBefore(hover, blob);
  }

  root.classList.add('liquid-nav');
  root.classList.toggle('liquid-nav--reduced', reduced);
  root.dataset.tone = 'dark';

  let activeHref =
    links.find((l) => l.classList.contains('is-active'))?.getAttribute('href') ||
    links[0].getAttribute('href');
  let morphTween = null;
  let moveTween = null;
  let hoverTween = null;
  let ignoreIOUntil = 0;
  let hovering = false;
  let morphing = false;

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
      width: Math.max(target.w * 0.5, 26),
      height: Math.max(target.h * 0.85, 26),
      opacity: 1,
      scale: 0.4,
      borderRadius: '999px',
    });
    gsap
      .timeline()
      .to(ripple, {
        scale: 1.15,
        opacity: 0.95,
        duration: 0.16,
        ease: 'power2.out',
      })
      .to(ripple, {
        scale: 2.6,
        opacity: 0,
        duration: 0.55,
        ease: 'power2.out',
      });
  }

  function showHover(link) {
    if (!link || reduced || morphing) return;
    hovering = true;
    const m = measure(link);
    const padX = 4;
    const padY = 3;
    const target = {
      x: m.x - padX,
      y: m.y - padY,
      w: m.w + padX * 2,
      h: m.h + padY * 2,
    };
    hover.classList.add('is-on');
    gsap.killTweensOf(hover);
    hoverTween = gsap.to(hover, {
      x: target.x,
      y: target.y,
      width: target.w,
      height: target.h,
      opacity: 1,
      duration: 0.32,
      ease: 'power3.out',
    });
  }

  function hideHover() {
    hovering = false;
    gsap.killTweensOf(hover);
    hoverTween = gsap.to(hover, {
      opacity: 0,
      duration: 0.22,
      ease: 'power2.in',
      onComplete: () => hover.classList.remove('is-on'),
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
      morphing = false;
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
      morphing = true;
      hideHover();
      ignoreIOUntil = performance.now() + 1600;
      blob.classList.add('is-tomato', 'is-morphing');
      placeRipple(target);
      root.classList.add('is-clicking');

      morphTween = gsap.timeline({
        defaults: { ease: 'power3.out' },
        onComplete: () => {
          morphing = false;
          blob.classList.remove('is-tomato', 'is-morphing');
          blob.classList.add('is-settled');
          root.classList.remove('is-clicking');
        },
      });
      morphTween
        .set(blob, { x: target.x, y: target.y, width: target.w, height: target.h })
        .to(blob, {
          x: target.x + target.w * 0.1,
          y: target.y - 16,
          width: Math.max(target.w * 0.58, 42),
          height: Math.max(target.h * 1.72, 52),
          borderRadius: '50% 50% 46% 46% / 62% 62% 38% 38%',
          scaleX: 1.14,
          scaleY: 1.26,
          duration: 0.28,
          ease: 'back.out(1.8)',
        })
        .to(blob, {
          x: target.x + target.w * 0.14,
          y: target.y - 22,
          width: Math.max(target.w * 0.54, 40),
          height: Math.max(target.h * 1.9, 56),
          borderRadius: '52% 48% 48% 52% / 64% 64% 36% 36%',
          duration: 0.26,
          ease: 'power2.inOut',
        })
        .to({}, { duration: 0.22 })
        .to(blob, {
          x: target.x,
          y: target.y,
          width: target.w,
          height: target.h,
          borderRadius: '999px',
          scaleX: 1,
          scaleY: 1,
          duration: 0.58,
          ease: 'elastic.out(1, 0.45)',
        });
    } else {
      morphing = false;
      blob.classList.remove('is-tomato', 'is-morphing');
      moveTween = gsap.to(blob, {
        x: target.x,
        y: target.y,
        width: target.w,
        height: target.h,
        borderRadius: '999px',
        scaleX: 1,
        scaleY: 1,
        duration: 0.5,
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
      if (on) l.setAttribute('aria-current', 'page');
      else l.removeAttribute('aria-current');
    });
    placeBlob(link, { morphTomato: morph && !reduced });
    if (scroll) opts.onNavigate?.(href);
  }

  requestAnimationFrame(() => {
    const link = linkByHref(activeHref) || links[0];
    placeBlob(link, { immediate: true });
    gsap.set(hover, { opacity: 0, width: 0, height: 0 });
  });

  const onClick = (e) => {
    const link = e.target.closest('[data-liquid-link]');
    if (!link || !glass.contains(link)) return;
    const href = link.getAttribute('href');
    if (!href) return;
    e.preventDefault();
    setActive(href, { morph: true, scroll: true });
  };

  const onPointerEnter = (e) => {
    const link = e.target.closest?.('[data-liquid-link]');
    if (!link || !glass.contains(link)) return;
    showHover(link);
  };

  const onPointerLeave = (e) => {
    if (!glass.contains(e.relatedTarget)) hideHover();
  };

  const onFocusIn = (e) => {
    const link = e.target.closest?.('[data-liquid-link]');
    if (link) showHover(link);
  };

  const onFocusOut = (e) => {
    if (!glass.contains(e.relatedTarget)) hideHover();
  };

  glass.addEventListener('click', onClick);
  glass.addEventListener('pointerover', onPointerEnter);
  glass.addEventListener('pointerleave', onPointerLeave);
  glass.addEventListener('focusin', onFocusIn);
  glass.addEventListener('focusout', onFocusOut);

  const onResize = () => {
    const link = linkByHref(activeHref);
    if (link) placeBlob(link, { immediate: true });
    if (hovering) {
      const focused = document.activeElement;
      const hoverLink =
        (focused?.closest?.('[data-liquid-link]') && glass.contains(focused)
          ? focused.closest('[data-liquid-link]')
          : null) || linkByHref(activeHref);
      if (hoverLink) showHover(hoverLink);
    }
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
      glass.removeEventListener('pointerover', onPointerEnter);
      glass.removeEventListener('pointerleave', onPointerLeave);
      glass.removeEventListener('focusin', onFocusIn);
      glass.removeEventListener('focusout', onFocusOut);
      window.removeEventListener('resize', onResize);
      io.disconnect();
      gsap.killTweensOf(blob);
      gsap.killTweensOf(ripple);
      gsap.killTweensOf(hover);
      morphTween?.kill();
      moveTween?.kill();
      hoverTween?.kill();
    },
  };
}

export default mountLiquidNavbar;
