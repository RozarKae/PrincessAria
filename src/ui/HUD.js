import { CANVAS_WIDTH } from '../game/Constants.js';

/**
 * ROYAL FANTASY HUD (Head-Up Display)
 * Authentic Project Aria UI:
 * - Hand-crafted Royal Obsidian header banner with warm golden filigree trim
 * - Clear, elegant storybook typography
 * - Left: Kingdom & Stage designation ("HONEYWOOD 1-1")
 * - Score counter ("SCORE 000000")
 * - Center: Floating multifaceted Royal Shard crystal with inner emerald droplet
 * - Right: Princess Aria's Royal Hearts (sculpted ruby gemstone hearts with gold bezels)
 */
export class HUD {
  constructor() {
    this.shardSpinTimer = 0;
    this.heartPulseTimer = 0;
  }

  update(dt) {
    this.shardSpinTimer += dt * 3.5;
    this.heartPulseTimer += dt * 3.0;
  }

  draw(ctx, gameState, options = {}) {
    const { letterboxHeight = 0 } = options;
    if (letterboxHeight >= 44) return;
    const hudAlpha = Math.max(0, 1 - (letterboxHeight / 36));

    ctx.save();
    ctx.globalAlpha = hudAlpha;

    const barHeight = 82;

    // 1. Royal Obsidian Header Bar
    const bgGrad = ctx.createLinearGradient(0, 0, 0, barHeight);
    bgGrad.addColorStop(0, 'rgba(15, 23, 42, 0.96)');
    bgGrad.addColorStop(0.7, 'rgba(18, 14, 28, 0.92)');
    bgGrad.addColorStop(1, 'rgba(9, 7, 18, 0.96)');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, CANVAS_WIDTH, barHeight);

    // Antique Royal Gold Trim Line
    const goldTrim = ctx.createLinearGradient(0, 0, CANVAS_WIDTH, 0);
    goldTrim.addColorStop(0, '#d97706');
    goldTrim.addColorStop(0.2, '#fbbf24');
    goldTrim.addColorStop(0.5, '#fef08a');
    goldTrim.addColorStop(0.8, '#fbbf24');
    goldTrim.addColorStop(1, '#d97706');
    ctx.fillStyle = goldTrim;
    ctx.fillRect(0, barHeight - 3, CANVAS_WIDTH, 3);

