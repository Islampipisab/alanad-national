/**
 * Al-Anad animated produce slider — adapted from
 * Downloads/al_anad_animated_product_slider (vanilla).
 * Integrates with site locale; local product photography.
 */

/** Local produce photography only — mockup needs visible fruit/veg in every card. */
const CATEGORIES = [
  {
    id: 'leafy',
    ar: 'الخضروات الورقية',
    en: 'Leafy Greens',
    kickerAr: 'طازجة من المزارع',
    kickerEn: 'FRESH FROM THE FARM',
    descAr: 'أوراق خضراء مختارة بعناية، بطعم طازج وجودة تحافظ على قيمتها.',
    descEn: 'Carefully selected leafy greens, fresh in taste and quality.',
    icon: '♧',
    images: ['/img/products/lettuce.jpg', '/img/products/romaine.jpg', '/img/products/spinach.jpg'],
  },
  {
    id: 'fruits',
    ar: 'الفواكه',
    en: 'Fruits',
    kickerAr: 'من أجود المزارع',
    kickerEn: 'FROM TRUSTED FARMS',
    descAr: 'تشكيلة غنية من الفواكه الطازجة، المحلية والمستوردة، لتصل إليكم بجودة تستحقونها.',
    descEn:
      'A vibrant selection of fresh local and imported fruits, delivered with the quality you expect.',
    icon: '✿',
    images: [
      '/img/products/apple.jpg',
      '/img/products/strawberry.jpg',
      '/img/products/orange.jpg',
      '/img/products/green-grapes.jpg',
    ],
  },
  {
    id: 'vegetables',
    ar: 'الخضروات',
    en: 'Vegetables',
    kickerAr: 'جودة في كل محصول',
    kickerEn: 'QUALITY IN EVERY HARVEST',
    descAr: 'خضروات متنوعة يتم اختيارها وتجهيزها لتلبية احتياجات عملائنا على مدار العام.',
    descEn: 'A versatile range of vegetables selected to serve our customers throughout the year.',
    icon: '♢',
    images: [
      '/img/products/red-pepper.jpg',
      '/img/products/green-pepper.jpg',
      '/img/products/carrot.jpg',
      '/img/products/cucumber.jpg',
    ],
  },
  {
    id: 'staple',
    ar: 'المحاصيل الأساسية',
    en: 'Essential Crops',
    kickerAr: 'إمداد موثوق',
    kickerEn: 'RELIABLE SUPPLY',
    descAr: 'محاصيل أساسية من مصادر موثوقة، مع اهتمام بالجودة واستمرارية التوريد.',
    descEn: 'Essential crops from trusted sources, with a focus on quality and dependable supply.',
    icon: '▱',
    images: ['/img/products/potato.jpg', '/img/products/onion.jpg', '/img/products/garlic.jpg'],
  },
  {
    id: 'seasonal',
    ar: 'منتجات موسمية',
    en: 'Seasonal Products',
    kickerAr: 'الأفضل في موسمه',
    kickerEn: 'BEST IN SEASON',
    descAr: 'منتجات موسمية مختارة وفق توافر المحاصيل وأفضل مواسم الحصاد.',
    descEn: 'Seasonal selections chosen around availability and the best harvest periods.',
    icon: '◷',
    images: ['/img/products/tomato.jpg', '/img/products/watermelon.jpg', '/img/products/mango.jpg'],
  },
];

/**
 * @param {HTMLElement} section  .produce-section root inside #products
 * @param {{ reduced?: boolean, locale?: 'ar'|'en', onLocaleIgnored?: boolean }} [opts]
 */
