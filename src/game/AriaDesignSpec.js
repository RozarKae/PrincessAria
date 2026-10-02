/**
 * ARIA_DESIGN_VERSION = '2.0'
 * Canonical Programmatic Design Specification for Princess Aria.
 * ARIA DESIGN v2.0 establishes the transition from procedural vector primitives
 * to the Professional Hand-Illustrated 2D Character Pipeline.
 * Supports:
 * - Method A: Hierarchical Layered 2D Rig Animation
 * - Method B: Artist-Created Transparent PNG/WebP Frame Sequences
 */
export const ARIA_DESIGN_VERSION = '2.0';

export const ARIA_PALETTE = {
  // Primary Gold & Amber Accents
  GOLD_BRIGHT: '#fde047',
  GOLD_MAIN: '#fbbf24',
  GOLD_WARM: '#f59e0b',
  GOLD_METALLIC: '#d97706',
  GOLD_DARK: '#b45309',

  // Deep Charcoal & Obsidian Accents (replaces generic black)
  CHARCOAL_DARKEST: '#09090b',
  CHARCOAL_MAIN: '#18181b',
  CHARCOAL_SOFT: '#27272a',
  CHARCOAL_ACCENT: '#3f3f46',

  // Ivory & Cream Highlights
  IVORY_CREAM: '#fffbeb',
  IVORY_HIGHLIGHT: '#fefce8',
  IVORY_SHADOW: '#fef08a',

  // Emerald & Teal Jewel Tones
  EMERALD_ACCENT: '#0d9488',
  EMERALD_BRIGHT: '#14b8a6',
  EMERALD_DEEP: '#047857',

  // Chestnut & Amber Hair Tones
  HAIR_DARK: '#451a03',
  HAIR_CHESTNUT: '#78350f',
  HAIR_AMBER: '#92400e',
  HAIR_HONEY_GLAZE: '#b45309',

  // Fair Heroic Skin Tone & Soft Blush
  SKIN_BASE: '#fed7aa',
  SKIN_SHADOW: '#fdba74',
  SKIN_BLUSH: '#f43f5e',

  // Eyes (Sapphire Iris with Teal Fleck)
  EYE_PUPIL: '#0f172a',
  EYE_SAPPHIRE: '#0284c7',
  EYE_TEAL: '#0d9488',
  EYE_WHITE: '#ffffff',
};

export const ARIA_PROPORTIONS = {
  TOTAL_HEADS: 5.8, // Stylized heroic platformer proportion
  HEAD_HEIGHT_PX: 28,
  TORSO_HEIGHT_PX: 26,
  LEGS_HEIGHT_PX: 30,
  BASE_PHYSICAL_WIDTH: 56,
  BASE_PHYSICAL_HEIGHT: 84,
  CROUCH_HEIGHT: 54,
  VISUAL_RENDER_WIDTH: 138,
  VISUAL_RENDER_HEIGHT: 138,
  ANCHOR_X: 0.5,
  ANCHOR_Y: 0.95,
};

export const ARIA_COSTUME_SPEC = {
  HEADWEAR: 'Delicate gold honeycomb-geometry circlet/tiara with teardrop emerald droplet gem at brow apex',
  HAIRSTYLE: 'Warm dark chestnut-amber hair with honey glaze, half-up adventurer ponytail/braid with loose dynamic side bangs',
  UPPER_BODY: 'Fitted deep charcoal/obsidian doublet bodice with scalloped ivory chemise collar, gold chevron embroidery, and emerald honeycomb brooch',
  CAPELET: 'Wing-cut royal honey silk capelet fastened at shoulders, flowing behind in aerodynamic wing silhouettes during motion (NO physical insect wings on back)',
  LOWER_BODY: 'Layered gold and charcoal peplum petal skirt with ivory pleats, honeycomb filigree hems, and gold lattice belt',
  FOOTWEAR: 'Practical knee-high charcoal explorer boots with gold clasps, reinforced platforming soles, and emerald trim',
  GAUNTLETS: 'Gold-trimmed charcoal wrist bracers designed for athletic agility',
};

