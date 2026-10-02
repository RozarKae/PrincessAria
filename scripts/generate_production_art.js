import fs from 'fs';
import path from 'path';

const baseDir = path.resolve('src/assets/art/worlds/honeywood');

const dirs = [
  'backgrounds',
  'parallax',
  'terrain',
  'platforms',
  'props',
  'vegetation',
  'structures',
  'hive',
  'effects',
];

dirs.forEach(d => {
  const fullPath = path.join(baseDir, d);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
});

console.log('Production art directories verified.');

// 1. honeywood_bg_sky_01.svg (1920x1080)
const skySvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="1920" height="1080">
  <defs>
    <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#0c4a6e" />
      <stop offset="45%" stop-color="#0284c7" />
      <stop offset="80%" stop-color="#38bdf8" />
      <stop offset="100%" stop-color="#fef08a" />
    </linearGradient>
    <radialGradient id="sunBloom" cx="80%" cy="20%" r="45%">
      <stop offset="0%" stop-color="rgba(254, 240, 138, 0.65)" />
      <stop offset="40%" stop-color="rgba(251, 191, 36, 0.28)" />
      <stop offset="100%" stop-color="rgba(245, 158, 11, 0)" />
    </radialGradient>
  </defs>
  <rect width="1920" height="1080" fill="url(#skyGrad)" />
  <circle cx="1536" cy="216" r="480" fill="url(#sunBloom)" />
</svg>`;
fs.writeFileSync(path.join(baseDir, 'backgrounds/honeywood_bg_sky_01.svg'), skySvg);

// 2. honeywood_bg_mountains_01.svg (2048x600)
const mountainSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2048 600" width="2048" height="600">
  <defs>
    <linearGradient id="mountGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#1e293b" />
      <stop offset="50%" stop-color="#0f172a" />
      <stop offset="100%" stop-color="#020617" />
    </linearGradient>
  </defs>
  <path d="M 0 600 L 0 380 L 260 220 L 480 340 L 720 160 L 980 360 L 1220 180 L 1520 320 L 1800 140 L 2048 310 L 2048 600 Z" fill="url(#mountGrad)" opacity="0.9" />
  <path d="M 720 160 L 700 210 L 730 200 Z" fill="#64748b" opacity="0.4" />
  <path d="M 1220 180 L 1205 230 L 1235 220 Z" fill="#64748b" opacity="0.4" />
</svg>`;
fs.writeFileSync(path.join(baseDir, 'parallax/honeywood_bg_mountains_01.svg'), mountainSvg);

// 3. honeywood_bg_forest_01.svg (2048x500)
const forestSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2048 500" width="2048" height="500">
  <defs>
    <linearGradient id="forestGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#14532d" />
      <stop offset="60%" stop-color="#064e3b" />
      <stop offset="100%" stop-color="#022c22" />
    </linearGradient>
  </defs>
  <path d="M 0 500 L 0 240 Q 140 180 280 250 Q 420 140 560 220 Q 720 120 880 240 Q 1060 160 1240 260 Q 1420 130 1600 230 Q 1820 110 2048 220 L 2048 500 Z" fill="url(#forestGrad)" />
</svg>`;
fs.writeFileSync(path.join(baseDir, 'parallax/honeywood_bg_forest_01.svg'), forestSvg);

// 4. honeywood_tree_large_01.svg (600x900)
const treeSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 900" width="600" height="900">
  <defs>
    <linearGradient id="trunkGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#451a03" />
      <stop offset="40%" stop-color="#78350f" />
      <stop offset="70%" stop-color="#92400e" />
      <stop offset="100%" stop-color="#271004" />
    </linearGradient>
    <radialGradient id="foliageGrad" cx="50%" cy="40%" r="50%">
      <stop offset="0%" stop-color="#4ade80" />
      <stop offset="60%" stop-color="#15803d" />
      <stop offset="100%" stop-color="#14532d" />
    </radialGradient>
  </defs>
  <!-- Trunk -->
  <path d="M 230 900 C 230 650, 180 500, 220 350 L 380 350 C 420 500, 370 650, 370 900 Z" fill="url(#trunkGrad)" />
  <!-- Canopy Foliage -->
  <ellipse cx="300" cy="280" rx="240" ry="180" fill="url(#foliageGrad)" opacity="0.95" />
  <ellipse cx="200" cy="240" rx="140" ry="110" fill="url(#foliageGrad)" opacity="0.9" />
  <ellipse cx="400" cy="250" rx="150" ry="120" fill="url(#foliageGrad)" opacity="0.9" />
  <!-- Hanging Moss Tendrils -->
  <path d="M 180 340 Q 170 420 185 450 Q 195 420 185 340 Z" fill="#84cc16" opacity="0.75" />
  <path d="M 390 350 Q 405 440 385 480 Q 380 430 395 350 Z" fill="#84cc16" opacity="0.75" />
</svg>`;
fs.writeFileSync(path.join(baseDir, 'vegetation/honeywood_tree_large_01.svg'), treeSvg);

