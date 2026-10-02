/**
 * HDCharacterRenderer.js
 * 
 * Decoupled, Production-Quality Rendering Pipeline for 2D Illustrated Characters.
 * Supports:
 * - METHOD A: Layered 2D Character Rig (CharacterRig hierarchy with independent parts)
 * - METHOD B: Artist-Created Frame Sequences (PNG/WebP/SVG transparent illustrations)
 * - Dynamic Physical Ground Shadow (landing response squash, jump height scaling & diffusion)
 * - Directional flipping, squash & stretch, and invulnerability hit effects
 * - Production Mode with clear distinction between Temporary Placeholder and Illustrated Art
 */

export const RENDER_MODES = {
  DEV_FALLBACK: 'DEV_FALLBACK',   // Archived procedural art with explicit dev watermark
  RIG: 'RIG',                     // Method A: Hierarchical Layered 2D Character Rig
  FRAME_SEQUENCE: 'FRAME_SEQUENCE'// Method B: High-res illustrated PNG/WebP frame sequence
};

export class HDCharacterRenderer {
  constructor() {
    this.renderWidth = 138;   // Visual rendered width in HD logical pixels
    this.renderHeight = 138;  // Visual rendered height in HD logical pixels
    
    // Default to RIG for authentic approved illustrated Princess Aria character pipeline
    this.renderMode = RENDER_MODES.RIG;
  }

  /**
   * Cycle rendering mode for testing on the fly (Key F2).
   */
  cycleRenderMode() {
    const modes = [
      RENDER_MODES.RIG,
      RENDER_MODES.FRAME_SEQUENCE,
      RENDER_MODES.DEV_FALLBACK
    ];
    const currentIndex = modes.indexOf(this.renderMode);
    this.renderMode = modes[(currentIndex + 1) % modes.length];
    console.log(`[HDCharacterRenderer] Active Render Mode: ${this.renderMode}`);
    return this.renderMode;
  }

