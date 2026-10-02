import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Asset directories to create
const assetDirs = [
  'src/assets/characters/aria/idle',
  'src/assets/characters/aria/walk',
  'src/assets/characters/aria/run',
  'src/assets/characters/aria/jump',
  'src/assets/characters/aria/jump_start',
  'src/assets/characters/aria/jump_rise',
  'src/assets/characters/aria/fall',
  'src/assets/characters/aria/land',
  'src/assets/characters/aria/crouch',
  'src/assets/characters/aria/dash',
  'src/assets/characters/aria/hurt',
  'src/assets/characters/aria/death',
  'src/assets/characters/aria/victory',
  'src/assets/characters/batboy',
  'src/assets/enemies/queen-bee',
  'src/assets/environment',
  'src/assets/effects',
  'src/assets/ui',
];

for (const dir of assetDirs) {
  const fullPath = path.join(rootDir, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
}

// Create placeholder README files for Batboy, Queen Bee, Environment, Effects, UI
const placeholders = [
  {
    path: 'src/assets/characters/batboy/README.md',
    content: '# Batboy HD Character Assets\nDrop frame sequences or sprite sheets here for Batboy.\n',
  },
  {
    path: 'src/assets/enemies/queen-bee/README.md',
    content: '# Gigantic Queen Bee HD Enemy Assets\nDrop boss frame sequences or sprite sheets here.\n',
  },
  {
    path: 'src/assets/environment/README.md',
    content: '# HD Environment & Background Assets\nDrop parallax backgrounds, tilesets, and honey spires here.\n',
  },
  {
    path: 'src/assets/effects/README.md',
    content: '# HD Particle & Special Effects Assets\nDrop dust, honey splashes, sparkles, and hit bursts here.\n',
  },
  {
    path: 'src/assets/ui/README.md',
    content: '# HD UI Assets\nDrop heart containers, honey nectar badges, and icons here.\n',
  },
];

for (const p of placeholders) {
  const fullPath = path.join(rootDir, p.path);
  if (!fs.existsSync(fullPath)) {
    fs.writeFileSync(fullPath, p.content, 'utf-8');
  }
}

/**
 * Procedural HD SVG generator for Princess Aria.
 * Generates clean, crisp 256x256 vector illustrated frames.
 */
function createAriaSVG(options) {
  const {
    bodyY = 160,          // base feet Y position
    torsoAngle = 0,       // tilt angle in degrees
    torsoOffsetX = 0,     // horizontal displacement
    legL = { angle: 0, bend: 0, lift: 0 },
    legR = { angle: 0, bend: 0, lift: 0 },
    armL = { angle: 0, reach: 0 },
    armR = { angle: 0, reach: 0 },
    skirtFlare = 0,       // skirt expansion factor
    capeAngle = 0,        // capelet trailing angle
    wingFlap = 0,         // wing rotation angle (-20 to 30)
    wingGlow = 0.8,
    headTilt = 0,
    eyeState = 'open',    // 'open' | 'blink' | 'half' | 'wink' | 'hurt' | 'happy'
    mouthState = 'smile', // 'smile' | 'open' | 'gasp' | 'cheer' | 'grimace'
    tiaraGlint = false,
    squashX = 1,
    squashY = 1,
    dashTrail = false,
    sparkles = false,
    dissolveAlpha = 1,
  } = options;

  // Center pivot is (128, bodyY)
  const cx = 128 + torsoOffsetX;
  const cy = bodyY;
  const rad = Math.PI / 180;

  // Eyes rendering
  let eyesSvg = '';
  const eyeX = cx + 8;
  const eyeY = cy - 78;
  if (eyeState === 'blink') {
    eyesSvg = `<path d="M${eyeX - 5} ${eyeY} Q${eyeX} ${eyeY + 2} ${eyeX + 5} ${eyeY}" stroke="#1e1b4b" stroke-width="2.5" stroke-linecap="round" fill="none"/>`;
  } else if (eyeState === 'half') {
    eyesSvg = `
      <path d="M${eyeX - 5} ${eyeY} Q${eyeX} ${eyeY + 3} ${eyeX + 5} ${eyeY}" stroke="#1e1b4b" stroke-width="2.5" stroke-linecap="round" fill="none"/>
      <ellipse cx="${eyeX}" cy="${eyeY + 1}" rx="3.5" ry="2" fill="#0284c7"/>
    `;
  } else if (eyeState === 'wink') {
    eyesSvg = `
      <ellipse cx="${eyeX - 3}" cy="${eyeY}" rx="3.5" ry="4.5" fill="#0284c7"/>
      <circle cx="${eyeX - 1.5}" cy="${eyeY - 1.5}" r="1.5" fill="#ffffff"/>
      <path d="M${eyeX + 5} ${eyeY} Q${eyeX + 9} ${eyeY - 3} ${eyeX + 13} ${eyeY}" stroke="#1e1b4b" stroke-width="2" stroke-linecap="round" fill="none"/>
    `;
  } else if (eyeState === 'hurt') {
    eyesSvg = `
      <path d="M${eyeX - 6} ${eyeY - 4} L${eyeX + 4} ${eyeY + 4} M${eyeX + 4} ${eyeY - 4} L${eyeX - 6} ${eyeY + 4}" stroke="#1e1b4b" stroke-width="2.5" stroke-linecap="round"/>
    `;
  } else if (eyeState === 'happy') {
    eyesSvg = `
      <path d="M${eyeX - 6} ${eyeY + 1} Q${eyeX} ${eyeY - 5} ${eyeX + 6} ${eyeY + 1}" stroke="#1e1b4b" stroke-width="3" stroke-linecap="round" fill="none"/>
      <circle cx="${eyeX}" cy="${eyeY - 2}" r="1" fill="#fde047"/>
    `;
  } else {
    // Standard open expressive eyes
    eyesSvg = `
      <ellipse cx="${eyeX}" cy="${eyeY}" rx="4.5" ry="5.5" fill="#0284c7"/>
      <ellipse cx="${eyeX}" cy="${eyeY}" rx="3" ry="4" fill="#0369a1"/>
      <circle cx="${eyeX + 1.2}" cy="${eyeY - 1.8}" r="1.8" fill="#ffffff"/>
      <circle cx="${eyeX - 1.5}" cy="${eyeY + 2}" r="0.8" fill="#ffffff"/>
      <path d="M${eyeX - 6} ${eyeY - 7} Q${eyeX} ${eyeY - 9} ${eyeX + 6} ${eyeY - 6}" stroke="#78350f" stroke-width="2" stroke-linecap="round" fill="none"/>
    `;
  }

  // Mouth rendering
  let mouthSvg = '';
  const mouthX = cx + 8;
  const mouthY = cy - 67;
  if (mouthState === 'smile') {
    mouthSvg = `<path d="M${mouthX - 3} ${mouthY} Q${mouthX} ${mouthY + 3.5} ${mouthX + 5} ${mouthY}" stroke="#e11d48" stroke-width="1.8" stroke-linecap="round" fill="none"/>`;
  } else if (mouthState === 'open' || mouthState === 'cheer') {
    mouthSvg = `
      <path d="M${mouthX - 4} ${mouthY} Q${mouthX} ${mouthY + 7} ${mouthX + 5} ${mouthY} Z" fill="#e11d48"/>
      <path d="M${mouthX - 2} ${mouthY + 2} Q${mouthX} ${mouthY + 4} ${mouthX + 3} ${mouthY + 2}" fill="#ffffff"/>
    `;
  } else if (mouthState === 'grimace' || mouthState === 'gasp') {
    mouthSvg = `<ellipse cx="${mouthX}" cy="${mouthY + 1}" rx="3" ry="3.5" fill="#be123c"/>`;
  }

  // Tiara Sparkle
  let tiaraSparkleSvg = '';
  if (tiaraGlint) {
    tiaraSparkleSvg = `
      <polygon points="${cx + 14},${cy - 106} ${cx + 17},${cy - 100} ${cx + 23},${cy - 97} ${cx + 17},${cy - 94} ${cx + 14},${cy - 88} ${cx + 11},${cy - 94} ${cx + 5},${cy - 97} ${cx + 11},${cy - 100}" fill="#ffffff" opacity="0.95"/>
    `;
  }

  // Optional Dash Trail / Speedlines
  let speedLines = '';
  if (dashTrail) {
    speedLines = `
      <g opacity="0.6">
        <path d="M${cx - 60} ${cy - 40} L${cx - 20} ${cy - 40}" stroke="#fbbf24" stroke-width="3" stroke-linecap="round" opacity="0.7"/>
        <path d="M${cx - 75} ${cy - 20} L${cx - 25} ${cy - 20}" stroke="#fef08a" stroke-width="4" stroke-linecap="round" opacity="0.8"/>
        <path d="M${cx - 50} ${cy - 60} L${cx - 15} ${cy - 60}" stroke="#fbbf24" stroke-width="2.5" stroke-linecap="round" opacity="0.6"/>
        <ellipse cx="${cx - 45}" cy="${cy - 30}" rx="30" ry="12" fill="url(#honeyGlowGrad)" opacity="0.35"/>
      </g>
    `;
  }

  // Optional Sparkles (Victory / Jump)
  let sparkleGroup = '';
  if (sparkles) {
    sparkleGroup = `
      <g>
        <circle cx="${cx + 35}" cy="${cy - 90}" r="3" fill="#fde047"/>
        <circle cx="${cx - 30}" cy="${cy - 70}" r="2.5" fill="#fef08a"/>
        <circle cx="${cx + 42}" cy="${cy - 40}" r="2" fill="#fbbf24"/>
        <polygon points="${cx + 35},${cy - 110} ${cx + 38},${cy - 105} ${cx + 43},${cy - 102} ${cx + 38},${cy - 99} ${cx + 35},${cy - 94} ${cx + 32},${cy - 99} ${cx + 27},${cy - 102} ${cx + 32},${cy - 105}" fill="#ffffff" opacity="0.9"/>
      </g>
    `;
  }

  // Legs calculations
  const legLeftX = cx - 10;
  const legRightX = cx + 8;
  const legL_Rot = legL.angle;
  const legR_Rot = legR.angle;
  const legL_Lift = legL.lift || 0;
  const legR_Lift = legR.lift || 0;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">
  <defs>
    <!-- Royal Amber Dress Gradient -->
    <linearGradient id="ariaDressGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#fbbf24" />
      <stop offset="28%" stop-color="#1e1b4b" />
      <stop offset="65%" stop-color="#f59e0b" />
      <stop offset="100%" stop-color="#0f172a" />
    </linearGradient>

    <!-- Translucent Fairy Bee Wings -->
    <linearGradient id="ariaWingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef08a" stop-opacity="0.95" />
      <stop offset="50%" stop-color="#fbbf24" stop-opacity="0.75" />
      <stop offset="100%" stop-color="#fef9c3" stop-opacity="0.25" />
    </linearGradient>

    <!-- Royal Honey Capelet -->
    <linearGradient id="ariaCapeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f59e0b" />
      <stop offset="60%" stop-color="#d97706" />
      <stop offset="100%" stop-color="#78350f" />
    </linearGradient>

    <!-- Honey Glow Ambient -->
    <radialGradient id="honeyGlowGrad" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#fef08a" stop-opacity="0.8" />
      <stop offset="60%" stop-color="#f59e0b" stop-opacity="0.3" />
      <stop offset="100%" stop-color="#b45309" stop-opacity="0" />
    </radialGradient>
  </defs>

  <g transform="translate(${cx}, ${cy}) scale(${squashX}, ${squashY}) translate(${-cx}, ${-cy})" opacity="${dissolveAlpha}">
    ${speedLines}

    <!-- 1. TRANSLUCENT FAIRY BEE WINGS (Back pair & main pair) -->
    <g transform="rotate(${wingFlap}, ${cx - 10}, ${cy - 55})" opacity="${wingGlow}">
      <!-- Outer Upper Wing -->
      <path d="M${cx - 10} ${cy - 55} C${cx - 45} ${cy - 85}, ${cx - 75} ${cy - 75}, ${cx - 60} ${cy - 48} C${cx - 45} ${cy - 30}, ${cx - 20} ${cy - 45}, ${cx - 10} ${cy - 55} Z"
            fill="url(#ariaWingGrad)" stroke="#fef08a" stroke-width="1.8" />
      <!-- Wing Golden Veins -->
      <path d="M${cx - 10} ${cy - 55} Q${cx - 45} ${cy - 60} ${cx - 62} ${cy - 55} M${cx - 32} ${cy - 58} Q${cx - 48} ${cy - 72} ${cx - 55} ${cy - 70}"
            stroke="#fde047" stroke-width="1.2" fill="none" opacity="0.8" />

      <!-- Outer Lower Wing -->
      <path d="M${cx - 12} ${cy - 48} C${cx - 40} ${cy - 52}, ${cx - 55} ${cy - 35}, ${cx - 42} ${cy - 22} C${cx - 30} ${cy - 12}, ${cx - 15} ${cy - 35}, ${cx - 12} ${cy - 48} Z"
            fill="url(#ariaWingGrad)" stroke="#fef08a" stroke-width="1.4" opacity="0.85" />
    </g>

    <!-- 2. FLOWING ROYAL HONEY CAPELET -->
    <g transform="rotate(${capeAngle}, ${cx - 6}, ${cy - 50})">
      <path d="M${cx - 8} ${cy - 52} Q${cx - 32 + capeAngle * 0.4} ${cy - 30}, ${cx - 24 + capeAngle * 0.6} ${cy - 4} Q${cx - 14} ${cy - 18}, ${cx - 2} ${cy - 34} Z"
            fill="url(#ariaCapeGrad)" stroke="#b45309" stroke-width="1" />
      <!-- Capelet Gold Hem Trim -->
      <path d="M${cx - 32 + capeAngle * 0.4} ${cy - 30} Q${cx - 28 + capeAngle * 0.5} ${cy - 12} ${cx - 24 + capeAngle * 0.6} ${cy - 4}"
            stroke="#fde047" stroke-width="2" fill="none" />
    </g>

    <!-- 3. ROYAL PLATFORMER BOOTS & LEGS -->
    <!-- Left Leg / Boot -->
    <g transform="rotate(${legL_Rot}, ${legLeftX}, ${cy - 24}) translate(0, ${-legL_Lift})">
      <rect x="${legLeftX - 6}" y="${cy - 24}" width="12" height="18" rx="3" fill="#1e1b4b" />
      <!-- Boot Gold Trim Cuff -->
      <rect x="${legLeftX - 6}" y="${cy - 26}" width="12" height="4" rx="1.5" fill="#fbbf24" />
      <!-- Practical Sole -->
      <rect x="${legLeftX - 7}" y="${cy - 8}" width="15" height="6" rx="2" fill="#0f172a" />
      <rect x="${legLeftX - 6}" y="${cy - 6}" width="13" height="2" fill="#fbbf24" />
    </g>

    <!-- Right Leg / Boot -->
    <g transform="rotate(${legR_Rot}, ${legRightX}, ${cy - 24}) translate(0, ${-legR_Lift})">
      <rect x="${legRightX - 6}" y="${cy - 24}" width="12" height="18" rx="3" fill="#1e1b4b" />
      <!-- Boot Gold Trim Cuff -->
      <rect x="${legRightX - 6}" y="${cy - 26}" width="12" height="4" rx="1.5" fill="#fbbf24" />
      <!-- Practical Sole -->
      <rect x="${legRightX - 7}" y="${cy - 8}" width="15" height="6" rx="2" fill="#0f172a" />
      <rect x="${legRightX - 6}" y="${cy - 6}" width="13" height="2" fill="#fbbf24" />
    </g>

    <!-- 4. BEE-INSPIRED ROYAL DRESS & BODICE -->
    <g transform="rotate(${torsoAngle}, ${cx}, ${cy - 40})">
      <!-- Layered Royal Petal Skirt -->
      <path d="M${cx - 14} ${cy - 48} L${cx + 14} ${cy - 48} L${cx + 22 + skirtFlare} ${cy - 16} L${cx - 22 - skirtFlare} ${cy - 16} Z"
            fill="url(#ariaDressGrad)" stroke="#1e1b4b" stroke-width="1.5" />

      <!-- Honeycomb Royal Belt Emblem -->
      <polygon points="${cx},${cy - 48} ${cx + 7},${cy - 44} ${cx + 7},${cy - 36} ${cx},${cy - 32} ${cx - 7},${cy - 36} ${cx - 7},${cy - 44}"
               fill="#fde047" stroke="#b45309" stroke-width="1" />
      <circle cx="${cx}" cy="${cy - 40}" r="2.5" fill="#f59e0b" />

      <!-- Skirt Golden Honey Trims -->
      <path d="M${cx - 20 - skirtFlare * 0.8} ${cy - 20} Q${cx} ${cy - 15} ${cx + 20 + skirtFlare * 0.8} ${cy - 20}"
            stroke="#fde047" stroke-width="2.5" fill="none" />
      <path d="M${cx - 18 - skirtFlare * 0.5} ${cy - 27} Q${cx} ${cy - 23} ${cx + 18 + skirtFlare * 0.5} ${cy - 27}"
            stroke="#f59e0b" stroke-width="2" fill="none" />

      <!-- Bodice Golden Embroidery -->
      <path d="M${cx - 10} ${cy - 46} L${cx} ${cy - 38} L${cx + 10} ${cy - 46}"
            stroke="#fde047" stroke-width="2" fill="none" />

      <!-- Left Arm & Bracer -->
      <g transform="rotate(${armL.angle}, ${cx - 12}, ${cy - 50})">
        <rect x="${cx - 16}" y="${cy - 50}" width="8" height="18" rx="4" fill="#fbbf24" />
        <rect x="${cx - 16}" y="${cy - 40}" width="8" height="6" rx="2" fill="#1e1b4b" />
        <circle cx="${cx - 12}" cy="${cy - 30}" r="4" fill="#fed7aa" />
      </g>

      <!-- Right Arm & Bracer -->
      <g transform="rotate(${armR.angle}, ${cx + 12}, ${cy - 50})">
        <rect x="${cx + 8}" y="${cy - 50}" width="8" height="18" rx="4" fill="#fbbf24" />
        <rect x="${cx + 8}" y="${cy - 40}" width="8" height="6" rx="2" fill="#1e1b4b" />
        <circle cx="${cx + 12}" cy="${cy - 30}" r="4" fill="#fed7aa" />
      </g>
    </g>

    <!-- 5. HEAD, HAIR, TIARA & EXPRESSION -->
    <g transform="rotate(${headTilt}, ${cx}, ${cy - 78})">
      <!-- Flowing Dark Chestnut Hair (Back) -->
      <circle cx="${cx}" cy="${cy - 78}" r="22" fill="#78350f" />
      <path d="M${cx - 18} ${cy - 82} Q${cx - 26} ${cy - 60} ${cx - 18} ${cy - 46} Q${cx - 10} ${cy - 58} ${cx - 8} ${cy - 70} Z"
            fill="#92400e" />

      <!-- Expressive Princess Face (Warm Fair Skin) -->
      <circle cx="${cx + 2}" cy="${cy - 77}" r="17" fill="#fed7aa" />

      <!-- Soft Pink Cheeks -->
      <ellipse cx="${cx + 10}" cy="${cy - 70}" rx="4" ry="2.2" fill="#f43f5e" opacity="0.4" />
      <ellipse cx="${cx - 4}" cy="${cy - 70}" rx="3.5" ry="2" fill="#f43f5e" opacity="0.3" />

      <!-- Front Hair Bangs with Chestnut Highlights -->
      <path d="M${cx - 15} ${cy - 86} Q${cx} ${cy - 96} ${cx + 18} ${cy - 84} Q${cx + 8} ${cy - 78} ${cx - 2} ${cy - 82} Q${cx - 8} ${cy - 80} ${cx - 15} ${cy - 86} Z"
            fill="#92400e" />
      <path d="M${cx + 8} ${cy - 84} Q${cx + 16} ${cy - 74} ${cx + 14} ${cy - 66} Q${cx + 8} ${cy - 72} ${cx + 6} ${cy - 80} Z"
            fill="#78350f" />

      <!-- Eyes & Mouth -->
      ${eyesSvg}
      ${mouthSvg}

      <!-- 6. GOLDEN ROYAL BEE TIARA -->
      <path d="M${cx - 11} ${cy - 92} L${cx + 13} ${cy - 92} L${cx + 15} ${cy - 96} L${cx + 7} ${cy - 100} L${cx} ${cy - 104} L${cx - 7} ${cy - 100} L${cx - 13} ${cy - 96} Z"
            fill="#fde047" stroke="#d97706" stroke-width="1.2" />

      <!-- Tiara Bee Antennae Accents with Glowing Honey Pearls -->
      <path d="M${cx - 3} ${cy - 103} Q${cx - 8} ${cy - 112} ${cx - 12} ${cy - 114}"
            stroke="#f59e0b" stroke-width="2" stroke-linecap="round" fill="none" />
      <path d="M${cx + 3} ${cy - 103} Q${cx + 8} ${cy - 112} ${cx + 12} ${cy - 114}"
            stroke="#f59e0b" stroke-width="2" stroke-linecap="round" fill="none" />
      <circle cx="${cx - 12}" cy="${cy - 114}" r="3.2" fill="#fef08a" stroke="#d97706" stroke-width="1" />
      <circle cx="${cx + 12}" cy="${cy - 114}" r="3.2" fill="#fef08a" stroke="#d97706" stroke-width="1" />
      <circle cx="${cx}" cy="${cy - 97}" r="2" fill="#0284c7" />

      ${tiaraSparkleSvg}
    </g>

    ${sparkleGroup}
  </g>
</svg>`;
}

// -------------------------------------------------------------
// DEFINITION OF ALL 12 ANIMATION FRAMES
// -------------------------------------------------------------

const animations = {
  // 1. IDLE: subtle breathing, blinking, slight clothing movement, gentle wings
  idle: [
    { bodyY: 185, torsoAngle: 0, skirtFlare: 0, capeAngle: 0, wingFlap: 0, wingGlow: 0.85, eyeState: 'open', mouthState: 'smile' },
    { bodyY: 184, torsoAngle: -1, skirtFlare: 1, capeAngle: 2, wingFlap: 4, wingGlow: 0.9, eyeState: 'open', mouthState: 'smile' },
    { bodyY: 183, torsoAngle: -1.5, skirtFlare: 1.5, capeAngle: 3, wingFlap: 8, wingGlow: 0.95, eyeState: 'half', mouthState: 'smile' },
    { bodyY: 183, torsoAngle: -1, skirtFlare: 1, capeAngle: 2, wingFlap: 10, wingGlow: 1.0, eyeState: 'blink', mouthState: 'smile', tiaraGlint: true },
    { bodyY: 184, torsoAngle: -0.5, skirtFlare: 0.5, capeAngle: 1, wingFlap: 6, wingGlow: 0.9, eyeState: 'open', mouthState: 'smile' },
    { bodyY: 185, torsoAngle: 0, skirtFlare: 0, capeAngle: 0, wingFlap: 2, wingGlow: 0.85, eyeState: 'open', mouthState: 'smile' },
  ],

  // 2. WALK: natural walking cycle (8 frames)
  walk: [
    // Frame 0: Left contact
    { bodyY: 185, torsoAngle: 3, legL: { angle: -22, bend: 0, lift: 2 }, legR: { angle: 18, bend: 0, lift: 0 }, armL: { angle: 18 }, armR: { angle: -18 }, capeAngle: -6, wingFlap: -4, skirtFlare: 2, eyeState: 'open', mouthState: 'smile' },
    // Frame 1: Left foot down, passing into squash
    { bodyY: 187, torsoAngle: 2, legL: { angle: -10, bend: 0, lift: 0 }, legR: { angle: 6, bend: 0, lift: 4 }, armL: { angle: 8 }, armR: { angle: -8 }, capeAngle: -4, wingFlap: 0, skirtFlare: 1, eyeState: 'open', mouthState: 'smile' },
    // Frame 2: Passing pose (Right leg swinging forward)
    { bodyY: 183, torsoAngle: 3, legL: { angle: 4, bend: 0, lift: 0 }, legR: { angle: -12, bend: 0, lift: 8 }, armL: { angle: -4 }, armR: { angle: 4 }, capeAngle: -6, wingFlap: 6, skirtFlare: 2, eyeState: 'open', mouthState: 'smile' },
    // Frame 3: Right reach
    { bodyY: 185, torsoAngle: 4, legL: { angle: 14, bend: 0, lift: 0 }, legR: { angle: -24, bend: 0, lift: 4 }, armL: { angle: -16 }, armR: { angle: 16 }, capeAngle: -8, wingFlap: 2, skirtFlare: 3, eyeState: 'open', mouthState: 'smile' },
    // Frame 4: Right contact
    { bodyY: 185, torsoAngle: 3, legL: { angle: 18, bend: 0, lift: 0 }, legR: { angle: -22, bend: 0, lift: 2 }, armL: { angle: -18 }, armR: { angle: 18 }, capeAngle: -6, wingFlap: -4, skirtFlare: 2, eyeState: 'open', mouthState: 'smile' },
    // Frame 5: Right foot down, passing
    { bodyY: 187, torsoAngle: 2, legL: { angle: 6, bend: 0, lift: 4 }, legR: { angle: -10, bend: 0, lift: 0 }, armL: { angle: -8 }, armR: { angle: 8 }, capeAngle: -4, wingFlap: 0, skirtFlare: 1, eyeState: 'open', mouthState: 'smile' },
    // Frame 6: Passing pose (Left leg swinging forward)
    { bodyY: 183, torsoAngle: 3, legL: { angle: -12, bend: 0, lift: 8 }, legR: { angle: 4, bend: 0, lift: 0 }, armL: { angle: 4 }, armR: { angle: -4 }, capeAngle: -6, wingFlap: 6, skirtFlare: 2, eyeState: 'open', mouthState: 'smile' },
    // Frame 7: Left reach
    { bodyY: 185, torsoAngle: 4, legL: { angle: -24, bend: 0, lift: 4 }, legR: { angle: 14, bend: 0, lift: 0 }, armL: { angle: 16 }, armR: { angle: -16 }, capeAngle: -8, wingFlap: 2, skirtFlare: 3, eyeState: 'open', mouthState: 'smile' },
  ],

  // 3. RUN: energetic running cycle, capelet trailing, angled forward (8 frames)
  run: [
    // Frame 0: Right drive push-off
    { bodyY: 186, torsoAngle: 12, legL: { angle: -36, bend: 0, lift: 8 }, legR: { angle: 30, bend: 0, lift: 2 }, armL: { angle: 36 }, armR: { angle: -34 }, capeAngle: -22, wingFlap: -10, skirtFlare: 4, eyeState: 'open', mouthState: 'smile' },
    // Frame 1: Airborne leap forward
    { bodyY: 180, torsoAngle: 14, legL: { angle: -24, bend: 0, lift: 14 }, legR: { angle: 16, bend: 0, lift: 10 }, armL: { angle: 22 }, armR: { angle: -20 }, capeAngle: -26, wingFlap: 8, skirtFlare: 5, eyeState: 'open', mouthState: 'smile' },
    // Frame 2: Left foot strike down
    { bodyY: 188, torsoAngle: 10, legL: { angle: -8, bend: 0, lift: 0 }, legR: { angle: -14, bend: 0, lift: 12 }, armL: { angle: 4 }, armR: { angle: -4 }, capeAngle: -18, wingFlap: 14, skirtFlare: 3, eyeState: 'open', mouthState: 'smile' },
    // Frame 3: Left leg drive launch
    { bodyY: 184, torsoAngle: 12, legL: { angle: 16, bend: 0, lift: 2 }, legR: { angle: -32, bend: 0, lift: 16 }, armL: { angle: -18 }, armR: { angle: 20 }, capeAngle: -24, wingFlap: 0, skirtFlare: 4, eyeState: 'open', mouthState: 'smile' },
    // Frame 4: Left push-off
    { bodyY: 186, torsoAngle: 12, legL: { angle: 30, bend: 0, lift: 2 }, legR: { angle: -36, bend: 0, lift: 8 }, armL: { angle: -34 }, armR: { angle: 36 }, capeAngle: -22, wingFlap: -10, skirtFlare: 4, eyeState: 'open', mouthState: 'smile' },
    // Frame 5: Airborne leap forward (other side)
    { bodyY: 180, torsoAngle: 14, legL: { angle: 16, bend: 0, lift: 10 }, legR: { angle: -24, bend: 0, lift: 14 }, armL: { angle: -20 }, armR: { angle: 22 }, capeAngle: -26, wingFlap: 8, skirtFlare: 5, eyeState: 'open', mouthState: 'smile' },
    // Frame 6: Right foot strike down
    { bodyY: 188, torsoAngle: 10, legL: { angle: -14, bend: 0, lift: 12 }, legR: { angle: -8, bend: 0, lift: 0 }, armL: { angle: -4 }, armR: { angle: 4 }, capeAngle: -18, wingFlap: 14, skirtFlare: 3, eyeState: 'open', mouthState: 'smile' },
    // Frame 7: Right leg drive launch
    { bodyY: 184, torsoAngle: 12, legL: { angle: -32, bend: 0, lift: 16 }, legR: { angle: 16, bend: 0, lift: 2 }, armL: { angle: 20 }, armR: { angle: -18 }, capeAngle: -24, wingFlap: 0, skirtFlare: 4, eyeState: 'open', mouthState: 'smile' },
  ],

  // 4. JUMP_START: anticipation crouch before jump (4 frames)
  jump_start: [
    { bodyY: 185, torsoAngle: 2, squashX: 1.0, squashY: 1.0, legL: { angle: -4, lift: 0 }, legR: { angle: 4, lift: 0 }, armL: { angle: -6 }, armR: { angle: 6 }, capeAngle: -2, wingFlap: 0, eyeState: 'open', mouthState: 'smile' },
    { bodyY: 194, torsoAngle: 4, squashX: 1.15, squashY: 0.85, legL: { angle: -14, lift: 0 }, legR: { angle: 14, lift: 0 }, armL: { angle: -24 }, armR: { angle: -20 }, capeAngle: 6, wingFlap: 16, eyeState: 'open', mouthState: 'open' },
    { bodyY: 198, torsoAngle: 6, squashX: 1.22, squashY: 0.78, legL: { angle: -20, lift: 0 }, legR: { angle: 20, lift: 0 }, armL: { angle: -32 }, armR: { angle: -28 }, capeAngle: 12, wingFlap: 24, eyeState: 'open', mouthState: 'open' },
    { bodyY: 180, torsoAngle: 0, squashX: 0.85, squashY: 1.25, legL: { angle: 0, lift: 6 }, legR: { angle: 0, lift: 6 }, armL: { angle: 26 }, armR: { angle: 26 }, capeAngle: -10, wingFlap: -14, eyeState: 'open', mouthState: 'open', sparkles: true },
  ],

  // 5. JUMP_RISE: ascending upward, streamlined (4 frames)
  jump_rise: [
    { bodyY: 178, torsoAngle: -2, squashX: 0.88, squashY: 1.18, legL: { angle: 6, lift: 8 }, legR: { angle: -4, lift: 6 }, armL: { angle: 30 }, armR: { angle: 28 }, capeAngle: -14, wingFlap: -16, wingGlow: 1.0, eyeState: 'open', mouthState: 'smile', tiaraGlint: true },
    { bodyY: 176, torsoAngle: -1, squashX: 0.92, squashY: 1.12, legL: { angle: 8, lift: 10 }, legR: { angle: -6, lift: 8 }, armL: { angle: 24 }, armR: { angle: 22 }, capeAngle: -18, wingFlap: 8, wingGlow: 0.95, eyeState: 'open', mouthState: 'smile' },
    { bodyY: 175, torsoAngle: 0, squashX: 0.96, squashY: 1.06, legL: { angle: 10, lift: 12 }, legR: { angle: -8, lift: 10 }, armL: { angle: 18 }, armR: { angle: 16 }, capeAngle: -14, wingFlap: 18, wingGlow: 0.9, eyeState: 'open', mouthState: 'smile' },
    { bodyY: 176, torsoAngle: 1, squashX: 1.0, squashY: 1.02, legL: { angle: 8, lift: 10 }, legR: { angle: -6, lift: 8 }, armL: { angle: 12 }, armR: { angle: 10 }, capeAngle: -8, wingFlap: 4, wingGlow: 0.85, eyeState: 'open', mouthState: 'smile' },
  ],

  // 6. FALL: descending (4 frames)
  fall: [
    { bodyY: 178, torsoAngle: 2, squashX: 0.95, squashY: 1.08, legL: { angle: -8, lift: 4 }, legR: { angle: 8, lift: 2 }, armL: { angle: -12 }, armR: { angle: 12 }, capeAngle: 14, wingFlap: 18, skirtFlare: 3, eyeState: 'open', mouthState: 'open' },
    { bodyY: 180, torsoAngle: 1, squashX: 0.92, squashY: 1.12, legL: { angle: -12, lift: 2 }, legR: { angle: 12, lift: 0 }, armL: { angle: -18 }, armR: { angle: 18 }, capeAngle: 20, wingFlap: 24, skirtFlare: 5, eyeState: 'open', mouthState: 'open' },
    { bodyY: 182, torsoAngle: 1, squashX: 0.94, squashY: 1.10, legL: { angle: -10, lift: 2 }, legR: { angle: 10, lift: 0 }, armL: { angle: -16 }, armR: { angle: 16 }, capeAngle: 18, wingFlap: 20, skirtFlare: 4, eyeState: 'open', mouthState: 'open' },
    { bodyY: 184, torsoAngle: 0, squashX: 0.98, squashY: 1.04, legL: { angle: -6, lift: 0 }, legR: { angle: 6, lift: 0 }, armL: { angle: -10 }, armR: { angle: 10 }, capeAngle: 12, wingFlap: 12, skirtFlare: 3, eyeState: 'open', mouthState: 'open' },
  ],

  // 7. LAND: landing impact squash & stretch (4 frames)
  land: [
    { bodyY: 192, torsoAngle: 2, squashX: 1.25, squashY: 0.78, legL: { angle: -18, lift: 0 }, legR: { angle: 18, lift: 0 }, armL: { angle: -24 }, armR: { angle: -20 }, capeAngle: 8, wingFlap: 20, skirtFlare: 6, eyeState: 'open', mouthState: 'open' },
    { bodyY: 195, torsoAngle: 4, squashX: 1.30, squashY: 0.72, legL: { angle: -24, lift: 0 }, legR: { angle: 24, lift: 0 }, armL: { angle: -30 }, armR: { angle: -26 }, capeAngle: 12, wingFlap: 26, skirtFlare: 8, eyeState: 'half', mouthState: 'smile' },
    { bodyY: 188, torsoAngle: 1, squashX: 1.10, squashY: 0.92, legL: { angle: -10, lift: 0 }, legR: { angle: 10, lift: 0 }, armL: { angle: -10 }, armR: { angle: -8 }, capeAngle: 2, wingFlap: 10, skirtFlare: 3, eyeState: 'open', mouthState: 'smile' },
    { bodyY: 185, torsoAngle: 0, squashX: 1.0, squashY: 1.0, legL: { angle: 0, lift: 0 }, legR: { angle: 0, lift: 0 }, armL: { angle: 0 }, armR: { angle: 0 }, capeAngle: 0, wingFlap: 0, skirtFlare: 0, eyeState: 'open', mouthState: 'smile' },
  ],

  // 8. CROUCH: compact crouching pose (4 frames)
  crouch: [
    { bodyY: 192, torsoAngle: 8, squashX: 1.15, squashY: 0.82, legL: { angle: -20, lift: 0 }, legR: { angle: 22, lift: 0 }, armL: { angle: -28 }, armR: { angle: -22 }, capeAngle: 10, wingFlap: 12, skirtFlare: 5, eyeState: 'open', mouthState: 'smile' },
    { bodyY: 196, torsoAngle: 12, squashX: 1.22, squashY: 0.75, legL: { angle: -28, lift: 0 }, legR: { angle: 30, lift: 0 }, armL: { angle: -36 }, armR: { angle: -30 }, capeAngle: 14, wingFlap: 16, skirtFlare: 7, eyeState: 'open', mouthState: 'smile' },
    { bodyY: 195, torsoAngle: 11, squashX: 1.20, squashY: 0.76, legL: { angle: -26, lift: 0 }, legR: { angle: 28, lift: 0 }, armL: { angle: -34 }, armR: { angle: -28 }, capeAngle: 12, wingFlap: 14, skirtFlare: 6, eyeState: 'open', mouthState: 'smile' },
    { bodyY: 196, torsoAngle: 12, squashX: 1.22, squashY: 0.75, legL: { angle: -28, lift: 0 }, legR: { angle: 30, lift: 0 }, armL: { angle: -36 }, armR: { angle: -30 }, capeAngle: 14, wingFlap: 16, skirtFlare: 7, eyeState: 'open', mouthState: 'smile' },
  ],

  // 9. DASH: aerodynamic horizontal speed burst (6 frames)
  dash: [
    { bodyY: 184, torsoAngle: 18, squashX: 1.25, squashY: 0.85, legL: { angle: -42, lift: 8 }, legR: { angle: 32, lift: 2 }, armL: { angle: -42 }, armR: { angle: 38 }, capeAngle: -34, wingFlap: -22, skirtFlare: 6, eyeState: 'open', mouthState: 'cheer', dashTrail: true },
    { bodyY: 182, torsoAngle: 24, squashX: 1.35, squashY: 0.78, legL: { angle: -48, lift: 12 }, legR: { angle: 28, lift: 6 }, armL: { angle: -48 }, armR: { angle: 44 }, capeAngle: -40, wingFlap: -26, skirtFlare: 7, eyeState: 'open', mouthState: 'cheer', dashTrail: true },
    { bodyY: 180, torsoAngle: 26, squashX: 1.38, squashY: 0.75, legL: { angle: -52, lift: 14 }, legR: { angle: 24, lift: 8 }, armL: { angle: -52 }, armR: { angle: 48 }, capeAngle: -44, wingFlap: -28, skirtFlare: 8, eyeState: 'open', mouthState: 'cheer', dashTrail: true, tiaraGlint: true },
    { bodyY: 182, torsoAngle: 24, squashX: 1.34, squashY: 0.78, legL: { angle: -48, lift: 12 }, legR: { angle: 28, lift: 6 }, armL: { angle: -48 }, armR: { angle: 44 }, capeAngle: -40, wingFlap: -26, skirtFlare: 7, eyeState: 'open', mouthState: 'cheer', dashTrail: true },
    { bodyY: 185, torsoAngle: 16, squashX: 1.20, squashY: 0.88, legL: { angle: -36, lift: 6 }, legR: { angle: 20, lift: 2 }, armL: { angle: -32 }, armR: { angle: 26 }, capeAngle: -28, wingFlap: -16, skirtFlare: 5, eyeState: 'open', mouthState: 'smile', dashTrail: true },
    { bodyY: 186, torsoAngle: 8, squashX: 1.08, squashY: 0.95, legL: { angle: -20, lift: 2 }, legR: { angle: 12, lift: 0 }, armL: { angle: -18 }, armR: { angle: 12 }, capeAngle: -14, wingFlap: -6, skirtFlare: 2, eyeState: 'open', mouthState: 'smile' },
  ],

  // 10. HURT: hit reaction, stagger back (4 frames)
  hurt: [
    { bodyY: 182, torsoAngle: -18, squashX: 1.20, squashY: 0.82, legL: { angle: 24, lift: 6 }, legR: { angle: -18, lift: 8 }, armL: { angle: 42 }, armR: { angle: 36 }, capeAngle: 24, wingFlap: 28, headTilt: -14, eyeState: 'hurt', mouthState: 'grimace' },
    { bodyY: 180, torsoAngle: -24, squashX: 1.25, squashY: 0.78, legL: { angle: 32, lift: 10 }, legR: { angle: -26, lift: 12 }, armL: { angle: 48 }, armR: { angle: 44 }, capeAngle: 30, wingFlap: 34, headTilt: -18, eyeState: 'hurt', mouthState: 'grimace' },
    { bodyY: 183, torsoAngle: -14, squashX: 1.12, squashY: 0.90, legL: { angle: 18, lift: 4 }, legR: { angle: -12, lift: 4 }, armL: { angle: 26 }, armR: { angle: 22 }, capeAngle: 18, wingFlap: 18, headTilt: -8, eyeState: 'half', mouthState: 'gasp' },
    { bodyY: 185, torsoAngle: -4, squashX: 1.02, squashY: 0.98, legL: { angle: 6, lift: 0 }, legR: { angle: -4, lift: 0 }, armL: { angle: 8 }, armR: { angle: 6 }, capeAngle: 6, wingFlap: 6, headTilt: -2, eyeState: 'open', mouthState: 'smile' },
  ],

  // 11. DEATH: defeat animation, falling and dissolving into sparkles (8 frames)
  death: [
    { bodyY: 184, torsoAngle: -12, squashX: 1.1, squashY: 0.9, legL: { angle: 16, lift: 2 }, legR: { angle: -12, lift: 4 }, armL: { angle: 30 }, armR: { angle: 26 }, capeAngle: 16, wingFlap: 20, headTilt: -8, eyeState: 'hurt', mouthState: 'grimace' },
    { bodyY: 187, torsoAngle: -22, squashX: 1.18, squashY: 0.84, legL: { angle: 28, lift: 0 }, legR: { angle: -24, lift: 2 }, armL: { angle: 42 }, armR: { angle: 38 }, capeAngle: 24, wingFlap: 28, headTilt: -16, eyeState: 'blink', mouthState: 'gasp' },
    { bodyY: 192, torsoAngle: -38, squashX: 1.25, squashY: 0.76, legL: { angle: 40, lift: 0 }, legR: { angle: -36, lift: 0 }, armL: { angle: 50 }, armR: { angle: 46 }, capeAngle: 34, wingFlap: 34, headTilt: -24, eyeState: 'blink', mouthState: 'gasp' },
    { bodyY: 198, torsoAngle: -55, squashX: 1.35, squashY: 0.68, legL: { angle: 52, lift: 0 }, legR: { angle: -48, lift: 0 }, armL: { angle: 56 }, armR: { angle: 52 }, capeAngle: 42, wingFlap: 38, headTilt: -32, eyeState: 'blink', mouthState: 'gasp' },
    { bodyY: 205, torsoAngle: -75, squashX: 1.45, squashY: 0.58, legL: { angle: 65, lift: 0 }, legR: { angle: -60, lift: 0 }, armL: { angle: 60 }, armR: { angle: 56 }, capeAngle: 48, wingFlap: 40, headTilt: -38, eyeState: 'blink', mouthState: 'gasp', dissolveAlpha: 0.85, sparkles: true },
    { bodyY: 208, torsoAngle: -85, squashX: 1.50, squashY: 0.52, legL: { angle: 72, lift: 0 }, legR: { angle: -68, lift: 0 }, armL: { angle: 64 }, armR: { angle: 60 }, capeAngle: 52, wingFlap: 42, headTilt: -42, eyeState: 'blink', mouthState: 'gasp', dissolveAlpha: 0.6, sparkles: true },
    { bodyY: 210, torsoAngle: -90, squashX: 1.55, squashY: 0.48, legL: { angle: 78, lift: 0 }, legR: { angle: -74, lift: 0 }, armL: { angle: 68 }, armR: { angle: 64 }, capeAngle: 56, wingFlap: 44, headTilt: -45, eyeState: 'blink', mouthState: 'gasp', dissolveAlpha: 0.35, sparkles: true },
    { bodyY: 210, torsoAngle: -90, squashX: 1.55, squashY: 0.48, legL: { angle: 78, lift: 0 }, legR: { angle: -74, lift: 0 }, armL: { angle: 68 }, armR: { angle: 64 }, capeAngle: 56, wingFlap: 44, headTilt: -45, eyeState: 'blink', mouthState: 'gasp', dissolveAlpha: 0.1, sparkles: true },
  ],

  // 12. VICTORY: royal twirl and celebration pose (8 frames)
  victory: [
    { bodyY: 185, torsoAngle: 0, skirtFlare: 1, capeAngle: 0, wingFlap: 6, eyeState: 'happy', mouthState: 'smile' },
    { bodyY: 183, torsoAngle: -4, skirtFlare: 4, capeAngle: 6, wingFlap: 14, armL: { angle: 28 }, armR: { angle: 28 }, eyeState: 'wink', mouthState: 'cheer', sparkles: true },
    { bodyY: 180, torsoAngle: -8, skirtFlare: 8, capeAngle: 16, wingFlap: 22, armL: { angle: 48 }, armR: { angle: 48 }, eyeState: 'happy', mouthState: 'cheer', tiaraGlint: true, sparkles: true },
    { bodyY: 178, torsoAngle: 0, skirtFlare: 12, capeAngle: 24, wingFlap: 28, armL: { angle: 62 }, armR: { angle: 62 }, eyeState: 'happy', mouthState: 'cheer', tiaraGlint: true, sparkles: true },
    { bodyY: 180, torsoAngle: 4, skirtFlare: 8, capeAngle: 14, wingFlap: 20, armL: { angle: 48 }, armR: { angle: 48 }, eyeState: 'wink', mouthState: 'cheer', sparkles: true },
    { bodyY: 183, torsoAngle: 2, skirtFlare: 4, capeAngle: 8, wingFlap: 12, armL: { angle: 32 }, armR: { angle: 32 }, eyeState: 'happy', mouthState: 'smile', sparkles: true },
    { bodyY: 185, torsoAngle: 0, skirtFlare: 2, capeAngle: 2, wingFlap: 6, armL: { angle: 18 }, armR: { angle: 18 }, eyeState: 'happy', mouthState: 'smile', tiaraGlint: true },
    { bodyY: 185, torsoAngle: 0, skirtFlare: 1, capeAngle: 0, wingFlap: 4, armL: { angle: 12 }, armR: { angle: 12 }, eyeState: 'wink', mouthState: 'smile', tiaraGlint: true },
  ],
};

// Also create jump alias folder (copying jump_rise/jump_start frames so both /jump and /jump_start work)
animations.jump = animations.jump_rise;

let totalFramesWritten = 0;

for (const [animName, frames] of Object.entries(animations)) {
  const targetDir = path.join(rootDir, `src/assets/characters/aria/${animName}`);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  frames.forEach((frameOptions, index) => {
    const svgContent = createAriaSVG(frameOptions);
    const fileName = `frame_${index}.svg`;
    const filePath = path.join(targetDir, fileName);
    fs.writeFileSync(filePath, svgContent, 'utf-8');
    totalFramesWritten++;
  });

  console.log(`Generated ${frames.length} frames for animation: ${animName}`);
}

console.log(`Successfully generated ${totalFramesWritten} HD vector frames for Princess Aria!`);
