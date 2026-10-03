import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../game/Constants.js';
import { QueenBee } from '../entities/QueenBee.js';
import { Batboy } from '../entities/Batboy.js';

/**
 * Title Screen for PRINCESS ARIA: The Rescue of Batboy.
 * Master Game Director Presentation:
 * - Menacing Monarch Queen Bee hovering majestically in canopy shadows above the title
 * - Heroic Princess Aria proudly standing on an ancient Royal Sunstone Pedestal bathed in golden sunbeams
 * - Captured Batboy suspended in an ominous glowing amber chrysalis on the right
 * - Radiant storybook typography, golden filigree accents, and interactive Start prompt
 */
export class TitleScreen {
  constructor() {
    this.timer = 0;
    this.previewQueen = new QueenBee(CANVAS_WIDTH / 2 - 220, 24);
    this.previewBatboy = new Batboy(CANVAS_WIDTH - 420, 580);
    this.sparkles = [];

    // Pre-populate ambient floating golden dust motes
    for (let i = 0; i < 30; i++) {
      this.sparkles.push({
        x: Math.random() * CANVAS_WIDTH,
        y: Math.random() * CANVAS_HEIGHT,
        radius: 1 + Math.random() * 2.5,
        speed: 12 + Math.random() * 20,
        swaySpeed: 1.5 + Math.random() * 2,
        phase: Math.random() * Math.PI * 2,
        alpha: 0.2 + Math.random() * 0.6,
      });
    }
  }

  update(dt, player) {
    this.timer += dt;
    this.previewQueen.update(dt);
    this.previewBatboy.update(dt);
    if (player && player.anim) {
      player.anim.update(dt);
    }

    // Update ambient dust motes
    this.sparkles.forEach((s) => {
      s.y -= s.speed * dt;
      s.x += Math.sin(this.timer * s.swaySpeed + s.phase) * 14 * dt;
      if (s.y < -20) {
        s.y = CANVAS_HEIGHT + 20;
        s.x = Math.random() * CANVAS_WIDTH;
      }
    });
  }

