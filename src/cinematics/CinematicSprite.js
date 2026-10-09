import { pixelAriaRenderer } from '../renderer/PixelCharacterRenderer.js';
import { WORLD_TO_PIXEL } from '../renderer/PixelPalette.js';

/**
 * CinematicSprite.js
 * 
 * Authored pixel-art animated sprite abstraction for Project Aria cinematics.
 * 
 * Supports:
 * - Frame-based animation with deterministic FPS timing
 * - Direct binding to PixelCharacterRenderer cached frames (Aria idle, walk, jump, land, victory, etc.)
 * - Direct custom pixel-art drawing callbacks
 * - Depth ordering (zIndex)
 * - Layered transforms: position (world or screen), facing direction, scale, opacity, visibility
 * - Clean pixel-grid raster alignment (nearest-neighbor, integer rounding)
 */
export class CinematicSprite {
  constructor(options = {}) {
    this.name = options.name || 'sprite';
    this.frames = options.frames || ['idle_0'];
    this.fps = options.fps || 8;
    this.loop = options.loop !== undefined ? options.loop : true;
    this.currentFrameIndex = 0;
    this.frameTimer = 0;

    // Transforms
    this.x = options.x || 0;
    this.y = options.y || 0;
    this.worldSpace = options.worldSpace !== undefined ? options.worldSpace : true;
    this.facing = options.facing !== undefined ? options.facing : 1;
    this.opacity = options.opacity !== undefined ? options.opacity : 1.0;
    this.visible = options.visible !== undefined ? options.visible : true;
    this.zIndex = options.zIndex || 0;

    // Dimensions (default Aria sprite: 16x22)
    this.width = options.width || 16;
    this.height = options.height || 22;
    this.anchorX = options.anchorX !== undefined ? options.anchorX : 0.5;
    this.anchorY = options.anchorY !== undefined ? options.anchorY : 1.0;

    // Optional custom draw callback
    this.customDraw = options.customDraw || null;

    // Callbacks
    this.onFrameChange = options.onFrameChange || null;
    this.onComplete = options.onComplete || null;
    this.isFinished = false;
  }

  setAnimation(frames, fps = 8, loop = true) {
    if (this.frames === frames) return;
    this.frames = frames;
    this.fps = fps;
    this.loop = loop;
    this.currentFrameIndex = 0;
    this.frameTimer = 0;
    this.isFinished = false;
  }

  get currentFrameKey() {
    if (!this.frames || this.frames.length === 0) return 'idle_0';
    return this.frames[this.currentFrameIndex % this.frames.length];
  }

  update(dt) {
    if (!this.visible || this.isFinished) return;
    if (this.frames.length <= 1) return;

    this.frameTimer += dt;
    const frameDuration = 1 / Math.max(1, this.fps);

    if (this.frameTimer >= frameDuration) {
      this.frameTimer -= frameDuration;
      const nextIndex = this.currentFrameIndex + 1;

      if (nextIndex >= this.frames.length) {
        if (this.loop) {
          this.currentFrameIndex = 0;
        } else {
          this.currentFrameIndex = this.frames.length - 1;
          this.isFinished = true;
          if (this.onComplete) this.onComplete(this);
        }
      } else {
        this.currentFrameIndex = nextIndex;
      }

      if (this.onFrameChange) {
        this.onFrameChange(this.currentFrameKey, this.currentFrameIndex);
      }
    }
  }

  draw(ctx, camX = 0, camY = 0) {
    if (!this.visible || this.opacity <= 0) return;

    // Convert to screen coordinates on 320x240 raster grid
    let scrX = this.x;
    let scrY = this.y;

    if (this.worldSpace) {
      scrX = (this.x - camX) * WORLD_TO_PIXEL;
      scrY = (this.y - camY) * WORLD_TO_PIXEL;
    }

    // Offset by anchor
    const renderX = Math.round(scrX - this.width * this.anchorX);
    const renderY = Math.round(scrY - this.height * this.anchorY);

    if (this.customDraw) {
      this.customDraw(ctx, renderX, renderY, this);
      return;
    }

    // Draw authored pixel-art frame via pixelAriaRenderer
    pixelAriaRenderer.drawFrame(
      ctx,
      renderX,
      renderY,
      this.currentFrameKey,
      this.facing,
      this.opacity
    );
  }
}
