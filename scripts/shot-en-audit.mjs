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
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text());
});

await page.goto('http://127.0.0.1:5173/?v=' + Date.now(), { waitUntil: 'networkidle', timeout: 60000 });
// Start AR then switch to EN to exercise lang-switch split reset
await page.evaluate(() => localStorage.setItem('lang', 'ar'));
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(1800);
await page.evaluate(() => document.querySelector('#preloader')?.remove());
await page.locator('.lang__btn[data-lang="en"]').click();
await page.waitForTimeout(900);

const report = await page.evaluate((arSrc) => {
  const ARABIC = new RegExp(arSrc);
  const visible = (el) => {
    if (!el) return '';
    const st = getComputedStyle(el);
    if (st.display === 'none' || st.visibility === 'hidden' || Number(st.opacity) < 0.05) return '';
    return (el.innerText || '').replace(/\s+/g, ' ').trim();
  };
  const title = document.querySelector('.hero__title');
  const titleSpans = [...(title?.querySelectorAll('.split-w > span') || [])];
  const stuck = titleSpans.filter((s) => {
    const t = getComputedStyle(s).transform;
    return t && t !== 'none' && !t.includes('matrix(1, 0, 0, 1, 0, 0)');
  });
  const arabic = [];
  document.querySelectorAll('main h1, main h2, main h3, main p, main a, main button, main span, footer, #nav a').forEach((el) => {
    const t = visible(el);
    if (t && ARABIC.test(t) && !el.closest('.lang')) arabic.push(t.slice(0, 100));
  });
  return {
    lang: document.documentElement.lang,
    dir: document.documentElement.dir,
    title: document.title,
    meta: document.querySelector('meta[name=description]')?.content?.slice(0, 80),
    brandAria: document.querySelector('.nav__brand')?.getAttribute('aria-label'),
    nav: [...document.querySelectorAll('#navLinks a')].map((a) => a.textContent.trim()),
    heroTitle: visible(title),
    heroTitleStuckTransforms: stuck.length,
    heroSub: visible(document.querySelector('.hero__sub')),
    heroLead: visible(document.querySelector('.hero__lead'))?.slice(0, 60),
    heroCta: visible(document.querySelector('.hero__ctas')),
    productsTitle: visible(document.querySelector('#products .produce-title-text')),
    headingEnHidden: !!document.querySelector('#products .heading-en')?.hidden,
    activeEnHidden: !!document.querySelector('#produceSlider .active-en')?.hidden,
    activeTitle: visible(document.querySelector('#produceSlider .active-copy h3')),
    filters: [...document.querySelectorAll('#produceSlider .category-nav button')].map((b) =>
      (b.innerText || '').replace(/\s+/g, ' ').trim(),
    ),
    about: visible(document.querySelector('#about h2')),
    journey: visible(document.querySelector('#journey h2, .journey h2')),
    services: visible(document.querySelector('#services h2')),
    partners: visible(document.querySelector('#partners h2')),
    contact: visible(document.querySelector('#contact h2')),
    footer: visible(document.querySelector('footer'))?.slice(0, 120),
    arabicLeftover: [...new Set(arabic)].slice(0, 20),
  };
}, ARABIC.source);

// Force visible for clean screenshots
await page.evaluate(() => {
  document.querySelectorAll('.hero__content, .hero__content * , .hero__stats, .hero__brand-float').forEach((el) => {
    el.style.opacity = '1';
    el.style.transform = 'none';
    el.style.visibility = 'visible';
  });
});
await page.waitForTimeout(300);
await page.screenshot({ path: 'demo-shots/alanad-hero-en.png', fullPage: false });
fs.copyFileSync('demo-shots/alanad-hero-en.png', path.join(store, 'alanad-hero-en.png'));

await page.locator('#products').scrollIntoViewIfNeeded();
await page.waitForTimeout(700);
await page.evaluate(() => document.querySelector('#produceSlider .autoplay-toggle')?.click());
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

const pass = {
  enDir: report.dir === 'ltr' && report.lang === 'en',
  heroTitleVisible: /farm|crop|fresh/i.test(report.heroTitle) && report.heroTitleStuckTransforms === 0,
  heroCopy: !!report.heroSub && !!report.heroLead && /Explore|About/i.test(report.heroCta || ''),
  noArabicMain: report.arabicLeftover.length === 0,
  productsEn: /Fresh Products|products/i.test(report.productsTitle || ''),
  headingEnHidden: report.headingEnHidden,
  activeEnHidden: report.activeEnHidden,
  filtersClean: report.filters.every((f) => !/Fruit Fruit|Vegetable Vegetable|FRUIT|VEGETABLE/i.test(f) || /varieties/i.test(f)),
  noErrors: errors.length === 0,
};

console.log(JSON.stringify({ report, errors, pass }, null, 2));
await browser.close();
if (!Object.values(pass).every(Boolean)) {
  console.error('EN AUDIT FAILED', pass);
  process.exit(1);
}
console.log('EN AUDIT OK');
