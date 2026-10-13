import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createPng(width, height) {
  const bytesPerPixel = 4;
  const stride = width * bytesPerPixel;
  const rawData = Buffer.alloc((stride + 1) * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * (stride + 1);
    rawData[rowOffset] = 0; // Filter type 0 (None)

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * bytesPerPixel;
      
      // Normalized coordinates from center (-1 to 1)
      const nx = (x - width / 2) / (width / 2);
      const ny = (y - height / 2) / (height / 2);
      
      // Shield geometry check:
      // top curved, sides tapers to point at bottom
      const shieldTop = -0.85;
      const shieldBottom = 0.9;
      let inShield = false;
      
      if (ny >= shieldTop && ny <= shieldBottom) {
        let maxWidth = 0.85;
        if (ny > 0) {
          // taper towards bottom point
          const t = ny / shieldBottom;
          maxWidth = 0.85 * (1 - Math.pow(t, 1.8));
        } else {
          // slight curvature at top
          const topCurve = Math.cos(nx * Math.PI * 0.8) * 0.08;
          if (ny < shieldTop + topCurve) {
            maxWidth = 0;
          }
        }
        if (Math.abs(nx) <= maxWidth) {
          inShield = true;
        }
      }

      if (inShield) {
        // Gradient color: Blue to Cyan
        const gradT = (ny + 0.85) / 1.75;
        const r = Math.floor(30 * (1 - gradT) + 2 * gradT);
        const g = Math.floor(58 * (1 - gradT) + 132 * gradT);
        const b = Math.floor(138 * (1 - gradT) + 199 * gradT);

        // Inner tablet device rect
        const inTablet = (Math.abs(nx) < 0.45 && ny > -0.4 && ny < 0.45);
        const inScreen = (Math.abs(nx) < 0.38 && ny > -0.32 && ny < 0.35);

        if (inScreen) {
          // Dark screen with blue glow
          rawData[pxOffset] = 15;
          rawData[pxOffset + 1] = 23;
          rawData[pxOffset + 2] = 42;
          rawData[pxOffset + 3] = 255;
        } else if (inTablet) {
          // White/Silver tablet bezel
          rawData[pxOffset] = 240;
          rawData[pxOffset + 1] = 244;
          rawData[pxOffset + 2] = 248;
          rawData[pxOffset + 3] = 255;
        } else {
          // Shield surface
          rawData[pxOffset] = r;
          rawData[pxOffset + 1] = g;
          rawData[pxOffset + 2] = b;
          rawData[pxOffset + 3] = 255;
        }
      } else {
        // Transparent
        rawData[pxOffset] = 0;
        rawData[pxOffset + 1] = 0;
        rawData[pxOffset + 2] = 0;
        rawData[pxOffset + 3] = 0;
      }
    }
  }

  const deflated = zlib.deflateSync(rawData);

  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

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

const publicDir = path.resolve('./public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createPng(192, 192));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), createPng(512, 512));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), createPng(512, 512));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createPng(180, 180));
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), createPng(64, 64));

console.log('Icons generated successfully in public/');
