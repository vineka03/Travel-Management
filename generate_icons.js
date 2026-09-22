import fs from 'fs';
import zlib from 'zlib';

// Simple CRC32 implementation for PNG chunks
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) c = 0xedb88320 ^ (c >>> 1);
    else c = c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function createChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);

  const crcBody = Buffer.concat([typeBuf, data]);
  const crcVal = crc32(crcBody);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crcVal, 0);

  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function createPNG(width, height, pixelShader) {
  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // Bit depth: 8 bits per channel
  ihdrData[9] = 6; // Color type: 6 (RGBA)
  ihdrData[10] = 0; // Compression method
  ihdrData[11] = 0; // Filter method
  ihdrData[12] = 0; // Interlace method
  const ihdrChunk = createChunk('IHDR', ihdrData);

  // Raw image data with 0 filter byte per scanline
  const rawData = Buffer.alloc((width * 4 + 1) * height);
  let offset = 0;

  for (let y = 0; y < height; y++) {
    rawData[offset++] = 0; // filter type 0 (None)
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = pixelShader(x, y, width, height);
      rawData[offset++] = r;
      rawData[offset++] = g;
      rawData[offset++] = b;
      rawData[offset++] = a;
    }
  }

  // Compress IDAT with zlib
  const compressed = zlib.deflateSync(rawData);
  const idatChunk = createChunk('IDAT', compressed);

  // IEND
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Distance helper
function dist(x1, y1, x2, y2) {
  return Math.hypot(x1 - x2, y1 - y2);
}

