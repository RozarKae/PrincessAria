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
    this.initSpriteBuffers();
  }

  /**
   * Pre-render all ASCII frames into offscreen canvases for blazingly fast pixel blitting.
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

    // Running
    if (Math.abs(player.vx) > 20) {
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
   * Draw Princess Aria at world coordinates transformed onto the 256x240 internal canvas.
   * @param {CanvasRenderingContext2D} ctx Internal 256x240 canvas context
   * @param {number} screenX Top-left X in 256x240 pixel space
   * @param {number} screenY Top-left Y in 256x240 pixel space
   * @param {Player} player Player entity
   */
  draw(ctx, screenX, screenY, player) {
    const frameKey = this.getFrameKey(player);
    const spriteCanvas = this.cachedCanvases[frameKey] || this.cachedCanvases.idle_0;

    // Invulnerability blink (flash every alternate frame)
    if (player.invincibilityTimer > 0) {
      const flash = Math.floor(player.invincibilityTimer * 20) % 2 === 0;
      if (flash) return;
    }

    ctx.save();

    // In 256x240 space, round to exact integer pixel coordinates!
    const px = Math.round(screenX);
    const py = Math.round(screenY);

    // Subtle ground shadow (3x1 dark pixel bar when grounded, shrinking when high)
    if (player.isGrounded) {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
      ctx.fillRect(px + 2, py + this.spriteHeight, this.spriteWidth - 4, 1);
    } else {
      const dist = (player.groundDistance || 0) / 4.5;
      if (dist < 40) {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.25)';
        const shadowW = Math.max(4, this.spriteWidth - 4 - Math.floor(dist * 0.15));
        ctx.fillRect(px + Math.floor((this.spriteWidth - shadowW) / 2), Math.round(py + this.spriteHeight + dist), shadowW, 1);
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

    // Modern Futuristic Visual Flourishes:
    // 1. Crown Specular Shimmer (Cyber-gold sub-pixel gleam)
    const crownGleam = Math.floor(performance.now() * 0.005) % 8 === 0;
    if (crownGleam) {
      ctx.fillStyle = '#ffffff';
      const gleamX = player.facing < 0 ? (px + this.spriteWidth - 9) : (px + 7);
      ctx.fillRect(gleamX, py + 1, 1, 1);
      ctx.fillStyle = 'rgba(253, 224, 71, 0.6)';
      ctx.fillRect(gleamX - 1, py + 1, 3, 1);
      ctx.fillRect(gleamX, py, 1, 3);
    }

    // 2. Dash & Speed Trailing Chromatic Quantum Ghosts
    if (player.isDashing || Math.abs(player.vx) > 340) {
      ctx.globalAlpha = 0.45;
      const ghostOffset1 = player.facing > 0 ? -5 : 5;
      const ghostOffset2 = player.facing > 0 ? -10 : 10;
      
      // Violet primary shadow
      ctx.fillStyle = '#c084fc';
      if (player.facing < 0) {
        ctx.drawImage(spriteCanvas, ghostOffset1, 0);
      } else {
        ctx.drawImage(spriteCanvas, px + ghostOffset1, py);
      }

      // Cyan secondary quantum trail
      ctx.globalAlpha = 0.22;
      if (player.facing < 0) {
        ctx.drawImage(spriteCanvas, ghostOffset2, 0);
      } else {
        ctx.drawImage(spriteCanvas, px + ghostOffset2, py);
      }
      ctx.globalAlpha = 1.0;
    }

    ctx.restore();
  }
}

export const pixelAriaRenderer = new PixelCharacterRenderer();
