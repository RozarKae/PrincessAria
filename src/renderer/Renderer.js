import { CANVAS_WIDTH, CANVAS_HEIGHT, ASPECT_RATIO } from '../game/Constants.js';
import { assetManager } from './AssetManager.js';
import { ParallaxBackground } from './ParallaxBackground.js';
import { LightingSystem } from './LightingSystem.js';
import { AtmosphereSystem } from '../systems/AtmosphereSystem.js';
import { CinematicSystem } from '../systems/CinematicSystem.js';
import { environmentRenderer } from './EnvironmentRenderer.js';

/**
 * HIGH-DEFINITION 2D RENDERER & VISUAL PIPELINE
 * Features:
 * - High-DPI canvas scaling separating game resolution (1920x1080) from display resolution
 * - Configurable 8-layer parallax background engine
 * - 2D Lighting System with ambient progression & point lights
 * - Weather & atmospheric particles (pollen, leaves, distant birds)
 * - Cinematic letterbox & fade transitions
 * - Visual Debug Overlay
 */
export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);

    this.displayWidth = CANVAS_WIDTH;
    this.displayHeight = CANVAS_HEIGHT;
    this.scale = 1.0;

    // Subsystems
    this.parallax = new ParallaxBackground();
    this.lighting = new LightingSystem();
    this.atmosphere = new AtmosphereSystem('honeywood');
    this.cinematic = new CinematicSystem();

    // Visual Debug Mode
    this.debugVisual = false;

    this.setupHighDPI();
    window.addEventListener('resize', () => this.setupHighDPI());
  }

  toggleDebugVisual() {
    this.debugVisual = !this.debugVisual;
    return this.debugVisual;
  }

  /**
   * Calculate exact display dimensions respecting 16:9 aspect ratio and DPR.
   */
  setupHighDPI() {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);

    const windowW = window.innerWidth;
    const windowH = window.innerHeight;

    let targetW = windowW;
    let targetH = windowW / ASPECT_RATIO;

    if (targetH > windowH) {
      targetH = windowH;
      targetW = windowH * ASPECT_RATIO;
    }

    this.displayWidth = Math.round(targetW);
    this.displayHeight = Math.round(targetH);

    // Canvas buffer resolution
    this.canvas.width = Math.round(this.displayWidth * this.dpr);
    this.canvas.height = Math.round(this.displayHeight * this.dpr);

    // CSS styling maintains letterbox center
    this.canvas.style.width = `${this.displayWidth}px`;
    this.canvas.style.height = `${this.displayHeight}px`;

    this.scale = (this.canvas.width / CANVAS_WIDTH);

    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';
  }

  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  beginFrame() {
    this.ctx.save();
    // Scale logical 1920x1080 coordinates to device buffer
    this.ctx.scale(this.scale, this.scale);
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';
  }

  endFrame() {
    this.ctx.restore();
  }

  update(dt) {
    this.parallax.update(dt);
    this.lighting.update(dt);
    this.atmosphere.update(dt);
    this.cinematic.update(dt);
  }

  /**
   * Draw the multi-plane authored parallax background.
   */
  drawBackground(camera, level) {
    environmentRenderer.drawBackground(this.ctx, camera);
    this.atmosphere.draw(this.ctx, camera);
  }

  /**
   * Draw authored midground landmark props.
   */
  drawMidgroundProps(props, camera = null) {
    if (props && props.length > 0) {
      environmentRenderer.drawMidgroundProps(this.ctx, props, camera);
    }
  }

  /**
   * Draw gameplay platforms using authored 3-slice assets & meadow tileset.
   */
  drawPlatforms(platforms, camera = null) {
    if (!platforms) return;
    environmentRenderer.drawGameplaySurfaces(this.ctx, platforms, camera);
  }

  /**
   * Draw authored flora, fungi, and signs.
   */
  drawDetails(details, camera = null) {
    if (details && details.length > 0) {
      environmentRenderer.drawDetails(this.ctx, details, camera);
    }
  }

  /**
   * Draw foreground framing vignette plates.
   */
  drawForeground(camera) {
    environmentRenderer.drawForeground(this.ctx, camera);
  }

  drawCheckpoints(checkpoints) {
    if (!checkpoints || checkpoints.length === 0) return;
    const props = checkpoints.map(cp => ({
      type: 'shrine_altar',
      x: cp.x + 20,
      y: cp.y + cp.height,
    }));
    environmentRenderer.drawDetails(this.ctx, props);
  }

  drawCheckpoint(checkpoint) {
    if (!checkpoint) return;
    this.drawCheckpoints([checkpoint]);
  }

  drawLighting(camera, level, player) {
    this.lighting.render(this.ctx, camera, level, player);
  }

  drawCinematic() {
    this.cinematic.draw(this.ctx);
  }

  drawGoal(goal, batboy) {
    const ctx = this.ctx;
    ctx.save();
    if (batboy) {
      batboy.draw(ctx);
    }
    ctx.restore();
  }

  drawSecretBanner(timer, title = '✨ SECRET DISCOVERY: SUNSTONE CANOPY SANCTUM (+500 PTS)') {
    if (timer <= 0) return;
    const ctx = this.ctx;
    ctx.save();
    const alpha = Math.min(1, timer / 0.5);
    ctx.globalAlpha = alpha;

    const bannerW = 880;
    const bannerH = 64;
    const bannerX = CANVAS_WIDTH / 2 - bannerW / 2;
    const bannerY = 110;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(bannerX, bannerY, bannerW, bannerH, 16);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#fde047';
    ctx.font = 'bold 20px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(title, CANVAS_WIDTH / 2, bannerY + bannerH / 2);

    ctx.restore();
  }

  drawShrineBanner(timer, title = '✨ THE ANCIENT SUNSTONE SHRINE AWAKENS') {
    if (timer <= 0) return;
    const ctx = this.ctx;
    ctx.save();
    const alpha = Math.min(1, timer / 0.5);
    ctx.globalAlpha = alpha;

    const bannerW = 880;
    const bannerH = 64;
    const bannerX = CANVAS_WIDTH / 2 - bannerW / 2;
    const bannerY = 110;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(bannerX, bannerY, bannerW, bannerH, 16);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#fde047';
    ctx.font = 'bold 20px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(title, CANVAS_WIDTH / 2, bannerY + bannerH / 2);

    ctx.restore();
  }

  /**
   * Visual Debug Mode Overlay (F2 toggle).
   */
  drawDebugVisual(fps, camera, level) {
    if (!this.debugVisual) return;

    const ctx = this.ctx;
    ctx.save();

    const panelW = 340;
    const panelH = 220;
    const panelX = 24;
    const panelY = 160;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(panelX, panelY, panelW, panelH, 10);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('📊 VISUAL PIPELINE DEBUG (F2)', panelX + 16, panelY + 26);

    ctx.fillStyle = '#fef08a';
    ctx.font = '12px monospace';
    let y = panelY + 52;
    const dy = 20;

    ctx.fillText(`FPS: ${fps || 60} (Target: 60)`, panelX + 16, y); y += dy;
    ctx.fillText(`Display: ${this.displayWidth}x${this.displayHeight} | DPR: ${this.dpr}`, panelX + 16, y); y += dy;
    ctx.fillText(`Logical Res: ${CANVAS_WIDTH}x${CANVAS_HEIGHT} (16:9)`, panelX + 16, y); y += dy;
    ctx.fillText(`Camera: X:${Math.round(camera ? camera.x : 0)} Y:${Math.round(camera ? camera.y : 0)} Zoom:${camera ? camera.zoomLevel.toFixed(2) : '1.00'}`, panelX + 16, y); y += dy;
    ctx.fillText(`Lighting: ${this.lighting.enabled ? 'ENABLED (2D Blend)' : 'DISABLED'}`, panelX + 16, y); y += dy;
    ctx.fillText(`Active Particles: ${level && level.particles ? level.particles.length : 0}`, panelX + 16, y); y += dy;
    ctx.fillText(`Loaded Assets: ${assetManager.images.size} cached`, panelX + 16, y); y += dy;

    ctx.restore();
  }
}
