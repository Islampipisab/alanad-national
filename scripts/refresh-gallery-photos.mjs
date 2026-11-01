/**
 * Build landscape-friendly gallery photos (1600×900).
 * Download whole-subject Unsplash stills (no forced crop), then contain+pad
 * into a 16:9 frame so produce is fully visible and centered.
 */
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import products from '../src/data/products.json' with { type: 'json' };

const OUT = path.resolve('public/img/gallery');
const SRC = path.resolve('public/img/products');
const TMP = path.resolve('public/img/gallery/_tmp');
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(TMP, { recursive: true });

const u = (id) =>
  `https://images.unsplash.com/${id}?auto=format&fit=max&w=1600&q=80`;

/** Curated whole-produce stills — room around subject, not macros */
const UNSPLASH = {
  tomato: u('photo-1592924357228-91a4daadcfea'),
  cucumber: u('photo-1449300079323-02e209e9ecd9'),
  potato: u('photo-1518977676601-b53f82aba655'),
  onion: u('photo-1508747703725-719777637510'),
  'red-onion': u('photo-1518977822534-7049a61ee0c2'),
  carrot: u('photo-1598170845058-32b9d6a5da37'),
  zucchini: u('photo-1558818498-28c1e002b655'),
  eggplant: u('photo-1659261233947-ea21f7b85079'),
  'green-pepper': u('photo-1563565375-f3fdfdbefa83'),
  'red-pepper': u('photo-1518975959392-5d1ad616bbb5'),
  chili: u('photo-1588252303782-cb80119abd40'),
  'sweet-potato': u('photo-1596097635848-1daa8576284a'),
  broccoli: u('photo-1459411621453-7b048ed0287f'),
  cauliflower: u('photo-1568584711075-3d921d51c5c0'),
  corn: u('photo-1551754655-cd27e38d047f'),
  garlic: u('photo-1540148426940-15e7fce23e80'),
  ginger: u('photo-1615485290382-441e4d049cb5'),
  cabbage: u('photo-1594282486552-05b4d80bff25'),
  'red-cabbage': u('photo-1615485925678-791a6541cb1a'),
  beetroot: u('photo-1593105540291'),
  radish: u('photo-1598880940080-ff9a29891b85'),
  turnip: u('photo-1594282486552-05b4d80bff25'),
  pumpkin: u('photo-1570586437263-ab629fccc919'),
  okra: u('photo-1628773822503-930a7eaecf80'),
  'green-beans': u('photo-1567375698348-5d26d4e6e8a6'),
  peas: u('photo-1597362920021-5732855fb085'),
  celery: u('photo-1584270354949-c26b0d5b4a0c'),
  leek: u('photo-1607305386624-54e1ea2951bd'),
  mushroom: u('photo-1504545102780-26774c1bb073'),
  'spring-onion': u('photo-1607305386624-54e1ea2951bd'),
  artichoke: u('photo-1628773822503-930a7eaecf80'),
  asparagus: u('photo-1515471209610-dae1c92d8775'),
  lettuce: u('photo-1622205313162-be1d5712a43f'),
  romaine: u('photo-1622205313162-be1d5712a43f'),
  rocket: u('photo-1576045057995-568f588f82fb'),
  parsley: u('photo-1615485500704-a142bb7f0c1b'),
  mint: u('photo-1628556270448-4d4e4148e1b1'),
  spinach: u('photo-1576045057995-568f588f82fb'),
  coriander: u('photo-1615485500704-a142bb7f0c1b'),
  dill: u('photo-1615485500704-a142bb7f0c1b'),
  basil: u('photo-1618375569909-3c8616cf7733'),
  chard: u('photo-1576045057995-568f588f82fb'),
  molokhia: u('photo-1576045057995-568f588f82fb'),
  kale: u('photo-1524179091875-bf99a9a6af57'),
  apple: u('photo-1568702846914-96b305d2aaeb'),
  'green-apple': u('photo-1619546813926-a78fa6372cd2'),
  orange: u('photo-1547514701-4278210174d1'),
  mandarin: u('photo-1547514701-4278210174d1'),
  lemon: u('photo-1590502593747-42a996133562'),
  lime: u('photo-1590502593747-42a996133562'),
  grapefruit: u('photo-1577234286642-fc512a5f8f11'),
  'green-grapes': u('photo-1596363508106-8315a7a04573'),
  'red-grapes': u('photo-1537640538966-79f369143f8f'),
  banana: u('photo-1571771894821-ce9b6c11b08e'),
  strawberry: u('photo-1464965911861-746a04b4bca6'),
  pomegranate: u('photo-1606491956689-2ea866880c84'),
  mango: u('photo-1553279768-865429fa0078'),
  peach: u('photo-1629828874514-c1d885903962'),
  nectarine: u('photo-1629828874514-c1d885903962'),
  plum: u('photo-1604754742629-3e5725649d18'),
  apricot: u('photo-1629828874514-c1d885903962'),
  pear: u('photo-1514756331096-242fdeb70d4a'),
  kiwi: u('photo-1611080626919-7cf5a9dbab5b'),
  watermelon: u('photo-1589985270826-4a157963b0c1'),
  cantaloupe: u('photo-1571575173700-afb9492e6a50'),
  pineapple: u('photo-1550258987-190a2d41a8ba'),
  papaya: u('photo-1617112848923-cc231f89ee1c'),
  guava: u('photo-1536511132770-e5058c0e74e0'),
  fig: u('photo-1601379327928-bedfaf9da2d0'),
  cherry: u('photo-1528821128474-27f963b062bf'),
  avocado: u('photo-1523049673857-eb18f1d7b578'),
  blueberry: u('photo-1498557850523-fd3d118b962e'),
  dates: u('photo-1605027990121-cbaad9db2132'),
  coconut: u('photo-1580980379271-4f859a77ea9c'),
  'dragon-fruit': u('photo-1527325678964-54921661f888'),
};

