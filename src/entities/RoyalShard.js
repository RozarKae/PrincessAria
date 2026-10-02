import { assetManager } from '../renderer/AssetManager.js';

/**
 * ROYAL SHARD
 * Canonical collectible for Princess Aria.
 * A luminous multifaceted golden crystal with an inner emerald royal emblem.
 * Features:
 * - Floating sine-wave bobbing
 * - 3D facet rotation shimmer
 * - Ambient golden glow and particle sparkle emission
 * - Spark burst on collection
 */
export class RoyalShard {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 40;
    this.height = 40;
    this.collected = false;

    this.rotationAngle = Math.random() * Math.PI * 2;
    this.bobTimer = Math.random() * Math.PI * 2;
    this.bobOffset = 0;
    this.sparkleTimer = Math.random();
  }

  update(dt, level) {
    if (this.collected) return;

    this.rotationAngle += dt * 3.8;
    this.bobTimer += dt * 2.8;
    this.bobOffset = Math.sin(this.bobTimer) * 6;

    // Periodic subtle sparkle emission
    this.sparkleTimer += dt;
    if (this.sparkleTimer > 0.45) {
      this.sparkleTimer = 0;
      if (level && level.addParticle) {
        const px = this.x + this.width / 2 + (Math.random() - 0.5) * 20;
        const py = this.y + this.height / 2 + this.bobOffset + (Math.random() - 0.5) * 20;
        level.spawnSparkles(px, py, 1);
      }
    }
  }

  getBounds() {
    return {
      x: this.x + 2,
      y: this.y + this.bobOffset + 2,
      width: this.width - 4,
      height: this.height - 4,
    };
  }

  draw(ctx) {
    if (this.collected) return;

    ctx.save();
    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2 + this.bobOffset;

    ctx.translate(centerX, centerY);

    // 1. Draw preloaded SVG asset if available
    const shardImg = assetManager.getImage('worlds/honeywood/collectibles/royal_shard');

    // 3D rotation projection factor (-1 to 1)
    const scaleX = Math.cos(this.rotationAngle);
    const absScaleX = Math.abs(scaleX) < 0.12 ? 0.12 : scaleX;
    ctx.scale(absScaleX, 1);

    if (shardImg && shardImg.complete) {
      ctx.drawImage(shardImg, -this.width / 2 - 8, -this.height / 2 - 8, this.width + 16, this.height + 16);
    } else {
      // Procedural Vector Fallback: Multifaceted Golden Crystal
      const rX = this.width / 2;
      const rY = this.height / 2;

      // Royal Amber & Gold Halo
      const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, rX * 1.6);
      glow.addColorStop(0, 'rgba(254, 240, 138, 0.9)');
      glow.addColorStop(0.4, 'rgba(251, 191, 36, 0.45)');
      glow.addColorStop(0.7, 'rgba(217, 119, 6, 0.2)');
      glow.addColorStop(1, 'rgba(217, 119, 6, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(0, 0, rX * 1.6, 0, Math.PI * 2);
      ctx.fill();

      // Delicate antique gold orbital stardust ring
      ctx.save();
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.5)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.ellipse(0, 0, rX * 1.25, rY * 0.4, Math.PI / 4, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Top Facets
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.moveTo(0, -rY);
      ctx.lineTo(rX * 0.7, -rY * 0.2);
      ctx.lineTo(0, 0);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.moveTo(0, -rY);
      ctx.lineTo(-rX * 0.7, -rY * 0.2);
      ctx.lineTo(0, 0);
      ctx.closePath();
      ctx.fill();

      // Bottom Facets
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-rX * 0.7, -rY * 0.2);
      ctx.lineTo(0, rY);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#d97706';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(rX * 0.7, -rY * 0.2);
      ctx.lineTo(0, rY);
      ctx.closePath();
      ctx.fill();

      // Inner Emerald Jewel Droplet
      ctx.fillStyle = '#0d9488';
      ctx.beginPath();
      ctx.arc(0, 0, 4, 0, Math.PI * 2);
      ctx.fill();

      // Specular Star
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(rX * 0.25, -rY * 0.45, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}
