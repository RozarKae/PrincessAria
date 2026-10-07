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

    const isWorld6 = gameState && gameState.world === 6;
    const isWorld5 = gameState && gameState.world === 5;
    const isWorld4 = gameState && gameState.world === 4;
    const isWorld3 = gameState && gameState.world === 3;
    const isWorld2 = gameState && gameState.world === 2;
    const kingdomName = isWorld6 ? 'CLOCKWORK'
      : (isWorld5 ? 'SANDWICH'
      : (isWorld4 ? 'VOLCANO'
      : (isWorld3 ? 'CASTLE'
      : (isWorld2 ? 'FOREST' : 'HONEYWOOD'))));
    const stageStr = `${gameState?.world || 1}-${gameState?.level || 1}`;

    ctx.font = '900 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#f8fafc';
    ctx.fillText(kingdomName, 60, 52);

    ctx.fillStyle = '#fbbf24';
    ctx.fillText(stageStr, 236, 52);

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

    // 5. Right-side compact status bars: HP / SUPER / SLIZE / SHIELD
    const rightX = CANVAS_WIDTH - 330;
    ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#fbbf24';
    ctx.fillText('STATUS', rightX, 26);

    // compact symbol + bar layout that uses available top bar space
    const barY = 34;
    const rowH = 16;
    const symW = 22; // symbol area width
    const totalW = 260; // total width per row
    const barW = totalW - symW - 8;

    const drawBar = (symbol, cur, max, color, yOffset) => {
      // symbol box
      const sx = CANVAS_WIDTH - totalW;
      const sy = barY + yOffset;
      ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      // circle behind symbol
      ctx.fillStyle = 'rgba(255,255,255,0.04)';
      ctx.beginPath();
      ctx.arc(sx + symW / 2, sy + 6, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f8fafc';
      ctx.fillText(symbol, sx + symW / 2, sy + 6);

      // bar area
      const bx = sx + symW + 8;
      ctx.fillStyle = 'rgba(15,23,42,0.9)';
      ctx.fillRect(bx, sy, barW, 10);
      const ratio = max > 0 ? Math.max(0, Math.min(1, cur / max)) : 0;
      if (ratio > 0) {
        ctx.fillStyle = color;
        ctx.fillRect(bx, sy, barW * ratio, 10);
      }
      ctx.strokeStyle = 'rgba(0,0,0,0.45)';
      ctx.lineWidth = 1;
      ctx.strokeRect(bx + 0.5, sy + 0.5, barW - 1, 9);
      ctx.textAlign = 'left';
    };

    // Safe fallbacks from gameState
    const hpCur = (gameState.hp !== undefined) ? gameState.hp : (gameState.lives !== undefined ? gameState.lives : 5);
    const hpMax = (gameState.maxHp !== undefined) ? gameState.maxHp : (gameState.maxLives !== undefined ? gameState.maxLives : 5);
    const superCur = gameState.super !== undefined ? gameState.super : (gameState.superCharge !== undefined ? gameState.superCharge : 0);
    const superMax = gameState.superMax !== undefined ? gameState.superMax : 100;
    const slizeCur = gameState.slize !== undefined ? gameState.slize : 0;
    const slizeMax = gameState.slizeMax !== undefined ? gameState.slizeMax : 100;
    const shieldCur = gameState.shield !== undefined ? gameState.shield : (gameState.shieldStamina !== undefined ? gameState.shieldStamina : 100);
    const shieldMax = gameState.shieldMax !== undefined ? gameState.shieldMax : (gameState.shieldMaxStamina !== undefined ? gameState.shieldMaxStamina : 100);

    drawBar('❤', hpCur, hpMax, '#ef4444', 0);
    drawBar('⚡', superCur, superMax, '#f59e0b', rowH);
    drawBar('✂', slizeCur, slizeMax, '#a78bfa', rowH * 2);
    drawBar('🛡', shieldCur, shieldMax, '#38bdf8', rowH * 3);

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

  /**
   * Draw boss health bar at HD display resolution (centered under header bar).
   */
  drawBossBar(ctx, boss) {
    if (!boss || boss.isDefeated || !boss.isArenaActive && !boss.isPurified) return;

    ctx.save();
    const barWidth = 640;
    const barHeight = 20;
    const barX = (CANVAS_WIDTH - barWidth) / 2;
    const barY = 96;

    // Background Frame
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.fillRect(barX - 4, barY - 4, barWidth + 8, barHeight + 8);
    ctx.strokeRect(barX - 4, barY - 4, barWidth + 8, barHeight + 8);

    // Health Fill
    const ratio = Math.max(0, Math.min(1, boss.health / (boss.maxHealth || 6)));
    const fillWidth = ratio * barWidth;
    const hpGrad = ctx.createLinearGradient(barX, 0, barX + barWidth, 0);

    const isForestKing = boss.species === 'forest_king' || boss.name === 'Forest King';
    const isSirSlamALot = boss.species === 'sir_slam_a_lot' || boss.name === 'Sir Slam-A-Lot';
    const isHoneyDragon = boss.species === 'honey_dragon' || boss.name === 'The Honey Dragon' || boss.name === 'Honey Dragon';

    if (isForestKing) {
      if (boss.phase === 3) {
        hpGrad.addColorStop(0, '#7e22ce');
        hpGrad.addColorStop(0.5, '#c026d3');
        hpGrad.addColorStop(1, '#f0abfc');
      } else {
        hpGrad.addColorStop(0, '#4c1d95');
        hpGrad.addColorStop(0.5, '#a855f7');
        hpGrad.addColorStop(1, '#e9d5ff');
      }
    } else if (isSirSlamALot) {
      if (boss.phase === 3) {
        hpGrad.addColorStop(0, '#c2410c');
        hpGrad.addColorStop(0.5, '#ea580c');
        hpGrad.addColorStop(1, '#fed7aa');
      } else {
        hpGrad.addColorStop(0, '#1e293b');
        hpGrad.addColorStop(0.5, '#38bdf8');
        hpGrad.addColorStop(1, '#bae6fd');
      }
    } else if (isHoneyDragon) {
      if (boss.phase === 3) {
        // White-hot caldera eruption
        hpGrad.addColorStop(0, '#7f1d1d');
        hpGrad.addColorStop(0.5, '#ef4444');
        hpGrad.addColorStop(1, '#fef08a');
      } else if (boss.phase === 2) {
        // Boiling magma
        hpGrad.addColorStop(0, '#9a3412');
        hpGrad.addColorStop(0.5, '#f97316');
        hpGrad.addColorStop(1, '#fed7aa');
      } else {
        // Molten honey amber
        hpGrad.addColorStop(0, '#b45309');
        hpGrad.addColorStop(0.5, '#f59e0b');
        hpGrad.addColorStop(1, '#fef08a');
      }
    } else if (boss.phase === 3) {
      hpGrad.addColorStop(0, '#dc2626');
      hpGrad.addColorStop(0.5, '#ef4444');
      hpGrad.addColorStop(1, '#f87171');
    } else {
      hpGrad.addColorStop(0, '#d97706');
      hpGrad.addColorStop(0.5, '#f59e0b');
      hpGrad.addColorStop(1, '#fde047');
    }
    ctx.fillStyle = hpGrad;
    ctx.fillRect(barX, barY, fillWidth, barHeight);

    // Boss Name & Phase Badge
    ctx.fillStyle = isForestKing ? '#f0abfc' : (isSirSlamALot ? '#38bdf8' : (isHoneyDragon ? '#fdba74' : '#fef08a'));
    ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    const phaseLabel = boss.phase ? ` — PHASE ${boss.phase}` : '';
    const bossName = (boss.name || 'HONEY BUMBLE').toUpperCase();
    ctx.fillText(`👑 ${bossName}${phaseLabel} 👑`, CANVAS_WIDTH / 2, barY - 8);

    // Health tick segments
    const maxHp = boss.maxHealth || 6;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.lineWidth = 1.5;
    for (let i = 1; i < maxHp; i++) {
      const tx = barX + (i / maxHp) * barWidth;
      ctx.beginPath();
      ctx.moveTo(tx, barY);
      ctx.lineTo(tx, barY + barHeight);
      ctx.stroke();
    }

    ctx.restore();
  }
}