  /**
   * Render an animated character.
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} x World X position (top-left of physical bounds)
   * @param {number} y World Y position (top-left of physical bounds)
   * @param {number} width Physical collider width
   * @param {number} height Physical collider height
   * @param {Object} frame Frame descriptor from AnimationController.getCurrentFrame()
   * @param {Object} options Render options (isHurt, invulnerable, showDebug, shadow, groundDistance)
   */
  draw(ctx, x, y, width, height, frame, options = {}) {
    if (!frame) return;

    const {
      isInvulnerable = false,
      invulnerabilityTimer = 0,
      showDebug = false,
      drawShadow = true,
      groundDistance = 0,
      isLanding = false,
      customAlpha = 1.0,
      rig = options.rig || frame.frameData?.rig
    } = options;

    // Fixed: Invulnerability Celestial Shimmer (Aria is ALWAYS readable on frame 0, never invisible!)
    let invulnAlpha = 1.0;
    if (isInvulnerable && invulnerabilityTimer > 0) {
      invulnAlpha = 0.65 + 0.35 * Math.sin(invulnerabilityTimer * 24);
    }

    const centerX = x + width / 2;
    const bottomY = y + height;

    // --- 1. SEPARATE DYNAMIC PHYSICAL GROUND SHADOW ---
    if (drawShadow) {
      this.drawShadow(
        ctx,
        centerX,
        bottomY + groundDistance,
        width,
        groundDistance,
        isLanding,
        frame.scaleX || 1
      );
    }

    ctx.save();

    // High-definition smooth sampling
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.globalAlpha = (customAlpha !== undefined ? customAlpha : 1.0) * invulnAlpha;

    ctx.translate(centerX, bottomY);

    // Apply facing direction flip and squash & stretch
    const scaleX = (frame.facing || 1) * (frame.scaleX || 1);
    const scaleY = frame.scaleY || 1;
    ctx.scale(scaleX, scaleY);

    const anchorX = frame.anchorX !== undefined ? frame.anchorX : 0.5;
    const anchorY = frame.anchorY !== undefined ? frame.anchorY : 1.0;

    const drawW = this.renderWidth;
    const drawH = this.renderHeight;
    const drawX = -drawW * anchorX;
    const drawY = -drawH * anchorY;

    // --- 2. RENDER ACCORDING TO ACTIVE PIPELINE ---

    // A. APPROVED ILLUSTRATED 2D RIG PIPELINE (Primary Production Path)
    if (this.renderMode === RENDER_MODES.RIG || (!frame.frameData && rig)) {
      if (rig) {
        rig.draw(ctx, { testMode: showDebug });
      }
    }
    // B. DEV FALLBACK / ALTERNATE SEQUENCES
    else if (this.renderMode === RENDER_MODES.DEV_FALLBACK) {
      let frameImage = null;
      if (frame.type === 'frame_sequence' && frame.frameData) {
        frameImage = frame.frameData;
      }
      if (frameImage && (frameImage.complete || frameImage instanceof HTMLCanvasElement)) {
        ctx.drawImage(frameImage, drawX, drawY, drawW, drawH);
      } else if (rig) {
        rig.draw(ctx, { testMode: showDebug });
      }
    }
    else {
      // FRAME_SEQUENCE mode
      let frameImage = frame.frameData;
      if (frameImage && (frameImage.complete || frameImage instanceof HTMLCanvasElement)) {
        ctx.drawImage(frameImage, drawX, drawY, drawW, drawH);
      } else if (rig) {
        rig.draw(ctx, { testMode: showDebug });
      }
    }

    ctx.restore();

    // --- 3. DISCREET TEMPORARY ASSET WATERMARK (Debug only) ---
    if (showDebug && this.renderMode === RENDER_MODES.DEV_FALLBACK && !options.suppressWatermark) {
      ctx.save();
      ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
      const text = '[DEV FALLBACK: PROCEDURAL ART]';
      ctx.font = '900 10px sans-serif';
      const textWidth = ctx.measureText(text).width;
      ctx.fillRect(centerX - textWidth / 2 - 4, y - 18, textWidth + 8, 14);
      ctx.fillStyle = '#fbbf24';
      ctx.textAlign = 'center';
      ctx.fillText(text, centerX, y - 7);
      ctx.restore();
    } else if (showDebug && this.renderMode === RENDER_MODES.RIG) {
      ctx.save();
      ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
      const text = '[2D RIG PIPELINE]';
      ctx.font = '900 10px sans-serif';
      const textWidth = ctx.measureText(text).width;
      ctx.fillRect(centerX - textWidth / 2 - 4, y - 18, textWidth + 8, 14);
      ctx.fillStyle = '#38bdf8';
      ctx.textAlign = 'center';
      ctx.fillText(text, centerX, y - 7);
      ctx.restore();
    }

    // --- 4. OPTIONAL DEBUG COLLIDER & ANCHOR OVERLAY ---
    if (showDebug) {
      ctx.save();
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, width, height);

      // Pivot Point (Ground Anchor)
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(centerX, bottomY, 4, 0, Math.PI * 2);
      ctx.fill();

      // State label
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 12px monospace';
      ctx.fillText(`${frame.animationName} [${frame.frameIndex + 1}/${frame.totalFrames}]`, x, y - 8);

      ctx.restore();
    }
  }

  /**
   * Draw a realistic physical soft ground contact shadow.
   * Handles:
   * - Soft ground contact gradient
   * - Landing shadow response (squashes wider horizontally with impact)
   * - Jump shadow scaling (shrinks and diffuses as altitude increases)
   */
  drawShadow(ctx, footX, groundY, bodyWidth, groundDistance = 0, isLanding = false, scaleX = 1) {
    ctx.save();
    ctx.translate(footX, groundY);

    // 1. Landing Response: Horizontal expansion & flattening
    const landingMultiplier = isLanding ? 1.35 : Math.max(0.9, scaleX);

    // 2. Jump Altitude Scaling: Shadow shrinks and fades with elevation
    const heightFactor = Math.max(0, Math.min(1, groundDistance / 450));
    const shadowScale = Math.max(0.28, (1 - heightFactor * 0.68) * landingMultiplier);
    const shadowAlpha = Math.max(0.08, (1 - heightFactor * 0.75) * (isLanding ? 0.55 : 0.42));

    const shadowRadiusX = bodyWidth * 0.7 * shadowScale;
    const shadowRadiusY = Math.max(3, 8 * shadowScale * (isLanding ? 0.75 : 1.0));

    const shadowGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, shadowRadiusX);
    shadowGrad.addColorStop(0, `rgba(2, 6, 23, ${shadowAlpha})`);
    shadowGrad.addColorStop(0.55, `rgba(2, 6, 23, ${shadowAlpha * 0.45})`);
    shadowGrad.addColorStop(1, 'rgba(2, 6, 23, 0)');

    ctx.fillStyle = shadowGrad;
    ctx.beginPath();
    ctx.ellipse(0, 0, shadowRadiusX, shadowRadiusY, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

export const characterRenderer = new HDCharacterRenderer();
if (typeof window !== 'undefined') {
  window.characterRenderer = characterRenderer;
}
