import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../game/Constants.js';

/**
 * CINEMATIC SYSTEM
 * Manages cinematic letterbox bars, smooth screen fades, character focus, and timed narrative events.
 */
export class CinematicSystem {
  constructor() {
    this.letterboxHeight = 0;
    this.targetLetterboxHeight = 0;
    this.letterboxSpeed = 220; // px/sec

    // Screen Fade
    this.fadeAlpha = 0;
    this.targetFadeAlpha = 0;
    this.fadeSpeed = 2.0;
    this.fadeColor = '#000000';
    this.onFadeComplete = null;

    // Active Sequence
    this.activeSequence = null;
    this.sequenceTimer = 0;
  }

  /**
   * Slide cinematic letterbox bars in or out.
   * @param {boolean} active 
   * @param {number} barHeight Height of each black bar in pixels (default 80px)
   */
  setLetterbox(active, barHeight = 84) {
    this.targetLetterboxHeight = active ? barHeight : 0;
  }

  /**
   * Fade screen in from black.
   */
  fadeIn(duration = 0.5, color = '#000000') {
    this.fadeColor = color;
    this.fadeAlpha = 1.0;
    this.targetFadeAlpha = 0.0;
    this.fadeSpeed = 1.0 / Math.max(0.01, duration);
  }

  /**
   * Fade screen out to black or amber.
   */
  fadeOut(duration = 0.5, color = '#000000', onComplete = null) {
    this.fadeColor = color;
    this.fadeAlpha = 0.0;
    this.targetFadeAlpha = 1.0;
    this.fadeSpeed = 1.0 / Math.max(0.01, duration);
    this.onFadeComplete = onComplete;
  }

  update(dt) {
    // 1. Letterbox slide interpolation
    if (this.letterboxHeight !== this.targetLetterboxHeight) {
      const diff = this.targetLetterboxHeight - this.letterboxHeight;
      const step = Math.sign(diff) * this.letterboxSpeed * dt;
      if (Math.abs(step) >= Math.abs(diff)) {
        this.letterboxHeight = this.targetLetterboxHeight;
      } else {
        this.letterboxHeight += step;
      }
    }

    // 2. Fade interpolation
    if (this.fadeAlpha !== this.targetFadeAlpha) {
      const diff = this.targetFadeAlpha - this.fadeAlpha;
      const step = Math.sign(diff) * this.fadeSpeed * dt;
      if (Math.abs(step) >= Math.abs(diff)) {
        this.fadeAlpha = this.targetFadeAlpha;
        if (this.fadeAlpha === this.targetFadeAlpha && this.onFadeComplete) {
          const cb = this.onFadeComplete;
          this.onFadeComplete = null;
          cb();
        }
      } else {
        this.fadeAlpha += step;
      }
    }
  }

  /**
   * Draw cinematic letterbox bars and fade overlay.
   */
  draw(ctx) {
    ctx.save();

    // 1. Draw Sliding Letterbox Bars
    if (this.letterboxHeight > 0) {
      ctx.fillStyle = '#09090b';
      // Top bar
      ctx.fillRect(0, 0, CANVAS_WIDTH, this.letterboxHeight);
      // Bottom bar
      ctx.fillRect(0, CANVAS_HEIGHT - this.letterboxHeight, CANVAS_WIDTH, this.letterboxHeight);

      // Gold filigree border on letterbox edge
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(0, this.letterboxHeight - 2, CANVAS_WIDTH, 2);
      ctx.fillRect(0, CANVAS_HEIGHT - this.letterboxHeight, CANVAS_WIDTH, 2);
    }

    // 2. Draw Screen Fade Overlay
    if (this.fadeAlpha > 0) {
      ctx.globalAlpha = this.fadeAlpha;
      ctx.fillStyle = this.fadeColor;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }

    ctx.restore();
  }
}
