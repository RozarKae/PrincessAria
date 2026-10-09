import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../game/Constants.js';

/**
 * HIGH-DEFINITION 2D CINEMATIC CAMERA
 * Features:
 * - Smooth horizontal lookahead tracking with facing bias
 * - Subtle dampened vertical tracking with vertical dead-zone
 * - Controlled screen shake with configurable intensity, duration, and decay
 * - Dynamic zoom in/out with smooth interpolation
 * - Scripted cinematic focus (camera.focus) and panning (camera.pan)
 * - Level boundary clamping
 */
export class Camera {
  constructor() {
    this.x = 0;
    this.y = 0;
    // World viewport corresponding to 256x240 internal canvas:
    // 256 * 4.5 = 1152, 240 * 4.5 = 1080.
    this.width = 1152;
    this.height = 1080;

    // Smoothing & Tracking
    this.lerpSpeedX = 0.09;
    this.lerpSpeedY = 0.05;
    this.lookaheadDist = 70;
    this.targetX = 0;
    this.targetY = 0;

    // Vertical dead-zone thresholds (stable vertical camera)
    this.deadZoneTop = 280;
    this.deadZoneBottom = 800;

    // Screen Shake System
    this.shakeDuration = 0;
    this.shakeIntensity = 0;
    this.shakeDecay = 0.92;

    // Cinematic & Zoom System
    this.zoomLevel = 1.0;
    this.targetZoom = 1.0;
    this.zoomSpeed = 2.0;

    this.isCinematic = false;
    this.cinematicTarget = null;
    this.panTarget = null;
    this.panSpeed = 400;
    this.onPanComplete = null;
  }

  /**
   * Instantly snap camera center to target world coordinates without lerp.
   */
  focusInstantly(targetX, targetY) {
    this.x = Math.max(0, targetX - this.width / 2);
    this.y = Math.max(0, targetY - this.height / 2);
    this.targetX = this.x;
    this.targetY = this.y;
    this.isCinematic = true;
    this.cinematicTarget = { x: targetX, y: targetY };
    this.panTarget = null;
  }

  /**
   * Reset cinematic overrides and restore normal camera tracking.
   */
  resetCinematic(player = null) {
    this.isCinematic = false;
    this.cinematicTarget = null;
    this.panTarget = null;
    this.onPanComplete = null;
    this.targetZoom = 1.0;
    this.zoomLevel = 1.0;
    if (player) {
      const facingOffset = (player.facing || 1) * this.lookaheadDist;
      this.targetX = player.x + player.width / 2 - this.width / 2 + facingOffset;
      this.targetY = player.y + player.height / 2 - this.height / 2;
      this.x = this.targetX;
      this.y = this.targetY;
    }
  }

  /**
   * Set temporary cinematic focus on a specific world point.
   */
  focus(targetX, targetY, duration = 2.0) {
    this.isCinematic = true;
    this.cinematicTarget = { x: targetX, y: targetY };
    if (duration > 0) {
      setTimeout(() => {
        this.isCinematic = false;
        this.cinematicTarget = null;
      }, duration * 1000);
    }
  }

  /**
   * Smoothly pan camera toward a target coordinate.
   */
  pan(targetX, targetY, speed = 400, onComplete = null) {
    this.isCinematic = true;
    this.panTarget = { x: targetX, y: targetY };
    this.panSpeed = speed;
    this.onPanComplete = onComplete;
  }

  /**
   * Adjust camera zoom smoothly.
   * e.g., 1.15 for dramatic close-ups, 0.9 for wide boss arenas.
   */
  zoom(targetZoom, duration = 0.5) {
    this.targetZoom = targetZoom;
    this.zoomSpeed = Math.abs(targetZoom - this.zoomLevel) / Math.max(0.01, duration);
  }

  /**
   * Controlled screen shake.
   * @param {number} intensity Max displacement in pixels
   * @param {number} duration Total duration in seconds
   * @param {number} decay Decay rate multiplier per frame
   */
  shake(intensity = 10, duration = 0.2, decay = 0.92) {
    this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
    this.shakeDuration = Math.max(this.shakeDuration, duration);
    this.shakeDecay = decay;
  }

  update(player, levelWidth, dt, levelHeight = 1080) {
    // 1. Zoom Interpolation
    if (this.zoomLevel !== this.targetZoom) {
      const zoomDiff = this.targetZoom - this.zoomLevel;
      const step = Math.sign(zoomDiff) * this.zoomSpeed * dt;
      if (Math.abs(step) >= Math.abs(zoomDiff)) {
        this.zoomLevel = this.targetZoom;
      } else {
        this.zoomLevel += step;
      }
    }

    // 2. Cinematic Panning
    if (this.panTarget) {
      const dx = this.panTarget.x - this.width / 2 - this.x;
      const dy = this.panTarget.y - this.height / 2 - this.y;
      const dist = Math.hypot(dx, dy);

      if (dist < 10) {
        this.panTarget = null;
        if (this.onPanComplete) {
          const cb = this.onPanComplete;
          this.onPanComplete = null;
          cb();
        }
      } else {
        this.x += (dx / dist) * this.panSpeed * dt;
        this.y += (dy / dist) * this.panSpeed * dt;
      }
    } else if (this.isCinematic && this.cinematicTarget) {
      this.targetX = this.cinematicTarget.x - this.width / 2;
      this.targetY = this.cinematicTarget.y - this.height / 2;
      this.x += (this.targetX - this.x) * this.lerpSpeedX;
      this.y += (this.targetY - this.y) * this.lerpSpeedY;
    } else if (player) {
      // 3. Normal Gameplay Tracking with Facing Lookahead
      const facingOffset = (player.facing || 1) * this.lookaheadDist;
      this.targetX = player.x + player.width / 2 - this.width / 2 + facingOffset;

      const playerCenterY = player.y + player.height / 2;
      const screenRelY = playerCenterY - this.y;

      if (screenRelY < this.deadZoneTop) {
        this.targetY = playerCenterY - this.deadZoneTop;
      } else if (screenRelY > this.deadZoneBottom) {
        this.targetY = playerCenterY - this.deadZoneBottom;
      }

      this.x += (this.targetX - this.x) * this.lerpSpeedX;
      this.y += (this.targetY - this.y) * this.lerpSpeedY;
    }

    // 4. Level Boundary Clamping
    const maxX = Math.max(0, levelWidth - this.width);
    const maxY = Math.max(0, levelHeight - this.height);

    if (this.x < 0) this.x = 0;
    if (this.x > maxX) this.x = maxX;
    if (this.y < 0) this.y = 0;
    if (this.y > maxY) this.y = maxY;

    // 5. Screen Shake Decay
    if (this.shakeDuration > 0) {
      this.shakeDuration -= dt;
      this.shakeIntensity *= this.shakeDecay;
      if (this.shakeDuration <= 0 || this.shakeIntensity < 0.2) {
        this.shakeIntensity = 0;
        this.shakeDuration = 0;
      }
    }
  }

  getShakeOffset() {
    if (this.shakeDuration <= 0) return { x: 0, y: 0 };
    return {
      x: (Math.random() - 0.5) * 2 * this.shakeIntensity,
      y: (Math.random() - 0.5) * 2 * this.shakeIntensity,
    };
  }
}
