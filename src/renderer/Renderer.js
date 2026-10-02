import { INTERNAL_WIDTH, INTERNAL_HEIGHT, WORLD_TO_PIXEL, PIXEL_PALETTE } from './PixelPalette.js';
import { PixelRenderer } from './PixelRenderer.js';
import { pixelAriaRenderer } from './PixelCharacterRenderer.js';
import { pixelEnemyRenderer } from './PixelEnemyRenderer.js';
import { pixelHUD } from '../ui/PixelHUD.js';
import { CinematicSystem } from '../systems/CinematicSystem.js';

// Archived HD systems preserved for story/cinematic scenes
import { LightingSystem } from './LightingSystem.js';
import { AtmosphereSystem } from '../systems/AtmosphereSystem.js';
import { ParallaxBackground } from './ParallaxBackground.js';
import { environmentRenderer } from './EnvironmentRenderer.js';
import { characterRenderer } from './HDCharacterRenderer.js';

/**
 * Renderer.js — Master 1985-Era Pixel Platformer Renderer
 * 
 * Target Internal Gameplay Resolution: 256 x 240.
 * Widescreen display viewport scaling via crisp nearest-neighbor principles.
 * 
 * - Flat pixel-art lighting for normal gameplay
 * - Disciplined 1985 console color palette
 * - Minimal, uncluttered environment:
 *   - Background: 2-3 blue tone sky + 1-2 silhouette hill/forest layers
 *   - Midground: simple trees + rare monumental landmarks
 *   - Gameplay layer: ultra-readable platform vocabulary (ground, platform, bridge, hazard, vine)
 *   - Foreground: completely clear (negative space intentional)
 * - Small, instantly recognizable pixel character & enemy silhouettes
 * - Minimal retro HUD (top 12px)
 * - Zero blur, zero painterly interpolation, crisp pixel edges
 */

