import { PIXEL_PALETTE } from './PixelPalette.js';

/**
 * PixelCharacterRenderer.js
 * 
 * 1985-Era Console Platformer Character Renderer for Princess Aria.
 * Renders small, crisp, recognizable pixel silhouettes on the 256x240 raster grid.
 * 
 * Expressive Animation States:
 * - IDLE: 4 frames (breathing chest rise, hair sway, crown gleam, blink)
 * - RUN: 6 frames (expressive run cycle, trailing ponytail, arm pump, leg stride)
 * - JUMP_START: 1 frame (jump anticipation squash)
 * - JUMP_RISE: 2 frames (upward reaching silhouette, tucked legs, trailing hair)
 * - FALL: 2 frames (downward descent, flutter dress, upward hair drift)
 * - LAND: 2 frames (landing squash & compression)
 * - DASH: 2 frames (aerodynamic forward tilt with trailing comet ponytail)
 * - HIT: 2 frames (flinch reaction, knockback pose)
 * - DEATH: 4 frames (retro tumbling launch)
 * - VICTORY: 2 frames (arms raised, crown gleam)
 */

const P = PIXEL_PALETTE;

// Color mapping for ASCII sprite definitions with modern hi-bit shading
const COLOR_MAP = {
  '.': null, // Transparent
  '#': P.ARIA_OUTLINE,         // Dark indigo silhouette outline
  'C': P.ARIA_CROWN,           // Brilliant cyber-gold crown
  'c': P.ARIA_CROWN_BASE,      // Warm amber crown base
  'g': P.ARIA_CROWN_GLINT,     // Pure white specular crown sparkle
  'G': P.ARIA_CROWN_GLINT,     // White specular flare
  'H': P.ARIA_HAIR_MID,        // Rich amber chestnut hair
  'h': P.ARIA_HAIR_LIGHT,      // Golden sunset highlight
  'D': P.ARIA_HAIR_DARK,       // Deep chocolate shadow
  'S': P.ARIA_SKIN,            // Soft radiant peach skin
  's': P.ARIA_SKIN_SHADOW,     // Warm skin ambient shadow
  'E': P.ARIA_EYES,            // Dark eye contour
  'I': P.ARIA_EYES_IRIS,       // Radiant celestial cyan iris
  'W': P.ARIA_WHITE,           // Pure white lace/cuff trim
  'V': P.ARIA_DRESS_ACCENT,    // Bright neon-violet dress rim
  'P': P.ARIA_DRESS_MID,       // Royal magenta-purple dress
  'K': P.ARIA_DRESS_DARK,      // Deep cosmic velvet dress shadow
  'B': P.ARIA_BOOTS,           // Midnight violet boots
  'b': P.ARIA_BOOTS_HIGHLIGHT, // Soft lilac boot edge highlight
};

// Sub-pixel enhancement map: provides secondary tint for richer shading
const SUBPIXEL_MAP = {
  'C': '#ffe066', // Warm glow under crown
  'c': '#c67e1a', // Darker amber underside
  'H': '#d9850a', // Hair warm secondary
  'D': '#5c2a06', // Dark hair deep shadow
  'S': '#f5d78e', // Skin warm reflective bounce
  'P': '#7c3aed', // Dress mid vibrant secondary
  'K': '#4c1d95', // Dress dark regal shadow
  'V': '#d8b4fe', // Dress accent bright rim
  'B': '#3b0764', // Boot warm secondary
  'E': '#0e0520', // Eye socket deep
  'W': '#e2e8f0', // White warm tint
};

