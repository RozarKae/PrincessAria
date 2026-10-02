import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../game/Constants.js';
import { assetManager } from './AssetManager.js';

/**
 * PARALLAX BACKGROUND SYSTEM — HONEYWOOD KINGDOM
 * Authentic Project Aria Visual Pipeline:
 * - 8 independent depth planes creating a lush, hand-painted fairy-tale forest
 * - Warm morning sunlight shifting into mysterious amber hive twilight
 * - Soft mountain peaks enveloped in morning mist
 * - Crystal clear forest waterfalls tumbling through pine-crested ridges
 * - Grand ancient oak silhouettes with dappled foliage
 * - Wild honeycombs naturally nestled into mossy hillsides
 * - Zero generic cyber/neon artifacts
 */
export class ParallaxBackground {
  constructor(options = {}) {
    this.cloudTimer = 0;
    this.waterfallTimer = 0;

    // Configurable 8-Layer Pipeline Definition
    this.layers = [
      { id: 0, name: 'sky', parallaxX: 0.0, parallaxY: 0.0, opacity: 1.0, verticalOffset: 0 },
      { id: 1, name: 'distant_clouds', parallaxX: 0.02, parallaxY: 0.01, opacity: 0.65, verticalOffset: 40 },
      { id: 2, name: 'mountains', parallaxX: 0.06, parallaxY: 0.03, opacity: 0.95, verticalOffset: 300 },
      { id: 3, name: 'distant_forest', parallaxX: 0.14, parallaxY: 0.06, opacity: 1.0, verticalOffset: 460 },
      { id: 4, name: 'large_trees', parallaxX: 0.28, parallaxY: 0.12, opacity: 1.0, verticalOffset: 360 },
      { id: 5, name: 'midground_vegetation', parallaxX: 0.48, parallaxY: 0.18, opacity: 1.0, verticalOffset: 500 },
      { id: 6, name: 'foreground_vegetation', parallaxX: 0.70, parallaxY: 0.25, opacity: 0.85, verticalOffset: 640 },
      { id: 7, name: 'gameplay_terrain', parallaxX: 1.0, parallaxY: 1.0, opacity: 1.0, verticalOffset: 0 },
    ];
  }

  update(dt) {
    this.cloudTimer += dt * 0.12;
    this.waterfallTimer += dt * 3.5;
  }

