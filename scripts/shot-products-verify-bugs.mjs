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

await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle', timeout: 60000 });
await page.evaluate(() => localStorage.setItem('lang', 'ar'));
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(1000);
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
await page.waitForTimeout(600);
await page.evaluate(() => {
  document.querySelector('#produceSlider .autoplay-toggle')?.click();
  document.querySelector('#produceSlider .pagination button[data-go="0"]')?.click();
});
await page.waitForTimeout(900);

await page.waitForFunction(() => {
  const img = document.querySelector('#produceSlider .active-slide .produce-shot');
  return img && img.complete && img.naturalWidth > 0;
}, { timeout: 10000 }).catch(() => {});

const verify = await page.evaluate(() => {
  const stage = document.querySelector('#produceSlider .slider-stage');
  const active = document.querySelector('#produceSlider .active-slide');
  const copy = active?.querySelector('.active-copy');
  const left = document.querySelector('#produceSlider .side-slide[data-slot="0"]');
  const right = document.querySelector('#produceSlider .side-slide[data-slot="2"]');
  const pagination = document.querySelector('#produceSlider .pagination');
  const stageR = stage.getBoundingClientRect();
  const a = active.getBoundingClientRect();
  const c = copy.getBoundingClientRect();
  const l = left.getBoundingClientRect();
  const r = right.getBoundingClientRect();

  const overlaps = (A, B) =>
    !(A.right <= B.left || A.left >= B.right || A.bottom <= B.top || A.top >= B.bottom);

  const centerDelta = Math.abs((a.left + a.right) / 2 - (stageR.left + stageR.right) / 2);
  const leftPeek = a.left - l.left;
  const rightPeek = r.right - a.right;
  const peekBalance = Math.abs(leftPeek - rightPeek);

  const csPag = getComputedStyle(pagination);
  const scrollbarH = pagination.offsetHeight - pagination.clientHeight;
  const webkitHidden =
    csPag.getPropertyValue('scrollbar-width') === 'none' ||
    pagination.scrollWidth > pagination.clientWidth;

  // Hit-test copy panel: topmost element must belong to active card, not a peek
  const samplePoints = [
    [c.left + c.width * 0.5, c.top + c.height * 0.35],
    [c.left + c.width * 0.5, c.top + c.height * 0.55],
    [c.left + c.width * 0.72, c.top + c.height * 0.45],
    [c.left + 12, c.top + c.height * 0.5],
  ];
  const hitTests = samplePoints.map(([x, y]) => {
    const el = document.elementFromPoint(x, y);
    return {
      x: Math.round(x),
      y: Math.round(y),
      tag: el?.tagName,
      cls: el?.className?.toString?.()?.slice?.(0, 60),
      inActive: !!(el && active.contains(el)),
      inCopy: !!(el && copy.contains(el)),
      inRight: !!(el && right.contains(el)),
      inLeft: !!(el && left.contains(el)),
    };
  });
  const copyHitSafe = hitTests.every((h) => h.inActive && !h.inRight && !h.inLeft);
  const geomRightOverlap = overlaps(r, c);
  const geomLeftOverlap = overlaps(l, c);

  return {
    title: copy.querySelector('h3')?.textContent?.trim(),
    type: copy.querySelector('.product-type, .copy-kicker')?.textContent?.trim(),
    count: copy.querySelector('.slide-count')?.textContent?.replace(/\s+/g, ' ').trim(),
    dots: pagination.querySelectorAll('button').length,
    // Bug 1
    centerDelta: Math.round(centerDelta),
    leftPeek: Math.round(leftPeek),
    rightPeek: Math.round(rightPeek),
    peekBalance: Math.round(peekBalance),
    activeWidth: Math.round(a.width),
    stageWidth: Math.round(stageR.width),
    // Bug 2
    pagOverflowX: csPag.overflowX,
    scrollbarWidthProp: csPag.scrollbarWidth,
    scrollbarH,
    pagScrollWidth: pagination.scrollWidth,
    pagClientWidth: pagination.clientWidth,
    // Bug 3
    activeZ: getComputedStyle(active).zIndex,
    copyZ: getComputedStyle(copy).zIndex,
    leftZ: getComputedStyle(left).zIndex,
    rightZ: getComputedStyle(right).zIndex,
    geomRightOverlap,
    geomLeftOverlap,
    copyHitSafe,
    hitTests,
    stageOverflow: getComputedStyle(stage).overflow,
    stagePreserve3d: getComputedStyle(stage).transformStyle,
  };
});

// Title glyph hit-test: every sample must land in active copy, never peek card
const titleHits = await page.evaluate(() => {
  const active = document.querySelector('#produceSlider .active-slide');
  const copy = active.querySelector('.active-copy');
  const h3 = copy.querySelector('h3');
  const right = document.querySelector('#produceSlider .side-slide[data-slot="2"]');
  const left = document.querySelector('#produceSlider .side-slide[data-slot="0"]');
  const hr = h3.getBoundingClientRect();
  const out = [];
  for (let i = 0; i < 10; i++) {
    const x = hr.left + hr.width * (0.08 + i * 0.09);
    const y = hr.top + hr.height * 0.55;
    const el = document.elementFromPoint(x, y);
    out.push({
      inCopy: !!(el && copy.contains(el)),
      inRight: !!(el && right.contains(el)),
      inLeft: !!(el && left.contains(el)),
    });
  }
  const cr = copy.getBoundingClientRect();
  const rr = right.getBoundingClientRect();
  const lr = left.getBoundingClientRect();
  return {
    titleSafe: out.every((p) => p.inCopy && !p.inRight && !p.inLeft),
    samples: out,
    gapRight: Math.round(rr.left - cr.right),
    gapLeft: Math.round(cr.left - lr.right),
  };
});
console.log('titleHits', JSON.stringify(titleHits));

const pass = {
  bug1_centered: verify.centerDelta <= 8,
  bug1_balanced: verify.peekBalance <= 40,
  bug2_noScrollbar:
    verify.scrollbarH === 0 &&
    verify.pagScrollWidth <= verify.pagClientWidth + 1,
  bug3_copyOnTop: verify.copyHitSafe === true && titleHits.titleSafe === true,
  bug3_zOrder: Number(verify.activeZ) > Number(verify.rightZ),
  bug3_noGeomCover: titleHits.gapRight >= 0 && titleHits.gapLeft >= -20,
};

console.log(JSON.stringify({ verify, pass }, null, 2));

await page.evaluate(() => {
  document.documentElement.classList.add('reduced');
  document.querySelectorAll('#produceSlider, #produceSlider *').forEach((el) => {
    el.style.animation = 'none';
    el.style.transition = 'none';
  });
});
await page.waitForTimeout(150);

const box = await section.boundingBox();
const out = 'demo-shots/alanad-products-glass-ar.png';
if (box) {
  await page.screenshot({
    path: out,
    clip: {
      x: Math.max(0, box.x),
      y: Math.max(0, box.y),
      width: Math.min(box.width, 1440),
      height: Math.min(box.height, 1200),
    },
  });
}
fs.copyFileSync(out, path.join(store, 'alanad-products-glass-ar.png'));
fs.copyFileSync(out, path.join(store, 'alanad-three-carousel-bugs-fixed.png'));
console.log('wrote shots');

const allPass = Object.values(pass).every(Boolean);
await browser.close();
if (!allPass) {
  console.error('VERIFICATION FAILED', pass);
  process.exit(1);
}
console.log('ALL THREE BUGS VERIFIED FIXED');
