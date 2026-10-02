/**
 * Lightweight particle effect system for dust, sparkles, and impacts.
 */
export class Particle {
  constructor(x, y, vx, vy, type = 'dust', color = '#ffffff', maxLife = 0.4, size = 6) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.type = type;
    this.color = color;
    this.maxLife = maxLife;
    this.life = maxLife;
    this.size = size;
    this.isDead = false;
  }

  update(dt) {
    this.life -= dt;
    if (this.life <= 0) {
      this.isDead = true;
      return;
    }

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    if (this.type === 'dust') {
      this.vx *= 0.92;
      this.vy *= 0.92;
    } else if (this.type === 'burst' || this.type === 'sparkle') {
      this.vy += 600 * dt; // slight gravity
      this.vx *= 0.96;
    }
  }

  draw(ctx) {
    const progress = this.life / this.maxLife; // 1 to 0
    ctx.save();
    ctx.globalAlpha = Math.max(0, progress);

    if (this.type === 'dust') {
      const currentRadius = this.size * (1 + (1 - progress) * 1.5);
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, currentRadius, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.type === 'sparkle') {
      const s = this.size * progress;
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y - s * 1.6);
      ctx.lineTo(this.x + s, this.y);
      ctx.lineTo(this.x, this.y + s * 1.6);
      ctx.lineTo(this.x - s, this.y);
      ctx.closePath();
      ctx.fill();
    } else {
      // Impact burst shard
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size * progress, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}
