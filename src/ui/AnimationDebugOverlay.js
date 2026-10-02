import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../game/Constants.js';
import { ARIA_DESIGN_VERSION, ARIA_PALETTE, ARIA_PROPORTIONS } from '../game/AriaDesignSpec.js';
import { assetManager } from '../renderer/AssetManager.js';
import { characterRenderer } from '../renderer/HDCharacterRenderer.js';

/**
 * AnimationDebugOverlay
 * Real-time development inspector for:
 * 1. Live gameplay animation playback, frames, physics, and state.
 * 2. Canonical Master Character Design Reference (4 turnaround angles, 6 expressions, and 32px-128px scale tests).
 * Toggleable via hotkey [F3], [O] or on-screen button.
 */
export class AnimationDebugOverlay {
  constructor() {
    this.enabled = false;
    this.activeTab = 'MONITOR'; // 'MONITOR' | 'DESIGN'

    // Toggle button rect on screen (floats cleanly below HUD bar)
    this.toggleButton = {
      x: CANVAS_WIDTH - 160,
      y: 96,
      width: 136,
      height: 32,
    };

    // Tab buttons
    this.tabMonitorBtn = { x: 32, y: 100, width: 140, height: 32 };
    this.tabDesignBtn = { x: 178, y: 100, width: 180, height: 32 };
  }

  toggle() {
    this.enabled = !this.enabled;
    console.log(`[AnimationDebugOverlay] Debug mode: ${this.enabled ? 'ENABLED' : 'DISABLED'}`);
    return this.enabled;
  }

  handleClick(canvasX, canvasY) {
    const b = this.toggleButton;
    if (
      canvasX >= b.x &&
      canvasX <= b.x + b.width &&
      canvasY >= b.y &&
      canvasY <= b.y + b.height
    ) {
      this.toggle();
      return true;
    }

    if (this.enabled) {
      // Tab 1: Monitor
      if (
        canvasX >= this.tabMonitorBtn.x &&
        canvasX <= this.tabMonitorBtn.x + this.tabMonitorBtn.width &&
        canvasY >= this.tabMonitorBtn.y &&
        canvasY <= this.tabMonitorBtn.y + this.tabMonitorBtn.height
      ) {
        this.activeTab = 'MONITOR';
        return true;
      }
      // Tab 2: Design
      if (
        canvasX >= this.tabDesignBtn.x &&
        canvasX <= this.tabDesignBtn.x + this.tabDesignBtn.width &&
        canvasY >= this.tabDesignBtn.y &&
        canvasY <= this.tabDesignBtn.y + this.tabDesignBtn.height
      ) {
        this.activeTab = 'DESIGN';
        return true;
      }
    }

    return false;
  }

  draw(ctx, player, fps = 60) {
    if (!this.enabled) return;

    // 1. Draw Toggle Pill in top-right corner
    this.drawTogglePill(ctx);

    // 2. Draw Active Tab
    if (this.activeTab === 'DESIGN') {
      this.drawMasterDesignPanel(ctx);
    } else {
      this.drawMonitorPanel(ctx, player, fps);
    }
  }

  drawTogglePill(ctx) {
    ctx.save();
    const b = this.toggleButton;

    ctx.fillStyle = this.enabled ? 'rgba(245, 158, 11, 0.95)' : 'rgba(30, 41, 59, 0.85)';
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(b.x, b.y, b.width, b.height, 16);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = this.enabled ? '#0f172a' : '#fbbf24';
    ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      this.enabled ? '⚡ DEBUG: ON' : '🔧 DEBUG: OFF',
      b.x + b.width / 2,
      b.y + b.height / 2
    );

