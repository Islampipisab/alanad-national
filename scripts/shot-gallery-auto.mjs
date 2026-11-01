import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const store =
  process.env.STORE ||
  'C:\\Users\\pipis\\AppData\\Local\\Cursor\\AgentStores\\cursor_agent_stores\\bc-80344376-dbc3-4c69-8777-9abf06cc8ea4\\files\\media';

fs.mkdirSync('demo-shots', { recursive: true });
fs.mkdirSync(store, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on('pageerror', (e) => console.log('PAGEERROR', e.message));

await page.goto('http://127.0.0.1:5173/', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.evaluate(() => localStorage.setItem('lang', 'ar'));
await page.reload({ waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(1200);
await page.evaluate(() => {
  document.querySelector('#preloader')?.remove();
  document.documentElement.classList.add('is-ready');
});

await page.locator('#products').scrollIntoViewIfNeeded();
await page.waitForTimeout(800);

const before = await page.evaluate(() => ({
  title: document.querySelector('[data-ccig-title]')?.textContent,
  type: document.querySelector('[data-ccig-type]')?.textContent,
  img: document.querySelector('.ccig__layer.is-open image')?.getAttribute('href'),
  fit: {
    par: document.querySelector('.ccig__layer.is-open image')?.getAttribute('preserveAspectRatio'),
    x: document.querySelector('.ccig__layer.is-open image')?.getAttribute('x'),
    w: document.querySelector('.ccig__layer.is-open image')?.getAttribute('width'),
  },
}));
console.log('BEFORE', before);

await page.screenshot({ path: 'demo-shots/alanad-products-ar.png', fullPage: false });
fs.copyFileSync('demo-shots/alanad-products-ar.png', path.join(store, 'alanad-products-ar.png'));

// Wait for auto-advance (~4.5s + transition)
await page.waitForTimeout(5600);
const after = await page.evaluate(() => ({
  title: document.querySelector('[data-ccig-title]')?.textContent,
  type: document.querySelector('[data-ccig-type]')?.textContent,
}));
console.log('AFTER_AUTO', after);
console.log('ADVANCED', before.title !== after.title);

await page.screenshot({
  path: 'demo-shots/alanad-products-autoplay-ar.png',
  fullPage: false,
});
fs.copyFileSync(
  'demo-shots/alanad-products-autoplay-ar.png',
  path.join(store, 'alanad-products-autoplay-ar.png'),
);

// Hover should pause — capture title, wait, confirm same
await page.locator('[data-ccig-frame]').hover();
const hovered = await page.evaluate(() => document.querySelector('[data-ccig-title]')?.textContent);
await page.waitForTimeout(5200);
const still = await page.evaluate(() => document.querySelector('[data-ccig-title]')?.textContent);
console.log('HOVER_PAUSE', { hovered, still, paused: hovered === still });

await browser.close();
console.log('DONE');