// 16 pixels wide x 22 pixels tall frames
const RAW_FRAMES = {
  // --- IDLE (4 frames) ---
  idle_0: [
    "....#####.......",
    "...#CcCgC#......",
    "...#ccccc#......",
    "..#HHHHHH##.....",
    ".#HSSSEEEH#.....",
    ".#HSSSSEEH#.....",
    ".#HSSSSSH#......",
    "..#HWWWH##......",
    "...#PVVP#H#.....",
    "...#PPPP#HH#....",
    "..#KPPPPK#H#....",
    "..#KPPPPK#H#....",
    ".#KKPPPPKK#.....",
    ".#KKKKKKKK#.....",
    "..#SSSSSS#......",
    "..#SSSSSS#......",
    "..#BB##BB#......",
    "..#BB##BB#......",
    "..#BB##BB#......",
    ".###.###........",
    "................",
    "................",
  ],
  idle_1: [ // 1px chest rise (inhale)
    "....#####.......",
    "...#CcCgC#......",
    "...#ccccc#......",
    "..#HHHHHH##.....",
    ".#HSSSEEEH#.....",
    ".#HSSSSEEH#.....",
    ".#HSSSSSH#......",
    "..#HWWWH##......",
    "...#PVVP#HH#....",
    "..#VPPPPV#H#....",
    "..#KPPPPK#H#....",
    "..#KPPPPK#HH#...",
    ".#KKPPPPKK##....",
    ".#KKKKKKKK#.....",
    "..#SSSSSS#......",
    "..#SSSSSS#......",
    "..#BB##BB#......",
    "..#BB##BB#......",
    "..#BB##BB#......",
    ".###.###........",
    "................",
    "................",
  ],
  idle_2: [ // Top of breath with crown glint
    "....#GGG#.......",
    "...#CcCGC#......",
    "...#ccccc#......",
    "..#HHHHHH##.....",
    ".#HSSSEEEH#.....",
    ".#HSSSSEEH#.....",
    ".#HSSSSSH#......",
    "..#HWWWH##......",
    "...#PVVP#H#.....",
    "..#VPPPPV#H#....",
    "..#KPPPPK#HH#...",
    "..#KPPPPK##H#...",
    ".#KKPPPPKK##....",
    ".#KKKKKKKK#.....",
    "..#SSSSSS#......",
    "..#SSSSSS#......",
    "..#BB##BB#......",
    "..#BB##BB#......",
    "..#BB##BB#......",
    ".###.###........",
    "................",
    "................",
  ],
  idle_3: [ // Exhale + eye blink
    "....#####.......",
    "...#CcCgC#......",
    "...#ccccc#......",
    "..#HHHHHH##.....",
    ".#HSS###SH#.....",
    ".#HSS###SH#.....",
    ".#HSSSSSH#......",
    "..#HWWWH##......",
    "...#PVVP#H#.....",
    "...#PPPP#HH#....",
    "..#KPPPPK#H#....",
    "..#KPPPPK#H#....",
    ".#KKPPPPKK#.....",
    ".#KKKKKKKK#.....",
    "..#SSSSSS#......",
    "..#SSSSSS#......",
    "..#BB##BB#......",
    "..#BB##BB#......",
    "..#BB##BB#......",
    ".###.###........",
    "................",
    "................",
  ],

  // --- WALK (4 frames: upright athletic walking cadence) ---
  walk_0: [ // Right heel forward, left foot back, gentle arm swing
    "....#####.......",
    "...#CcCgC#......",
    "...#ccccc#......",
    "..#HHHHHH##.....",
    ".#HSSSEEEH#D#...",
    ".#HSSSSEEH#DD#..",
    "..#HSSSSSH#HD#..",
    "..#HWWWH##HH#...",
    "...#PVVP#HH#....",
    "...#PPPP#H#.....",
    "..#KPPPPK#......",
    ".#KKPPPPKK#.....",
    ".#KKKKKKKK#.....",
    "..#SSSSSS#......",
    "..#BB##SSSS#....",
    "..#BB###BB#.....",
    "..#BB#..#BB#....",
    ".###.....##.....",
    "................",
    "................",
    "................",
    "................",
  ],
  walk_1: [ // Passing position, slight 1px rise, feet crossing
    "....#####.......",
    "...#CcCgC#......",
    "...#ccccc#......",
    "..#HHHHHH##.....",
    ".#HSSSEEEH#.....",
    ".#HSSSSEEH#D#...",
    ".#HSSSSSH#DD#...",
    "..#HWWWH##H#....",
    "...#PVVP#HH#....",
    "..#VPPPPV#H#....",
    "..#KPPPPK#......",
    ".#KKPPPPKK#.....",
    ".#KKKKKKKK#.....",
    "..#SSSSSS#......",
    "...#SSSS#.......",
    "..#BB##BB#......",
    "..#BB##BB#......",
    "..#BB##BB#......",
    ".###.###........",
    "................",
    "................",
    "................",
  ],
  walk_2: [ // Left heel forward, right foot back, arms reverse
    "....#####.......",
    "...#CcCgC#......",
    "...#ccccc#......",
    "..#HHHHHH##.....",
    ".#HSSSEEEH#D#...",
    ".#HSSSSEEH#DD#..",
    "..#HSSSSSH#HD#..",
    "..#HWWWH##HH#...",
    "...#PVVP#HH#....",
    "...#PPPP#H#.....",
    "..#KPPPPK#......",
    ".#KKPPPPKK#.....",
    ".#KKKKKKKK#.....",
    "..#SSSSSS#......",
    ".#SSSS##BB#.....",
    "..#BB###BB#.....",
    "..#BB#..#BB#....",
    "..##.....###....",
    "................",
    "................",
    "................",
    "................",
  ],
  walk_3: [ // Passing position with left foot coming forward, slight rise
    "....#####.......",
    "...#CcCgC#......",
    "...#ccccc#......",
    "..#HHHHHH##.....",
    ".#HSSSEEEH#.....",
    ".#HSSSSEEH#D#...",
    ".#HSSSSSH#DD#...",
    "..#HWWWH##H#....",
    "...#PVVP#HH#....",
    "..#VPPPPV#H#....",
    "..#KPPPPK#......",
    ".#KKPPPPKK#.....",
    ".#KKKKKKKK#.....",
    "..#SSSSSS#......",
    "...#SSSS#.......",
    "..#BB##BB#......",
    "..#BB##BB#......",
    "..#BB##BB#......",
    ".###.###........",
    "................",
    "................",
    "................",
  ],

  // --- RUN (6 frames) ---
  run_0: [ // Right foot forward strike, arms swing, hair flows back
    "....#####.......",
    "...#CcCgC#......",
    "...#ccccc#......",
    "..#HHHHHH##.....",
    ".#HSSSEEEH#D#...",
    ".#HSSSSEEH#DD#..",
    "..#SSSSH##HDD#..",
    "...#WWH###HHH#..",
    "..#PVVPH##HH#...",
    "..#PPPP#HHH#....",
    ".#KPPPPK##......",
    "#KPPPPKK#.......",
    "#KKKKKK#........",
    ".#SSSS#.........",
    "..#BB#.#SSSS#...",
    "..#BB#..#BB#....",
    "...##...#BB#....",
    ".........##.....",
    "................",
    "................",
    "................",
    "................",
  ],
  run_1: [ // Compression / passing
    "....#####.......",
    "...#CcCgC#......",
    "...#ccccc#......",
    "..#HHHHHH##D#...",
    ".#HSSSEEEH#DD#..",
    ".#HSSSSEEH#DDD#.",
    "..#SSSSH##HDDD#.",
    "...#WW###HHHH#..",
    "..#PVVP###HH#...",
    "..#PPPPK###.....",
    ".#KPPPPK#.......",
    "#KKKKKK#........",
    "..#SSSS#........",
    "..#BB##SSSS#....",
    "..#BB###BB#.....",
    "...##...##......",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
  ],
  run_2: [ // Right foot push-off, left knee high
    "....#####.......",
    "...#CcCgC#......",
    "...#ccccc#......",
    "..#HHHHHH##DDD#.",
    ".#HSSSEEEH#HDDD#",
    ".#HSSSSEEH##HDH#",
    "..#SSSSH####HH#.",
    "...#WWH###......",
    "..#PVVP#H#......",
    "..#PPPP#H#......",
    ".#KPPPPK#.......",
    "#KKKKKKK#.......",
    ".#SSSS##........",
    "..#BB#..#SSSS#..",
    "..#BB#...#BB#...",
    "...##....#BB#...",
    "..........##....",
    "................",
    "................",
    "................",
    "................",
    "................",
  ],
  run_3: [ // Left foot forward strike, hair streaming
    "....#####.......",
    "...#CcCgC#......",
    "...#ccccc#......",
    "..#HHHHHH##.....",
    ".#HSSSEEEH#D#...",
    ".#HSSSSEEH#DD#..",
    "..#SSSSH##HDD#..",
    "...#WWH###HHH#..",
    "..#PVVPH##HH#...",
    "..#PPPP#HHH#....",
    ".#KPPPPK##......",
    "#KPPPPKK#.......",
    "#KKKKKK#........",
    "...#SSSS#.......",
    ".#SSSS#.#BB#....",
    "..#BB#..#BB#....",
    "..#BB#...##.....",
    "...##...........",
    "................",
    "................",
    "................",
    "................",
  ],
  run_4: [ // Left compression / passing
    "....#####.......",
    "...#CcCgC#......",
    "...#ccccc#......",
    "..#HHHHHH##D#...",
    ".#HSSSEEEH#DD#..",
    ".#HSSSSEEH#DDD#.",
    "..#SSSSH##HDDD#.",
    "...#WW###HHHH#..",
    "..#PVVP###HH#...",
    "..#PPPPK###.....",
    ".#KPPPPK#.......",
    "#KKKKKK#........",
    "..#SSSS#........",
    "..#SSSS##BB#....",
    "...#BB###BB#....",
    "...##...##......",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
  ],
  run_5: [ // Left push-off, right knee up
    "....#####.......",
    "...#CcCgC#......",
    "...#ccccc#......",
    "..#HHHHHH##DDD#.",
    ".#HSSSEEEH#HDDD#",
    ".#HSSSSEEH##HDH#",
    "..#SSSSH####HH#.",
    "...#WWH###......",
    "..#PVVP#H#......",
    "..#PPPP#H#......",
    ".#KPPPPK#.......",
    "#KKKKKKK#.......",
    "..#SSSS#........",
    ".#SSSS#..#BB#...",
    "..#BB#...#BB#...",
    "..#BB#....##....",
    "...##...........",
    "................",
    "................",
    "................",
    "................",
    "................",
  ],

  // --- JUMP ANTICIPATION (crouch) ---
  jump_start: [
    "................",
    "....#####.......",
    "...#CcCgC#......",
    "...#ccccc#......",
    "..#HHHHHH##.....",
    ".#HSSSEEEH#D#...",
    ".#HSSSSEEH#DD#..",
    "..#SSSSH##HD#...",
    "..#HWWWH##H#....",
    ".#KPVVPK#H#.....",
    ".#KKPPKK#H#.....",
    "#KKKKKKKK#......",
    ".#SSSSSSSS#.....",
    ".#BB####BB#.....",
    ".#BB####BB#.....",
    "..##....##......",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
  ],

  // --- JUMP RISE (arms up, silhouette arched upward, hair down) ---
  jump_rise: [
    "..##.#####.##...",
    ".#SS#CcCgC#SS#..",
    ".#SS#ccccc#SS#..",
    "..##HHHHHH##....",
    "..#HSSSEEEH#....",
    "..#HSSSSEEH#....",
    "..#HSSSSSH##....",
    "...#HWWWH#H#....",
    "...#PVVP##H#....",
    "...#PPPP#HH#....",
    "..#KPPPPK#H#....",
    "..#KKPPKK##D#...",
    "...#KKKK#DDD#...",
    "...#SSSS#DDD#...",
    "...#SSSS##D#....",
    "...#BBBB#.#.....",
    "...#BBBB#.......",
    "....####........",
    "................",
    "................",
    "................",
    "................",
  ],

  // --- FALL (flutter dress, arms out, hair drifting up) ---
  fall: [
    "....#####.......",
    "...#CcCgC#......",
    "...#ccccc#......",
    "..#HHHHHH##D#...",
    ".#HSSSEEEH#DD#..",
    ".#HSSSSEEH#HDD#.",
    "..#HSSSSSH#HD#..",
    "#S#HWWWH#S#H#...",
    "#SS#PVVP#SS#....",
    ".##KPPPPK##.....",
    ".#KKPPPPKK#.....",
    "#KKKPPPPKKK#....",
    "#KKKKKKKKKK#....",
    ".#SSSS..SSSS#...",
    "..#BB#..#BB#....",
    "..#BB#..#BB#....",
    "...##....##.....",
    "................",
    "................",
    "................",
    "................",
    "................",
  ],

  // --- LAND (compression squash) ---
  land: [
    "................",
    "................",
    "....#####.......",
    "...#CcCgC#......",
    "...#ccccc#......",
    "..#HHHHHH##.....",
    ".#HSSSEEEH#D#...",
    ".#HSSSSEEH#DD#..",
    "..#SSSSH##HD#...",
    "..#HWWWH##H#....",
    ".#KPVVPK#H#.....",
    ".#KKPPKK#H#.....",
    "#KKKKKKKK#......",
    ".#SSSSSSSS#.....",
    ".#BB####BB#.....",
    ".#BB####BB#.....",
    "..##....##......",
    "................",
    "................",
    "................",
    "................",
    "................",
  ],

  // --- DASH (aerodynamic forward tilt, trailing comet hair) ---
  dash: [
    "................",
    "......#####.....",
    ".....#CcCgC#....",
    ".....#ccccc#....",
    "....#HHHHHH##DD#",
    "..#HSSSEEEH#HDDD",
    ".#HSSSSEEH##HDDD",
    "..#SSSSH####HDDD",
    "...#WWH###HHHHD#",
    "..#PVVP#HHHH#D#.",
    ".#KPPPPK##HH##..",
    "#KPPPPKK#.......",
    "#KKKKKK#........",
    ".#SSSS##SSSS#...",
    "..#BB#...#BB#...",
    "..#BB#...#BB#...",
    "...##.....##....",
    "................",
    "................",
    "................",
    "................",
    "................",
  ],

  // --- HIT (flinch back reaction) ---
  hit: [
    "....#####.......",
    "...#CcCgC#......",
    "...#ccccc#......",
    "..#HHHHHH##.....",
    ".#H#SS##EH#.....",
    ".#H#SS##EH#.....",
    "..#HSSSSSH#.....",
    "#S.#HWWWH#.S#...",
    "#SS#PVVP#SS#....",
    ".##PPPPPP##.....",
    "..#KPPPPK#......",
    ".#KKPPPPKK#.....",
    "#KKKKKKKKKK#....",
    "..#SSSSSSSS#....",
    "..#BB#..#BB#....",
    "..#BB#..#BB#....",
    "...##....##.....",
    "................",
    "................",
    "................",
    "................",
    "................",
  ],

  // --- DEATH (classic retro dramatic tumbling pose) ---
  death: [
    "...#CcCgC#......",
    "..#HHHHHH##.....",
    ".#H#SS##EH#.....",
    ".#H#SS##EH#.....",
    "..#HSSSSSH#.....",
    "...#HWWWH#......",
    "..#KPVVPK#......",
    ".#KKPPPPKK#.....",
    "#KKKKKKKKKK#....",
    "..#SSSSSSSS#....",
    ".#BB#....#BB#...",
    ".#BB#....#BB#...",
    "..##......##....",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
  ],

  // --- VICTORY (arms raised, radiant celebration) ---
  victory: [
    ".##.......##....",
    ".#S######.#S#...",
    ".#S#CcCGC##S#...",
    "..#ccccc#..#....",
    "..#HHHHHH##.....",
    ".#HSSSEEEH#.....",
    ".#HSSSSEEH#.....",
    ".#HSSSSSH#......",
    "..#HWWWH##......",
    "...#PVVP#H#.....",
    "...#PPPP#HH#....",
    "..#KPPPPK#H#....",
    "..#KPPPPK#H#....",
    ".#KKPPPPKK#.....",
    ".#KKKKKKKK#.....",
    "..#SSSSSS#......",
    "..#BB##BB#......",
    "..#BB##BB#......",
    "..#BB##BB#......",
    ".###.###........",
    "................",
    "................",
  ],

  // --- ATTACK / SWORD SLASH (lunging swing with extended arm & blade) ---
  attack_0: [
    "....#####.......",
    "...#CcCgC#......",
    "...#ccccc#......",
    "..#HHHHHH##.....",
    ".#HSSSEEEH#D#...",
    ".#HSSSSEEH#DD#..",
    "..#SSSSH##HDD#..",
    "...#WWH###HHH#..",
    "..#PVVPH##HH#...",
    "..#PPPP#HHH#....",
    ".#KPPPPKSS#.....",
    "#KPPPPKSSSS#....",
    "#KKKKKK#........",
    "...#SSSS#.......",
    ".#SSSS#.#BB#....",
    "..#BB#..#BB#....",
    "..#BB#...##.....",
    "...##...........",
    "................",
    "................",
    "................",
    "................",
  ],
  attack_1: [
    "....#####.......",
    "...#CcCgC#......",
    "...#ccccc#......",
    "..#HHHHHH##DDD#.",
    ".#HSSSEEEH#HDDD#",
    ".#HSSSSEEH##HDH#",
    "..#SSSSH####HH#.",
    "...#WWH###......",
    "..#PVVP#H#......",
    "..#PPPP#H#S#....",
    ".#KPPPPK#SSSS#..",
    "#KKKKKKK#..#SS#.",
    ".#SSSS##........",
    "..#BB#..#SSSS#..",
    "..#BB#...#BB#...",
    "...##....#BB#...",
    "..........##....",
    "................",
    "................",
    "................",
    "................",
    "................",
  ]
};