  draw(ctx, camera, level) {
    const levelWidth = level ? level.width : 6800;
    const progress = Math.min(1, Math.max(0, camera.x / (levelWidth - CANVAS_WIDTH)));

    // ==========================================
    // LAYER 0: SKY & CELESTIAL SUN (Speed 0.0)
    // ==========================================
    ctx.save();
    const skyGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    if (progress < 0.4) {
      // Peaceful Glade: Royal dawn azure down to warm golden morning glow
      skyGrad.addColorStop(0, '#0c4a6e');
      skyGrad.addColorStop(0.35, '#0284c7');
      skyGrad.addColorStop(0.7, '#38bdf8');
      skyGrad.addColorStop(1, '#fef08a');
    } else if (progress < 0.75) {
      // Middle Glade: Twilight violet shadows and warm amber sunset
      skyGrad.addColorStop(0, '#1e1b4b');
      skyGrad.addColorStop(0.4, '#311042');
      skyGrad.addColorStop(0.75, '#581c87');
      skyGrad.addColorStop(1, '#d97706');
    } else {
      // Deep Hive Sanctum: Ancient obsidian hive twilight
      skyGrad.addColorStop(0, '#09090b');
      skyGrad.addColorStop(0.4, '#18181b');
      skyGrad.addColorStop(0.75, '#451a03');
      skyGrad.addColorStop(1, '#b45309');
    }
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Radiant Morning Sun / Distant Hive Glow
    const sunX = CANVAS_WIDTH * 0.80 - (camera.x * 0.015) % 200;
    const sunY = 175;
    const sunGrad = ctx.createRadialGradient(sunX, sunY, 15, sunX, sunY, 210);
    if (progress < 0.6) {
      sunGrad.addColorStop(0, 'rgba(255, 255, 240, 0.75)');
      sunGrad.addColorStop(0.25, 'rgba(254, 240, 138, 0.55)');
      sunGrad.addColorStop(0.6, 'rgba(251, 191, 36, 0.20)');
      sunGrad.addColorStop(1, 'rgba(245, 158, 11, 0)');
    } else {
      sunGrad.addColorStop(0, 'rgba(251, 191, 36, 0.65)');
      sunGrad.addColorStop(0.35, 'rgba(245, 158, 11, 0.35)');
      sunGrad.addColorStop(0.7, 'rgba(180, 83, 9, 0.15)');
      sunGrad.addColorStop(1, 'rgba(120, 53, 15, 0)');
    }
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 210, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // ==========================================
    // LAYER 1: PAINTERLY CLOUDS (Speed 0.02)
    // ==========================================
    const l1 = this.layers[1];
    ctx.save();
    ctx.globalAlpha = l1.opacity;
    const cloudOffset = (camera.x * l1.parallaxX + this.cloudTimer * 22) % 1800;
    ctx.fillStyle = progress < 0.5 ? 'rgba(254, 240, 138, 0.32)' : 'rgba(216, 180, 254, 0.22)';
    for (let cx = -1800; cx < CANVAS_WIDTH + 1800; cx += 560) {
      const px = cx - cloudOffset;
      ctx.beginPath();
      ctx.arc(px, l1.verticalOffset + 50, 90, 0, Math.PI * 2);
      ctx.arc(px + 85, l1.verticalOffset + 25, 110, 0, Math.PI * 2);
      ctx.arc(px + 175, l1.verticalOffset + 55, 80, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // ==========================================
    // LAYER 2: MOUNTAIN PEAKS & MIST (Speed 0.06)
    // ==========================================
    const l2 = this.layers[2];
    ctx.save();
    ctx.globalAlpha = l2.opacity;
    const mountOffset = (camera.x * l2.parallaxX) % 2048;
    for (let mx = -2048; mx < CANVAS_WIDTH + 2048; mx += 2048) {
      const px = mx - mountOffset;
      const mGrad = ctx.createLinearGradient(px, l2.verticalOffset, px, CANVAS_HEIGHT);
      mGrad.addColorStop(0, progress < 0.5 ? '#1e3a5f' : '#231433');
      mGrad.addColorStop(0.6, progress < 0.5 ? '#0f2338' : '#140c1e');
      mGrad.addColorStop(1, progress < 0.5 ? '#061320' : '#0a0510');
      ctx.fillStyle = mGrad;

      ctx.beginPath();
      ctx.moveTo(px, CANVAS_HEIGHT);
      ctx.lineTo(px, l2.verticalOffset + 180);
      ctx.lineTo(px + 450, l2.verticalOffset + 40);
      ctx.lineTo(px + 920, l2.verticalOffset + 200);
      ctx.lineTo(px + 1440, l2.verticalOffset + 55);
      ctx.lineTo(px + 2048, l2.verticalOffset + 220);
      ctx.lineTo(px + 2048, CANVAS_HEIGHT);
      ctx.closePath();
      ctx.fill();

      // Soft mountain base mist
      const mistGrad = ctx.createLinearGradient(px, l2.verticalOffset + 180, px, CANVAS_HEIGHT);
      mistGrad.addColorStop(0, 'rgba(186, 230, 253, 0.18)');
      mistGrad.addColorStop(0.5, 'rgba(186, 230, 253, 0.05)');
      mistGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = mistGrad;
      ctx.fillRect(px, l2.verticalOffset + 140, 2048, 260);
    }
    ctx.restore();

    // ==========================================
    // LAYER 3: DISTANT FOREST & CRYSTAL WATERFALLS (Speed 0.14)
    // ==========================================
    const l3 = this.layers[3];
    ctx.save();
    ctx.globalAlpha = l3.opacity;
    const forestOffset = (camera.x * l3.parallaxX) % 2048;
    for (let fx = -2048; fx < CANVAS_WIDTH + 2048; fx += 2048) {
      const px = fx - forestOffset;
      const fGrad = ctx.createLinearGradient(px, l3.verticalOffset, px, CANVAS_HEIGHT);
      fGrad.addColorStop(0, progress < 0.5 ? '#14532d' : '#28133b');
      fGrad.addColorStop(0.5, progress < 0.5 ? '#0f3f22' : '#1a0b27');
      fGrad.addColorStop(1, progress < 0.5 ? '#052e16' : '#0d0514');
      ctx.fillStyle = fGrad;

      ctx.beginPath();
      ctx.moveTo(px, CANVAS_HEIGHT);
      ctx.quadraticCurveTo(px + 320, l3.verticalOffset + 40, px + 640, l3.verticalOffset + 80);
      ctx.quadraticCurveTo(px + 1280, l3.verticalOffset + 15, px + 2048, l3.verticalOffset + 90);
      ctx.lineTo(px + 2048, CANVAS_HEIGHT);
      ctx.closePath();
      ctx.fill();
    }

    // Natural tumbling waterfall with shimmering spray
    if (progress < 0.5) {
      const wfX = (780 - forestOffset + 4096) % 2048;
      ctx.fillStyle = 'rgba(186, 230, 253, 0.55)';
      ctx.fillRect(wfX, l3.verticalOffset + 40, 22, 280);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.fillRect(wfX + 5, l3.verticalOffset + 40 + (this.waterfallTimer * 45) % 28, 12, 20);

      // Soft mist cloud at foot of waterfall
      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.beginPath();
      ctx.ellipse(wfX + 11, l3.verticalOffset + 310, 32, 14, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // ==========================================
    // LAYER 4: GRAND ANCIENT OAKS (Speed 0.28)
    // ==========================================
    const l4 = this.layers[4];
    ctx.save();
    ctx.globalAlpha = l4.opacity;
    const treeOffset = (camera.x * l4.parallaxX) % 1800;
    for (let tx = -1800; tx < CANVAS_WIDTH + 1800; tx += 900) {
      const px = tx - treeOffset;

      // Canopy foliage mass
      const folGrad = ctx.createRadialGradient(px + 250, l4.verticalOffset + 240, 30, px + 250, l4.verticalOffset + 240, 220);
      folGrad.addColorStop(0, progress < 0.5 ? '#22c55e' : '#6b21a8');
      folGrad.addColorStop(0.65, progress < 0.5 ? '#15803d' : '#4a044e');
      folGrad.addColorStop(1, progress < 0.5 ? '#14532d' : '#2e1065');
      ctx.fillStyle = folGrad;

      ctx.beginPath();
      ctx.ellipse(px + 250, l4.verticalOffset + 240, 220, 160, 0, 0, Math.PI * 2);
      ctx.fill();

      // Deep timber tree trunk
      ctx.fillStyle = '#451a03';
      ctx.beginPath();
      ctx.moveTo(px + 210, CANVAS_HEIGHT);
      ctx.lineTo(px + 225, l4.verticalOffset + 320);
      ctx.lineTo(px + 275, l4.verticalOffset + 320);
      ctx.lineTo(px + 290, CANVAS_HEIGHT);
      ctx.closePath();
      ctx.fill();

      // Ancient moss on trunk bark
      ctx.fillStyle = '#65a30d';
      ctx.fillRect(px + 225, l4.verticalOffset + 360, 12, 90);
    }
    ctx.restore();

    // ==========================================
    // LAYER 5: WILD AMBER HONEYCOMBS (Speed 0.48)
    // ==========================================
    const l5 = this.layers[5];
    ctx.save();
    ctx.globalAlpha = l5.opacity;
    const hiveOffset = (camera.x * l5.parallaxX) % 1400;

    if (progress > 0.35) {
      for (let hx = -1400; hx < CANVAS_WIDTH + 1400; hx += 700) {
        const px = hx - hiveOffset;
        const matrixY = l5.verticalOffset - 40;

        // Warm organic honeycomb wax clusters
        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 2.5;
        const hexSize = 38;

        for (let row = 0; row < 3; row++) {
          for (let col = 0; col < 3; col++) {
            const hxPos = px + col * 68 + (row % 2 === 1 ? 34 : 0);
            const hyPos = matrixY + row * 58;

            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
              const a = (Math.PI / 3) * i;
              const vx = hxPos + Math.cos(a) * hexSize;
              const vy = hyPos + Math.sin(a) * hexSize;
              if (i === 0) ctx.moveTo(vx, vy);
              else ctx.lineTo(vx, vy);
            }
            ctx.closePath();
            ctx.fillStyle = row === 1 && col === 1 ? 'rgba(251, 191, 36, 0.45)' : 'rgba(217, 119, 6, 0.22)';
            ctx.fill();
            ctx.stroke();
          }
        }
      }
    }
    ctx.restore();

    // ==========================================
    // LAYER 6: FOREGROUND IVY & FERNS (Speed 0.70)
    // ==========================================
    const l6 = this.layers[6];
    ctx.save();
    ctx.globalAlpha = l6.opacity;
    const vineOffset = (camera.x * l6.parallaxX) % 800;

    for (let vx = -800; vx < CANVAS_WIDTH + 800; vx += 280) {
      const px = vx - vineOffset;
      ctx.strokeStyle = progress < 0.5 ? '#166534' : '#581c87';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(px, 0);
      ctx.quadraticCurveTo(px + 20, 140, px - 10, 220);
      ctx.stroke();

      // Hanging ivy leaves
      ctx.fillStyle = progress < 0.5 ? '#22c55e' : '#7e22ce';
      for (let ly = 40; ly <= 180; ly += 35) {
        ctx.beginPath();
        ctx.ellipse(px + (ly % 2 === 0 ? 8 : -8), ly, 9, 5, Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }
}
