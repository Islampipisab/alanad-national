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
await page.waitForTimeout(1800);
await page.evaluate(() => {
  document.querySelector('#preloader')?.remove();
  document.documentElement.classList.add('is-ready');
});

const meta = await page.evaluate(() => {
  const canvas = document.querySelector('#heroProduceKey');
  const float = document.querySelector('.hero__brand-float');
  const content = document.querySelector('.hero__content');
  const fr = float?.getBoundingClientRect();
  const cr = content?.getBoundingClientRect();
  return {
    hasCanvas: !!canvas,
    canvasSize: canvas ? { w: canvas.width, h: canvas.height } : null,
    floatRightOfCopy: fr && cr ? fr.left >= cr.right - 12 : null,
    title: document.querySelector('.hero__title')?.textContent?.trim()?.slice(0, 40),
  };
});
console.log('HERO_PRODUCE', meta);

await page.screenshot({ path: 'demo-shots/alanad-hero-produce-ar.png', fullPage: false });
fs.copyFileSync('demo-shots/alanad-hero-produce-ar.png', path.join(store, 'alanad-hero-produce-ar.png'));
fs.copyFileSync('demo-shots/alanad-hero-produce-ar.png', path.join(store, 'alanad-hero-ar.png'));

// Sticky nav via programmatic scroll (Lenis-compatible window path)
const navSteps = [];
for (const y of [0, 400, 900, 500]) {
  await page.evaluate((yy) => {
    window.scrollTo(0, yy);
    window.dispatchEvent(new Event('scroll'));
  }, y);
  await page.waitForTimeout(150);
  navSteps.push(
    await page.evaluate(() => ({
      y: Math.round(window.scrollY),
      hidden: document.querySelector('#nav')?.classList.contains('is-hidden'),
    })),
  );
}
console.log('NAV', navSteps);

await browser.close();
console.log('DONE');