    // Delicate golden filigree bead accents along the border
    ctx.fillStyle = '#fde047';
    for (let bx = 80; bx < CANVAS_WIDTH; bx += 180) {
      ctx.beginPath();
      ctx.arc(bx, barHeight - 2, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.textBaseline = 'middle';

    // 2. Stage Designation (Left)
    ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#fbbf24';
    ctx.letterSpacing = '1px';
    ctx.fillText('KINGDOM', 60, 26);

    ctx.font = '900 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#f8fafc';
    ctx.fillText('HONEYWOOD', 60, 52);

    ctx.fillStyle = '#fbbf24';
    ctx.fillText('1-1', 236, 52);

    // Divider ornament
    ctx.fillStyle = 'rgba(251, 191, 36, 0.35)';
    ctx.fillRect(300, 22, 1, 36);

    // 3. Player Score
    ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#fbbf24';
    ctx.fillText('SCORE', 335, 26);

    ctx.font = 'bold 24px "Outfit", -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillStyle = '#f8fafc';
    const scoreStr = (gameState.score || 0).toString().padStart(6, '0');
    ctx.fillText(scoreStr, 335, 52);

    // 4. Royal Shards Counter (Center)
    const shardCenterX = CANVAS_WIDTH / 2 - 40;
    const shardCenterY = 40;

    ctx.save();
    ctx.translate(shardCenterX, shardCenterY);
    const spin = Math.cos(this.shardSpinTimer);
    ctx.scale(Math.abs(spin) < 0.12 ? 0.12 : spin, 1);

    // Radiant Gold Shard Crystal
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.lineTo(13, -4);
    ctx.lineTo(0, 0);
    ctx.lineTo(-13, -4);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.moveTo(-13, -4);
    ctx.lineTo(0, 0);
    ctx.lineTo(13, -4);
    ctx.lineTo(0, 18);
    ctx.closePath();
    ctx.fill();

    // Central Emerald Droplet Jewel
    ctx.fillStyle = '#0d9488';
    ctx.beginPath();
    ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#fbbf24';
    ctx.fillText('ROYAL SHARDS', shardCenterX + 28, 26);

    ctx.font = 'bold 24px "Outfit", -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillStyle = '#fde047';
    const shardsVal = (gameState.coins || 0).toString().padStart(2, '0');
    ctx.fillText('x ' + shardsVal, shardCenterX + 28, 52);

    // 5. Princess Aria Royal Hearts (Right)
    const livesX = CANVAS_WIDTH - 290;
    ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#fbbf24';
    ctx.fillText('ROYAL HEARTS', livesX, 26);

    const heartStartX = livesX;
    for (let i = 0; i < 3; i++) {
      const hx = heartStartX + i * 42 + 14;
      const hy = 50;
      const isAlive = i < gameState.lives;
      this.drawRoyalHeart(ctx, hx, hy, isAlive, i === gameState.lives - 1);
    }

    ctx.restore();
  }

  /**
   * Sculpted ruby gemstone heart with polished gold bezel.
   */
  drawRoyalHeart(ctx, x, y, isAlive, isLastHeart) {
    ctx.save();
    const size = 15;
    const pulse = isAlive && isLastHeart ? 1 + Math.sin(this.heartPulseTimer) * 0.08 : 1;
    ctx.translate(x, y);
    ctx.scale(pulse, pulse);

    if (isAlive) {
      // Golden Bezel Shadow
      ctx.fillStyle = '#b45309';
      this.buildHeartPath(ctx, 0, 1, size + 2);
      ctx.fill();

      // Polished Gold Outer Rim
      ctx.fillStyle = '#fbbf24';
      this.buildHeartPath(ctx, 0, 0, size + 1.5);
      ctx.fill();

      // Deep Ruby Gradient Core
      const rubyGrad = ctx.createRadialGradient(-3, -3, 2, 0, 0, size);
      rubyGrad.addColorStop(0, '#f87171');
      rubyGrad.addColorStop(0.4, '#ef4444');
      rubyGrad.addColorStop(0.85, '#b91c1c');
      rubyGrad.addColorStop(1, '#7f1d1d');
      ctx.fillStyle = rubyGrad;
      this.buildHeartPath(ctx, 0, 0, size);
      ctx.fill();

      // Curved Specular Gloss Highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
      ctx.beginPath();
      ctx.ellipse(-size * 0.35, -size * 0.25, size * 0.3, size * 0.15, -Math.PI / 4, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Depleted antique stone bezel with cracked center
      ctx.fillStyle = '#334155';
      this.buildHeartPath(ctx, 0, 0, size + 1);
      ctx.fill();

      ctx.fillStyle = '#1e293b';
      this.buildHeartPath(ctx, 0, 0, size - 1);
      ctx.fill();
    }

    ctx.restore();
  }

  buildHeartPath(ctx, ox, oy, s) {
    ctx.beginPath();
    const topCurve = s * 0.35;
    ctx.moveTo(ox, oy + topCurve);
    ctx.bezierCurveTo(ox, oy - s * 0.3, ox - s, oy - s * 0.3, ox - s, oy + topCurve);
    ctx.bezierCurveTo(ox - s, oy + (s + topCurve) / 2, ox, oy + s * 1.05, ox, oy + s * 1.05);
    ctx.bezierCurveTo(ox, oy + s * 1.05, ox + s, oy + (s + topCurve) / 2, ox + s, oy + topCurve);
    ctx.bezierCurveTo(ox + s, oy - s * 0.3, ox, oy - s * 0.3, ox, oy + topCurve);
    ctx.closePath();
  }
}
