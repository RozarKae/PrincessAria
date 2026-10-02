import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const baseDir = path.join(rootDir, 'src/assets/art/characters/aria');

const dirs = [
  path.join(baseDir, 'master'),
  path.join(baseDir, 'source'),
  path.join(baseDir, 'optimized'),
  path.join(baseDir, 'animation/idle'),
  path.join(baseDir, 'animation/walk'),
  path.join(baseDir, 'animation/run'),
  path.join(baseDir, 'animation/jump_start'),
  path.join(baseDir, 'animation/jump_rise'),
  path.join(baseDir, 'animation/fall'),
  path.join(baseDir, 'animation/land'),
  path.join(baseDir, 'animation/crouch'),
  path.join(baseDir, 'animation/dash'),
  path.join(baseDir, 'animation/hurt'),
  path.join(baseDir, 'animation/death'),
  path.join(baseDir, 'animation/victory'),
];

dirs.forEach(d => {
  if (!fs.existsSync(d)) {
    fs.mkdirSync(d, { recursive: true });
  }
});

console.log('[Aria Production] Directories created successfully.');

/**
 * PALETTE CONSTANTS — ARIA DESIGN v1.0
 */
const PALETTE = {
  GOLD_BRIGHT: '#fde047',
  GOLD_MAIN: '#fbbf24',
  GOLD_WARM: '#f59e0b',
  GOLD_METALLIC: '#d97706',
  GOLD_DARK: '#b45309',

  CHARCOAL_DARKEST: '#09090b',
  CHARCOAL_MAIN: '#18181b',
  CHARCOAL_SOFT: '#27272a',
  CHARCOAL_ACCENT: '#3f3f46',

  IVORY_CREAM: '#fffbeb',
  IVORY_HIGHLIGHT: '#fefce8',
  IVORY_SHADOW: '#fef08a',

  EMERALD_ACCENT: '#0d9488',
  EMERALD_BRIGHT: '#14b8a6',
  EMERALD_DEEP: '#047857',

  HAIR_DARK: '#451a03',
  HAIR_CHESTNUT: '#78350f',
  HAIR_AMBER: '#92400e',
  HAIR_HONEY_GLAZE: '#b45309',

  SKIN_BASE: '#fed7aa',
  SKIN_SHADOW: '#fdba74',
  SKIN_BLUSH: '#f43f5e',

  EYE_PUPIL: '#0f172a',
  EYE_SAPPHIRE: '#0284c7',
  EYE_TEAL: '#0d9488',
  EYE_WHITE: '#ffffff',
};

function getDefs() {
  return `
  <defs>
    <linearGradient id="ariaDressGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${PALETTE.GOLD_MAIN}" />
      <stop offset="35%" stop-color="${PALETTE.CHARCOAL_MAIN}" />
      <stop offset="70%" stop-color="${PALETTE.GOLD_WARM}" />
      <stop offset="100%" stop-color="${PALETTE.CHARCOAL_DARKEST}" />
    </linearGradient>

    <linearGradient id="ariaCapeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${PALETTE.GOLD_MAIN}" />
      <stop offset="50%" stop-color="${PALETTE.GOLD_WARM}" />
      <stop offset="100%" stop-color="${PALETTE.GOLD_DARK}" />
    </linearGradient>

    <radialGradient id="emeraldGrad" cx="35%" cy="35%" r="65%">
      <stop offset="0%" stop-color="${PALETTE.EMERALD_BRIGHT}" />
      <stop offset="60%" stop-color="${PALETTE.EMERALD_ACCENT}" />
      <stop offset="100%" stop-color="${PALETTE.EMERALD_DEEP}" />
    </radialGradient>

    <linearGradient id="hairGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${PALETTE.HAIR_HONEY_GLAZE}" />
      <stop offset="35%" stop-color="${PALETTE.HAIR_AMBER}" />
      <stop offset="75%" stop-color="${PALETTE.HAIR_CHESTNUT}" />
      <stop offset="100%" stop-color="${PALETTE.HAIR_DARK}" />
    </linearGradient>

    <linearGradient id="bootGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${PALETTE.CHARCOAL_SOFT}" />
      <stop offset="50%" stop-color="${PALETTE.CHARCOAL_MAIN}" />
      <stop offset="100%" stop-color="${PALETTE.CHARCOAL_DARKEST}" />
    </linearGradient>

    <filter id="royalGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="2.5" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>`;
}

/**
 * Universal Drawing Function for Princess Aria.
 * Strictly guarantees:
 * - Constant proportions (Head, Torso, Skirt, Boots)
 * - Exact ground foot alignment at Y = 131 (canvas height 138, anchorY = 0.95)
 * - Consistent face, tiara with emerald, hair ponytail, and wing-cut capelet
 */
