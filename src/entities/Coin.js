/**
 * Collectible coin with pseudo-3D spinning projection and shiny gold finish.
 */
export class Coin {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 44;
    this.height = 44;
    this.collected = false;
    this.rotationAngle = Math.random() * Math.PI * 2;
    this.bobTimer = Math.random() * Math.PI * 2;
    this.bobOffset = 0;
  }

  update(dt) {
    if (this.collected) return;
    this.rotationAngle += dt * 4.5;
    this.bobTimer += dt * 3.0;
    this.bobOffset = Math.sin(this.bobTimer) * 6;
  }

  getBounds() {
    return {
      x: this.x + 4,
      y: this.y + this.bobOffset + 4,
      width: this.width - 8,
      height: this.height - 8,
    };
  }

  draw(ctx) {
    if (this.collected) return;

    ctx.save();
    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2 + this.bobOffset;

    ctx.translate(centerX, centerY);

    // 3D rotation projection factor (-1 to 1)
    const scaleX = Math.cos(this.rotationAngle);
    ctx.scale(Math.abs(scaleX) < 0.05 ? 0.05 : scaleX, 1);

    const radiusX = this.width / 2;
    const radiusY = this.height / 2;

    // Outer golden rim
    const rimGrad = ctx.createLinearGradient(-radiusX, -radiusY, radiusX, radiusY);
    rimGrad.addColorStop(0, '#ffe875');
    rimGrad.addColorStop(0.5, '#f59e0b');
    rimGrad.addColorStop(1, '#b45309');

    ctx.fillStyle = rimGrad;
    ctx.beginPath();
    ctx.ellipse(0, 0, radiusX, radiusY, 0, 0, Math.PI * 2);
    ctx.fill();

    // Inner coin face
    const faceGrad = ctx.createRadialGradient(0, -radiusY * 0.3, 2, 0, 0, radiusX * 0.85);
    faceGrad.addColorStop(0, '#fef08a');
    faceGrad.addColorStop(0.6, '#fbbf24');
    faceGrad.addColorStop(1, '#d97706');

    ctx.fillStyle = faceGrad;
    ctx.beginPath();
    ctx.ellipse(0, 0, radiusX * 0.78, radiusY * 0.78, 0, 0, Math.PI * 2);
    ctx.fill();

    // Inner engraved diamond/star emblem
    ctx.fillStyle = '#fffbeb';
    ctx.beginPath();
    ctx.moveTo(0, -radiusY * 0.45);
    ctx.lineTo(radiusX * 0.35, 0);
    ctx.lineTo(0, radiusY * 0.45);
    ctx.lineTo(-radiusX * 0.35, 0);
    ctx.closePath();
    ctx.fill();

    // Specular highlight gloss
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.beginPath();
    ctx.ellipse(0, -radiusY * 0.38, radiusX * 0.5, radiusY * 0.22, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
