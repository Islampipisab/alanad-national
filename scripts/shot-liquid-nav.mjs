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
await page.waitForTimeout(1600);

await page.evaluate(() => {
  document.querySelector('#preloader')?.remove();
  document.documentElement.classList.add('is-ready');
});
await page.waitForTimeout(500);

const check = await page.evaluate(() => {
  const nav = document.querySelector('#navLinks');
  const blob = document.querySelector('[data-liquid-blob]');
  const links = [...document.querySelectorAll('[data-liquid-link]')].map((a) => ({
    href: a.getAttribute('href'),
    text: a.textContent.trim(),
    active: a.classList.contains('is-active'),
  }));
  const br = blob?.getBoundingClientRect();
  return {
    dir: document.documentElement.dir,
    lang: document.documentElement.lang,
    hasLiquid: nav?.classList.contains('liquid-nav'),
    tone: nav?.dataset.tone,
    linkCount: links.length,
    links,
    blob: br ? { w: Math.round(br.width), h: Math.round(br.height), x: Math.round(br.x) } : null,
  };
});
console.log('CHECK', JSON.stringify(check, null, 2));

const navBox = await page.locator('#nav').boundingBox();
const clipH = Math.max(96, Math.ceil((navBox?.height || 72) + 28));

async function save(name) {
  const local = path.join('demo-shots', name);
  await page.screenshot({ path: local, clip: { x: 0, y: 0, width: 1440, height: clipH } });
  fs.copyFileSync(local, path.join(store, name));
}

await save('alanad-liquid-nav-ar.png');

await page.locator('[data-liquid-link][href="#products"]').click({ force: true });
await page.waitForTimeout(160);
const mid = await page.evaluate(() => ({
  tomato: document.querySelector('[data-liquid-blob]')?.classList.contains('is-tomato'),
  active: document
    .querySelector('[data-liquid-link][href="#products"]')
    ?.classList.contains('is-active'),
}));
console.log('MID_MORPH', JSON.stringify(mid));
await save('alanad-liquid-nav-tomato-ar.png');

await page.waitForTimeout(950);
await save('alanad-liquid-nav-settled-ar.png');

await page.screenshot({ path: 'demo-shots/alanad-hero-nav-ar.png', fullPage: false });
fs.copyFileSync(
  'demo-shots/alanad-hero-nav-ar.png',
  path.join(store, 'alanad-hero-nav-ar.png'),
);

await browser.close();
console.log('DONE');
