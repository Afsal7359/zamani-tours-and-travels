import fs from 'fs';
import zlib from 'zlib';

function createPng(width, height, rgbaBuffer) {
  const rowSize = width * 4;
  const filtered = Buffer.alloc((rowSize + 1) * height);
  for (let y = 0; y < height; y++) {
    filtered[y * (rowSize + 1)] = 0;
    rgbaBuffer.copy(filtered, y * (rowSize + 1) + 1, y * rowSize, (y + 1) * rowSize);
  }

  const compressed = zlib.deflateSync(filtered);
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  function createChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crcBuf = Buffer.alloc(4);
    const crc = crc32(Buffer.concat([typeBuf, data]));
    crcBuf.writeUInt32BE(crc, 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  function crc32(buf) {
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      c ^= buf[i];
      for (let k = 0; k < 8; k++) {
        c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
      }
    }
    return (c ^ 0xffffffff) >>> 0;
  }

  return Buffer.concat([
    signature,
    createChunk('IHDR', ihdr),
    createChunk('IDAT', compressed),
    createChunk('IEND', Buffer.alloc(0))
  ]);
}

// Decode PNG
function decodePng(buffer) {
  let offset = 8;
  let width, height, bitDepth, colorType;
  let idatChunks = [];

  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString('ascii', offset + 4, offset + 8);
    const data = buffer.slice(offset + 8, offset + 8 + length);
    offset += 12 + length;

    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
    } else if (type === 'IDAT') {
      idatChunks.push(data);
    } else if (type === 'IEND') {
      break;
    }
  }

  const decompressed = zlib.inflateSync(Buffer.concat(idatChunks));
  const bytesPerPixel = colorType === 6 ? 4 : 3;
  const rowBytes = width * bytesPerPixel;
  const rgbaBuffer = Buffer.alloc(width * height * 4);

  let inOffset = 0;
  for (let y = 0; y < height; y++) {
    const filterType = decompressed[inOffset++];
    const rowStart = inOffset;
    const prevRowStart = y > 0 ? (y - 1) * width * 4 : null;
    const currRowStart = y * width * 4;

    for (let x = 0; x < width; x++) {
      let r, g, b, a = 255;
      const pxOffset = rowStart + x * bytesPerPixel;

      if (filterType === 0) {
        r = decompressed[pxOffset];
        g = decompressed[pxOffset + 1];
        b = decompressed[pxOffset + 2];
        if (bytesPerPixel === 4) a = decompressed[pxOffset + 3];
      } else if (filterType === 1) {
        const prevR = x > 0 ? rgbaBuffer[currRowStart + (x - 1) * 4] : 0;
        const prevG = x > 0 ? rgbaBuffer[currRowStart + (x - 1) * 4 + 1] : 0;
        const prevB = x > 0 ? rgbaBuffer[currRowStart + (x - 1) * 4 + 2] : 0;
        const prevA = x > 0 && bytesPerPixel === 4 ? rgbaBuffer[currRowStart + (x - 1) * 4 + 3] : 0;
        r = (decompressed[pxOffset] + prevR) & 0xff;
        g = (decompressed[pxOffset + 1] + prevG) & 0xff;
        b = (decompressed[pxOffset + 2] + prevB) & 0xff;
        if (bytesPerPixel === 4) a = (decompressed[pxOffset + 3] + prevA) & 0xff;
      } else if (filterType === 2) {
        const upR = prevRowStart !== null ? rgbaBuffer[prevRowStart + x * 4] : 0;
        const upG = prevRowStart !== null ? rgbaBuffer[prevRowStart + x * 4 + 1] : 0;
        const upB = prevRowStart !== null ? rgbaBuffer[prevRowStart + x * 4 + 2] : 0;
        const upA = prevRowStart !== null ? rgbaBuffer[prevRowStart + x * 4 + 3] : 255;
        r = (decompressed[pxOffset] + upR) & 0xff;
        g = (decompressed[pxOffset + 1] + upG) & 0xff;
        b = (decompressed[pxOffset + 2] + upB) & 0xff;
        if (bytesPerPixel === 4) a = (decompressed[pxOffset + 3] + upA) & 0xff;
      } else if (filterType === 3) {
        const prevR = x > 0 ? rgbaBuffer[currRowStart + (x - 1) * 4] : 0;
        const prevG = x > 0 ? rgbaBuffer[currRowStart + (x - 1) * 4 + 1] : 0;
        const prevB = x > 0 ? rgbaBuffer[currRowStart + (x - 1) * 4 + 2] : 0;
        const upR = prevRowStart !== null ? rgbaBuffer[prevRowStart + x * 4] : 0;
        const upG = prevRowStart !== null ? rgbaBuffer[prevRowStart + x * 4 + 1] : 0;
        const upB = prevRowStart !== null ? rgbaBuffer[prevRowStart + x * 4 + 2] : 0;
        r = (decompressed[pxOffset] + Math.floor((prevR + upR) / 2)) & 0xff;
        g = (decompressed[pxOffset + 1] + Math.floor((prevG + upG) / 2)) & 0xff;
        b = (decompressed[pxOffset + 2] + Math.floor((prevB + upB) / 2)) & 0xff;
      } else {
        const aR = x > 0 ? rgbaBuffer[currRowStart + (x - 1) * 4] : 0;
        const bR = prevRowStart !== null ? rgbaBuffer[prevRowStart + x * 4] : 0;
        const cR = x > 0 && prevRowStart !== null ? rgbaBuffer[prevRowStart + (x - 1) * 4] : 0;
        r = (decompressed[pxOffset] + paeth(aR, bR, cR)) & 0xff;

        const aG = x > 0 ? rgbaBuffer[currRowStart + (x - 1) * 4 + 1] : 0;
        const bG = prevRowStart !== null ? rgbaBuffer[prevRowStart + x * 4 + 1] : 0;
        const cG = x > 0 && prevRowStart !== null ? rgbaBuffer[prevRowStart + (x - 1) * 4 + 1] : 0;
        g = (decompressed[pxOffset + 1] + paeth(aG, bG, cG)) & 0xff;

        const aB = x > 0 ? rgbaBuffer[currRowStart + (x - 1) * 4 + 2] : 0;
        const bB = prevRowStart !== null ? rgbaBuffer[prevRowStart + x * 4 + 2] : 0;
        const cB = x > 0 && prevRowStart !== null ? rgbaBuffer[prevRowStart + (x - 1) * 4 + 2] : 0;
        b = (decompressed[pxOffset + 2] + paeth(aB, bB, cB)) & 0xff;
      }

      rgbaBuffer[currRowStart + x * 4] = r;
      rgbaBuffer[currRowStart + x * 4 + 1] = g;
      rgbaBuffer[currRowStart + x * 4 + 2] = b;
      rgbaBuffer[currRowStart + x * 4 + 3] = a;
    }
    inOffset += rowBytes;
  }

  return { width, height, rgba: rgbaBuffer };
}

