import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../game/Constants.js';

/**
 * LIGHTING SYSTEM
 * Lightweight 2D canvas lighting & atmosphere compositor.
 * Features:
 * - Dynamic ambient tint & darkness overlays based on level progress
 * - Point lights (Aria celestial aura, Royal Shards, Firefly lanterns, Honeycomb nectar)
 * - Directional sunbeams filtering through the canopy
 * - Efficient single-pass canvas destination-out compositing
 * - Toggleable for performance scalability
 */
export class LightingSystem {
  constructor() {
    this.enabled = true;
    this.lightCanvas = document.createElement('canvas');
    this.lightCanvas.width = CANVAS_WIDTH;
    this.lightCanvas.height = CANVAS_HEIGHT;
    this.lightCtx = this.lightCanvas.getContext('2d');
    this.sunbeamTimer = 0;
  }

  update(dt) {
    this.sunbeamTimer += dt * 0.8;
  }

  /**
   * Render dynamic 2D lighting layer over the world.
   * @param {CanvasRenderingContext2D} mainCtx 
   * @param {Object} camera 
   * @param {Object} level 
   * @param {Object} player 
   */
  render(mainCtx, camera, level, player) {
    if (!this.enabled) return;

    const ctx = this.lightCtx;
    const camX = camera ? camera.x : 0;

    // 1. Determine Ambient Darkness based on Section 1 vs Section 2
    let ambientDarkness = 0;
    let ambientColor = 'rgba(15, 23, 42, 0)';

    if (camX < 2400) {
      // Section 1: The Sunstone Glade (Soft golden morning dawn)
      ambientDarkness = 0.05;
      ambientColor = 'rgba(120, 53, 15, 0.05)';
    } else if (camX < 5200) {
      // Section 2: The Whispering Canopy & Amber Chasm (Dappled canopy twilight & deep chasm shadows)
      const canopyT = Math.min(1, (camX - 2400) / 2800);
      ambientDarkness = 0.22 + canopyT * 0.18;
      ambientColor = `rgba(20, 14, 6, ${ambientDarkness})`;
    } else {
      // Section 3: The Sunstone Aqueduct & Crumbling Fortress (Deep violet dusk & stone shadows)
      const fortressT = Math.min(1, (camX - 5200) / 2800);
      ambientDarkness = 0.32 + fortressT * 0.14;
      ambientColor = `rgba(24, 18, 48, ${ambientDarkness})`;
    }

    // Clear offscreen lighting canvas
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Fill with ambient darkness
    ctx.fillStyle = ambientColor;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Switch to 'destination-out' to carve luminous light holes through the darkness
    ctx.globalCompositeOperation = 'destination-out';

    // 2. Player Celestial Light Aura
    if (player && !player.isDead) {
      const px = player.x + player.width / 2 - camera.x;
      const py = player.y + player.height / 2 - camera.y;

      const playerGlow = ctx.createRadialGradient(px, py, 15, px, py, 170);
      playerGlow.addColorStop(0, 'rgba(0, 0, 0, 1.0)');
      playerGlow.addColorStop(0.5, 'rgba(0, 0, 0, 0.65)');
      playerGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = playerGlow;
      ctx.beginPath();
      ctx.arc(px, py, 170, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. Collectible Royal Shard Radiant Light
    if (level && level.shards) {
      level.shards.forEach(shard => {
        if (shard.collected) return;
        const sx = shard.x + shard.width / 2 - camera.x;
        const sy = shard.y + shard.height / 2 - camera.y;

        if (sx >= -100 && sx <= CANVAS_WIDTH + 100) {
          const shardGlow = ctx.createRadialGradient(sx, sy, 8, sx, sy, 85);
          shardGlow.addColorStop(0, 'rgba(0, 0, 0, 0.9)');
          shardGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = shardGlow;
          ctx.beginPath();
          ctx.arc(sx, sy, 85, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    }

    // 4. Enemy Bioluminescence (Firefly Lanterns, Wisps, Beetle Glowing Horns)
    if (level && level.enemies) {
      level.enemies.forEach(enemy => {
        if (enemy.isDead) return;
        const ex = enemy.x + enemy.width / 2 - camera.x;
        const ey = enemy.y + enemy.height / 2 - camera.y;

        if (ex >= -150 && ex <= CANVAS_WIDTH + 150) {
          const radius = enemy.species === 'firefly' ? 190 : enemy.species === 'wisp' ? 140 : 90;
          const enemyGlow = ctx.createRadialGradient(ex, ey, 10, ex, ey, radius);
          enemyGlow.addColorStop(0, 'rgba(0, 0, 0, 0.85)');
          enemyGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = enemyGlow;
          ctx.beginPath();
          ctx.arc(ex, ey, radius, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    }

    // 5. Amber Nectar Platform & Floating Raft Bioluminescence
    if (level && level.platforms) {
      level.platforms.forEach(plat => {
        if (plat.type !== 'honey') return;
        const hx = plat.x + plat.width / 2 - camera.x;
        const hy = plat.y + plat.height / 2 - camera.y;
        if (hx >= -200 && hx <= CANVAS_WIDTH + 200) {
          const honeyGlow = ctx.createRadialGradient(hx, hy, 12, hx, hy, plat.width * 0.7);
          honeyGlow.addColorStop(0, 'rgba(0, 0, 0, 0.75)');
          honeyGlow.addColorStop(0.6, 'rgba(0, 0, 0, 0.35)');
          honeyGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = honeyGlow;
          ctx.beginPath();
          ctx.arc(hx, hy, plat.width * 0.7, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    }

    // 6. Checkpoint Shrine Altars
    const checkpoints = level && (level.checkpoints || (level.checkpoint ? [level.checkpoint] : []));
    if (checkpoints) {
      checkpoints.forEach(cp => {
        const chx = cp.x + 20 - camera.x;
        const chy = cp.y + 20 - camera.y;
        if (chx >= -120 && chx <= CANVAS_WIDTH + 120) {
          const cpGlow = ctx.createRadialGradient(chx, chy, 10, chx, chy, 150);
          cpGlow.addColorStop(0, 'rgba(0, 0, 0, 0.88)');
          cpGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = cpGlow;
          ctx.beginPath();
          ctx.arc(chx, chy, 150, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    }

    // Reset composite operation to source-over
    ctx.globalCompositeOperation = 'source-over';

    // 7. Additive Celestial Sunbeams & Dappled Canopy God-Rays
    ctx.globalCompositeOperation = 'lighter';
    if (camX < 2400) {
      // Glade Morning Sunbeam
      const beamX = 400 + Math.sin(this.sunbeamTimer) * 60 - camX * 0.15;
      const sunbeamGrad = ctx.createLinearGradient(beamX, 0, beamX + 180, CANVAS_HEIGHT);
      sunbeamGrad.addColorStop(0, 'rgba(254, 240, 138, 0.18)');
      sunbeamGrad.addColorStop(0.5, 'rgba(251, 191, 36, 0.08)');
      sunbeamGrad.addColorStop(1, 'rgba(245, 158, 11, 0)');

      ctx.fillStyle = sunbeamGrad;
      ctx.beginPath();
      ctx.moveTo(beamX, 0);
      ctx.lineTo(beamX + 140, 0);
      ctx.lineTo(beamX + 280, CANVAS_HEIGHT);
      ctx.lineTo(beamX + 60, CANVAS_HEIGHT);
      ctx.closePath();
      ctx.fill();
    } else if (camX < 5200) {
      // Canopy Crepuscular Light Shafts filtering through sequoia boughs
      const beam1 = 300 + Math.sin(this.sunbeamTimer * 0.9) * 40;
      const beam2 = 980 + Math.cos(this.sunbeamTimer * 0.7) * 50;

      [beam1, beam2].forEach((bx) => {
        const rayGrad = ctx.createLinearGradient(bx, 0, bx + 160, CANVAS_HEIGHT);
        rayGrad.addColorStop(0, 'rgba(254, 240, 138, 0.14)');
        rayGrad.addColorStop(0.4, 'rgba(251, 191, 36, 0.06)');
        rayGrad.addColorStop(1, 'rgba(217, 119, 6, 0)');

        ctx.fillStyle = rayGrad;
        ctx.beginPath();
        ctx.moveTo(bx, 0);
        ctx.lineTo(bx + 110, 0);
        ctx.lineTo(bx + 240, CANVAS_HEIGHT);
        ctx.lineTo(bx + 40, CANVAS_HEIGHT);
        ctx.closePath();
        ctx.fill();
      });
    } else {
      // Section 3: Majestic Violet Moonbeams & Starshafts filtering through Fortress Ramparts
      const moonBeam1 = 280 + Math.sin(this.sunbeamTimer * 0.7) * 50;
      const moonBeam2 = 860 + Math.cos(this.sunbeamTimer * 0.85) * 60;

      [moonBeam1, moonBeam2].forEach((mbx) => {
        const moonGrad = ctx.createLinearGradient(mbx, 0, mbx + 190, CANVAS_HEIGHT);
        moonGrad.addColorStop(0, 'rgba(192, 132, 252, 0.15)');
        moonGrad.addColorStop(0.45, 'rgba(124, 58, 237, 0.07)');
        moonGrad.addColorStop(1, 'rgba(30, 27, 75, 0)');

        ctx.fillStyle = moonGrad;
        ctx.beginPath();
        ctx.moveTo(mbx, 0);
        ctx.lineTo(mbx + 120, 0);
        ctx.lineTo(mbx + 280, CANVAS_HEIGHT);
        ctx.lineTo(mbx + 50, CANVAS_HEIGHT);
        ctx.closePath();
        ctx.fill();
      });
    }
    ctx.globalCompositeOperation = 'source-over';

    // 6. Composite the lighting buffer onto the main canvas
    mainCtx.drawImage(this.lightCanvas, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }
}
