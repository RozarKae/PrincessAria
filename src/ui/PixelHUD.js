import { PIXEL_PALETTE } from '../renderer/PixelPalette.js';

/**
 * PixelHUD.js
 * 
 * Minimal 1985-Era Console Platformer HUD.
 * Renders cleanly in the top 12 pixels of the 256x240 screen.
 * Displays only essential gameplay information:
 * - ARIA / HEARTS (3 pixel hearts: red with gold highlight)
 * - ROYAL SHARDS count
 * - SCORE
 * 
 * Zero gold filigree, zero giant storybook panels, zero screen obstruction.
 */

const P = PIXEL_PALETTE;

// Authentic 3x5 Pixel Bitmap Font definitions
const BITMAP_FONT = {
  'A': [0b111, 0b101, 0b111, 0b101, 0b101],
  'B': [0b110, 0b101, 0b110, 0b101, 0b110],
  'C': [0b011, 0b100, 0b100, 0b100, 0b011],
  'D': [0b110, 0b101, 0b101, 0b101, 0b110],
  'E': [0b111, 0b100, 0b110, 0b100, 0b111],
  'I': [0b111, 0b010, 0b010, 0b010, 0b111],
  'O': [0b010, 0b101, 0b101, 0b101, 0b010],
  'P': [0b110, 0b101, 0b110, 0b100, 0b100],
  'R': [0b110, 0b101, 0b110, 0b101, 0b101],
  'S': [0b011, 0b100, 0b010, 0b001, 0b110],
  'T': [0b111, 0b010, 0b010, 0b010, 0b010],
  'X': [0b101, 0b101, 0b010, 0b101, 0b101],
  'x': [0b000, 0b101, 0b010, 0b101, 0b000],
  '0': [0b111, 0b101, 0b101, 0b101, 0b111],
  '1': [0b010, 0b110, 0b010, 0b010, 0b111],
  '2': [0b111, 0b001, 0b111, 0b100, 0b111],
  '3': [0b111, 0b001, 0b111, 0b001, 0b111],
  '4': [0b101, 0b101, 0b111, 0b001, 0b001],
  '5': [0b111, 0b100, 0b111, 0b001, 0b111],
  '6': [0b111, 0b100, 0b111, 0b101, 0b111],
  '7': [0b111, 0b001, 0b010, 0b010, 0b010],
  '8': [0b111, 0b101, 0b111, 0b101, 0b111],
  '9': [0b111, 0b101, 0b111, 0b001, 0b111],
  ' ': [0b000, 0b000, 0b000, 0b000, 0b000],
  '-': [0b000, 0b000, 0b111, 0b000, 0b000],
};

function drawBitmapText(ctx, text, startX, startY, color) {
  ctx.fillStyle = color;
  let curX = startX;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const glyph = BITMAP_FONT[char] || BITMAP_FONT[' '];
    for (let r = 0; r < 5; r++) {
      const row = glyph[r];
      if (row & 0b100) ctx.fillRect(curX, startY + r, 1, 1);
      if (row & 0b010) ctx.fillRect(curX + 1, startY + r, 1, 1);
      if (row & 0b001) ctx.fillRect(curX + 2, startY + r, 1, 1);
    }
    curX += 4; // 3px glyph + 1px spacing
  }
}

export class PixelHUD {
  constructor() {
    this.shardPulse = 0;
  }

  update(dt) {
    this.shardPulse += dt * 4;
  }

  /**
   * Draw a single 5x5 pixel heart.
   */
  drawHeart(ctx, x, y, isFull) {
    if (isFull) {
      // Full Ruby Heart
      ctx.fillStyle = P.UI_HEART_FULL;
      ctx.fillRect(x + 1, y, 1, 1);
      ctx.fillRect(x + 3, y, 1, 1);
      ctx.fillRect(x, y + 1, 5, 2);
      ctx.fillRect(x + 1, y + 3, 3, 1);
      ctx.fillRect(x + 2, y + 4, 1, 1);

      // Gold gleam
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(x + 1, y + 1, 1, 1);
    } else {
      // Empty Heart Outline
      ctx.fillStyle = P.UI_HEART_EMPTY;
      ctx.fillRect(x + 1, y, 1, 1);
      ctx.fillRect(x + 3, y, 1, 1);
      ctx.fillRect(x, y + 1, 5, 1);
      ctx.fillRect(x, y + 2, 1, 1);
      ctx.fillRect(x + 4, y + 2, 1, 1);
      ctx.fillRect(x + 1, y + 3, 1, 1);
      ctx.fillRect(x + 3, y + 3, 1, 1);
      ctx.fillRect(x + 2, y + 4, 1, 1);
    }
  }

  /**
   * Draw 4x6 pixel Royal Shard icon.
   */
  drawShardIcon(ctx, x, y) {
    ctx.fillStyle = P.HONEY_LIGHT;
    ctx.fillRect(x + 1, y, 2, 1);
    ctx.fillRect(x, y + 1, 4, 3);
    ctx.fillRect(x + 1, y + 4, 2, 1);
    ctx.fillRect(x + 1, y + 5, 2, 1);

    // Inner emerald droplet
    ctx.fillStyle = '#10b981';
    ctx.fillRect(x + 1, y + 2, 2, 2);
  }

  /**
   * Render the HUD directly onto the 256x240 internal canvas.
   */
  draw(ctx, gameState) {
    if (!gameState) return;

    ctx.save();

    // 1. Sleek minimal top bar background (10px high)
    ctx.fillStyle = 'rgba(9, 13, 22, 0.92)';
    ctx.fillRect(0, 0, 256, 10);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 10, 256, 1);

    // 2. ARIA + HEARTS (Left)
    drawBitmapText(ctx, 'ARIA', 6, 3, P.UI_TEXT_GOLD);

    const lives = Math.max(0, gameState.lives !== undefined ? gameState.lives : 3);
    for (let i = 0; i < 3; i++) {
      this.drawHeart(ctx, 28 + i * 7, 3, i < lives);
    }

    // 3. ROYAL SHARDS (Center)
    this.drawShardIcon(ctx, 108, 2);
    const shards = (gameState.coins || gameState.shards || 0).toString().padStart(2, '0');
    drawBitmapText(ctx, `x${shards}`, 115, 3, P.UI_TEXT_WHITE);

    // 4. SCORE (Right)
    drawBitmapText(ctx, 'SCORE', 184, 3, P.UI_TEXT_GOLD);
    const scoreStr = (gameState.score || 0).toString().padStart(6, '0');
    drawBitmapText(ctx, scoreStr, 210, 3, P.UI_TEXT_WHITE);

    ctx.restore();
  }
}

export const pixelHUD = new PixelHUD();
