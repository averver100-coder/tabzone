import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

// -------------------------------------------------------------
// 1. Generate High-Fidelity Vector SVG
// -------------------------------------------------------------
function generateSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <!-- Background Canvas Soft Drop Shadow -->
    <filter id="shieldShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#000000" flood-opacity="0.32" />
    </filter>

    <!-- 3D Gold Emboss Shadow -->
    <filter id="goldEmboss" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#061224" flood-opacity="0.55" />
    </filter>

    <!-- Metallic Gold Outer Bevel Gradient -->
    <linearGradient id="goldOuterRim" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fae29c" />
      <stop offset="25%" stop-color="#dfb86e" />
      <stop offset="50%" stop-color="#be8c3b" />
      <stop offset="75%" stop-color="#dfba72" />
      <stop offset="100%" stop-color="#8a5c18" />
    </linearGradient>

    <!-- Inner Gold Lip Gradient -->
    <linearGradient id="goldInnerRim" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffd980" />
      <stop offset="40%" stop-color="#d4a34f" />
      <stop offset="100%" stop-color="#855416" />
    </linearGradient>

    <!-- Navy Shield Face Gradient (Left facet: slightly lit, Right facet: slightly deeper) -->
    <linearGradient id="navyFacetLeft" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#234674" />
      <stop offset="50%" stop-color="#183459" />
      <stop offset="100%" stop-color="#112540" />
    </linearGradient>

    <linearGradient id="navyFacetRight" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1a3457" />
      <stop offset="50%" stop-color="#122744" />
      <stop offset="100%" stop-color="#0b1a2e" />
    </linearGradient>

    <!-- Gold Emblem Metal Fill -->
    <linearGradient id="goldEmblem" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#fae097" />
      <stop offset="35%" stop-color="#e2b96f" />
      <stop offset="70%" stop-color="#c49340" />
      <stop offset="100%" stop-color="#91611c" />
    </linearGradient>

    <!-- Cursor Gradient with extra metallic luster -->
    <linearGradient id="goldCursor" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fff0b8" />
      <stop offset="40%" stop-color="#e8c27a" />
      <stop offset="80%" stop-color="#b8832c" />
      <stop offset="100%" stop-color="#73470f" />
    </linearGradient>
  </defs>

  <!-- Outer Shield Shadow & Thick Gold Rim -->
  <path d="M 256,44 L 400,78 L 400,276 C 400,366 338,426 256,468 C 174,426 112,366 112,276 L 112,78 Z"
        fill="url(#goldOuterRim)"
        filter="url(#shieldShadow)" />

  <!-- Inner Gold Bevel Contour -->
  <path d="M 256,58 L 388,89 L 388,272 C 388,354 330,412 256,450 C 182,412 124,354 124,272 L 124,89 Z"
        fill="#825418" />

  <path d="M 256,62 L 384,92 L 384,270 C 384,350 328,408 256,444 C 184,408 128,350 128,270 L 128,92 Z"
        fill="url(#goldInnerRim)" />

  <!-- Shield Navy Interior (Cut into left and right faceted halves for 3D creased lighting) -->
  <!-- Left Half -->
  <path d="M 256,72 L 138,100 L 138,266 C 138,342 190,396 256,432 Z"
        fill="url(#navyFacetLeft)" />

  <!-- Right Half -->
  <path d="M 256,72 L 374,100 L 374,266 C 374,342 322,396 256,432 Z"
        fill="url(#navyFacetRight)" />

  <!-- Subtle Center Vertical Spine Reflection -->
  <line x1="256" y1="72" x2="256" y2="432" stroke="#ffffff" stroke-width="1.5" stroke-opacity="0.12" />

  <!-- ======================================================== -->
  <!-- UPPER GRAPHIC: GOLD TABLET & CURSOR ARROW               -->
  <!-- ======================================================== -->
  <g filter="url(#goldEmboss)">
    <!-- Tablet Outer Shell (Landscape) -->
    <rect x="176" y="128" width="160" height="108" rx="16" ry="16"
          fill="none" stroke="url(#goldEmblem)" stroke-width="14" stroke-linejoin="round" />

    <!-- Left Camera Dot -->
    <circle cx="187" cy="182" r="3.5" fill="url(#goldEmblem)" />
    <!-- Right Sensor Dot -->
    <circle cx="325" cy="182" r="2.5" fill="url(#goldEmblem)" />

    <!-- Tablet Screen Inset Dark Navy -->
    <rect x="194" y="142" width="124" height="80" rx="6" ry="6"
          fill="#0c1828" fill-opacity="0.9" />

    <!-- Pointer Cursor Arrow (Gold 3D, pointing up-left into the screen) -->
    <path d="M 268,172 L 314,244 L 298,247 L 318,284 L 298,294 L 278,257 L 260,270 Z"
          fill="url(#goldCursor)"
          stroke="#73470f"
          stroke-width="2.5"
          stroke-linejoin="round" />
  </g>

  <!-- ======================================================== -->
  <!-- LOWER GRAPHIC: 3D EMBOSSED KOREAN "탭존"                -->
  <!-- ======================================================== -->
  <g filter="url(#goldEmboss)">
    <!-- ---------------- '탭' ---------------- -->
    <!-- 'ㅌ' (top-left) -->
    <rect x="164" y="278" width="10" height="54" rx="2" fill="url(#goldEmblem)" />
    <rect x="164" y="278" width="46" height="10" rx="2" fill="url(#goldEmblem)" />
    <rect x="164" y="300" width="42" height="10" rx="2" fill="url(#goldEmblem)" />
    <rect x="164" y="322" width="46" height="10" rx="2" fill="url(#goldEmblem)" />

    <!-- 'ㅐ' (top-right) -->
    <rect x="218" y="276" width="10" height="56" rx="2" fill="url(#goldEmblem)" />
    <rect x="226" y="299" width="16" height="10" rx="1" fill="url(#goldEmblem)" />
    <rect x="240" y="274" width="11" height="58" rx="2" fill="url(#goldEmblem)" />

    <!-- 'ㅂ' 받침 (bottom) -->
    <rect x="174" y="342" width="11" height="42" rx="2" fill="url(#goldEmblem)" />
    <rect x="230" y="342" width="11" height="42" rx="2" fill="url(#goldEmblem)" />
    <rect x="174" y="360" width="67" height="10" rx="1" fill="url(#goldEmblem)" />
    <rect x="174" y="374" width="67" height="10" rx="2" fill="url(#goldEmblem)" />

    <!-- ---------------- '존' ---------------- -->
    <!-- 'ㅈ' (top) -->
    <rect x="270" y="278" width="76" height="10" rx="2" fill="url(#goldEmblem)" />
    <path d="M 312,286 L 274,328 L 286,328 L 318,286 Z" fill="url(#goldEmblem)" />
    <path d="M 304,286 L 334,328 L 346,328 L 314,286 Z" fill="url(#goldEmblem)" />

    <!-- 'ㅗ' (middle) -->
    <rect x="303" y="328" width="10" height="18" rx="2" fill="url(#goldEmblem)" />
    <rect x="262" y="342" width="92" height="10" rx="2" fill="url(#goldEmblem)" />

    <!-- 'ㄴ' 받침 (bottom) -->
    <rect x="280" y="354" width="11" height="30" rx="2" fill="url(#goldEmblem)" />
    <rect x="280" y="374" width="62" height="10" rx="2" fill="url(#goldEmblem)" />
  </g>
