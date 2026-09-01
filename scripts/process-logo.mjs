import fs from 'fs';
import path from 'path';

const srcImg = 'C:/Users/ANSHID/.gemini/antigravity-ide/brain/1f2ed70a-b7f1-4f3d-932a-2ec23ba1d7ac/.user_uploaded/media_1787816045347.png';
const destFull = path.resolve('public/images/zamani-official-logo.png');
const destLogoPng = path.resolve('public/images/zamaniLogo.png');

// Copy the full uploaded image
fs.copyFileSync(srcImg, destFull);
fs.copyFileSync(srcImg, destLogoPng);
console.log('Copied official logo to public/images/zamani-official-logo.png and zamaniLogo.png');