function drawAriaPose({
  view = 'side',
  headTilt = 0,
  torsoTilt = 0,
  armLeftAngle = 0,
  armRightAngle = 0,
  legLeftAngle = 0,
  legRightAngle = 0,
  capeSway = 0,
  hairSway = 0,
  skirtSway = 0,
  crouchOffset = 0,
  squashX = 1,
  squashY = 1,
  expression = 'neutral',
  eyesClosed = false,
  width = 138,
  height = 138,
}) {
  const cx = width / 2;
  const groundY = 131; // Exact ground plane anchor (0.95 * 138)
  const baseY = groundY + crouchOffset;

  let eyeSvg = '';
  if (eyesClosed) {
    eyeSvg = `<path d="M 64 36 Q 69 40 74 36" stroke="${PALETTE.CHARCOAL_DARKEST}" stroke-width="2" fill="none" />`;
  } else if (expression === 'smile' || expression === 'victory') {
    eyeSvg = `
      <ellipse cx="69" cy="36" rx="4.5" ry="5.5" fill="${PALETTE.EYE_SAPPHIRE}" />
      <circle cx="70" cy="35" r="2.2" fill="${PALETTE.EYE_PUPIL}" />
      <circle cx="71" cy="33.5" r="1.5" fill="${PALETTE.EYE_WHITE}" />
      <circle cx="67" cy="38" r="0.9" fill="${PALETTE.EMERALD_BRIGHT}" />
      <path d="M 64 32 Q 69 30 74 32" stroke="${PALETTE.CHARCOAL_DARKEST}" stroke-width="1.8" fill="none" />
    `;
  } else if (expression === 'determined' || expression === 'angry_focused') {
    eyeSvg = `
      <ellipse cx="69" cy="36" rx="4.5" ry="5" fill="${PALETTE.EYE_SAPPHIRE}" />
      <circle cx="70" cy="36" r="2" fill="${PALETTE.EYE_PUPIL}" />
      <circle cx="71" cy="34" r="1.4" fill="${PALETTE.EYE_WHITE}" />
      <path d="M 63 31 L 75 33" stroke="${PALETTE.CHARCOAL_DARKEST}" stroke-width="2.2" stroke-linecap="round" />
    `;
  } else if (expression === 'surprised') {
    eyeSvg = `
      <circle cx="69" cy="36" r="5.5" fill="${PALETTE.EYE_SAPPHIRE}" />
      <circle cx="69" cy="36" r="2.5" fill="${PALETTE.EYE_PUPIL}" />
      <circle cx="71" cy="34" r="1.5" fill="${PALETTE.EYE_WHITE}" />
      <path d="M 64 29 Q 69 27 74 29" stroke="${PALETTE.CHARCOAL_DARKEST}" stroke-width="1.8" fill="none" />
    `;
  } else {
    // Neutral
    eyeSvg = `
      <ellipse cx="69" cy="36" rx="4.5" ry="5.5" fill="${PALETTE.EYE_SAPPHIRE}" />
      <circle cx="70" cy="36" r="2.2" fill="${PALETTE.EYE_PUPIL}" />
      <circle cx="71" cy="34" r="1.5" fill="${PALETTE.EYE_WHITE}" />
      <circle cx="67" cy="38.5" r="0.9" fill="${PALETTE.EMERALD_BRIGHT}" />
      <path d="M 64 31.5 Q 69 30 74 31.5" stroke="${PALETTE.CHARCOAL_DARKEST}" stroke-width="1.8" fill="none" />
    `;
  }

  // Mouth Svg
  let mouthSvg = '';
  if (expression === 'smile' || expression === 'victory') {
    mouthSvg = `<path d="M 66 45 Q 70 48 74 45" stroke="${PALETTE.CHARCOAL_DARKEST}" stroke-width="1.8" fill="${PALETTE.SKIN_BLUSH}" />`;
  } else if (expression === 'determined' || expression === 'angry_focused') {
    mouthSvg = `<line x1="66" y1="45" x2="73" y2="45" stroke="${PALETTE.CHARCOAL_DARKEST}" stroke-width="2" stroke-linecap="round" />`;
  } else if (expression === 'surprised') {
    mouthSvg = `<ellipse cx="70" cy="45.5" rx="2.5" ry="3.5" fill="${PALETTE.CHARCOAL_DARKEST}" />`;
  } else if (expression === 'worried') {
    mouthSvg = `<path d="M 66 46 Q 70 43 74 46" stroke="${PALETTE.CHARCOAL_DARKEST}" stroke-width="1.8" fill="none" />`;
  } else {
    mouthSvg = `<path d="M 67 45 Q 70 46.5 73 45" stroke="${PALETTE.CHARCOAL_DARKEST}" stroke-width="1.6" fill="none" />`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  ${getDefs()}
  <g transform="translate(${cx}, ${baseY}) scale(${squashX}, ${squashY}) translate(${-cx}, ${-baseY})">

    <!-- 1. WING-CUT HONEY SILK CAPELET (Behind Aria) -->
    <g transform="translate(68, 56) rotate(${capeSway}) translate(-68, -56)" opacity="0.9">
      <path d="M 60 54 Q ${40 + capeSway} 78 48 108 Q 62 88 68 62 Z" fill="url(#ariaCapeGrad)" stroke="${PALETTE.GOLD_DARK}" stroke-width="1" />
      <path d="M 64 56 Q ${46 + capeSway * 0.8} 82 56 114 Q 66 90 72 64 Z" fill="url(#ariaCapeGrad)" opacity="0.85" />
    </g>

    <!-- 2. VOLUMINOUS CHESTNUT PONYTAIL -->
    <g transform="translate(56, 32) rotate(${hairSway}) translate(-56, -32)">
      <path d="M 58 28 C 42 22, 34 38, 38 64 C 44 54, 52 46, 58 42 Z" fill="url(#hairGrad)" />
      <path d="M 40 58 Q 30 76 34 88 Q 44 74 46 58 Z" fill="url(#hairGrad)" opacity="0.9" />
      <!-- Ponytail Gold Ribbon Tie -->
      <ellipse cx="56" cy="30" rx="3.5" ry="4.5" fill="${PALETTE.GOLD_MAIN}" stroke="${PALETTE.GOLD_DARK}" stroke-width="1" />
    </g>

    <!-- 3. BACK LEG & EXPLORER BOOT -->
    <g transform="translate(62, 86) rotate(${legLeftAngle}) translate(-62, -86)">
      <!-- Thigh -->
      <line x1="62" y1="86" x2="60" y2="106" stroke="${PALETTE.CHARCOAL_MAIN}" stroke-width="8.5" stroke-linecap="round" />
      <!-- Knee Joint -->
      <circle cx="60" cy="106" r="4.5" fill="${PALETTE.GOLD_MAIN}" />
      <!-- Calf & Boot -->
      <line x1="60" y1="106" x2="58" y2="128" stroke="url(#bootGrad)" stroke-width="8" stroke-linecap="round" />
      <!-- Foot / Sole -->
      <path d="M 54 128 L 68 128 L 68 131 L 52 131 Z" fill="${PALETTE.CHARCOAL_DARKEST}" />
    </g>

    <!-- 4. FRONT LEG & EXPLORER BOOT -->
    <g transform="translate(74, 86) rotate(${legRightAngle}) translate(-74, -86)">
      <!-- Thigh -->
      <line x1="74" y1="86" x2="76" y2="106" stroke="${PALETTE.CHARCOAL_MAIN}" stroke-width="9" stroke-linecap="round" />
      <!-- Knee Joint with Gold Greave Clasp -->
      <circle cx="76" cy="106" r="4.8" fill="${PALETTE.GOLD_MAIN}" />
      <!-- Calf & Boot -->
      <line x1="76" y1="106" x2="78" y2="128" stroke="url(#bootGrad)" stroke-width="8.5" stroke-linecap="round" />
      <!-- Foot / Sole firmly planted on ground plane -->
      <path d="M 72 128 L 88 128 L 88 131 L 70 131 Z" fill="${PALETTE.CHARCOAL_DARKEST}" />
      <!-- Boot Gold Buckle -->
      <rect x="74" y="118" width="5" height="3" fill="${PALETTE.GOLD_BRIGHT}" />
    </g>

    <!-- 5. IVORY PLEATED PETTICOAT & GOLD PEPLUM SKIRT -->
    <g transform="translate(68, 76) rotate(${skirtSway}) translate(-68, -76)">
      <!-- Ivory Underskirt -->
      <path d="M 58 76 L 52 92 L 84 92 L 78 76 Z" fill="${PALETTE.IVORY_CREAM}" stroke="${PALETTE.IVORY_SHADOW}" stroke-width="1.2" />
      <!-- Honey Gold Peplum Petal Over-Skirt -->
      <path d="M 56 74 C 50 82, 54 90, 68 90 C 82 90, 86 82, 80 74 Z" fill="url(#ariaDressGrad)" stroke="${PALETTE.GOLD_DARK}" stroke-width="1.5" />
      <!-- Gold Hexagonal Belt Filigree -->
      <rect x="58" y="72" width="20" height="4.5" rx="2" fill="${PALETTE.GOLD_MAIN}" stroke="${PALETTE.GOLD_DARK}" stroke-width="1" />
      <polygon points="68,71 71,73.5 71,76 68,78 65,76 65,73.5" fill="${PALETTE.EMERALD_BRIGHT}" />
    </g>

    <!-- 6. FITTED CHARCOAL BODICE & TORSO -->
    <g transform="translate(68, 56) rotate(${torsoTilt}) translate(-68, -56)">
      <!-- Obsidian Bodice -->
      <path d="M 60 54 L 58 74 L 78 74 L 76 54 Z" fill="${PALETTE.CHARCOAL_MAIN}" stroke="${PALETTE.CHARCOAL_DARKEST}" stroke-width="1.5" />
      <!-- Scalloped Chemise Collar -->
      <path d="M 62 54 Q 68 60 74 54" fill="${PALETTE.IVORY_CREAM}" stroke="${PALETTE.GOLD_MAIN}" stroke-width="1.2" />
      <!-- Chevron Gold Embroidery -->
      <path d="M 64 62 L 68 67 L 72 62" fill="none" stroke="${PALETTE.GOLD_BRIGHT}" stroke-width="1.5" stroke-linecap="round" />
    </g>

    <!-- 7. BACK ARM & GAUNTLET -->
    <g transform="translate(60, 56) rotate(${armLeftAngle}) translate(-60, -56)">
      <line x1="60" y1="56" x2="52" y2="72" stroke="${PALETTE.CHARCOAL_MAIN}" stroke-width="6.5" stroke-linecap="round" />
      <line x1="52" y1="72" x2="48" y2="86" stroke="${PALETTE.SKIN_BASE}" stroke-width="5.5" stroke-linecap="round" />
      <circle cx="47" cy="88" r="3.2" fill="${PALETTE.SKIN_BASE}" />
    </g>

    <!-- 8. HEROIC HEAD, EXQUISITE FACE & EXPRESSION -->
    <g transform="translate(68, 40) rotate(${headTilt}) translate(-68, -40)">
      <!-- Head Base -->
      <ellipse cx="68" cy="40" rx="13" ry="15" fill="${PALETTE.SKIN_BASE}" />
      <!-- Soft Cheek Blush -->
      <ellipse cx="73" cy="43" rx="3.5" ry="2" fill="${PALETTE.SKIN_BLUSH}" opacity="0.4" />

      <!-- Natural Nose Bridge -->
      <path d="M 72 38 L 74 41 L 71 42" fill="none" stroke="${PALETTE.SKIN_SHADOW}" stroke-width="1.2" stroke-linecap="round" />

      <!-- Expressive Eye Svg -->
      ${eyeSvg}

      <!-- Expressive Mouth Svg -->
      ${mouthSvg}

      <!-- Front Hair & Side-Swept Bangs -->
      <path d="M 57 32 C 62 26, 76 25, 79 33 C 74 31, 68 33, 64 36 Z" fill="url(#hairGrad)" />
      <path d="M 57 34 Q 54 44 58 52 Q 62 42 60 36 Z" fill="url(#hairGrad)" />

      <!-- DELICATE GOLD HONEYCOMB TIARA WITH EMERALD DROPLET -->
      <!-- Honeycomb Circlet -->
      <polygon points="62,25 66,21 70,25 74,21 78,25 74,27 66,27" fill="${PALETTE.GOLD_MAIN}" stroke="${PALETTE.GOLD_DARK}" stroke-width="1" filter="url(#royalGlow)" />
      <!-- Suspended Emerald Droplet Gem -->
      <polygon points="70,26 72,29 70,33 68,29" fill="url(#emeraldGrad)" stroke="${PALETTE.GOLD_DARK}" stroke-width="0.8" />
      <circle cx="69.5" cy="28.5" r="0.8" fill="#ffffff" />
    </g>

    <!-- 9. FRONT ARM & ROYAL STAR WAND -->
    <g transform="translate(74, 56) rotate(${armRightAngle}) translate(-74, -56)">
      <!-- Upper Arm -->
      <line x1="74" y1="56" x2="82" y2="72" stroke="${PALETTE.CHARCOAL_MAIN}" stroke-width="7" stroke-linecap="round" />
      <!-- Gold-Trimmed Wrist Bracer & Hand -->
      <line x1="82" y1="72" x2="86" y2="86" stroke="${PALETTE.SKIN_BASE}" stroke-width="6" stroke-linecap="round" />
      <circle cx="87" cy="88" r="3.5" fill="${PALETTE.SKIN_BASE}" />
      <rect x="80" y="77" width="5.5" height="5" rx="1.5" fill="${PALETTE.GOLD_MAIN}" stroke="${PALETTE.GOLD_DARK}" stroke-width="0.8" />
    </g>

  </g>
</svg>`;
}

// ========================================================
// 1. GENERATE MASTER REFERENCE ARTWORK (master/)
// ========================================================
const masterDir = path.join(baseDir, 'master');

// Front View
fs.writeFileSync(path.join(masterDir, 'front_view.svg'), drawAriaPose({ view: 'front', expression: 'neutral' }));
// 3/4 Front View
fs.writeFileSync(path.join(masterDir, 'three_quarter_front_view.svg'), drawAriaPose({ view: '3/4_front', headTilt: 2, expression: 'smile' }));
// Side View
fs.writeFileSync(path.join(masterDir, 'side_view.svg'), drawAriaPose({ view: 'side', expression: 'determined' }));
// 3/4 Back View
fs.writeFileSync(path.join(masterDir, 'three_quarter_back_view.svg'), drawAriaPose({ view: '3/4_back', capeSway: 8, hairSway: 6 }));
// Back View
fs.writeFileSync(path.join(masterDir, 'back_view.svg'), drawAriaPose({ view: 'back', capeSway: 0, hairSway: 0 }));

// Expressions
const expressions = [
  { name: 'neutral', expr: 'neutral' },
  { name: 'smile', expr: 'smile' },
  { name: 'determined', expr: 'determined' },
  { name: 'surprised', expr: 'surprised' },
  { name: 'worried', expr: 'worried' },
  { name: 'angry_focused', expr: 'angry_focused' },
];

expressions.forEach(e => {
  fs.writeFileSync(path.join(masterDir, `expression_${e.name}.svg`), drawAriaPose({ expression: e.expr }));
});

// Master Character Sheet (Composite 800x600)
const masterSheetSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 680" width="1000" height="680">
  <rect width="1000" height="680" fill="#090d16" />
  <text x="500" y="44" fill="#fbbf24" font-family="Outfit, sans-serif" font-size="26" font-weight="bold" text-anchor="middle">PRINCESS ARIA — MASTER CHARACTER DESIGN v1.0</text>
  <text x="500" y="70" fill="#94a3b8" font-family="monospace" font-size="14" text-anchor="middle">Canonical Visual Specification: Front, 3/4 Front, Side, 3/4 Back, Back</text>
  <line x1="50" y1="85" x2="950" y2="85" stroke="#f59e0b" stroke-width="1.5" opacity="0.6" />

  <!-- Turnaround Row -->
  <g transform="translate(60, 110)">
    <rect x="0" y="0" width="160" height="240" fill="#0f172a" rx="8" stroke="#334155" />
    <text x="80" y="225" fill="#fde047" font-size="12" font-family="monospace" text-anchor="middle">FRONT</text>
    <image href="front_view.svg" x="11" y="20" width="138" height="138" />
  </g>
  <g transform="translate(245, 110)">
    <rect x="0" y="0" width="160" height="240" fill="#0f172a" rx="8" stroke="#334155" />
    <text x="80" y="225" fill="#fde047" font-size="12" font-family="monospace" text-anchor="middle">3/4 FRONT</text>
    <image href="three_quarter_front_view.svg" x="11" y="20" width="138" height="138" />
  </g>
  <g transform="translate(430, 110)">
    <rect x="0" y="0" width="160" height="240" fill="#0f172a" rx="8" stroke="#334155" />
    <text x="80" y="225" fill="#fde047" font-size="12" font-family="monospace" text-anchor="middle">SIDE (PROFILE)</text>
    <image href="side_view.svg" x="11" y="20" width="138" height="138" />
  </g>
  <g transform="translate(615, 110)">
    <rect x="0" y="0" width="160" height="240" fill="#0f172a" rx="8" stroke="#334155" />
    <text x="80" y="225" fill="#fde047" font-size="12" font-family="monospace" text-anchor="middle">3/4 BACK</text>
    <image href="three_quarter_back_view.svg" x="11" y="20" width="138" height="138" />
  </g>
  <g transform="translate(800, 110)">
    <rect x="0" y="0" width="160" height="240" fill="#0f172a" rx="8" stroke="#334155" />
    <text x="80" y="225" fill="#fde047" font-size="12" font-family="monospace" text-anchor="middle">BACK</text>
    <image href="back_view.svg" x="11" y="20" width="138" height="138" />
  </g>

  <!-- Ground Plane Indicator Line -->
  <line x1="50" y1="310" x2="950" y2="310" stroke="#22c55e" stroke-width="2" stroke-dasharray="8,4" opacity="0.75" />
  <text x="955" y="314" fill="#86efac" font-size="11" font-family="monospace">FEET GROUND PLANE (Y: 131 / ANCHOR: 0.95)</text>

  <!-- Expressions Row -->
  <text x="500" y="400" fill="#fbbf24" font-family="Outfit, sans-serif" font-size="18" font-weight="bold" text-anchor="middle">FACIAL EXPRESSION MATRIX</text>
  <g transform="translate(70, 425)">
    <rect x="0" y="0" width="125" height="180" fill="#0f172a" rx="8" stroke="#334155" />
    <text x="62" y="165" fill="#fde047" font-size="11" font-family="monospace" text-anchor="middle">NEUTRAL</text>
    <image href="expression_neutral.svg" x="-6" y="0" width="138" height="138" />
  </g>
  <g transform="translate(220, 425)">
    <rect x="0" y="0" width="125" height="180" fill="#0f172a" rx="8" stroke="#334155" />
    <text x="62" y="165" fill="#fde047" font-size="11" font-family="monospace" text-anchor="middle">SMILE</text>
    <image href="expression_smile.svg" x="-6" y="0" width="138" height="138" />
  </g>
  <g transform="translate(370, 425)">
    <rect x="0" y="0" width="125" height="180" fill="#0f172a" rx="8" stroke="#334155" />
    <text x="62" y="165" fill="#fde047" font-size="11" font-family="monospace" text-anchor="middle">DETERMINED</text>
    <image href="expression_determined.svg" x="-6" y="0" width="138" height="138" />
  </g>
  <g transform="translate(520, 425)">
    <rect x="0" y="0" width="125" height="180" fill="#0f172a" rx="8" stroke="#334155" />
    <text x="62" y="165" fill="#fde047" font-size="11" font-family="monospace" text-anchor="middle">SURPRISED</text>
    <image href="expression_surprised.svg" x="-6" y="0" width="138" height="138" />
  </g>
  <g transform="translate(670, 425)">
    <rect x="0" y="0" width="125" height="180" fill="#0f172a" rx="8" stroke="#334155" />
    <text x="62" y="165" fill="#fde047" font-size="11" font-family="monospace" text-anchor="middle">WORRIED</text>
    <image href="expression_worried.svg" x="-6" y="0" width="138" height="138" />
  </g>
  <g transform="translate(820, 425)">
    <rect x="0" y="0" width="125" height="180" fill="#0f172a" rx="8" stroke="#334155" />
    <text x="62" y="165" fill="#fde047" font-size="11" font-family="monospace" text-anchor="middle">ANGRY/FOCUSED</text>
    <image href="expression_angry_focused.svg" x="-6" y="0" width="138" height="138" />
  </g>
</svg>`;
fs.writeFileSync(path.join(masterDir, 'master_character_sheet.svg'), masterSheetSvg);

// Source 2048px Master Vector
fs.writeFileSync(path.join(baseDir, 'source/aria_master_2048.svg'), drawAriaPose({ width: 2048, height: 2048, expression: 'determined' }));
// Optimized Standalone Reference
fs.writeFileSync(path.join(baseDir, 'optimized/aria_production_opt.svg'), drawAriaPose({ width: 138, height: 138, expression: 'determined' }));

console.log('[Aria Production] Master character sheet and expressions generated.');

// ========================================================
// 2. GENERATE ALL 12 GAMEPLAY ANIMATIONS (animation/)
// ========================================================

// 1. IDLE (8 frames) - subtle breathing, skirt ripple, blink on frame 4
const idleDir = path.join(baseDir, 'animation/idle');
for (let i = 0; i < 8; i++) {
  const t = (i / 8) * Math.PI * 2;
  const breath = Math.sin(t) * 1.5;
  const eyesClosed = i === 4;
  const svg = drawAriaPose({
    crouchOffset: -breath * 0.4,
    headTilt: Math.sin(t) * 1.5,
    torsoTilt: Math.sin(t) * 0.8,
    capeSway: Math.sin(t) * 2.5,
    skirtSway: Math.cos(t) * 1.5,
    hairSway: Math.sin(t) * 2,
    squashY: 1 + breath * 0.015,
    squashX: 1 - breath * 0.01,
    expression: 'neutral',
    eyesClosed,
  });
  fs.writeFileSync(path.join(idleDir, `frame_${i}.svg`), svg);
}

// 2. WALK (8 frames) - rhythmic heel plant and passing positions
const walkDir = path.join(baseDir, 'animation/walk');
for (let i = 0; i < 8; i++) {
  const phase = (i / 8) * Math.PI * 2;
  const legL = Math.sin(phase) * 24;
  const legR = -legL;
  const armL = -legL * 0.9;
  const armR = legL * 0.9;
  const bob = Math.abs(Math.sin(phase)) * 2;

  const svg = drawAriaPose({
    legLeftAngle: legL,
    legRightAngle: legR,
    armLeftAngle: armL,
    armRightAngle: armR,
    crouchOffset: bob,
    capeSway: 6 + Math.sin(phase) * 5,
    hairSway: 4 + Math.sin(phase) * 3,
    skirtSway: Math.sin(phase) * 4,
    expression: 'determined',
  });
  fs.writeFileSync(path.join(walkDir, `frame_${i}.svg`), svg);
}

// 3. RUN (10 frames) - aggressive forward drive, trailing capelet
const runDir = path.join(baseDir, 'animation/run');
for (let i = 0; i < 10; i++) {
  const phase = (i / 10) * Math.PI * 2;
  const legL = Math.sin(phase) * 42;
  const legR = -legL;
  const armL = -legL * 1.1;
  const armR = legL * 1.1;
  const bob = Math.abs(Math.sin(phase)) * 4.5;

  const svg = drawAriaPose({
    legLeftAngle: legL,
    legRightAngle: legR,
    armLeftAngle: armL,
    armRightAngle: armR,
    headTilt: 6,
    torsoTilt: 12, // Strong athletic forward lean
    crouchOffset: bob,
    capeSway: 24 + Math.sin(phase) * 8, // Flutters aerodynamically like wings
    hairSway: 16 + Math.sin(phase) * 6,
    skirtSway: Math.sin(phase) * 8,
    expression: 'determined',
  });
  fs.writeFileSync(path.join(runDir, `frame_${i}.svg`), svg);
}

// 4. JUMP_START (4 frames) - anticipation crouch
const jumpStartDir = path.join(baseDir, 'animation/jump_start');
for (let i = 0; i < 4; i++) {
  const progress = i / 3;
  const crouch = progress * 14;
  const svg = drawAriaPose({
    crouchOffset: crouch,
    squashY: 1 - progress * 0.22,
    squashX: 1 + progress * 0.16,
    headTilt: -progress * 4,
    torsoTilt: progress * 6,
    legLeftAngle: -progress * 15,
    legRightAngle: progress * 15,
    armLeftAngle: progress * 20,
    armRightAngle: -progress * 20,
    capeSway: progress * 12,
    expression: 'determined',
  });
  fs.writeFileSync(path.join(jumpStartDir, `frame_${i}.svg`), svg);
}

// 5. JUMP_RISE (4 frames) - upward launch with trailing capelet
const jumpRiseDir = path.join(baseDir, 'animation/jump_rise');
for (let i = 0; i < 4; i++) {
  const progress = i / 3;
  const svg = drawAriaPose({
    squashY: 1.18 - progress * 0.08,
    squashX: 0.88 + progress * 0.05,
    crouchOffset: -10 - progress * 6,
    legLeftAngle: 8 - progress * 4,
    legRightAngle: -10 + progress * 5,
    armLeftAngle: -35,
    armRightAngle: 35,
    capeSway: 28, // Silk capelet billowing downwards during ascent
    hairSway: 18,
    expression: 'determined',
  });
  fs.writeFileSync(path.join(jumpRiseDir, `frame_${i}.svg`), svg);
}

// 6. FALL (4 frames) - downward descent, dress lifting
const fallDir = path.join(baseDir, 'animation/fall');
for (let i = 0; i < 4; i++) {
  const t = i / 3;
  const svg = drawAriaPose({
    crouchOffset: -6,
    squashY: 1.05,
    squashX: 0.95,
    legLeftAngle: -6 + t * 4,
    legRightAngle: 8 - t * 4,
    armLeftAngle: -20,
    armRightAngle: 25,
    capeSway: -12, // Air resistance pushes capelet upward
    skirtSway: -8,
    hairSway: -10,
    expression: 'determined',
  });
  fs.writeFileSync(path.join(fallDir, `frame_${i}.svg`), svg);
}

// 7. LAND (5 frames) - impact compression & recovery
const landDir = path.join(baseDir, 'animation/land');
for (let i = 0; i < 5; i++) {
  let crouch = 0;
  let sqY = 1;
  let sqX = 1;
  if (i === 0) { crouch = 6; sqY = 0.88; sqX = 1.15; }
  else if (i === 1) { crouch = 12; sqY = 0.80; sqX = 1.25; } // Max squash
  else if (i === 2) { crouch = 8; sqY = 0.90; sqX = 1.12; }
  else if (i === 3) { crouch = 4; sqY = 0.96; sqX = 1.05; }
  else { crouch = 0; sqY = 1.0; sqX = 1.0; } // Recovered

  const svg = drawAriaPose({
    crouchOffset: crouch,
    squashY: sqY,
    squashX: sqX,
    capeSway: 14 - i * 3,
    hairSway: 12 - i * 3,
    expression: 'neutral',
  });
  fs.writeFileSync(path.join(landDir, `frame_${i}.svg`), svg);
}

// 8. CROUCH (4 frames) - low crawl stance
const crouchDir = path.join(baseDir, 'animation/crouch');
for (let i = 0; i < 4; i++) {
  const breath = Math.sin((i / 4) * Math.PI * 2) * 1.5;
  const svg = drawAriaPose({
    crouchOffset: 18 + breath,
    squashY: 0.76,
    squashX: 1.22,
    torsoTilt: 16,
    headTilt: -8,
    legLeftAngle: -25,
    legRightAngle: 25,
    armLeftAngle: 20,
    armRightAngle: -15,
    capeSway: -6,
    expression: 'determined',
  });
  fs.writeFileSync(path.join(crouchDir, `frame_${i}.svg`), svg);
}

// 9. DASH (6 frames) - high-speed aerodynamic horizontal dash
const dashDir = path.join(baseDir, 'animation/dash');
for (let i = 0; i < 6; i++) {
  const t = i / 5;
  const svg = drawAriaPose({
    crouchOffset: 4,
    squashY: 0.85,
    squashX: 1.35, // Horizontal speed elongation
    headTilt: 8,
    torsoTilt: 22, // Sharp aerodynamic forward slant
    legLeftAngle: 35,
    legRightAngle: -30,
    armLeftAngle: -45,
    armRightAngle: 50,
    capeSway: 42, // Maximum horizontal wing-cut trail
    hairSway: 28,
    expression: 'determined',
  });
  fs.writeFileSync(path.join(dashDir, `frame_${i}.svg`), svg);
}

// 10. HURT (4 frames) - recoil & hit reaction
const hurtDir = path.join(baseDir, 'animation/hurt');
for (let i = 0; i < 4; i++) {
  const t = i / 3;
  const svg = drawAriaPose({
    squashY: 0.88,
    squashX: 1.15,
    crouchOffset: -4 + t * 4,
    headTilt: -18,
    torsoTilt: -16, // Recoil backward
    armLeftAngle: -35,
    armRightAngle: -25,
    capeSway: -22,
    hairSway: -18,
    expression: 'worried',
  });
  fs.writeFileSync(path.join(hurtDir, `frame_${i}.svg`), svg);
}

// 11. DEATH (8 frames) - tragic royal collapse
const deathDir = path.join(baseDir, 'animation/death');
for (let i = 0; i < 8; i++) {
  const progress = i / 7;
  const crouch = progress * 24;
  const sqY = Math.max(0.18, 1 - progress * 0.75);
  const sqX = 1 + progress * 0.45;

  const svg = drawAriaPose({
    crouchOffset: crouch,
    squashY: sqY,
    squashX: sqX,
    torsoTilt: progress * 35,
    headTilt: progress * 25,
    armLeftAngle: progress * 30,
    armRightAngle: progress * 40,
    capeSway: progress * 20,
    expression: 'worried',
    eyesClosed: progress > 0.4,
  });
  fs.writeFileSync(path.join(deathDir, `frame_${i}.svg`), svg);
}

// 12. VICTORY (10 frames) - joyous royal spin & wand salute
const victoryDir = path.join(baseDir, 'animation/victory');
for (let i = 0; i < 10; i++) {
  const t = (i / 10) * Math.PI * 2;
  const armRaise = Math.sin(t) * 35;
  const svg = drawAriaPose({
    crouchOffset: -Math.abs(Math.sin(t)) * 6,
    armRightAngle: 55 + armRaise * 0.4,
    armLeftAngle: -30,
    headTilt: Math.sin(t) * 4,
    capeSway: 15 + Math.sin(t) * 8,
    hairSway: 12 + Math.sin(t) * 6,
    expression: 'victory',
  });
  fs.writeFileSync(path.join(victoryDir, `frame_${i}.svg`), svg);
}

console.log('[Aria Production] All 12 gameplay animations successfully generated.');

// ========================================================
// 3. GENERATE SPRITE & ANIMATION MANIFEST (aria_animation_manifest.json)
// ========================================================
const manifest = {
  character: 'aria',
  ariaDesignVersion: '1.0',
  authoritativeDesignation: 'Princess Aria Master Production Asset',
  dimensions: {
    frameWidth: 138,
    frameHeight: 138,
    physicalColliderWidth: 56,
    physicalColliderHeight: 84,
    anchorX: 0.5,
    anchorY: 0.95,
  },
  animations: {
    idle: {
      path: 'art/characters/aria/animation/idle',
      totalFrames: 8,
      fps: 8,
      loop: true,
      description: 'Breathing, dress ripple, and eye blink on frame 4',
    },
    walk: {
      path: 'art/characters/aria/animation/walk',
      totalFrames: 8,
      fps: 12,
      loop: true,
      description: 'Natural athletic stride with ground contact roll',
    },
    run: {
      path: 'art/characters/aria/animation/run',
      totalFrames: 10,
      fps: 16,
      loop: true,
      description: 'Dynamic athletic sprint with 12-deg lean and trailing capelet',
    },
    jump_start: {
      path: 'art/characters/aria/animation/jump_start',
      totalFrames: 4,
      fps: 16,
      loop: false,
      nextAnimation: 'jump_rise',
      description: 'Anticipation crouch before liftoff',
    },
    jump_rise: {
      path: 'art/characters/aria/animation/jump_rise',
      totalFrames: 4,
      fps: 12,
      loop: true,
      description: 'Ascending flight with downward billowing capelet',
    },
    fall: {
      path: 'art/characters/aria/animation/fall',
      totalFrames: 4,
      fps: 12,
      loop: true,
      description: 'Downward descent with upward wind resistance',
    },
    land: {
      path: 'art/characters/aria/animation/land',
      totalFrames: 5,
      fps: 16,
      loop: false,
      nextAnimation: 'idle',
      description: 'Ground impact squash and spring recovery',
    },
    crouch: {
      path: 'art/characters/aria/animation/crouch',
      totalFrames: 4,
      fps: 8,
      loop: true,
      description: 'Low profile defensive and crawling stance',
    },
    dash: {
      path: 'art/characters/aria/animation/dash',
      totalFrames: 6,
      fps: 16,
      loop: false,
      nextAnimation: 'run',
      description: 'High-speed aerodynamic horizontal dash with stardust trail',
    },
    hurt: {
      path: 'art/characters/aria/animation/hurt',
      totalFrames: 4,
      fps: 14,
      loop: false,
      nextAnimation: 'idle',
      description: 'Knockback stagger and defensive flinch',
    },
    death: {
      path: 'art/characters/aria/animation/death',
      totalFrames: 8,
      fps: 10,
      loop: false,
      description: 'Heroic defeat collapse and stasis fade',
    },
    victory: {
      path: 'art/characters/aria/animation/victory',
      totalFrames: 10,
      fps: 10,
      loop: true,
      description: 'Royal celebratory spin and wand salute',
    },
  },
};

fs.writeFileSync(
  path.join(baseDir, 'aria_animation_manifest.json'),
  JSON.stringify(manifest, null, 2)
);

console.log('[Aria Production] Manifest generated at aria_animation_manifest.json.');