  draw(ctx, player) {
    ctx.save();

    // 1. Deep Royal Indigo / Midnight Forest Gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    bgGrad.addColorStop(0, '#060913');
    bgGrad.addColorStop(0.35, '#0f172a');
    bgGrad.addColorStop(0.7, '#1e1b4b');
    bgGrad.addColorStop(1, '#090514');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Subtle Sacred Honeycomb Watermark Pattern
    ctx.save();
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.035)';
    ctx.lineWidth = 1.5;
    for (let x = 0; x < CANVAS_WIDTH + 100; x += 100) {
      for (let y = 0; y < CANVAS_HEIGHT + 100; y += 86) {
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const a = (Math.PI / 3) * i;
          const hx = x + Math.cos(a) * 40;
          const hy = y + Math.sin(a) * 40;
          if (i === 0) ctx.moveTo(hx, hy);
          else ctx.lineTo(hx, hy);
        }
        ctx.closePath();
        ctx.stroke();
      }
    }
    ctx.restore();

    // 2. Ambient Floating Golden Dust Motes
    ctx.save();
    this.sparkles.forEach((s) => {
      ctx.fillStyle = `rgba(254, 240, 138, ${s.alpha})`;
      ctx.shadowColor = '#fbbf24';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();

    // --- 3. GIGANTIC MONARCH QUEEN BEE AT THE TOP ---
    this.previewQueen.draw(ctx);

    // --- 4. HEROIC PRINCESS ARIA PEDESTAL (Left Flank) ---
    const ariaX = 400;
    const ariaY = 640;

    // A. Sacred Sunbeam Ray streaming onto Aria
    ctx.save();
    const beamGrad = ctx.createLinearGradient(120, 0, ariaX, ariaY);
    beamGrad.addColorStop(0, 'rgba(254, 240, 138, 0.28)');
    beamGrad.addColorStop(0.7, 'rgba(251, 191, 36, 0.12)');
    beamGrad.addColorStop(1, 'rgba(251, 191, 36, 0)');
    ctx.fillStyle = beamGrad;
    ctx.beginPath();
    ctx.moveTo(80, 0);
    ctx.lineTo(260, 0);
    ctx.lineTo(ariaX + 160, ariaY + 60);
    ctx.lineTo(ariaX - 160, ariaY + 60);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // B. Carved Royal Stone Altar Dais
    this.drawPedestal(ctx, ariaX, ariaY);

    // C. Princess Aria Herself (Rendered with Heroic 1.6x Scale)
    if (player) {
      ctx.save();
      ctx.translate(ariaX, ariaY);
      ctx.scale(1.65, 1.65);

      // Heroic stance offset (preserve coordinates so in-game positioning is not polluted)
      const prevX = player.x;
      const prevY = player.y;
      const prevFacing = player.facing;
      player.x = -player.width / 2;
      player.y = -player.height;
      player.facing = 1;
      player.draw(ctx);
      player.x = prevX;
      player.y = prevY;
      player.facing = prevFacing;
      ctx.restore();
    }

    // --- 5. CAPTURED BATBOY CHRYSALIS (Right Flank) ---
    const batboyAnchorX = CANVAS_WIDTH - 400;
    const batboyAnchorY = 640;

    // Ominous Crimson/Amber Energy Tendrils
    ctx.save();
    const cageGlow = ctx.createRadialGradient(batboyAnchorX, batboyAnchorY - 60, 20, batboyAnchorX, batboyAnchorY - 60, 180);
    cageGlow.addColorStop(0, 'rgba(220, 38, 38, 0.22)');
    cageGlow.addColorStop(0.6, 'rgba(245, 158, 11, 0.12)');
    cageGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = cageGlow;
    ctx.beginPath();
    ctx.arc(batboyAnchorX, batboyAnchorY - 60, 180, 0, Math.PI * 2);
    ctx.fill();

    // Suspended Silk Thread
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(batboyAnchorX, 0);
    ctx.lineTo(batboyAnchorX, batboyAnchorY - 140);
    ctx.stroke();

    // Draw Batboy inside the Honeycomb Chrysalis
    this.previewBatboy.x = batboyAnchorX - this.previewBatboy.width / 2;
    this.previewBatboy.y = batboyAnchorY - this.previewBatboy.height - 20;
    this.previewBatboy.draw(ctx);
    ctx.restore();

    // --- 6. CENTERPIECE TITLE & STORY LOGO ---
    const centerX = CANVAS_WIDTH / 2;
    const titleY = 370;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Radiant Royal Golden Title
    ctx.save();
    ctx.font = '900 96px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.shadowColor = '#f59e0b';
    ctx.shadowBlur = 36;
    const titleGrad = ctx.createLinearGradient(0, titleY - 50, 0, titleY + 40);
    titleGrad.addColorStop(0, '#ffffff');
    titleGrad.addColorStop(0.28, '#fef08a');
    titleGrad.addColorStop(0.68, '#f59e0b');
    titleGrad.addColorStop(1, '#b45309');
    ctx.fillStyle = titleGrad;
    ctx.fillText('PRINCESS ARIA', centerX, titleY);
    ctx.restore();

    // Elegant Gilded Subtitle with Diamond Star Accents
    ctx.font = 'bold 26px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#fbbf24';
    ctx.shadowColor = '#d97706';
    ctx.shadowBlur = 12;
    ctx.fillText('✦   THE RESCUE OF BATBOY   ✦', centerX, titleY + 68);
    ctx.shadowBlur = 0;

    // Narrative Prologue Teaser
    ctx.font = '500 17px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText(
      'The evil Monarch Queen Bee has imprisoned Batboy! Guide Princess Aria across Honeywood Kingdom to save him.',
      centerX,
      titleY + 112
    );

    // --- 7. PULSING START BUTTON PROMPT ---
    const pulse = 0.85 + Math.sin(this.timer * 4.5) * 0.15;
    const startY = 560;

    // Gilded Button Capsule
    const btnW = 380;
    const btnH = 64;
    const btnX = centerX - btnW / 2;
    const btnY = startY - btnH / 2;

    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.strokeStyle = `rgba(251, 191, 36, ${pulse})`;
    ctx.lineWidth = 2.5;
    ctx.shadowColor = '#fbbf24';
    ctx.shadowBlur = 18 * pulse;

    ctx.beginPath();
    ctx.roundRect(btnX, btnY, btnW, btnH, 32);
    ctx.fill();
    ctx.stroke();

    // Glowing Button Label
    ctx.font = '900 28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#fef08a';
    ctx.fillText('START ADVENTURE', centerX, startY);

    // Prompt hint
    ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = `rgba(251, 191, 36, ${pulse * 0.9})`;
    ctx.shadowBlur = 0;
    ctx.fillText('[ PRESS ENTER, SPACE OR 🎮 (A) TO BEGIN ]', centerX, startY + 54);
    ctx.restore();

    // --- 8. REFINED CONTROLS GUIDE BOX ---
    const boxWidth = 980;
    const boxHeight = 205;
    const boxX = centerX - boxWidth / 2;
    const boxY = 725;

    // Royal Obsidian Scroll
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 2;
    ctx.shadowColor = 'rgba(245, 158, 11, 0.35)';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 14);
    ctx.fill();
    ctx.stroke();

    // Filigree inner border
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(boxX + 6, boxY + 6, boxWidth - 12, boxHeight - 12);

    // Header Badge
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('— ROYAL EXPLORATION CONTROLS (KEYBOARD & GAMING CONTROLLERS) —', centerX, boxY + 28);

    // 2-Column Controls Layout
    ctx.font = '500 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#f8fafc';

    // Left Column (Movement & Aerial)
    ctx.textAlign = 'left';
    ctx.fillText('Move Left / Right:    [A] / [D] / [←] [→]   or   🎮 Left Stick / D-Pad', boxX + 36, boxY + 66);
    ctx.fillText('Jump & Double Jump:   [SPACE] / [W] / [↑]   or   🎮 (A) / Cross / (B)', boxX + 36, boxY + 98);
    ctx.fillText('Crouch & Vine Climb:  [S] / [W] / [↓] [↑]   or   🎮 D-Pad / L-Stick', boxX + 36, boxY + 130);

    // Right Column (Princess Aria's 3 Heroic Powers)
    ctx.fillText('Melee Stardust Slash: [Z] / [J] / [F]       or   🎮 (X) / Square', boxX + 515, boxY + 66);
    ctx.fillText('Honey-Silk Speed Dash:[SHIFT] / [X] / [K]   or   🎮 (RB) / (R1) / (B)', boxX + 515, boxY + 98);
    ctx.fillText('Royal Starbeam:       [C] / [L] / [E]       or   🎮 (Y) / Triangle / (RT)', boxX + 515, boxY + 130);

    // Footer Feature Tagline
    ctx.textAlign = 'center';
    ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('✨ Universal Controller Compatibility: Xbox, PlayStation, Switch Pro, 8BitDo & USB Gamepads with Rumble Vibration!', centerX, boxY + 172);

    ctx.restore();

    ctx.restore();
  }

  /**
   * Draw the ancient Royal Sunstone Dais beneath Princess Aria.
   */
  drawPedestal(ctx, x, y) {
    ctx.save();

    // 1. Shadow beneath dais
    ctx.fillStyle = 'rgba(2, 6, 23, 0.65)';
    ctx.beginPath();
    ctx.ellipse(x, y + 40, 140, 22, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Main Stone Tier
    const stoneGrad = ctx.createLinearGradient(x - 120, y, x + 120, y + 36);
    stoneGrad.addColorStop(0, '#334155');
    stoneGrad.addColorStop(0.5, '#475569');
    stoneGrad.addColorStop(1, '#1e293b');

    ctx.fillStyle = stoneGrad;
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x - 110, y + 8, 220, 32, 8);
    ctx.fill();
    ctx.stroke();

    // 3. Top Polished Sunstone Slab
    const slabGrad = ctx.createLinearGradient(x - 100, y - 6, x + 100, y + 10);
    slabGrad.addColorStop(0, '#fef08a');
    slabGrad.addColorStop(0.4, '#fbbf24');
    slabGrad.addColorStop(1, '#b45309');

    ctx.fillStyle = slabGrad;
    ctx.beginPath();
    ctx.ellipse(x, y + 8, 95, 16, 0, 0, Math.PI * 2);
    ctx.fill();

    // Gold Runic Trim
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // Center Runic Sunburst
    ctx.fillStyle = '#fffbeb';
    ctx.beginPath();
    ctx.arc(x, y + 8, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
