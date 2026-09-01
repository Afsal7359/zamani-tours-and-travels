import fs from 'fs';
import zlib from 'zlib';

function decodePng(buffer) {
  let offset = 8; // PNG signature
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
  console.log({ width, height, bitDepth, colorType, decompressedLength: decompressed.length });
  return { width, height, bitDepth, colorType, data: decompressed };
}

const file1 = 'C:/Users/ANSHID/.gemini/antigravity-ide/brain/0f330dd6-7e11-4572-a076-68e322edb172/.user_uploaded/media_1788196992882.png';
const file2 = 'C:/Users/ANSHID/.gemini/antigravity-ide/brain/0f330dd6-7e11-4572-a076-68e322edb172/.user_uploaded/media_1788196979639.png';

console.log('File 1:');
const img1 = decodePng(fs.readFileSync(file1));
console.log('File 2:');
const img2 = decodePng(fs.readFileSync(file2));
