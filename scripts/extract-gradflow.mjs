import fs from 'fs';

const s = fs.readFileSync(
  new URL('../node_modules/gradflow/dist/index.mjs', import.meta.url),
  'utf8',
);

const outDir = new URL('../src/effects/glass-fold/_ref/', import.meta.url);
fs.mkdirSync(outDir, { recursive: true });

function extractBacktickAfter(src, needle) {
  const start = src.indexOf(needle);
  if (start < 0) return null;
  const tick = src.indexOf('`', start + needle.length - 1);
  if (tick < 0) return null;
  let i = tick + 1;
  let out = '';
  while (i < src.length) {
    const ch = src[i];
    if (ch === '`') break;
    // keep content as-is (real newlines inside template literals)
    out += ch;
    i += 1;
  }
  return out;
}

const vert = extractBacktickAfter(s, 'var re=`') || extractBacktickAfter(s, ',re=`');
const frag = extractBacktickAfter(s, ',ae=`') || extractBacktickAfter(s, 'var ae=`');

fs.writeFileSync(new URL('vertex.glsl', outDir), vert || '');
fs.writeFileSync(new URL('fragment.glsl', outDir), frag || '');

console.log({ vertLen: vert?.length, fragLen: frag?.length });
if (frag) {
  for (const needle of ['== 14.0', '== 15.0', '==14', '==15', 'uType', 'type ==', 'fold', 'glass']) {
    const i = frag.indexOf(needle);
    console.log(needle, i);
    if (i >= 0) console.log('---\n' + frag.slice(Math.max(0, i - 80), i + 500) + '\n---');
  }
  fs.writeFileSync(new URL('fragment-head.txt', outDir), frag.slice(0, 1500));
}
