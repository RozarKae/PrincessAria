import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../game/Constants.js';

/**
 * GameOverScreen & DefeatedScreen & LevelCompletionScreen
 * Authoritative screens:
 * 1. LEVEL_CLEAR (Victory Banner + Continue to Next World)
 * 2. DEFEATED (Normal Defeat: [ CONTINUE FROM CHECKPOINT ] & [ MAIN MENU ])
 * 3. GAME_OVER (Final Game Over: [ RETURN TO MAIN MENU ] - Checkpoint continuation forbidden)
 */
export class GameOverScreen {
  constructor() {
    this.timer = 0;
    this.selectedOption = 0; // 0 = first button, 1 = second button

    // Victory button
    this.victoryBtn = {
      x: CANVAS_WIDTH / 2 - 180,
      y: CANVAS_HEIGHT / 2 + 160,
      width: 360,
      height: 56,
    };

    // Defeated buttons
    this.defeatedContinueBtn = {
      x: CANVAS_WIDTH / 2 - 200,
      y: CANVAS_HEIGHT / 2 + 120,
      width: 400,
      height: 56,
    };
    this.defeatedMainMenuBtn = {
      x: CANVAS_WIDTH / 2 - 200,
      y: CANVAS_HEIGHT / 2 + 190,
      width: 400,
      height: 56,
    };

    // Game Over button
    this.gameOverMainMenuBtn = {
      x: CANVAS_WIDTH / 2 - 200,
      y: CANVAS_HEIGHT / 2 + 150,
      width: 400,
      height: 56,
    };
  }

  update(dt) {
    this.timer += dt;
  }

  /**
   * Handle mouse click events.
   * @param {number} canvasX
   * @param {number} canvasY
   * @param {string} mode - 'VICTORY' | 'DEFEATED' | 'GAME_OVER'
   * @param {Function} onContinue
   * @param {Function} onMainMenu
   */
  handleClick(canvasX, canvasY, mode = 'DEFEATED', onContinue, onMainMenu) {
    if (mode === 'VICTORY') {
      const b = this.victoryBtn;
      if (
        canvasX >= b.x &&
        canvasX <= b.x + b.width &&
        canvasY >= b.y &&
        canvasY <= b.y + b.height
      ) {
        if (typeof onContinue === 'function') onContinue();
        return true;
      }
    } else if (mode === 'DEFEATED') {
      const bCont = this.defeatedContinueBtn;
      if (
        canvasX >= bCont.x &&
        canvasX <= bCont.x + bCont.width &&
        canvasY >= bCont.y &&
        canvasY <= bCont.y + bCont.height
      ) {
        if (typeof onContinue === 'function') onContinue();
        return true;
      }
      const bMenu = this.defeatedMainMenuBtn;
      if (
        canvasX >= bMenu.x &&
        canvasX <= bMenu.x + bMenu.width &&
        canvasY >= bMenu.y &&
        canvasY <= bMenu.y + bMenu.height
      ) {
        if (typeof onMainMenu === 'function') onMainMenu();
        return true;
      }
    } else if (mode === 'GAME_OVER') {
      const bMenu = this.gameOverMainMenuBtn;
      if (
        canvasX >= bMenu.x &&
        canvasX <= bMenu.x + bMenu.width &&
        canvasY >= bMenu.y &&
        canvasY <= bMenu.y + bMenu.height
      ) {
        if (typeof onMainMenu === 'function') onMainMenu();
        return true;
      }
    }
    return false;
  }

  draw(ctx, gameState, mode = 'DEFEATED', levelInfo = { totalShards: 30 }) {
    ctx.save();

    // Dark cinematic obsidian backdrop
    ctx.fillStyle = 'rgba(9, 13, 22, 0.94)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const centerX = CANVAS_WIDTH / 2;
    const centerY = CANVAS_HEIGHT / 2 - 40;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (mode === 'VICTORY' || mode === true) {
      this.drawVictory(ctx, centerX, centerY, gameState, levelInfo);
    } else if (mode === 'DEFEATED') {
      this.drawDefeated(ctx, centerX, centerY, gameState);
    } else {
      this.drawGameOver(ctx, centerX, centerY, gameState);
    }

    ctx.restore();
  }