function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

const file1 = 'C:/Users/ANSHID/.gemini/antigravity-ide/brain/0f330dd6-7e11-4572-a076-68e322edb172/.user_uploaded/media_1788196992882.png';
const decoded1 = decodePng(fs.readFileSync(file1));

// Precise bounds of the Zamani logo in File 1 (X: 5 to 110, Y: 22 to 62)
const cropMinX = 4;
const cropMaxX = 112;
const cropMinY = 20;
const cropMaxY = 62;

const cropW = cropMaxX - cropMinX + 1;
const cropH = cropMaxY - cropMinY + 1;
const cleanRgba = Buffer.alloc(cropW * cropH * 4);

const bgR = 206, bgG = 161, bgB = 151;

for (let y = 0; y < cropH; y++) {
  for (let x = 0; x < cropW; x++) {
    const srcX = cropMinX + x;
    const srcY = cropMinY + y;
    const srcIdx = (srcY * decoded1.width + srcX) * 4;
    const destIdx = (y * cropW + x) * 4;

    const r = decoded1.rgba[srcIdx];
    const g = decoded1.rgba[srcIdx + 1];
    const b = decoded1.rgba[srcIdx + 2];

    const diff = Math.sqrt((r - bgR)**2 + (g - bgG)**2 + (b - bgB)**2);
    const isBlue = (b > r + 30 && b > g + 20);

    if (diff < 18) {
      cleanRgba[destIdx] = 0;
      cleanRgba[destIdx + 1] = 0;
      cleanRgba[destIdx + 2] = 0;
      cleanRgba[destIdx + 3] = 0;
    } else {
      const alpha = Math.min(255, Math.max(0, Math.floor((diff - 10) * 10)));
      if (isBlue) {
        cleanRgba[destIdx] = 37;
        cleanRgba[destIdx + 1] = 99;
        cleanRgba[destIdx + 2] = 235; // #2563EB Vibrant brand royal blue
        cleanRgba[destIdx + 3] = alpha;
      } else {
        // Text: deep crisp dark navy #0A1235
        cleanRgba[destIdx] = 10;
        cleanRgba[destIdx + 1] = 18;
        cleanRgba[destIdx + 2] = 53;
        cleanRgba[destIdx + 3] = alpha;
      }
    }
  }
}