    ctx.restore();
  }

  drawTabs(ctx) {
    // Tab 1: Monitor
    const isMon = this.activeTab === 'MONITOR';
    ctx.fillStyle = isMon ? 'rgba(245, 158, 11, 0.9)' : 'rgba(30, 41, 59, 0.85)';
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(this.tabMonitorBtn.x, this.tabMonitorBtn.y, this.tabMonitorBtn.width, this.tabMonitorBtn.height, [8, 8, 0, 0]);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = isMon ? '#0f172a' : '#f8fafc';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('⚡ LIVE MONITOR', this.tabMonitorBtn.x + this.tabMonitorBtn.width / 2, this.tabMonitorBtn.y + 20);

    // Tab 2: Design Bible & Model Sheet
    const isDes = this.activeTab === 'DESIGN';
    ctx.fillStyle = isDes ? 'rgba(245, 158, 11, 0.9)' : 'rgba(30, 41, 59, 0.85)';
    ctx.beginPath();
    ctx.roundRect(this.tabDesignBtn.x, this.tabDesignBtn.y, this.tabDesignBtn.width, this.tabDesignBtn.height, [8, 8, 0, 0]);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = isDes ? '#0f172a' : '#f8fafc';
    ctx.fillText(`🎨 MASTER DESIGN v${ARIA_DESIGN_VERSION}`, this.tabDesignBtn.x + this.tabDesignBtn.width / 2, this.tabDesignBtn.y + 20);
    ctx.textAlign = 'left';
  }

  drawMonitorPanel(ctx, player, fps) {
    if (!player) return;

    ctx.save();
    this.drawTabs(ctx);

    const panelX = 32;
    const panelY = 132;
    const panelW = 410;
    const panelH = 345;

    // Glassmorphism background
    ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(panelX, panelY, panelW, panelH, [0, 12, 12, 12]);
    ctx.fill();
    ctx.stroke();

    // Fetch live debug data from player & animation controller
    const debug = player.anim ? player.anim.getDebugInfo() : {};
    const vx = Math.round(player.vx || 0);
    const vy = Math.round(player.vy || 0);

    let stateDesc = 'IDLE';
    if (player.isDead) stateDesc = 'DEAD';
    else if (player.isVictorious) stateDesc = 'VICTORY';
    else if (player.isDashing) stateDesc = 'DASHING';
    else if (player.isHurt) stateDesc = 'HURT';
    else if (player.isCrouching) stateDesc = 'CROUCHING';
    else if (!player.isGrounded) {
      stateDesc = vy < 0 ? 'JUMPING_RISE' : 'FALLING';
    } else if (Math.abs(vx) > 360) {
      stateDesc = 'RUNNING';
    } else if (Math.abs(vx) > 25) {
      stateDesc = 'WALKING';
    }

    const items = [
      { label: 'Design Version:', value: `ARIA v${ARIA_DESIGN_VERSION} (Illustrated)`, color: '#fbbf24' },
      { label: 'Render Pipeline:', value: `${characterRenderer.renderMode}  [F2]`, color: '#38bdf8' },
      { label: 'Current Animation:', value: `ARIA_${debug.name || 'IDLE'}`, color: '#38bdf8' },
      { label: 'Current Frame:', value: `${debug.frame || '1/1'}  (${debug.progress || '0%'})`, color: '#4ade80' },
      { label: 'State:', value: stateDesc, color: '#fde047' },
      { label: 'Velocity:', value: `X: ${vx} px/s  |  Y: ${vy} px/s`, color: '#e2e8f0' },
      { label: 'Facing Direction:', value: player.facing > 0 ? 'RIGHT  (→)' : 'LEFT  (←)', color: '#f472b6' },
      { label: 'Grounded / Altitude:', value: player.isGrounded ? 'GROUNDED (0px)' : `AIRBORNE (${Math.round(player.groundDistance || 0)}px)`, color: player.isGrounded ? '#4ade80' : '#f97316' },
      { label: 'Squash & Stretch:', value: `X: ${(player.scaleX || 1).toFixed(2)}  |  Y: ${(player.scaleY || 1).toFixed(2)}`, color: '#94a3b8' },
      { label: 'Frame Rates:', value: `${fps} Engine FPS  |  ${debug.fps || 12} Anim FPS`, color: '#a78bfa' },
    ];

    let rowY = panelY + 28;
    ctx.font = '13px monospace';

    items.forEach(item => {
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(item.label, panelX + 16, rowY);

      ctx.fillStyle = item.color;
      ctx.font = 'bold 13px monospace';
      ctx.fillText(item.value, panelX + 185, rowY);
      ctx.font = '13px monospace';

      rowY += 27;
    });

    // Frame Progress Mini Bar
    const barX = panelX + 16;
    const barY = panelY + panelH - 44;
    const barW = panelW - 32;
    const barH = 8;
    const progress = player.anim ? player.anim.getProgress() : 0;

    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.roundRect(barX, barY, barW, barH, 4);
    ctx.fill();

    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.roundRect(barX, barY, barW * progress, barH, 4);
    ctx.fill();

    ctx.fillStyle = '#64748b';
    ctx.font = '10px monospace';
    ctx.fillText('Hotkeys: [F3]/[O] Toggle  |  [Shift] Dash  |  [S] Crouch  |  [Space] Jump', barX, barY + 24);

    ctx.restore();
  }

  drawMasterDesignPanel(ctx) {
    ctx.save();
    this.drawTabs(ctx);

    const panelX = 32;
    const panelY = 132;
    const panelW = 1040;
    const panelH = 500;

    // Glassmorphism background
    ctx.fillStyle = 'rgba(9, 13, 22, 0.96)';
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(panelX, panelY, panelW, panelH, [0, 12, 12, 12]);
    ctx.fill();
    ctx.stroke();

    // Section 1: Turnaround Model Sheet Preview
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 15px monospace';
    ctx.fillText('👑 CANONICAL TURNAROUND MODEL SHEET (FRONT / 3/4 / SIDE / BACK)', panelX + 24, panelY + 30);

    const modelSheetImg = assetManager.getImage('characters/aria/master/master_model_sheet');
    if (modelSheetImg) {
      ctx.drawImage(modelSheetImg, panelX + 24, panelY + 45, 620, 310);
    } else {
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(panelX + 24, panelY + 45, 620, 310);
      ctx.fillStyle = '#fbbf24';
      ctx.fillText('Loading Master Model Sheet...', panelX + 220, panelY + 200);
    }

    // Section 2: Emotional Expressions Strip
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 15px monospace';
    ctx.fillText('😊 EMOTIONAL EXPRESSIONS', panelX + 665, panelY + 30);

    const exprSheetImg = assetManager.getImage('characters/aria/expressions/expressions_sheet');
    if (exprSheetImg) {
      ctx.drawImage(exprSheetImg, panelX + 665, panelY + 45, 350, 215);
    }

    // Section 3: Gameplay Scale Test Strip (32px, 48px, 64px, 96px, 128px)
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 14px monospace';
    ctx.fillText('🔍 GAMEPLAY SCALE READABILITY VERIFICATION (32px to 128px)', panelX + 24, panelY + 380);

    const scaleImg = assetManager.getImage('characters/aria/master/scale_test_32_48_64_96_128');
    if (scaleImg) {
      ctx.drawImage(scaleImg, panelX + 24, panelY + 395, 620, 90);
    }

    // Palette Swatches on right
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 12px monospace';
    ctx.fillText('CANONICAL PALETTE:', panelX + 665, panelY + 285);

    const swatches = [
      { name: 'GOLD_MAIN', hex: ARIA_PALETTE.GOLD_MAIN },
      { name: 'GOLD_WARM', hex: ARIA_PALETTE.GOLD_WARM },
      { name: 'CHARCOAL', hex: ARIA_PALETTE.CHARCOAL_MAIN },
      { name: 'IVORY', hex: ARIA_PALETTE.IVORY_CREAM },
      { name: 'EMERALD', hex: ARIA_PALETTE.EMERALD_ACCENT },
      { name: 'CHESTNUT', hex: ARIA_PALETTE.HAIR_CHESTNUT },
    ];

    swatches.forEach((sw, i) => {
      const sx = panelX + 665 + (i % 3) * 115;
      const sy = panelY + 305 + Math.floor(i / 3) * 44;
      ctx.fillStyle = sw.hex;
      ctx.beginPath();
      ctx.roundRect(sx, sy, 22, 22, 4);
      ctx.fill();
      ctx.strokeStyle = '#f8fafc';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = '#e2e8f0';
      ctx.font = '10px monospace';
      ctx.fillText(sw.name, sx + 28, sy + 11);
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(sw.hex, sx + 28, sy + 22);
    });

    ctx.fillStyle = '#64748b';
    ctx.font = '11px monospace';
    ctx.fillText('Source of Truth: ARIA_CHARACTER_BIBLE.md  |  Do not alter without incrementing ARIA_DESIGN_VERSION', panelX + 665, panelY + 475);

    ctx.restore();
  }
}

export const animationDebug = new AnimationDebugOverlay();