</svg>`;
}

// -------------------------------------------------------------
// 2. Pure JS High-Quality Pixel Rasterizer for PNG Icons
// -------------------------------------------------------------
function pointInTriangle(px, py, ax, ay, bx, by, cx, cy) {
  const v0x = cx - ax, v0y = cy - ay;
  const v1x = bx - ax, v1y = by - ay;
  const v2x = px - ax, v2y = py - ay;
  const dot00 = v0x * v0x + v0y * v0y;
  const dot01 = v0x * v1x + v0y * v1y;
  const dot02 = v0x * v2x + v0y * v2y;
  const dot11 = v1x * v1x + v1y * v1y;
  const dot12 = v1x * v2x + v1y * v2y;
  const invDenom = 1 / (dot00 * dot11 - dot01 * dot01);
  const u = (dot11 * dot02 - dot01 * dot12) * invDenom;
  const v = (dot00 * dot12 - dot01 * dot02) * invDenom;
  return (u >= 0) && (v >= 0) && (u + v <= 1);
}

function renderPixel(nx, ny) {
  // Shield Boundary Math
  // Top peak: ny = -0.828 at nx = 0.
  // Shoulder: ny = -0.695 at nx = +-0.562.
  // Straight sides: down to ny = 0.078 at nx = +-0.562.
  // Curved sweep to bottom tip: from ny = 0.078 to ny = 0.828 at nx = 0.
  const absX = Math.abs(nx);
  let outerW = 0;
  if (ny < -0.828 || ny > 0.828) {
    outerW = 0;
  } else if (ny <= -0.695) {
    const t = (ny - (-0.828)) / (-0.695 - (-0.828));
    outerW = 0.562 * t;
  } else if (ny <= 0.078) {
    outerW = 0.562;
  } else {
    const t = (ny - 0.078) / (0.828 - 0.078);
    outerW = 0.562 * (1 - Math.pow(t, 1.45));
  }

  if (absX > outerW) {
    return [0, 0, 0, 0]; // Transparent
  }

  // Inner Shield Margin (Gold border thickness ~ 0.08)
  const borderThickness = 0.075;
  let innerW = 0;
  const innerTop = -0.745;
  const innerBottom = 0.745;
  if (ny < innerTop || ny > innerBottom) {
    innerW = 0;
  } else if (ny <= -0.63) {
    const t = (ny - innerTop) / (-0.63 - innerTop);
    innerW = (0.562 - borderThickness) * t;
  } else if (ny <= 0.05) {
    innerW = 0.562 - borderThickness;
  } else {
    const t = (ny - 0.05) / (innerBottom - 0.05);
    innerW = (0.562 - borderThickness) * (1 - Math.pow(t, 1.45));
  }

  const isGoldBorder = absX > innerW;

  // Gold Color Palette
  const getGoldColor = (lightFactor = 1.0) => {
    // Top-left illumination
    const grad = Math.max(0, Math.min(1, (1 - nx * 0.7 - ny * 0.7) / 2));
    const r = Math.floor((210 * (1 - grad) + 250 * grad) * lightFactor);
    const g = Math.floor((155 * (1 - grad) + 220 * grad) * lightFactor);
    const b = Math.floor((55 * (1 - grad) + 140 * grad) * lightFactor);
    return [Math.min(255, r), Math.min(255, g), Math.min(255, b), 255];
  };

  if (isGoldBorder) {
    // Beveled 3D rim shading
    const rimDist = outerW - absX;
    const bevel = rimDist < 0.02 ? 0.85 : rimDist > 0.055 ? 1.05 : 1.0;
    return getGoldColor(bevel);
  }

  // ==========================================
  // Inside Shield Navy Field
  // ==========================================
  // Check if pixel hits the Gold Emblem elements first!
  let isEmblemGold = false;

  // 1. Tablet Outer Frame (Landscape)
  // Box: -0.312 <= nx <= 0.312, -0.500 <= ny <= -0.078
  const inTabletOuter = (absX <= 0.312 && ny >= -0.500 && ny <= -0.078);
  const inTabletInner = (absX <= 0.242 && ny >= -0.445 && ny <= -0.133);
  if (inTabletOuter && !inTabletInner) {
    isEmblemGold = true;
  }

  // Left camera dot & right sensor dot
  if (Math.hypot(nx - (-0.27), ny - (-0.289)) <= 0.014 || Math.hypot(nx - 0.27, ny - (-0.289)) <= 0.010) {
    isEmblemGold = true;
  }

  // 2. Cursor Arrow
  // Polygon roughly: Tip (0.047, -0.328), Wing1 (0.226, -0.047), Notch1 (0.164, -0.035),
  // Tail (0.242, 0.109), Notch2 (0.164, 0.148), Notch3 (0.086, 0.004), Wing2 (0.015, 0.055)
  if (
    pointInTriangle(nx, ny, 0.047, -0.328, 0.226, -0.047, 0.015, 0.055) ||
    pointInTriangle(nx, ny, 0.086, 0.004, 0.242, 0.109, 0.164, 0.148)
  ) {
    isEmblemGold = true;
  }

  // 3. Korean Text: "탭존"
  // '탭' (nx: -0.36 to -0.04, ny: 0.086 to 0.500)
  // 'ㅌ': top-left
  if (nx >= -0.360 && nx <= -0.320 && ny >= 0.086 && ny <= 0.297) isEmblemGold = true; // left bar
  if (nx >= -0.360 && nx <= -0.180 && ny >= 0.086 && ny <= 0.125) isEmblemGold = true; // top bar
  if (nx >= -0.360 && nx <= -0.195 && ny >= 0.172 && ny <= 0.211) isEmblemGold = true; // mid bar
  if (nx >= -0.360 && nx <= -0.180 && ny >= 0.258 && ny <= 0.297) isEmblemGold = true; // bot bar

  // 'ㅐ': top-right
  if (nx >= -0.148 && nx <= -0.109 && ny >= 0.078 && ny <= 0.297) isEmblemGold = true; // stem 1
  if (nx >= -0.117 && nx <= -0.055 && ny >= 0.168 && ny <= 0.207) isEmblemGold = true; // cross
  if (nx >= -0.062 && nx <= -0.020 && ny >= 0.070 && ny <= 0.305) isEmblemGold = true; // stem 2

  // 'ㅂ': bottom 받침
  if (nx >= -0.320 && nx <= -0.277 && ny >= 0.336 && ny <= 0.500) isEmblemGold = true; // left stem
  if (nx >= -0.101 && nx <= -0.058 && ny >= 0.336 && ny <= 0.500) isEmblemGold = true; // right stem
  if (nx >= -0.320 && nx <= -0.058 && ny >= 0.406 && ny <= 0.445) isEmblemGold = true; // mid bar
  if (nx >= -0.320 && nx <= -0.058 && ny >= 0.461 && ny <= 0.500) isEmblemGold = true; // bot bar

  // '존' (nx: 0.039 to 0.360, ny: 0.086 to 0.500)
  // 'ㅈ': top
  if (nx >= 0.055 && nx <= 0.351 && ny >= 0.086 && ny <= 0.125) isEmblemGold = true; // top bar
  if (nx >= 0.100 && nx <= 0.300 && ny >= 0.117 && ny <= 0.281) {
    // diagonals
    const midX = 0.203;
    const distDiag1 = Math.abs((nx - 0.08) - (0.281 - ny) * 0.7);
    const distDiag2 = Math.abs((0.32 - nx) - (0.281 - ny) * 0.7);
    if (distDiag1 < 0.028 || distDiag2 < 0.028) isEmblemGold = true;
  }

  // 'ㅗ': middle
  if (nx >= 0.184 && nx <= 0.223 && ny >= 0.281 && ny <= 0.352) isEmblemGold = true; // vert stem
  if (nx >= 0.023 && nx <= 0.383 && ny >= 0.336 && ny <= 0.375) isEmblemGold = true; // horiz bar

  // 'ㄴ': bottom 받침
  if (nx >= 0.094 && nx <= 0.137 && ny >= 0.383 && ny <= 0.500) isEmblemGold = true; // left stem
  if (nx >= 0.094 && nx <= 0.336 && ny >= 0.461 && ny <= 0.500) isEmblemGold = true; // bot bar

  if (isEmblemGold) {
    return getGoldColor(1.08);
  }

  // Tablet Screen cutout (Extra dark navy)
  if (inTabletInner) {
    return [11, 22, 38, 255];
  }

  // Deep Royal Navy Field (Faceted lighting)
  if (nx < 0) {
    // Left facet: slightly illuminated navy (#1b3a62 to #132a48)
    const t = (ny + 0.8) / 1.6;
    const r = Math.floor(27 * (1 - t) + 19 * t);
    const g = Math.floor(58 * (1 - t) + 42 * t);
    const b = Math.floor(98 * (1 - t) + 72 * t);
    return [r, g, b, 255];
  } else {
    // Right facet: deeper navy (#132742 to #0a1728)
    const t = (ny + 0.8) / 1.6;
    const r = Math.floor(19 * (1 - t) + 10 * t);
    const g = Math.floor(39 * (1 - t) + 23 * t);
    const b = Math.floor(66 * (1 - t) + 40 * t);
    return [r, g, b, 255];
  }
}

// -------------------------------------------------------------
// 3. PNG Builder Engine with 2x2 Anti-Aliasing Supersampling
// -------------------------------------------------------------
function createPng(width, height) {
  const bytesPerPixel = 4;
  const stride = width * bytesPerPixel;
  const rawData = Buffer.alloc((stride + 1) * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * (stride + 1);
    rawData[rowOffset] = 0; // Filter None

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * bytesPerPixel;

      // 2x2 sub-pixel super-sampling for silky smooth anti-aliased edges
      let rSum = 0, gSum = 0, bSum = 0, aSum = 0;
      const subOffsets = [-0.25, 0.25];

      for (let sy = 0; sy < 2; sy++) {
        for (let sx = 0; sx < 2; sx++) {
          const subX = x + subOffsets[sx];
          const subY = y + subOffsets[sy];
          const nx = (subX - width / 2) / (width / 2);
          const ny = (subY - height / 2) / (height / 2);

          const col = renderPixel(nx, ny);
          rSum += col[0] * (col[3] / 255);
          gSum += col[1] * (col[3] / 255);
          bSum += col[2] * (col[3] / 255);
          aSum += col[3];
        }
      }

      const alphaAvg = aSum / 4;
      if (alphaAvg > 0) {
        rawData[pxOffset] = Math.round(rSum / 4 / (alphaAvg / 255));
        rawData[pxOffset + 1] = Math.round(gSum / 4 / (alphaAvg / 255));
        rawData[pxOffset + 2] = Math.round(bSum / 4 / (alphaAvg / 255));
        rawData[pxOffset + 3] = Math.round(alphaAvg);
      } else {
        rawData[pxOffset] = 0;
        rawData[pxOffset + 1] = 0;
        rawData[pxOffset + 2] = 0;
        rawData[pxOffset + 3] = 0;
      }
    }
  }

  const deflated = zlib.deflateSync(rawData);
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', deflated);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function makeChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(4 + 4 + len + 4);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4);
  data.copy(chunk, 8);

  const crcTable = getCrcTable();
  let crc = 0xffffffff;
  for (let i = 4; i < 8 + len; i++) {
    crc = crcTable[(crc ^ chunk[i]) & 0xff] ^ (crc >>> 8);
  }
  crc = (crc ^ 0xffffffff) >>> 0;
  chunk.writeUInt32BE(crc, 8 + len);
  return chunk;
}

let crcTableCache = null;
function getCrcTable() {
  if (crcTableCache) return crcTableCache;
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c >>> 0;
  }
  crcTableCache = table;
  return table;
}

// -------------------------------------------------------------
// 4. Output Generation (Public + Dist)
// -------------------------------------------------------------
const publicDir = path.resolve('./public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

console.log('1. Writing public/icon.svg...');
fs.writeFileSync(path.join(publicDir, 'icon.svg'), generateSvg());

console.log('2. Rendering 192x192 PNG (PWA Home Screen)...');
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createPng(192, 192));

console.log('3. Rendering 512x512 PNG (PWA Splash & Desktop Install)...');
const pwa512 = createPng(512, 512);
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), pwa512);
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), pwa512);

console.log('4. Rendering 180x180 PNG (Apple Touch Icon)...');
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createPng(180, 180));

console.log('5. Rendering 64x64 PNG (Favicon)...');
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), createPng(64, 64));

// Also sync to dist if present
const distDir = path.resolve('./dist');
if (fs.existsSync(distDir)) {
  fs.copyFileSync(path.join(publicDir, 'icon.svg'), path.join(distDir, 'icon.svg'));
  fs.copyFileSync(path.join(publicDir, 'pwa-192x192.png'), path.join(distDir, 'pwa-192x192.png'));
  fs.copyFileSync(path.join(publicDir, 'pwa-512x512.png'), path.join(distDir, 'pwa-512x512.png'));
  fs.copyFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), path.join(distDir, 'pwa-maskable-512x512.png'));
  fs.copyFileSync(path.join(publicDir, 'apple-touch-icon.png'), path.join(distDir, 'apple-touch-icon.png'));
  fs.copyFileSync(path.join(publicDir, 'favicon.ico'), path.join(distDir, 'favicon.ico'));
  console.log('Synced all new icons to dist/');
}

console.log('✅ Family-look shield logo successfully deployed to all PWA icon targets!');
