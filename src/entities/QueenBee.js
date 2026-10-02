import { assetManager } from '../renderer/AssetManager.js';

/**
 * GIGANTIC EVIL QUEEN BEE
 * Primary antagonist who captured Batboy.
 * Authored high-definition visual presentation:
 * - Full-resolution monarch SVG illustration with royal obsidian carapace, velvet drapery, and golden veins
 * - Glowing ruby compound eyes with hypnotic pulsing
 * - Subtle aerodynamic wing flap and ambient hovering oscillation
 * - Corrupted amber & royal crimson energy aura
 */
export class QueenBee {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 440;
    this.height = 352;
    this.timer = 0;
  }

  update(dt) {
    this.timer += dt;
  }

  draw(ctx) {
    ctx.save();
    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2;
    const hoverY = Math.sin(this.timer * 2.2) * 12;

    ctx.translate(centerX, centerY + hoverY);

    // Subtle breathing / wing flap scaling
    const wingFlap = 1 + Math.sin(this.timer * 14) * 0.035;
    ctx.scale(1, wingFlap);

    // Corrupted Royal Amber & Burgundy Aura
    const auraGrad = ctx.createRadialGradient(0, 0, 50, 0, 0, 220);
    auraGrad.addColorStop(0, 'rgba(245, 158, 11, 0.28)');
    auraGrad.addColorStop(0.45, 'rgba(185, 28, 28, 0.16)');
    auraGrad.addColorStop(0.8, 'rgba(69, 10, 10, 0.08)');
    auraGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 220, 0, Math.PI * 2);
    ctx.fill();

    // 1. Draw High-Definition Monarch Queen Bee Asset
    const monarchImg = assetManager.getImage('worlds/honeywood/effects/queen_bee_monarch');
    if (monarchImg && monarchImg.complete) {
      ctx.drawImage(monarchImg, -this.width / 2, -this.height / 2, this.width, this.height);
    } else {
      // Elegant vector silhouette fallback if still decoding
      ctx.fillStyle = '#180d04';
      ctx.beginPath();
      ctx.ellipse(0, 10, 110, 130, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. Overlay Glowing Ruby/Amber Compound Eyes
    const eyeImg = assetManager.getImage('worlds/honeywood/effects/queen_bee_eyes');
    const eyePulse = 0.88 + Math.sin(this.timer * 4.0) * 0.12;
    if (eyeImg && eyeImg.complete) {
      ctx.save();
      ctx.globalAlpha = eyePulse;
      ctx.shadowColor = '#dc2626';
      ctx.shadowBlur = 16;
      ctx.drawImage(eyeImg, -55, -42, 110, 58);
      ctx.restore();
    }

    ctx.restore();
  }
}
