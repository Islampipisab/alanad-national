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
page.on('console', (m) => {
  if (m.type() === 'error') console.log('CONSOLE', m.text());
});

await page.goto('http://127.0.0.1:5173/', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.evaluate(() => localStorage.setItem('lang', 'ar'));
await page.reload({ waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(1400);
await page.evaluate(() => {
  document.querySelector('#preloader')?.remove();
  document.documentElement.classList.add('is-ready');
});
await page.waitForTimeout(500);

const check = await page.evaluate(() => ({
  catGrid: !!document.querySelector('#catGrid'),
  catCards: document.querySelectorAll('.cat-grid .cat').length,
  filters: [...document.querySelectorAll('#productFilters .filter-pill')].map((b) => ({
    filter: b.dataset.filter,
    label: b.querySelector('.filter-pill__label')?.textContent,
    count: b.querySelector('.filter-pill__count')?.textContent,
    active: b.classList.contains('is-active'),
  })),
  search: !!document.querySelector('#productSearch'),
  ccig: !!document.querySelector('.ccig__frame'),
  layers: document.querySelectorAll('.ccig__layer').length,
  dots: document.querySelectorAll('.ccig__dot').length,
  ringItems: document.querySelectorAll('.ig__item').length,
  caption: {
    type: document.querySelector('[data-ccig-type]')?.textContent,
    name: document.querySelector('[data-ccig-title]')?.textContent,
  },
}));
console.log('CHECK', JSON.stringify(check, null, 2));

const navBox = await page.locator('#nav').boundingBox();
await page.screenshot({
  path: 'demo-shots/alanad-liquid-nav-ar.png',
  clip: { x: 0, y: 0, width: 1440, height: Math.max(96, Math.ceil((navBox?.height || 72) + 28)) },
});
fs.copyFileSync('demo-shots/alanad-liquid-nav-ar.png', path.join(store, 'alanad-liquid-nav-ar.png'));

await page.locator('#products').scrollIntoViewIfNeeded();
await page.waitForTimeout(900);
await page.screenshot({ path: 'demo-shots/alanad-products-ar.png', fullPage: false });
fs.copyFileSync('demo-shots/alanad-products-ar.png', path.join(store, 'alanad-products-ar.png'));

await page.locator('#productFilters [data-filter="fruit"]').click();
await page.waitForTimeout(1100);
const after = await page.evaluate(() => ({
  layers: document.querySelectorAll('.ccig__layer').length,
  caption: document.querySelector('[data-ccig-title]')?.textContent,
}));
console.log('FRUIT_FILTER', after);
await page.screenshot({
  path: 'demo-shots/alanad-products-fruit-filter-ar.png',
  fullPage: false,
});
fs.copyFileSync(
  'demo-shots/alanad-products-fruit-filter-ar.png',
  path.join(store, 'alanad-products-fruit-filter-ar.png'),
);

await page.locator('[data-ccig-next]').click();
await page.waitForTimeout(1400);
await page.screenshot({
  path: 'demo-shots/alanad-products-clip-gallery-ar.png',
  fullPage: false,
});
fs.copyFileSync(
  'demo-shots/alanad-products-clip-gallery-ar.png',
  path.join(store, 'alanad-products-clip-gallery-ar.png'),
);

await browser.close();
console.log('DONE');