  drawVictory(ctx, centerX, centerY, gameState, levelInfo) {
    const isWorld6 = gameState && gameState.world === 6;
    const isWorld5 = gameState && gameState.world === 5;
    const isWorld4 = gameState && gameState.world === 4;
    const isWorld3 = gameState && gameState.world === 3;
    const isWorld2 = gameState && gameState.world === 2;

    // Radiant Emerald / Gold Victory Header
    ctx.font = '900 78px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.shadowColor = '#fbbf24';
    ctx.shadowBlur = 24;
    ctx.fillStyle = '#4ade80';
    ctx.fillText(
      isWorld6
        ? 'WORLD 6-1 CLEARED!'
        : (isWorld5
          ? 'WORLD 5-1 CLEARED!'
          : (isWorld4 ? 'WORLD 4-1 CLEARED!' : (isWorld3 ? 'WORLD 3-1 CLEARED!' : (isWorld2 ? 'WORLD 2-1 CLEARED!' : 'WORLD 1-1 CLEARED!')))),
      centerX,
      centerY - 80
    );
    ctx.shadowBlur = 0;

    ctx.font = 'bold 30px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#fde047';
    ctx.fillText(
      isWorld6
        ? 'THE TIME TINKER DEFEATED & GRAND CHRONOMETER RESTORED!'
        : (isWorld5
          ? 'THE SANDWICH KING DEFEATED & GOLDEN MAP RECOVERED!'
          : (isWorld4
            ? 'THE HONEY DRAGON LIBERATED & REALM SAVED!'
            : (isWorld3
              ? 'SIR SLAM-A-LOT DEFEATED & GATES UNSEALED!'
              : (isWorld2 ? 'THE FOREST KING LIBERATED!' : 'BATBOY RESCUED FROM HONEYCOMB CAGE!')))),
      centerX,
      centerY - 15
    );

    // Card Container for Score & Royal Shards
    const cardW = 540;
    const cardH = 110;
    const cardX = centerX - cardW / 2;
    const cardY = centerY + 35;

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
    ctx.fillText(`${gameState.coins || 0} / ${levelInfo.totalShards || 40}`, centerX + 120, cardY + 76);

    // Interactive CONTINUE Button
    const b = this.victoryBtn;
    b.y = centerY + 170;

    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.roundRect(b.x, b.y, b.width, b.height, 28);
    ctx.fill();

    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#0f172a';
    ctx.fillText(
      isWorld6
        ? 'GRAND VICTORY! BACK TO WORLD 1 ➔'
        : (isWorld5
          ? 'CONTINUE TO WORLD 6 ➔'
          : (isWorld4
            ? 'GRAND VICTORY! PLAY FROM WORLD 1 ➔'
            : (isWorld3
              ? 'CONTINUE TO WORLD 4 ➔'
              : (isWorld2 ? 'CONTINUE TO WORLD 3 ➔' : 'CONTINUE TO WORLD 2 ➔')))),
      centerX,
      b.y + b.height / 2
    );

    ctx.font = '500 15px monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('[ Press ENTER / Click / 🎮 (A) to Proceed ]', centerX, b.y + b.height + 32);
  }

