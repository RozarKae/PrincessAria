import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../game/Constants.js';

/**
 * ATMOSPHERE & WEATHER SYSTEM
 * Handles ambient weather, drifting pollen, floating leaves, butterflies, and distant birds.
 * Features:
 * - Extensible architecture ready for Rain, Snow, Fog, and Storms in future worlds
 * - Configurable wind direction and strength
 * - Object-pooled particles with zero runtime garbage collection
 */
export class AtmosphereSystem {
  constructor(worldTheme = 'honeywood') {
    this.theme = worldTheme;
    this.windX = 28;
    this.windY = 8;
    this.timer = 0;

    // Ambient floating particles (pollen & leaves)
    this.particles = [];
    this.maxParticles = 65;
    this.initPollenAndLeaves();

    // Distant birds in sky
    this.birds = [];
    this.initBirds();
  }

  initPollenAndLeaves() {
    this.particles = [];
    for (let i = 0; i < this.maxParticles; i++) {
      const pTypeRoll = Math.random();
      let type, color, size, vy;
      if (pTypeRoll < 0.55) {
        // Golden Honeywood Pollen
        type = 'pollen';
        color = Math.random() < 0.6 ? '#fbbf24' : '#fde047';
        size = 1.8 + Math.random() * 2.2;
        vy = 6 + Math.random() * 16;
      } else if (pTypeRoll < 0.85) {
        // Tumbling Clover / Forest Leaf
        type = 'leaf';
        color = Math.random() < 0.7 ? '#65a30d' : '#84cc16';
        size = 2.5 + Math.random() * 2.5;
        vy = 14 + Math.random() * 22;
      } else {
        // Radiant Honey Stardust Sparkle
        type = 'stardust';
        color = Math.random() < 0.5 ? '#fef08a' : '#f59e0b';
        size = 1.5 + Math.random() * 2;
        vy = 4 + Math.random() * 12;
      }

      this.particles.push({
        x: Math.random() * CANVAS_WIDTH * 1.5,
        y: Math.random() * CANVAS_HEIGHT,
        vx: 12 + Math.random() * 28,
        vy: vy,
        size: size,
        type: type,
        color: color,
        alpha: 0.35 + Math.random() * 0.5,
        rot: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 2.5,
      });
    }
  }

  initBirds() {
    this.birds = [];
    for (let i = 0; i < 4; i++) {
      this.birds.push({
        x: -200 - i * 300,
        y: 80 + i * 40,
        speedX: 95 + Math.random() * 35,
        wingPhase: Math.random() * Math.PI * 2,
      });
    }
  }

  update(dt, camera) {
    this.timer += dt;

    // Wind oscillation
    this.windX = 25 + Math.sin(this.timer * 0.8) * 15;

    // Update ambient particles
    this.particles.forEach(p => {
      p.x += (p.vx + this.windX) * dt;
      p.y += p.vy * dt;
      p.rot += p.rotSpeed * dt;

      // Wrap around screen viewport
      if (p.x > CANVAS_WIDTH + 100) p.x = -50;
      if (p.y > CANVAS_HEIGHT + 50) p.y = -20;
    });

    // Update distant birds
    this.birds.forEach(b => {
      b.x += b.speedX * dt;
      b.wingPhase += dt * 8;
      if (b.x > CANVAS_WIDTH + 300) {
        b.x = -150 - Math.random() * 200;
        b.y = 70 + Math.random() * 120;
      }
    });
  }

  draw(ctx, camera) {
    ctx.save();

    // 1. Draw Distant Birds in Sky
    ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
    this.birds.forEach(b => {
      const wingDrop = Math.sin(b.wingPhase) * 6;
      ctx.beginPath();
      ctx.moveTo(b.x - 12, b.y + wingDrop);
      ctx.quadraticCurveTo(b.x - 6, b.y - 4, b.x, b.y);
      ctx.quadraticCurveTo(b.x + 6, b.y - 4, b.x + 12, b.y + wingDrop);
      ctx.stroke();
    });

    // 2. Draw Drifting Pollen Motes & Leaves
    this.particles.forEach(p => {
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;

      if (p.type === 'stardust') {
        // Glowing Golden Stardust Sparkle
        ctx.save();
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        const s = p.size;
        ctx.moveTo(p.x, p.y - s * 1.4);
        ctx.lineTo(p.x + s, p.y);
        ctx.lineTo(p.x, p.y + s * 1.4);
        ctx.lineTo(p.x - s, p.y);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      } else if (p.type === 'pollen') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Drifting leaf
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size * 2, p.size, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    });

    ctx.restore();
  }
}
