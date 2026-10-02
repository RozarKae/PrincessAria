import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Ensure all target directories exist
const dirs = [
  'src/assets/characters/aria/master',
  'src/assets/characters/aria/expressions',
  'src/assets/characters/aria/source_2048',
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
];

for (const d of dirs) {
  const full = path.join(rootDir, d);
  if (!fs.existsSync(full)) {
    fs.mkdirSync(full, { recursive: true });
  }
}

/**
 * PALETTE CONSTANTS - Canonical ARIA_DESIGN_VERSION 1.0
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

/**
 * Common SVG Defs (Gradients and Filters)
 */
function getSvgDefs() {
  return `
    <defs>
      <!-- Royal Honey Dress Gradient -->
      <linearGradient id="ariaDressGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="${PALETTE.GOLD_MAIN}" />
        <stop offset="35%" stop-color="${PALETTE.CHARCOAL_MAIN}" />
        <stop offset="70%" stop-color="${PALETTE.GOLD_WARM}" />
        <stop offset="100%" stop-color="${PALETTE.CHARCOAL_DARKEST}" />
      </linearGradient>

      <!-- Wing-Cut Capelet Gradient (Warm Honey to Rich Amber) -->
      <linearGradient id="ariaCapeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${PALETTE.GOLD_MAIN}" />
        <stop offset="50%" stop-color="${PALETTE.GOLD_WARM}" />
        <stop offset="100%" stop-color="${PALETTE.GOLD_DARK}" />
      </linearGradient>

      <!-- Emerald Jewel Gradient -->
      <radialGradient id="emeraldGrad" cx="35%" cy="35%" r="65%">
        <stop offset="0%" stop-color="${PALETTE.EMERALD_BRIGHT}" />
        <stop offset="60%" stop-color="${PALETTE.EMERALD_ACCENT}" />
        <stop offset="100%" stop-color="${PALETTE.EMERALD_DEEP}" />
      </radialGradient>

      <!-- Ivory Ruffle Gradient -->
      <linearGradient id="ivoryGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="${PALETTE.IVORY_HIGHLIGHT}" />
        <stop offset="100%" stop-color="${PALETTE.IVORY_CREAM}" />
      </linearGradient>

      <!-- Hair Gradient -->
      <linearGradient id="hairGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="${PALETTE.HAIR_CHESTNUT}" />
        <stop offset="60%" stop-color="${PALETTE.HAIR_AMBER}" />
        <stop offset="100%" stop-color="${PALETTE.HAIR_DARK}" />
      </linearGradient>
    </defs>
  `;
}

/**
 * Renders Aria's Face and Hair for Turnaround angles
 */
