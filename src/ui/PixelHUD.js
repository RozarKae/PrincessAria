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
  'F': [0b111, 0b100, 0b110, 0b100, 0b100],
  'G': [0b011, 0b100, 0b101, 0b101, 0b011],
  'H': [0b101, 0b101, 0b111, 0b101, 0b101],
  'I': [0b111, 0b010, 0b010, 0b010, 0b111],
  'J': [0b001, 0b001, 0b001, 0b101, 0b010],
  'K': [0b101, 0b110, 0b100, 0b110, 0b101],
  'L': [0b100, 0b100, 0b100, 0b100, 0b111],
  'M': [0b101, 0b111, 0b101, 0b101, 0b101],
  'N': [0b110, 0b101, 0b101, 0b101, 0b101],
  'O': [0b010, 0b101, 0b101, 0b101, 0b010],
  'P': [0b110, 0b101, 0b110, 0b100, 0b100],
  'Q': [0b010, 0b101, 0b101, 0b110, 0b011],
  'R': [0b110, 0b101, 0b110, 0b101, 0b101],
  'S': [0b011, 0b100, 0b010, 0b001, 0b110],
  'T': [0b111, 0b010, 0b010, 0b010, 0b010],
  'U': [0b101, 0b101, 0b101, 0b101, 0b111],
  'V': [0b101, 0b101, 0b101, 0b101, 0b010],
  'W': [0b101, 0b101, 0b101, 0b111, 0b101],
  'X': [0b101, 0b101, 0b010, 0b101, 0b101],
  'Y': [0b101, 0b101, 0b010, 0b010, 0b010],
  'Z': [0b111, 0b001, 0b010, 0b100, 0b111],
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
  ':': [0b000, 0b010, 0b000, 0b010, 0b000],
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
   * Draw 3 Heroic Power Badges:
   * 1. Melee Slash [Z] (Sword)
   * 2. Honey-Silk Dash [X] (Wing)
   * 3. Royal Starbeam [C] (Celestial Diamond Star)
   */
  drawAbilityIcons(ctx, x, y, player) {
    const isMeleeCool = player && player.attackCooldownTimer > 0;
    const isDashCool = player && player.dashCooldownTimer > 0;
    const isShotCool = player && player.shootCooldownTimer > 0;

    // --- Ability 1: MELEE [Z] ---
    drawBitmapText(ctx, 'Z', x, y + 1, isMeleeCool ? '#64748b' : P.UI_TEXT_GOLD);
    // 5x5 Sword icon
    ctx.fillStyle = isMeleeCool ? '#475569' : '#fef08a';
    ctx.fillRect(x + 5, y + 1, 1, 1);
    ctx.fillStyle = isMeleeCool ? '#334155' : '#fbbf24';
    ctx.fillRect(x + 4, y + 2, 1, 1);
    ctx.fillRect(x + 3, y + 3, 3, 1); // crossguard
    ctx.fillRect(x + 4, y + 4, 1, 1); // hilt

    // --- Ability 2: DASH [X] ---
    drawBitmapText(ctx, 'X', x + 15, y + 1, isDashCool ? '#64748b' : P.UI_TEXT_GOLD);
    // 5x5 Wing icon
    ctx.fillStyle = isDashCool ? '#475569' : '#fbbf24';
    ctx.fillRect(x + 20, y + 1, 3, 1);
    ctx.fillRect(x + 19, y + 2, 4, 1);
    ctx.fillRect(x + 20, y + 3, 2, 1);
    ctx.fillRect(x + 21, y + 4, 1, 1);

    // --- Ability 3: STARBEAM SHOT [C] ---
    drawBitmapText(ctx, 'C', x + 30, y + 1, isShotCool ? '#64748b' : '#38bdf8');
    // 5x5 Celestial Star icon
    if (isShotCool) {
      ctx.fillStyle = '#475569';
      ctx.fillRect(x + 36, y + 1, 3, 1);
      ctx.fillRect(x + 37, y, 1, 3);
    } else {
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(x + 36, y + 1, 3, 1);
      ctx.fillRect(x + 37, y, 1, 3);
      ctx.fillRect(x + 37, y + 2, 1, 1);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x + 37, y + 1, 1, 1); // white glint core
    }
  }

  /**
   * Render the HUD directly onto the internal neo-pixel canvas.
   */
  draw(ctx, gameState, player = null) {
    if (!gameState) return;

    ctx.save();
    const width = ctx.canvas.width || 320;

    // 1. Sleek glassmorphism neo-pixel top bar background (11px high)
    ctx.fillStyle = 'rgba(7, 11, 20, 0.94)';
    ctx.fillRect(0, 0, width, 11);
    
    // Top specular edge
    ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
    ctx.fillRect(0, 0, width, 1);
    
    // Bottom border with glowing amber divider
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 11, width, 1);
    ctx.fillStyle = 'rgba(245, 158, 11, 0.4)';
    ctx.fillRect(0, 11, 48, 1);
    ctx.fillRect(width - 56, 11, 56, 1);

    // 2. ARIA + FOUR MINI-BARS (HP / SUPER / SLIZE / SPECIAL)
    drawBitmapText(ctx, 'ARIA', 6, 1, P.UI_TEXT_GOLD);

    // Bar drawing helper (x, y, width, ratio, color)
    const drawMiniBar = (bx, by, bw, ratio, color, bgColor = '#0b1220') => {
      ctx.fillStyle = bgColor;
      ctx.fillRect(bx, by, bw, 3);
      ctx.fillStyle = '#00000055';
      ctx.fillRect(bx, by, bw, 1);
      const fillW = Math.max(0, Math.min(1, ratio)) * bw;
      if (fillW > 0) {
        ctx.fillStyle = color;
        ctx.fillRect(bx, by, fillW, 3);
      }
      // thin border
      ctx.strokeStyle = '#00000088';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(bx + 0.25, by + 0.25, bw - 0.5, 3 - 0.5);
    };

    // Safe getters from gameState / player
    const hpCur = (gameState.hp !== undefined) ? gameState.hp : (gameState.lives !== undefined ? gameState.lives : 5);
    const hpMax = (gameState.maxHp !== undefined) ? gameState.maxHp : (gameState.maxLives !== undefined ? gameState.maxLives : 5);
    const superCur = (gameState.super !== undefined) ? gameState.super : (player && player.superCharge !== undefined ? player.superCharge : 0);
    const superMax = (gameState.superMax !== undefined) ? gameState.superMax : 100;
    const slizeCur = (gameState.slize !== undefined) ? gameState.slize : (player && player.slize !== undefined ? player.slize : 0);
    const slizeMax = (gameState.slizeMax !== undefined) ? gameState.slizeMax : 100;
    const specialCur = (gameState.special !== undefined) ? gameState.special : (player && player.specialCharge !== undefined ? player.specialCharge : 0);
    const specialMax = (gameState.specialMax !== undefined) ? gameState.specialMax : 100;

    // layout
    const baseX = 30;
    const baseY = 2;
    const barW = 42;
    const spacing = 6;

    // HP (red/gold)
    drawBitmapText(ctx, 'HP', baseX - 18, baseY, '#f87171');
    drawMiniBar(baseX, baseY, barW, hpMax > 0 ? hpCur / hpMax : 0, '#ef4444');

    // SUPER (amber)
    drawBitmapText(ctx, 'SP', baseX + barW + spacing - 18, baseY, '#f59e0b');
    drawMiniBar(baseX + barW + spacing, baseY, barW, superMax > 0 ? superCur / superMax : 0, '#f59e0b');

    // SLIZE (purple)
    drawBitmapText(ctx, 'SZ', baseX + (barW + spacing) * 2 - 18, baseY, '#a78bfa');
    drawMiniBar(baseX + (barW + spacing) * 2, baseY, barW, slizeMax > 0 ? slizeCur / slizeMax : 0, '#a78bfa');

    // SPECIAL (cyan)
    drawBitmapText(ctx, 'SPC', baseX + (barW + spacing) * 3 - 18, baseY, '#38bdf8');
    drawMiniBar(baseX + (barW + spacing) * 3, baseY, barW, specialMax > 0 ? specialCur / specialMax : 0, '#38bdf8');

    // 3. THREE POWERS INDICATOR: [Z] Melee  [X] Dash  [C] Starbeam
    this.drawAbilityIcons(ctx, 60, 2, player);

    // 4. ROYAL SHARDS (Center)
    const midX = Math.floor(width / 2);
    this.drawShardIcon(ctx, midX - 22, 2);
    const shards = (gameState.coins || gameState.shards || 0).toString().padStart(2, '0');
    drawBitmapText(ctx, `x${shards}`, midX - 14, 3, P.UI_TEXT_WHITE);

    // WORLD STAGE BADGE (e.g. W1-1 or W2-1)
    const worldNum = gameState.world || 1;
    const stageNum = gameState.level || 1;
    drawBitmapText(ctx, `W${worldNum}-${stageNum}`, midX + 16, 3, '#38bdf8');

    // 5. SCORE (Right)
    const rightMargin = width - 74;
    drawBitmapText(ctx, 'SCORE', rightMargin, 3, P.UI_TEXT_GOLD);
    const scoreStr = (gameState.score || 0).toString().padStart(6, '0');
    drawBitmapText(ctx, scoreStr, rightMargin + 26, 3, P.UI_TEXT_WHITE);

    ctx.restore();
  }
}

export const pixelHUD = new PixelHUD();
