import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const store =
  'C:\\Users\\pipis\\AppData\\Local\\Cursor\\AgentStores\\cursor_agent_stores\\bc-80344376-dbc3-4c69-8777-9abf06cc8ea4\\files\\media';
fs.mkdirSync(store, { recursive: true });
fs.mkdirSync('demo-shots', { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on('pageerror', (e) => console.log('PAGEERROR', e.message));

await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle', timeout: 60000 });
await page.evaluate(() => localStorage.setItem('lang', 'ar'));
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(1000);
await page.evaluate(() => {
  document.querySelector('#preloader')?.remove();
  document.querySelectorAll('[data-reveal]').forEach((el) => {
    el.style.opacity = '1';
    el.style.transform = 'none';
    el.style.visibility = 'visible';
  });
});

const section = page.locator('#products');
await section.scrollIntoViewIfNeeded();
await page.waitForTimeout(700);
await page.evaluate(() => {
  document.querySelector('#produceSlider .autoplay-toggle')?.click();
});
await page.waitForTimeout(500);

// Jump to a fruit-heavy slide (apple) so produce is obvious
await page.evaluate(() => {
  const dots = [...document.querySelectorAll('#produceSlider .pagination button')];
  const apple = dots.find((d) => (d.getAttribute('aria-label') || '').includes('تفاح') || (d.getAttribute('aria-label') || '').toLowerCase().includes('apple'));
  (apple || dots[40] || dots[0])?.click();
});
await page.waitForTimeout(800);

await page.waitForFunction(() => {
  const img = document.querySelector('#produceSlider .active-slide .produce-shot');
  return img && img.complete && img.naturalWidth > 0;
}, { timeout: 10000 }).catch(() => {});

const info = await page.evaluate(() => {
  const active = document.querySelector('#produceSlider .active-slide');
  const photo = active?.querySelector('.slide-photo');
  const copy = active?.querySelector('.active-copy');
  const img = active?.querySelector('.produce-shot');
  const pr = photo?.getBoundingClientRect();
  const cr = copy?.getBoundingClientRect();
  const overlap =
    pr && cr
      ? !(pr.right <= cr.left || pr.left >= cr.right || pr.bottom <= cr.top || pr.top >= cr.bottom)
      : null;
  return {
    lead: document.querySelector('#produceSlider .lead-ar')?.textContent?.trim(),
    title: copy?.querySelector('h3')?.textContent?.trim(),
    type: copy?.querySelector('.product-type, .copy-kicker')?.textContent?.trim(),
    cta: copy?.querySelector('.product-cta span')?.textContent?.trim(),
    count: copy?.querySelector('.slide-count')?.textContent?.replace(/\s+/g, ' ').trim(),
    dots: document.querySelectorAll('#produceSlider .pagination button').length,
    imgSrc: img?.getAttribute('src'),
    imgOk: !!(img && img.naturalWidth > 0),
    photoBox: pr && { x: Math.round(pr.x), w: Math.round(pr.width) },
    copyBox: cr && { x: Math.round(cr.x), w: Math.round(cr.width) },
    overlap,
    zPhoto: photo ? getComputedStyle(photo).zIndex : null,
    zCopy: copy ? getComputedStyle(copy).zIndex : null,
  };
});
console.log(JSON.stringify(info, null, 2));

await page.evaluate(() => {
  document.documentElement.classList.add('reduced');
  document.querySelectorAll('#produceSlider, #produceSlider *').forEach((el) => {
    el.style.animation = 'none';
    el.style.transition = 'none';
  });
});
await page.waitForTimeout(200);

const box = await section.boundingBox();
const out = 'demo-shots/alanad-products-glass-ar.png';
if (box) {
  await page.screenshot({
    path: out,
    clip: {
      x: Math.max(0, box.x),
      y: Math.max(0, box.y),
      width: Math.min(box.width, 1440),
      height: Math.min(box.height, 1200),
    },
  });
} else {
  await page.screenshot({ path: out });
}
fs.copyFileSync(out, path.join(store, 'alanad-products-glass-ar.png'));
fs.copyFileSync(out, path.join(store, 'alanad-products-ar.png'));
console.log('wrote', path.join(store, 'alanad-products-glass-ar.png'));
await browser.close();