// 5. honeywood_platform_grass_01.svg (400x120)
const platGrassSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 120" width="400" height="120">
  <defs>
    <linearGradient id="dirtGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#78350f" />
      <stop offset="50%" stop-color="#451a03" />
      <stop offset="100%" stop-color="#1c0a00" />
    </linearGradient>
    <linearGradient id="grassGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#86efac" />
      <stop offset="30%" stop-color="#22c55e" />
      <stop offset="100%" stop-color="#15803d" />
    </linearGradient>
  </defs>
  <!-- Stone/Earth Base -->
  <rect x="0" y="24" width="400" height="96" rx="10" fill="url(#dirtGrad)" />
  <!-- Lush Top Grass with Blades -->
  <path d="M 0 28 Q 20 12 40 28 Q 60 10 80 28 Q 100 12 120 28 Q 140 10 160 28 Q 180 12 200 28 Q 220 10 240 28 Q 260 12 280 28 Q 300 10 320 28 Q 340 12 360 28 Q 380 10 400 28 L 400 48 L 0 48 Z" fill="url(#grassGrad)" />
</svg>`;
fs.writeFileSync(path.join(baseDir, 'platforms/honeywood_platform_grass_01.svg'), platGrassSvg);

// 6. honeywood_hive_wall_01.svg (500x500)
const hiveWallSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="500" height="500">
  <defs>
    <linearGradient id="cellGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef08a" />
      <stop offset="40%" stop-color="#f59e0b" />
      <stop offset="85%" stop-color="#78350f" />
      <stop offset="100%" stop-color="#451a03" />
    </linearGradient>
  </defs>
  <!-- Hexagonal Honeycomb Matrix -->
  <g fill="url(#cellGrad)" stroke="#271004" stroke-width="4">
    <polygon points="120,40 170,10 220,40 220,100 170,130 120,100" />
    <polygon points="220,40 270,10 320,40 320,100 270,130 220,100" />
    <polygon points="70,130 120,100 170,130 170,190 120,220 70,190" />
    <polygon points="170,130 220,100 270,130 270,190 220,220 170,190" />
    <polygon points="270,130 320,100 370,130 370,190 320,220 270,190" />
    <polygon points="120,220 170,190 220,220 220,280 170,310 120,280" />
    <polygon points="220,220 270,190 320,220 320,280 270,310 220,280" />
  </g>
</svg>`;
fs.writeFileSync(path.join(baseDir, 'hive/honeywood_hive_wall_01.svg'), hiveWallSvg);

// 7. honeywood_sunbeam_01.svg (400x1080)
const sunbeamSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 1080" width="400" height="1080">
  <defs>
    <linearGradient id="beamGrad" x1="20%" y1="0%" x2="80%" y2="100%">
      <stop offset="0%" stop-color="rgba(254, 240, 138, 0.45)" />
      <stop offset="50%" stop-color="rgba(251, 191, 36, 0.18)" />
      <stop offset="100%" stop-color="rgba(251, 191, 36, 0)" />
    </linearGradient>
  </defs>
  <polygon points="80,0 200,0 360,1080 0,1080" fill="url(#beamGrad)" />
</svg>`;
fs.writeFileSync(path.join(baseDir, 'effects/honeywood_sunbeam_01.svg'), sunbeamSvg);

console.log('Production art assets successfully generated.');
