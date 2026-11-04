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
await page.waitForTimeout(1200);
await page.evaluate(() => {
  document.querySelector('#preloader')?.remove();
  document.querySelectorAll('[data-reveal], .hero__content, .hero__brand-float, .hero__stats').forEach((el) => {
    el.style.opacity = '1';
    el.style.transform = 'none';
    el.style.visibility = 'visible';
  });
});

// Wait for keyed canvas to paint a few frames
await page.waitForFunction(() => {
  const v = document.querySelector('#heroProduceVideo');
  return v && v.readyState >= 2 && v.videoWidth > 0;
}, { timeout: 20000 });
await page.waitForTimeout(2500);

const info = await page.evaluate(() => {
  const host = document.querySelector('.hero__brand-float');
  const v = document.querySelector('#heroProduceVideo');
  const c = document.querySelector('#heroProduceKey');
  const src = v?.querySelector('source')?.getAttribute('src') || v?.currentSrc || '';
  let sample = null;
  try {
    const gl = c?.getContext('webgl2') || c?.getContext('webgl');
    if (gl && c) {
      const px = new Uint8Array(4);
      gl.readPixels((c.width / 2) | 0, (c.height / 2) | 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
      sample = [...px];
    }
  } catch (e) {
    sample = String(e);
  }
  // Corner should be near-transparent (keyed black plate)
  let corner = null;
  try {
    const gl = c?.getContext('webgl2') || c?.getContext('webgl');
    if (gl && c) {
      const px = new Uint8Array(4);
      gl.readPixels(2, 2, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
      corner = [...px];
    }
  } catch (e) {
    corner = String(e);
  }
  return {
    src,
    keyed: host?.classList.contains('is-keyed'),
    fallback: host?.classList.contains('is-video-fallback'),
    canvasHidden: c?.hidden,
    videoOpacity: v ? getComputedStyle(v).opacity : null,
    canvasDisplay: c ? getComputedStyle(c).display : null,
    centerPixel: sample,
    cornerPixel: corner,
    videoSize: { w: v?.videoWidth, h: v?.videoHeight },
  };
});
console.log(JSON.stringify(info, null, 2));

const out = 'demo-shots/alanad-hero-key-ar.png';
await page.screenshot({ path: out, fullPage: false });
fs.copyFileSync(out, path.join(store, 'alanad-hero-key-ar.png'));
fs.copyFileSync(out, path.join(store, 'alanad-hero-ar.png'));
fs.copyFileSync(out, path.join(store, 'alanad-hero-produce-ar.png'));
fs.copyFileSync(out, path.join(store, 'alanad-hero-video-swap-ar.png'));

await browser.close();

const cornerA = Array.isArray(info.cornerPixel) ? info.cornerPixel[3] : 255;
const pass = {
  srcOk: String(info.src).includes('3aac0fe1'),
  keyed: !!info.keyed,
  notFallback: !info.fallback,
  videoHidden: info.videoOpacity === '0',
  cornerTransparent: cornerA < 40,
};
console.log('PASS', pass);
if (!Object.values(pass).every(Boolean)) {
  console.error('KEY VERIFY FAILED', pass);
  process.exit(1);
}
console.log('KEY VERIFY OK');