const P = PIXEL_PALETTE;

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    // Internal 256x240 Pixel Platformer Renderer
    this.pixelRenderer = new PixelRenderer(this.canvas);
    this.internalCanvas = this.pixelRenderer.internalCanvas;
    this.internalCtx = this.pixelRenderer.internalCtx;

    // Preserved subsystems (dormant during retro gameplay)
    this.lighting = new LightingSystem();
    this.atmosphere = new AtmosphereSystem('honeywood');
    this.parallax = new ParallaxBackground();
    this.cinematic = new CinematicSystem();

    // Disable HD runtime lighting and atmospheric dust in gameplay
    this.lighting.enabled = false;
    this.atmosphere.maxParticles = 0;
    this.atmosphere.particles = [];
    this.atmosphere.birds = [];

    this.debugVisual = false;
    this.setupViewport();
    window.addEventListener('resize', () => this.setupViewport());
  }

  setupViewport() {
    this.pixelRenderer.setupViewport();
    this.ctx.imageSmoothingEnabled = false;
  }

  toggleDebugVisual() {
    this.debugVisual = !this.debugVisual;
    return this.debugVisual;
  }

  clear() {
    this.pixelRenderer.clear();
  }

  beginFrame() {
    this.pixelRenderer.beginFrame();
  }

  endFrame() {
    this.pixelRenderer.endFrame();
  }

  update(dt) {
    this.pixelRenderer.update(dt);
  }

  /**
   * Draw the entire gameplay world to the 256x240 internal canvas.
   */
  drawWorld(camera, level, player, gameState) {
    const ctx = this.internalCtx;

    // 1. Draw 2-Layer Minimal Background (Sky + Distant Silhouette Hills)
    this.pixelRenderer.drawBackground(camera, level);

    // 2. Draw Midground Simple Trees & Rare Landmarks
    this.pixelRenderer.drawMidground(camera, level.midgroundProps);

    // 3. Draw World Platforms (Ground, elevated wood/stone/honey, bridges, vines, hazards, moving platforms)
    this.pixelRenderer.drawPlatforms(camera, level.platforms, level.movingPlatforms);

    // 4. Draw Entities (Checkpoints, Goal & Batboy, Shards, Enemies, Queen Bee silhouette, Particles, Player)
    this.pixelRenderer.drawEntities(camera, level, player);

    // 5. Draw Minimal Retro HUD (Top 12px)
    this.pixelRenderer.drawHUD(gameState);

    // 6. Visual Debug Overlay (F2)
    if (this.debugVisual) {
      this.drawDebugVisual(60, camera, level);
    }
  }

  // Backward-compatibility wrappers for Game.js rendering calls
  drawBackground(camera, level) {
    this.pixelRenderer.drawBackground(camera, level);
  }

  drawMidgroundProps(props, camera) {
    this.pixelRenderer.drawMidground(camera, props);
  }

  drawPlatforms(platforms, camera) {
    this.pixelRenderer.drawPlatforms(camera, platforms, []);
  }

  drawDetails(details, camera) {
    // Disabled in 1985 pixel gameplay to eliminate screen clutter and preserve negative space
  }

  drawForeground(camera) {
    // Disabled in 1985 pixel gameplay: negative space is intentional
  }

  drawLighting(camera, level, player) {
    // Flat pixel-art lighting in gameplay: heavy dynamic 2D canvas lighting disabled
  }

  drawCinematic() {
    // Preserved for story/fade transitions
    if (this.cinematic.fadeAlpha > 0) {
      this.internalCtx.save();
      this.internalCtx.fillStyle = `rgba(0, 0, 0, ${this.cinematic.fadeAlpha})`;
      this.internalCtx.fillRect(0, 0, INTERNAL_WIDTH, INTERNAL_HEIGHT);
      this.internalCtx.restore();
    }
  }

  drawSecretBanner(timer, text) {
    // Suppressed or clean minimal pixel prompt
  }

  drawShrineBanner(timer, text) {
    // Suppressed or clean minimal pixel prompt
  }

  drawCheckpoints(checkpoints) {
    // Handled in drawWorld
  }

  drawCheckpoint(checkpoint) {
    // Handled in drawWorld
  }

  drawGoal(goal, batboy) {
    // Handled in drawWorld
  }

  /**
   * Title Screen rendering at 256x240 internal retro resolution.
   */
  drawTitleScreen(titleScreen, player) {
    const ctx = this.internalCtx;
    ctx.save();

    // 1. Midnight Sky / Deep Forest Background
    ctx.fillStyle = P.UI_BG;
    ctx.fillRect(0, 0, INTERNAL_WIDTH, INTERNAL_HEIGHT);

    // Distant tree silhouette backdrop
    ctx.fillStyle = P.FOREST_DEEP;
    ctx.fillRect(0, 160, INTERNAL_WIDTH, 80);
    ctx.fillStyle = P.GROUND_WARM;
    ctx.fillRect(0, 196, INTERNAL_WIDTH, 44);
    ctx.fillStyle = P.GRASS_TOP;
    ctx.fillRect(0, 196, INTERNAL_WIDTH, 2);

    // 2. Game Title (Clean retro typography)
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    // "PRINCESS ARIA"
    ctx.fillStyle = P.HONEY_PALE;
    ctx.font = 'bold 16px monospace';
    ctx.fillText('PRINCESS ARIA', INTERNAL_WIDTH / 2, 38);

    // Title shadow / underline
    ctx.fillStyle = P.HONEY_DARK;
    ctx.fillRect(INTERNAL_WIDTH / 2 - 64, 58, 128, 2);

    // "THE RESCUE OF BATBOY"
    ctx.fillStyle = P.HONEY_AMBER;
    ctx.font = '8px monospace';
    ctx.fillText('THE RESCUE OF BATBOY', INTERNAL_WIDTH / 2, 66);

    // 3. Princess Aria Pixel Sprite (Center Stage on Stone Plinth)
    const plinthX = INTERNAL_WIDTH / 2 - 14;
    const plinthY = 168;
    ctx.fillStyle = P.STONE_LIGHT;
    ctx.fillRect(plinthX, plinthY, 28, 4);
    ctx.fillStyle = P.STONE_MID;
    ctx.fillRect(plinthX + 2, plinthY + 4, 24, 24);

    if (player) {
      pixelAriaRenderer.draw(ctx, INTERNAL_WIDTH / 2 - 8, plinthY - 22, player);
    }

    // 4. Distant Queen Bee Silhouette in Sky
    ctx.fillStyle = P.QUEEN_SILHOUETTE;
    ctx.fillRect(INTERNAL_WIDTH / 2 - 12, 16, 24, 10);
    ctx.fillStyle = P.QUEEN_EYES;
    ctx.fillRect(INTERNAL_WIDTH / 2 - 4, 18, 2, 2);
    ctx.fillRect(INTERNAL_WIDTH / 2 + 2, 18, 2, 2);

    // 5. Blinking "PRESS START" Prompt
    const blink = Math.floor(Date.now() / 450) % 2 === 0;
    if (blink) {
      ctx.fillStyle = P.UI_TEXT_WHITE;
      ctx.font = '8px monospace';
      ctx.fillText('PRESS SPACE / ENTER', INTERNAL_WIDTH / 2, 136);
    }

    // Copyright / Credits
    ctx.fillStyle = P.STONE_MID;
    ctx.font = '6px monospace';
    ctx.fillText('1985 RETRO PLATFORM ENGINE', INTERNAL_WIDTH / 2, 222);

    ctx.restore();
  }

  /**
   * Game Over / Stage Clear screen at 256x240 internal retro resolution.
   */
  drawGameOverScreen(gameOverScreen, gameState, isClear, stats = {}) {
    const ctx = this.internalCtx;
    ctx.save();

    // Dark tint
    ctx.fillStyle = 'rgba(9, 13, 22, 0.88)';
    ctx.fillRect(0, 0, INTERNAL_WIDTH, INTERNAL_HEIGHT);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    if (isClear) {
      // VICTORY / STAGE CLEAR
      ctx.fillStyle = P.HONEY_PALE;
      ctx.font = 'bold 14px monospace';
      ctx.fillText('STAGE CLEAR!', INTERNAL_WIDTH / 2, 48);

      ctx.fillStyle = P.BATBOY_ACCENT;
      ctx.font = '8px monospace';
      ctx.fillText('BATBOY RESCUED!', INTERNAL_WIDTH / 2, 70);

      ctx.fillStyle = P.UI_TEXT_WHITE;
      ctx.font = '8px monospace';
      ctx.fillText(`SCORE: ${gameState?.score || 0}`, INTERNAL_WIDTH / 2, 98);
      ctx.fillText(`SHARDS: ${gameState?.coins || gameState?.shards || 0}`, INTERNAL_WIDTH / 2, 114);

      const blink = Math.floor(Date.now() / 450) % 2 === 0;
      if (blink) {
        ctx.fillStyle = P.HONEY_AMBER;
        ctx.fillText('PRESS SPACE TO PLAY AGAIN', INTERNAL_WIDTH / 2, 150);
      }
    } else {
      // GAME OVER
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 16px monospace';
      ctx.fillText('GAME OVER', INTERNAL_WIDTH / 2, 60);

      ctx.fillStyle = P.UI_TEXT_WHITE;
      ctx.font = '8px monospace';
      ctx.fillText(`FINAL SCORE: ${gameState?.score || 0}`, INTERNAL_WIDTH / 2, 96);

      const blink = Math.floor(Date.now() / 450) % 2 === 0;
      if (blink) {
        ctx.fillStyle = P.HONEY_AMBER;
        ctx.fillText('PRESS SPACE TO RETRY', INTERNAL_WIDTH / 2, 140);
      }
    }

    ctx.restore();
  }

  /**
   * Minimal retro visual debug overlay.
   */
  drawDebugVisual(fps, camera, level) {
    const ctx = this.internalCtx;
    ctx.save();
    ctx.fillStyle = 'rgba(9, 13, 22, 0.85)';
    ctx.fillRect(4, 16, 110, 48);
    ctx.fillStyle = P.UI_TEXT_GOLD;
    ctx.font = '6px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`FPS: ${fps || 60} | RES: 256x240`, 8, 20);
    ctx.fillText(`CAM: X:${Math.round(camera ? camera.x : 0)}`, 8, 28);
    ctx.fillText(`ENTITIES: ${level ? level.enemies.length : 0} ENEMIES`, 8, 36);
    ctx.fillText(`MODE: 1985 PIXEL ENGINE`, 8, 44);
    ctx.restore();
  }
}
