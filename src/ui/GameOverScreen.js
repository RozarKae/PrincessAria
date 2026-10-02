import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../game/Constants.js';

/**
 * GameOverScreen & LevelCompletionScreen
 * Displays:
 * - Level Cleared / Victory banner with Royal Shards tally and score
 * - Game Over screen with retry prompt
 * - Interactive [CONTINUE TO WORLD 1-2] button (prepared for future levels)
 */
export class GameOverScreen {
  constructor() {
    this.timer = 0;
    this.continueBtn = {
      x: CANVAS_WIDTH / 2 - 180,
      y: CANVAS_HEIGHT / 2 + 180,
      width: 360,
      height: 56,
    };
  }

  update(dt) {
    this.timer += dt;
  }

  handleClick(canvasX, canvasY, onContinue) {
    const b = this.continueBtn;
    if (
      canvasX >= b.x &&
      canvasX <= b.x + b.width &&
      canvasY >= b.y &&
      canvasY <= b.y + b.height
    ) {
      if (typeof onContinue === 'function') {
        onContinue();
      }
      return true;
    }
    return false;
  }

  draw(ctx, gameState, isVictory = false, levelInfo = { totalShards: 30 }) {
    ctx.save();

    // Dark cinematic obsidian backdrop
    ctx.fillStyle = 'rgba(9, 13, 22, 0.94)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const centerX = CANVAS_WIDTH / 2;
    const centerY = CANVAS_HEIGHT / 2 - 40;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (isVictory) {
      // Radiant Emerald / Gold Victory Header
      ctx.font = '900 78px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.shadowColor = '#fbbf24';
      ctx.shadowBlur = 24;
      ctx.fillStyle = '#4ade80';
      ctx.fillText('WORLD 1-1 CLEARED!', centerX, centerY - 80);
      ctx.shadowBlur = 0;

      ctx.font = 'bold 30px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = '#fde047';
      ctx.fillText('BATBOY RESCUED FROM HONEYCOMB CAGE!', centerX, centerY - 15);

      // Quest Lore Subtitle
      ctx.font = '500 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('The Queen Bee has retreated deeper into the Hive Fortress...', centerX, centerY + 30);

      // Card Container for Score & Royal Shards
      const cardW = 540;
      const cardH = 110;
      const cardX = centerX - cardW / 2;
      const cardY = centerY + 65;

      ctx.fillStyle = 'rgba(30, 41, 59, 0.7)';
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(cardX, cardY, cardW, cardH, 12);
      ctx.fill();
      ctx.stroke();

      ctx.font = 'bold 22px monospace';
      ctx.fillStyle = '#cbd5e1';
      ctx.fillText('FINAL SCORE:', centerX - 80, cardY + 36);
      ctx.fillStyle = '#fef08a';
      ctx.fillText((gameState.score || 0).toString().padStart(6, '0'), centerX + 120, cardY + 36);

      ctx.fillStyle = '#cbd5e1';
      ctx.fillText('ROYAL SHARDS:', centerX - 80, cardY + 76);
      ctx.fillStyle = '#fbbf24';
      ctx.fillText(`${gameState.coins || 0} / ${levelInfo.totalShards || 30}`, centerX + 120, cardY + 76);

      // Interactive CONTINUE TO WORLD 1-2 Button
      const b = this.continueBtn;
      b.y = centerY + 200;
      const pulse = 0.5 + Math.sin(this.timer * 4) * 0.5;

      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.roundRect(b.x, b.y, b.width, b.height, 28);
      ctx.fill();

      ctx.strokeStyle = '#fde047';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = '#0f172a';
      ctx.fillText('CONTINUE TO WORLD 1-2 ➔', centerX, b.y + b.height / 2);

      ctx.font = '500 15px monospace';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('[ Press ENTER or Click to Proceed / Press R to Replay ]', centerX, b.y + b.height + 32);
    } else {
      // Game Over Screen
      ctx.font = '900 84px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = '#ef4444';
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 24;
      ctx.fillText('GAME OVER', centerX, centerY - 60);
      ctx.shadowBlur = 0;

      ctx.font = '600 28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('Batboy remains trapped in Queen Bee\'s clutches...', centerX, centerY + 15);

      ctx.font = '600 22px monospace';
      ctx.fillStyle = '#cbd5e1';
      ctx.fillText(`SCORE: ${gameState.score}  |  ROYAL SHARDS: ${gameState.coins}`, centerX, centerY + 80);

      const pulseAlpha = 0.5 + Math.sin(this.timer * 4.5) * 0.5;
      ctx.font = '800 26px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = `rgba(251, 191, 36, ${pulseAlpha})`;
      ctx.fillText('PRESS [ENTER] OR [R] TO TRY AGAIN', centerX, centerY + 180);
    }

    ctx.restore();
  }
}
