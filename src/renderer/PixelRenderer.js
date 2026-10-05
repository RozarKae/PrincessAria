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
    this.internalCanvas.width = INTERNAL_WIDTH;
    this.internalCanvas.height = INTERNAL_HEIGHT;
    this.internalCtx.imageSmoothingEnabled = true;
    this.internalCtx.imageSmoothingQuality = 'high';

    // True 4K / High-DPI physical resolution pipeline:
    // Determine physical display bounding box and factor in window.devicePixelRatio
    const rect = this.canvas.parentElement ? this.canvas.parentElement.getBoundingClientRect() : this.canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2.0);
    
    // Scale canvas physical pixel buffer to match native physical pixels up to 3840x2160
    const targetWidth = Math.max(1920, Math.round((rect.width || 1920) * dpr));
    const targetHeight = Math.max(1080, Math.round((rect.height || 1080) * dpr));
    
    this.canvas.width = Math.min(3840, targetWidth);
    this.canvas.height = Math.min(2160, targetHeight);

    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';
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
    // 1. Copy internal buffer to display canvas with high-DPI scaling (up to 4K)
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';
    this.ctx.drawImage(this.internalCanvas, 0, 0, this.canvas.width, this.canvas.height);

    // 2. Subtle Cinematic Vignette around edges for depth
    const vigGrad = this.ctx.createRadialGradient(
      this.canvas.width / 2, this.canvas.height / 2, this.canvas.height * 0.5,
      this.canvas.width / 2, this.canvas.height / 2, this.canvas.width * 0.75
    );
    vigGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vigGrad.addColorStop(1, 'rgba(3, 7, 18, 0.22)');
    this.ctx.fillStyle = vigGrad;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  // ========================================================
  // 1. BACKGROUND (Sky + 1-2 Distant Forest/Hill Silhouettes)
  // ========================================================
  drawBackground(camera, level) {
    const ctx = this.internalCtx;
    const camX = camera ? camera.x : 0;
    const isWorld2 = (level && level.world === 2) || (level && level.theme && level.theme.isForest2);

    if (isWorld2) {
      // --- WORLD 2: THE WHISPERING FOREST BACKGROUND ---
      // Twilight purple night sky
      ctx.fillStyle = P.FOREST2_SKY_NIGHT;
      ctx.fillRect(0, 0, INTERNAL_WIDTH, 60);
      ctx.fillStyle = P.FOREST2_SKY_MID;
      ctx.fillRect(0, 60, INTERNAL_WIDTH, 80);
      ctx.fillStyle = P.FOREST2_SKY_LIGHT;
      ctx.fillRect(0, 140, INTERNAL_WIDTH, 100);

      // Crescent Moon in top right
      ctx.fillStyle = P.FUNGUS_SPORE_GOLD;
      ctx.fillRect(INTERNAL_WIDTH - 36, 16, 6, 8);
      ctx.fillRect(INTERNAL_WIDTH - 34, 18, 5, 4);

      // Drifting bioluminescent fireflies / spores
      for (let i = 0; i < 16; i++) {
        const fx = Math.round((i * 41 + Math.sin(this.timer * 2 + i) * 12 - (camX * 0.06)) % (INTERNAL_WIDTH + 40));
        const fy = 20 + ((i * 29) % 130) + Math.round(Math.cos(this.timer * 1.5 + i) * 6);
        const pulse = Math.floor(this.timer * 4 + i) % 2 === 0;
        ctx.fillStyle = (i % 2 === 0) ? (pulse ? P.FUNGUS_CYAN_GLOW : P.FUNGUS_CYAN_LIGHT) : (pulse ? P.FUNGUS_SPORE_GOLD : '#ffffff');
        ctx.fillRect(fx, fy, 1, 1);
      }

      // Layer 1: Distant Whispering Forest Canopy Silhouettes (Parallax: 0.15)
      const layer1Offset = (camX * 0.15) * WORLD_TO_PIXEL;
      this.drawWhisperingWoodsSilhouettes(ctx, layer1Offset);
      return;
    }

    // --- WORLD 1: Neo-Retro Sky (Multi-tone cyber-aurora horizon) ---
    ctx.fillStyle = P.SKY_DEEP;
    ctx.fillRect(0, 0, INTERNAL_WIDTH, 50);
    ctx.fillStyle = P.SKY_MID;
    ctx.fillRect(0, 50, INTERNAL_WIDTH, 60);
    ctx.fillStyle = P.SKY_LIGHT;
    ctx.fillRect(0, 110, INTERNAL_WIDTH, 45);
    ctx.fillStyle = P.SKY_HORIZON;
    ctx.fillRect(0, 155, INTERNAL_WIDTH, 85);

    // Dynamic Futuristic Clouds with subtle dual-tone shading
    const cloud1X = Math.round((240 - (camX * 0.04) + this.timer * 4) % (INTERNAL_WIDTH + 90)) - 45;
    this.drawPixelCloud(ctx, cloud1X, 26, 32);
    const cloud2X = Math.round((460 - (camX * 0.06) + this.timer * 3) % (INTERNAL_WIDTH + 90)) - 45;
    this.drawPixelCloud(ctx, cloud2X, 58, 24);

    // --- Layer 1: Distant Forest & Mountain Silhouettes (Parallax: 0.15) ---
    const layer1Offset = (camX * 0.15) * WORLD_TO_PIXEL;
    this.drawDistantHills(ctx, layer1Offset);

    // --- Section 4: Starry Void Sky & Distant Hex Spires (camX > 7500) ---
    if (camX > 7500) {
      const spireT = Math.min(1, (camX - 7500) / 500);
      ctx.save();
      ctx.globalAlpha = spireT;
      ctx.fillStyle = P.SPIRE_VOID_DEEP;
      ctx.fillRect(0, 0, INTERNAL_WIDTH, 60);
      ctx.fillStyle = P.SPIRE_VOID_MID;
      ctx.fillRect(0, 60, INTERNAL_WIDTH, 70);
      ctx.fillStyle = P.SPIRE_VOID_HORIZON;
      ctx.fillRect(0, 130, INTERNAL_WIDTH, 110);

      // Distant pixel stars
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 28; i++) {
        const sx = ((i * 37 + Math.floor(this.timer * 3)) % INTERNAL_WIDTH);
        const sy = (i * 23) % 110;
        ctx.fillRect(sx, sy, 1, 1);
        if (i % 3 === 0) {
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(sx + 1, sy, 1, 1);
          ctx.fillStyle = '#ffffff';
        }
      }

      // Distant obsidian hex spires with cyber gold accents
      ctx.fillStyle = P.SPIRE_OBSIDIAN_DARK;
      const spireOffset = (camX * 0.12) * WORLD_TO_PIXEL;
      const startSpireX = -Math.floor(spireOffset % 64);
      for (let x = startSpireX - 64; x < INTERNAL_WIDTH + 64; x += 64) {
        ctx.fillRect(x + 16, 118, 32, 122);
        ctx.fillRect(x + 24, 98, 16, 20);
        ctx.fillRect(x + 28, 88, 8, 10);
        ctx.fillStyle = P.SPIRE_HEX_GOLD;
        ctx.fillRect(x + 31, 86, 2, 4);
        ctx.fillRect(x + 24, 116, 16, 1);
        ctx.fillStyle = P.SPIRE_OBSIDIAN_DARK;
      }
      ctx.restore();
    }
  }

  drawPixelCloud(ctx, x, y, width) {
    // Upper cloud body highlight
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + 6, y, width - 12, 3);
    ctx.fillRect(x + 3, y + 3, width - 6, 4);
    ctx.fillRect(x, y + 7, width, 4);
    // Cloud underside ambient shade
    ctx.fillStyle = '#c7d2fe';
    ctx.fillRect(x + 2, y + 10, width - 4, 2);
  }

  drawDistantHills(ctx, offset) {
    const hillW = 96;
    const startX = -Math.floor(offset % hillW);

    for (let x = startX - hillW; x < INTERNAL_WIDTH + hillW; x += hillW) {
      // Deep twilight green rolling silhouettes with multi-tone depth
      this.internalCtx.fillStyle = P.FOREST_DEEP;
      this.internalCtx.fillRect(x + 10, 146, 76, 94);
      this.internalCtx.fillRect(x + 22, 136, 52, 10);
      this.internalCtx.fillRect(x + 34, 128, 28, 8);
      this.internalCtx.fillRect(x + 44, 122, 8, 6);

      // Midtone ridge layer
      this.internalCtx.fillStyle = P.FOREST_MID;
      this.internalCtx.fillRect(x + 24, 142, 48, 2);
      this.internalCtx.fillRect(x + 36, 134, 24, 2);

      // Distant pine peak silhouette with highlighted needles
      this.internalCtx.fillStyle = P.FOREST_CANOPY;
      this.internalCtx.fillRect(x + 60, 152, 4, 88);
      this.internalCtx.fillRect(x + 58, 156, 8, 4);
      this.internalCtx.fillRect(x + 56, 162, 12, 5);
      this.internalCtx.fillRect(x + 54, 169, 16, 6);
      this.internalCtx.fillStyle = P.FOREST_LIGHT;
      this.internalCtx.fillRect(x + 61, 150, 2, 3);
    }
  }

  drawWhisperingWoodsSilhouettes(ctx, offset) {
    const woodW = 112;
    const startX = -Math.floor(offset % woodW);

    for (let x = startX - woodW; x < INTERNAL_WIDTH + woodW; x += woodW) {
      // Distant ancient elder oaks & giant fungal silhouettes
      ctx.fillStyle = P.FOREST2_MOSS_DEEP;
      ctx.fillRect(x + 10, 138, 92, 102);
      ctx.fillRect(x + 24, 124, 64, 14);
      ctx.fillRect(x + 38, 114, 36, 10);

      // Mid-canopy emerald tier
      ctx.fillStyle = P.FOREST2_MOSS_MID;
      ctx.fillRect(x + 26, 128, 60, 2);

      // Giant mushroom cap silhouette in background
      ctx.fillStyle = P.FUNGUS_PURPLE_DEEP;
      ctx.fillRect(x + 52, 130, 24, 8);
      ctx.fillRect(x + 56, 124, 16, 6);
      ctx.fillStyle = P.FUNGUS_CAP_PINK;
      ctx.fillRect(x + 58, 123, 12, 1);
      ctx.fillStyle = P.FOREST2_MOSS_DEEP;
      ctx.fillRect(x + 62, 138, 4, 22);

      // Glowing bioluminescent cyan spore spots in canopy
      ctx.fillStyle = P.FUNGUS_CYAN_GLOW;
      ctx.fillRect(x + 28, 132, 2, 2);
      ctx.fillRect(x + 72, 126, 2, 2);
      ctx.fillRect(x + 86, 136, 1, 1);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x + 29, 132, 1, 1);
      ctx.fillRect(x + 73, 126, 1, 1);
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

    // Rare Authoritative Landmarks (Rare beats: ~2100px Oak, ~3900px Redwood, ~7150px Watchtower, ~8100px Gateway, ~10400px Throne)
    midgroundProps.forEach(p => {
      const scrX = Math.round((p.x - camX) * WORLD_TO_PIXEL);
      const scrY = Math.round(p.y * WORLD_TO_PIXEL);

      if (scrX < -80 || scrX > INTERNAL_WIDTH + 80) return;

      if (p.type === 'ancient_oak') {
        this.drawAncientOakLandmark(ctx, scrX, scrY);
      } else if (p.type === 'hollow_redwood') {
        this.drawRedwoodLandmark(ctx, scrX, scrY);
      } else if (p.type === 'fortress_watchtower') {
        this.drawWatchtowerLandmark(ctx, scrX, scrY);
      } else if (p.type === 'sovereign_throne' || p.type === 'sovereign_throne_landmark' || p.type === 'throne') {
        this.drawSovereignThroneLandmark(ctx, scrX, scrY);
      } else if (p.type === 'spire_gateway' || p.type === 'spire_hex_pillar_gateway') {
        this.drawSpireGatewayLandmark(ctx, scrX, scrY);
      } else if (p.type === 'hive_secret_chamber' || p.type === 'secret_chamber') {
        this.drawHiveSecretChamber(ctx, scrX, scrY);
      } else if (p.type === 'whispering_elder_oak' || p.type === 'whispering_oak') {
        this.drawWhisperingElderOakLandmark(ctx, scrX, scrY);
      } else if (p.type === 'mycelium_shrine' || p.type === 'fungal_shrine') {
        this.drawMyceliumShrineLandmark(ctx, scrX, scrY);
      } else if (p.type === 'briar_gate' || p.type === 'briar_gateway') {
        this.drawBriarGateLandmark(ctx, scrX, scrY);
      } else if (p.type === 'forest_king' || p.type === 'forest_king_shrine') {
        this.drawForestKingLandmark(ctx, scrX, scrY);
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

  drawSovereignThroneLandmark(ctx, x, y) {
    // Towering obsidian throne spire
    ctx.fillStyle = P.SPIRE_OBSIDIAN_DARK;
    ctx.fillRect(x - 24, y - 140, 48, 140);
    ctx.fillStyle = P.SPIRE_OBSIDIAN_MID;
    ctx.fillRect(x - 20, y - 130, 40, 130);

    // Crown of the Eternal Hive finial
    ctx.fillStyle = P.SPIRE_HEX_GOLD;
    ctx.fillRect(x - 12, y - 148, 24, 8);
    ctx.fillRect(x - 6, y - 154, 12, 6);
    ctx.fillRect(x - 2, y - 158, 4, 4);

    // Ruby sovereign core
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(x - 3, y - 146, 6, 4);

    // Radiant hexagonal throne vault window
    ctx.fillStyle = P.SPIRE_NECTAR_GLOW;
    ctx.fillRect(x - 10, y - 110, 20, 24);
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(x - 6, y - 104, 12, 12);

    // Cascading honey nectar lines
    ctx.fillStyle = P.HONEY_AMBER;
    ctx.fillRect(x - 2, y - 86, 4, 76);
    ctx.fillRect(x - 14, y - 60, 2, 50);
    ctx.fillRect(x + 12, y - 60, 2, 50);

    // Flanking obsidian hex pillars
    ctx.fillStyle = P.SPIRE_OBSIDIAN_LIGHT;
    ctx.fillRect(x - 36, y - 90, 10, 90);
    ctx.fillRect(x + 26, y - 90, 10, 90);

    // Stepped royal dais pedestal
    ctx.fillStyle = P.SPIRE_OBSIDIAN_DARK;
    ctx.fillRect(x - 42, y - 18, 84, 18);
    ctx.fillStyle = P.SPIRE_HEX_GOLD;
    ctx.fillRect(x - 40, y - 18, 80, 2);
  }

  drawSpireGatewayLandmark(ctx, x, y) {
    // Spire colonnade gateway
    ctx.fillStyle = P.SPIRE_OBSIDIAN_MID;
    ctx.fillRect(x - 22, y - 72, 10, 72);
    ctx.fillRect(x + 12, y - 72, 10, 72);

    // Overhead lintel arch
    ctx.fillRect(x - 26, y - 82, 52, 10);
    ctx.fillStyle = P.SPIRE_HEX_GOLD;
    ctx.fillRect(x - 26, y - 82, 52, 2);

    // Sovereign emblem
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(x - 4, y - 90, 8, 8);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(x - 2, y - 88, 4, 4);
  }

  drawHiveSecretChamber(ctx, x, y) {
    // Pavilion dome
    ctx.fillStyle = P.SPIRE_OBSIDIAN_LIGHT;
    ctx.fillRect(x - 18, y - 56, 36, 10);
    ctx.fillRect(x - 12, y - 64, 24, 8);
    ctx.fillStyle = P.SPIRE_HEX_GOLD;
    ctx.fillRect(x - 2, y - 70, 4, 6);

    // Altar pedestal
    ctx.fillStyle = P.SPIRE_OBSIDIAN_MID;
    ctx.fillRect(x - 14, y - 20, 28, 20);

    // Floating Batboy keepsake
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(x - 6, y - 36, 12, 6);
    ctx.fillRect(x - 2, y - 40, 4, 4);
  }

  drawWhisperingElderOakLandmark(ctx, x, y) {
    // Massive Ancient Gnarled Oak Trunk
    ctx.fillStyle = '#18110b';
    ctx.fillRect(x - 22, y - 110, 44, 110);
    ctx.fillStyle = '#3b2618';
    ctx.fillRect(x - 18, y - 105, 36, 105);

    // Buttress Roots Spreading
    ctx.fillStyle = '#18110b';
    ctx.fillRect(x - 34, y - 24, 68, 24);
    ctx.fillRect(x - 42, y - 10, 84, 10);

    // Whispering Face in Trunk
    ctx.fillStyle = '#18110b';
    ctx.fillRect(x - 10, y - 75, 20, 2); // brow
    ctx.fillRect(x - 8, y - 70, 4, 3); // left eye
    ctx.fillRect(x + 4, y - 70, 4, 3); // right eye
    ctx.fillStyle = P.FUNGUS_CYAN_GLOW;
    ctx.fillRect(x - 7, y - 69, 2, 2);
    ctx.fillRect(x + 5, y - 69, 2, 2);
    // Hollow whispering mouth
    ctx.fillStyle = '#0a0604';
    ctx.fillRect(x - 6, y - 60, 12, 5);

    // Hollow Base Shrine with floating wisp
    ctx.fillStyle = '#080503';
    ctx.fillRect(x - 10, y - 36, 20, 26);
    ctx.fillStyle = P.FUNGUS_CYAN_GLOW;
    ctx.fillRect(x - 4, y - 26, 8, 8);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x - 2, y - 24, 4, 4);

    // Bioluminescent Shelf Mushrooms on Trunk
    ctx.fillStyle = P.FUNGUS_CYAN_GLOW;
    ctx.fillRect(x - 26, y - 55, 10, 3);
    ctx.fillRect(x + 16, y - 48, 12, 3);
    ctx.fillRect(x - 24, y - 85, 8, 3);

    // Whispering Emerald Canopy Crown
    ctx.fillStyle = P.FOREST2_MOSS_DEEP;
    ctx.fillRect(x - 48, y - 145, 96, 45);
    ctx.fillStyle = P.FOREST2_MOSS_MID;
    ctx.fillRect(x - 42, y - 150, 84, 40);
    ctx.fillStyle = P.FOREST2_MOSS_LIGHT;
    ctx.fillRect(x - 30, y - 155, 60, 20);

    // Hanging lianas / bells
    ctx.fillStyle = P.FOREST2_MOSS_LIGHT;
    ctx.fillRect(x - 32, y - 105, 1, 15);
    ctx.fillRect(x + 32, y - 105, 1, 15);
    ctx.fillStyle = P.FUNGUS_CYAN_GLOW;
    ctx.fillRect(x - 33, y - 90, 3, 3);
    ctx.fillRect(x + 31, y - 90, 3, 3);
  }

  drawMyceliumShrineLandmark(ctx, x, y) {
    // Left Flanking Purple Mushroom
    ctx.fillStyle = P.FUNGUS_PURPLE_DEEP;
    ctx.fillRect(x - 36, y - 65, 24, 10);
    ctx.fillRect(x - 30, y - 55, 12, 55);

    // Right Flanking Magenta Mushroom
    ctx.fillStyle = P.FUNGUS_CAP_PINK;
    ctx.fillRect(x + 16, y - 60, 24, 10);
    ctx.fillStyle = '#475569';
    ctx.fillRect(x + 22, y - 50, 12, 50);

    // Central Emperor Mushroom Stem
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(x - 14, y - 80, 28, 80);
    // Gills
    ctx.fillStyle = P.FUNGUS_CYAN_GLOW;
    ctx.fillRect(x - 38, y - 88, 76, 8);
    // Emperor Cyan Cap
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(x - 44, y - 110, 88, 24);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(x - 38, y - 116, 76, 16);
    // White glowing spots
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x - 24, y - 110, 8, 6);
    ctx.fillRect(x + 16, y - 110, 8, 6);
    ctx.fillRect(x - 4, y - 114, 8, 7);

    // Ancient Stone Druidic Altar Base
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(x - 22, y - 24, 44, 24);
    ctx.fillStyle = '#334155';
    ctx.fillRect(x - 26, y - 28, 52, 6);
    // Glowing Cyan Rune
    ctx.fillStyle = P.FUNGUS_CYAN_GLOW;
    ctx.fillRect(x - 6, y - 18, 12, 10);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x - 2, y - 14, 4, 3);
  }

  drawBriarGateLandmark(ctx, x, y) {
    // Left Twisted Briar Post
    ctx.fillStyle = P.THORN_BRAMBLE_DARK;
    ctx.fillRect(x - 30, y - 90, 14, 90);
    ctx.fillStyle = P.THORN_BRAMBLE_PURPLE;
    ctx.fillRect(x - 27, y - 85, 8, 85);

    // Right Twisted Briar Post
    ctx.fillStyle = P.THORN_BRAMBLE_DARK;
    ctx.fillRect(x + 16, y - 90, 14, 90);
    ctx.fillStyle = P.THORN_BRAMBLE_PURPLE;
    ctx.fillRect(x + 19, y - 85, 8, 85);

    // Overhead Briar Lintel Arch
    ctx.fillStyle = P.THORN_BRAMBLE_DARK;
    ctx.fillRect(x - 36, y - 105, 72, 16);
    ctx.fillStyle = P.THORN_BRAMBLE_PURPLE;
    ctx.fillRect(x - 32, y - 102, 64, 10);

    // Vicious Crimson Thorns
    ctx.fillStyle = P.THORN_SPIKE;
    ctx.fillRect(x - 40, y - 108, 6, 6);
    ctx.fillRect(x + 34, y - 108, 6, 6);
    ctx.fillRect(x - 3, y - 116, 6, 12);
    ctx.fillRect(x - 36, y - 60, 6, 4);
    ctx.fillRect(x + 30, y - 60, 6, 4);

    // Central Glowing Briar Eye
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(x - 5, y - 98, 10, 8);
    ctx.fillStyle = '#fde047';
    ctx.fillRect(x - 2, y - 95, 4, 3);
  }

  drawForestKingLandmark(ctx, x, y) {
    // Massive Sentinel Ancient Oak Trunk
    ctx.fillStyle = P.FOREST_KING_BARK_DARK;
    ctx.fillRect(x - 28, y - 120, 56, 120);
    ctx.fillStyle = P.FOREST_KING_BARK_MID;
    ctx.fillRect(x - 22, y - 115, 44, 115);

    // Buttress Roots
    ctx.fillStyle = P.FOREST_KING_BARK_DARK;
    ctx.fillRect(x - 44, y - 30, 88, 30);

    // Ancient Carved Face
    ctx.fillStyle = '#0c0704';
    ctx.fillRect(x - 14, y - 85, 28, 4); // brow
    ctx.fillRect(x - 12, y - 78, 6, 5); // left eye
    ctx.fillRect(x + 6, y - 78, 6, 5);  // right eye

    // Eye glow (Purple if corrupted, emerald if freed)
    ctx.fillStyle = P.FOREST_KING_CORRUPT_PURPLE;
    ctx.fillRect(x - 10, y - 76, 3, 3);
    ctx.fillRect(x + 8, y - 76, 3, 3);

    // Ancient Mouth
    ctx.fillStyle = '#0a0604';
    ctx.fillRect(x - 8, y - 62, 16, 6);

    // Antler-like Crown Branches
    ctx.fillStyle = P.FOREST_KING_BARK_MID;
    ctx.fillRect(x - 34, y - 138, 12, 20);
    ctx.fillRect(x + 22, y - 138, 12, 20);
    ctx.fillRect(x - 26, y - 148, 8, 12);
    ctx.fillRect(x + 18, y - 148, 8, 12);

    // Corrupted Root Node Weakpoints
    ctx.fillStyle = P.FOREST_KING_CORRUPT_PURPLE;
    ctx.fillRect(x - 38, y - 80, 10, 10);
    ctx.fillRect(x + 28, y - 80, 10, 10);
    ctx.fillRect(x - 6, y - 132, 12, 12);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x - 35, y - 77, 4, 4);
    ctx.fillRect(x + 31, y - 77, 4, 4);
    ctx.fillRect(x - 2, y - 128, 4, 4);
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
      } else if (plat.type === 'bouncy_mushroom' || plat.type === 'mushroom') {
        this.renderPixelBouncyMushroom(ctx, scrX, scrY, scrW, scrH);
      } else if (plat.type === 'mossy_bark' || plat.type === 'hollow_bark') {
        this.renderPixelMossyBark(ctx, scrX, scrY, scrW, scrH);
      } else if (plat.type === 'thorn_bramble' || plat.type === 'bramble') {
        this.renderPixelThornBramble(ctx, scrX, scrY, scrW, scrH);
      } else if (plat.type === 'bridge' || plat.type === 'rope_bridge') {
        this.renderPixelBridge(ctx, scrX, scrY, scrW, scrH);
      } else if (plat.type === 'honey' || plat.type === 'moving_honey') {
        this.renderPixelHoneyPlatform(ctx, scrX, scrY, scrW, scrH);
      } else if (plat.type === 'hex_platform' || plat.type === 'moving_hex' || plat.type === 'obsidian') {
        this.renderPixelHexPlatform(ctx, scrX, scrY, scrW, scrH);
      } else if (plat.type === 'honey_geyser' || plat.type === 'geyser') {
        this.renderPixelHoneyGeyser(ctx, scrX, scrY, scrW, scrH);
      } else if (plat.type === 'sticky_amber') {
        this.renderPixelStickyAmber(ctx, scrX, scrY, scrW, scrH);
      } else if (plat.type === 'stone' || plat.type === 'moving_runestone') {
        this.renderPixelStonePlatform(ctx, scrX, scrY, scrW, scrH);
      } else if (plat.type === 'crumble_block' || plat.type === 'crumble' || plat.type === 'crumble_bark') {
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
      } else if (mp.type === 'moving_hex' || mp.type === 'hex_platform') {
        this.renderPixelHexPlatform(ctx, scrX, scrY, scrW, scrH, true);
      } else {
        this.renderPixelHoneyPlatform(ctx, scrX, scrY, scrW, scrH, true);
      }
    });
  }

  /**
   * Continuous Meadow Ground with high-contrast walkable top, sub-pixel grass glints, multi-tier loam, and embedded minerals.
   */
  renderPixelGround(ctx, x, y, w, h) {
    // 1. Walkable Grass Cap (3-tier hi-bit gradient)
    ctx.fillStyle = P.GRASS_HIGHLIGHT;
    ctx.fillRect(x, y, w, 1);
    ctx.fillStyle = P.GRASS_TOP;
    ctx.fillRect(x, y + 1, w, 2);
    ctx.fillStyle = P.GRASS_EDGE;
    ctx.fillRect(x, y + 3, w, 1);

    // Micro grass blade glints and teeth
    for (let px = x; px < x + w; px += 3) {
      const bladeH = ((px + y) % 6 === 0) ? 2 : 1;
      ctx.fillStyle = P.GRASS_HIGHLIGHT;
      ctx.fillRect(px, y, 1, 1);
      ctx.fillStyle = P.GRASS_EDGE;
      ctx.fillRect(px, y + 3, 2, bladeH);
    }

    // 2. Earth Subsurface Loam (Warm loam -> Dark loam -> Bedrock)
    ctx.fillStyle = P.GROUND_WARM;
    ctx.fillRect(x, y + 4, w, Math.min(h - 4, 12));

    ctx.fillStyle = P.GROUND_DARK;
    ctx.fillRect(x, y + 16, w, Math.max(0, h - 16));

    if (h > 36) {
      ctx.fillStyle = P.GROUND_BEDROCK;
      ctx.fillRect(x, y + 36, w, h - 36);
    }

    // 3. Sub-surface mineral flecks & root tendrils
    for (let py = y + 6; py < y + h; py += 10) {
      const rowOffset = ((py - y) / 10) % 2 === 0 ? 0 : 7;
      for (let px = x + rowOffset; px < x + w; px += 14) {
        if (py < y + 32) {
          // Warm amber soil bricking
          ctx.fillStyle = P.GROUND_LIGHT;
          ctx.fillRect(px, py, 4, 2);
          ctx.fillStyle = P.GROUND_ROOTS;
          ctx.fillRect(px + 4, py + 1, 2, 3);
        } else {
          // Deep bedrock slate crystals
          ctx.fillStyle = P.GROUND_DARK;
          ctx.fillRect(px, py, 6, 2);
          ctx.fillStyle = P.STONE_LIGHT;
          ctx.fillRect(px + 2, py + 1, 2, 1);
        }
      }
    }
  }

  /**
   * World 2 Bouncy Bioluminescent Fungal Mushroom Platform with glowing neon rim and refractive spores.
   */
  renderPixelBouncyMushroom(ctx, x, y, w, h) {
    // 1. Elastic Stipe / Stem with textured fiber ribs
    const stemW = Math.max(10, Math.floor(w * 0.35));
    const stemX = x + Math.floor((w - stemW) / 2);
    ctx.fillStyle = '#334155';
    ctx.fillRect(stemX, y + 4, stemW, h - 4);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(stemX + 1, y + 5, stemW - 2, h - 5);
    ctx.fillStyle = '#64748b';
    ctx.fillRect(stemX + 2, y + 6, 2, h - 7); // Stem specular rib

    // 2. Bioluminescent Dome Cap with multi-tier cyan glow
    ctx.fillStyle = '#075985';
    ctx.fillRect(x, y + 4, w, 5);
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(x + 1, y + 2, w - 2, 6);
    ctx.fillStyle = '#0ea5e9';
    ctx.fillRect(x + 3, y + 1, w - 6, 4);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(x + 5, y, w - 10, 2);
    ctx.fillStyle = '#bae6fd';
    ctx.fillRect(x + 7, y, w - 14, 1); // Specular top glint

    // Glowing Spore Spots with cyan bloom cores
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + Math.floor(w * 0.22), y + 2, 3, 2);
    ctx.fillRect(x + Math.floor(w * 0.5), y + 1, 4, 2);
    ctx.fillRect(x + Math.floor(w * 0.76), y + 2, 3, 2);

    ctx.fillStyle = P.FUNGUS_CYAN_GLOW;
    ctx.fillRect(x + Math.floor(w * 0.22) - 1, y + 3, 1, 1);
    ctx.fillRect(x + Math.floor(w * 0.5) + 4, y + 2, 1, 1);
    ctx.fillRect(x + Math.floor(w * 0.76) + 3, y + 3, 1, 1);

    // Gills Underside Rim (Radiant cyan bioluminescence)
    ctx.fillStyle = '#7dd3fc';
    ctx.fillRect(x + 1, y + 7, w - 2, 1);
    ctx.fillStyle = P.FUNGUS_CYAN_GLOW;
    ctx.fillRect(x + 2, y + 8, w - 4, 1);
  }

  /**
   * World 2 Mossy Bark Platform with gnarled ancient wood and vibrant emerald moss cushion.
   */
  renderPixelMossyBark(ctx, x, y, w, h) {
    // 1. Ancient Gnarled Bark Core
    ctx.fillStyle = '#18110b';
    ctx.fillRect(x, y + 2, w, h - 2);
    ctx.fillStyle = '#3b2618';
    ctx.fillRect(x + 1, y + 3, w - 2, h - 4);
    ctx.fillStyle = '#52341e';
    ctx.fillRect(x + 2, y + 5, w - 4, 2);

    // 2. Emerald Moss Cushion Top (3-tone shading)
    ctx.fillStyle = P.FOREST2_MOSS_LIGHT;
    ctx.fillRect(x + 1, y, w - 2, 1);
    ctx.fillStyle = P.FOREST2_MOSS_MID;
    ctx.fillRect(x, y + 1, w, 2);
    ctx.fillStyle = P.FOREST2_MOSS_DEEP;
    ctx.fillRect(x, y + 3, w, 1);

    // Micro hanging moss fringes
    for (let tx = x + 3; tx < x + w - 3; tx += 6) {
      ctx.fillStyle = P.FOREST2_MOSS_MID;
      ctx.fillRect(tx, y + 3, 2, 2);
      ctx.fillStyle = P.FUNGUS_CYAN_GLOW;
      ctx.fillRect(tx + 1, y + 4, 1, 1); // Micro luminescent spore
    }
  }

  /**
   * World 2 Thorn Bramble Hazard with wicked obsidian bark and luminous crimson venom spikes.
   */
  renderPixelThornBramble(ctx, x, y, w, h) {
    // 1. Dark Purple Tangled Bramble Base
    ctx.fillStyle = P.THORN_BRAMBLE_DARK;
    ctx.fillRect(x, y + 3, w, h - 3);
    ctx.fillStyle = P.THORN_BRAMBLE_PURPLE;
    ctx.fillRect(x + 1, y + 4, w - 2, h - 5);
    ctx.fillStyle = '#7e22ce';
    ctx.fillRect(x + 2, y + 5, w - 4, 2);

    // 2. Wicked Sharp Crimson Thorn Spikes with glowing tip highlights
    for (let sx = x + 2; sx < x + w - 2; sx += 6) {
      ctx.fillStyle = P.THORN_SPIKE;
      ctx.fillRect(sx, y + 2, 4, 2);
      ctx.fillRect(sx + 1, y, 2, 4);
      // Glowing venom tip
      ctx.fillStyle = '#fca5a5';
      ctx.fillRect(sx + 1, y, 1, 1);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(sx + 2, y + 1, 1, 2);
    }
  }

  /**
   * Elevated Wood Platform with bevel highlights and rustic bark grain.
   */
  renderPixelWoodPlatform(ctx, x, y, w, h) {
    // Grass/moss top with specular glint
    ctx.fillStyle = P.GRASS_HIGHLIGHT;
    ctx.fillRect(x, y, w, 1);
    ctx.fillStyle = P.GRASS_TOP;
    ctx.fillRect(x, y + 1, w, 2);

    // Wood core with rich golden-brown grain
    ctx.fillStyle = P.GROUND_WARM;
    ctx.fillRect(x + 1, y + 3, w - 2, h - 4);
    ctx.fillStyle = P.GROUND_LIGHT;
    ctx.fillRect(x + 2, y + 4, w - 4, 1);

    // Bark rim
    ctx.fillStyle = P.GROUND_DARK;
    ctx.fillRect(x, y + h - 1, w, 1);
    ctx.fillRect(x, y + 1, 1, h - 1);
    ctx.fillRect(x + w - 1, y + 1, 1, h - 1);
  }

  /**
   * Elevated Stone / Fortress Platform with carved beveled masonry and runic inlays.
   */
  renderPixelStonePlatform(ctx, x, y, w, h, isMoving = false) {
    // Slate cap specular glint
    ctx.fillStyle = P.STONE_HIGHLIGHT;
    ctx.fillRect(x + 1, y, w - 2, 1);
    ctx.fillStyle = P.STONE_LIGHT;
    ctx.fillRect(x, y + 1, w, 2);

    // Stone body with carved block seams
    ctx.fillStyle = P.STONE_MID;
    ctx.fillRect(x + 1, y + 3, w - 2, h - 4);

    // Vertical mortar joints
    ctx.fillStyle = P.STONE_DARK;
    for (let jx = x + 16; jx < x + w - 8; jx += 24) {
      ctx.fillRect(jx, y + 3, 1, h - 4);
    }

    // Shadow base bevel
    ctx.fillRect(x, y + h - 1, w, 1);
    ctx.fillRect(x, y + 1, 1, h - 1);
    ctx.fillRect(x + w - 1, y + 1, 1, h - 1);

    // Moving glyph indicator with pulsing golden-cyan rune
    if (isMoving) {
      const runeGlow = Math.floor(this.timer * 6) % 2 === 0;
      ctx.fillStyle = runeGlow ? '#38bdf8' : P.HONEY_AMBER;
      ctx.fillRect(x + Math.floor(w / 2) - 4, y + 2, 8, 3);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x + Math.floor(w / 2) - 1, y + 3, 2, 1);
    }
  }

  /**
   * Bouncy Honey Raft Platform with translucent amber body and honey drop caustics.
   */
  renderPixelHoneyPlatform(ctx, x, y, w, h, isMoving = false) {
    // Radiant honey sheen top (specular liquid glass)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + 2, y, w - 4, 1);
    ctx.fillStyle = P.HONEY_PALE;
    ctx.fillRect(x, y + 1, w, 2);
    ctx.fillStyle = P.HONEY_LIGHT;
    ctx.fillRect(x, y + 3, w, 2);

    // Translucent amber body
    ctx.fillStyle = P.HONEY_AMBER;
    ctx.fillRect(x, y + 5, w, Math.max(1, h - 6));

    // Deep honey drop bottom with caustics
    ctx.fillStyle = P.HONEY_DARK;
    ctx.fillRect(x, y + h - 1, w, 1);
    for (let px = x + 4; px < x + w - 4; px += 7) {
      ctx.fillStyle = P.HONEY_AMBER;
      ctx.fillRect(px, y + h, 3, 2);
      ctx.fillStyle = P.HONEY_PALE;
      ctx.fillRect(px + 1, y + h + 1, 1, 1);
    }

    if (isMoving) {
      // Golden honey vortex center
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x + Math.floor(w / 2) - 2, y + 2, 4, 2);
    }
  }

  /**
   * Crumbling Viaduct Stone Block with structural fracture fissures.
   */
  renderPixelCrumblePlatform(ctx, x, y, w, h) {
    ctx.fillStyle = P.STONE_HIGHLIGHT;
    ctx.fillRect(x + 1, y, w - 2, 1);
    ctx.fillStyle = P.STONE_LIGHT;
    ctx.fillRect(x, y + 1, w, 2);
    ctx.fillStyle = P.STONE_MID;
    ctx.fillRect(x, y + 3, w, h - 4);
    ctx.fillStyle = P.STONE_DARK;
    ctx.fillRect(x, y + h - 1, w, 1);

    // Visible structural cracks and crumbling dust
    ctx.fillStyle = '#090d16';
    ctx.fillRect(x + Math.floor(w * 0.3), y + 2, 1, 4);
    ctx.fillRect(x + Math.floor(w * 0.3) + 1, y + 5, 2, 1);
    ctx.fillRect(x + Math.floor(w * 0.7), y + 3, 2, 1);
    ctx.fillRect(x + Math.floor(w * 0.7) + 1, y + 4, 1, 4);
    ctx.fillStyle = '#f87171'; // Stress fracture glow
    ctx.fillRect(x + Math.floor(w * 0.3) + 1, y + 3, 1, 1);
  }

  /**
   * Suspended Rope & Wooden Plank Bridge.
   */
  renderPixelBridge(ctx, x, y, w, h) {
    // Upper guide rope with braided highlight
    ctx.fillStyle = P.HONEY_DARK;
    ctx.fillRect(x, y, w, 1);
    ctx.fillStyle = P.HONEY_PALE;
    for (let rx = x; rx < x + w; rx += 4) {
      ctx.fillRect(rx, y, 2, 1);
    }

    // Wooden planks (spaced with 2px gaps)
    for (let px = x + 2; px < x + w - 2; px += 6) {
      ctx.fillStyle = P.GROUND_LIGHT;
      ctx.fillRect(px, y + 2, 4, 1); // Plank highlight
      ctx.fillStyle = P.GROUND_WARM;
      ctx.fillRect(px, y + 3, 4, h - 3);
      ctx.fillStyle = P.GROUND_DARK;
      ctx.fillRect(px, y + h - 1, 4, 1);
    }
  }

  /**
   * Climbable Hanging Vine with lush leaf clusters.
   */
  renderPixelVine(ctx, x, y, w, h) {
    const vx = x + Math.floor(w / 2) - 1;
    // Central vine stem
    ctx.fillStyle = P.FOREST_DEEP;
    ctx.fillRect(vx, y, 2, h);
    ctx.fillStyle = P.FOREST_CANOPY;
    ctx.fillRect(vx, y, 1, h);

    // Alternating ivy leaves with bright highlights
    for (let py = y + 4; py < y + h - 4; py += 7) {
      const side = ((py - y) / 7) % 2 === 0 ? -3 : 2;
      ctx.fillStyle = P.FOREST_MID;
      ctx.fillRect(vx + side, py, 3, 3);
      ctx.fillStyle = P.FOREST_LIGHT;
      ctx.fillRect(vx + side + 1, py, 1, 1);
    }
  }

  /**
   * Clear Red Danger Spikes / Hazards with razor highlights.
   */
  renderPixelHazard(ctx, x, y, w, h) {
    ctx.fillStyle = P.HAZARD_BASE;
    ctx.fillRect(x, y + h - 2, w, 2);

    // Triangular pixel spikes with metallic glint
    for (let px = x; px < x + w - 4; px += 6) {
      ctx.fillStyle = P.HAZARD_SPIKE;
      ctx.fillRect(px, y + h - 5, 5, 3);
      ctx.fillRect(px + 1, y + h - 8, 3, 3);
      ctx.fillStyle = P.HAZARD_TIP;
      ctx.fillRect(px + 2, y + h - 10, 1, 2);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(px + 2, y + h - 10, 1, 1); // Razor glint
    }
  }

  /**
   * Section 4 Obsidian & Gold Hexagonal Platform with neon cyber-lines.
   */
  renderPixelHexPlatform(ctx, x, y, w, h, isMoving = false) {
    // Top golden honey vein cap with specular edge
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + 4, y, w - 8, 1);
    ctx.fillStyle = P.SPIRE_HEX_GOLD;
    ctx.fillRect(x, y + 1, w, 1);
    ctx.fillStyle = P.HONEY_PALE;
    ctx.fillRect(x + 2, y + 2, w - 4, 1);

    // Deep bioluminescent obsidian body
    ctx.fillStyle = P.SPIRE_OBSIDIAN_MID;
    ctx.fillRect(x, y + 3, w, h - 4);
    ctx.fillStyle = P.SPIRE_OBSIDIAN_DARK;
    ctx.fillRect(x, y + h - 1, w, 1);

    // Stepped hexagonal bevel edges
    ctx.fillRect(x, y + 1, 1, 3);
    ctx.fillRect(x + w - 1, y + 1, 1, 3);

    // Embedded glowing golden hex cells with cyan core nodes
    for (let px = x + 8; px < x + w - 8; px += 14) {
      ctx.fillStyle = P.SPIRE_HEX_GOLD;
      ctx.fillRect(px, y + 4, 4, 3);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(px + 1, y + 5, 2, 1);
    }

    if (isMoving) {
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(x + Math.floor(w / 2) - 3, y + 2, 6, 3);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x + Math.floor(w / 2) - 1, y + 3, 2, 1);
    }
  }

  /**
   * Section 4 Vertical Honey Updraft Geyser with animated starlight streams.
   */
  renderPixelHoneyGeyser(ctx, x, y, w, h) {
    // Vent crucible obsidian base
    ctx.fillStyle = P.SPIRE_OBSIDIAN_MID;
    ctx.fillRect(x, y + h - 5, w, 5);
    ctx.fillStyle = P.SPIRE_HEX_GOLD;
    ctx.fillRect(x + 2, y + h - 5, w - 4, 1);

    // Golden boiling nectar basin
    ctx.fillStyle = P.HONEY_PALE;
    ctx.fillRect(x + 4, y + h - 4, w - 8, 2);

    // Upward rushing wind & amber stream motes (animated)
    const animOffset = Math.floor(this.timer * 24) % 8;
    for (let py = y + h - 6; py > y - 28; py -= 7) {
      const stepY = py - animOffset;
      if (stepY > y - 30 && stepY < y + h - 4) {
        ctx.fillStyle = P.SPIRE_GEYSER_STREAM;
        ctx.fillRect(x + 4 + ((stepY * 3) % (w - 10)), stepY, 2, 4);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x + 5 + ((stepY * 3) % (w - 10)), stepY, 1, 2);
      }
    }
  }

  /**
   * Section 4 Sticky Amber Viscous Nectar Platform.
   */
  renderPixelStickyAmber(ctx, x, y, w, h) {
    // Top amber surface with specular glaze
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + 3, y, w - 6, 1);
    ctx.fillStyle = P.HONEY_LIGHT;
    ctx.fillRect(x, y + 1, w, 2);
    ctx.fillStyle = P.HONEY_AMBER;
    ctx.fillRect(x, y + 3, w, 2);

    // Viscous dark amber body
    ctx.fillStyle = '#78350f';
    ctx.fillRect(x, y + 5, w, h - 5);

    // Thick hanging honey drops with drip highlights
    for (let px = x + 3; px < x + w - 3; px += 7) {
      ctx.fillStyle = P.HONEY_AMBER;
      ctx.fillRect(px, y + h, 3, 3);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(px + 1, y + h + 1, 1, 1);
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

    // 2. Goal & Batboy / Ancient Portal
    if (level.goal) {
      const scrX = Math.round((level.goal.x - camX) * WORLD_TO_PIXEL);
      const scrY = Math.round((level.goal.y + level.goal.height - 20 - camY) * WORLD_TO_PIXEL);
      if (scrX > -40 && scrX < INTERNAL_WIDTH + 40) {
        if (level.goal.type === 'portal') {
          this.drawAncientPortal(ctx, scrX, scrY);
        } else {
          this.drawBatboyRescue(ctx, scrX, scrY, level.batboy?.isRescued);
        }
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
      } else if (type === 'ShadowSquirrel' || e.name === 'Shadow Squirrel' || type === 'shadow_squirrel') {
        pixelEnemyRenderer.drawShadowSquirrel(ctx, scrX, scrY, scrW, scrH, e);
      } else if (type === 'ThornGoblin' || e.name === 'Thorn Goblin' || type === 'thorn_goblin') {
        pixelEnemyRenderer.drawThornGoblin(ctx, scrX, scrY, scrW, scrH, e);
      } else if (type === 'VineCrawler' || e.name === 'Vine Crawler' || type === 'vine_crawler') {
        pixelEnemyRenderer.drawVineCrawler(ctx, scrX, scrY, scrW, scrH, e);
      } else if (type === 'SporeBomber' || e.name === 'Spore Bomber' || type === 'spore_bomber') {
        pixelEnemyRenderer.drawSporeBomber(ctx, scrX, scrY, scrW, scrH, e);
      } else if (type === 'ForestKing' || e.name === 'Forest King' || type === 'forest_king') {
        pixelEnemyRenderer.drawForestKing(ctx, scrX, scrY, scrW, scrH, e);
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

      // 8. Double Jump Celestial Flutter Rings (beneath Aria's boots)
      if (player.doubleJumpParticles && player.doubleJumpParticles.length > 0) {
        this.drawDoubleJumpRings(ctx, camX, camY, player.doubleJumpParticles);
      }

      // 9. Royal Starbeam Projectiles (Ranged Power)
      if (player.projectiles && player.projectiles.length > 0) {
        this.drawStarProjectiles(ctx, camX, camY, player.projectiles);
      }
    }
  }

  /**
   * Render mid-air Double Jump celestial starlight flutter rings beneath Aria's boots.
   */
  drawDoubleJumpRings(ctx, camX, camY, rings) {
    rings.forEach(ring => {
      const rx = Math.round((ring.x - camX) * WORLD_TO_PIXEL);
      const ry = Math.round((ring.y - camY) * WORLD_TO_PIXEL);
      if (rx < -10 || rx > INTERNAL_WIDTH + 10 || ry < -10 || ry > INTERNAL_HEIGHT + 10) return;

      const progress = Math.min(1.0, ring.timer / 0.28);
      const expand = Math.floor(progress * 6);

      // Starlight color modulation: pure white glint -> radiant gold -> celestial cyan
      ctx.fillStyle = progress < 0.35 ? '#ffffff' : (progress < 0.7 ? '#fef08a' : '#38bdf8');

      // 4-point expanding starlight flutter ring (1985 NES pixel art)
      ctx.fillRect(rx - 3 - expand, ry, 2, 1);
      ctx.fillRect(rx + 2 + expand, ry, 2, 1);
      ctx.fillRect(rx - 1, ry - expand, 3, 1);
      ctx.fillRect(rx - 1, ry + expand, 3, 1);

      // Diagonal sparkle dots
      if (expand >= 2) {
        ctx.fillStyle = '#67e8f9';
        ctx.fillRect(rx - expand, ry - expand + 1, 1, 1);
        ctx.fillRect(rx + expand, ry - expand + 1, 1, 1);
        ctx.fillRect(rx - expand, ry + expand - 1, 1, 1);
        ctx.fillRect(rx + expand, ry + expand - 1, 1, 1);
      }
    });
  }

  /**
   * Render Royal Starbeam projectiles in authentic 1985 NES pixel art style.
   */
  drawStarProjectiles(ctx, camX, camY, projectiles) {
    projectiles.forEach(proj => {
      if (proj.isDead) return;

      // 1. Draw Stardust Trail Particles
      if (proj.particles) {
        proj.particles.forEach(p => {
          const px = Math.round((p.x - camX) * WORLD_TO_PIXEL);
          const py = Math.round(p.y * WORLD_TO_PIXEL);
          if (px >= -2 && px < INTERNAL_WIDTH + 2 && py >= -2 && py < INTERNAL_HEIGHT + 2) {
            ctx.fillStyle = p.color || '#38bdf8';
            ctx.fillRect(px, py, p.size > 2 ? 2 : 1, p.size > 2 ? 2 : 1);
          }
        });
      }

      // 2. Draw Radiant Rotating Star Crystal
      const cx = Math.round((proj.x + proj.width * 0.5 - camX) * WORLD_TO_PIXEL);
      const cy = Math.round((proj.y + proj.height * 0.5 - camY) * WORLD_TO_PIXEL);

      if (cx < -10 || cx > INTERNAL_WIDTH + 10 || cy < -10 || cy > INTERNAL_HEIGHT + 10) return;

      if (proj.isDeflected) {
        // Tumbling deflected ricochet spark
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(cx - 2, cy - 2, 4, 4);
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(cx - 1, cy - 1, 2, 2);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(cx, cy, 1, 1);
        return;
      }

      // 4-phase rotating celestial diamond star
      const phase = Math.floor(Math.abs(proj.rotation) * 3.5) % 4;

      if (phase === 0 || phase === 2) {
        // Orthogonal Cross Phase (0 deg / 90 deg)
        // Outer radiant cyan points
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(cx - 3, cy, 7, 1);
        ctx.fillRect(cx, cy - 3, 1, 7);

        // Gold crystal mid-ring
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(cx - 1, cy - 1, 3, 3);

        // Pure white core glint
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(cx, cy, 1, 1);
        ctx.fillRect(cx - 1, cy, 3, 1);
        ctx.fillRect(cx, cy - 1, 1, 3);
      } else {
        // Diagonal Star Phase (45 deg / 135 deg)
        // Outer cyan points
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(cx - 2, cy - 2, 1, 1);
        ctx.fillRect(cx + 2, cy - 2, 1, 1);
        ctx.fillRect(cx - 2, cy + 2, 1, 1);
        ctx.fillRect(cx + 2, cy + 2, 1, 1);

        // Gold inner diamond
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(cx - 1, cy, 3, 1);
        ctx.fillRect(cx, cy - 1, 1, 3);

        // Pure white center
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(cx, cy, 1, 1);
      }
    });
  }

  drawRoyalShard(ctx, x, y) {
    const spin = Math.floor(this.timer * 7) % 4;
    // Outer starlight halo
    ctx.fillStyle = 'rgba(254, 240, 138, 0.4)';
    ctx.fillRect(x - 1, y + 1, 8, 6);
    ctx.fillRect(x + 1, y - 1, 4, 10);

    if (spin === 0 || spin === 2) {
      // Full faceted crystal diamond
      ctx.fillStyle = P.HONEY_PALE;
      ctx.fillRect(x + 2, y, 2, 1);
      ctx.fillStyle = P.HONEY_LIGHT;
      ctx.fillRect(x + 1, y + 1, 4, 2);
      ctx.fillStyle = P.HONEY_AMBER;
      ctx.fillRect(x, y + 3, 6, 2);
      ctx.fillRect(x + 1, y + 5, 4, 2);
      ctx.fillStyle = P.HONEY_DARK;
      ctx.fillRect(x + 2, y + 7, 2, 1);

      // Inner celestial emerald core
      ctx.fillStyle = '#34d399';
      ctx.fillRect(x + 2, y + 3, 2, 2);
      // Pure white specular glint
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x + 2, y + 1, 1, 2);
    } else {
      // Narrow spinning facet profile
      ctx.fillStyle = P.HONEY_PALE;
      ctx.fillRect(x + 2, y, 2, 8);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x + 2, y + 2, 2, 3);
      ctx.fillStyle = '#10b981';
      ctx.fillRect(x + 2, y + 5, 2, 2);
    }
  }

  drawCheckpoint(ctx, x, y, activated) {
    // Ancient Sunstone Altar Base with beveled granite & runes
    ctx.fillStyle = P.STONE_DARK;
    ctx.fillRect(x - 1, y + 8, 14, 6);
    ctx.fillStyle = P.STONE_MID;
    ctx.fillRect(x + 1, y + 4, 10, 4);
    ctx.fillStyle = P.STONE_LIGHT;
    ctx.fillRect(x + 2, y + 3, 8, 1);

    if (activated) {
      // Golden sacred flame ignited with multi-tier celestial fire bloom!
      const flame = Math.floor(this.timer * 9) % 3;
      // Flame aura
      ctx.fillStyle = 'rgba(251, 191, 36, 0.35)';
      ctx.fillRect(x + 2, y - 5, 8, 8);

      // Outer amber fire
      ctx.fillStyle = P.HONEY_AMBER;
      ctx.fillRect(x + 3, y - 2, 6, 5);

      // Mid bright gold flame
      ctx.fillStyle = P.HONEY_PALE;
      const offsetX = flame === 0 ? 0 : (flame === 1 ? -1 : 1);
      ctx.fillRect(x + 4 + offsetX, y - 4, 4, 4);

      // Core white heat
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x + 5, y - 5, 2, 3);
      ctx.fillRect(x + 5, y - 2, 2, 2);
    } else {
      ctx.fillStyle = P.STONE_LIGHT;
      ctx.fillRect(x + 4, y + 2, 4, 2);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(x + 5, y + 2, 2, 1); // Dormant blue ember
    }
  }

  drawBatboyRescue(ctx, x, y, isRescued) {
    if (!isRescued) {
      // Amber chrysalis cage with glowing honey caustics
      ctx.fillStyle = P.HONEY_DARK;
      ctx.fillRect(x, y, 14, 18);
      ctx.fillStyle = P.HONEY_AMBER;
      ctx.fillRect(x + 1, y + 1, 12, 16);
      ctx.fillStyle = P.HONEY_PALE;
      ctx.fillRect(x + 2, y + 2, 3, 14); // Left specular rim

      // Batboy dark silhouette inside
      ctx.fillStyle = P.BATBOY_SILHOUETTE;
      ctx.fillRect(x + 4, y + 5, 6, 8);
      ctx.fillStyle = P.BATBOY_ACCENT;
      ctx.fillRect(x + 5, y + 7, 2, 1);
    } else {
      // Batboy happily rescued with flutter wings!
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
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x + 6, y + 1, 1, 1);
    }
  }

  drawAncientPortal(ctx, x, y) {
    const pulse = Math.floor(this.timer * 6) % 3;
    // Ancient weathered stone monolith archway with runes
    ctx.fillStyle = P.STONE_DARK;
    ctx.fillRect(x - 6, y - 14, 6, 32);
    ctx.fillRect(x + 16, y - 14, 6, 32);
    ctx.fillRect(x - 6, y - 20, 28, 6);
    ctx.fillStyle = P.STONE_MID;
    ctx.fillRect(x - 4, y - 18, 24, 3);
    ctx.fillRect(x - 4, y - 12, 3, 28);
    ctx.fillRect(x + 17, y - 12, 3, 28);
    ctx.fillStyle = P.STONE_HIGHLIGHT;
    ctx.fillRect(x - 4, y - 19, 24, 1);

    // Swirling astral vortex with multi-spectrum galactic glow
    ctx.fillStyle = pulse === 0 ? '#38bdf8' : (pulse === 1 ? '#818cf8' : '#c084fc');
    ctx.fillRect(x, y - 14, 16, 30);
    ctx.fillStyle = pulse === 0 ? '#818cf8' : (pulse === 1 ? '#c084fc' : '#38bdf8');
    ctx.fillRect(x + 2, y - 12, 12, 26);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + 5 + pulse, y - 8 + pulse * 2, 4, 10);
    ctx.fillRect(x + 7, y - 2, 2, 4);

    // Whispering glyph runes & stars
    ctx.fillStyle = '#fde047';
    ctx.fillRect(x - 3, y - 10, 2, 2);
    ctx.fillRect(x + 17, y - 10, 2, 2);
    ctx.fillRect(x + 6, y - 18, 4, 2);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x - 2, y - 9, 1, 1);
    ctx.fillRect(x + 18, y - 9, 1, 1);
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
  drawHUD(gameState, player = null) {
    pixelHUD.draw(this.internalCtx, gameState, player);
  }
}
