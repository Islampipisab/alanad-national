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
await page.waitForTimeout(1100);
await page.evaluate(() => {
  document.querySelector('#preloader')?.remove();
  document.documentElement.classList.add('is-ready');
});

const meta = await page.evaluate(() => {
  const float = document.querySelector('.hero__brand-float');
  const img = float?.querySelector('img');
  const content = document.querySelector('.hero__content');
  const fr = float?.getBoundingClientRect();
  const cr = content?.getBoundingClientRect();
  const videoDisplay = getComputedStyle(document.querySelector('.site-bg__video-wrap') || document.body).display;
  return {
    src: img?.getAttribute('src'),
    floatRightOfCopy: fr && cr ? fr.left >= cr.right - 8 : null,
    float: fr && { x: Math.round(fr.x), w: Math.round(fr.width) },
    content: cr && { x: Math.round(cr.x), w: Math.round(cr.width) },
    videoWrap: videoDisplay,
    bubbles: document.querySelectorAll('.hero__orbit').length,
  };
});
console.log('HERO_BRAND', meta);

await page.screenshot({ path: 'demo-shots/alanad-hero-brand-ar.png', fullPage: false });
fs.copyFileSync('demo-shots/alanad-hero-brand-ar.png', path.join(store, 'alanad-hero-brand-ar.png'));
fs.copyFileSync('demo-shots/alanad-hero-brand-ar.png', path.join(store, 'alanad-hero-ar.png'));
fs.copyFileSync('demo-shots/alanad-hero-brand-ar.png', path.join(store, 'alanad-logo-right-ar.png'));

// Sticky nav smoke
await page.mouse.wheel(0, 1400);
await page.waitForTimeout(450);
const down = await page.evaluate(() => document.querySelector('#nav')?.classList.contains('is-hidden'));
await page.mouse.wheel(0, -900);
await page.waitForTimeout(450);
const up = await page.evaluate(() => document.querySelector('#nav')?.classList.contains('is-hidden'));
console.log('NAV', { down, up, hideWorks: down === true, showWorks: up === false });

await browser.close();
console.log('DONE');
