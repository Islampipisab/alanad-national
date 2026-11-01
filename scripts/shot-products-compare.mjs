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

// Package reference
await page.goto('http://127.0.0.1:5180/', { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(900);
await page.locator('.produce-section').screenshot({ path: 'demo-shots/alanad-products-package-ref.png' });
fs.copyFileSync(
  'demo-shots/alanad-products-package-ref.png',
  path.join(store, 'alanad-products-package-ref.png'),
);
console.log('package ok');

// Live site
await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle', timeout: 60000 });
await page.evaluate(() => localStorage.setItem('lang', 'ar'));
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(1200);
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
await page.waitForTimeout(800);
await page.evaluate(() => {
  const root = document.querySelector('#produceSlider');
  root?.querySelector('.autoplay-toggle')?.click();
  root?.querySelector('.category-nav button[data-go="1"]')?.click();
  // Freeze transforms mid-animation
  root?.querySelectorAll('.slide').forEach((el) => {
    el.style.transition = 'none';
  });
});
await page.waitForTimeout(700);

const info = await page.evaluate(() => {
  const active = document.querySelector('#produceSlider .active-slide');
  const left = document.querySelector('#produceSlider .side-slide[data-slot="0"]');
  const right = document.querySelector('#produceSlider .side-slide[data-slot="2"]');
  const r = (el) => {
    if (!el) return null;
    const b = el.getBoundingClientRect();
    return { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) };
  };
  return {
    title: active?.querySelector('.active-copy h3, .active-copy h2')?.textContent?.trim(),
    heading: document.querySelector('#produceSlider .produce-title-text')?.textContent?.trim(),
    count: active?.querySelector('.slide-count')?.textContent?.replace(/\s+/g, ' ').trim(),
    tab: document.querySelector('#produceSlider .category-nav button.is-active')?.dataset.go,
    photoBg: active?.querySelector('.slide-photo')?.style.backgroundImage,
    leftTitle: left?.querySelector('h3,h2')?.textContent,
    rightTitle: right?.querySelector('h3,h2')?.textContent,
    active: r(active),
    left: r(left),
    right: r(right),
  };
});
console.log(JSON.stringify(info, null, 2));

const box = await section.boundingBox();
await page.evaluate(() => {
  document.documentElement.classList.add('reduced');
  document.querySelectorAll('#produceSlider, #produceSlider *').forEach((el) => {
    el.style.animation = 'none';
    el.style.transition = 'none';
  });
});
await page.waitForTimeout(200);
if (box) {
  await page.screenshot({
    path: 'demo-shots/alanad-products-glass-ar.png',
    clip: {
      x: Math.max(0, box.x),
      y: Math.max(0, box.y),
      width: Math.min(box.width, 1440),
      height: Math.min(box.height, 1200),
    },
  });
} else {
  await page.screenshot({ path: 'demo-shots/alanad-products-glass-ar.png' });
}
fs.copyFileSync('demo-shots/alanad-products-glass-ar.png', path.join(store, 'alanad-products-glass-ar.png'));
fs.copyFileSync('demo-shots/alanad-products-glass-ar.png', path.join(store, 'alanad-products-ar.png'));

const mockPath = path.join(store, 'alanad-products-glass-mockup.png');
const liveBuf = fs.readFileSync('demo-shots/alanad-products-glass-ar.png');
const pkgBuf = fs.readFileSync('demo-shots/alanad-products-package-ref.png');
const mockBuf = fs.existsSync(mockPath) ? fs.readFileSync(mockPath) : Buffer.alloc(0);

const html = `<!doctype html>
<html><body style="margin:0;background:#041610;display:flex;gap:14px;padding:40px 14px 14px;font-family:sans-serif;color:#c5ef4b">
  <div style="flex:1;position:relative">
    <div style="position:absolute;top:-28px;left:8px;font-weight:700">MOCKUP</div>
    <img src="data:image/png;base64,${mockBuf.toString('base64')}" style="width:100%;height:900px;object-fit:contain;background:#08291d;border-radius:8px"/>
  </div>
  <div style="flex:1;position:relative">
    <div style="position:absolute;top:-28px;left:8px;font-weight:700">LIVE</div>
    <img src="data:image/png;base64,${liveBuf.toString('base64')}" style="width:100%;height:900px;object-fit:contain;background:#08291d;border-radius:8px"/>
  </div>
  <div style="flex:1;position:relative">
    <div style="position:absolute;top:-28px;left:8px;font-weight:700">PACKAGE</div>
    <img src="data:image/png;base64,${pkgBuf.toString('base64')}" style="width:100%;height:900px;object-fit:contain;background:#08291d;border-radius:8px"/>
  </div>
</body></html>`;

const comp = await browser.newPage({ viewport: { width: 2200, height: 980 } });
await comp.setContent(html, { waitUntil: 'load' });
await comp.waitForTimeout(400);
await comp.screenshot({ path: 'demo-shots/alanad-products-side-by-side.png' });
fs.copyFileSync(
  'demo-shots/alanad-products-side-by-side.png',
  path.join(store, 'alanad-products-side-by-side.png'),
);
await comp.close();
await browser.close();
console.log('DONE');