// Shader for regular & apple touch icon
// Background: Vibrant travel gradient from #0984e3 to #00cec9 or #0c2461
function createTravelIconShader(isMaskable, isApple) {
  return (x, y, w, h) => {
    const nx = x / w; // 0 to 1
    const ny = y / h; // 0 to 1
    const cx = w / 2;
    const cy = h / 2;
    const dCenter = dist(x, y, cx, cy);
    const radius = w / 2;

    // Base background gradient: Deep sky blue to rich cyan/navy
    const bgR = Math.round(9 + (12 - 9) * ny);
    const bgG = Math.round(132 + (36 - 132) * ny);
    const bgB = Math.round(227 + (97 - 227) * ny);

    let alpha = 255;

    // If regular icon (not maskable and not apple), add rounded corners
    if (!isMaskable && !isApple) {
      const cornerRadius = w * 0.22;
      const qx = Math.max(0, Math.abs(x - cx) - (cx - cornerRadius));
      const qy = Math.max(0, Math.abs(y - cy) - (cy - cornerRadius));
      const cornerDist = Math.hypot(qx, qy);
      if (cornerDist > cornerRadius) {
        return [0, 0, 0, 0];
      }
      if (cornerDist > cornerRadius - 1) {
        alpha = Math.round((cornerRadius - cornerDist) * 255);
      }
    }

    // Scale factor for graphic: Maskable icons need 15% safe zone margin
    const scale = isMaskable ? 0.72 : 0.85;

    // Transform coordinates relative to center and scaled
    const tx = (x - cx) / (scale * (w / 2)); // -1 to 1
    const ty = (y - cy) / (scale * (h / 2)); // -1 to 1

    // 1. Globe latitude/longitude subtle rings
    const rGlobe = Math.hypot(tx, ty);
    let globeRing = false;
    if (rGlobe > 0.75 && rGlobe < 0.82) {
      globeRing = true;
    }
    // Horizontal equator & latitude curve
    if (rGlobe <= 0.8 && Math.abs(ty - 0.25) < 0.04 && Math.abs(tx) < 0.75) {
      globeRing = true;
    }
    if (rGlobe <= 0.8 && Math.abs(ty + 0.25) < 0.04 && Math.abs(tx) < 0.75) {
      globeRing = true;
    }
    // Meridian ellipse
    const meridianVal = Math.pow(tx / 0.38, 2) + Math.pow(ty / 0.8, 2);
    if (meridianVal > 0.85 && meridianVal < 1.15 && rGlobe <= 0.82) {
      globeRing = true;
    }

    // 2. Airplane shape soaring diagonally up-right (-35 deg)
    // Rotate coords by 35 deg:
    const angle = 38 * (Math.PI / 180);
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);
    const rx = tx * cosA + ty * sinA;
    const ry = -tx * sinA + ty * cosA;

    // Plane fuselage & wings in rotated space:
    // Nose at rx = 0.55, ry = 0; Tail at rx = -0.65, ry = 0
    let isPlane = false;

    // Main fuselage (capsule)
    if (rx >= -0.55 && rx <= 0.5) {
      const fuselageWidth = 0.11 * (1 - Math.pow(rx / 0.65, 2));
      if (Math.abs(ry) <= Math.max(0.04, fuselageWidth)) {
        isPlane = true;
      }
    }

    // Cockpit nose cone
    if (rx > 0.5 && rx <= 0.62) {
      const tNose = (rx - 0.5) / 0.12;
      if (Math.abs(ry) <= (1 - tNose) * 0.07) {
        isPlane = true;
      }
    }

    // Main wings
    if (rx >= -0.15 && rx <= 0.22) {
      const wingProgress = (0.22 - rx) / 0.37;
      const wingSpan = 0.55 * wingProgress;
      if (Math.abs(ry) <= wingSpan && Math.abs(ry) >= 0.06) {
        isPlane = true;
      }
    }

    // Tail fin / horizontal stabilizer
    if (rx >= -0.58 && rx <= -0.42) {
      const tailProgress = (-0.42 - rx) / 0.16;
      const tailSpan = 0.28 * tailProgress;
      if (Math.abs(ry) <= tailSpan) {
        isPlane = true;
      }
    }

    // Jet contrail trail dots / dash arc
    let isTrail = false;
    const trailDist = Math.hypot(tx - (-0.35), ty - (0.4));
    if (Math.abs(trailDist - 0.5) < 0.035 && tx < 0.1 && ty > 0) {
      isTrail = true;
    }

    if (isPlane) {
      // Crisp white with slight lighting
      const shade = 255;
      return [shade, shade, shade, alpha];
    }

    if (globeRing) {
      // Translucent cyan-white accent
      return [180, 230, 255, Math.round(alpha * 0.4)];
    }

    if (isTrail) {
      return [255, 255, 255, Math.round(alpha * 0.6)];
    }

    // Return background color
    return [bgR, bgG, bgB, alpha];
  };
}

// Generate all required PNG icons
console.log('Generating PWA icons...');

// 1. 192x192 PNG (Standard)
const png192 = createPNG(192, 192, createTravelIconShader(false, false));
fs.writeFileSync('./pwa-192x192.png', png192);
console.log('✅ pwa-192x192.png created');

// 2. 512x512 PNG (Standard)
const png512 = createPNG(512, 512, createTravelIconShader(false, false));
fs.writeFileSync('./pwa-512x512.png', png512);
console.log('✅ pwa-512x512.png created');

// 3. 512x512 Maskable PNG (Full bleed with safe zone margin)
const pngMaskable = createPNG(512, 512, createTravelIconShader(true, false));
fs.writeFileSync('./pwa-maskable-512x512.png', pngMaskable);
console.log('✅ pwa-maskable-512x512.png created');

// 4. Apple Touch Icon 180x180 (Full bleed solid background)
const appleIcon = createPNG(180, 180, createTravelIconShader(false, true));
fs.writeFileSync('./apple-touch-icon.png', appleIcon);
console.log('✅ apple-touch-icon.png created');

// 5. Favicon 32x32 PNG / fallback
const faviconPng = createPNG(32, 32, createTravelIconShader(false, false));
fs.writeFileSync('./favicon.png', faviconPng);
console.log('✅ favicon.png created');

console.log('All PWA icon assets generated successfully.');
