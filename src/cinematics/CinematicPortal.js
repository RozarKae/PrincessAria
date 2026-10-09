import { WORLD_TO_PIXEL, PIXEL_PALETTE } from '../renderer/PixelPalette.js';

const P = PIXEL_PALETTE;

export const PORTAL_PHASES = {
  DORMANT: 'DORMANT',
  SPARK: 'SPARK',
  OPENING: 'OPENING',
  ACTIVE: 'ACTIVE',
  CLOSING: 'CLOSING',
};

/**
 * CinematicPortal.js
 * 
 * Authored pixel-art dimensional portal for Project Aria cinematics.
 * 
 * Features:
 * - Multi-phase state machine: SPARK -> OPENING -> ACTIVE -> CLOSING
 * - Authentic 1985/16-bit console pixel-art rendering using PIXEL_PALETTE
 * - 4-frame animated swirling celestial vortex core
 * - Orbiting runic glyphs and radiant stardust particles
 * - Split-depth rendering (drawBack / drawFront) allowing characters to physically
 *   emerge or enter between portal layers for true visual occlusion.
 */
export class CinematicPortal {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
    this.phase = PORTAL_PHASES.DORMANT;
    this.phaseTimer = 0;
    this.vortexTimer = 0;
    this.scale = 0; // 0 to 1
    this.alpha = 0; // 0 to 1
    this.particles = [];
  }

  setPhase(phase) {
    this.phase = phase;
    this.phaseTimer = 0;
  }

  update(dt) {
    this.phaseTimer += dt;
    this.vortexTimer += dt;

    if (this.phase === PORTAL_PHASES.SPARK) {
      this.scale = Math.min(0.2, this.phaseTimer * 0.4);
      this.alpha = Math.min(1.0, this.phaseTimer * 2.5);
      if (Math.random() < 0.3) {
        this.emitParticle(0.35, P.HONEY_CORE);
      }
    } else if (this.phase === PORTAL_PHASES.OPENING) {
      this.scale = Math.min(1.0, 0.2 + this.phaseTimer * 0.9);
      this.alpha = Math.min(1.0, 0.6 + this.phaseTimer * 0.5);
      if (Math.random() < 0.6) {
        this.emitParticle(0.8, P.DOOR_PORTAL_CYAN);
      }
    } else if (this.phase === PORTAL_PHASES.ACTIVE) {
      this.scale = 1.0;
      this.alpha = 1.0;
      if (Math.random() < 0.45) {
        this.emitParticle(1.0, Math.random() < 0.5 ? P.DOOR_PORTAL_CYAN : P.HONEY_CORE);
      }
    } else if (this.phase === PORTAL_PHASES.CLOSING) {
      this.scale = Math.max(0, 1.0 - this.phaseTimer * 1.2);
      this.alpha = Math.max(0, 1.0 - this.phaseTimer * 1.5);
      if (Math.random() < 0.5) {
        this.emitParticle(0.5, P.DOOR_PORTAL_MAGENTA);
      }
    }

    // Update stardust particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.96;
      p.vy *= 0.96;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  emitParticle(speedMul = 1.0, color = P.DOOR_PORTAL_CYAN) {
    const angle = Math.random() * Math.PI * 2;
    const dist = 6 + Math.random() * 18;
    this.particles.push({
      x: Math.cos(angle) * dist,
      y: Math.sin(angle) * dist * 1.2,
      vx: Math.cos(angle + Math.PI * 0.5) * (14 + Math.random() * 22) * speedMul,
      vy: Math.sin(angle + Math.PI * 0.5) * (14 + Math.random() * 22) * speedMul - 6,
      life: 0.35 + Math.random() * 0.45,
      maxLife: 0.8,
      color: color,
    });
  }

  /**
   * Draw the back depth layer: ancient stone monolith archway + inner cosmic vortex.
   * Rendered BEHIND Aria as she steps through the threshold.
   */
  drawBack(ctx, camX = 0, camY = 0) {
    if (this.phase === PORTAL_PHASES.DORMANT || this.scale <= 0.02 || this.alpha <= 0) return;

    const scrX = Math.round((this.x - camX) * WORLD_TO_PIXEL);
    const scrY = Math.round((this.y - camY) * WORLD_TO_PIXEL);

    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, this.alpha));
    ctx.translate(scrX, scrY);

    const s = this.scale;
    const pulseFrame = Math.floor(this.vortexTimer * 8) % 4;

    // --- 1. Ancient Stone Monolith Archway Backdrop ---
    ctx.fillStyle = P.STONE_DARK;
    ctx.fillRect(Math.round(-10 * s), Math.round(-26 * s), Math.round(5 * s), Math.round(26 * s)); // Left pillar back
    ctx.fillRect(Math.round(5 * s), Math.round(-26 * s), Math.round(5 * s), Math.round(26 * s));  // Right pillar back
    ctx.fillRect(Math.round(-10 * s), Math.round(-30 * s), Math.round(20 * s), Math.round(5 * s)); // Lintel back

    ctx.fillStyle = P.STONE_MID;
    ctx.fillRect(Math.round(-9 * s), Math.round(-25 * s), Math.round(3 * s), Math.round(25 * s));
    ctx.fillRect(Math.round(6 * s), Math.round(-25 * s), Math.round(3 * s), Math.round(25 * s));
    ctx.fillRect(Math.round(-9 * s), Math.round(-29 * s), Math.round(18 * s), Math.round(3 * s));

    // --- 2. Swirling Dimensional Event Horizon (Core Abyss) ---
    // Deep cosmic void background
    ctx.fillStyle = P.SPIRE_VOID_DEEP;
    ctx.fillRect(Math.round(-5 * s), Math.round(-25 * s), Math.round(10 * s), Math.round(25 * s));

    // Swirling astral bands (4-frame rotation cycle)
    const bandColors = [P.DOOR_PORTAL_MAGENTA, P.DOOR_PORTAL_CYAN, P.HONEY_AMBER, P.DOOR_PORTAL_CORE];
    for (let ring = 0; ring < 3; ring++) {
      const ringColor = bandColors[(pulseFrame + ring) % bandColors.length];
      ctx.fillStyle = ringColor;
      const w = Math.round((8 - ring * 2) * s);
      const h = Math.round((22 - ring * 5) * s);
      const ox = Math.round(-w / 2);
      const oy = Math.round(-13 * s - h / 2);
      ctx.fillRect(ox, oy, w, h);
    }

    // Central radiant singularity star
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(Math.round(-1 * s), Math.round(-14 * s), Math.round(2 * s), Math.round(3 * s));
    ctx.fillRect(Math.round(-2 * s), Math.round(-13 * s), Math.round(4 * s), Math.round(1 * s));

    ctx.restore();
  }

  /**
   * Draw the front depth layer: foreground stone highlights, rune keystones, and stardust rim.
   * Rendered IN FRONT of Aria to provide realistic portal occlusion.
   */
  drawFront(ctx, camX = 0, camY = 0) {
    if (this.phase === PORTAL_PHASES.DORMANT || this.scale <= 0.02 || this.alpha <= 0) return;

    const scrX = Math.round((this.x - camX) * WORLD_TO_PIXEL);
    const scrY = Math.round((this.y - camY) * WORLD_TO_PIXEL);

    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, this.alpha));
    ctx.translate(scrX, scrY);

    const s = this.scale;
    const pulseFrame = Math.floor(this.vortexTimer * 8) % 4;

    // --- 1. Foreground Pillar Highlights & Golden Keystones ---
    ctx.fillStyle = P.STONE_HIGHLIGHT;
    ctx.fillRect(Math.round(-10 * s), Math.round(-30 * s), Math.round(20 * s), 1);
    ctx.fillRect(Math.round(-10 * s), Math.round(-26 * s), 1, Math.round(26 * s));
    ctx.fillRect(Math.round(9 * s), Math.round(-26 * s), 1, Math.round(26 * s));

    // Golden runic keystones
    ctx.fillStyle = P.HONEY_CORE;
    ctx.fillRect(Math.round(-1 * s), Math.round(-32 * s), Math.round(3 * s), Math.round(3 * s));
    ctx.fillRect(Math.round(-11 * s), Math.round(-15 * s), Math.round(2 * s), Math.round(3 * s));
    ctx.fillRect(Math.round(9 * s), Math.round(-15 * s), Math.round(2 * s), Math.round(3 * s));

    // Glowing runes
    ctx.fillStyle = pulseFrame % 2 === 0 ? P.DOOR_PORTAL_CYAN : P.DOOR_PORTAL_MAGENTA;
    ctx.fillRect(Math.round(-9 * s), Math.round(-10 * s), 1, 2);
    ctx.fillRect(Math.round(8 * s), Math.round(-10 * s), 1, 2);

    // --- 2. Orbiting Glyph Motes ---
    for (let i = 0; i < 6; i++) {
      const angle = this.vortexTimer * 2.2 + (i * Math.PI) / 3;
      const rx = Math.round(Math.cos(angle) * 7 * s);
      const ry = Math.round(-13 * s + Math.sin(angle) * 11 * s);
      ctx.fillStyle = i % 2 === 0 ? P.HONEY_GLOW : P.DOOR_PORTAL_CYAN;
      ctx.fillRect(rx, ry, 1, 1);
      if (i % 3 === 0) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(rx, ry, 1, 1);
      }
    }

    // --- 3. Dynamic Stardust Particles ---
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      const px = Math.round(p.x * s);
      const py = Math.round(-13 * s + p.y * s);
      ctx.fillStyle = p.color;
      ctx.fillRect(px, py, 1, 1);
    }

    ctx.restore();
  }
}