export class PixelCharacterRenderer {
  constructor() {
    this.spriteWidth = 16;
    this.spriteHeight = 22;
    this.cachedCanvases = {};
    this.cachedCanvasesEnhanced = {};
    this.trailPositions = []; // For motion trail effect
    this.initSpriteBuffers();
  }

  /**
   * Pre-render all ASCII frames into offscreen canvases with sub-pixel enhancement.
   * Two passes: base color + sub-pixel shading for volumetric depth.
   */
  initSpriteBuffers() {
    if (typeof document === 'undefined') return;
    Object.keys(RAW_FRAMES).forEach(frameKey => {
      const asciiLines = RAW_FRAMES[frameKey];
      const canvas = document.createElement('canvas');
      canvas.width = this.spriteWidth;
      canvas.height = this.spriteHeight;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = false;

      // Pass 1: Base color fill
      for (let y = 0; y < asciiLines.length && y < this.spriteHeight; y++) {
        const line = asciiLines[y];
        for (let x = 0; x < line.length && x < this.spriteWidth; x++) {
          const char = line[x];
          const color = COLOR_MAP[char];
          if (color) {
            ctx.fillStyle = color;
            ctx.fillRect(x, y, 1, 1);
          }
        }
      }

      // Pass 2: Sub-pixel shading — add subtle vertical gradient per-pixel
      // Bottom half of each colored region gets a slightly darker tint
      for (let y = 0; y < asciiLines.length && y < this.spriteHeight; y++) {
        const line = asciiLines[y];
        for (let x = 0; x < line.length && x < this.spriteWidth; x++) {
          const char = line[x];
          if (char === '.' || char === '#') continue;
          const color = COLOR_MAP[char];
          if (!color) continue;

          // Check if pixel below is the same character (interior shading)
          const below = (y + 1 < asciiLines.length && x < asciiLines[y + 1].length) ? asciiLines[y + 1][x] : '.';
          const above = (y > 0 && x < asciiLines[y - 1].length) ? asciiLines[y - 1][x] : '.';

          // Add rim-light on top edge of colored regions
          if (above === '.' || above === '#') {
            const subColor = SUBPIXEL_MAP[char];
            if (subColor) {
              ctx.fillStyle = subColor;
              ctx.globalAlpha = 0.3;
              ctx.fillRect(x, y, 1, 1);
              ctx.globalAlpha = 1.0;
            }
          }
          // Add shadow on bottom edge of colored regions
          if (below === '.' || below === '#') {
            ctx.fillStyle = 'rgba(0,0,0,0.15)';
            ctx.fillRect(x, y, 1, 1);
          }
        }
      }

      // Pass 3: Add eye detail — find 'E' pixels and add iris/pupil glow
      for (let y = 0; y < asciiLines.length && y < this.spriteHeight; y++) {
        const line = asciiLines[y];
        for (let x = 0; x < line.length && x < this.spriteWidth; x++) {
          if (line[x] === 'E') {
            // Check adjacent pixels for iris placement
            const right = (x + 1 < line.length) ? line[x + 1] : '.';
            const left = (x > 0) ? line[x - 1] : '.';
            if (right === 'E' || right === 'S' || right === 'H') {
              // Add a cyan iris sub-pixel in the center of eye region
              ctx.fillStyle = P.ARIA_EYES_IRIS;
              ctx.globalAlpha = 0.7;
              ctx.fillRect(x, y, 1, 1);
              ctx.globalAlpha = 1.0;
            }
          }
        }
      }

      this.cachedCanvases[frameKey] = canvas;
    });
  }