function renderHead(viewAngle = 'front', expression = 'neutral', cx = 128, cy = 90) {
  // Eyes logic based on expression
  let eyeLeft = '', eyeRight = '';
  const eyeL_X = cx - 11, eyeR_X = cx + 11;
  const eyeY = cy - 2;

  if (expression === 'smiling' || expression === 'victory') {
    eyeLeft = `<path d="M${eyeL_X - 5} ${eyeY + 1} Q${eyeL_X} ${eyeY - 4} ${eyeL_X + 5} ${eyeY + 1}" stroke="${PALETTE.CHARCOAL_DARKEST}" stroke-width="2.5" stroke-linecap="round" fill="none"/>`;
    eyeRight = `<path d="M${eyeR_X - 5} ${eyeY + 1} Q${eyeR_X} ${eyeY - 4} ${eyeR_X + 5} ${eyeY + 1}" stroke="${PALETTE.CHARCOAL_DARKEST}" stroke-width="2.5" stroke-linecap="round" fill="none"/>`;
  } else if (expression === 'determined' || expression === 'angry_focused') {
    eyeLeft = `
      <path d="M${eyeL_X - 6} ${eyeY - 5} L${eyeL_X + 6} ${eyeY - 2}" stroke="${PALETTE.HAIR_DARK}" stroke-width="2.2" stroke-linecap="round"/>
      <ellipse cx="${eyeL_X}" cy="${eyeY}" rx="4" ry="4.5" fill="${PALETTE.EYE_SAPPHIRE}"/>
      <circle cx="${eyeL_X + 1}" cy="${eyeY - 1}" r="1.5" fill="${PALETTE.EYE_WHITE}"/>
    `;
    eyeRight = `
      <path d="M${eyeR_X + 6} ${eyeY - 5} L${eyeR_X - 6} ${eyeY - 2}" stroke="${PALETTE.HAIR_DARK}" stroke-width="2.2" stroke-linecap="round"/>
      <ellipse cx="${eyeR_X}" cy="${eyeY}" rx="4" ry="4.5" fill="${PALETTE.EYE_SAPPHIRE}"/>
      <circle cx="${eyeR_X + 1}" cy="${eyeY - 1}" r="1.5" fill="${PALETTE.EYE_WHITE}"/>
    `;
  } else if (expression === 'surprised') {
    eyeLeft = `
      <ellipse cx="${eyeL_X}" cy="${eyeY}" rx="5" ry="6" fill="${PALETTE.EYE_SAPPHIRE}"/>
      <circle cx="${eyeL_X + 1}" cy="${eyeY - 1}" r="2" fill="${PALETTE.EYE_WHITE}"/>
    `;
    eyeRight = `
      <ellipse cx="${eyeR_X}" cy="${eyeY}" rx="5" ry="6" fill="${PALETTE.EYE_SAPPHIRE}"/>
      <circle cx="${eyeR_X + 1}" cy="${eyeY - 1}" r="2" fill="${PALETTE.EYE_WHITE}"/>
    `;
  } else if (expression === 'worried') {
    eyeLeft = `
      <path d="M${eyeL_X - 6} ${eyeY - 3} L${eyeL_X + 5} ${eyeY - 6}" stroke="${PALETTE.HAIR_DARK}" stroke-width="2" stroke-linecap="round"/>
      <ellipse cx="${eyeL_X}" cy="${eyeY}" rx="4" ry="4.8" fill="${PALETTE.EYE_SAPPHIRE}"/>
      <circle cx="${eyeL_X}" cy="${eyeY - 1}" r="1.5" fill="${PALETTE.EYE_WHITE}"/>
    `;
    eyeRight = `
      <path d="M${eyeR_X - 5} ${eyeY - 6} L${eyeR_X + 6} ${eyeY - 3}" stroke="${PALETTE.HAIR_DARK}" stroke-width="2" stroke-linecap="round"/>
      <ellipse cx="${eyeR_X}" cy="${eyeY}" rx="4" ry="4.8" fill="${PALETTE.EYE_SAPPHIRE}"/>
      <circle cx="${eyeR_X}" cy="${eyeY - 1}" r="1.5" fill="${PALETTE.EYE_WHITE}"/>
    `;
  } else {
    // Neutral & default
    eyeLeft = `
      <ellipse cx="${eyeL_X}" cy="${eyeY}" rx="4.5" ry="5.5" fill="${PALETTE.EYE_SAPPHIRE}"/>
      <ellipse cx="${eyeL_X}" cy="${eyeY}" rx="3" ry="4" fill="${PALETTE.EYE_TEAL}"/>
      <circle cx="${eyeL_X + 1.2}" cy="${eyeY - 1.8}" r="1.8" fill="${PALETTE.EYE_WHITE}"/>
      <circle cx="${eyeL_X - 1.2}" cy="${eyeY + 2}" r="0.8" fill="${PALETTE.EYE_WHITE}"/>
      <path d="M${eyeL_X - 6} ${eyeY - 7} Q${eyeL_X} ${eyeY - 9} ${eyeL_X + 6} ${eyeY - 7}" stroke="${PALETTE.HAIR_DARK}" stroke-width="2" stroke-linecap="round" fill="none"/>
    `;
    eyeRight = `
      <ellipse cx="${eyeR_X}" cy="${eyeY}" rx="4.5" ry="5.5" fill="${PALETTE.EYE_SAPPHIRE}"/>
      <ellipse cx="${eyeR_X}" cy="${eyeY}" rx="3" ry="4" fill="${PALETTE.EYE_TEAL}"/>
      <circle cx="${eyeR_X + 1.2}" cy="${eyeY - 1.8}" r="1.8" fill="${PALETTE.EYE_WHITE}"/>
      <circle cx="${eyeR_X - 1.2}" cy="${eyeY + 2}" r="0.8" fill="${PALETTE.EYE_WHITE}"/>
      <path d="M${eyeR_X - 6} ${eyeY - 7} Q${eyeR_X} ${eyeY - 9} ${eyeR_X + 6} ${eyeY - 7}" stroke="${PALETTE.HAIR_DARK}" stroke-width="2" stroke-linecap="round" fill="none"/>
    `;
  }

  // Mouth logic
  let mouth = '';
  const mouthY = cy + 10;
  if (expression === 'smiling') {
    mouth = `<path d="M${cx - 4} ${mouthY} Q${cx} ${mouthY + 4} ${cx + 4} ${mouthY}" stroke="#e11d48" stroke-width="2" stroke-linecap="round" fill="none"/>`;
  } else if (expression === 'surprised') {
    mouth = `<ellipse cx="${cx}" cy="${mouthY + 1}" rx="3" ry="4" fill="#be123c"/>`;
  } else if (expression === 'determined' || expression === 'angry_focused') {
    mouth = `<path d="M${cx - 5} ${mouthY + 1} L${cx + 5} ${mouthY}" stroke="#9f1239" stroke-width="2" stroke-linecap="round"/>`;
  } else if (expression === 'worried') {
    mouth = `<path d="M${cx - 4} ${mouthY + 2} Q${cx} ${mouthY - 1} ${cx + 4} ${mouthY + 2}" stroke="#be123c" stroke-width="1.8" stroke-linecap="round" fill="none"/>`;
  } else {
    mouth = `<path d="M${cx - 3.5} ${mouthY} Q${cx} ${mouthY + 2.5} ${cx + 3.5} ${mouthY}" stroke="#e11d48" stroke-width="1.8" stroke-linecap="round" fill="none"/>`;
  }

  if (viewAngle === 'back') {
    return `
      <!-- Back View Head & Adventurer Ponytail/Braid -->
      <g>
        <circle cx="${cx}" cy="${cy}" r="22" fill="url(#hairGrad)" />
        <!-- Adventurer Braid / Ponytail falling down back -->
        <path d="M${cx - 8} ${cy - 4} Q${cx - 14} ${cy + 25} ${cx - 6} ${cy + 48} Q${cx} ${cy + 30} ${cx + 6} ${cy + 48} Q${cx + 14} ${cy + 25} ${cx + 8} ${cy - 4} Z"
              fill="${PALETTE.HAIR_DARK}" stroke="${PALETTE.HAIR_AMBER}" stroke-width="1.5" />
        <!-- Braid Golden Tie Ribbon -->
        <rect x="${cx - 7}" y="${cy + 42}" width="14" height="4" rx="2" fill="${PALETTE.GOLD_MAIN}" />
        <!-- Honeycomb Tiara Back Band -->
        <path d="M${cx - 16} ${cy - 12} Q${cx} ${cy - 16} ${cx + 16} ${cy - 12}"
              stroke="${PALETTE.GOLD_MAIN}" stroke-width="2.5" fill="none" />
      </g>
    `;
  }

  if (viewAngle === 'side') {
    const faceX = cx + 8;
    return `
      <!-- Side View Head -->
      <g>
        <!-- Hair Base -->
        <circle cx="${cx}" cy="${cy}" r="21" fill="url(#hairGrad)" />
        <path d="M${cx - 10} ${cy - 4} Q${cx - 18} ${cy + 25} ${cx - 12} ${cy + 45} Q${cx - 4} ${cy + 25} ${cx - 2} ${cy - 2} Z"
              fill="${PALETTE.HAIR_DARK}" />
        <!-- Face Profile -->
        <path d="M${cx} ${cy - 16} Q${cx + 14} ${cy - 14} ${cx + 17} ${cy - 4} L${cx + 20} ${cy + 2} L${cx + 16} ${cy + 4} Q${cx + 17} ${cy + 9} ${cx + 14} ${cy + 14} Q${cx + 6} ${cy + 18} ${cx} ${cy + 16} Z"
              fill="${PALETTE.SKIN_BASE}" />
        <!-- Cheeks Blush -->
        <ellipse cx="${cx + 10}" cy="${cy + 6}" rx="4" ry="2.5" fill="${PALETTE.SKIN_BLUSH}" opacity="0.35" />
        <!-- Eye Profile -->
        <ellipse cx="${cx + 11}" cy="${cy}" rx="3.5" ry="5" fill="${PALETTE.EYE_SAPPHIRE}" />
        <circle cx="${cx + 12}" cy="${cy - 1.5}" r="1.5" fill="${PALETTE.EYE_WHITE}" />
        <!-- Mouth Profile -->
        <path d="M${cx + 16} ${cy + 9} L${cx + 12} ${cy + 10}" stroke="#e11d48" stroke-width="1.8" stroke-linecap="round" />
        <!-- Hair Side Braid & Fringe -->
        <path d="M${cx - 4} ${cy - 18} Q${cx + 10} ${cy - 24} ${cx + 16} ${cy - 14} Q${cx + 8} ${cy - 8} ${cx + 4} ${cy - 14} Z"
              fill="${PALETTE.HAIR_AMBER}" />
        <!-- Tiara Profile with Emerald Droplet -->
        <path d="M${cx + 4} ${cy - 16} L${cx + 16} ${cy - 18} L${cx + 14} ${cy - 24} L${cx + 8} ${cy - 22} Z"
              fill="${PALETTE.GOLD_MAIN}" stroke="${PALETTE.GOLD_METALLIC}" stroke-width="1" />
        <circle cx="${cx + 16}" cy="${cy - 18}" r="2.5" fill="url(#emeraldGrad)" />
      </g>
    `;
  }

  // Front & 3/4 View Head
  const offset = viewAngle === 'three_quarter' ? 4 : 0;
  return `
    <!-- Head Base & Flowing Chestnut Hair -->
    <g>
      <!-- Back Hair Volume -->
      <circle cx="${cx}" cy="${cy}" r="22" fill="url(#hairGrad)" />
      <path d="M${cx - 18} ${cy - 6} Q${cx - 26} ${cy + 18} ${cx - 16} ${cy + 36} Q${cx - 8} ${cy + 22} ${cx - 10} ${cy + 8} Z"
            fill="${PALETTE.HAIR_DARK}" />
      <path d="M${cx + 18} ${cy - 6} Q${cx + 26} ${cy + 18} ${cx + 16} ${cy + 36} Q${cx + 8} ${cy + 22} ${cx + 10} ${cy + 8} Z"
            fill="${PALETTE.HAIR_DARK}" />

      <!-- Face -->
      <circle cx="${cx + offset}" cy="${cy + 1}" r="17" fill="${PALETTE.SKIN_BASE}" />

      <!-- Cheeks Blush -->
      <ellipse cx="${cx - 8 + offset}" cy="${cy + 7}" rx="4" ry="2.2" fill="${PALETTE.SKIN_BLUSH}" opacity="0.35" />
      <ellipse cx="${cx + 8 + offset}" cy="${cy + 7}" rx="4" ry="2.2" fill="${PALETTE.SKIN_BLUSH}" opacity="0.35" />

      <!-- Nose -->
      <path d="M${cx + offset} ${cy + 3} Q${cx + 1 + offset} ${cy + 5} ${cx - 1 + offset} ${cy + 6}" stroke="${PALETTE.SKIN_SHADOW}" stroke-width="1.2" fill="none" stroke-linecap="round"/>

      <!-- Eyes & Mouth -->
      ${eyeLeft}
      ${eyeRight}
      ${mouth}

      <!-- Front Hair Bangs with Amber Highlights -->
      <path d="M${cx - 16} ${cy - 10} Q${cx} ${cy - 22} ${cx + 18} ${cy - 9} Q${cx + 8} ${cy - 1} ${cx - 2} ${cy - 5} Q${cx - 9} ${cy - 3} ${cx - 16} ${cy - 10} Z"
            fill="${PALETTE.HAIR_AMBER}" />
      <path d="M${cx + 8} ${cy - 9} Q${cx + 16} ${cy + 2} ${cx + 14} ${cy + 12} Q${cx + 7} ${cy + 4} ${cx + 6} ${cy - 5} Z"
            fill="${PALETTE.HAIR_CHESTNUT}" />

      <!-- HONEYCOMB TIARA WITH EMERALD DROPLET JEWEL (NO insect wings) -->
      <path d="M${cx - 12 + offset} ${cy - 16} L${cx + 14 + offset} ${cy - 16} L${cx + 16 + offset} ${cy - 20} L${cx + 8 + offset} ${cy - 24} L${cx + offset} ${cy - 28} L${cx - 8 + offset} ${cy - 24} L${cx - 14 + offset} ${cy - 20} Z"
            fill="${PALETTE.GOLD_MAIN}" stroke="${PALETTE.GOLD_METALLIC}" stroke-width="1.2" />

      <!-- Hexagonal Honeycomb Inset on Tiara -->
      <polygon points="${cx + offset},${cy - 24} ${cx + 4 + offset},${cy - 22} ${cx + 4 + offset},${cy - 18} ${cx + offset},${cy - 16} ${cx - 4 + offset},${cy - 18} ${cx - 4 + offset},${cy - 22}"
               fill="${PALETTE.CHARCOAL_MAIN}" stroke="${PALETTE.GOLD_BRIGHT}" stroke-width="0.8" />

      <!-- Center Emerald Droplet Gem -->
      <circle cx="${cx + offset}" cy="${cy - 20}" r="2.8" fill="url(#emeraldGrad)" stroke="${PALETTE.GOLD_BRIGHT}" stroke-width="0.8" />
    </g>
  `;
}

/**
 * Renders Aria's Full Master Character Design at a specific View Angle
 */
