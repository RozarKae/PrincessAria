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
    // Enhanced 320x240 widescreen hi-bit raster grid
    this.internalCanvas.width = INTERNAL_WIDTH;
    this.internalCanvas.height = INTERNAL_HEIGHT;
    this.internalCtx.imageSmoothingEnabled = false;

    // Set display canvas buffer to match internal resolution directly!
    // The browser's CSS scaling handles widescreen scaling cleanly with image-rendering: pixelated.
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
    // 1. Copy internal hi-bit buffer to display canvas with crisp pixel integrity
    this.ctx.imageSmoothingEnabled = false;
    this.ctx.drawImage(this.internalCanvas, 0, 0);

    // 2. Futuristic Neo-Pixel Post-Processing:
    // A. Subtle Ultra-Fine Neo Scanlines (alternating 1px horizontal lines at 4% opacity)
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    for (let y = 0; y < INTERNAL_HEIGHT; y += 2) {
      this.ctx.fillRect(0, y, INTERNAL_WIDTH, 1);
    }

    // B. Subtle Cybernetic Vignette around edges (gives that premium arcade monitor depth)
    const vigGrad = this.ctx.createRadialGradient(
      INTERNAL_WIDTH / 2, INTERNAL_HEIGHT / 2, INTERNAL_HEIGHT * 0.45,
      INTERNAL_WIDTH / 2, INTERNAL_HEIGHT / 2, INTERNAL_WIDTH * 0.65
    );
    vigGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vigGrad.addColorStop(1, 'rgba(3, 7, 18, 0.28)');
    this.ctx.fillStyle = vigGrad;
    this.ctx.fillRect(0, 0, INTERNAL_WIDTH, INTERNAL_HEIGHT);
  }

  // ========================================================
  // 1. BACKGROUND (Sky + 1-2 Distant Forest/Hill Silhouettes)
  // ========================================================
  drawBackground(camera, level) {
    const ctx = this.internalCtx;
    const camX = camera ? camera.x : 0;
    const isWorld4 = (level && level.world === 4) || (level && level.theme && level.theme.isVolcano4);
    const isWorld3 = (level && level.world === 3) || (level && level.theme && level.theme.isCastle3);
    const isWorld2 = (level && level.world === 2) || (level && level.theme && level.theme.isForest2);

    if (isWorld4) {
      // --- WORLD 4: THE VOLCANO OF HOT HONEY BACKGROUND ---
      // Erupting Caldera Sky (Deep crimson smoke to glowing incandescent magma horizon)
      ctx.fillStyle = P.VOLCANO_SKY_DEEP;
      ctx.fillRect(0, 0, INTERNAL_WIDTH, 50);
      ctx.fillStyle = P.VOLCANO_SKY_MID;
      ctx.fillRect(0, 50, INTERNAL_WIDTH, 60);
      ctx.fillStyle = P.VOLCANO_SKY_GLOW;
      ctx.fillRect(0, 110, INTERNAL_WIDTH, 65);
      ctx.fillStyle = P.VOLCANO_SKY_HAZE;
      ctx.fillRect(0, 175, INTERNAL_WIDTH, 65);

      // Billowing volcanic ash smoke clouds
      ctx.fillStyle = P.VOLCANO_ASH_CLOUD;
      for (let i = 0; i < 6; i++) {
        const cx = Math.round((i * 64 + Math.sin(this.timer * 0.8 + i) * 12 - (camX * 0.04)) % (INTERNAL_WIDTH + 80)) - 40;
        const cy = 20 + (i * 12) % 60;
        ctx.fillRect(cx, cy, 54, 20);
        ctx.fillRect(cx + 6, cy - 6, 42, 8);
      }

      // Rising hot embers & spark particles
      for (let i = 0; i < 28; i++) {
        const ex = Math.round((i * 29 + Math.sin(this.timer * 3 + i) * 8 - (camX * 0.08)) % (INTERNAL_WIDTH + 20));
        const ey = ((INTERNAL_HEIGHT - Math.floor(this.timer * 40 + i * 27)) % INTERNAL_HEIGHT + INTERNAL_HEIGHT) % INTERNAL_HEIGHT;
        const pulse = (Math.floor(this.timer * 8 + i) % 2 === 0);
        ctx.fillStyle = (i % 3 === 0) ? '#ffffff' : (pulse ? P.VOLCANO_EMBER_YELLOW : P.VOLCANO_EMBER_ORANGE);
        ctx.fillRect(ex, ey, 1, 1);
        if (i % 5 === 0) {
          ctx.fillRect(ex, ey + 1, 1, 1);
        }
      }

      // Layer 1: Distant Jagged Caldera Basalt Ridges (Parallax: 0.15)
      const layer1Offset = (camX * 0.15) * WORLD_TO_PIXEL;
      this.drawVolcanoSilhouettes(ctx, layer1Offset);
      return;
    }

    if (isWorld3) {
      // --- WORLD 3: THE CASTLE OF A THOUSAND DOORS BACKGROUND ---
      // Midnight Gothic Sky
      ctx.fillStyle = P.CASTLE_SKY_MIDNIGHT;
      ctx.fillRect(0, 0, INTERNAL_WIDTH, 60);
      ctx.fillStyle = P.CASTLE_SKY_DEEP;
      ctx.fillRect(0, 60, INTERNAL_WIDTH, 70);
      ctx.fillStyle = P.CASTLE_SKY_VIOLET;
      ctx.fillRect(0, 130, INTERNAL_WIDTH, 60);
      ctx.fillStyle = P.CASTLE_SKY_MIST;
      ctx.fillRect(0, 190, INTERNAL_WIDTH, 50);

      // Distant pixel stars & constellations
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 32; i++) {
        const sx = ((i * 31 + Math.floor(this.timer * 2)) % INTERNAL_WIDTH);
        const sy = (i * 17) % 120;
        ctx.fillRect(sx, sy, 1, 1);
        if (i % 4 === 0) {
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(sx + 1, sy, 1, 1);
          ctx.fillStyle = '#ffffff';
        }
      }

      // Floating mystical embers / portal motes
      for (let i = 0; i < 18; i++) {
        const fx = Math.round((i * 47 + Math.sin(this.timer * 2 + i) * 10 - (camX * 0.05)) % (INTERNAL_WIDTH + 40));
        const fy = 40 + ((i * 23) % 140) + Math.round(Math.cos(this.timer * 1.8 + i) * 8);
        const pulse = Math.floor(this.timer * 5 + i) % 2 === 0;
        ctx.fillStyle = (i % 2 === 0) ? (pulse ? P.DOOR_PORTAL_CYAN : P.DOOR_PORTAL_MAGENTA) : (pulse ? P.STAINED_GLASS_AMBER : '#ffffff');
        ctx.fillRect(fx, fy, 1, 1);
      }

      // Layer 1: Distant Castle Spires & Gothic Turrets (Parallax: 0.15)
      const layer1Offset = (camX * 0.15) * WORLD_TO_PIXEL;
      this.drawCastleSpiresSilhouettes(ctx, layer1Offset);
      return;
    }

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

  drawCastleSpiresSilhouettes(ctx, offset) {
    const spireW = 128;
    const startX = -Math.floor(offset % spireW);

    for (let x = startX - spireW; x < INTERNAL_WIDTH + spireW; x += spireW) {
      // Midnight Gothic Bastion Spires
      ctx.fillStyle = P.CASTLE_STONE_DARK;
      // Main central keep tower
      ctx.fillRect(x + 14, 120, 42, 120);
      ctx.fillRect(x + 10, 112, 50, 10);
      // Crenellations
      ctx.fillRect(x + 10, 104, 8, 8);
      ctx.fillRect(x + 24, 104, 8, 8);
      ctx.fillRect(x + 38, 104, 8, 8);
      ctx.fillRect(x + 52, 104, 8, 8);

      // Conical Spire Roof
      ctx.fillRect(x + 20, 80, 30, 24);
      ctx.fillRect(x + 26, 64, 18, 16);
      ctx.fillRect(x + 31, 52, 8, 12);
      ctx.fillRect(x + 33, 44, 4, 8);

      // Flanking Turret Spire (Left)
      ctx.fillRect(x - 14, 140, 24, 100);
      ctx.fillRect(x - 18, 134, 32, 8);
      ctx.fillRect(x - 12, 118, 20, 16);
      ctx.fillRect(x - 7, 106, 10, 12);
      ctx.fillRect(x - 4, 98, 4, 8);

      // Stained Glass Arch Windows (Glowing cyan, rose, and amber)
      ctx.fillStyle = P.STAINED_GLASS_BLUE;
      ctx.fillRect(x + 28, 130, 6, 12);
      ctx.fillRect(x + 29, 128, 4, 2);
      ctx.fillStyle = P.STAINED_GLASS_ROSE;
      ctx.fillRect(x - 6, 146, 5, 10);
      ctx.fillStyle = P.STAINED_GLASS_AMBER;
      ctx.fillRect(x + 44, 148, 5, 10);

      // Iron wall torches
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(x + 16, 154, 2, 2);
      ctx.fillRect(x + 52, 154, 2, 2);
    }
  }

  drawVolcanoSilhouettes(ctx, offset) {
    const ridgeW = 140;
    const startX = -Math.floor(offset % ridgeW);

    for (let x = startX - ridgeW; x < INTERNAL_WIDTH + ridgeW; x += ridgeW) {
      // Jagged Basalt Caldera Ridge & Erupting Peaks
      ctx.fillStyle = P.BASALT_DARK;
      // Main Caldera Peak
      ctx.fillRect(x + 18, 120, 64, 120);
      ctx.fillRect(x + 28, 96, 44, 24);
      ctx.fillRect(x + 36, 76, 28, 20);
      ctx.fillRect(x + 42, 60, 16, 16);

      // Flanking jagged crater ridges
      ctx.fillRect(x - 20, 140, 44, 100);
      ctx.fillRect(x - 12, 124, 28, 16);
      ctx.fillRect(x + 76, 134, 48, 106);
      ctx.fillRect(x + 84, 116, 32, 18);

      // Caldera Crater Vent Glow
      ctx.fillStyle = P.LAVA_HONEY_DEEP;
      ctx.fillRect(x + 42, 60, 16, 4);
      ctx.fillStyle = P.LAVA_HONEY_SURFACE;
      ctx.fillRect(x + 44, 62, 12, 2);
      ctx.fillStyle = P.LAVA_HONEY_CORE;
      ctx.fillRect(x + 47, 62, 6, 1);

      // Flowing Molten Honey Cascade Veins Down Mountain Ridge
      ctx.fillStyle = P.LAVA_HONEY_MAGMA;
      ctx.fillRect(x + 48, 64, 4, 30);
      ctx.fillRect(x + 50, 94, 6, 40);
      ctx.fillRect(x + 52, 134, 8, 60);

      // Incandescent Vein Core
      ctx.fillStyle = P.LAVA_HONEY_BRIGHT;
      ctx.fillRect(x + 49, 66, 2, 26);
      ctx.fillRect(x + 52, 96, 2, 36);
      ctx.fillRect(x + 55, 136, 3, 50);

      // Distant chimney smoke plume
      ctx.fillStyle = P.VOLCANO_ASH_CLOUD;
      ctx.fillRect(x + 44, 48, 12, 10);
      ctx.fillRect(x + 40, 36, 20, 12);
      ctx.fillRect(x + 36, 22, 28, 14);
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
      } else if (p.type === 'castle_clocktower') {
        this.drawCastleClocktowerLandmark(ctx, scrX, scrY);
      } else if (p.type === 'rose_stained_glass') {
        this.drawRoseStainedGlassLandmark(ctx, scrX, scrY);
      } else if (p.type === 'castle_catapult_spire') {
        this.drawCatapultSpireLandmark(ctx, scrX, scrY);
      } else if (p.type === 'gateway_bastion') {
        this.drawGatewayBastionLandmark(ctx, scrX, scrY);
      } else if (p.type === 'caldera_peak' || p.type === 'volcano_caldera') {
        this.drawCalderaPeakLandmark(ctx, scrX, scrY);
      } else if (p.type === 'geyser_spire' || p.type === 'boiling_geyser') {
        this.drawGeyserSpireLandmark(ctx, scrX, scrY);
      } else if (p.type === 'dragon_tooth_spire' || p.type === 'dragon_tooth') {
        this.drawDragonToothLandmark(ctx, scrX, scrY);
      } else if (p.type === 'dragon_throne' || p.type === 'wyrm_throne') {
        this.drawDragonThroneLandmark(ctx, scrX, scrY);
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

  drawCastleClocktowerLandmark(ctx, x, y) {
    // Grand Gothic Clocktower
    ctx.fillStyle = P.CASTLE_STONE_DARK;
    ctx.fillRect(x - 20, y - 140, 40, 140);
    ctx.fillStyle = P.CASTLE_STONE_MID;
    ctx.fillRect(x - 16, y - 130, 32, 130);

    // Spire Roof
    ctx.fillStyle = P.CASTLE_STONE_DARK;
    ctx.fillRect(x - 14, y - 156, 28, 16);
    ctx.fillRect(x - 8, y - 170, 16, 14);
    ctx.fillRect(x - 3, y - 180, 6, 10);
    // Golden Weathervane
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(x - 1, y - 188, 2, 8);
    ctx.fillRect(x - 5, y - 186, 10, 2);

    // Circular Glowing Clock Face
    ctx.fillStyle = '#fde047';
    ctx.fillRect(x - 10, y - 116, 20, 20);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x - 8, y - 114, 16, 16);
    // Clock Hands
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(x - 1, y - 108, 2, 6);
    ctx.fillRect(x - 1, y - 108, 5, 2);

    // Flanking Buttresses & Stained Glass Slits
    ctx.fillStyle = P.STAINED_GLASS_BLUE;
    ctx.fillRect(x - 8, y - 80, 4, 14);
    ctx.fillRect(x + 4, y - 80, 4, 14);
    ctx.fillRect(x - 8, y - 50, 4, 14);
    ctx.fillRect(x + 4, y - 50, 4, 14);
  }

  drawRoseStainedGlassLandmark(ctx, x, y) {
    // Gothic Catacomb Wall & Rose Window
    ctx.fillStyle = P.CASTLE_STONE_DARK;
    ctx.fillRect(x - 36, y - 130, 72, 130);
    ctx.fillStyle = P.CASTLE_STONE_MID;
    ctx.fillRect(x - 30, y - 120, 60, 120);

    // Colossal Rose Window Outer Rim
    ctx.fillStyle = P.CASTLE_STONE_DARK;
    ctx.fillRect(x - 24, y - 110, 48, 48);

    // Vibrant Jewel Panes (Rotating hues)
    ctx.fillStyle = P.STAINED_GLASS_BLUE;
    ctx.fillRect(x - 20, y - 106, 18, 18);
    ctx.fillStyle = P.STAINED_GLASS_ROSE;
    ctx.fillRect(x + 2, y - 106, 18, 18);
    ctx.fillStyle = P.STAINED_GLASS_AMBER;
    ctx.fillRect(x - 20, y - 86, 18, 18);
    ctx.fillStyle = P.STAINED_GLASS_PURPLE;
    ctx.fillRect(x + 2, y - 86, 18, 18);

    // Central Rosette Core
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x - 4, y - 90, 8, 8);
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(x - 2, y - 88, 4, 4);

    // Velvet wall tapestries flanking window
    ctx.fillStyle = P.CASTLE_VELVET_CRIMSON;
    ctx.fillRect(x - 28, y - 60, 12, 50);
    ctx.fillRect(x + 16, y - 60, 12, 50);
    ctx.fillStyle = P.CASTLE_VELVET_GOLD;
    ctx.fillRect(x - 28, y - 12, 12, 2);
    ctx.fillRect(x + 16, y - 12, 12, 2);
  }

  drawCatapultSpireLandmark(ctx, x, y) {
    // High Battlement Spire
    ctx.fillStyle = P.CASTLE_STONE_DARK;
    ctx.fillRect(x - 28, y - 110, 56, 110);
    ctx.fillStyle = P.CASTLE_STONE_MID;
    ctx.fillRect(x - 24, y - 105, 48, 105);

    // Crenellations
    ctx.fillStyle = P.CASTLE_STONE_DARK;
    ctx.fillRect(x - 28, y - 118, 8, 8);
    ctx.fillRect(x - 12, y - 118, 8, 8);
    ctx.fillRect(x + 4, y - 118, 8, 8);
    ctx.fillRect(x + 20, y - 118, 8, 8);

    // Heavy Timber Catapult on Battlement
    ctx.fillStyle = '#451a03';
    ctx.fillRect(x - 14, y - 132, 28, 6);
    ctx.fillRect(x - 4, y - 146, 6, 14); // Arm
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(x - 8, y - 150, 12, 6); // Sling cup

    // Wall Torch Braziers with flame
    ctx.fillStyle = '#f97316';
    ctx.fillRect(x - 22, y - 80, 4, 4);
    ctx.fillRect(x + 18, y - 80, 4, 4);
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(x - 21, y - 82, 2, 2);
    ctx.fillRect(x + 19, y - 82, 2, 2);
  }

  drawGatewayBastionLandmark(ctx, x, y) {
    // Massive Colonnade Gatehouse
    ctx.fillStyle = P.CASTLE_STONE_DARK;
    ctx.fillRect(x - 45, y - 140, 90, 140);
    ctx.fillStyle = P.CASTLE_STONE_MID;
    ctx.fillRect(x - 40, y - 130, 80, 130);

    // 3 Grand Gothic Arches
    ctx.fillStyle = '#05070e';
    ctx.fillRect(x - 34, y - 70, 18, 70); // Left arch
    ctx.fillRect(x - 12, y - 90, 24, 90); // Center grand arch
    ctx.fillRect(x + 16, y - 70, 18, 70); // Right arch

    // Portcullis Grate
    ctx.fillStyle = '#475569';
    for (let r = y - 86; r < y; r += 8) {
      ctx.fillRect(x - 10, r, 20, 2);
    }
    for (let c = x - 8; c < x + 10; c += 6) {
      ctx.fillRect(c, y - 88, 2, 88);
    }

    // Golden Northern Star Crest above Grand Arch
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(x - 6, y - 110, 12, 12);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x - 2, y - 106, 4, 4);
  }

  drawCalderaPeakLandmark(ctx, x, y) {
    // Stepped Volcanic Caldera Peak
    ctx.fillStyle = P.BASALT_DARK;
    ctx.fillRect(x - 30, y - 120, 60, 120);
    ctx.fillStyle = P.BASALT_MID;
    ctx.fillRect(x - 24, y - 110, 48, 110);

    // Glowing Lava Crevasses & Crater
    ctx.fillStyle = P.LAVA_HONEY_MAGMA;
    ctx.fillRect(x - 16, y - 130, 32, 20);
    ctx.fillStyle = P.LAVA_HONEY_BRIGHT;
    ctx.fillRect(x - 10, y - 128, 20, 8);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x - 6, y - 126, 12, 4);

    // Volcanic ash plume
    ctx.fillStyle = P.VOLCANO_ASH_CLOUD;
    ctx.fillRect(x - 14, y - 150, 28, 20);
    ctx.fillRect(x - 20, y - 170, 40, 20);

    // Flowing molten honey veins down crater
    ctx.fillStyle = P.LAVA_HONEY_SURFACE;
    ctx.fillRect(x - 4, y - 110, 8, 50);
    ctx.fillRect(x - 2, y - 60, 4, 40);
    ctx.fillStyle = P.LAVA_HONEY_BRIGHT;
    ctx.fillRect(x - 2, y - 110, 4, 30);
  }

  drawGeyserSpireLandmark(ctx, x, y) {
    // Chimney Spire
    ctx.fillStyle = P.BASALT_DARK;
    ctx.fillRect(x - 22, y - 100, 44, 100);
    ctx.fillStyle = P.BASALT_MID;
    ctx.fillRect(x - 18, y - 90, 36, 90);

    // Erupting Molten Honey Geyser Plume
    const pulse = Math.floor(this.timer * 8) % 2;
    ctx.fillStyle = P.LAVA_HONEY_MAGMA;
    ctx.fillRect(x - 12, y - 140, 24, 45);
    ctx.fillStyle = P.LAVA_HONEY_BRIGHT;
    ctx.fillRect(x - 8, y - 155, 16, 55);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x - 4, y - 165 - (pulse ? 4 : 0), 8, 60);

    // Magma geyser basin
    ctx.fillStyle = P.LAVA_HONEY_SURFACE;
    ctx.fillRect(x - 14, y - 95, 28, 8);
  }

  drawDragonToothLandmark(ctx, x, y) {
    // Fanged Monolithic Obsidian Pinnacle
    ctx.fillStyle = P.BASALT_DARK;
    ctx.fillRect(x - 16, y - 140, 32, 140);
    ctx.fillRect(x - 12, y - 160, 24, 20);
    ctx.fillRect(x - 6, y - 180, 12, 20);
    ctx.fillRect(x - 2, y - 195, 4, 15);

    // Ancient Draconic Runic Veins
    ctx.fillStyle = P.LAVA_HONEY_BRIGHT;
    ctx.fillRect(x - 4, y - 130, 8, 4);
    ctx.fillRect(x - 4, y - 100, 8, 4);
    ctx.fillRect(x - 4, y - 70, 8, 4);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x - 2, y - 128, 4, 2);
    ctx.fillRect(x - 2, y - 98, 4, 2);
  }

  drawDragonThroneLandmark(ctx, x, y) {
    // The Great Molten Wyrm Dais
    ctx.fillStyle = P.BASALT_DARK;
    ctx.fillRect(x - 40, y - 130, 80, 130);
    ctx.fillStyle = P.BASALT_MID;
    ctx.fillRect(x - 34, y - 120, 68, 120);

    // Twin Flanking Horn Pillars
    ctx.fillStyle = P.BASALT_DARK;
    ctx.fillRect(x - 42, y - 160, 12, 40);
    ctx.fillRect(x + 30, y - 160, 12, 40);
    ctx.fillRect(x - 46, y - 175, 8, 15);
    ctx.fillRect(x + 38, y - 175, 8, 15);

    // Golden Dragon Crest & Magma Basin
    ctx.fillStyle = P.DRAGON_SCALE_GOLD;
    ctx.fillRect(x - 12, y - 90, 24, 24);
    ctx.fillStyle = P.LAVA_HONEY_BRIGHT;
    ctx.fillRect(x - 8, y - 86, 16, 16);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x - 4, y - 82, 8, 8);

    // Molten Honey Lava Altar
    ctx.fillStyle = P.LAVA_HONEY_MAGMA;
    ctx.fillRect(x - 24, y - 30, 48, 20);
    ctx.fillStyle = P.LAVA_HONEY_BRIGHT;
    ctx.fillRect(x - 20, y - 26, 40, 12);
  }

  // ========================================================
  // 3. PLATFORMS (Disciplined Small Vocabulary)
  // ========================================================
  drawPlatforms(camera, platforms = [], movingPlatforms = [], level = null) {
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
      } else if (plat.type === 'basalt_ground') {
        this.renderPixelBasaltGround(ctx, scrX, scrY, scrW, scrH);
      } else if (plat.type === 'basalt_platform') {
        this.renderPixelBasaltPlatform(ctx, scrX, scrY, scrW, scrH);
      } else if (plat.type === 'molten_honey' || plat.type === 'lava') {
        this.renderPixelMoltenHoney(ctx, scrX, scrY, scrW, scrH);
      } else if (plat.type === 'thermal_updraft' || plat.type === 'updraft') {
        this.renderPixelThermalUpdraft(ctx, scrX, scrY, scrW, scrH);
      } else if (plat.type === 'bouncy_amber_magma' || plat.type === 'bouncy_magma') {
        this.renderPixelBouncyAmberMagma(ctx, scrX, scrY, scrW, scrH);
      } else if (plat.type === 'crumble_ash') {
        if (!plat.isBroken) {
          const shakeX = plat.isShaking ? (Math.random() < 0.5 ? -1 : 1) : 0;
          this.renderPixelCrumbleAsh(ctx, scrX + shakeX, scrY, scrW, scrH);
        }
      } else if (plat.type === 'castle_ground') {
        this.renderPixelCastleGround(ctx, scrX, scrY, scrW, scrH);
      } else if (plat.type === 'bouncy_mushroom' || plat.type === 'mushroom') {
        this.renderPixelBouncyMushroom(ctx, scrX, scrY, scrW, scrH);
      } else if (plat.type === 'bouncy_crest') {
        this.renderPixelBouncyCrest(ctx, scrX, scrY, scrW, scrH);
      } else if (plat.type === 'mossy_bark' || plat.type === 'hollow_bark') {
        this.renderPixelMossyBark(ctx, scrX, scrY, scrW, scrH);
      } else if (plat.type === 'thorn_bramble' || plat.type === 'bramble') {
        this.renderPixelThornBramble(ctx, scrX, scrY, scrW, scrH);
      } else if (plat.type === 'bridge' || plat.type === 'rope_bridge') {
        this.renderPixelBridge(ctx, scrX, scrY, scrW, scrH);
      } else if (plat.type === 'royal_carpet') {
        this.renderPixelRoyalCarpet(ctx, scrX, scrY, scrW, scrH);
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
      } else if (plat.type === 'castle_stone') {
        this.renderPixelCastleStonePlatform(ctx, scrX, scrY, scrW, scrH);
      } else if (plat.type === 'crumble_block' || plat.type === 'crumble' || plat.type === 'crumble_bark' || plat.type === 'crumble_stone') {
        if (!plat.isBroken) {
          const shakeX = plat.isShaking ? (Math.random() < 0.5 ? -1 : 1) : 0;
          if (plat.type === 'crumble_stone') {
            this.renderPixelCrumbleStone(ctx, scrX + shakeX, scrY, scrW, scrH);
          } else {
            this.renderPixelCrumblePlatform(ctx, scrX + shakeX, scrY, scrW, scrH);
          }
        }
      } else if (plat.type === 'spoon_bridge') {
        this.renderPixelSpoonBridge(ctx, scrX, scrY, scrW, scrH, plat.tilt || 0);
      } else if (plat.type === 'snapping_flower') {
        this.renderPixelSnappingFlower(ctx, scrX, scrY, scrW, scrH, plat.openFactor ?? 1.0, plat.isSnapping);
      } else if (plat.type === 'bastion_portcullis') {
        this.renderPixelBastionPortcullis(ctx, scrX, scrY, scrW, scrH, level?.portcullisUnlocked);
      } else if (plat.type === 'crest_door') {
        this.renderPixelCrestDoor(ctx, scrX, scrY, scrW, scrH, plat.crest);
      } else if (plat.type === 'vine' || plat.type === 'climbable_vine') {
        this.renderPixelVine(ctx, scrX, scrY, scrW, scrH);
      } else if (plat.type === 'climbable_chain' || plat.type === 'chain') {
        this.renderPixelChain(ctx, scrX, scrY, scrW, scrH);
      } else if (plat.type === 'hazard' || plat.type === 'spikes') {
        this.renderPixelHazard(ctx, scrX, scrY, scrW, scrH);
      } else if (plat.type === 'iron_spikes' || plat.type === 'castle_hazard') {
        this.renderPixelIronSpikes(ctx, scrX, scrY, scrW, scrH);
      } else {
        // Standard elevated wood platform
        this.renderPixelWoodPlatform(ctx, scrX, scrY, scrW, scrH);
      }
    });

    // Draw Shifting Dimensional Portal Doors (World 3)
    if (level && level.portalDoors) {
      level.portalDoors.forEach(door => {
        const scrX = Math.round((door.x - camX) * WORLD_TO_PIXEL);
        const scrY = Math.round((door.y - camY) * WORLD_TO_PIXEL);
        const scrW = Math.round(door.width * WORLD_TO_PIXEL);
        const scrH = Math.round(door.height * WORLD_TO_PIXEL);
        if (scrX + scrW < -10 || scrX > INTERNAL_WIDTH + 10) return;
        this.renderPixelPortalDoor(ctx, scrX, scrY, scrW, scrH);
      });
    }

    // Draw Honey Bumble Arena Canyon Honeycomb Pillars (World 1)
    if (level && level.honeyBumble && level.honeyBumble.pillars) {
      level.honeyBumble.pillars.forEach(pillar => {
        const scrX = Math.round((pillar.x - camX) * WORLD_TO_PIXEL);
        const scrY = Math.round((pillar.y - camY) * WORLD_TO_PIXEL);
        const scrW = Math.round(pillar.width * WORLD_TO_PIXEL);
        const scrH = Math.round(pillar.height * WORLD_TO_PIXEL);
        if (scrX + scrW < -10 || scrX > INTERNAL_WIDTH + 10) return;
        this.renderPixelHoneycombPillar(ctx, scrX, scrY, scrW, scrH, pillar.shattered);
      });
    }

    // Draw Sleeping Spore Puffballs (World 2)
    if (level && level.sporePuffballs) {
      level.sporePuffballs.forEach(puff => {
        const scrX = Math.round((puff.x - camX) * WORLD_TO_PIXEL);
        const scrY = Math.round((puff.y - camY) * WORLD_TO_PIXEL);
        if (scrX < -20 || scrX > INTERNAL_WIDTH + 20) return;
        this.renderPixelSporePuffball(ctx, scrX, scrY, puff.isEmitting);
      });
    }

    // Draw Mimic Trees (World 2)
    if (level && level.mimicTrees) {
      level.mimicTrees.forEach(mimic => {
        const scrX = Math.round((mimic.x - camX) * WORLD_TO_PIXEL);
        const scrY = Math.round((mimic.y - camY) * WORLD_TO_PIXEL);
        if (scrX < -30 || scrX > INTERNAL_WIDTH + 30) return;
        this.renderPixelMimicTree(ctx, scrX, scrY, mimic.isAwake);
      });
    }

    // Draw Khan's Torn Cloak Story Clue (World 1)
    if (level && level.world === 1 && !level.khanCloakDiscovered) {
      const scrX = Math.round((4260 - camX) * WORLD_TO_PIXEL);
      const scrY = Math.round((680 - camY) * WORLD_TO_PIXEL);
      if (scrX >= -10 && scrX <= INTERNAL_WIDTH + 10) {
        this.renderPixelKhanCloakClue(ctx, scrX, scrY);
      }
    }

    // Draw Sir Slam-A-Lot Arena Destructible Pillars (World 3)
    if (level && level.sirSlamALot && level.sirSlamALot.pillars) {
      level.sirSlamALot.pillars.forEach(pillar => {
        const scrX = Math.round((pillar.x - camX) * WORLD_TO_PIXEL);
        const scrY = Math.round((pillar.y - camY) * WORLD_TO_PIXEL);
        const scrW = Math.round(pillar.width * WORLD_TO_PIXEL);
        const scrH = Math.round(pillar.height * WORLD_TO_PIXEL);
        if (scrX + scrW < -10 || scrX > INTERNAL_WIDTH + 10) return;
        this.renderPixelCrestPillar(ctx, scrX, scrY, scrW, scrH, pillar.shattered);
      });
    }

    // Draw Honey Dragon Arena Destructible Basalt Pillars (World 4)
    if (level && level.honeyDragon && level.honeyDragon.pillars) {
      level.honeyDragon.pillars.forEach(pillar => {
        const scrX = Math.round((pillar.x - camX) * WORLD_TO_PIXEL);
        const scrY = Math.round((pillar.y - camY) * WORLD_TO_PIXEL);
        const scrW = Math.round(pillar.width * WORLD_TO_PIXEL);
        const scrH = Math.round(pillar.height * WORLD_TO_PIXEL);
        if (scrX + scrW < -10 || scrX > INTERNAL_WIDTH + 10) return;
        this.renderPixelBasaltPillar(ctx, scrX, scrY, scrW, scrH, pillar.shattered);
      });
    }

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
      } else if (mp.type === 'moving_basalt' || mp.type === 'basalt_platform') {
        this.renderPixelBasaltPlatform(ctx, scrX, scrY, scrW, scrH, true);
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

  /**
   * World 3 Castle Flagstone Ground with polished ashlar masonry and sub-surface stone foundation.
   */
  renderPixelCastleGround(ctx, x, y, w, h) {
    // 1. Walkable Slate & Granite Flagstone Rim (Specular highlight -> trim -> mortar)
    ctx.fillStyle = P.CASTLE_FLAGSTONE_TRIM;
    ctx.fillRect(x, y, w, 1);
    ctx.fillStyle = P.CASTLE_STONE_HIGHLIGHT;
    ctx.fillRect(x, y + 1, w, 1);
    ctx.fillStyle = P.CASTLE_STONE_MID;
    ctx.fillRect(x, y + 2, w, 2);
    ctx.fillStyle = P.CASTLE_STONE_DARK;
    ctx.fillRect(x, y + 4, w, 1);

    // Flagstone tile joint grooves
    for (let px = x; px < x + w; px += 16) {
      ctx.fillStyle = P.CASTLE_STONE_DARK;
      ctx.fillRect(px, y, 1, 4);
      ctx.fillStyle = P.CASTLE_FLAGSTONE_TRIM;
      ctx.fillRect(px + 1, y, 1, 1);
    }

    // 2. Heavy Stone Foundation (Upper masonry -> Bedrock slate)
    ctx.fillStyle = P.CASTLE_STONE_MID;
    ctx.fillRect(x, y + 5, w, Math.min(h - 5, 14));

    ctx.fillStyle = P.CASTLE_STONE_DARK;
    ctx.fillRect(x, y + 19, w, Math.max(0, h - 19));

    // Mortar joint brick pattern
    for (let py = y + 7; py < y + h; py += 8) {
      const rowOffset = ((py - y) / 8) % 2 === 0 ? 0 : 8;
      ctx.fillStyle = P.CASTLE_STONE_MORTAR;
      ctx.fillRect(x, py, w, 1); // Horizontal mortar
      for (let px = x + rowOffset; px < x + w; px += 16) {
        ctx.fillRect(px, py, 1, 8); // Vertical mortar joint
        // Micro stone highlight in brick
        ctx.fillStyle = P.CASTLE_STONE_LIGHT;
        ctx.fillRect(px + 2, py + 2, 4, 1);
        ctx.fillStyle = P.CASTLE_STONE_MORTAR;
      }
    }
  }

  /**
   * World 3 Elevated Gothic Stone Fortress Platform.
   */
  renderPixelCastleStonePlatform(ctx, x, y, w, h) {
    // Polished slate cap specular glint
    ctx.fillStyle = P.CASTLE_FLAGSTONE_TRIM;
    ctx.fillRect(x + 1, y, w - 2, 1);
    ctx.fillStyle = P.CASTLE_STONE_HIGHLIGHT;
    ctx.fillRect(x, y + 1, w, 1);
    ctx.fillStyle = P.CASTLE_STONE_LIGHT;
    ctx.fillRect(x, y + 2, w, 2);

    // Stone body
    ctx.fillStyle = P.CASTLE_STONE_MID;
    ctx.fillRect(x + 1, y + 4, w - 2, h - 5);
    ctx.fillStyle = P.CASTLE_STONE_DARK;
    ctx.fillRect(x, y + h - 1, w, 1);
    ctx.fillRect(x, y + 2, 1, h - 2);
    ctx.fillRect(x + w - 1, y + 2, 1, h - 2);

    // Vertical carved masonry grooves
    for (let jx = x + 12; jx < x + w - 6; jx += 16) {
      ctx.fillStyle = P.CASTLE_STONE_DARK;
      ctx.fillRect(jx, y + 4, 1, h - 5);
      ctx.fillStyle = P.CASTLE_STONE_LIGHT;
      ctx.fillRect(jx + 1, y + 4, 1, h - 5);
    }

    // Violet-blue mystical runic accents
    const runePulse = Math.floor(this.timer * 4) % 2 === 0;
    ctx.fillStyle = runePulse ? P.STAINED_GLASS_BLUE : P.STAINED_GLASS_PURPLE;
    ctx.fillRect(x + Math.floor(w / 2) - 3, y + 3, 6, 2);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + Math.floor(w / 2) - 1, y + 3, 2, 1);
  }

  /**
   * World 3 Climbable Hanging Iron Chain.
   */
  renderPixelChain(ctx, x, y, w, h) {
    const cx = x + Math.floor(w / 2) - 2;
    for (let cy = y; cy < y + h; cy += 6) {
      // Iron link outer
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(cx, cy, 4, 5);
      // Link inner hole
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(cx + 1, cy + 1, 2, 3);
      // Steel specular edge glint
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(cx, cy, 1, 2);
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(cx + 1, cy, 1, 1);
    }
  }

  /**
   * World 3 Royal Velvet Runner Carpet Platform.
   */
  renderPixelRoyalCarpet(ctx, x, y, w, h) {
    // Foundation stone ledge
    ctx.fillStyle = P.CASTLE_STONE_DARK;
    ctx.fillRect(x, y + 4, w, h - 4);
    ctx.fillStyle = P.CASTLE_STONE_MID;
    ctx.fillRect(x + 1, y + 5, w - 2, h - 6);

    // Royal Crimson Velvet Runner
    ctx.fillStyle = P.CASTLE_VELVET_CRIMSON;
    ctx.fillRect(x, y + 1, w, 3);
    ctx.fillStyle = '#be185d';
    ctx.fillRect(x + 2, y + 1, w - 4, 1); // Velvet sheen glint

    // Golden Embroidered Fringe Edges
    ctx.fillStyle = P.CASTLE_VELVET_GOLD;
    ctx.fillRect(x, y, w, 1);
    ctx.fillRect(x, y + 4, w, 1);
    for (let fx = x; fx < x + w; fx += 4) {
      ctx.fillRect(fx, y, 2, 1);
      ctx.fillRect(fx + 2, y + 4, 2, 1);
    }
  }

  /**
   * World 3 Royal Bouncy Crest (Spring-board with Golden Lion Insignia).
   */
  renderPixelBouncyCrest(ctx, x, y, w, h) {
    // Heavy brass & wrought iron base
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(x + 2, y + h - 3, w - 4, 3);

    // Coiled Golden Springs
    ctx.fillStyle = '#d97706';
    for (let sx = x + 4; sx < x + w - 4; sx += 8) {
      ctx.fillRect(sx, y + 4, 4, h - 7);
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(sx + 1, y + 4, 2, h - 7);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(sx + 1, y + 5, 1, 1);
    }

    // Royal Velvet Spring Bed
    ctx.fillStyle = P.CASTLE_VELVET_DARK;
    ctx.fillRect(x, y + 2, w, 4);
    ctx.fillStyle = P.CASTLE_VELVET_CRIMSON;
    ctx.fillRect(x + 1, y + 1, w - 2, 3);
    ctx.fillStyle = '#f43f5e';
    ctx.fillRect(x + 2, y, w - 4, 1); // Specular spring top

    // Central Golden Fleur-de-lis / Crest
    const cx = x + Math.floor(w / 2);
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(cx - 3, y + 1, 6, 2);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(cx - 1, y, 2, 2);
  }

  /**
   * World 3 Iron Spikes Hazard with sharp glinting tips.
   */
  renderPixelIronSpikes(ctx, x, y, w, h) {
    // Wrought Iron Mounting Bar
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(x, y + h - 2, w, 2);
    ctx.fillStyle = '#334155';
    ctx.fillRect(x + 1, y + h - 2, w - 2, 1);

    // Sharp Triangular Gothic Steel Spikes
    for (let px = x + 1; px < x + w - 3; px += 6) {
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(px, y + h - 6, 5, 4);
      ctx.fillStyle = '#475569';
      ctx.fillRect(px + 1, y + h - 9, 3, 4);
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(px + 2, y + h - 12, 1, 3);
      // Sharp Steel Razor Glint
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(px + 2, y + h - 12, 1, 1);
    }
  }

  /**
   * World 3 Crumbling Gothic Masonry Stone with fissure stress fractures.
   */
  renderPixelCrumbleStone(ctx, x, y, w, h) {
    ctx.fillStyle = P.CASTLE_STONE_HIGHLIGHT;
    ctx.fillRect(x + 1, y, w - 2, 1);
    ctx.fillStyle = P.CASTLE_STONE_MID;
    ctx.fillRect(x, y + 1, w, 2);
    ctx.fillStyle = P.CASTLE_STONE_DARK;
    ctx.fillRect(x, y + 3, w, h - 4);
    ctx.fillRect(x, y + h - 1, w, 1);

    // Deep Stress Fissures & Crumbling dust
    ctx.fillStyle = '#04040c';
    ctx.fillRect(x + Math.floor(w * 0.25), y + 2, 2, 5);
    ctx.fillRect(x + Math.floor(w * 0.25) + 2, y + 6, 3, 2);
    ctx.fillRect(x + Math.floor(w * 0.65), y + 3, 2, 4);
    ctx.fillRect(x + Math.floor(w * 0.65) - 2, y + 7, 2, 3);

    // Violet unstable energy leak
    ctx.fillStyle = '#c084fc';
    ctx.fillRect(x + Math.floor(w * 0.25) + 1, y + 4, 1, 1);
    ctx.fillRect(x + Math.floor(w * 0.65), y + 5, 1, 1);
  }

  /**
   * World 3 Shifting Dimensional Portal Door.
   */
  renderPixelPortalDoor(ctx, x, y, w, h) {
    const pulse = Math.floor(this.timer * 8) % 3;

    // Heavy Gothic Stone Arch Portal Frame
    ctx.fillStyle = P.CASTLE_STONE_DARK;
    ctx.fillRect(x - 2, y - 2, w + 4, h + 2);
    ctx.fillStyle = P.CASTLE_STONE_MID;
    ctx.fillRect(x - 1, y - 1, w + 2, 2);
    ctx.fillRect(x - 1, y, 2, h);
    ctx.fillRect(x + w - 1, y, 2, h);

    // Carved Keystones & Runes
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(x + Math.floor(w / 2) - 2, y - 3, 4, 3);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + Math.floor(w / 2) - 1, y - 2, 2, 1);

    // Swirling Astral Dimensional Rift
    ctx.fillStyle = pulse === 0 ? P.DOOR_PORTAL_CYAN : (pulse === 1 ? P.DOOR_PORTAL_MAGENTA : '#818cf8');
    ctx.fillRect(x + 1, y + 1, w - 2, h - 2);

    ctx.fillStyle = pulse === 0 ? P.DOOR_PORTAL_MAGENTA : (pulse === 1 ? '#818cf8' : P.DOOR_PORTAL_CYAN);
    ctx.fillRect(x + 3, y + 3, w - 6, h - 6);

    // Concentric shimmering starlight core
    ctx.fillStyle = P.DOOR_PORTAL_CORE;
    ctx.fillRect(x + Math.floor(w / 2) - 2, y + Math.floor(h / 2) - 3, 4, 6);
    ctx.fillStyle = '#fde047';
    ctx.fillRect(x + Math.floor(w / 2) - 1, y + Math.floor(h / 2) - 1, 2, 2);
  }

  /**
   * World 3 Sir Slam-A-Lot Arena Destructible Crest Pillar.
   */
  renderPixelCrestPillar(ctx, x, y, w, h, isShattered = false) {
    if (isShattered) {
      // Shattered Broken Stump
      ctx.fillStyle = P.CASTLE_STONE_DARK;
      ctx.fillRect(x + 2, y + h - 10, w - 4, 10);
      ctx.fillStyle = P.CASTLE_STONE_MID;
      ctx.fillRect(x + 4, y + h - 8, w - 8, 8);
      // Jagged break line
      ctx.fillRect(x + 3, y + h - 12, 4, 3);
      ctx.fillRect(x + w - 7, y + h - 11, 3, 2);
      // Golden fractured lion crest remnant
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(x + Math.floor(w / 2) - 2, y + h - 6, 4, 3);
      return;
    }

    // Majestic Intact Heraldic Crest Pillar
    // Base Plinth
    ctx.fillStyle = P.CASTLE_STONE_DARK;
    ctx.fillRect(x, y + h - 8, w, 8);
    ctx.fillStyle = P.CASTLE_STONE_MID;
    ctx.fillRect(x + 1, y + h - 7, w - 2, 6);
    ctx.fillStyle = P.CASTLE_STONE_HIGHLIGHT;
    ctx.fillRect(x + 2, y + h - 7, w - 4, 1);

    // Fluted Column Shaft
    ctx.fillStyle = P.CASTLE_STONE_MID;
    ctx.fillRect(x + 3, y + 8, w - 6, h - 16);
    ctx.fillStyle = P.CASTLE_STONE_LIGHT;
    ctx.fillRect(x + 4, y + 8, 3, h - 16); // Left specular flute
    ctx.fillStyle = P.CASTLE_STONE_DARK;
    ctx.fillRect(x + w - 7, y + 8, 2, h - 16); // Right shadow flute

    // Capital & Golden Heraldic Lion Crest Top
    ctx.fillStyle = P.CASTLE_STONE_DARK;
    ctx.fillRect(x, y, w, 8);
    ctx.fillStyle = P.CASTLE_STONE_MID;
    ctx.fillRect(x + 1, y + 1, w - 2, 6);
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(x + 2, y, w - 4, 2); // Gold rim
    ctx.fillRect(x + Math.floor(w / 2) - 3, y + 3, 6, 4); // Lion crest
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + Math.floor(w / 2) - 1, y + 3, 2, 2);
  }

  /**
   * World 1 Wooden Spoon Crossing over Honey River.
   */
  renderPixelSpoonBridge(ctx, x, y, w, h, tilt = 0) {
    ctx.save();
    ctx.translate(x + Math.floor(w / 2), y + Math.floor(h / 2));
    ctx.rotate(tilt);
    const hw = Math.floor(w / 2);
    const hh = Math.floor(h / 2);

    // River Central Support Fulcrum
    ctx.fillStyle = '#78350f';
    ctx.fillRect(-3, hh, 6, 14);
    ctx.fillStyle = '#b45309';
    ctx.fillRect(-1, hh, 2, 14);

    // Carved Oak Spoon Handle Beam
    ctx.fillStyle = '#d97706';
    ctx.fillRect(-hw, -hh, w, h);
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(-hw + 2, -hh, w - 4, 1); // Specular top ridge
    ctx.fillStyle = '#92400e';
    ctx.fillRect(-hw, hh - 1, w, 1); // Underside shadow

    // Carved Honey Bowl Reservoir (Right Side)
    const bowlX = hw - 18;
    ctx.fillStyle = '#78350f';
    ctx.fillRect(bowlX, -hh - 3, 18, h + 6);
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(bowlX + 2, -hh - 2, 14, h + 4);
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(bowlX + 4, -hh - 1, 8, 2); // Nectar sheen
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(bowlX + 6, -hh, 4, 1);

    ctx.restore();
  }

  /**
   * World 1 Carnivorous Snapping Flower Hazard.
   */
  renderPixelSnappingFlower(ctx, x, y, w, h, openFactor = 1.0, isSnapping = false) {
    // Green Calyx stem
    ctx.fillStyle = '#15803d';
    ctx.fillRect(x + Math.floor(w / 2) - 2, y + 4, 4, h - 4);
    ctx.fillRect(x + Math.floor(w / 2) - 5, y + 8, 3, 2);
    ctx.fillRect(x + Math.floor(w / 2) + 2, y + 10, 3, 2);

    // Snapdragon Flower Jaws
    const mouthGap = Math.round(openFactor * 5);
    // Upper Jaw
    ctx.fillStyle = isSnapping ? '#ef4444' : '#f43f5e';
    ctx.fillRect(x + 2, y - mouthGap, w - 4, 5);
    ctx.fillStyle = '#fda4af';
    ctx.fillRect(x + 3, y - mouthGap, w - 6, 1);
    // Upper Interlocking Teeth
    ctx.fillStyle = '#ffffff';
    for (let tx = x + 4; tx < x + w - 4; tx += 4) {
      ctx.fillRect(tx, y - mouthGap + 5, 2, 2);
    }

    // Lower Jaw
    ctx.fillStyle = isSnapping ? '#b91c1c' : '#e11d48';
    ctx.fillRect(x + 2, y + mouthGap + 2, w - 4, 5);
    // Lower Teeth
    ctx.fillStyle = '#ffffff';
    for (let tx = x + 5; tx < x + w - 5; tx += 4) {
      ctx.fillRect(tx, y + mouthGap, 2, 2);
    }

    // Sweet nectar drop in throat when open
    if (!isSnapping && openFactor > 0.4) {
      ctx.fillStyle = '#fde047';
      ctx.fillRect(x + Math.floor(w / 2) - 1, y, 2, 2);
    }
  }

  /**
   * World 3 Branching Crest Door (Lion, Raven, Serpent).
   */
  renderPixelCrestDoor(ctx, x, y, w, h, crest = 'lion') {
    // Heavy Gothic Stone Arch Frame
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(x - 2, y - 2, w + 4, h + 2);
    ctx.fillStyle = '#334155';
    ctx.fillRect(x - 1, y - 1, w + 2, 2);
    ctx.fillRect(x - 1, y, 2, h);
    ctx.fillRect(x + w - 1, y, 2, h);

    // Inner Velvet Panel
    ctx.fillStyle = crest === 'lion' ? '#451a03' : (crest === 'raven' ? '#1e1b4b' : '#022c22');
    ctx.fillRect(x + 1, y + 1, w - 2, h - 2);

    // Heraldic Crest Badge
    let crestColor = '#fbbf24'; // Lion Gold
    if (crest === 'raven') crestColor = '#c084fc'; // Raven Violet
    if (crest === 'serpent') crestColor = '#34d399'; // Serpent Emerald

    ctx.fillStyle = crestColor;
    ctx.fillRect(x + Math.floor(w / 2) - 4, y + 5, 8, 8);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + Math.floor(w / 2) - 2, y + 7, 4, 4);

    // Iron Hinges & Handle
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(x + 2, y + 14, 2, 2);
    ctx.fillRect(x + 2, y + h - 8, 2, 2);
    ctx.fillRect(x + w - 4, y + Math.floor(h / 2), 2, 3);
  }

  /**
   * World 3 Bastion Portcullis Grate (Locked with keyhole vs Raised).
   */
  renderPixelBastionPortcullis(ctx, x, y, w, h, isUnlocked = false) {
    if (isUnlocked) {
      // Raised Portcullis: heavy hanging chains above open arch
      ctx.fillStyle = '#475569';
      for (let bx = x + 3; bx < x + w - 3; bx += 5) {
        ctx.fillRect(bx, y - 14, 2, 16);
      }
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(x + Math.floor(w / 2) - 3, y - 12, 6, 4);
      return;
    }

    // Locked Heavy Iron Grate
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#64748b';
    // Vertical iron bars
    for (let bx = x + 2; bx < x + w - 2; bx += 5) {
      ctx.fillRect(bx, y, 2, h);
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(bx, y, 1, h); // Glint
      // Spiked tip
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(bx, y + h - 2, 2, 2);
      ctx.fillStyle = '#64748b';
    }
    // Horizontal cross-beams
    ctx.fillStyle = '#334155';
    ctx.fillRect(x, y + 6, w, 2);
    ctx.fillRect(x, y + Math.floor(h / 2), w, 2);
    ctx.fillRect(x, y + h - 8, w, 2);

    // Ornate Golden Flying Key Padlock in center
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(x + Math.floor(w / 2) - 4, y + Math.floor(h / 2) - 2, 8, 7);
    ctx.fillStyle = '#78350f';
    ctx.fillRect(x + Math.floor(w / 2) - 1, y + Math.floor(h / 2) + 1, 2, 3); // Keyhole
  }

  /**
   * World 1 Honey Bumble Arena Destructible Honeycomb Pillar.
   */
  renderPixelHoneycombPillar(ctx, x, y, w, h, isShattered = false) {
    if (isShattered) {
      ctx.fillStyle = '#78350f';
      ctx.fillRect(x + 2, y + h - 12, w - 4, 12);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(x + 4, y + h - 10, w - 8, 8);
      ctx.fillRect(x + 3, y + h - 14, 3, 3);
      ctx.fillRect(x + w - 6, y + h - 13, 3, 2);
      return;
    }

    // Majestic Intact Canyon Honeycomb Pillar
    ctx.fillStyle = '#78350f';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#b45309';
    ctx.fillRect(x + 2, y + 2, w - 4, h - 4);

    // Hexagonal amber honey cells
    for (let py = y + 4; py < y + h - 8; py += 12) {
      for (let px = x + 3; px < x + w - 6; px += 8) {
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(px, py, 5, 5);
        ctx.fillStyle = '#fde047';
        ctx.fillRect(px + 1, py + 1, 3, 3);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(px + 1, py + 1, 1, 1);
      }
    }
  }

  /**
   * World 2 Sleeping Spores (Spore Puffball Bulb).
   */
  renderPixelSporePuffball(ctx, x, y, isEmitting = false) {
    // Mossy Root Stem
    ctx.fillStyle = '#14532d';
    ctx.fillRect(x - 2, y, 4, 8);

    // Bioluminescent Fungal Cap
    ctx.fillStyle = isEmitting ? '#38bdf8' : '#059669';
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = isEmitting ? '#a7f3d0' : '#34d399';
    ctx.beginPath();
    ctx.arc(x, y - 2, 5, 0, Math.PI * 2);
    ctx.fill();

    // Spore Dots
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x - 3, y - 4, 2, 2);
    ctx.fillRect(x + 2, y - 3, 1, 1);

    // Emitting Spore Cloud Haze
    if (isEmitting) {
      ctx.fillStyle = 'rgba(167, 243, 208, 0.28)';
      ctx.beginPath();
      ctx.arc(x, y - 10, 22, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /**
   * World 2 Mimic Tree.
   */
  renderPixelMimicTree(ctx, x, y, isAwake = false) {
    // Twisted Hollow Trunk
    ctx.fillStyle = '#291e13';
    ctx.fillRect(x - 10, y - 24, 20, 24);
    ctx.fillStyle = '#452b14';
    ctx.fillRect(x - 6, y - 22, 12, 20);

    // Dense Canopy
    ctx.fillStyle = '#14532d';
    ctx.beginPath();
    ctx.arc(x, y - 32, 18, 0, Math.PI * 2);
    ctx.fill();

    if (isAwake) {
      // Menacing Glowing Eyes
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(x - 4, y - 16, 3, 3);
      ctx.fillRect(x + 2, y - 16, 3, 3);
      ctx.fillStyle = '#fde047';
      ctx.fillRect(x - 3, y - 15, 1, 1);
      ctx.fillRect(x + 3, y - 15, 1, 1);

      // Whipping Briar Branch
      ctx.fillStyle = '#78350f';
      ctx.fillRect(x - 18, y - 8, 12, 3);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(x - 22, y - 10, 4, 2); // Claw
    } else {
      // Innocent closed tree knot
      ctx.fillStyle = '#1c130b';
      ctx.fillRect(x - 2, y - 14, 4, 3);
    }
  }

  /**
   * World 1 Story Landmark: Khan's Cloak Clue on Meadow Flower.
   */
  renderPixelKhanCloakClue(ctx, x, y) {
    // Meadow Thorn Stem
    ctx.fillStyle = '#15803d';
    ctx.fillRect(x - 1, y, 2, 10);
    ctx.fillRect(x + 1, y + 2, 2, 2);

    // Fluttering Crimson Royal Cloak Scrap
    const flutter = Math.sin(this.timer * 6) * 2;
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 10 + flutter, y + 3);
    ctx.lineTo(x + 8 + flutter, y + 8);
    ctx.lineTo(x, y + 4);
    ctx.closePath();
    ctx.fill();

    // Golden Royal Embroidery Thread
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(x + 2, y + 2, 4, 1);
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(x + 4, y + 1, 2, 1);
  }

  /**
   * World 4 Basalt Ground with volcanic column joints, magma fissure veins, and obsidian bedrock.
   */
  renderPixelBasaltGround(ctx, x, y, w, h) {
    // 1. Walkable Basalt Cap with specular mineral glints
    ctx.fillStyle = P.BASALT_SPECULAR;
    ctx.fillRect(x, y, w, 1);
    ctx.fillStyle = P.BASALT_RIM;
    ctx.fillRect(x, y + 1, w, 2);
    ctx.fillStyle = P.BASALT_LIGHT;
    ctx.fillRect(x, y + 3, w, 1);

    // Micro mineral glints along rim
    for (let px = x; px < x + w; px += 4) {
      if ((px + y) % 8 === 0) {
        ctx.fillStyle = P.BASALT_SPECULAR;
        ctx.fillRect(px, y, 1, 1);
      }
    }

    // 2. Basalt Hexagonal Columns (Columns of 10px width)
    ctx.fillStyle = P.BASALT_MID;
    ctx.fillRect(x, y + 4, w, Math.min(h - 4, 16));
    ctx.fillStyle = P.BASALT_DARK;
    ctx.fillRect(x, y + 20, w, Math.max(0, h - 20));

    // Column joint vertical grooves
    for (let px = x + 10; px < x + w; px += 10) {
      ctx.fillStyle = P.BASALT_DARK;
      ctx.fillRect(px, y + 3, 1, h - 3);
      ctx.fillStyle = P.BASALT_SPECULAR;
      ctx.fillRect(px - 1, y + 1, 1, 2);
    }

    // 3. Glowing Molten Honey Magma Fissure Veins
    for (let py = y + 6; py < y + h; py += 12) {
      const rowOffset = ((py - y) / 12) % 2 === 0 ? 0 : 5;
      for (let px = x + rowOffset; px < x + w; px += 18) {
        const pulse = Math.floor(this.timer * 4 + px * 0.1) % 2 === 0;
        ctx.fillStyle = P.LAVA_HONEY_DEEP;
        ctx.fillRect(px, py, 4, 3);
        ctx.fillStyle = pulse ? P.LAVA_HONEY_BRIGHT : P.LAVA_HONEY_MAGMA;
        ctx.fillRect(px + 1, py + 1, 2, 1);
      }
    }
  }

  /**
   * World 4 Basalt Floating Platform / Basalt Slab.
   */
  renderPixelBasaltPlatform(ctx, x, y, w, h, isMoving = false) {
    // Walkable Top
    ctx.fillStyle = P.BASALT_SPECULAR;
    ctx.fillRect(x + 1, y, w - 2, 1);
    ctx.fillStyle = P.BASALT_RIM;
    ctx.fillRect(x, y + 1, w, 2);

    // Basalt Column Body
    ctx.fillStyle = P.BASALT_MID;
    ctx.fillRect(x, y + 3, w, h - 5);
    ctx.fillStyle = P.BASALT_DARK;
    ctx.fillRect(x, y + h - 2, w, 2);

    // Column facets
    for (let px = x + 8; px < x + w - 4; px += 8) {
      ctx.fillStyle = P.BASALT_LIGHT;
      ctx.fillRect(px, y + 2, 2, h - 4);
      ctx.fillStyle = P.BASALT_DARK;
      ctx.fillRect(px + 2, y + 3, 1, h - 5);
    }

    // If moving platform: Molten Honey Magma Propulsion Thruster Vein
    if (isMoving) {
      const pulse = Math.floor(this.timer * 8) % 2;
      ctx.fillStyle = P.LAVA_HONEY_MAGMA;
      ctx.fillRect(x + 2, y + h - 1, w - 4, 2);
      ctx.fillStyle = pulse ? P.LAVA_HONEY_CORE : P.LAVA_HONEY_BRIGHT;
      ctx.fillRect(x + Math.floor(w / 4), y + h, Math.floor(w / 2), 2);
      // Small dripping ember
      const dropX = x + Math.floor(w / 2) + Math.sin(this.timer * 3) * 6;
      ctx.fillStyle = P.VOLCANO_EMBER_YELLOW;
      ctx.fillRect(Math.round(dropX), y + h + 2, 1, 2);
    }
  }

  /**
   * World 4 Molten Honey Lava Hazard (viscous bubbling magma pool).
   */
  renderPixelMoltenHoney(ctx, x, y, w, h) {
    // Deep magma base
    ctx.fillStyle = P.LAVA_HONEY_DEEP;
    ctx.fillRect(x, y + 6, w, h - 6);

    // Mid lava body
    ctx.fillStyle = P.LAVA_HONEY_MAGMA;
    ctx.fillRect(x, y + 2, w, 5);

    // Viscous Honey Surface Crust
    ctx.fillStyle = P.LAVA_HONEY_SURFACE;
    ctx.fillRect(x, y + 1, w, 2);

    // Animated Bubbling Lava Crest Ripples
    for (let px = x; px < x + w; px += 4) {
      const wave = Math.sin(this.timer * 5 + px * 0.4);
      const isCrest = wave > 0.3;
      if (isCrest) {
        ctx.fillStyle = P.LAVA_HONEY_BRIGHT;
        ctx.fillRect(px, y, 2, 1);
        ctx.fillStyle = P.LAVA_HONEY_CORE;
        ctx.fillRect(px + 1, y - 1, 1, 1);
      }
    }

    // Glowing Subsurface Magma Cells
    for (let px = x + 2; px < x + w - 4; px += 10) {
      const bubbleTimer = (this.timer * 3 + px * 0.2) % 3;
      if (bubbleTimer < 1.5) {
        ctx.fillStyle = P.LAVA_HONEY_CORE;
        ctx.fillRect(px, y + 3, 2, 2);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(px, y + 2, 1, 1);
      }
    }
  }

  /**
   * World 4 Thermal Updraft (Aerial Catapult Lift).
   */
  renderPixelThermalUpdraft(ctx, x, y, w, h) {
    // Basalt Vent Basin at bottom
    ctx.fillStyle = P.BASALT_DARK;
    ctx.fillRect(x + 2, y + h - 4, w - 4, 4);
    ctx.fillStyle = P.BASALT_RIM;
    ctx.fillRect(x + 4, y + h - 5, w - 8, 1);

    // Vent Magma Core
    ctx.fillStyle = P.LAVA_HONEY_MAGMA;
    ctx.fillRect(x + 6, y + h - 3, w - 12, 2);
    ctx.fillStyle = P.LAVA_HONEY_BRIGHT;
    ctx.fillRect(x + 8, y + h - 2, w - 16, 1);

    // Rising Thermal Wind Streams (Shimmering vertical streaks)
    for (let px = x + 3; px < x + w - 3; px += 4) {
      const offset = (this.timer * 60 + px * 13) % (h - 8);
      const streamY = y + h - 6 - offset;
      if (streamY > y) {
        ctx.fillStyle = P.UPDRAFT_STREAM;
        ctx.fillRect(px, Math.round(streamY), 2, 6);
        ctx.fillStyle = P.UPDRAFT_CORE;
        ctx.fillRect(px + 1, Math.round(streamY) + 1, 1, 4);
      }
    }

    // Rising Chevron Arrows (Indicating vertical catapult launch)
    for (let arrow = 0; arrow < 3; arrow++) {
      const arrowY = y + ((h - ((this.timer * 50 + arrow * (h / 3)) % h)) % h);
      const cx = x + Math.floor(w / 2);
      ctx.fillStyle = P.VOLCANO_EMBER_YELLOW;
      ctx.fillRect(cx - 3, Math.round(arrowY), 6, 1);
      ctx.fillRect(cx - 2, Math.round(arrowY) - 1, 4, 1);
      ctx.fillRect(cx - 1, Math.round(arrowY) - 2, 2, 1);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(cx - 1, Math.round(arrowY) - 1, 2, 1);
    }
  }

  /**
   * World 4 Bouncy Amber Magma (Elastic Volcanic Trampoline).
   */
  renderPixelBouncyAmberMagma(ctx, x, y, w, h) {
    // Basalt Cradle Base
    ctx.fillStyle = P.BASALT_DARK;
    ctx.fillRect(x + 1, y + h - 4, w - 2, 4);
    ctx.fillStyle = P.BASALT_MID;
    ctx.fillRect(x + 2, y + h - 5, w - 4, 1);

    // Elastic Gelatinous Amber Magma Dome
    const pulse = Math.sin(this.timer * 6) * 1.5;
    ctx.fillStyle = P.LAVA_HONEY_MAGMA;
    ctx.fillRect(x + 2, y + 4, w - 4, h - 8);

    ctx.fillStyle = P.LAVA_HONEY_SURFACE;
    ctx.fillRect(x + 1, y + 2, w - 2, 4);

    // Super-bouncy translucent amber core
    ctx.fillStyle = P.DRAGON_SCALE_GOLD;
    ctx.fillRect(x + 3, y + 3, w - 6, h - 7);

    // Radiant top highlight & elastic specular reflection
    ctx.fillStyle = P.LAVA_HONEY_BRIGHT;
    ctx.fillRect(x + 2, y + 1, w - 4, 2);
    ctx.fillStyle = P.LAVA_HONEY_CORE;
    ctx.fillRect(x + 4, y, w - 8, 1);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + Math.floor(w / 2) - 3, y, 6, 1);

    // Glowing internal core bubble
    const cx = x + Math.floor(w / 2);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(cx - 2, y + 4, 4, 3);
    ctx.fillStyle = P.VOLCANO_EMBER_YELLOW;
    ctx.fillRect(cx - 3, y + 5, 6, 2);
  }

  /**
   * World 4 Crumble Ash Bridge (Brittle porous crust with magma fissures).
   */
  renderPixelCrumbleAsh(ctx, x, y, w, h) {
    // Porous brittle ash rock surface
    ctx.fillStyle = P.BASALT_LIGHT;
    ctx.fillRect(x + 1, y, w - 2, 1);
    ctx.fillStyle = P.VOLCANO_ASH_CLOUD;
    ctx.fillRect(x, y + 1, w, 2);
    ctx.fillStyle = P.BASALT_MID;
    ctx.fillRect(x, y + 3, w, h - 4);
    ctx.fillStyle = P.BASALT_DARK;
    ctx.fillRect(x, y + h - 1, w, 1);

    // Deep Stress Fractures with incandescent magma glow
    const pulse = Math.floor(this.timer * 6) % 2 === 0;
    ctx.fillStyle = P.BASALT_DARK;
    ctx.fillRect(x + Math.floor(w * 0.28), y + 2, 2, 6);
    ctx.fillRect(x + Math.floor(w * 0.68), y + 1, 2, 7);

    // Glowing Magma Fissures
    ctx.fillStyle = pulse ? P.LAVA_HONEY_BRIGHT : P.LAVA_HONEY_MAGMA;
    ctx.fillRect(x + Math.floor(w * 0.28) + 1, y + 3, 1, 4);
    ctx.fillRect(x + Math.floor(w * 0.68), y + 2, 1, 5);
    ctx.fillStyle = P.VOLCANO_EMBER_YELLOW;
    ctx.fillRect(x + Math.floor(w * 0.28) + 1, y + 4, 1, 1);
    ctx.fillRect(x + Math.floor(w * 0.68), y + 4, 1, 1);
  }

  /**
   * World 4 Honey Dragon Arena Destructible Basalt Pillar.
   */
  renderPixelBasaltPillar(ctx, x, y, w, h, isShattered = false) {
    if (isShattered) {
      // Shattered Broken Basalt Stump
      ctx.fillStyle = P.BASALT_DARK;
      ctx.fillRect(x + 2, y + h - 12, w - 4, 12);
      ctx.fillStyle = P.BASALT_MID;
      ctx.fillRect(x + 4, y + h - 10, w - 8, 10);
      // Jagged break fracture lines
      ctx.fillRect(x + 3, y + h - 14, 5, 3);
      ctx.fillRect(x + w - 8, y + h - 13, 4, 2);
      // Glowing magma core remnant
      ctx.fillStyle = P.LAVA_HONEY_MAGMA;
      ctx.fillRect(x + Math.floor(w / 2) - 3, y + h - 8, 6, 4);
      ctx.fillStyle = P.LAVA_HONEY_BRIGHT;
      ctx.fillRect(x + Math.floor(w / 2) - 1, y + h - 6, 2, 2);
      return;
    }

    // Majestic Intact Basalt Pillar
    // Base Plinth
    ctx.fillStyle = P.BASALT_DARK;
    ctx.fillRect(x, y + h - 8, w, 8);
    ctx.fillStyle = P.BASALT_MID;
    ctx.fillRect(x + 1, y + h - 7, w - 2, 6);
    ctx.fillStyle = P.BASALT_SPECULAR;
    ctx.fillRect(x + 2, y + h - 7, w - 4, 1);

    // Hexagonal Basalt Column Shaft
    ctx.fillStyle = P.BASALT_MID;
    ctx.fillRect(x + 3, y + 8, w - 6, h - 16);
    ctx.fillStyle = P.BASALT_LIGHT;
    ctx.fillRect(x + 4, y + 8, 3, h - 16); // Specular facet
    ctx.fillStyle = P.BASALT_DARK;
    ctx.fillRect(x + w - 7, y + 8, 2, h - 16); // Shadow facet

    // Carved Draconic Magma Runes
    for (let ry = y + 18; ry < y + h - 20; ry += 18) {
      ctx.fillStyle = P.LAVA_HONEY_MAGMA;
      ctx.fillRect(x + Math.floor(w / 2) - 2, ry, 4, 6);
      ctx.fillStyle = P.LAVA_HONEY_BRIGHT;
      ctx.fillRect(x + Math.floor(w / 2) - 1, ry + 1, 2, 4);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x + Math.floor(w / 2), ry + 2, 1, 2);
    }

    // Capital & Basalt Crown
    ctx.fillStyle = P.BASALT_DARK;
    ctx.fillRect(x, y, w, 8);
    ctx.fillStyle = P.BASALT_MID;
    ctx.fillRect(x + 1, y + 1, w - 2, 6);
    ctx.fillStyle = P.BASALT_SPECULAR;
    ctx.fillRect(x + 2, y, w - 4, 2);
    ctx.fillStyle = P.DRAGON_SCALE_GOLD;
    ctx.fillRect(x + Math.floor(w / 2) - 3, y + 3, 6, 3);
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

    // 5. Enemies (World 1, World 2, World 3 & World 4 Bestiary)
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
      } else if (type === 'FireBee' || e.name === 'Fire Bee' || type === 'fire_bee') {
        pixelEnemyRenderer.drawFireBee(ctx, scrX, scrY, scrW, scrH, e);
      } else if (type === 'LavaBeetle' || e.name === 'Lava Beetle' || type === 'lava_beetle') {
        pixelEnemyRenderer.drawLavaBeetle(ctx, scrX, scrY, scrW, scrH, e);
      } else if (type === 'MagmaGrub' || e.name === 'Magma Grub' || type === 'magma_grub') {
        pixelEnemyRenderer.drawMagmaGrub(ctx, scrX, scrY, scrW, scrH, e);
      } else if (type === 'HoneyDragon' || e.name === 'Honey Dragon' || type === 'honey_dragon') {
        pixelEnemyRenderer.drawHoneyDragon(ctx, scrX, scrY, scrW, scrH, e);
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
      } else if (type === 'DoorGoblin' || e.name === 'Door Goblin' || type === 'door_goblin') {
        pixelEnemyRenderer.drawDoorGoblin(ctx, scrX, scrY, scrW, scrH, e);
      } else if (type === 'FlyingKey' || e.name === 'Flying Key' || type === 'flying_key') {
        pixelEnemyRenderer.drawFlyingKey(ctx, scrX, scrY, scrW, scrH, e);
      } else if (type === 'EnchantedBroom' || e.name === 'Enchanted Broom' || type === 'enchanted_broom') {
        pixelEnemyRenderer.drawEnchantedBroom(ctx, scrX, scrY, scrW, scrH, e);
      } else if (type === 'CastleKnight' || e.name === 'Castle Knight' || type === 'castle_knight') {
        pixelEnemyRenderer.drawCastleKnight(ctx, scrX, scrY, scrW, scrH, e);
      } else if (type === 'SirSlamALot' || e.name === 'Sir Slam-A-Lot' || type === 'sir_slam_a_lot') {
        pixelEnemyRenderer.drawSirSlamALot(ctx, scrX, scrY, scrW, scrH, e);
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
