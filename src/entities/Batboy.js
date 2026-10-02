/**
 * BATBOY
 * Mysterious heroic character who previously saved Princess Aria.
 * Currently captured by the Gigantic Queen Bee inside a honeycomb cage.
 */
export class Batboy {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 60;
    this.height = 80;
    this.isRescued = false;
    this.timer = 0;
  }

  update(dt) {
    this.timer += dt;
  }

  draw(ctx) {
    ctx.save();
    const centerX = this.x + this.width / 2;
    const bottomY = this.y + this.height;

    ctx.translate(centerX, bottomY);

    const capeGrad = ctx.createLinearGradient(0, -70, 0, 0);
    capeGrad.addColorStop(0, '#1e1b4b');
    capeGrad.addColorStop(1, '#020617');

    ctx.fillStyle = capeGrad;
    ctx.beginPath();
    ctx.moveTo(-22, -60);
    ctx.lineTo(22, -60);
    ctx.lineTo(28, -6);
    ctx.quadraticCurveTo(14, -16, 0, -6);
    ctx.quadraticCurveTo(-14, -16, -28, -6);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.moveTo(0, -48);
    ctx.lineTo(10, -38);
    ctx.lineTo(0, -32);
    ctx.lineTo(-10, -38);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-16, -10, 12, 10);
    ctx.fillRect(4, -10, 12, 10);

    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(0, -64, 18, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(-16, -68);
    ctx.lineTo(-22, -88);
    ctx.lineTo(-8, -78);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(16, -68);
    ctx.lineTo(22, -88);
    ctx.lineTo(8, -78);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.ellipse(5, -64, 6, 3, -0.1, 0, Math.PI * 2);
    ctx.fill();

    if (!this.isRescued) {
      const cageBob = Math.sin(this.timer * 3) * 4;
      ctx.translate(0, cageBob);

      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 4;

      const radius = 48;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i;
        const hx = Math.cos(angle) * radius;
        const hy = -44 + Math.sin(angle) * (radius * 1.1);
        if (i === 0) ctx.moveTo(hx, hy);
        else ctx.lineTo(hx, hy);
      }
      ctx.closePath();
      ctx.stroke();

      ctx.fillStyle = 'rgba(251, 191, 36, 0.25)';
      ctx.fill();

      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, -96);
      ctx.lineTo(0, -180);
      ctx.stroke();
    }

    ctx.restore();
  }
}