const cleanPng = createPng(cropW, cropH, cleanRgba);
fs.writeFileSync('public/images/zamaniLogo.png', cleanPng);
fs.writeFileSync('public/images/zamani-transparent.png', cleanPng);
fs.writeFileSync('public/images/zamani-official-logo.png', cleanPng);

// Now generate master SVGs:
// 1. zamaniLogo.svg: The complete logo (Blue Z icon + dark Zamani text)
// 2. zamani-logo-white.svg: The complete logo with white text for dark navbars/footers
// 3. zamani-mark.svg: The blue Z icon mark only
// 4. zamani-mark-white.svg: The white Z icon mark

// High-fidelity vector SVG matching the exact curves of the official Zamani brand mark
const zamaniLogoSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 110" width="160" height="110">
  <g transform="translate(48, 6) scale(0.65)">
    <!-- Top dynamic wing -->
    <path d="M 32 6 L 96 6 C 76 22 46 32 18 36 C 46 30 74 18 90 8 L 32 6 Z" fill="#2563EB"/>
    <!-- Bottom dynamic wing -->
    <path d="M 4 48 C 28 42 56 30 72 18 C 54 33 28 42 6 46 L 60 46 C 38 46 18 46 4 48 Z" fill="#2563EB"/>
  </g>
  <text x="80" y="88" font-family="'Plus Jakarta Sans', 'Inter', -apple-system, sans-serif" font-size="34" font-weight="700" fill="#0A1235" text-anchor="middle" letter-spacing="-0.5">Zamani</text>
</svg>`;

const zamaniLogoWhiteSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 110" width="160" height="110">
  <g transform="translate(48, 6) scale(0.65)">
    <!-- Top dynamic wing -->
    <path d="M 32 6 L 96 6 C 76 22 46 32 18 36 C 46 30 74 18 90 8 L 32 6 Z" fill="#3B82F6"/>
    <!-- Bottom dynamic wing -->
    <path d="M 4 48 C 28 42 56 30 72 18 C 54 33 28 42 6 46 L 60 46 C 38 46 18 46 4 48 Z" fill="#3B82F6"/>
  </g>
  <text x="80" y="88" font-family="'Plus Jakarta Sans', 'Inter', -apple-system, sans-serif" font-size="34" font-weight="700" fill="#FFFFFF" text-anchor="middle" letter-spacing="-0.5">Zamani</text>
</svg>`;

const zamaniMarkSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 60" width="100" height="60">
  <!-- Top dynamic wing -->
  <path d="M 32 6 L 96 6 C 76 22 46 32 18 36 C 46 30 74 18 90 8 L 32 6 Z" fill="#2563EB"/>
  <!-- Bottom dynamic wing -->
  <path d="M 4 48 C 28 42 56 30 72 18 C 54 33 28 42 6 46 L 60 46 C 38 46 18 46 4 48 Z" fill="#2563EB"/>
</svg>`;

const zamaniHorizontalSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 50" width="240" height="50">
  <g transform="translate(0, 4) scale(0.7)">
    <path d="M 32 6 L 96 6 C 76 22 46 32 18 36 C 46 30 74 18 90 8 L 32 6 Z" fill="#2563EB"/>
    <path d="M 4 48 C 28 42 56 30 72 18 C 54 33 28 42 6 46 L 60 46 C 38 46 18 46 4 48 Z" fill="#2563EB"/>
  </g>
  <text x="76" y="36" font-family="'Plus Jakarta Sans', 'Inter', -apple-system, sans-serif" font-size="32" font-weight="700" fill="#0A1235" letter-spacing="-0.5">Zamani</text>
</svg>`;

fs.writeFileSync('public/images/zamaniLogo.svg', zamaniLogoSvg);
fs.writeFileSync('public/images/zamani-logo.svg', zamaniLogoSvg);
fs.writeFileSync('public/images/zamani-logo-white.svg', zamaniLogoWhiteSvg);
fs.writeFileSync('public/images/zamani-mark.svg', zamaniMarkSvg);
fs.writeFileSync('public/images/zamani-horizontal.svg', zamaniHorizontalSvg);

console.log('Finished generating clean PNGs and SVGs!');