  /**
   * Determine the exact sprite frame based on player state and animation timer.
   */
  getFrameKey(player) {
    if (player.isDead) return 'death';
    if (player.isVictorious) return 'victory';
    if (player.isHurt) return 'hit';
    if (player.isDashing) return 'dash';
    if (player.isAttacking) {
      return (player.attackTimer > 0.11) ? 'attack_0' : 'attack_1';
    }

    // Air states
    if (!player.isGrounded) {
      if (player.vy < -80) {
        return 'jump_rise';
      } else if (player.vy < 80) {
        return 'jump_rise';
      } else {
        return 'fall';
      }
    }

    // Landing squash check
    if (player.anim && player.anim.currentAnimationName === 'LAND' && !player.anim.isFinished) {
      return 'land';
    }

    // Walking animation state
    if (player.anim && (player.anim.currentAnimationName === 'WALK' || player.anim.currentAnimationName === 'walk')) {
      const walkCycleTime = (player.anim ? player.anim.animationTimer : 0) * 8;
      const frameIndex = Math.floor(walkCycleTime) % 4;
      return `walk_${frameIndex}`;
    }

    // Low speed movement (walking cadence)
    if (Math.abs(player.vx) > 10 && Math.abs(player.vx) < 180) {
      const walkCycleTime = (player.anim ? player.anim.animationTimer : 0) * 8;
      const frameIndex = Math.floor(walkCycleTime) % 4;
      return `walk_${frameIndex}`;
    }

    // Running (high speed athletic sprint)
    if (Math.abs(player.vx) >= 180) {
      const runCycleTime = (player.anim ? player.anim.animationTimer : 0) * 14;
      const frameIndex = Math.floor(runCycleTime) % 6;
      return `run_${frameIndex}`;
    }

    // Idle
    const idleTime = (player.anim ? player.anim.animationTimer : 0) * 3;
    const idleIndex = Math.floor(idleTime) % 4;
    return `idle_${idleIndex}`;
  }

