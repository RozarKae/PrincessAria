/**
 * PixelPalette.js
 * 
 * Futuristic Neo-Retro Pixel Art Palette & Hi-Bit Render Constants for Project Aria.
 * 
 * Supports:
 * - 32-bit Enhanced Neo-Pixel Palette with rich depth, sub-pixel gradients, specular glints, and ambient glow
 * - Enhanced Internal Gameplay Resolution: 320 x 240 (or 256 x 240 retro mode)
 * - Neo-Retro Bloom & CRT Scanline Shader Effects for "Game from the Future" aesthetic
 */

export const INTERNAL_WIDTH = 320;
export const INTERNAL_HEIGHT = 240;

// World to internal screen coordinate conversion factor:
// 1080 world units / 240 screen pixels = 4.5 world units per screen pixel.
// 1440 world units / 320 screen pixels = 4.5 world units per screen pixel.
export const WORLD_TO_PIXEL = 1 / 4.5;
export const PIXEL_TO_WORLD = 4.5;

export const PIXEL_PALETTE = {
  // SKY (Modern rich twilight & aurora gradients)
  SKY_DEEP: '#1e3a8a',
  SKY_MID: '#3b82f6',
  SKY_LIGHT: '#93c5fd',
  SKY_AURORA: '#38bdf8',
  SKY_HORIZON: '#e0f2fe',

  // FOREST & VEGETATION (Rich multi-tier foliage & rim highlights)
  FOREST_DEEP: '#064e3b',
  FOREST_MID: '#059669',
  FOREST_LIGHT: '#10b981',
  FOREST_HIGHLIGHT: '#6ee7b7',
  FOREST_CANOPY: '#022c22',
  FOREST_SHADOW: '#011c14',

  // GROUND & TERRAIN (Layered rich loam, bedrock, roots, vibrant grass crest)
  GROUND_DARK: '#1c1007',
  GROUND_WARM: '#451a03',
  GROUND_LIGHT: '#78350f',
  GROUND_ACCENT: '#92400e',
  GROUND_PEBBLE: '#b45309',
  GRASS_EDGE: '#065f46',
  GRASS_TOP: '#10b981',
  GRASS_HIGHLIGHT: '#34d399',
  GRASS_GLINT: '#a7f3d0',

  // HONEY / NECTAR / AMBER (Volumetric liquid gold, internal refraction, warm honeycombs)
  HONEY_DARK: '#78350f',
  HONEY_AMBER: '#d97706',
  HONEY_LIGHT: '#f59e0b',
  HONEY_PALE: '#fbbf24',
  HONEY_GLOW: '#fde047',
  HONEY_CORE: '#fef08a',
  HONEY_SPECULAR: '#ffffff',

  // STONE & ANCIENT CITADEL ARCHITECTURE (Granite ashlar with runic moss & specular edges)
  STONE_DARK: '#0f172a',
  STONE_MID: '#334155',
  STONE_LIGHT: '#64748b',
  STONE_HIGHLIGHT: '#94a3b8',
  STONE_SPECULAR: '#cbd5e1',
  STONE_RUNE_CYAN: '#38bdf8',
  STONE_RUNE_GOLD: '#f59e0b',

  // HAZARDS & SPIKES (Futuristic danger telegraphing with hot energy core)
  HAZARD_BASE: '#450a0a',
  HAZARD_SPIKE: '#dc2626',
  HAZARD_TIP: '#f87171',
  HAZARD_CORE: '#fecaca',

  // PRINCESS ARIA SIGNATURE EXPANDED NEO-PIXEL PALETTE
  ARIA_OUTLINE: '#110726',
  ARIA_CROWN: '#fde047',
  ARIA_CROWN_BASE: '#d97706',
  ARIA_CROWN_GLINT: '#ffffff',
  ARIA_HAIR_DARK: '#78350f',
  ARIA_HAIR_MID: '#b45309',
  ARIA_HAIR_LIGHT: '#f59e0b',
  ARIA_HAIR_GLOSS: '#fde68a',
  ARIA_SKIN: '#fde68a',
  ARIA_SKIN_SHADOW: '#f59e0b',
  ARIA_SKIN_BLUSH: '#f87171',
  ARIA_DRESS_DARK: '#3b0764',
  ARIA_DRESS_MID: '#6b21a8',
  ARIA_DRESS_LIGHT: '#9333ea',
  ARIA_DRESS_ACCENT: '#c084fc',
  ARIA_WHITE: '#f8fafc',
  ARIA_BOOTS: '#2e1065',
  ARIA_BOOTS_HIGHLIGHT: '#581c87',
  ARIA_EYES: '#110726',
  ARIA_EYES_IRIS: '#38bdf8',
  ARIA_EYES_GLINT: '#ffffff',

  // QUEEN BEE MONARCH SILHOUETTE & ANTAGONIST PRESENCE
  QUEEN_SILHOUETTE: '#120b1c',
  QUEEN_ACCENT: '#f59e0b',
  QUEEN_EYES: '#ef4444',
  QUEEN_CORONA: '#fbbf24',
  QUEEN_SHADOW: 'rgba(15, 23, 42, 0.45)',

  // BATBOY RESCUE SANCTUARY
  BATBOY_SILHOUETTE: '#060913',
  BATBOY_ACCENT: '#38bdf8',
  BATBOY_GLOW: '#7dd3fc',
  BATBOY_EYES: '#ffffff',

  // HUD & UI PALETTE (Modern cyber-fantasy aesthetics)
  UI_BG: '#090d16',
  UI_PANEL_BG: 'rgba(9, 13, 22, 0.88)',
  UI_PANEL_BORDER: '#1e293b',
  UI_TEXT_WHITE: '#f8fafc',
  UI_TEXT_GOLD: '#fde047',
  UI_TEXT_CYAN: '#38bdf8',
  UI_TEXT_MUTED: '#64748b',
  UI_HEART_FULL: '#ef4444',
  UI_HEART_HIGHLIGHT: '#fca5a5',
  UI_HEART_EMPTY: '#1e293b',
  UI_BORDER: '#d97706',

  // SECTION 4: SOVEREIGN HIVE SPIRE & COSMIC VOID
  SPIRE_VOID_DEEP: '#030108',
  SPIRE_VOID_MID: '#080414',
  SPIRE_VOID_HORIZON: '#1a0b28',
  SPIRE_OBSIDIAN_DARK: '#07060f',
  SPIRE_OBSIDIAN_MID: '#161226',
  SPIRE_OBSIDIAN_LIGHT: '#2e2548',
  SPIRE_OBSIDIAN_RIM: '#4c3f74',
  SPIRE_HEX_GOLD: '#fbbf24',
  SPIRE_NECTAR_GLOW: '#f59e0b',
  SPIRE_GEYSER_STREAM: '#fef08a',

  // WORLD 2: THE WHISPERING FOREST (Deep twilight, bioluminescence, spore mist)
  FOREST2_SKY_NIGHT: '#080412',
  FOREST2_SKY_MID: '#170b28',
  FOREST2_SKY_LIGHT: '#2c1242',
  FOREST2_SKY_MIST: '#4a1d6d',
  FOREST2_MOSS_DEEP: '#062013',
  FOREST2_MOSS_MID: '#047857',
  FOREST2_MOSS_LIGHT: '#34d399',
  FOREST2_MOSS_HIGHLIGHT: '#6ee7b7',
  FUNGUS_CYAN_GLOW: '#38bdf8',
  FUNGUS_CYAN_LIGHT: '#7dd3fc',
  FUNGUS_CYAN_CORE: '#e0f2fe',
  FUNGUS_PURPLE_DEEP: '#4a044e',
  FUNGUS_PURPLE_MID: '#701a75',
  FUNGUS_CAP_PINK: '#f43f5e',
  FUNGUS_CAP_NEON: '#fb7185',
  FUNGUS_SPORE_GOLD: '#fef08a',
  THORN_BRAMBLE_DARK: '#180920',
  THORN_BRAMBLE_PURPLE: '#3b0764',
  THORN_BRAMBLE_MID: '#581c87',
  THORN_SPIKE: '#ef4444',
  THORN_SPIKE_GLINT: '#fca5a5',
  FOREST_KING_BARK_DARK: '#120b06',
  FOREST_KING_BARK_MID: '#2e1c12',
  FOREST_KING_BARK_LIGHT: '#4a2f20',
  FOREST_KING_CORRUPT_PURPLE: '#d946ef',
  FOREST_KING_CORRUPT_HOT: '#f472b6',
  FOREST_KING_AWAKEN_EMERALD: '#10b981',
  FOREST_KING_AWAKEN_CORE: '#a7f3d0',

  // WORLD 3: THE CASTLE OF A THOUSAND DOORS (Gothic granite, starry night, dimensional gates, stained glass)
  CASTLE_SKY_MIDNIGHT: '#04040c',
  CASTLE_SKY_DEEP: '#0a0d24',
  CASTLE_SKY_VIOLET: '#1c1b3d',
  CASTLE_SKY_MIST: '#2d2454',
  CASTLE_STONE_DARK: '#0b1120',
  CASTLE_STONE_MID: '#1e293b',
  CASTLE_STONE_LIGHT: '#334155',
  CASTLE_STONE_MORTAR: '#475569',
  CASTLE_STONE_HIGHLIGHT: '#94a3b8',
  CASTLE_FLAGSTONE_TRIM: '#cbd5e1',
  CASTLE_VELVET_DARK: '#4a044e',
  CASTLE_VELVET_CRIMSON: '#831843',
  CASTLE_VELVET_GOLD: '#f59e0b',
  DOOR_WOOD_DARK: '#241408',
  DOOR_WOOD_MID: '#451a03',
  DOOR_IRON_BAND: '#334155',
  DOOR_PORTAL_CYAN: '#38bdf8',
  DOOR_PORTAL_MAGENTA: '#c084fc',
  DOOR_PORTAL_CORE: '#f8fafc',
  DOOR_GOLD_TRIM: '#fbbf24',
  STAINED_GLASS_BLUE: '#38bdf8',
  STAINED_GLASS_ROSE: '#f43f5e',
  STAINED_GLASS_AMBER: '#fbbf24',
  STAINED_GLASS_PURPLE: '#a855f7',
  SLAMALOT_STEEL_DARK: '#0f172a',
  SLAMALOT_STEEL_MID: '#334155',
  SLAMALOT_STEEL_PLATE: '#64748b',
  SLAMALOT_STEEL_HIGHLIGHT: '#cbd5e1',
  SLAMALOT_GOLD_CREST: '#fbbf24',
  SLAMALOT_HAMMER_CORE: '#f97316',
  SLAMALOT_VULN_GLOW: '#38bdf8',

  // WORLD 4: THE VOLCANO OF HOT HONEY (Molten honey lava, basalt columns, heat haze, dragon scales)
  VOLCANO_SKY_DEEP: '#140505',
  VOLCANO_SKY_MID: '#2b0b08',
  VOLCANO_SKY_GLOW: '#5c190c',
  VOLCANO_SKY_HAZE: '#9a2c10',
  VOLCANO_ASH_CLOUD: '#3f1f1a',
  VOLCANO_EMBER_YELLOW: '#fef08a',
  VOLCANO_EMBER_ORANGE: '#f97316',
  BASALT_DARK: '#0a0808',
  BASALT_MID: '#1c1514',
  BASALT_LIGHT: '#342624',
  BASALT_RIM: '#543f3b',
  BASALT_SPECULAR: '#8a6e68',
  LAVA_HONEY_DEEP: '#7c1d0d',
  LAVA_HONEY_MAGMA: '#c2410c',
  LAVA_HONEY_SURFACE: '#f97316',
  LAVA_HONEY_BRIGHT: '#fbbf24',
  LAVA_HONEY_CORE: '#fef08a',
  LAVA_HONEY_WHITE: '#ffffff',
  UPDRAFT_STREAM: '#fdba74',
  UPDRAFT_CORE: '#fef08a',
  FIREBEE_BODY: '#7c2d12',
  FIREBEE_FLAME: '#f97316',
  FIREBEE_CORE: '#fef08a',
  LAVABEETLE_SHELL: '#1c1514',
  LAVABEETLE_MAGMA: '#ea580c',
  LAVABEETLE_HOT: '#fef08a',
  DRAGON_SCALE_DARK: '#7c2d12',
  DRAGON_SCALE_MID: '#c2410c',
  DRAGON_SCALE_GOLD: '#f59e0b',
  DRAGON_HORN: '#1c1514',
  DRAGON_HEART_CORE: '#fef08a',
  DRAGON_EYE_RUBY: '#ef4444',
};
