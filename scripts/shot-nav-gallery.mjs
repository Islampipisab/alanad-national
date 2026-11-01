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
await page.reload({ waitUntil: 'networkidle', timeout: 60000 });
await page.waitForTimeout(900);
await page.evaluate(() => {
  document.querySelector('#preloader')?.remove();
  document.documentElement.classList.add('is-ready');
});

const hero = await page.evaluate(() => ({
  bubbles: document.querySelectorAll('.hero__orbit,.hero__bubble,.hero__produce').length,
  navHidden: document.querySelector('#nav')?.classList.contains('is-hidden'),
  hasHover: !!document.querySelector('[data-liquid-hover]'),
  hasBlob: !!document.querySelector('[data-liquid-blob]'),
}));
console.log('HERO', hero);
await page.screenshot({ path: 'demo-shots/alanad-hero-no-bubbles-ar.png', fullPage: false });
fs.copyFileSync('demo-shots/alanad-hero-no-bubbles-ar.png', path.join(store, 'alanad-hero-no-bubbles-ar.png'));

// Scroll down → nav should hide
await page.evaluate(() => window.scrollTo(0, 900));
await page.waitForTimeout(500);
const down = await page.evaluate(() => ({
  y: window.scrollY,
  hidden: document.querySelector('#nav')?.classList.contains('is-hidden'),
  solid: document.querySelector('#nav')?.classList.contains('is-solid'),
}));
console.log('SCROLL_DOWN', down);

// Scroll up → nav should reveal
await page.evaluate(() => window.scrollTo(0, 500));
await page.waitForTimeout(500);
const up = await page.evaluate(() => ({
  y: window.scrollY,
  hidden: document.querySelector('#nav')?.classList.contains('is-hidden'),
}));
console.log('SCROLL_UP', up);
await page.screenshot({ path: 'demo-shots/alanad-nav-scroll-up-ar.png', fullPage: false });
fs.copyFileSync('demo-shots/alanad-nav-scroll-up-ar.png', path.join(store, 'alanad-nav-scroll-up-ar.png'));

// Tomato click feedback
await page.locator('[data-liquid-link][href="#products"]').hover();
await page.waitForTimeout(200);
await page.locator('[data-liquid-link][href="#products"]').click();
await page.waitForTimeout(280);
const tomato = await page.evaluate(() => ({
  morphing: document.querySelector('[data-liquid-blob]')?.classList.contains('is-tomato'),
  clicking: document.querySelector('.liquid-nav')?.classList.contains('is-clicking'),
  active: document.querySelector('[data-liquid-link].is-active')?.getAttribute('href'),
}));
console.log('TOMATO', tomato);
await page.screenshot({ path: 'demo-shots/alanad-nav-tomato-ar.png', fullPage: false });
fs.copyFileSync('demo-shots/alanad-nav-tomato-ar.png', path.join(store, 'alanad-nav-tomato-ar.png'));

await page.waitForTimeout(700);
await page.locator('#products').scrollIntoViewIfNeeded();
await page.waitForTimeout(600);
const fruit = page.locator('#productFilters [data-filter="fruit"]');
if (await fruit.count()) {
  await fruit.click();
  await page.waitForTimeout(500);
}
const gal = await page.evaluate(() => {
  const img = document.querySelector('.ccig__layer.is-open image');
  return {
    title: document.querySelector('[data-ccig-title]')?.textContent,
    href: img?.getAttribute('href'),
    par: img?.getAttribute('preserveAspectRatio'),
  };
});
console.log('GALLERY', gal);
await page.screenshot({ path: 'demo-shots/alanad-gallery-cover-ar.png', fullPage: false });
fs.copyFileSync('demo-shots/alanad-gallery-cover-ar.png', path.join(store, 'alanad-gallery-cover-ar.png'));
fs.copyFileSync('demo-shots/alanad-gallery-cover-ar.png', path.join(store, 'alanad-products-ar.png'));

await browser.close();
console.log('DONE');