export const ARIA_ANIMATION_SPECS = {
  IDLE: {
    fps: 8,
    loop: true,
    totalFrames: 6,
    pose: 'Neutral upright athletic stance, gentle chest breathing rise/fall, soft dress ripple, subtle blink',
    principles: 'Subtle secondary action, easing, breathing rhythm',
  },
  WALK: {
    fps: 12,
    loop: true,
    totalFrames: 8,
    pose: 'Rhythmic heel-to-toe contact, alternating arm swings, swaying skirt hem, capelet trailing slightly',
    principles: 'Weight shift, passing position squash/stretch, foot roll',
  },
  RUN: {
    fps: 16,
    loop: true,
    totalFrames: 8,
    pose: 'Aggressive 15-degree forward lean, deep leg propulsion, capelet trailing horizontally, arms pumped',
    principles: 'Forward momentum, exaggeration, strong silhouettes, horizontal speedline follow-through',
  },
  JUMP_START: {
    fps: 16,
    loop: false,
    minDuration: 0.08,
    next: 'JUMP_RISE',
    totalFrames: 4,
    pose: 'Deep knee squash anticipation, arms drawn back, explosive upward extension push-off',
    principles: 'Anticipation, extreme squash and stretch (scaleX 1.22 -> 0.85)',
  },
  JUMP_RISE: {
    fps: 12,
    loop: true,
    totalFrames: 4,
    pose: 'Streamlined upward ascent, legs tucked athletically, capelet and hair pulled downward by gravity',
    principles: 'Upward line of action, drag on loose elements',
  },
  FALL: {
    fps: 12,
    loop: true,
    totalFrames: 4,
    pose: 'Descending posture, skirt billowing upward against rushing air, feet reaching down to prepare for contact',
    principles: 'Air resistance drag, anticipation of ground strike',
  },
  LAND: {
    fps: 16,
    loop: false,
    minDuration: 0.12,
    next: 'IDLE',
    totalFrames: 4,
    pose: 'Impact compression (scaleX 1.26, scaleY 0.76), knees bent outward, skirt flare, swift rebound to stand',
    principles: 'Squash recovery, energy dissipation, follow-through',
  },
  CROUCH: {
    fps: 8,
    loop: true,
    totalFrames: 4,
    pose: 'Low-profile platformer crouch (height 54px), one hand touching ground, vigilant heroic gaze',
    principles: 'Lowered center of gravity, tension readiness',
  },
  DASH: {
    fps: 16,
    loop: false,
    minDuration: 0.22,
    next: 'RUN',
    totalFrames: 6,
    pose: 'Aerodynamic horizontal bullet glide, capelet flat against wind, trailing golden honey ghost trails',
    principles: 'Maximum horizontal exaggeration, afterimage ghosting, sudden acceleration',
  },
  HURT: {
    fps: 14,
    loop: false,
    minDuration: 0.28,
    next: 'IDLE',
    totalFrames: 4,
    pose: 'Shocked impact recoil, head snapped back, torso angled backward, temporary invulnerability flash',
    principles: 'Knockback recoil, hit stop feel, vulnerability reaction',
  },
  DEATH: {
    fps: 10,
    loop: false,
    totalFrames: 8,
    pose: 'Staggering balance loss, collapsing to knees, tiara glint fading, dissolving into honey motes',
    principles: 'Defeat drama, fading luminescence, weight collapse',
  },
  VICTORY: {
    fps: 10,
    loop: true,
    totalFrames: 8,
    pose: 'Joyful 360-degree royal twirl, flared skirt, confident wink, raised victory peace salute, floating sparkles',
    principles: 'Celebratory arc, twirl overlap, sparkling follow-through',
  },
};

export const ARIA_CONSISTENCY_RULES = [
  'NO PHYSICAL INSECT WINGS on Aria (wing aesthetics are expressed through the wing-cut capelet and skirt peplum only).',
  'Costume MUST preserve the 5-color hierarchy: Warm Gold primary, Charcoal/Black secondary, Ivory highlights, Emerald accents, Chestnut hair.',
  'Crown MUST remain a small, practical honeycomb circlet with center emerald jewel (not a giant heavy medieval crown).',
  'Footwear MUST be practical adventurer/explorer boots with reinforced soles (NO high heels or delicate slippers).',
  'Facial proportions MUST maintain large, expressive sapphire/teal eyes with confident heroic demeanor.',
  'Silhouettes MUST remain readable at 32px, 48px, 64px, 96px, and 128px gameplay scales.',
  'All high-resolution master assets MUST be authored at 2048x2048 or higher with clean alpha transparency.',
];

/**
 * Validates whether an asset metadata dictionary conforms to ARIA_DESIGN_VERSION 1.0
 */
export function validateAriaAsset(metadata = {}) {
  const issues = [];
  if (metadata.hasInsectWings === true) {
    issues.push('Violation: Aria must NOT have physical insect wings unless authorized as a special power-up.');
  }
  if (metadata.designVersion && metadata.designVersion !== ARIA_DESIGN_VERSION) {
    issues.push(`Version mismatch: Asset version ${metadata.designVersion} does not match canonical ${ARIA_DESIGN_VERSION}.`);
  }
  return {
    valid: issues.length === 0,
    issues,
  };
}
