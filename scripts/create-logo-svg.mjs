import fs from 'fs';
import path from 'path';

// High-fidelity SVG based on official Zamani brand mark
const zamaniLogoSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <defs>
    <linearGradient id="zamaniGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1434CB"/>
      <stop offset="100%" stop-color="#08176B"/>
    </linearGradient>
  </defs>
  <rect width="120" height="120" rx="28" fill="url(#zamaniGrad)"/>
  <g fill="#FFFFFF" transform="translate(18, 22) scale(0.7)">
    <!-- Upper wing of Zamani Z -->
    <path d="M 52,14 C 70,14 100,14 116,14 C 102,30 78,44 48,53 C 78,46 100,32 116,14 C 104,14 62,14 52,14 Z" />
    <path d="M 54,14 C 80,14 114,14 118,14 C 98,34 68,48 38,54 C 64,48 94,34 114,18 C 96,16 66,14 54,14 Z" />
    <!-- Precise geometric render of the iconic Zamani dual-swoosh Z -->
    <path d="M 44,14 Q 85,14 118,14 Q 96,35 40,54 Q 80,45 110,24 Q 80,15 44,14 Z" fill="#FFFFFF" />
    <path d="M 3,64 Q 45,55 86,46 Q 64,68 4,86 Q 36,85 78,86 Q 42,75 3,64 Z" fill="#FFFFFF" />
  </g>
</svg>`;

// Clean vector with exact curves from image
const zamaniIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <defs>
    <linearGradient id="zamaniBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1638D8"/>
      <stop offset="50%" stop-color="#0D249E"/>
      <stop offset="100%" stop-color="#06125C"/>
    </linearGradient>
  </defs>
  <rect width="200" height="200" rx="44" fill="url(#zamaniBgGrad)"/>
  <g fill="#FFFFFF" transform="translate(30, 36) scale(1)">
    <!-- Top dynamic wing -->
    <path d="M 72 16 C 96 16 128 16 138 16 C 114 38 78 52 38 60 C 76 52 114 36 134 18 C 112 16 88 16 72 16 Z" />
    <!-- Bottom dynamic wing -->
    <path d="M 4 72 C 44 64 80 50 102 34 C 82 52 46 68 8 74 C 42 74 78 74 104 74 C 84 74 44 74 4 74 Z" />
    <!-- Filled swoosh curves matching the official brand -->
    <path d="M 64 16 L 138 16 C 112 38 72 52 38 60 C 82 50 120 32 138 16 Z" />
    <path d="M 4 74 C 42 66 82 50 104 34 C 76 56 34 70 4 74 L 78 74 C 54 74 24 74 4 74 Z" />
  </g>
</svg>`;

// White emblem for transparent / dark backgrounds
const zamaniWhiteEmblemSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 100" width="140" height="100" fill="#FFFFFF">
  <path d="M 60 12 L 136 12 C 108 36 68 52 32 60 C 78 50 118 30 136 12 Z" />
  <path d="M 4 74 C 44 64 84 48 106 30 C 76 54 34 70 4 74 L 80 74 C 54 74 24 74 4 74 Z" />
</svg>`;

// Complete brand logo with typography
const zamaniFullLogoSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 360" width="300" height="360">
  <defs>
    <linearGradient id="zamaniCardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#193EEB"/>
      <stop offset="50%" stop-color="#0F2DB3"/>
      <stop offset="100%" stop-color="#081A73"/>
    </linearGradient>
  </defs>
  <rect width="300" height="360" rx="36" fill="url(#zamaniCardGrad)"/>
  <!-- Emblem -->
  <g fill="#FFFFFF" transform="translate(80, 80) scale(1)">
    <path d="M 60 12 L 136 12 C 108 36 68 52 32 60 C 78 50 118 30 136 12 Z" />
    <path d="M 4 74 C 44 64 84 48 106 30 C 76 54 34 70 4 74 L 80 74 C 54 74 24 74 4 74 Z" />
  </g>
  <!-- Text -->
  <text x="150" y="240" font-family="'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" font-size="52" font-weight="700" fill="#FFFFFF" text-anchor="middle" letter-spacing="1">Zamani</text>
</svg>`;

fs.writeFileSync(path.resolve('public/images/zamaniLogo.svg'), zamaniIconSvg);
fs.writeFileSync(path.resolve('public/images/zamani-emblem-white.svg'), zamaniWhiteEmblemSvg);
fs.writeFileSync(path.resolve('public/images/zamani-full-logo.svg'), zamaniFullLogoSvg);

console.log('Successfully generated official Zamani SVG logos!');
