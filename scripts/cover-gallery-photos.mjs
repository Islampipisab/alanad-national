/**
 * Rebuild public/img/gallery as true 1600×900 cover crops (no letterbox matte).
 * Prefers Unsplash landscape downloads when available; else cover-crops products.
 */
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import products from '../src/data/products.json' with { type: 'json' };

const OUT = path.resolve('public/img/gallery');
const SRC = path.resolve('public/img/products');
fs.mkdirSync(OUT, { recursive: true });

function coverWithPowershell(src, dest) {
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
# Cover: scale to fill, center-crop
$scale = [Math]::Max($w / $src.Width, $h / $src.Height)
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
  if (r.status !== 0) throw new Error((r.stderr || r.stdout || 'cover failed').slice(0, 400));
}

let ok = 0;
let failed = 0;
for (const p of products) {
  const src = path.join(SRC, `${p.slug}.jpg`);
  const dest = path.join(OUT, `${p.slug}.jpg`);
  if (!fs.existsSync(src)) {
    console.warn('MISS', p.slug);
    failed++;
    continue;
  }
  try {
    coverWithPowershell(src, dest);
    ok++;
    console.log('COVER', p.slug);
  } catch (e) {
    console.warn('ERR', p.slug, e.message);
    failed++;
  }
}
console.log(JSON.stringify({ ok, failed, out: OUT }));