function createAriaMasterSVG(viewAngle = 'front', expression = 'neutral', options = {}) {
  const cx = 128;
  const groundY = 220; // Feet base line

  const defs = getSvgDefs();
  const headSvg = renderHead(viewAngle, expression, cx, 86);

  // Body elements per angle
  let bodySvg = '';

  if (viewAngle === 'back') {
    bodySvg = `
      <!-- BACK VIEW BODY & COSTUME -->
      <!-- Explorer Knee-High Boots -->
      <rect x="${cx - 18}" y="${groundY - 32}" width="14" height="28" rx="4" fill="${PALETTE.CHARCOAL_MAIN}" stroke="${PALETTE.CHARCOAL_DARKEST}" stroke-width="1.5" />
      <rect x="${cx + 4}" y="${groundY - 32}" width="14" height="28" rx="4" fill="${PALETTE.CHARCOAL_MAIN}" stroke="${PALETTE.CHARCOAL_DARKEST}" stroke-width="1.5" />
      <!-- Gold Buckles & Emerald Stitching on Back -->
      <rect x="${cx - 18}" y="${groundY - 26}" width="14" height="4" fill="${PALETTE.GOLD_MAIN}" />
      <rect x="${cx + 4}" y="${groundY - 26}" width="14" height="4" fill="${PALETTE.GOLD_MAIN}" />

      <!-- Skirt Back (Honey-Gold Layered Petal Hem) -->
      <path d="M${cx - 24} ${groundY - 78} L${cx + 24} ${groundY - 78} L${cx + 32} ${groundY - 36} L${cx - 32} ${groundY - 36} Z"
            fill="url(#ariaDressGrad)" stroke="${PALETTE.CHARCOAL_DARKEST}" stroke-width="1.5" />
      <path d="M${cx - 30} ${groundY - 42} Q${cx} ${groundY - 36} ${cx + 30} ${groundY - 42}"
            stroke="${PALETTE.GOLD_BRIGHT}" stroke-width="2.5" fill="none" />

      <!-- WING-CUT ROYAL HONEY SILK CAPELET (Drapes over back in graceful wing contours) -->
      <path d="M${cx - 16} ${groundY - 105} Q${cx - 40} ${groundY - 65} ${cx - 28} ${groundY - 22} Q${cx} ${groundY - 42} ${cx + 28} ${groundY - 22} Q${cx + 40} ${groundY - 65} ${cx + 16} ${groundY - 105} Z"
            fill="url(#ariaCapeGrad)" stroke="${PALETTE.GOLD_METALLIC}" stroke-width="1.5" />

      <!-- Honeycomb Embroidery on Capelet Hem -->
      <path d="M${cx - 26} ${groundY - 28} Q${cx} ${groundY - 44} ${cx + 26} ${groundY - 28}"
            stroke="${PALETTE.GOLD_BRIGHT}" stroke-width="2" fill="none" />
      <polygon points="${cx},${groundY - 50} ${cx + 6},${groundY - 46} ${cx + 6},${groundY - 38} ${cx},${groundY - 34} ${cx - 6},${groundY - 38} ${cx - 6},${groundY - 46}"
               fill="${PALETTE.CHARCOAL_MAIN}" stroke="${PALETTE.GOLD_MAIN}" stroke-width="1" />
      <circle cx="${cx}" cy="${groundY - 42}" r="2" fill="url(#emeraldGrad)" />

      <!-- Shoulders & Upper Capelet -->
      <path d="M${cx - 22} ${groundY - 104} L${cx + 22} ${groundY - 104} L${cx + 26} ${groundY - 86} L${cx - 26} ${groundY - 86} Z"
            fill="${PALETTE.CHARCOAL_MAIN}" stroke="${PALETTE.GOLD_METALLIC}" stroke-width="1" />
    `;
  } else if (viewAngle === 'side') {
    bodySvg = `
      <!-- SIDE VIEW BODY & COSTUME -->
      <!-- Explorer Boots (Side Profile) -->
      <path d="M${cx - 4} ${groundY - 32} L${cx + 14} ${groundY - 32} L${cx + 16} ${groundY - 6} L${cx + 22} ${groundY} L${cx - 6} ${groundY} L${cx - 4} ${groundY - 32} Z"
            fill="${PALETTE.CHARCOAL_MAIN}" stroke="${PALETTE.CHARCOAL_DARKEST}" stroke-width="1.5" />
      <rect x="${cx - 2}" y="${groundY - 26}" width="16" height="4" fill="${PALETTE.GOLD_MAIN}" />

      <!-- Skirt Side Silhouette (Layered Peplum Pannier) -->
      <path d="M${cx - 18} ${groundY - 78} L${cx + 16} ${groundY - 78} L${cx + 24} ${groundY - 36} L${cx - 22} ${groundY - 36} Z"
            fill="url(#ariaDressGrad)" stroke="${PALETTE.CHARCOAL_DARKEST}" stroke-width="1.5" />
      <path d="M${cx - 20} ${groundY - 42} Q${cx} ${groundY - 36} ${cx + 22} ${groundY - 42}"
            stroke="${PALETTE.GOLD_BRIGHT}" stroke-width="2.5" fill="none" />

      <!-- Wing-Cut Capelet (Flowing gently back) -->
      <path d="M${cx - 6} ${groundY - 106} Q${cx - 36} ${groundY - 75} ${cx - 28} ${groundY - 32} Q${cx - 16} ${groundY - 55} ${cx} ${groundY - 90} Z"
            fill="url(#ariaCapeGrad)" stroke="${PALETTE.GOLD_METALLIC}" stroke-width="1.2" />

      <!-- Bodice Side & Arm -->
      <path d="M${cx - 8} ${groundY - 106} L${cx + 12} ${groundY - 106} L${cx + 14} ${groundY - 78} L${cx - 10} ${groundY - 78} Z"
            fill="${PALETTE.CHARCOAL_MAIN}" stroke="${PALETTE.GOLD_METALLIC}" stroke-width="1" />

      <!-- Arm & Gold Bracer -->
      <rect x="${cx}" y="${groundY - 100}" width="10" height="24" rx="4" fill="${PALETTE.GOLD_MAIN}" />
      <rect x="${cx}" y="${groundY - 86}" width="10" height="8" fill="${PALETTE.CHARCOAL_MAIN}" />
      <circle cx="${cx + 5}" cy="${groundY - 72}" r="5" fill="${PALETTE.SKIN_BASE}" />
    `;
  } else {
    // Front and 3/4 View Body
    const off = viewAngle === 'three_quarter' ? 4 : 0;
    bodySvg = `
      <!-- FRONT / 3/4 VIEW BODY & COSTUME -->
      <!-- Soft Ambient Contact Shadow -->
      <ellipse cx="${cx}" cy="${groundY + 2}" rx="36" ry="7" fill="rgba(9, 9, 11, 0.35)" />

      <!-- 1. Wing-Cut Capelet Back Hem visible from front -->
      <path d="M${cx - 24} ${groundY - 96} Q${cx - 42} ${groundY - 60} ${cx - 32} ${groundY - 28} L${cx - 22} ${groundY - 48} Z"
            fill="url(#ariaCapeGrad)" stroke="${PALETTE.GOLD_METALLIC}" stroke-width="1" />
      <path d="M${cx + 24} ${groundY - 96} Q${cx + 42} ${groundY - 60} ${cx + 32} ${groundY - 28} L${cx + 22} ${groundY - 48} Z"
            fill="url(#ariaCapeGrad)" stroke="${PALETTE.GOLD_METALLIC}" stroke-width="1" />

      <!-- 2. Explorer Boots & Legs -->
      <!-- Left Leg / Boot -->
      <rect x="${cx - 19 + off * 0.5}" y="${groundY - 32}" width="14" height="28" rx="4" fill="${PALETTE.CHARCOAL_MAIN}" stroke="${PALETTE.CHARCOAL_DARKEST}" stroke-width="1.5" />
      <rect x="${cx - 19 + off * 0.5}" y="${groundY - 28}" width="14" height="4" fill="${PALETTE.GOLD_MAIN}" />
      <rect x="${cx - 20 + off * 0.5}" y="${groundY - 6}" width="16" height="6" rx="2" fill="${PALETTE.CHARCOAL_DARKEST}" />

      <!-- Right Leg / Boot -->
      <rect x="${cx + 5 + off * 0.5}" y="${groundY - 32}" width="14" height="28" rx="4" fill="${PALETTE.CHARCOAL_MAIN}" stroke="${PALETTE.CHARCOAL_DARKEST}" stroke-width="1.5" />
      <rect x="${cx + 5 + off * 0.5}" y="${groundY - 28}" width="14" height="4" fill="${PALETTE.GOLD_MAIN}" />
      <rect x="${cx + 4 + off * 0.5}" y="${groundY - 6}" width="16" height="6" rx="2" fill="${PALETTE.CHARCOAL_DARKEST}" />

      <!-- 3. Bee-Inspired Layered Royal Skirt & Wing-Cut Peplum -->
      <path d="M${cx - 22 + off} ${groundY - 78} L${cx + 22 + off} ${groundY - 78} L${cx + 32 + off} ${groundY - 36} L${cx - 32 + off} ${groundY - 36} Z"
            fill="url(#ariaDressGrad)" stroke="${PALETTE.CHARCOAL_DARKEST}" stroke-width="1.5" />

      <!-- Ivory Ruffle Underskirt Pleats -->
      <path d="M${cx - 28 + off} ${groundY - 36} L${cx - 24 + off} ${groundY - 31} L${cx - 18 + off} ${groundY - 36} L${cx - 12 + off} ${groundY - 31} L${cx - 6 + off} ${groundY - 36} L${cx + off} ${groundY - 31} L${cx + 6 + off} ${groundY - 36} L${cx + 12 + off} ${groundY - 31} L${cx + 18 + off} ${groundY - 36} L${cx + 24 + off} ${groundY - 31} L${cx + 28 + off} ${groundY - 36} Z"
            fill="url(#ivoryGrad)" stroke="${PALETTE.GOLD_METALLIC}" stroke-width="0.8" />

      <!-- Gold Honeycomb Trims on Skirt -->
      <path d="M${cx - 28 + off} ${groundY - 40} Q${cx + off} ${groundY - 34} ${cx + 28 + off} ${groundY - 40}"
            stroke="${PALETTE.GOLD_BRIGHT}" stroke-width="2.5" fill="none" />
      <path d="M${cx - 24 + off} ${groundY - 50} Q${cx + off} ${groundY - 44} ${cx + 24 + off} ${groundY - 50}"
            stroke="${PALETTE.GOLD_WARM}" stroke-width="2" fill="none" />

      <!-- 4. Charcoal Doublet Bodice with Gold Honeycomb Embroidery -->
      <path d="M${cx - 16 + off} ${groundY - 106} L${cx + 16 + off} ${groundY - 106} L${cx + 18 + off} ${groundY - 78} L${cx - 18 + off} ${groundY - 78} Z"
            fill="${PALETTE.CHARCOAL_MAIN}" stroke="${PALETTE.CHARCOAL_DARKEST}" stroke-width="1.2" />

      <!-- Ivory Chemise Scalloped Collar -->
      <path d="M${cx - 14 + off} ${groundY - 106} Q${cx + off} ${groundY - 98} ${cx + 14 + off} ${groundY - 106} Z"
            fill="url(#ivoryGrad)" stroke="${PALETTE.GOLD_MAIN}" stroke-width="1" />

      <!-- Honeycomb Royal Brooch with Emerald Jewel -->
      <polygon points="${cx + off},${groundY - 102} ${cx + 6 + off},${groundY - 98} ${cx + 6 + off},${groundY - 90} ${cx + off},${groundY - 86} ${cx - 6 + off},${groundY - 90} ${cx - 6 + off},${groundY - 98}"
               fill="${PALETTE.GOLD_MAIN}" stroke="${PALETTE.GOLD_METALLIC}" stroke-width="1" />
      <circle cx="${cx + off}" cy="${groundY - 94}" r="2.8" fill="url(#emeraldGrad)" stroke="${PALETTE.GOLD_BRIGHT}" stroke-width="0.8" />

      <!-- Bodice Gold Lattice Chevron Lines -->
      <path d="M${cx - 10 + off} ${groundY - 90} L${cx + off} ${groundY - 82} L${cx + 10 + off} ${groundY - 90}"
            stroke="${PALETTE.GOLD_BRIGHT}" stroke-width="1.8" fill="none" />
      <path d="M${cx - 8 + off} ${groundY - 84} L${cx + off} ${groundY - 78} L${cx + 8 + off} ${groundY - 84}"
            stroke="${PALETTE.GOLD_WARM}" stroke-width="1.5" fill="none" />

      <!-- 5. Left Arm & Bracer -->
      <g>
        <rect x="${cx - 24 + off}" y="${groundY - 102}" width="9" height="24" rx="4" fill="${PALETTE.GOLD_MAIN}" />
        <rect x="${cx - 24 + off}" y="${groundY - 90}" width="9" height="7" fill="${PALETTE.CHARCOAL_MAIN}" />
        <circle cx="${cx - 19.5 + off}" cy="${groundY - 74}" r="4.5" fill="${PALETTE.SKIN_BASE}" />
      </g>

      <!-- 6. Right Arm & Bracer -->
      <g>
        <rect x="${cx + 15 + off}" y="${groundY - 102}" width="9" height="24" rx="4" fill="${PALETTE.GOLD_MAIN}" />
        <rect x="${cx + 15 + off}" y="${groundY - 90}" width="9" height="7" fill="${PALETTE.CHARCOAL_MAIN}" />
        <circle cx="${cx + 19.5 + off}" cy="${groundY - 74}" r="4.5" fill="${PALETTE.SKIN_BASE}" />
      </g>
    `;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">
  ${defs}
  <g id="aria_${viewAngle}">
    ${bodySvg}
    ${headSvg}
  </g>
</svg>`;
}

// -------------------------------------------------------------
// 1. GENERATE MASTER CHARACTER REFERENCE (4 ANGLES)
// -------------------------------------------------------------
const masterViews = [
  { name: 'front_view.svg', angle: 'front', expr: 'neutral' },
  { name: 'three_quarter_view.svg', angle: 'three_quarter', expr: 'neutral' },
  { name: 'side_view.svg', angle: 'side', expr: 'neutral' },
  { name: 'back_view.svg', angle: 'back', expr: 'neutral' },
];

for (const v of masterViews) {
  const svg = createAriaMasterSVG(v.angle, v.expr);
  fs.writeFileSync(path.join(rootDir, 'src/assets/characters/aria/master', v.name), svg, 'utf-8');
}
console.log('Generated master turnaround angle SVGs in src/assets/characters/aria/master/');

// -------------------------------------------------------------
// 2. GENERATE MASTER MODEL SHEET (ALL 4 ANGLES TOGETHER WITH PROPORTION GUIDE)
// -------------------------------------------------------------
function generateMasterModelSheet() {
  const defs = getSvgDefs();
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 512" width="1024" height="512">
  ${defs}
  <rect width="1024" height="512" fill="#090d16" />

  <!-- Title & Specification Banner -->
  <text x="32" y="44" fill="#fbbf24" font-family="system-ui, sans-serif" font-size="24" font-weight="900" letter-spacing="1.5">PRINCESS ARIA — MASTER CHARACTER DESIGN SPECIFICATION</text>
  <text x="32" y="70" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="14">VERSION: 1.0  |  CANONICAL HEROINE DESIGN  |  HIGH RESOLUTION 2D ART PIPELINE</text>

  <!-- Horizontal Proportion Guide Lines -->
  <!-- Crown Apex Line -->
  <line x1="32" y1="140" x2="992" y2="140" stroke="#f59e0b" stroke-dasharray="4 4" stroke-width="1" opacity="0.6"/>
  <text x="940" y="136" fill="#f59e0b" font-family="monospace" font-size="11">CROWN APEX</text>

  <!-- Eye Level -->
  <line x1="32" y1="200" x2="992" y2="200" stroke="#0284c7" stroke-dasharray="4 4" stroke-width="1" opacity="0.4"/>
  <text x="940" y="196" fill="#0284c7" font-family="monospace" font-size="11">EYE LEVEL</text>

  <!-- Waist / Honeycomb Brooch -->
  <line x1="32" y1="300" x2="992" y2="300" stroke="#fde047" stroke-dasharray="4 4" stroke-width="1" opacity="0.4"/>
  <text x="940" y="296" fill="#fde047" font-family="monospace" font-size="11">WAIST / BELT</text>

  <!-- Skirt Hem -->
  <line x1="32" y1="390" x2="992" y2="390" stroke="#fbbf24" stroke-dasharray="4 4" stroke-width="1" opacity="0.4"/>
  <text x="940" y="386" fill="#fbbf24" font-family="monospace" font-size="11">SKIRT HEM</text>

  <!-- Ground Plane Baseline -->
  <line x1="32" y1="450" x2="992" y2="450" stroke="#22c55e" stroke-width="1.5" opacity="0.8"/>
  <text x="940" y="446" fill="#22c55e" font-family="monospace" font-size="11">GROUND BASE</text>

  <!-- 4 Turnaround Views -->
  <!-- 1. Front View -->
  <g transform="translate(48, 120) scale(1.35)">
    <text x="128" y="246" text-anchor="middle" fill="#f8fafc" font-family="system-ui" font-weight="bold" font-size="12">FRONT VIEW</text>
    ${createAriaMasterSVG('front', 'neutral').replace(/<\/?svg[^>]*>/g, '').replace(/<defs>[\s\S]*?<\/defs>/, '')}
  </g>

  <!-- 2. 3/4 View -->
  <g transform="translate(288, 120) scale(1.35)">
    <text x="128" y="246" text-anchor="middle" fill="#f8fafc" font-family="system-ui" font-weight="bold" font-size="12">3/4 VIEW</text>
    ${createAriaMasterSVG('three_quarter', 'neutral').replace(/<\/?svg[^>]*>/g, '').replace(/<defs>[\s\S]*?<\/defs>/, '')}
  </g>

  <!-- 3. Side View -->
  <g transform="translate(528, 120) scale(1.35)">
    <text x="128" y="246" text-anchor="middle" fill="#f8fafc" font-family="system-ui" font-weight="bold" font-size="12">SIDE PROFILE</text>
    ${createAriaMasterSVG('side', 'neutral').replace(/<\/?svg[^>]*>/g, '').replace(/<defs>[\s\S]*?<\/defs>/, '')}
  </g>

  <!-- 4. Back View -->
  <g transform="translate(768, 120) scale(1.35)">
    <text x="128" y="246" text-anchor="middle" fill="#f8fafc" font-family="system-ui" font-weight="bold" font-size="12">BACK VIEW</text>
    ${createAriaMasterSVG('back', 'neutral').replace(/<\/?svg[^>]*>/g, '').replace(/<defs>[\s\S]*?<\/defs>/, '')}
  </g>
</svg>`;
}

fs.writeFileSync(
  path.join(rootDir, 'src/assets/characters/aria/master/master_model_sheet.svg'),
  generateMasterModelSheet(),
  'utf-8'
);
console.log('Generated master model sheet in src/assets/characters/aria/master/master_model_sheet.svg');

// -------------------------------------------------------------
// 3. GENERATE EXPRESSIONS (6 EMOTIONS + EXPRESSIONS MODEL SHEET)
// -------------------------------------------------------------
const expressionsList = [
  { name: 'neutral.svg', expr: 'neutral', label: 'NEUTRAL' },
  { name: 'smiling.svg', expr: 'smiling', label: 'SMILING' },
  { name: 'determined.svg', expr: 'determined', label: 'DETERMINED' },
  { name: 'surprised.svg', expr: 'surprised', label: 'SURPRISED' },
  { name: 'worried.svg', expr: 'worried', label: 'WORRIED' },
  { name: 'angry_focused.svg', expr: 'angry_focused', label: 'ANGRY / FOCUSED' },
];

function createExpressionSVG(expr) {
  const defs = getSvgDefs();
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">
  ${defs}
  <rect width="128" height="128" rx="16" fill="#0f172a" />
  <g transform="translate(-64, -22)">
    ${renderHead('front', expr, 128, 86)}
  </g>
</svg>`;
}

for (const exp of expressionsList) {
  fs.writeFileSync(
    path.join(rootDir, 'src/assets/characters/aria/expressions', exp.name),
    createExpressionSVG(exp.expr),
    'utf-8'
  );
}

// Generate Expressions Reference Sheet
function generateExpressionsSheet() {
  const defs = getSvgDefs();
  let itemsSvg = '';
  expressionsList.forEach((e, idx) => {
    const col = idx % 3;
    const row = Math.floor(idx / 3);
    const x = 48 + col * 240;
    const y = 90 + row * 190;
    itemsSvg += `
      <g transform="translate(${x}, ${y})">
        <rect width="200" height="160" rx="12" fill="#0f172a" stroke="#f59e0b" stroke-width="1.5"/>
        <g transform="translate(36, 12) scale(1)">
          ${renderHead('front', e.expr, 64, 56)}
        </g>
        <text x="100" y="146" text-anchor="middle" fill="#fbbf24" font-family="system-ui" font-weight="bold" font-size="13">${e.label}</text>
      </g>
    `;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 780 480" width="780" height="480">
  ${defs}
  <rect width="780" height="480" fill="#090d16" />
  <text x="32" y="44" fill="#fbbf24" font-family="system-ui" font-size="22" font-weight="900">PRINCESS ARIA — EMOTIONAL EXPRESSION REFERENCE</text>
  <text x="32" y="68" fill="#94a3b8" font-family="system-ui" font-size="13">FACIAL ANATOMY, EYEBROWS, PUPILS &amp; MOUTH EMOTIONAL READABILITY SPECIFICATION</text>
  ${itemsSvg}
</svg>`;
}

fs.writeFileSync(
  path.join(rootDir, 'src/assets/characters/aria/expressions/expressions_sheet.svg'),
  generateExpressionsSheet(),
  'utf-8'
);
console.log('Generated expressions model sheet in src/assets/characters/aria/expressions/expressions_sheet.svg');

// -------------------------------------------------------------
// 4. GENERATE GAMEPLAY SCALE READABILITY TEST SHEET (32px, 48px, 64px, 96px, 128px)
// -------------------------------------------------------------
function generateScaleTestSheet() {
  const defs = getSvgDefs();
  const sizes = [32, 48, 64, 96, 128];
  let testCards = '';
  let curX = 40;

  sizes.forEach((size) => {
    testCards += `
      <g transform="translate(${curX}, 110)">
        <rect width="${Math.max(size + 30, 100)}" height="260" rx="10" fill="#0f172a" stroke="#334155" stroke-width="1.5" />
        <text x="${Math.max(size + 30, 100) / 2}" y="32" text-anchor="middle" fill="#fbbf24" font-family="monospace" font-weight="bold" font-size="15">${size}px</text>
        <line x1="10" y1="44" x2="${Math.max(size + 30, 100) - 10}" y2="44" stroke="#1e293b" />

        <!-- Render Aria at exactly ${size}px height -->
        <g transform="translate(${(Math.max(size + 30, 100) - size) / 2}, 60)">
          <!-- Render scale test container -->
          <svg width="${size}" height="${size * 1.5}" viewBox="0 0 256 256">
            ${createAriaMasterSVG('front', 'neutral').replace(/<\/?svg[^>]*>/g, '').replace(/<defs>[\s\S]*?<\/defs>/, '')}
          </svg>
        </g>
        <text x="${Math.max(size + 30, 100) / 2}" y="246" text-anchor="middle" fill="#94a3b8" font-family="system-ui" font-size="11">
          ${size <= 48 ? 'Silhouette Readable' : size <= 96 ? 'Costume Readable' : 'High Detail'}
        </text>
      </g>
    `;
    curX += Math.max(size + 30, 100) + 24;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 880 420" width="880" height="420">
  ${defs}
  <rect width="880" height="420" fill="#090d16" />
  <text x="40" y="44" fill="#fbbf24" font-family="system-ui" font-size="22" font-weight="900">PRINCESS ARIA — GAMEPLAY SCALE READABILITY TEST</text>
  <text x="40" y="70" fill="#94a3b8" font-family="system-ui" font-size="13">VERIFICATION AT 32px, 48px, 64px, 96px, AND 128px GAMEPLAY SIZES</text>
  ${testCards}
</svg>`;
}

fs.writeFileSync(
  path.join(rootDir, 'src/assets/characters/aria/master/scale_test_32_48_64_96_128.svg'),
  generateScaleTestSheet(),
  'utf-8'
);
console.log('Generated scale test sheet in src/assets/characters/aria/master/scale_test_32_48_64_96_128.svg');

// -------------------------------------------------------------
// 5. UPDATE GAMEPLAY ANIMATION FRAMES (NO PHYSICAL INSECT WINGS)
// -------------------------------------------------------------
/**
 * Procedural HD SVG generator for gameplay frames conforming to MASTER SPECIFICATION.
 */
function createGameplayAriaSVG(options) {
  const {
    bodyY = 185,
    torsoAngle = 0,
    legL = { angle: 0, lift: 0 },
    legR = { angle: 0, lift: 0 },
    armL = { angle: 0 },
    armR = { angle: 0 },
    skirtFlare = 0,
    capeAngle = 0,
    headTilt = 0,
    eyeState = 'open',
    mouthState = 'smile',
    squashX = 1,
    squashY = 1,
    dashTrail = false,
    sparkles = false,
    dissolveAlpha = 1,
  } = options;

  const cx = 128;
  const cy = bodyY;
  const defs = getSvgDefs();

  // Head
  const headSvg = renderHead('three_quarter', eyeState === 'hurt' ? 'worried' : eyeState === 'blink' ? 'neutral' : 'smiling', cx, cy - 78);

  // Speed lines if dashing
  let dashLines = '';
  if (dashTrail) {
    dashLines = `
      <g opacity="0.65">
        <path d="M${cx - 65} ${cy - 45} L${cx - 20} ${cy - 45}" stroke="${PALETTE.GOLD_MAIN}" stroke-width="3.5" stroke-linecap="round"/>
        <path d="M${cx - 80} ${cy - 25} L${cx - 25} ${cy - 25}" stroke="${PALETTE.GOLD_BRIGHT}" stroke-width="4.5" stroke-linecap="round"/>
        <path d="M${cx - 55} ${cy - 65} L${cx - 15} ${cy - 65}" stroke="${PALETTE.EMERALD_BRIGHT}" stroke-width="2.5" stroke-linecap="round"/>
      </g>
    `;
  }

  // Sparkles for victory or high jumps
  let sparkleGroup = '';
  if (sparkles) {
    sparkleGroup = `
      <g>
        <circle cx="${cx + 36}" cy="${cy - 92}" r="3" fill="${PALETTE.GOLD_BRIGHT}"/>
        <circle cx="${cx - 32}" cy="${cy - 72}" r="2.5" fill="${PALETTE.EMERALD_BRIGHT}"/>
        <polygon points="${cx + 35},${cy - 110} ${cx + 38},${cy - 105} ${cx + 43},${cy - 102} ${cx + 38},${cy - 99} ${cx + 35},${cy - 94} ${cx + 32},${cy - 99} ${cx + 27},${cy - 102} ${cx + 32},${cy - 105}" fill="#ffffff" opacity="0.95"/>
      </g>
    `;
  }

  const legLeftX = cx - 11;
  const legRightX = cx + 7;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">
  ${defs}
  <g transform="translate(${cx}, ${cy}) scale(${squashX}, ${squashY}) translate(${-cx}, ${-cy})" opacity="${dissolveAlpha}">
    ${dashLines}

    <!-- 1. WING-CUT ROYAL CAPELET (FLOWING FABRIC, NO PHYSICAL INSECT WINGS) -->
    <g transform="rotate(${capeAngle}, ${cx - 6}, ${cy - 50})">
      <path d="M${cx - 8} ${cy - 52} Q${cx - 36 + capeAngle * 0.4} ${cy - 30}, ${cx - 28 + capeAngle * 0.6} ${cy - 2} Q${cx - 14} ${cy - 16}, ${cx - 2} ${cy - 32} Z"
            fill="url(#ariaCapeGrad)" stroke="${PALETTE.GOLD_METALLIC}" stroke-width="1.2" />
      <path d="M${cx - 36 + capeAngle * 0.4} ${cy - 30} Q${cx - 32 + capeAngle * 0.5} ${cy - 10} ${cx - 28 + capeAngle * 0.6} ${cy - 2}"
            stroke="${PALETTE.GOLD_BRIGHT}" stroke-width="2" fill="none" />
      <!-- Subtle Emerald Brooch on Capelet -->
      <circle cx="${cx - 8}" cy="${cy - 48}" r="2" fill="url(#emeraldGrad)" />
    </g>

    <!-- 2. EXPLORER KNEE-HIGH BOOTS & LEGS -->
    <!-- Left Leg / Boot -->
    <g transform="rotate(${legL.angle}, ${legLeftX}, ${cy - 24}) translate(0, ${-(legL.lift || 0)})">
      <rect x="${legLeftX - 6}" y="${cy - 24}" width="12" height="18" rx="3" fill="${PALETTE.CHARCOAL_MAIN}" stroke="${PALETTE.CHARCOAL_DARKEST}" stroke-width="1" />
      <rect x="${legLeftX - 6}" y="${cy - 26}" width="12" height="4" rx="1.5" fill="${PALETTE.GOLD_MAIN}" />
      <rect x="${legLeftX - 7}" y="${cy - 8}" width="15" height="6" rx="2" fill="${PALETTE.CHARCOAL_DARKEST}" />
      <rect x="${legLeftX - 6}" y="${cy - 6}" width="13" height="2" fill="${PALETTE.GOLD_MAIN}" />
    </g>

    <!-- Right Leg / Boot -->
    <g transform="rotate(${legR.angle}, ${legRightX}, ${cy - 24}) translate(0, ${-(legR.lift || 0)})">
      <rect x="${legRightX - 6}" y="${cy - 24}" width="12" height="18" rx="3" fill="${PALETTE.CHARCOAL_MAIN}" stroke="${PALETTE.CHARCOAL_DARKEST}" stroke-width="1" />
      <rect x="${legRightX - 6}" y="${cy - 26}" width="12" height="4" rx="1.5" fill="${PALETTE.GOLD_MAIN}" />
      <rect x="${legRightX - 7}" y="${cy - 8}" width="15" height="6" rx="2" fill="${PALETTE.CHARCOAL_DARKEST}" />
      <rect x="${legRightX - 6}" y="${cy - 6}" width="13" height="2" fill="${PALETTE.GOLD_MAIN}" />
    </g>

    <!-- 3. BEE-INSPIRED LAYERED PETAL SKIRT & PEPLUM -->
    <g transform="rotate(${torsoAngle}, ${cx}, ${cy - 40})">
      <path d="M${cx - 15} ${cy - 48} L${cx + 15} ${cy - 48} L${cx + 24 + skirtFlare} ${cy - 16} L${cx - 24 - skirtFlare} ${cy - 16} Z"
            fill="url(#ariaDressGrad)" stroke="${PALETTE.CHARCOAL_DARKEST}" stroke-width="1.5" />

      <!-- Ivory Ruffle Pleats -->
      <path d="M${cx - 22 - skirtFlare} ${cy - 16} L${cx - 18 - skirtFlare} ${cy - 12} L${cx - 12} ${cy - 16} L${cx - 6} ${cy - 12} L${cx} ${cy - 16} L${cx + 6} ${cy - 12} L${cx + 12} ${cy - 16} L${cx + 18 + skirtFlare} ${cy - 12} L${cx + 22 + skirtFlare} ${cy - 16} Z"
            fill="url(#ivoryGrad)" stroke="${PALETTE.GOLD_METALLIC}" stroke-width="0.8" />

      <!-- Honeycomb Royal Belt Emblem with Emerald Accent -->
      <polygon points="${cx},${cy - 48} ${cx + 7},${cy - 44} ${cx + 7},${cy - 36} ${cx},${cy - 32} ${cx - 7},${cy - 36} ${cx - 7},${cy - 44}"
               fill="${PALETTE.GOLD_MAIN}" stroke="${PALETTE.GOLD_METALLIC}" stroke-width="1" />
      <circle cx="${cx}" cy="${cy - 40}" r="2.4" fill="url(#emeraldGrad)" />

      <!-- Skirt Golden Honeycomb Trims -->
      <path d="M${cx - 20 - skirtFlare * 0.8} ${cy - 20} Q${cx} ${cy - 15} ${cx + 20 + skirtFlare * 0.8} ${cy - 20}"
            stroke="${PALETTE.GOLD_BRIGHT}" stroke-width="2.5" fill="none" />
      <path d="M${cx - 18 - skirtFlare * 0.5} ${cy - 27} Q${cx} ${cy - 23} ${cx + 18 + skirtFlare * 0.5} ${cy - 27}"
            stroke="${PALETTE.GOLD_WARM}" stroke-width="2" fill="none" />

      <!-- Doublet Bodice Chevrons -->
      <path d="M${cx - 10} ${cy - 46} L${cx} ${cy - 38} L${cx + 10} ${cy - 46}"
            stroke="${PALETTE.GOLD_BRIGHT}" stroke-width="2" fill="none" />

      <!-- Left Arm & Bracer -->
      <g transform="rotate(${armL.angle}, ${cx - 12}, ${cy - 50})">
        <rect x="${cx - 16}" y="${cy - 50}" width="8" height="18" rx="4" fill="${PALETTE.GOLD_MAIN}" />
        <rect x="${cx - 16}" y="${cy - 40}" width="8" height="6" rx="2" fill="${PALETTE.CHARCOAL_MAIN}" />
        <circle cx="${cx - 12}" cy="${cy - 30}" r="4" fill="${PALETTE.SKIN_BASE}" />
      </g>

      <!-- Right Arm & Bracer -->
      <g transform="rotate(${armR.angle}, ${cx + 12}, ${cy - 50})">
        <rect x="${cx + 8}" y="${cy - 50}" width="8" height="18" rx="4" fill="${PALETTE.GOLD_MAIN}" />
        <rect x="${cx + 8}" y="${cy - 40}" width="8" height="6" rx="2" fill="${PALETTE.CHARCOAL_MAIN}" />
        <circle cx="${cx + 12}" cy="${cy - 30}" r="4" fill="${PALETTE.SKIN_BASE}" />
      </g>
    </g>

    <!-- 4. HEAD, TIARA & HAIR -->
    <g transform="rotate(${headTilt}, ${cx}, ${cy - 78})">
      ${headSvg}
    </g>

    ${sparkleGroup}
  </g>
</svg>`;
}

// -------------------------------------------------------------
// UPDATE ALL 12 GAMEPLAY ANIMATION FOLDERS
// -------------------------------------------------------------
const gameplayAnims = {
  idle: [
    { bodyY: 185, torsoAngle: 0, skirtFlare: 0, capeAngle: 0, eyeState: 'open' },
    { bodyY: 184, torsoAngle: -1, skirtFlare: 1, capeAngle: 2, eyeState: 'open' },
    { bodyY: 183, torsoAngle: -1.5, skirtFlare: 1.5, capeAngle: 3, eyeState: 'half' },
    { bodyY: 183, torsoAngle: -1, skirtFlare: 1, capeAngle: 2, eyeState: 'blink' },
    { bodyY: 184, torsoAngle: -0.5, skirtFlare: 0.5, capeAngle: 1, eyeState: 'open' },
    { bodyY: 185, torsoAngle: 0, skirtFlare: 0, capeAngle: 0, eyeState: 'open' },
  ],
  walk: [
    { bodyY: 185, torsoAngle: 3, legL: { angle: -22, lift: 2 }, legR: { angle: 18, lift: 0 }, armL: { angle: 18 }, armR: { angle: -18 }, capeAngle: -6, skirtFlare: 2 },
    { bodyY: 187, torsoAngle: 2, legL: { angle: -10, lift: 0 }, legR: { angle: 6, lift: 4 }, armL: { angle: 8 }, armR: { angle: -8 }, capeAngle: -4, skirtFlare: 1 },
    { bodyY: 183, torsoAngle: 3, legL: { angle: 4, lift: 0 }, legR: { angle: -12, lift: 8 }, armL: { angle: -4 }, armR: { angle: 4 }, capeAngle: -6, skirtFlare: 2 },
    { bodyY: 185, torsoAngle: 4, legL: { angle: 14, lift: 0 }, legR: { angle: -24, lift: 4 }, armL: { angle: -16 }, armR: { angle: 16 }, capeAngle: -8, skirtFlare: 3 },
    { bodyY: 185, torsoAngle: 3, legL: { angle: 18, lift: 0 }, legR: { angle: -22, lift: 2 }, armL: { angle: -18 }, armR: { angle: 18 }, capeAngle: -6, skirtFlare: 2 },
    { bodyY: 187, torsoAngle: 2, legL: { angle: 6, lift: 4 }, legR: { angle: -10, lift: 0 }, armL: { angle: -8 }, armR: { angle: 8 }, capeAngle: -4, skirtFlare: 1 },
    { bodyY: 183, torsoAngle: 3, legL: { angle: -12, lift: 8 }, legR: { angle: 4, lift: 0 }, armL: { angle: 4 }, armR: { angle: -4 }, capeAngle: -6, skirtFlare: 2 },
    { bodyY: 185, torsoAngle: 4, legL: { angle: -24, lift: 4 }, legR: { angle: 14, lift: 0 }, armL: { angle: 16 }, armR: { angle: -16 }, capeAngle: -8, skirtFlare: 3 },
  ],
  run: [
    { bodyY: 186, torsoAngle: 12, legL: { angle: -36, lift: 8 }, legR: { angle: 30, lift: 2 }, armL: { angle: 36 }, armR: { angle: -34 }, capeAngle: -22, skirtFlare: 4 },
    { bodyY: 180, torsoAngle: 14, legL: { angle: -24, lift: 14 }, legR: { angle: 16, lift: 10 }, armL: { angle: 22 }, armR: { angle: -20 }, capeAngle: -26, skirtFlare: 5 },
    { bodyY: 188, torsoAngle: 10, legL: { angle: -8, lift: 0 }, legR: { angle: -14, lift: 12 }, armL: { angle: 4 }, armR: { angle: -4 }, capeAngle: -18, skirtFlare: 3 },
    { bodyY: 184, torsoAngle: 12, legL: { angle: 16, lift: 2 }, legR: { angle: -32, lift: 16 }, armL: { angle: -18 }, armR: { angle: 20 }, capeAngle: -24, skirtFlare: 4 },
    { bodyY: 186, torsoAngle: 12, legL: { angle: 30, lift: 2 }, legR: { angle: -36, lift: 8 }, armL: { angle: -34 }, armR: { angle: 36 }, capeAngle: -22, skirtFlare: 4 },
    { bodyY: 180, torsoAngle: 14, legL: { angle: 16, lift: 10 }, legR: { angle: -24, lift: 14 }, armL: { angle: -20 }, armR: { angle: 22 }, capeAngle: -26, skirtFlare: 5 },
    { bodyY: 188, torsoAngle: 10, legL: { angle: -14, lift: 12 }, legR: { angle: -8, lift: 0 }, armL: { angle: -4 }, armR: { angle: 4 }, capeAngle: -18, skirtFlare: 3 },
    { bodyY: 184, torsoAngle: 12, legL: { angle: -32, lift: 16 }, legR: { angle: 16, lift: 2 }, armL: { angle: 20 }, armR: { angle: -18 }, capeAngle: -24, skirtFlare: 4 },
  ],
  jump_start: [
    { bodyY: 185, torsoAngle: 2, squashX: 1.0, squashY: 1.0, legL: { angle: -4, lift: 0 }, legR: { angle: 4, lift: 0 }, armL: { angle: -6 }, armR: { angle: 6 }, capeAngle: -2 },
    { bodyY: 194, torsoAngle: 4, squashX: 1.15, squashY: 0.85, legL: { angle: -14, lift: 0 }, legR: { angle: 14, lift: 0 }, armL: { angle: -24 }, armR: { angle: -20 }, capeAngle: 6 },
    { bodyY: 198, torsoAngle: 6, squashX: 1.22, squashY: 0.78, legL: { angle: -20, lift: 0 }, legR: { angle: 20, lift: 0 }, armL: { angle: -32 }, armR: { angle: -28 }, capeAngle: 12 },
    { bodyY: 180, torsoAngle: 0, squashX: 0.85, squashY: 1.25, legL: { angle: 0, lift: 6 }, legR: { angle: 0, lift: 6 }, armL: { angle: 26 }, armR: { angle: 26 }, capeAngle: -10, sparkles: true },
  ],
  jump_rise: [
    { bodyY: 178, torsoAngle: -2, squashX: 0.88, squashY: 1.18, legL: { angle: 6, lift: 8 }, legR: { angle: -4, lift: 6 }, armL: { angle: 30 }, armR: { angle: 28 }, capeAngle: -14 },
    { bodyY: 176, torsoAngle: -1, squashX: 0.92, squashY: 1.12, legL: { angle: 8, lift: 10 }, legR: { angle: -6, lift: 8 }, armL: { angle: 24 }, armR: { angle: 22 }, capeAngle: -18 },
    { bodyY: 175, torsoAngle: 0, squashX: 0.96, squashY: 1.06, legL: { angle: 10, lift: 12 }, legR: { angle: -8, lift: 10 }, armL: { angle: 18 }, armR: { angle: 16 }, capeAngle: -14 },
    { bodyY: 176, torsoAngle: 1, squashX: 1.0, squashY: 1.02, legL: { angle: 8, lift: 10 }, legR: { angle: -6, lift: 8 }, armL: { angle: 12 }, armR: { angle: 10 }, capeAngle: -8 },
  ],
  fall: [
    { bodyY: 178, torsoAngle: 2, squashX: 0.95, squashY: 1.08, legL: { angle: -8, lift: 4 }, legR: { angle: 8, lift: 2 }, armL: { angle: -12 }, armR: { angle: 12 }, capeAngle: 14, skirtFlare: 3 },
    { bodyY: 180, torsoAngle: 1, squashX: 0.92, squashY: 1.12, legL: { angle: -12, lift: 2 }, legR: { angle: 12, lift: 0 }, armL: { angle: -18 }, armR: { angle: 18 }, capeAngle: 20, skirtFlare: 5 },
    { bodyY: 182, torsoAngle: 1, squashX: 0.94, squashY: 1.10, legL: { angle: -10, lift: 2 }, legR: { angle: 10, lift: 0 }, armL: { angle: -16 }, armR: { angle: 16 }, capeAngle: 18, skirtFlare: 4 },
    { bodyY: 184, torsoAngle: 0, squashX: 0.98, squashY: 1.04, legL: { angle: -6, lift: 0 }, legR: { angle: 6, lift: 0 }, armL: { angle: -10 }, armR: { angle: 10 }, capeAngle: 12, skirtFlare: 3 },
  ],
  land: [
    { bodyY: 192, torsoAngle: 2, squashX: 1.25, squashY: 0.78, legL: { angle: -18, lift: 0 }, legR: { angle: 18, lift: 0 }, armL: { angle: -24 }, armR: { angle: -20 }, capeAngle: 8, skirtFlare: 6 },
    { bodyY: 195, torsoAngle: 4, squashX: 1.30, squashY: 0.72, legL: { angle: -24, lift: 0 }, legR: { angle: 24, lift: 0 }, armL: { angle: -30 }, armR: { angle: -26 }, capeAngle: 12, skirtFlare: 8 },
    { bodyY: 188, torsoAngle: 1, squashX: 1.10, squashY: 0.92, legL: { angle: -10, lift: 0 }, legR: { angle: 10, lift: 0 }, armL: { angle: -10 }, armR: { angle: -8 }, capeAngle: 2, skirtFlare: 3 },
    { bodyY: 185, torsoAngle: 0, squashX: 1.0, squashY: 1.0, legL: { angle: 0, lift: 0 }, legR: { angle: 0, lift: 0 }, armL: { angle: 0 }, armR: { angle: 0 }, capeAngle: 0, skirtFlare: 0 },
  ],
  crouch: [
    { bodyY: 192, torsoAngle: 8, squashX: 1.15, squashY: 0.82, legL: { angle: -20, lift: 0 }, legR: { angle: 22, lift: 0 }, armL: { angle: -28 }, armR: { angle: -22 }, capeAngle: 10, skirtFlare: 5 },
    { bodyY: 196, torsoAngle: 12, squashX: 1.22, squashY: 0.75, legL: { angle: -28, lift: 0 }, legR: { angle: 30, lift: 0 }, armL: { angle: -36 }, armR: { angle: -30 }, capeAngle: 14, skirtFlare: 7 },
    { bodyY: 195, torsoAngle: 11, squashX: 1.20, squashY: 0.76, legL: { angle: -26, lift: 0 }, legR: { angle: 28, lift: 0 }, armL: { angle: -34 }, armR: { angle: -28 }, capeAngle: 12, skirtFlare: 6 },
    { bodyY: 196, torsoAngle: 12, squashX: 1.22, squashY: 0.75, legL: { angle: -28, lift: 0 }, legR: { angle: 30, lift: 0 }, armL: { angle: -36 }, armR: { angle: -30 }, capeAngle: 14, skirtFlare: 7 },
  ],
  dash: [
    { bodyY: 184, torsoAngle: 18, squashX: 1.25, squashY: 0.85, legL: { angle: -42, lift: 8 }, legR: { angle: 32, lift: 2 }, armL: { angle: -42 }, armR: { angle: 38 }, capeAngle: -34, skirtFlare: 6, dashTrail: true },
    { bodyY: 182, torsoAngle: 24, squashX: 1.35, squashY: 0.78, legL: { angle: -48, lift: 12 }, legR: { angle: 28, lift: 6 }, armL: { angle: -48 }, armR: { angle: 44 }, capeAngle: -40, skirtFlare: 7, dashTrail: true },
    { bodyY: 180, torsoAngle: 26, squashX: 1.38, squashY: 0.75, legL: { angle: -52, lift: 14 }, legR: { angle: 24, lift: 8 }, armL: { angle: -52 }, armR: { angle: 48 }, capeAngle: -44, skirtFlare: 8, dashTrail: true },
    { bodyY: 182, torsoAngle: 24, squashX: 1.34, squashY: 0.78, legL: { angle: -48, lift: 12 }, legR: { angle: 28, lift: 6 }, armL: { angle: -48 }, armR: { angle: 44 }, capeAngle: -40, skirtFlare: 7, dashTrail: true },
    { bodyY: 185, torsoAngle: 16, squashX: 1.20, squashY: 0.88, legL: { angle: -36, lift: 6 }, legR: { angle: 20, lift: 2 }, armL: { angle: -32 }, armR: { angle: 26 }, capeAngle: -28, skirtFlare: 5, dashTrail: true },
    { bodyY: 186, torsoAngle: 8, squashX: 1.08, squashY: 0.95, legL: { angle: -20, lift: 2 }, legR: { angle: 12, lift: 0 }, armL: { angle: -18 }, armR: { angle: 12 }, capeAngle: -14, skirtFlare: 2 },
  ],
  hurt: [
    { bodyY: 182, torsoAngle: -18, squashX: 1.20, squashY: 0.82, legL: { angle: 24, lift: 6 }, legR: { angle: -18, lift: 8 }, armL: { angle: 42 }, armR: { angle: 36 }, capeAngle: 24, headTilt: -14, eyeState: 'hurt' },
    { bodyY: 180, torsoAngle: -24, squashX: 1.25, squashY: 0.78, legL: { angle: 32, lift: 10 }, legR: { angle: -26, lift: 12 }, armL: { angle: 48 }, armR: { angle: 44 }, capeAngle: 30, headTilt: -18, eyeState: 'hurt' },
    { bodyY: 183, torsoAngle: -14, squashX: 1.12, squashY: 0.90, legL: { angle: 18, lift: 4 }, legR: { angle: -12, lift: 4 }, armL: { angle: 26 }, armR: { angle: 22 }, capeAngle: 18, headTilt: -8, eyeState: 'hurt' },
    { bodyY: 185, torsoAngle: -4, squashX: 1.02, squashY: 0.98, legL: { angle: 6, lift: 0 }, legR: { angle: -4, lift: 0 }, armL: { angle: 8 }, armR: { angle: 6 }, capeAngle: 6, headTilt: -2, eyeState: 'open' },
  ],
  death: [
    { bodyY: 184, torsoAngle: -12, squashX: 1.1, squashY: 0.9, legL: { angle: 16, lift: 2 }, legR: { angle: -12, lift: 4 }, armL: { angle: 30 }, armR: { angle: 26 }, capeAngle: 16, headTilt: -8, eyeState: 'hurt' },
    { bodyY: 187, torsoAngle: -22, squashX: 1.18, squashY: 0.84, legL: { angle: 28, lift: 0 }, legR: { angle: -24, lift: 2 }, armL: { angle: 42 }, armR: { angle: 38 }, capeAngle: 24, headTilt: -16, eyeState: 'blink' },
    { bodyY: 192, torsoAngle: -38, squashX: 1.25, squashY: 0.76, legL: { angle: 40, lift: 0 }, legR: { angle: -36, lift: 0 }, armL: { angle: 50 }, armR: { angle: 46 }, capeAngle: 34, headTilt: -24, eyeState: 'blink' },
    { bodyY: 198, torsoAngle: -55, squashX: 1.35, squashY: 0.68, legL: { angle: 52, lift: 0 }, legR: { angle: -48, lift: 0 }, armL: { angle: 56 }, armR: { angle: 52 }, capeAngle: 42, headTilt: -32, eyeState: 'blink' },
    { bodyY: 205, torsoAngle: -75, squashX: 1.45, squashY: 0.58, legL: { angle: 65, lift: 0 }, legR: { angle: -60, lift: 0 }, armL: { angle: 60 }, armR: { angle: 56 }, capeAngle: 48, headTilt: -38, eyeState: 'blink', dissolveAlpha: 0.85, sparkles: true },
    { bodyY: 208, torsoAngle: -85, squashX: 1.50, squashY: 0.52, legL: { angle: 72, lift: 0 }, legR: { angle: -68, lift: 0 }, armL: { angle: 64 }, armR: { angle: 60 }, capeAngle: 52, headTilt: -42, eyeState: 'blink', dissolveAlpha: 0.6, sparkles: true },
    { bodyY: 210, torsoAngle: -90, squashX: 1.55, squashY: 0.48, legL: { angle: 78, lift: 0 }, legR: { angle: -74, lift: 0 }, armL: { angle: 68 }, armR: { angle: 64 }, capeAngle: 56, headTilt: -45, eyeState: 'blink', dissolveAlpha: 0.35, sparkles: true },
    { bodyY: 210, torsoAngle: -90, squashX: 1.55, squashY: 0.48, legL: { angle: 78, lift: 0 }, legR: { angle: -74, lift: 0 }, armL: { angle: 68 }, armR: { angle: 64 }, capeAngle: 56, headTilt: -45, eyeState: 'blink', dissolveAlpha: 0.1, sparkles: true },
  ],
  victory: [
    { bodyY: 185, torsoAngle: 0, skirtFlare: 1, capeAngle: 0, eyeState: 'open' },
    { bodyY: 183, torsoAngle: -4, skirtFlare: 4, capeAngle: 6, armL: { angle: 28 }, armR: { angle: 28 }, eyeState: 'open', sparkles: true },
    { bodyY: 180, torsoAngle: -8, skirtFlare: 8, capeAngle: 16, armL: { angle: 48 }, armR: { angle: 48 }, eyeState: 'open', sparkles: true },
    { bodyY: 178, torsoAngle: 0, skirtFlare: 12, capeAngle: 24, armL: { angle: 62 }, armR: { angle: 62 }, eyeState: 'open', sparkles: true },
    { bodyY: 180, torsoAngle: 4, skirtFlare: 8, capeAngle: 14, armL: { angle: 48 }, armR: { angle: 48 }, eyeState: 'open', sparkles: true },
    { bodyY: 183, torsoAngle: 2, skirtFlare: 4, capeAngle: 8, armL: { angle: 32 }, armR: { angle: 32 }, eyeState: 'open', sparkles: true },
    { bodyY: 185, torsoAngle: 0, skirtFlare: 2, capeAngle: 2, armL: { angle: 18 }, armR: { angle: 18 }, eyeState: 'open' },
    { bodyY: 185, torsoAngle: 0, skirtFlare: 1, capeAngle: 0, armL: { angle: 12 }, armR: { angle: 12 }, eyeState: 'open' },
  ],
};

gameplayAnims.jump = gameplayAnims.jump_rise;

for (const [animName, frames] of Object.entries(gameplayAnims)) {
  const dir = path.join(rootDir, `src/assets/characters/aria/${animName}`);
  frames.forEach((f, idx) => {
    fs.writeFileSync(path.join(dir, `frame_${idx}.svg`), createGameplayAriaSVG(f), 'utf-8');
  });
}
console.log('Updated all gameplay animation frame SVGs to Canonical Master Design!');
