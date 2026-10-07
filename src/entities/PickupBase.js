import { Particle } from './Particle.js';

export class PickupBase {
  constructor(x, y, w = 28, h = 28) {
    this.x = x;
    this.y = y;
    this.width = w;
    this.height = h;
    this.collected = false;
    this.floatTimer = Math.random() * Math.PI * 2;
  }

  update(dt, level) {
    this.floatTimer += dt * 2.2;
    this.yOffset = Math.sin(this.floatTimer) * 6;
  }

  getBounds() {
    return { x: this.x + 2, y: this.y + (this.yOffset || 0) + 2, width: this.width - 4, height: this.height - 4 };
  }

  onCollect(player, level, gameState, audio) {
    this.collected = true;
    level.spawnSparkles(this.x + this.width / 2, this.y + this.height / 2, 12);
    if (audio && audio.playCollect) audio.playCollect();
  }

  draw(ctx) {
    if (this.collected) return;
    ctx.save();
    const yOff = this.yOffset || 0;
    ctx.translate(this.x + this.width / 2, this.y + this.height / 2 + yOff);
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(0, 0, Math.min(this.width, this.height) / 2 - 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
