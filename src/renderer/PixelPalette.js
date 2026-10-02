/**
 * PixelPalette.js
 * 
 * Disciplined 1985-era console platformer color palette and resolution constants.
 * Target internal gameplay resolution: 256 x 240.
 */

export const INTERNAL_WIDTH = 256;
export const INTERNAL_HEIGHT = 240;

// World to internal screen coordinate conversion factor:
// 1080 world units / 240 screen pixels = 4.5 world units per screen pixel.
// 1152 world units / 256 screen pixels = 4.5 world units per screen pixel.
export const WORLD_TO_PIXEL = 1 / 4.5;
export const PIXEL_TO_WORLD = 4.5;

export const PIXEL_PALETTE = {
  // SKY (2-3 blue tones)
  SKY_DEEP: '#2c5282',
  SKY_MID: '#4299e1',
  SKY_LIGHT: '#90cdf4',

  // FOREST (deep green, medium green, light green)
  FOREST_DEEP: '#14421b',
  FOREST_MID: '#236e2c',
  FOREST_LIGHT: '#48bb78',
  FOREST_CANOPY: '#18381e',

  // GROUND (dark brown, warm brown, light earth)
  GROUND_DARK: '#27170a',
  GROUND_WARM: '#543217',
  GROUND_LIGHT: '#8c532b',
  GRASS_EDGE: '#276749',
  GRASS_TOP: '#48bb78',
  GRASS_HIGHLIGHT: '#68d391',

  // HONEY / GOLD (amber, dark gold, pale yellow)
  HONEY_DARK: '#975a16',
  HONEY_AMBER: '#d69e2e',
  HONEY_LIGHT: '#ecc94b',
  HONEY_PALE: '#faf089',

  // STONE / FORTRESS (restrained grey/slate)
  STONE_DARK: '#1e293b',
  STONE_MID: '#475569',
  STONE_LIGHT: '#94a3b8',
  STONE_HIGHLIGHT: '#e2e8f0',

  // HAZARDS (clear danger telegraph)
  HAZARD_BASE: '#7f1d1d',
  HAZARD_SPIKE: '#ef4444',
  HAZARD_TIP: '#fca5a5',

  // PRINCESS ARIA SIGNATURE PALETTE
  ARIA_OUTLINE: '#160d26',
  ARIA_CROWN: '#fde047',
  ARIA_CROWN_BASE: '#d97706',
  ARIA_HAIR_DARK: '#92400e',
  ARIA_HAIR_MID: '#d97706',
  ARIA_HAIR_LIGHT: '#f59e0b',
  ARIA_SKIN: '#fcd34d',
  ARIA_SKIN_SHADOW: '#d97706',
  ARIA_DRESS_DARK: '#581c87',
  ARIA_DRESS_MID: '#7e22ce',
  ARIA_DRESS_LIGHT: '#a855f7',
  ARIA_WHITE: '#f8fafc',
  ARIA_BOOTS: '#3b0764',
  ARIA_EYES: '#160d26',

  // QUEEN BEE
  QUEEN_SILHOUETTE: '#18111e',
  QUEEN_ACCENT: '#f59e0b',
  QUEEN_EYES: '#ef4444',

  // BATBOY
  BATBOY_SILHOUETTE: '#090d16',
  BATBOY_ACCENT: '#38bdf8', // radiant cyan eye/scarf

  // UI & GENERIC
  UI_BG: '#090d16',
  UI_TEXT_WHITE: '#f8fafc',
  UI_TEXT_GOLD: '#fde047',
  UI_HEART_FULL: '#ef4444',
  UI_HEART_EMPTY: '#334155',
  UI_BORDER: '#d97706',
};
