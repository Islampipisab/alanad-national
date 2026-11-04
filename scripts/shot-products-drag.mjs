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
await page.waitForTimeout(900);
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
await page.waitForTimeout(500);
await page.evaluate(() => {
  document.querySelector('#produceSlider .autoplay-toggle')?.click();
  document.querySelector('#produceSlider .pagination button[data-go="0"]')?.click();
});
await page.waitForTimeout(700);

const before = await page.evaluate(() => ({
  title: document.querySelector('#produceSlider .active-copy h3')?.textContent?.trim(),
  count: document.querySelector('#produceSlider .slide-count')?.textContent?.replace(/\s+/g, ' ').trim(),
  touchAction: getComputedStyle(document.querySelector('#produceSlider .slider-stage')).touchAction,
  cursor: getComputedStyle(document.querySelector('#produceSlider .slider-stage')).cursor,
}));

const stage = page.locator('#produceSlider .slider-stage');
const box = await stage.boundingBox();
if (!box) throw new Error('no stage box');

const cx = box.x + box.width * 0.4;
const cy = box.y + box.height * 0.45;

// Horizontal drag (RTL: drag right → next)
await page.mouse.move(cx, cy);
await page.mouse.down();
await page.mouse.move(cx + 120, cy, { steps: 12 });
await page.mouse.up();
await page.waitForTimeout(600);

const afterH = await page.evaluate(() => ({
  title: document.querySelector('#produceSlider .active-copy h3')?.textContent?.trim(),
  count: document.querySelector('#produceSlider .slide-count')?.textContent?.replace(/\s+/g, ' ').trim(),
}));

// Vertical-ish drag should NOT change slide
await page.mouse.move(cx, cy);
await page.mouse.down();
await page.mouse.move(cx + 8, cy + 140, { steps: 10 });
await page.mouse.up();
await page.waitForTimeout(400);

const afterV = await page.evaluate(() => ({
  title: document.querySelector('#produceSlider .active-copy h3')?.textContent?.trim(),
  count: document.querySelector('#produceSlider .slide-count')?.textContent?.replace(/\s+/g, ' ').trim(),
}));

const pass = {
  dragChangedSlide: before.count !== afterH.count,
  verticalDidNotChange: afterH.count === afterV.count,
  touchActionPanY: before.touchAction.includes('pan-y'),
};

console.log(JSON.stringify({ before, afterH, afterV, pass }, null, 2));

await page.evaluate(() => {
  document.documentElement.classList.add('reduced');
  document.querySelectorAll('#produceSlider, #produceSlider *').forEach((el) => {
    el.style.animation = 'none';
    el.style.transition = 'none';
  });
});
const secBox = await section.boundingBox();
const out = 'demo-shots/alanad-products-glass-ar.png';
await page.screenshot({
  path: out,
  clip: {
    x: Math.max(0, secBox.x),
    y: Math.max(0, secBox.y),
    width: Math.min(secBox.width, 1440),
    height: Math.min(secBox.height, 1200),
  },
});
fs.copyFileSync(out, path.join(store, 'alanad-products-glass-ar.png'));
fs.copyFileSync(out, path.join(store, 'alanad-products-drag-ar.png'));
await browser.close();

if (!pass.dragChangedSlide || !pass.verticalDidNotChange || !pass.touchActionPanY) {
  console.error('DRAG VERIFY FAILED', pass);
  process.exit(1);
}
console.log('DRAG VERIFY OK');