  /**
   * Directly draw an authored sprite frame at specific coordinates with facing and opacity.
   * Ideal for cinematic sequences, cutscenes, and timeline events.
   */
  drawFrame(ctx, screenX, screenY, frameKey, facing = 1, alpha = 1) {
    const spriteCanvas = this.cachedCanvases[frameKey] || this.cachedCanvases.idle_0;
    if (!spriteCanvas) return;
    const px = Math.round(screenX);
    const py = Math.round(screenY);

    ctx.save();
    if (alpha < 1) {
      ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
    }
    if (facing < 0) {
      ctx.translate(px + this.spriteWidth, py);
      ctx.scale(-1, 1);
      ctx.drawImage(spriteCanvas, 0, 0);
    } else {
      ctx.drawImage(spriteCanvas, px, py);
    }
    ctx.restore();
  }

  /**
   * Draw Princess Aria at world coordinates transformed onto the 256x240 internal canvas.
   * @param {CanvasRenderingContext2D} ctx Internal 256x240 canvas context
   * @param {number} screenX Top-left X in 256x240 pixel space
   * @param {number} screenY Top-left Y in 256x240 pixel space
   * @param {Player} player Player entity
   */
  draw(ctx, screenX, screenY, player) {
    const frameKey = this.getFrameKey(player);
    const spriteCanvas = this.cachedCanvases[frameKey] || this.cachedCanvases.idle_0;
    const now = performance.now();

    // Invulnerability blink (flash every alternate frame with color shift)
    if (player.invincibilityTimer > 0) {
      const flash = Math.floor(player.invincibilityTimer * 20) % 3;
      if (flash === 0) return; // Skip frame
      if (flash === 2) {
        // White-hot flash frame for impact feel
        ctx.save();
        ctx.globalAlpha = 0.6;
        ctx.filter = 'brightness(2.5) saturate(0)';
      }
    }

    ctx.save();

    // In 256x240 space, round to exact integer pixel coordinates!
    const px = Number(screenX);
    const py = Number(screenY);

    // --- Enhanced Ground Shadow (multi-layer soft gradient shadow) ---
    if (player.isGrounded) {
      // Layered shadow: core dark + soft outer penumbra
      ctx.fillStyle = 'rgba(15, 23, 42, 0.18)';
      ctx.fillRect(px + 1, py + this.spriteHeight + 1, this.spriteWidth - 2, 1);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.42)';
      ctx.fillRect(px + 2, py + this.spriteHeight, this.spriteWidth - 4, 1);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.12)';
      ctx.fillRect(px + 3, py + this.spriteHeight + 1, this.spriteWidth - 6, 1);
    } else {
      const dist = (player.groundDistance || 0) / 4.5;
      if (dist < 50) {
        const shadowAlpha = Math.max(0.06, 0.32 - dist * 0.006);
        ctx.fillStyle = `rgba(15, 23, 42, ${shadowAlpha})`;
        const shadowW = Math.max(3, this.spriteWidth - 3 - Math.floor(dist * 0.18));
        const shadowY = Number(py + this.spriteHeight + dist);
        ctx.fillRect(px + Math.floor((this.spriteWidth - shadowW) / 2), shadowY, shadowW, 1);
        // Soft penumbra
        ctx.fillStyle = `rgba(15, 23, 42, ${shadowAlpha * 0.4})`;
        ctx.fillRect(px + Math.floor((this.spriteWidth - shadowW) / 2) - 1, shadowY, shadowW + 2, 1);
      }
    }

    // --- Subtle Ambient Glow Aura (during powered/victory states) ---
    if (player.isVictorious || player.isDashing) {
      const glowPulse = Math.sin(now * 0.008) * 0.15 + 0.2;
      ctx.fillStyle = player.isVictorious ? `rgba(253, 224, 71, ${glowPulse})` : `rgba(192, 132, 252, ${glowPulse})`;
      ctx.fillRect(px - 1, py - 1, this.spriteWidth + 2, this.spriteHeight + 2);
    }

    // --- Motion Trail Particles (subtle pixel dust when running) ---
    if (Math.abs(player.vx) > 80 && player.isGrounded) {
      const trailX = player.facing > 0 ? px : px + this.spriteWidth;
      const trailY = py + this.spriteHeight - 1;
      const dustPhase = Math.floor(now * 0.02) % 4;
      ctx.fillStyle = 'rgba(180, 160, 120, 0.4)';
      ctx.fillRect(trailX + (dustPhase * player.facing * -2), trailY - dustPhase, 1, 1);
      if (Math.abs(player.vx) > 150) {
        ctx.fillStyle = 'rgba(180, 160, 120, 0.25)';
        ctx.fillRect(trailX + ((dustPhase + 2) * player.facing * -2), trailY - dustPhase - 1, 1, 1);
      }
    }

    // Directional flip
    if (player.facing < 0) {
      ctx.translate(px + this.spriteWidth, py);
      ctx.scale(-1, 1);
      ctx.drawImage(spriteCanvas, 0, 0);
    } else {
      ctx.drawImage(spriteCanvas, px, py);
    }

    // --- Enhanced Crown Specular Shimmer (Animated crosshair sparkle pattern) ---
    const crownCyclePhase = Math.floor(now * 0.003) % 16;
    if (crownCyclePhase < 3) {
      const gleamX = player.facing < 0 ? (px + this.spriteWidth - 9) : (px + 7);
      // Core white pixel
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(gleamX, py + 1, 1, 1);
      // Crosshair sparkle arms
      ctx.fillStyle = 'rgba(253, 224, 71, 0.75)';
      ctx.fillRect(gleamX - 1, py + 1, 1, 1);
      ctx.fillRect(gleamX + 1, py + 1, 1, 1);
      ctx.fillRect(gleamX, py, 1, 1);
      ctx.fillRect(gleamX, py + 2, 1, 1);
      if (crownCyclePhase === 0) {
        // Extended sparkle on peak frame
        ctx.fillStyle = 'rgba(253, 224, 71, 0.35)';
        ctx.fillRect(gleamX - 2, py + 1, 1, 1);
        ctx.fillRect(gleamX + 2, py + 1, 1, 1);
      }
    }

    // --- Animated Eye Iris Glint (Tiny white pupil highlight that shifts) ---
    if (!player.isDead && !player.isHurt) {
      const eyeGlintPhase = Math.floor(now * 0.001) % 24;
      if (eyeGlintPhase < 18) { // Visible most of the time
        const eyeBaseX = player.facing < 0 ? (px + this.spriteWidth - 10) : (px + 6);
        const eyeY = py + 4; // Approximate eye row
        const glintShift = eyeGlintPhase < 8 ? 0 : (eyeGlintPhase < 16 ? 1 : 0);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(eyeBaseX + glintShift, eyeY, 1, 1);
      }
    }

    // --- Dash & Speed Trailing Chromatic Quantum Ghosts (Enhanced 3-layer) ---
    if (player.isDashing || Math.abs(player.vx) > 340) {
      const ghostOffset1 = player.facing > 0 ? -4 : 4;
      const ghostOffset2 = player.facing > 0 ? -8 : 8;
      const ghostOffset3 = player.facing > 0 ? -12 : 12;
      
      // Violet primary ghost
      ctx.globalAlpha = 0.4;
      if (player.facing < 0) {
        ctx.drawImage(spriteCanvas, ghostOffset1, 0);
      } else {
        ctx.drawImage(spriteCanvas, px + ghostOffset1, py);
      }

      // Cyan secondary ghost
      ctx.globalAlpha = 0.2;
      if (player.facing < 0) {
        ctx.drawImage(spriteCanvas, ghostOffset2, 0);
      } else {
        ctx.drawImage(spriteCanvas, px + ghostOffset2, py);
      }

      // Faint tertiary ghost for depth
      ctx.globalAlpha = 0.08;
      if (player.facing < 0) {
        ctx.drawImage(spriteCanvas, ghostOffset3, 0);
      } else {
        ctx.drawImage(spriteCanvas, px + ghostOffset3, py);
      }
      ctx.globalAlpha = 1.0;
    }

    // --- Hair Flow Highlight (Animated light band traveling through ponytail) ---
    if (!player.isDead) {
      const hairPhase = Math.floor(now * 0.004) % 12;
      if (hairPhase < 4) {
        const hairBaseX = player.facing < 0 ? (px + 2) : (px + this.spriteWidth - 5);
        const hairY = py + 8 + hairPhase;
        ctx.fillStyle = 'rgba(253, 230, 138, 0.35)';
        ctx.fillRect(hairBaseX, hairY, 2, 1);
      }
    }

    ctx.restore();

    // Restore from invincibility filter
    if (player.invincibilityTimer > 0) {
      const flash = Math.floor(player.invincibilityTimer * 20) % 3;
      if (flash === 2) {
        ctx.restore();
      }
    }
  }
}

export const pixelAriaRenderer = new PixelCharacterRenderer();