  /**
   * Draw the authoritative NORMAL DEFEAT Screen:
   * Header: "DEFEATED"
   * Actions: [ CONTINUE FROM CHECKPOINT ] & [ MAIN MENU ]
   */
  drawDefeated(ctx, centerX, centerY, gameState) {
    // Header
    ctx.font = '900 84px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#f59e0b';
    ctx.shadowColor = '#f59e0b';
    ctx.shadowBlur = 28;
    ctx.fillText('DEFEATED', centerX, centerY - 80);
    ctx.shadowBlur = 0;

    // Subtitle
    ctx.font = '600 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('Princess Aria fell in battle...', centerX, centerY - 20);

    // Stats bar: Remaining Lives & HP Reset
    ctx.font = 'bold 20px monospace';
    ctx.fillStyle = '#fde047';
    const livesVal = gameState.lives !== undefined ? gameState.lives : 4;
    ctx.fillText(`REMAINING LIVES: ♥ × ${livesVal}   •   HP RESTORED: 100 / 100`, centerX, centerY + 25);

    // Button 1: [ CONTINUE FROM CHECKPOINT ]
    const bCont = this.defeatedContinueBtn;
    bCont.y = centerY + 70;
    const isContSelected = this.selectedOption === 0;

    ctx.fillStyle = isContSelected ? '#f59e0b' : 'rgba(30, 41, 59, 0.9)';
    ctx.beginPath();
    ctx.roundRect(bCont.x, bCont.y, bCont.width, bCont.height, 12);
    ctx.fill();

    ctx.strokeStyle = isContSelected ? '#fde047' : 'rgba(251, 191, 36, 0.4)';
    ctx.lineWidth = isContSelected ? 3 : 1.5;
    ctx.stroke();

    ctx.font = '800 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = isContSelected ? '#0f172a' : '#f8fafc';
    ctx.fillText('CONTINUE FROM CHECKPOINT', centerX, bCont.y + bCont.height / 2);

    // Button 2: [ MAIN MENU ]
    const bMenu = this.defeatedMainMenuBtn;
    bMenu.y = centerY + 142;
    const isMenuSelected = this.selectedOption === 1;

    ctx.fillStyle = isMenuSelected ? '#ef4444' : 'rgba(30, 41, 59, 0.9)';
    ctx.beginPath();
    ctx.roundRect(bMenu.x, bMenu.y, bMenu.width, bMenu.height, 12);
    ctx.fill();

    ctx.strokeStyle = isMenuSelected ? '#fca5a5' : 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = isMenuSelected ? 3 : 1.5;
    ctx.stroke();

    ctx.font = '800 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = isMenuSelected ? '#ffffff' : '#94a3b8';
    ctx.fillText('MAIN MENU', centerX, bMenu.y + bMenu.height / 2);

    // Controls hint
    const pulseAlpha = 0.6 + Math.sin(this.timer * 4.5) * 0.4;
    ctx.font = '600 15px monospace';
    ctx.fillStyle = `rgba(203, 213, 225, ${pulseAlpha})`;
    ctx.fillText('[ Press UP/DOWN or W/S to Select  •  ENTER / SPACE / (A) to Confirm ]', centerX, bMenu.y + bMenu.height + 36);
  }

  /**
   * Draw the authoritative FINAL GAME OVER Screen:
   * Header: "GAME OVER"
   * Actions: [ RETURN TO MAIN MENU ]
   * (CONTINUE FROM CHECKPOINT is strictly forbidden)
   */
  drawGameOver(ctx, centerX, centerY, gameState) {
    ctx.font = '900 88px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#ef4444';
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 32;
    ctx.fillText('GAME OVER', centerX, centerY - 90);
    ctx.shadowBlur = 0;

    ctx.font = '600 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('All lives exhausted. Batboy remains in Queen Bee\'s clutches...', centerX, centerY - 30);

    ctx.font = 'bold 20px monospace';
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText(`FINAL SCORE: ${(gameState.score || 0).toString().padStart(6, '0')}   •   ROYAL SHARDS: ${gameState.coins || 0}`, centerX, centerY + 18);

    ctx.font = 'bold 16px monospace';
    ctx.fillStyle = '#f87171';
    ctx.fillText('LIVES: 0   •   HP: 0', centerX, centerY + 52);

    // Only [ RETURN TO MAIN MENU ] button
    const bMenu = this.gameOverMainMenuBtn;
    bMenu.y = centerY + 95;

    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.roundRect(bMenu.x, bMenu.y, bMenu.width, bMenu.height, 12);
    ctx.fill();

    ctx.strokeStyle = '#fca5a5';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.font = '800 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('RETURN TO MAIN MENU', centerX, bMenu.y + bMenu.height / 2);

    // Controls hint
    const pulseAlpha = 0.6 + Math.sin(this.timer * 4.5) * 0.4;
    ctx.font = '600 15px monospace';
    ctx.fillStyle = `rgba(251, 191, 36, ${pulseAlpha})`;
    ctx.fillText('[ Press ENTER / SPACE / CLICK or 🎮 (A) to Return to Main Menu ]', centerX, bMenu.y + bMenu.height + 40);
  }
}
