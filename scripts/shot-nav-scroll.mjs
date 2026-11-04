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

await page.goto('http://127.0.0.1:5173/?v=' + Date.now(), { waitUntil: 'networkidle', timeout: 60000 });
await page.evaluate(() => localStorage.setItem('lang', 'ar'));
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(1000);
await page.evaluate(() => {
  document.querySelector('#preloader')?.remove();
  document.querySelectorAll('[data-reveal], .hero__content, .hero__brand-float').forEach((el) => {
    el.style.opacity = '1';
    el.style.transform = 'none';
    el.style.visibility = 'visible';
  });
});
await page.waitForTimeout(600);

const readNav = () =>
  page.evaluate(() => {
    const nav = document.querySelector('#nav');
    const links = document.querySelector('#navLinks');
    const ns = nav ? getComputedStyle(nav) : null;
    const ls = links ? getComputedStyle(links) : null;
    return {
      y: window.scrollY,
      hidden: nav?.classList.contains('is-hidden') ?? null,
      solid: nav?.classList.contains('is-solid') ?? null,
      navBlur: ns?.backdropFilter || ns?.webkitBackdropFilter || 'none',
      liquidBlur: ls?.backdropFilter || ls?.webkitBackdropFilter || 'none',
      transform: ns?.transform,
      opacity: ns?.opacity,
    };
  });

const scrollTo = async (y) => {
  await page.evaluate(async (target) => {
    const start = window.scrollY;
    const dist = target - start;
    const steps = 28;
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      window.scrollTo(0, start + dist * eased);
      window.dispatchEvent(new Event('scroll'));
      await new Promise((r) => requestAnimationFrame(r));
      await new Promise((r) => setTimeout(r, 16));
    }
    window.scrollTo(0, target);
    window.dispatchEvent(new Event('scroll'));
  }, y);
  await page.waitForTimeout(450);
};

// Drive via wheel events too (Lenis listens to wheel)
const wheelSteps = async (deltaY, times) => {
  for (let i = 0; i < times; i++) {
    await page.mouse.wheel(0, deltaY);
    await page.waitForTimeout(40);
  }
  await page.waitForTimeout(500);
};

const top = await readNav();

// Mid-page scroll down → should hide
await page.mouse.move(720, 400);
await wheelSteps(180, 18);
const afterDown = await readNav();
await page.screenshot({ path: 'demo-shots/alanad-nav-scroll-down-ar.png', fullPage: false });

// Scroll up mid-page (not to top) → should show
await wheelSteps(-160, 10);
const afterUp = await readNav();
await page.screenshot({ path: 'demo-shots/alanad-nav-scroll-up-ar.png', fullPage: false });

// Still mid-page?
const midOk = afterUp.y > 200;

for (const f of ['alanad-nav-scroll-down-ar.png', 'alanad-nav-scroll-up-ar.png']) {
  fs.copyFileSync(path.join('demo-shots', f), path.join(store, f));
}
fs.copyFileSync('demo-shots/alanad-nav-scroll-up-ar.png', path.join(store, 'alanad-hero-nav-ar.png'));

const noBlur = (v) => !v || v === 'none' || v === 'none';
const pass = {
  noNavBlur: noBlur(top.navBlur) && noBlur(afterUp.navBlur),
  noLiquidBlur: noBlur(top.liquidBlur) && noBlur(afterUp.liquidBlur),
  hidOnDown: afterDown.hidden === true,
  showedOnUp: afterUp.hidden === false,
  upStillMidPage: midOk,
};

console.log(JSON.stringify({ top, afterDown, afterUp, pass }, null, 2));
await browser.close();

if (!Object.values(pass).every(Boolean)) {
  console.error('NAV VERIFY FAILED', pass);
  process.exit(1);
}
console.log('NAV VERIFY OK');
