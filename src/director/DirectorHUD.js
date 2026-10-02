/**
 * DIRECTOR HUD & TELEMETRY INSPECTOR
 * 
 * Renders an on-screen glassmorphic diagnostic HUD for the AI Level Director:
 * - 10-Beat Pacing Curve timeline with active node highlight
 * - Route topology indicator (SAFE / STANDARD / ADVANCED / SECRET)
 * - Real-time telemetry signals: Health, Velocity, Progress, Skill Tier, Fluency
 * - Threat & Encounter Intensity meter
 * - Live feed of recent directorial interventions (e.g. variant selection, recovery deployment)
 */

import { PACING_BEAT_ORDER } from './PacingCurve.js';
import { ROUTE_COLORS, ROUTE_TYPES } from './RouteManager.js';

export class DirectorHUD {
  constructor() {
    this.visible = false;
  }

  toggle() {
    this.visible = !this.visible;
    return this.visible;
  }

  draw(ctx, director, canvasWidth = 1920, canvasHeight = 1080) {
    if (!this.visible && !director.debugVisible) return;

    const state = director.getDirectorState();
    const tel = director.telemetry;

    ctx.save();

    // 1. Master Glassmorphic Container
    const x = 24;
    const y = 84;
    const width = 480;
    const height = 440;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, 12);
    ctx.fill();
    ctx.stroke();

    // Subtle header gradient
    const headerGrad = ctx.createLinearGradient(x, y, x + width, y);
    headerGrad.addColorStop(0, 'rgba(56, 189, 248, 0.25)');
    headerGrad.addColorStop(1, 'rgba(245, 158, 11, 0.15)');
    ctx.fillStyle = headerGrad;
    ctx.beginPath();
    ctx.roundRect(x, y, width, 40, [12, 12, 0, 0]);
    ctx.fill();

    // Header Title
    ctx.font = '900 13px system-ui, sans-serif';
    ctx.fillStyle = '#f8fafc';
    ctx.textAlign = 'left';
    ctx.fillText('🎬 AI LEVEL DIRECTOR & TELEMETRY ENGINE', x + 16, y + 25);

