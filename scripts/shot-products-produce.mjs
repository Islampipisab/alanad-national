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
await page.waitForTimeout(600);
await page.evaluate(() => {
  const root = document.querySelector('#produceSlider');
  root?.querySelector('.autoplay-toggle')?.click();
  root?.querySelector('.category-nav button[data-go="1"]')?.click();
});
await page.waitForTimeout(900);

// Wait for produce images to load
await page.waitForFunction(() => {
  const imgs = [...document.querySelectorAll('#produceSlider .produce-shot')];
  return imgs.length >= 3 && imgs.every((img) => img.complete && img.naturalWidth > 0);
}, { timeout: 15000 }).catch(() => {});

const info = await page.evaluate(() => {
  const shots = [...document.querySelectorAll('#produceSlider .produce-shot')].map((img) => ({
    src: img.getAttribute('src'),
    w: img.naturalWidth,
    h: img.naturalHeight,
    complete: img.complete,
  }));
  const lead = document.querySelector('#produceSlider .lead-ar')?.textContent?.trim();
  const title = document.querySelector('#produceSlider .active-copy h3')?.textContent?.trim();
  return { lead, title, shots, count: shots.length };
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
