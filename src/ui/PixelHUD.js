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
    this.theme = {
      1: { bg: '#0b1220', accent: '#f59e0b', deco: '#fbbf24' }, // Honeywood
      2: { bg: '#071316', accent: '#60a5fa', deco: '#38bdf8' }, // Forest / example
      3: { bg: '#1f1238', accent: '#a78bfa', deco: '#c084fc' }, // Castle
      4: { bg: '#2b0b05', accent: '#f97316', deco: '#fb923c' }, // Volcano
      5: { bg: '#241e10', accent: '#f59e0b', deco: '#fde68a' }, // Sandwich
      6: { bg: '#071018', accent: '#fef08a', deco: '#f59e0b' }  // Clockwork
    };
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

    // Thematic Tabs: choose palette per world
    const worldId = gameState?.world || 1;
    const skin = this.theme[worldId] || this.theme[1];

    // background strip
    ctx.fillStyle = skin.bg;
    ctx.fillRect(0, 0, width, 28);

    // thin top hairline for separation
    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    ctx.fillRect(0, 0, width, 1);

    // Decorative center deco (subtle)
    ctx.globalAlpha = 0.06;
    ctx.fillStyle = skin.deco;
    ctx.beginPath(); ctx.arc(width / 2, 14, 18, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;

    // Title / Left group
    drawBitmapText(ctx, 'ARIA', 6, 4, skin.accent);

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
    // Shield values must be available for the vertical pill bars
    const shieldCur = (player && player.shieldStamina !== undefined) ? player.shieldStamina : (gameState.shield !== undefined ? gameState.shield : 0);
    const shieldMax = (player && player.shieldMaxStamina !== undefined) ? player.shieldMaxStamina : (gameState.shieldMax !== undefined ? gameState.shieldMax : 100);

    // Compact layout tokens
    const leftGroupX = 8;
    const centerX = Math.floor(width / 2);
    const rightGroupX = width - 110;

    // LEFT: World & Stage
    const worldLabel = `W${gameState.world || 1}-${gameState.level || 1}`;
    drawBitmapText(ctx, worldLabel, leftGroupX + 6, 8, P.UI_TEXT_WHITE);

    // CENTER: Lives (heart icon) + Shards
    const livesCount = (gameState.lives !== undefined) ? gameState.lives : 0;
    // hearts: draw up to 5 small hearts then numeric if more
    const heartsToDraw = Math.min(5, livesCount);
    let hx = centerX - 24;
    for (let i = 0; i < heartsToDraw; i++) {
      this.drawHeart(ctx, hx + i * 5, 6, true);
    }
    if (livesCount > 5) {
      drawBitmapText(ctx, `x${livesCount}`, centerX - 24 + heartsToDraw * 5 + 4, 10, P.UI_TEXT_WHITE);
    }

    // Shards (coins) next to hearts
    this.drawShardIcon(ctx, centerX + 8, 6);
    const shards = (gameState.coins || gameState.shards || 0).toString().padStart(2, '0');
    drawBitmapText(ctx, `x${shards}`, centerX + 22, 8, P.UI_TEXT_WHITE);

    // RIGHT: Score + Treasure
    drawBitmapText(ctx, 'SCORE', rightGroupX + 6, 2, P.UI_TEXT_GOLD);
    const scoreStr = (gameState.score || 0).toString().padStart(6, '0');
    drawBitmapText(ctx, scoreStr, rightGroupX + 6, 10, P.UI_TEXT_WHITE);
    // Treasure chest
    const treasureCount = (gameState.treasureBoxes || 0);
    const tx = rightGroupX + 2;
    const ty = 18;
    ctx.fillStyle = '#8b5cf6'; ctx.fillRect(tx, ty, 6, 4);
    ctx.fillStyle = '#fde68a'; ctx.fillRect(tx + 1, ty + 1, 4, 2);
    drawBitmapText(ctx, `x${treasureCount.toString().padStart(2,'0')}`, tx + 10, 18, P.UI_TEXT_WHITE);

    const starCount = (gameState.stars !== undefined) ? gameState.stars : 0;
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(tx + 30, ty + 1, 3, 1);
    ctx.fillRect(tx + 31, ty, 1, 3);
    drawBitmapText(ctx, `x${starCount.toString().padStart(2,'0')}`, tx + 35, 18, P.UI_TEXT_WHITE);

    // Minimal ability hints (only icons, small)
    const abilitiesX = centerX - 36;
    this.drawAbilityIcons(ctx, abilitiesX, 14, player);

    // 7. Continue prompt (pixel HUD minimal)
    if (gameState.awaitingContinue) {
      const cpX = Math.floor(width / 2) - 36;
      const cpY = 20;
      ctx.fillStyle = '#fde047';
      drawBitmapText(ctx, 'CONTINUE?', cpX, cpY - 6, P.UI_TEXT_GOLD);
      const hint = 'A:START';
      drawBitmapText(ctx, hint, cpX + 2, cpY + 4, P.UI_TEXT_WHITE);
    }

    ctx.restore();
  }
}

export const pixelHUD = new PixelHUD();