    // Active Skill Badge
    const tier = tel.playerSkillSignals.compositeSkillTier;
    const tierColor = tier === 'MASTER' ? '#f59e0b' : tier === 'INTERMEDIATE' ? '#38bdf8' : '#34d399';
    ctx.fillStyle = tierColor;
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`TIER: ${tier}`, x + width - 16, y + 25);

    let curY = y + 54;

    // 2. PACING BEAT TIMELINE (10 Canonical Beats)
    ctx.font = 'bold 10px monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'left';
    ctx.fillText('PACING CURVE TIMELINE:', x + 16, curY);

    curY += 12;
    const beatW = (width - 32) / PACING_BEAT_ORDER.length;
    for (let i = 0; i < PACING_BEAT_ORDER.length; i++) {
      const beatName = PACING_BEAT_ORDER[i];
      const isActive = beatName === state.activeBeat;
      const bx = x + 16 + i * beatW;

      ctx.fillStyle = isActive ? '#fbbf24' : 'rgba(51, 65, 85, 0.6)';
      ctx.fillRect(bx + 1, curY, beatW - 2, 18);

      if (isActive) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(bx + 1, curY, beatW - 2, 18);
      }

      ctx.fillStyle = isActive ? '#09090b' : '#94a3b8';
      ctx.font = 'bold 8px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(beatName.slice(0, 3), bx + beatW / 2, curY + 12);
    }

    curY += 28;
    ctx.textAlign = 'left';
    ctx.font = '11px system-ui, sans-serif';
    ctx.fillStyle = '#fbbf24';
    ctx.fillText(`Active Beat: ${state.activeBeat} — "${state.beatTitle}"`, x + 16, curY);

    curY += 22;

    // 3. ROUTE TOPOLOGY BADGE
    const routeColor = ROUTE_COLORS[state.currentRoute] || '#38bdf8';
    ctx.fillStyle = 'rgba(30, 41, 59, 0.8)';
    ctx.fillRect(x + 16, curY - 12, 220, 24);
    ctx.fillStyle = routeColor;
    ctx.font = 'bold 11px monospace';
    ctx.fillText(`ROUTE: ${state.currentRoute}`, x + 24, curY + 4);

    // Threat intensity meter
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px monospace';
    ctx.fillText(`THREAT: ${(state.encounterIntensity * 100).toFixed(0)}%`, x + 250, curY + 4);

    const barX = x + 325;
    const barW = 135;
    ctx.fillStyle = 'rgba(51, 65, 85, 0.8)';
    ctx.fillRect(barX, curY - 8, barW, 14);
    ctx.fillStyle = state.encounterIntensity > 0.6 ? '#ef4444' : state.encounterIntensity > 0.3 ? '#f59e0b' : '#34d399';
    ctx.fillRect(barX, curY - 8, barW * state.encounterIntensity, 14);

    curY += 26;

    // 4. TELEMETRY SIGNALS GRID
    ctx.strokeStyle = 'rgba(51, 65, 85, 0.5)';
    ctx.beginPath();
    ctx.moveTo(x + 16, curY);
    ctx.lineTo(x + width - 16, curY);
    ctx.stroke();

    curY += 16;
    ctx.font = '11px monospace';
    ctx.fillStyle = '#f8fafc';

    // Col 1
    ctx.fillText(`Pos: (${tel.playerPosition.x.toFixed(0)}, ${tel.playerPosition.y.toFixed(0)})`, x + 16, curY);
    ctx.fillText(`Speed: ${tel.playerVelocity.speed.toFixed(0)} px/s`, x + 16, curY + 18);
    ctx.fillText(`Progress: ${(tel.playerProgress * 100).toFixed(1)}%`, x + 16, curY + 36);
    ctx.fillText(`Health: ${state.health} (${(tel.playerHealth.ratio * 100).toFixed(0)}%)`, x + 16, curY + 54);

    // Col 2
    const col2X = x + 240;
    ctx.fillText(`Fluency: ${state.fluency}`, col2X, curY);
    ctx.fillText(`Curiosity: ${state.curiosity}`, col2X, curY + 18);
    ctx.fillText(`Dmg (10s): ${state.damageLast10s}`, col2X, curY + 36);
    ctx.fillText(`Success Streak: ${state.successStreak}`, col2X, curY + 54);

    curY += 72;

    // 5. LIVE DIRECTORIAL INTERVENTIONS FEED
    ctx.strokeStyle = 'rgba(51, 65, 85, 0.5)';
    ctx.beginPath();
    ctx.moveTo(x + 16, curY);
    ctx.lineTo(x + width - 16, curY);
    ctx.stroke();

    curY += 15;
    ctx.font = 'bold 10px monospace';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('DIRECTOR ACTION LOG:', x + 16, curY);

    curY += 14;
    const logs = state.recentDecisions || [];
    if (logs.length === 0) {
      ctx.fillStyle = '#64748b';
      ctx.font = 'italic 10px system-ui, sans-serif';
      ctx.fillText('Observing traversal... pacing stable.', x + 16, curY);
    } else {
      for (let i = 0; i < Math.min(4, logs.length); i++) {
        const log = logs[i];
        ctx.fillStyle = log.category === 'ENCOUNTER' ? '#f59e0b' : log.category === 'RECOVERY' ? '#34d399' : '#e2e8f0';
        ctx.font = '10px monospace';
        const truncated = log.message.length > 55 ? log.message.slice(0, 52) + '...' : log.message;
        ctx.fillText(`[${log.simTime}][${log.category}] ${truncated}`, x + 16, curY);
        curY += 15;
      }
    }

    ctx.restore();
  }
}

export const directorHUD = new DirectorHUD();