export function mountProduceSlider(section, opts = {}) {
  if (!section) return { destroy() {}, setLocale() {}, goTo() {} };

  const stage = section.querySelector('.slider-stage');
  const active = section.querySelector('.active-slide');
  const prev = section.querySelector('.nav-prev');
  const next = section.querySelector('.nav-next');
  const dots = [...section.querySelectorAll('.pagination button')];
  const tabs = [...section.querySelectorAll('.category-nav button')];
  const progress = section.querySelector('.progress-bar');
  const pauseButton = section.querySelector('.autoplay-toggle');
  const reduceMotion =
    opts.reduced ?? matchMedia('(prefers-reduced-motion: reduce)').matches;

  const data = CATEGORIES;
  let index = 1;
  let lang = opts.locale === 'en' ? 'en' : 'ar';
  let timer = null;
  let paused = reduceMotion;
  let startX = 0;
  let startY = 0;
  let pointerDown = false;
  const interval = 5000;

  function applyPhoto(el, i) {
    const photo = el?.querySelector('.slide-photo');
    const item = data[i];
    if (!photo || !item) return;
    const srcs = item.images?.length ? item.images : item.image ? [item.image] : [];
    if (!srcs.length) return;

    // Prefer real <img> collage so produce is always visible (no remote CDN)
    photo.style.backgroundImage = 'none';
    photo.classList.toggle('is-collage', srcs.length > 1);
    photo.classList.toggle('is-single', srcs.length === 1);
    photo.innerHTML = srcs
      .map(
        (src) =>
          `<img class="produce-shot" src="${src}" alt="" loading="eager" decoding="async" draggable="false" />`,
      )
      .join('');
  }

  function syncCopyAttrs() {
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
    const current = data[index];
    if (!active || !current) return;

    active.dataset.index = String(index);
    applyPhoto(active, index);

    const icon = active.querySelector('.active-copy .category-icon');
    const kicker = active.querySelector('.copy-kicker');
    const title = active.querySelector('.active-copy h3, .active-copy h2');
    const enLine = active.querySelector('.active-en');
    const p = active.querySelector('.active-copy p');
    const count = active.querySelector('.slide-count');
    if (icon) icon.textContent = current.icon;
    if (kicker) kicker.textContent = lang === 'ar' ? current.kickerAr : current.kickerEn;
    if (title) title.textContent = lang === 'ar' ? current.ar : current.en;
    if (enLine) {
      enLine.textContent = current.en;
      enLine.hidden = lang === 'en';
    }
    if (p) p.textContent = lang === 'ar' ? current.descAr : current.descEn;
    if (count) {
      count.innerHTML = `<strong>${String(index + 1).padStart(2, '0')}</strong> / 0${data.length}`;
    }

    const leftIndex = (index + data.length - 1) % data.length;
    const rightIndex = (index + 1) % data.length;
    const left = section.querySelector('.side-slide[data-slot="0"]');
    const right = section.querySelector('.side-slide[data-slot="2"]');
    if (left) {
      left.dataset.index = String(leftIndex);
      applyPhoto(left, leftIndex);
      const leftIcon = left.querySelector('.side-copy .category-icon');
      const leftTitle = left.querySelector('.side-copy h3, .side-copy h2');
      const leftEn = left.querySelector('.side-en');
      if (leftIcon) leftIcon.textContent = data[leftIndex].icon;
      if (leftTitle) leftTitle.textContent = lang === 'ar' ? data[leftIndex].ar : data[leftIndex].en;
      if (leftEn) leftEn.textContent = data[leftIndex].en.toUpperCase();
    }
    if (right) {
      right.dataset.index = String(rightIndex);
      applyPhoto(right, rightIndex);
      const rightIcon = right.querySelector('.side-copy .category-icon');
      const rightTitle = right.querySelector('.side-copy h3, .side-copy h2');
      const rightEn = right.querySelector('.side-en');
      if (rightIcon) rightIcon.textContent = data[rightIndex].icon;
      if (rightTitle) rightTitle.textContent = lang === 'ar' ? data[rightIndex].ar : data[rightIndex].en;
      if (rightEn) rightEn.textContent = data[rightIndex].en.toUpperCase();
    }

    dots.forEach((dot, i) => dot.classList.toggle('is-active', i === index));
    tabs.forEach((tab) =>
      tab.classList.toggle('is-active', Number(tab.dataset.go) === index),
    );

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
    index = (nextIndex + data.length) % data.length;
    render();
    restartTimer();
  }

  function restartTimer() {
    clearInterval(timer);
    timer = null;
    if (!paused && !reduceMotion) {
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
    syncCopyAttrs();
    render();
  }

  prev?.addEventListener('click', () => goTo(index - 1));
  next?.addEventListener('click', () => goTo(index + 1));
  dots.forEach((dot) =>
    dot.addEventListener('click', () => goTo(Number(dot.dataset.go ?? 0))),
  );
  tabs.forEach((tab) =>
    tab.addEventListener('click', () => goTo(Number(tab.dataset.go ?? 0))),
  );
  pauseButton?.addEventListener('click', () => setPaused(!paused));

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

  const onDown = (e) => {
    pointerDown = true;
    startX = e.clientX;
    startY = e.clientY;
    stage?.setPointerCapture?.(e.pointerId);
  };
  const onUp = (e) => {
    if (!pointerDown) return;
    pointerDown = false;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) {
      const rtl = document.documentElement.dir === 'rtl';
      goTo(index + ((dx < 0) === rtl ? 1 : -1));
    }
  };
  stage?.addEventListener('pointerdown', onDown);
  stage?.addEventListener('pointerup', onUp);
  stage?.addEventListener('pointercancel', () => {
    pointerDown = false;
  });

  if (!reduceMotion && matchMedia('(pointer:fine)').matches && active) {
    active.addEventListener('pointermove', (e) => {
      const rect = active.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      active.style.transform = `translate(-50%,-50%) rotateX(${(-y * 3).toFixed(2)}deg) rotateY(${(x * 4).toFixed(2)}deg)`;
    });
    active.addEventListener('pointerleave', () => {
      active.style.transform = 'translate(-50%,-50%) rotateX(0) rotateY(0)';
    });
  }

  // Pause when offscreen
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
    destroy() {
      clearInterval(timer);
      io.disconnect();
      section.removeEventListener('mouseenter', onEnter);
      section.removeEventListener('mouseleave', restartTimer);
      stage?.removeEventListener('pointerdown', onDown);
      stage?.removeEventListener('pointerup', onUp);
    },
  };
}

export { CATEGORIES };
export default mountProduceSlider;
