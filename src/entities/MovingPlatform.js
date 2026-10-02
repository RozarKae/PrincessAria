import { environmentRenderer } from '../renderer/EnvironmentRenderer.js';

/**
 * MOVING PLATFORM
 * Supports:
 * - Moving wooden platforms
 * - Moving honey platforms
 * - Smooth sine-interpolated traversal between (startX, startY) and (endX, endY)
 * - Carries player and passengers by imparting horizontal and vertical velocity
 */
export class MovingPlatform {
  constructor(config) {
    this.startX = config.startX;
    this.startY = config.startY;
    this.endX = config.endX !== undefined ? config.endX : config.startX;
    this.endY = config.endY !== undefined ? config.endY : config.startY;
    this.width = config.width || 180;
    this.height = config.height || 36;
    this.type = config.type || 'moving_wood'; // 'moving_wood' | 'moving_honey' | 'moving_runestone'
    this.speed = config.speed || 1.2; // cycle frequency

    this.x = this.startX;
    this.y = this.startY;
    this.vx = 0;
    this.vy = 0;

    this.progress = 0;
    this.timer = config.phaseOffset || 0;
  }

  update(dt, player) {
    const prevX = this.x;
    const prevY = this.y;

    this.timer += dt * this.speed;
    // Normalized 0 to 1 smooth oscillation
    this.progress = (Math.sin(this.timer) + 1) / 2;

    this.x = this.startX + (this.endX - this.startX) * this.progress;
    this.y = this.startY + (this.endY - this.startY) * this.progress;

    this.vx = (this.x - prevX) / dt;
    this.vy = (this.y - prevY) / dt;

    // If player is standing on this platform, carry them along!
    if (player && player.isGrounded) {
      const pBounds = player.getBounds();
      const pBottom = player.y + player.height;
      if (
        player.x + player.width > this.x &&
        player.x < this.x + this.width &&
        Math.abs(pBottom - this.y) <= 6
      ) {
        player.x += this.vx * dt;
        player.y = this.y - player.height;
      }
    }
  }

  draw(ctx) {
    ctx.save();

    if (this.type === 'moving_runestone' || this.type === 'runestone' || this.type === 'stone') {
      environmentRenderer.render3SlicePlatform(ctx, this, environmentRenderer.assets.GAMEPLAY.SUNSTONE_SLAB);
    } else if (this.type === 'moving_honey' || this.type === 'honey' || this.type === 'amber') {
      environmentRenderer.render3SlicePlatform(ctx, this, environmentRenderer.assets.GAMEPLAY.AMBER_RAFT);
    } else {
      environmentRenderer.render3SlicePlatform(ctx, this, environmentRenderer.assets.GAMEPLAY.OAK_BOUGH);
    }

    ctx.restore();
  }
}