async function download(url, dest) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'alanad-gallery-refresh/1.1' },
    redirect: 'follow',
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 4000) throw new Error(`too small ${buf.length}`);
  fs.writeFileSync(dest, buf);
  return buf.length;
}

function padWithPowershell(src, dest, pad = 0.82) {
  const ps = `
Add-Type -AssemblyName System.Drawing
$ErrorActionPreference = 'Stop'
$src = [System.Drawing.Image]::FromFile('${src.replace(/\\/g, '\\\\')}')
$w = 1600; $h = 900
$bmp = New-Object System.Drawing.Bitmap $w, $h
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.Clear([System.Drawing.Color]::FromArgb(255, 8, 41, 29))
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$pad = ${pad}
$scale = [Math]::Min(($w * $pad) / $src.Width, ($h * $pad) / $src.Height)
$dw = [int]($src.Width * $scale)
$dh = [int]($src.Height * $scale)
$dx = [int](($w - $dw) / 2)
$dy = [int](($h - $dh) / 2)
$g.DrawImage($src, $dx, $dy, $dw, $dh)
$enc = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
$ep = New-Object System.Drawing.Imaging.EncoderParameters 1
$ep.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter ([System.Drawing.Imaging.Encoder]::Quality, 88L)
$bmp.Save('${dest.replace(/\\/g, '\\\\')}', $enc, $ep)
$g.Dispose(); $bmp.Dispose(); $src.Dispose()
Write-Output 'ok'
`;
  const r = spawnSync('powershell', ['-NoProfile', '-Command', ps], {
    encoding: 'utf8',
    maxBuffer: 4 * 1024 * 1024,
  });
  if (r.status !== 0) throw new Error((r.stderr || r.stdout || 'pad failed').slice(0, 400));
}

const slugs = products.map((p) => p.slug);
let ok = 0;
let paddedOnly = 0;
let failed = 0;

for (const slug of slugs) {
  const dest = path.join(OUT, `${slug}.jpg`);
  const srcProduct = path.join(SRC, `${slug}.jpg`);
  const tmp = path.join(TMP, `${slug}.jpg`);
  try {
    let sourcePath = null;
    if (UNSPLASH[slug]) {
      try {
        const n = await download(UNSPLASH[slug], tmp);
        console.log('DL', slug, n);
        sourcePath = tmp;
      } catch (e) {
        console.warn('DL_FAIL', slug, e.message);
      }
    }
    if (!sourcePath && fs.existsSync(srcProduct)) {
      sourcePath = srcProduct;
      console.log('SRC', slug);
    }
    if (!sourcePath) {
      console.warn('MISS', slug);
      failed++;
      continue;
    }
    padWithPowershell(sourcePath, dest, 0.82);
    if (sourcePath === srcProduct) paddedOnly++;
    else ok++;
    console.log('PAD', slug);
  } catch (e) {
    console.warn('ERR', slug, e.message);
    failed++;
  }
}

try {
  fs.rmSync(TMP, { recursive: true, force: true });
} catch {
  /* ignore */
}

console.log(JSON.stringify({ ok, paddedOnly, failed, out: OUT }));
