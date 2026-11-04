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
await page.waitForTimeout(1500);
await page.evaluate(() => {
  document.querySelector('#preloader')?.remove();
  document.querySelectorAll('[data-reveal], .hero__content, .hero__brand-float, .hero__stats').forEach((el) => {
    el.style.opacity = '1';
    el.style.transform = 'none';
    el.style.visibility = 'visible';
  });
});

// Let the float video buffer a couple frames
await page.waitForTimeout(2200);

const heroInfo = await page.evaluate(() => {
  const v = document.querySelector('#heroProduceVideo');
  const host = document.querySelector('.hero__brand-float');
  const src = v?.querySelector('source')?.getAttribute('src') || v?.currentSrc || v?.src;
  return {
    src,
    muted: v?.muted,
    playsInline: v?.playsInline,
    poster: v?.getAttribute('poster'),
    blend: host ? getComputedStyle(host.classList.contains('is-video-fallback') ? v : host).mixBlendMode : null,
    videoBlend: v ? getComputedStyle(v).mixBlendMode : null,
    fallback: host?.classList.contains('is-video-fallback'),
    readyState: v?.readyState,
    videoWidth: v?.videoWidth,
    videoHeight: v?.videoHeight,
  };
});
console.log('HERO', JSON.stringify(heroInfo, null, 2));

await page.screenshot({ path: 'demo-shots/alanad-hero-video-swap-ar.png', fullPage: false });
fs.copyFileSync('demo-shots/alanad-hero-video-swap-ar.png', path.join(store, 'alanad-hero-video-swap-ar.png'));
fs.copyFileSync('demo-shots/alanad-hero-video-swap-ar.png', path.join(store, 'alanad-hero-ar.png'));
fs.copyFileSync('demo-shots/alanad-hero-video-swap-ar.png', path.join(store, 'alanad-hero-produce-ar.png'));

// Products: confirm arrows gone + wheel advances + dots remain
const section = page.locator('#products');
await section.scrollIntoViewIfNeeded();
await page.waitForTimeout(600);
await page.evaluate(() => {
  document.querySelector('#produceSlider .autoplay-toggle')?.click();
  document.querySelector('#produceSlider .pagination button.is-active')?.click();
});
await page.waitForTimeout(900);

const arrowCount = await page.locator('#produceSlider .nav-arrow, #products .nav-arrow').count();
const dotCount = await page.locator('#produceSlider .pagination button').count();

const before = await page.evaluate(() => ({
  title: document.querySelector('#produceSlider .active-copy h3')?.textContent?.trim(),
  count: document.querySelector('#produceSlider .slide-count')?.textContent?.replace(/\s+/g, ' ').trim(),
  cursor: getComputedStyle(document.querySelector('#produceSlider .slider-stage')).cursor,
}));

const box = await page.locator('#produceSlider .slider-stage').boundingBox();
await page.mouse.move(box.x + box.width * 0.45, box.y + box.height * 0.45);
await page.mouse.wheel(120, 0);
await page.waitForTimeout(1100);

const afterWheel = await page.evaluate(() => ({
  title: document.querySelector('#produceSlider .active-copy h3')?.textContent?.trim(),
  count: document.querySelector('#produceSlider .slide-count')?.textContent?.replace(/\s+/g, ' ').trim(),
}));

const productsOut = 'demo-shots/alanad-remove-arrow-buttons.png';
const secBox = await section.boundingBox();
await page.screenshot({
  path: productsOut,
  clip: {
    x: Math.max(0, secBox.x),
    y: Math.max(0, secBox.y),
    width: Math.min(secBox.width, 1440),
    height: Math.min(secBox.height, 1200),
  },
});
fs.copyFileSync(productsOut, path.join(store, 'alanad-remove-arrow-buttons.png'));
fs.copyFileSync(productsOut, path.join(store, 'alanad-products-glass-ar.png'));

const pass = {
  heroSrcOk: String(heroInfo.src || '').includes('3aac0fe1'),
  muted: !!heroInfo.muted,
  playsInline: !!heroInfo.playsInline,
  poster: !!heroInfo.poster,
  screenBlend: heroInfo.videoBlend === 'screen' || heroInfo.blend === 'screen',
  noArrows: arrowCount === 0,
  hasDots: dotCount > 0,
  wheelAdvanced: before.count !== afterWheel.count,
  notGrab: before.cursor !== 'grab' && before.cursor !== 'grabbing',
};

console.log(JSON.stringify({ before, afterWheel, arrowCount, dotCount, pass }, null, 2));
await browser.close();

if (!Object.values(pass).every(Boolean)) {
  console.error('VERIFY FAILED', pass);
  process.exit(1);
}
console.log('VERIFY OK');
