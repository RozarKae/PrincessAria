import { INTERNAL_WIDTH, INTERNAL_HEIGHT, WORLD_TO_PIXEL, PIXEL_PALETTE } from './PixelPalette.js';
import { pixelAriaRenderer } from './PixelCharacterRenderer.js';
import { pixelEnemyRenderer } from './PixelEnemyRenderer.js';
import { pixelHUD } from '../ui/PixelHUD.js';

/**
 * PixelRenderer.js
 * 
 * Deliberate 1985-Era Console Platformer Renderer for Project Aria.
 * 
 * Target internal gameplay resolution: 256 x 240.
 * Scaled using integer-style nearest-neighbor principles to the display viewport.
 * - Flat pixel-art lighting.
 * - Restrained 1985 color palette.
 * - Simple 2-layer background (Sky + Distant Silhouette Hills/Forest).
 * - Simple midground trees & rare landmarks.
 * - Ultra-readable platform vocabulary: ground, platform, bridge, hazard, vine, moving platform.
 * - Zero painterly interpolation or high-DPI smoothing. Crisp pixel edges.
 */

const P = PIXEL_PALETTE;

export class PixelRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    // Internal 256x240 low-resolution raster canvas
    this.internalCanvas = document.createElement('canvas');
    this.internalCanvas.width = INTERNAL_WIDTH;
    this.internalCanvas.height = INTERNAL_HEIGHT;
    this.internalCtx = this.internalCanvas.getContext('2d');
    this.internalCtx.imageSmoothingEnabled = false;

    // Viewport scaling
    this.setupViewport();
    window.addEventListener('resize', () => this.setupViewport());

    this.timer = 0;
  }

  setupViewport() {
    // Keep internal canvas strictly 256x240
    this.internalCanvas.width = INTERNAL_WIDTH;
    this.internalCanvas.height = INTERNAL_HEIGHT;
    this.internalCtx.imageSmoothingEnabled = false;

    // Set display canvas buffer to match internal resolution directly!
    // The browser's CSS scaling handles widescreen stretching/scaling cleanly with image-rendering: pixelated.
    this.canvas.width = INTERNAL_WIDTH;
    this.canvas.height = INTERNAL_HEIGHT;
    this.ctx.imageSmoothingEnabled = false;
  }

  update(dt) {
    this.timer += dt;
    pixelEnemyRenderer.update(dt);
    pixelHUD.update(dt);
  }

  clear() {
    this.internalCtx.clearRect(0, 0, INTERNAL_WIDTH, INTERNAL_HEIGHT);
  }

  beginFrame() {
    this.internalCtx.imageSmoothingEnabled = false;
  }

  endFrame() {
    // Copy internal 256x240 buffer to display canvas with zero smoothing
    this.ctx.imageSmoothingEnabled = false;
    this.ctx.drawImage(this.internalCanvas, 0, 0);
  }

  // ========================================================
  // 1. BACKGROUND (Sky + 1-2 Distant Forest/Hill Silhouettes)
  // ========================================================
  drawBackground(camera, level) {
    const ctx = this.internalCtx;
    const camX = camera ? camera.x : 0;

    // --- Layer 0: Sky (3-tone retro blue palette) ---
    ctx.fillStyle = P.SKY_DEEP;
    ctx.fillRect(0, 0, INTERNAL_WIDTH, 60);
    ctx.fillStyle = P.SKY_MID;
    ctx.fillRect(0, 60, INTERNAL_WIDTH, 80);
    ctx.fillStyle = P.SKY_LIGHT;
    ctx.fillRect(0, 140, INTERNAL_WIDTH, 100);

    // Occasional subtle retro clouds (2 drifting clouds)
    ctx.fillStyle = '#ffffff';
    const cloud1X = Math.round((200 - (camX * 0.04) + this.timer * 3) % (INTERNAL_WIDTH + 80)) - 40;
    this.drawPixelCloud(ctx, cloud1X, 28, 24);
    const cloud2X = Math.round((420 - (camX * 0.05) + this.timer * 2) % (INTERNAL_WIDTH + 80)) - 40;
    this.drawPixelCloud(ctx, cloud2X, 52, 18);

    // --- Layer 1: Distant Forest & Mountain Silhouettes (Parallax: 0.15) ---
    const layer1Offset = (camX * 0.15) * WORLD_TO_PIXEL;
    this.drawDistantHills(ctx, layer1Offset);
  }

  drawPixelCloud(ctx, x, y, width) {
    ctx.fillRect(x + 4, y, width - 8, 3);
    ctx.fillRect(x + 2, y + 3, width - 4, 4);
    ctx.fillRect(x, y + 7, width, 3);
  }

  drawDistantHills(ctx, offset) {
    const hillW = 96;
    const startX = -Math.floor(offset % hillW);

    for (let x = startX - hillW; x < INTERNAL_WIDTH + hillW; x += hillW) {
      // Deep twilight green rolling silhouettes
      this.internalCtx.fillStyle = P.FOREST_DEEP;
      this.internalCtx.fillRect(x + 12, 148, 72, 92);
      this.internalCtx.fillRect(x + 24, 138, 48, 10);
      this.internalCtx.fillRect(x + 36, 130, 24, 8);
      this.internalCtx.fillRect(x + 44, 124, 8, 6);

      // Distant pine peak silhouette
      this.internalCtx.fillStyle = P.FOREST_CANOPY;
      this.internalCtx.fillRect(x + 60, 154, 4, 86);
      this.internalCtx.fillRect(x + 58, 158, 8, 4);
      this.internalCtx.fillRect(x + 56, 164, 12, 5);
      this.internalCtx.fillRect(x + 54, 171, 16, 6);
    }
  }

  // ========================================================
  // 2. MIDGROUND PROPS (Simple Trees & Rare Landmarks)
  // ========================================================
  drawMidground(camera, midgroundProps = []) {
    const ctx = this.internalCtx;
    const camX = camera ? camera.x : 0;

    // Distant simple trees (Parallax: 0.4)
    const treeW = 128;
    const treeOffset = (camX * 0.4) * WORLD_TO_PIXEL;
    const startX = -Math.floor(treeOffset % treeW);

    for (let x = startX - treeW; x < INTERNAL_WIDTH + treeW; x += treeW) {
      this.drawSimpleTree(ctx, x + 30, 196);
    }

    // Rare Authoritative Landmarks (Rare beats: ~2100px Oak, ~3900px Redwood, ~7150px Watchtower)
    midgroundProps.forEach(p => {
      const scrX = Math.round((p.x - camX) * WORLD_TO_PIXEL);
      const scrY = Math.round(p.y * WORLD_TO_PIXEL);

      if (scrX < -60 || scrX > INTERNAL_WIDTH + 60) return;

      if (p.type === 'ancient_oak') {
        this.drawAncientOakLandmark(ctx, scrX, scrY);
      } else if (p.type === 'hollow_redwood') {
        this.drawRedwoodLandmark(ctx, scrX, scrY);
      } else if (p.type === 'fortress_watchtower') {
        this.drawWatchtowerLandmark(ctx, scrX, scrY);
      }
    });
  }

  drawSimpleTree(ctx, x, groundY) {
    // Trunk
    ctx.fillStyle = P.GROUND_WARM;
    ctx.fillRect(x + 6, groundY - 26, 4, 26);

    // Foliage crown (Restrained medium green)
    ctx.fillStyle = P.FOREST_MID;
    ctx.fillRect(x, groundY - 42, 16, 16);
    ctx.fillRect(x + 2, groundY - 46, 12, 4);
    ctx.fillRect(x + 4, groundY - 48, 8, 2);

    // Crown highlight
    ctx.fillStyle = P.FOREST_LIGHT;
    ctx.fillRect(x + 3, groundY - 44, 4, 3);
  }

  drawAncientOakLandmark(ctx, x, y) {
    // Rare majestic ancient oak silhouette
    ctx.fillStyle = P.GROUND_WARM;
    ctx.fillRect(x - 8, y - 64, 16, 64);
    ctx.fillRect(x - 14, y - 12, 28, 12); // Roots

    // Expansive canopy
    ctx.fillStyle = P.FOREST_DEEP;
    ctx.fillRect(x - 36, y - 96, 72, 38);
    ctx.fillRect(x - 26, y - 106, 52, 10);
    ctx.fillStyle = P.FOREST_MID;
    ctx.fillRect(x - 32, y - 92, 64, 30);
    ctx.fillStyle = P.FOREST_LIGHT;
    ctx.fillRect(x - 20, y - 100, 24, 6);
  }

  drawRedwoodLandmark(ctx, x, y) {
    // Massive monolithic sequoia trunk
    ctx.fillStyle = '#451a03';
    ctx.fillRect(x - 12, y - 120, 24, 120);
    ctx.fillStyle = '#78350f';
    ctx.fillRect(x - 8, y - 120, 6, 120);

    // Upper branches
    ctx.fillStyle = P.FOREST_DEEP;
    ctx.fillRect(x - 30, y - 110, 60, 16);
    ctx.fillRect(x - 24, y - 126, 48, 16);
  }

  drawWatchtowerLandmark(ctx, x, y) {
    // Fortress watchtower silhouette
    ctx.fillStyle = P.STONE_DARK;
    ctx.fillRect(x - 16, y - 110, 32, 110);
    ctx.fillStyle = P.STONE_MID;
    ctx.fillRect(x - 18, y - 118, 36, 12);
    // Crenellations
    ctx.fillRect(x - 18, y - 124, 6, 6);
    ctx.fillRect(x - 6, y - 124, 6, 6);
    ctx.fillRect(x + 6, y - 124, 6, 6);
    // Slit windows
    ctx.fillStyle = P.HONEY_AMBER;
    ctx.fillRect(x - 2, y - 90, 4, 8);
    ctx.fillRect(x - 2, y - 60, 4, 8);
  }

  // ========================================================
  // 3. PLATFORMS (Disciplined Small Vocabulary)
  // ========================================================
  drawPlatforms(camera, platforms = [], movingPlatforms = []) {
    const ctx = this.internalCtx;
    const camX = camera ? camera.x : 0;
    const camY = camera ? camera.y : 0;

    // Draw static platforms
    platforms.forEach(plat => {
      const scrX = Math.round((plat.x - camX) * WORLD_TO_PIXEL);
      const scrY = Math.round((plat.y - camY) * WORLD_TO_PIXEL);
      const scrW = Math.round(plat.width * WORLD_TO_PIXEL);
      const scrH = Math.round(plat.height * WORLD_TO_PIXEL);

      // Frustum culling
      if (scrX + scrW < -10 || scrX > INTERNAL_WIDTH + 10) return;

      if (plat.type === 'ground') {
        this.renderPixelGround(ctx, scrX, scrY, scrW, scrH);
      } else if (plat.type === 'bridge' || plat.type === 'rope_bridge') {
        this.renderPixelBridge(ctx, scrX, scrY, scrW, scrH);
      } else if (plat.type === 'honey' || plat.type === 'moving_honey') {
        this.renderPixelHoneyPlatform(ctx, scrX, scrY, scrW, scrH);
      } else if (plat.type === 'stone' || plat.type === 'moving_runestone') {
        this.renderPixelStonePlatform(ctx, scrX, scrY, scrW, scrH);
      } else if (plat.type === 'crumble_block' || plat.type === 'crumble') {
        if (!plat.isBroken) {
          const shakeX = plat.isShaking ? (Math.random() < 0.5 ? -1 : 1) : 0;
          this.renderPixelCrumblePlatform(ctx, scrX + shakeX, scrY, scrW, scrH);
        }
      } else if (plat.type === 'vine' || plat.type === 'climbable_vine') {
        this.renderPixelVine(ctx, scrX, scrY, scrW, scrH);
      } else if (plat.type === 'hazard' || plat.type === 'spikes') {
        this.renderPixelHazard(ctx, scrX, scrY, scrW, scrH);
      } else {
        // Standard elevated wood platform
        this.renderPixelWoodPlatform(ctx, scrX, scrY, scrW, scrH);
      }
    });

    // Draw moving platforms
    movingPlatforms.forEach(mp => {
      const scrX = Math.round((mp.x - camX) * WORLD_TO_PIXEL);
      const scrY = Math.round((mp.y - camY) * WORLD_TO_PIXEL);
      const scrW = Math.round(mp.width * WORLD_TO_PIXEL);
      const scrH = Math.round(mp.height * WORLD_TO_PIXEL);

      if (scrX + scrW < -10 || scrX > INTERNAL_WIDTH + 10) return;

      if (mp.type === 'moving_runestone') {
        this.renderPixelStonePlatform(ctx, scrX, scrY, scrW, scrH, true);
      } else {
        this.renderPixelHoneyPlatform(ctx, scrX, scrY, scrW, scrH, true);
      }
    });
  }

  /**
   * Continuous Meadow Ground with high-contrast walkable top and rich earth core.
   */
  renderPixelGround(ctx, x, y, w, h) {
    // 1. Walkable Grass Cap (3px total)
    ctx.fillStyle = P.GRASS_TOP;
    ctx.fillRect(x, y, w, 2);
    ctx.fillStyle = P.GRASS_HIGHLIGHT;
    ctx.fillRect(x, y, w, 1);

    // Grass fringe teeth
    ctx.fillStyle = P.GRASS_EDGE;
    for (let px = x; px < x + w; px += 4) {
      ctx.fillRect(px, y + 2, 2, 2);
    }

    // 2. Earth Subsurface Body
    ctx.fillStyle = P.GROUND_WARM;
    ctx.fillRect(x, y + 4, w, h - 4);

    // Deep loam layer
    ctx.fillStyle = P.GROUND_DARK;
    ctx.fillRect(x, y + 16, w, h - 16);

    // Subtle 8x8 NES-style brick earth texture
    ctx.fillStyle = P.GROUND_LIGHT;
    for (let py = y + 8; py < y + h; py += 12) {
      const rowOffset = ((py - y) / 12) % 2 === 0 ? 0 : 8;
      for (let px = x + rowOffset; px < x + w; px += 16) {
        ctx.fillRect(px, py, 6, 2);
      }
    }
  }

  /**
   * Elevated Wood Platform.
   */
  renderPixelWoodPlatform(ctx, x, y, w, h) {
    // Grass/moss top
    ctx.fillStyle = P.GRASS_TOP;
    ctx.fillRect(x, y, w, 2);

    // Wood core
    ctx.fillStyle = P.GROUND_WARM;
    ctx.fillRect(x, y + 2, w, h - 3);

    // Bark rim
    ctx.fillStyle = P.GROUND_DARK;
    ctx.fillRect(x, y + h - 1, w, 1);
    ctx.fillRect(x, y, 1, h);
    ctx.fillRect(x + w - 1, y, 1, h);
  }

  /**
   * Elevated Stone / Fortress Platform.
   */
  renderPixelStonePlatform(ctx, x, y, w, h, isMoving = false) {
    // Slate cap
    ctx.fillStyle = P.STONE_HIGHLIGHT;
    ctx.fillRect(x, y, w, 1);
    ctx.fillStyle = P.STONE_LIGHT;
    ctx.fillRect(x, y + 1, w, 2);

    // Stone body
    ctx.fillStyle = P.STONE_MID;
    ctx.fillRect(x, y + 3, w, h - 4);

    // Shadow base
    ctx.fillStyle = P.STONE_DARK;
    ctx.fillRect(x, y + h - 1, w, 1);

    // Moving glyph indicator
    if (isMoving) {
      ctx.fillStyle = P.HONEY_AMBER;
      ctx.fillRect(x + Math.floor(w / 2) - 3, y + 2, 6, 3);
    }
  }

  /**
   * Bouncy Honey Raft Platform.
   */
  renderPixelHoneyPlatform(ctx, x, y, w, h, isMoving = false) {
    // Radiant honey sheen top
    ctx.fillStyle = P.HONEY_PALE;
    ctx.fillRect(x, y, w, 1);
    ctx.fillStyle = P.HONEY_LIGHT;
    ctx.fillRect(x, y + 1, w, 2);

    // Translucent amber body
    ctx.fillStyle = P.HONEY_AMBER;
    ctx.fillRect(x, y + 3, w, h - 4);

    // Deep honey drop bottom
    ctx.fillStyle = P.HONEY_DARK;
    ctx.fillRect(x, y + h - 1, w, 1);
    for (let px = x + 4; px < x + w - 4; px += 8) {
      ctx.fillRect(px, y + h, 3, 2);
    }
  }

  /**
   * Crumbling Viaduct Stone Block.
   */
  renderPixelCrumblePlatform(ctx, x, y, w, h) {
    ctx.fillStyle = P.STONE_LIGHT;
    ctx.fillRect(x, y, w, 2);
    ctx.fillStyle = P.STONE_MID;
    ctx.fillRect(x, y + 2, w, h - 3);
    ctx.fillStyle = P.STONE_DARK;
    ctx.fillRect(x, y + h - 1, w, 1);

    // Visible structural cracks
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(x + Math.floor(w * 0.3), y + 2, 1, 4);
    ctx.fillRect(x + Math.floor(w * 0.3) + 1, y + 5, 2, 1);
    ctx.fillRect(x + Math.floor(w * 0.7), y + 3, 2, 1);
    ctx.fillRect(x + Math.floor(w * 0.7) + 1, y + 4, 1, 3);
  }

  /**
   * Suspended Rope & Wooden Plank Bridge.
   */
  renderPixelBridge(ctx, x, y, w, h) {
    // Upper guide rope
    ctx.fillStyle = P.HONEY_DARK;
    ctx.fillRect(x, y, w, 1);

    // Wooden planks (spaced with 2px gaps)
    ctx.fillStyle = P.GROUND_WARM;
    for (let px = x + 2; px < x + w - 2; px += 6) {
      ctx.fillRect(px, y + 2, 4, h - 2);
      ctx.fillStyle = P.GROUND_LIGHT;
      ctx.fillRect(px, y + 2, 4, 1); // Plank highlight
      ctx.fillStyle = P.GROUND_WARM;
    }
  }

  /**
   * Climbable Hanging Vine.
   */
  renderPixelVine(ctx, x, y, w, h) {
    const vx = x + Math.floor(w / 2) - 1;
    // Central vine stem
    ctx.fillStyle = P.FOREST_DEEP;
    ctx.fillRect(vx, y, 2, h);

    // Alternating ivy leaves
    for (let py = y + 4; py < y + h - 4; py += 8) {
      const side = ((py - y) / 8) % 2 === 0 ? -2 : 2;
      ctx.fillStyle = P.FOREST_LIGHT;
      ctx.fillRect(vx + side, py, 2, 2);
    }
  }

  /**
   * Clear Red Danger Spikes / Hazards.
   */
  renderPixelHazard(ctx, x, y, w, h) {
    ctx.fillStyle = P.HAZARD_BASE;
    ctx.fillRect(x, y + h - 2, w, 2);

    // Triangular pixel spikes
    for (let px = x; px < x + w - 4; px += 6) {
      ctx.fillStyle = P.HAZARD_SPIKE;
      ctx.fillRect(px, y + h - 5, 5, 3);
      ctx.fillRect(px + 1, y + h - 8, 3, 3);
      ctx.fillStyle = P.HAZARD_TIP;
      ctx.fillRect(px + 2, y + h - 10, 1, 2);
    }
  }

  // ========================================================
  // 4. ENTITIES & PARTICLES
  // ========================================================
  drawEntities(camera, level, player) {
    const ctx = this.internalCtx;
    const camX = camera ? camera.x : 0;
    const camY = camera ? camera.y : 0;

    // 1. Checkpoints
    if (level.checkpoints) {
      level.checkpoints.forEach(cp => {
        const scrX = Math.round((cp.x - camX) * WORLD_TO_PIXEL);
        const scrY = Math.round((cp.y + cp.height - 16 - camY) * WORLD_TO_PIXEL);
        if (scrX > -20 && scrX < INTERNAL_WIDTH + 20) {
          this.drawCheckpoint(ctx, scrX, scrY, cp.activated);
        }
      });
    }

    // 2. Goal & Batboy
    if (level.goal) {
      const scrX = Math.round((level.goal.x - camX) * WORLD_TO_PIXEL);
      const scrY = Math.round((level.goal.y + level.goal.height - 20 - camY) * WORLD_TO_PIXEL);
      if (scrX > -40 && scrX < INTERNAL_WIDTH + 40) {
        this.drawBatboyRescue(ctx, scrX, scrY, level.batboy?.isRescued);
      }
    }

    // 3. Royal Shard Collectibles
    level.shards.forEach(s => {
      if (s.collected) return;
      const scrX = Math.round((s.x - camX) * WORLD_TO_PIXEL);
      const scrY = Math.round((s.y - camY) * WORLD_TO_PIXEL);
      if (scrX > -10 && scrX < INTERNAL_WIDTH + 10) {
        this.drawRoyalShard(ctx, scrX, scrY);
      }
    });

    // 4. Queen Bee Distant Presence (Restrained silhouette, no giant HD boss)
    if (level.queenBeePresence && level.queenBeePresence.active) {
      this.drawQueenBeePresence(ctx, level.queenBeePresence, camX);
    }

    // 5. Enemies (Honey Beetle, Hive Grub, Hive Firefly, Honey Wisp)
    level.enemies.forEach(e => {
      const scrX = Math.round((e.x - camX) * WORLD_TO_PIXEL);
      const scrY = Math.round((e.y - camY) * WORLD_TO_PIXEL);
      const scrW = Math.round(e.width * WORLD_TO_PIXEL);
      const scrH = Math.round(e.height * WORLD_TO_PIXEL);

      if (scrX + scrW < -20 || scrX > INTERNAL_WIDTH + 20) return;

      const type = e.type || e.constructor.name;
      if (type === 'HoneyBeetle' || e.name === 'Honey Beetle') {
        pixelEnemyRenderer.drawHoneyBeetle(ctx, scrX, scrY, scrW, scrH, e);
      } else if (type === 'HiveGrub' || e.name === 'Hive Grub') {
        pixelEnemyRenderer.drawHiveGrub(ctx, scrX, scrY, scrW, scrH, e);
      } else if (type === 'HiveFirefly' || e.name === 'Hive Firefly') {
        pixelEnemyRenderer.drawHiveFirefly(ctx, scrX, scrY, scrW, scrH, e);
      } else {
        pixelEnemyRenderer.drawHoneyWisp(ctx, scrX, scrY, scrW, scrH, e);
      }
    });

    // 6. Gameplay-Important Particles (Jump dust, landing dust, hit sparks, shard glints)
    level.particles.forEach(p => {
      const scrX = Math.round((p.x - camX) * WORLD_TO_PIXEL);
      const scrY = Math.round((p.y - camY) * WORLD_TO_PIXEL);
      if (scrX > -4 && scrX < INTERNAL_WIDTH + 4 && scrY > -4 && scrY < INTERNAL_HEIGHT + 4) {
        ctx.fillStyle = p.color || '#ffffff';
        ctx.fillRect(scrX, scrY, 2, 2);
      }
    });

    // 7. Princess Aria (Small, recognizable pixel silhouette with expressive animation)
    if (player) {
      const scrX = (player.x - camX) * WORLD_TO_PIXEL;
      // Align bottom of 22px sprite to physical bottom of collider (player.y + player.height)
      const scrY = (player.y + player.height) * WORLD_TO_PIXEL - 22;
      pixelAriaRenderer.draw(ctx, scrX, scrY, player);
    }
  }

  drawRoyalShard(ctx, x, y) {
    const spin = Math.floor(this.timer * 6) % 4;
    ctx.fillStyle = P.HONEY_LIGHT;

    if (spin === 0 || spin === 2) {
      // Full diamond
      ctx.fillRect(x + 2, y, 2, 1);
      ctx.fillRect(x + 1, y + 1, 4, 2);
      ctx.fillRect(x, y + 3, 6, 2);
      ctx.fillRect(x + 1, y + 5, 4, 2);
      ctx.fillRect(x + 2, y + 7, 2, 1);
      // Inner emerald core
      ctx.fillStyle = '#10b981';
      ctx.fillRect(x + 2, y + 3, 2, 2);
    } else {
      // Narrow spinning profile
      ctx.fillRect(x + 2, y, 2, 8);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x + 2, y + 2, 2, 2);
    }
  }

  drawCheckpoint(ctx, x, y, activated) {
    // Ancient Sunstone Altar
    ctx.fillStyle = P.STONE_DARK;
    ctx.fillRect(x, y + 8, 12, 6);
    ctx.fillStyle = P.STONE_MID;
    ctx.fillRect(x + 2, y + 4, 8, 4);

    if (activated) {
      // Golden sacred flame ignited!
      const flame = Math.floor(this.timer * 8) % 2;
      ctx.fillStyle = P.HONEY_PALE;
      ctx.fillRect(x + 5, y - 2, 2, 6);
      ctx.fillStyle = P.HONEY_AMBER;
      ctx.fillRect(x + (flame === 0 ? 4 : 6), y - 4, 2, 3);
    } else {
      ctx.fillStyle = P.STONE_LIGHT;
      ctx.fillRect(x + 5, y + 2, 2, 2);
    }
  }

  drawBatboyRescue(ctx, x, y, isRescued) {
    if (!isRescued) {
      // Amber chrysalis cage
      ctx.fillStyle = P.HONEY_DARK;
      ctx.fillRect(x, y, 14, 18);
      ctx.fillStyle = P.HONEY_AMBER;
      ctx.fillRect(x + 2, y + 2, 10, 14);

      // Batboy dark silhouette inside
      ctx.fillStyle = P.BATBOY_SILHOUETTE;
      ctx.fillRect(x + 4, y + 5, 6, 8);
      ctx.fillStyle = P.BATBOY_ACCENT;
      ctx.fillRect(x + 5, y + 7, 2, 1);
    } else {
      // Batboy happily rescued!
      ctx.fillStyle = P.BATBOY_SILHOUETTE;
      ctx.fillRect(x + 3, y + 4, 8, 10); // Body & wings
      ctx.fillRect(x + 5, y, 4, 4); // Head & ears
      ctx.fillRect(x + 4, y - 2, 2, 3); // Left ear
      ctx.fillRect(x + 8, y - 2, 2, 3); // Right ear

      // Radiant cyan scarf & eyes
      ctx.fillStyle = P.BATBOY_ACCENT;
      ctx.fillRect(x + 4, y + 4, 6, 2); // Scarf
      ctx.fillRect(x + 6, y + 1, 1, 1); // Eye
      ctx.fillRect(x + 8, y + 1, 1, 1); // Eye
    }
  }

  drawQueenBeePresence(ctx, presence, camX) {
    // 1. Distant silhouette in sky (rare, ominous silhouette)
    const qScreenX = Math.round((presence.queenX - camX) * WORLD_TO_PIXEL);
    const qScreenY = Math.round(presence.queenY * WORLD_TO_PIXEL);

    if (qScreenX > -40 && qScreenX < INTERNAL_WIDTH + 40) {
      ctx.fillStyle = P.QUEEN_SILHOUETTE;
      ctx.fillRect(qScreenX, qScreenY, 18, 10);
      ctx.fillRect(qScreenX + 5, qScreenY - 4, 8, 4);
      // Wings
      const wing = Math.floor(presence.wingFlapPhase) % 2;
      ctx.fillStyle = '#475569';
      if (wing === 0) {
        ctx.fillRect(qScreenX + 3, qScreenY - 6, 12, 3);
      } else {
        ctx.fillRect(qScreenX + 1, qScreenY - 3, 16, 2);
      }
      // Glowing ruby eyes
      ctx.fillStyle = P.QUEEN_EYES;
      ctx.fillRect(qScreenX + 6, qScreenY - 2, 2, 1);
      ctx.fillRect(qScreenX + 10, qScreenY - 2, 2, 1);
    }

    // 2. Ground Shadow passing overhead
    const shScreenX = Math.round((presence.shadowX - camX) * WORLD_TO_PIXEL);
    if (shScreenX > -40 && shScreenX < INTERNAL_WIDTH + 40) {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.4)';
      ctx.fillRect(shScreenX, 196, 32, 2);
    }
  }

  // ========================================================
  // 5. MINIMAL RETRO HUD (Top 12px)
  // ========================================================
  drawHUD(gameState) {
    pixelHUD.draw(this.internalCtx, gameState);
  }
}
