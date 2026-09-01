import fs from 'fs';
import zlib from 'zlib';
import path from 'path';

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
  const bytesPerPixel = colorType === 6 ? 4 : (colorType === 2 ? 3 : (colorType === 0 ? 1 : 4));
  const rgbaBuffer = Buffer.alloc(width * height * 4);

  let inOffset = 0;
  for (let y = 0; y < height; y++) {
    const filterType = decompressed[inOffset++];
    const rowStart = inOffset;
    const prevRowStart = y > 0 ? (y - 1) * width * 4 : null;
    const currRowStart = y * width * 4;

    for (let x = 0; x < width; x++) {
      let r = 0, g = 0, b = 0, a = 255;
      const pxOffset = rowStart + x * bytesPerPixel;

      if (colorType === 6) { // RGBA
        if (filterType === 0) {
          r = decompressed[pxOffset];
          g = decompressed[pxOffset + 1];
          b = decompressed[pxOffset + 2];
          a = decompressed[pxOffset + 3];
        } else if (filterType === 1) {
          const prevR = x > 0 ? rgbaBuffer[currRowStart + (x - 1) * 4] : 0;
          const prevG = x > 0 ? rgbaBuffer[currRowStart + (x - 1) * 4 + 1] : 0;
          const prevB = x > 0 ? rgbaBuffer[currRowStart + (x - 1) * 4 + 2] : 0;
          const prevA = x > 0 ? rgbaBuffer[currRowStart + (x - 1) * 4 + 3] : 0;
          r = (decompressed[pxOffset] + prevR) & 0xff;
          g = (decompressed[pxOffset + 1] + prevG) & 0xff;
          b = (decompressed[pxOffset + 2] + prevB) & 0xff;
          a = (decompressed[pxOffset + 3] + prevA) & 0xff;
        } else if (filterType === 2) {
          const upR = prevRowStart !== null ? rgbaBuffer[prevRowStart + x * 4] : 0;
          const upG = prevRowStart !== null ? rgbaBuffer[prevRowStart + x * 4 + 1] : 0;
          const upB = prevRowStart !== null ? rgbaBuffer[prevRowStart + x * 4 + 2] : 0;
          const upA = prevRowStart !== null ? rgbaBuffer[prevRowStart + x * 4 + 3] : 0;
          r = (decompressed[pxOffset] + upR) & 0xff;
          g = (decompressed[pxOffset + 1] + upG) & 0xff;
          b = (decompressed[pxOffset + 2] + upB) & 0xff;
          a = (decompressed[pxOffset + 3] + upA) & 0xff;
        } else if (filterType === 3) {
          const prevR = x > 0 ? rgbaBuffer[currRowStart + (x - 1) * 4] : 0;
          const prevG = x > 0 ? rgbaBuffer[currRowStart + (x - 1) * 4 + 1] : 0;
          const prevB = x > 0 ? rgbaBuffer[currRowStart + (x - 1) * 4 + 2] : 0;
          const prevA = x > 0 ? rgbaBuffer[currRowStart + (x - 1) * 4 + 3] : 0;
          const upR = prevRowStart !== null ? rgbaBuffer[prevRowStart + x * 4] : 0;
          const upG = prevRowStart !== null ? rgbaBuffer[prevRowStart + x * 4 + 1] : 0;
          const upB = prevRowStart !== null ? rgbaBuffer[prevRowStart + x * 4 + 2] : 0;
          const upA = prevRowStart !== null ? rgbaBuffer[prevRowStart + x * 4 + 3] : 0;
          r = (decompressed[pxOffset] + Math.floor((prevR + upR) / 2)) & 0xff;
          g = (decompressed[pxOffset + 1] + Math.floor((prevG + upG) / 2)) & 0xff;
          b = (decompressed[pxOffset + 2] + Math.floor((prevB + upB) / 2)) & 0xff;
          a = (decompressed[pxOffset + 3] + Math.floor((prevA + upA) / 2)) & 0xff;
        } else {
          const aR = x > 0 ? rgbaBuffer[currRowStart + (x - 1) * 4] : 0;
          const bR = prevRowStart !== null ? rgbaBuffer[prevRowStart + x * 4] : 0;
          const cR = x > 0 && prevRowStart !== null ? rgbaBuffer[prevRowStart + (x - 1) * 4] : 0;
          r = (decompressed[pxOffset] + paeth(aR, bR, cR)) & 0xff;

          const aG = x > 0 ? rgbaBuffer[currRowStart + (x - 1) * 4 + 1] : 0;
          const bG = prevRowStart !== null ? rgbaBuffer[prevRowStart + x * 4] : 0;
          const cG = x > 0 && prevRowStart !== null ? rgbaBuffer[prevRowStart + (x - 1) * 4 + 1] : 0;
          g = (decompressed[pxOffset + 1] + paeth(aG, bG, cG)) & 0xff;

          const aB = x > 0 ? rgbaBuffer[currRowStart + (x - 1) * 4 + 2] : 0;
          const bB = prevRowStart !== null ? rgbaBuffer[prevRowStart + x * 4] : 0;
          const cB = x > 0 && prevRowStart !== null ? rgbaBuffer[prevRowStart + (x - 1) * 4 + 2] : 0;
          b = (decompressed[pxOffset + 2] + paeth(aB, bB, cB)) & 0xff;

          const aA = x > 0 ? rgbaBuffer[currRowStart + (x - 1) * 4 + 3] : 0;
          const bA = prevRowStart !== null ? rgbaBuffer[prevRowStart + x * 4 + 3] : 0;
          const cA = x > 0 && prevRowStart !== null ? rgbaBuffer[prevRowStart + (x - 1) * 4 + 3] : 0;
          a = (decompressed[pxOffset + 3] + paeth(aA, bA, cA)) & 0xff;
        }
      }

      rgbaBuffer[currRowStart + x * 4] = r;
      rgbaBuffer[currRowStart + x * 4 + 1] = g;
      rgbaBuffer[currRowStart + x * 4 + 2] = b;
      rgbaBuffer[currRowStart + x * 4 + 3] = a;
    }
    inOffset += width * bytesPerPixel;
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

function encodePng(width, height, rgbaBuffer) {
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

const origBuf = fs.readFileSync('public/images/zamaniLogo.png');
const decoded = decodePng(origBuf);

// Find exact non-transparent bounding box
let minX = decoded.width, maxX = 0, minY = decoded.height, maxY = 0;
for (let y = 0; y < decoded.height; y++) {
  for (let x = 0; x < decoded.width; x++) {
    const idx = (y * decoded.width + x) * 4;
    const a = decoded.rgba[idx + 3];
    if (a > 10) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
}

console.log(`Bounds: X [${minX}, ${maxX}], Y [${minY}, ${maxY}]`);
const pad = 8;
minX = Math.max(0, minX - pad);
minY = Math.max(0, minY - pad);
maxX = Math.min(decoded.width - 1, maxX + pad);
maxY = Math.min(decoded.height - 1, maxY + pad);

const cropW = maxX - minX + 1;
const cropH = maxY - minY + 1;

const darkTextRgba = Buffer.alloc(cropW * cropH * 4);
const whiteTextRgba = Buffer.alloc(cropW * cropH * 4);

for (let y = 0; y < cropH; y++) {
  for (let x = 0; x < cropW; x++) {
    const srcX = minX + x;
    const srcY = minY + y;
    const srcIdx = (srcY * decoded.width + srcX) * 4;
    const destIdx = (y * cropW + x) * 4;

    const r = decoded.rgba[srcIdx];
    const g = decoded.rgba[srcIdx + 1];
    const b = decoded.rgba[srcIdx + 2];
    const a = decoded.rgba[srcIdx + 3];

    darkTextRgba[destIdx] = r;
    darkTextRgba[destIdx + 1] = g;
    darkTextRgba[destIdx + 2] = b;
    darkTextRgba[destIdx + 3] = a;

    // For white text version: if it's the blue emblem (high blue), keep blue. If it's dark text, turn to white!
    const isBlue = (b > 120 && b > r + 40 && b > g + 20);
    if (isBlue) {
      whiteTextRgba[destIdx] = r;
      whiteTextRgba[destIdx + 1] = g;
      whiteTextRgba[destIdx + 2] = b;
      whiteTextRgba[destIdx + 3] = a;
    } else if (a > 10) {
      whiteTextRgba[destIdx] = 255;
      whiteTextRgba[destIdx + 1] = 255;
      whiteTextRgba[destIdx + 2] = 255;
      whiteTextRgba[destIdx + 3] = a;
    } else {
      whiteTextRgba[destIdx] = 0;
      whiteTextRgba[destIdx + 1] = 0;
      whiteTextRgba[destIdx + 2] = 0;
      whiteTextRgba[destIdx + 3] = 0;
    }
  }
}

const croppedDarkPng = encodePng(cropW, cropH, darkTextRgba);
const croppedWhitePng = encodePng(cropW, cropH, whiteTextRgba);

fs.writeFileSync('public/images/zamaniLogo.png', croppedDarkPng);
fs.writeFileSync('public/images/zamani-official-logo.png', croppedDarkPng);
fs.writeFileSync('public/images/zamani-transparent.png', croppedDarkPng);
fs.writeFileSync('public/images/zamani-logo-white.png', croppedWhitePng);

console.log('Successfully created cropped dark and white PNG logos!');
