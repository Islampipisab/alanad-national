import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const store =
  'C:\\Users\\pipis\\AppData\\Local\\Cursor\\AgentStores\\cursor_agent_stores\\bc-80344376-dbc3-4c69-8777-9abf06cc8ea4\\files\\media';
fs.mkdirSync(store, { recursive: true });
fs.mkdirSync('demo-shots', { recursive: true });

const ARABIC = /[\u0600-\u06FF]/;

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('pageerror', (e) => errors.push('PAGE: ' + e.message));
page.on('console', (m) => {
  if (m.type() === 'error') errors.push('CON: ' + m.text());
});

await page.goto('http://127.0.0.1:5173/?v=' + Date.now(), { waitUntil: 'networkidle', timeout: 60000 });
await page.evaluate(() => localStorage.setItem('lang', 'en'));
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(1200);
await page.evaluate(() => {
  document.querySelector('#preloader')?.remove();
  document.querySelectorAll('[data-reveal], .hero__content, .hero__brand-float, .hero__stats').forEach((el) => {
    el.style.opacity = '1';
    el.style.transform = 'none';
    el.style.visibility = 'visible';
  });
});
await page.waitForTimeout(800);

// Force EN via button too
await page.locator('.lang__btn[data-lang="en"]').click();
await page.waitForTimeout(500);

const meta = await page.evaluate(() => ({
  lang: document.documentElement.lang,
  dir: document.documentElement.dir,
  title: document.title,
}));

const sections = await page.evaluate((arabicReSource) => {
  const ARABIC = new RegExp(arabicReSource);
  const visibleText = (el) => {
    if (!el) return '';
    const st = getComputedStyle(el);
    if (st.display === 'none' || st.visibility === 'hidden' || st.opacity === '0') return '';
    return (el.innerText || '').replace(/\s+/g, ' ').trim();
  };

  const clipCheck = (el) => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const st = getComputedStyle(el);
    const overflowX = st.overflowX;
    const clipped =
      el.scrollWidth > el.clientWidth + 2 && (overflowX === 'hidden' || overflowX === 'clip');
    return {
      tag: el.tagName,
      cls: el.className?.toString?.()?.slice(0, 60),
      text: (el.textContent || '').trim().slice(0, 80),
      scrollW: el.scrollWidth,
      clientW: el.clientWidth,
      clipped,
      overflowX,
      rect: { x: r.x, w: r.width },
    };
  };

  const pick = (sel) => document.querySelector(sel);
  const texts = {
    nav: [...document.querySelectorAll('#navLinks a')].map((a) => a.textContent.trim()),
    heroBadge: visibleText(pick('.hero__badge')),
    heroTitle: visibleText(pick('.hero__title')),
    heroSub: visibleText(pick('.hero__sub')),
    heroLead: visibleText(pick('.hero__lead')),
    heroCta1: visibleText(pick('.hero__ctas .btn--lime')),
    heroCta2: visibleText(pick('.hero__ctas .btn--ghost')),
    stats: [...document.querySelectorAll('.hero__stats .stat span')].map((s) => s.textContent.trim()),
    aboutKicker: visibleText(pick('#about .kicker')),
    aboutTitle: visibleText(pick('#about h2')),
    journeyTitle: visibleText(pick('#journey h2, [id*="journey"] h2, .journey h2')),
    productsTitle: visibleText(pick('#products .produce-title-text, #products h2')),
    productsLead: visibleText(pick('#products .lead-ar, #products .section-heading p')),
    productsHeadingEn: visibleText(pick('#products .heading-en')),
    productActiveTitle: visibleText(pick('#produceSlider .active-copy h3')),
    productType: visibleText(pick('#produceSlider .copy-kicker, #produceSlider .product-type')),
    productCta: visibleText(pick('#produceSlider .product-cta span')),
    productTag: visibleText(pick('#produceSlider .photo-tag')),
    filters: [...document.querySelectorAll('#produceSlider .category-nav button')].map((b) =>
      (b.innerText || '').replace(/\s+/g, ' ').trim(),
    ),
    servicesTitle: visibleText(pick('#services h2')),
    partnersTitle: visibleText(pick('#partners h2')),
    contactTitle: visibleText(pick('#contact h2')),
    footer: visibleText(pick('footer')),
  };

  const arabicHits = [];
  const walk = (root, pathLabel) => {
    if (!root) return;
    const nodes = root.querySelectorAll('h1,h2,h3,h4,p,span,a,button,label,li,small,b,strong');
    nodes.forEach((el, i) => {
      const t = visibleText(el);
      if (!t || !ARABIC.test(t)) return;
      // Allow brand mark / intentionally bilingual tiny bits? Flag all for review
      arabicHits.push({
        path: pathLabel,
        sel: el.tagName + (el.className ? '.' + String(el.className).split(' ')[0] : ''),
        text: t.slice(0, 120),
      });
    });
  };

  walk(pick('#nav'), 'nav');
  walk(pick('#hero'), 'hero');
  walk(pick('#about'), 'about');
  walk(pick('#journey') || pick('.journey'), 'journey');
  walk(pick('#products'), 'products');
  walk(pick('#services'), 'services');
  walk(pick('#partners'), 'partners');
  walk(pick('#contact'), 'contact');
  walk(pick('footer'), 'footer');

  // Clipped candidates in hero + products
  const clipSuspects = [];
  [pick('.hero__title'), pick('.hero__lead'), pick('#products .produce-title-text'), pick('#produceSlider .active-copy h3'), pick('#produceSlider .active-copy p')]
    .filter(Boolean)
    .forEach((el) => {
      const c = clipCheck(el);
      if (c && (c.clipped || c.scrollW > c.clientW + 4)) clipSuspects.push(c);
    });

  // LTR alignment spot-check
  const align = {
    heroContentDir: pick('.hero__content') ? getComputedStyle(pick('.hero__content')).direction : null,
    heroContentTextAlign: pick('.hero__content') ? getComputedStyle(pick('.hero__content')).textAlign : null,
    navDir: pick('#nav') ? getComputedStyle(pick('#nav')).direction : null,
    productsDir: pick('#products') ? getComputedStyle(pick('#products')).direction : null,
  };

  return { texts, arabicHits, clipSuspects, align };
}, ARABIC.source);

await page.screenshot({ path: 'demo-shots/alanad-hero-en.png', fullPage: false });
fs.copyFileSync('demo-shots/alanad-hero-en.png', path.join(store, 'alanad-hero-en.png'));

await page.locator('#products').scrollIntoViewIfNeeded();
await page.waitForTimeout(800);
await page.evaluate(() => {
  document.querySelector('#produceSlider .autoplay-toggle')?.click();
});
await page.waitForTimeout(400);
const box = await page.locator('#products').boundingBox();
await page.screenshot({
  path: 'demo-shots/alanad-products-en.png',
  clip: {
    x: Math.max(0, box.x),
    y: Math.max(0, box.y),
    width: Math.min(box.width, 1440),
    height: Math.min(box.height, 1100),
  },
});
fs.copyFileSync('demo-shots/alanad-products-en.png', path.join(store, 'alanad-products-en.png'));

console.log(JSON.stringify({ meta, errors, sections }, null, 2));
await browser.close();
