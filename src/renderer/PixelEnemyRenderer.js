import { PIXEL_PALETTE } from './PixelPalette.js';

/**
 * PixelEnemyRenderer.js
 * 
 * 1985-Era Console Platformer Enemy Silhouettes & Animations.
 * Fast, crisp, instantly recognizable enemy sprites on the 256x240 raster grid.
 * 
 * - HONEY BEETLE: Heavy armored beetle silhouette, walking legs, charging horn, exposed core on stun
 * - HIVE GRUB: Segmented caterpillar silhouette with accordion crawling animation
 * - HIVE FIREFLY: Flying sprite with pulsating lantern abdomen and fluttering wings
 * - HONEY WISP: Floating animated honey flame droplet
 */

const P = PIXEL_PALETTE;

export class PixelEnemyRenderer {
  constructor() {
    this.tick = 0;
  }

  update(dt) {
    this.tick += dt;
  }

  /**
   * Draw Honey Beetle in 256x240 pixel space.
   */
  drawHoneyBeetle(ctx, screenX, screenY, width, height, enemy) {
    if (enemy.isDead && enemy.defeatTimer > enemy.defeatDuration) return;

    ctx.save();
    const px = Math.round(screenX);
    const py = Math.round(screenY);
    const w = 18;
    const h = 13;

    // Fading on death
    if (enemy.isDead) {
      ctx.globalAlpha = Math.max(0, 1 - enemy.defeatTimer / enemy.defeatDuration);
    }

    // Directional flip
    const facing = enemy.facing || 1;
    if (facing < 0) {
      ctx.translate(px + w, py);
      ctx.scale(-1, 1);
    } else {
      ctx.translate(px, py);
    }

    const walkFrame = Math.floor(this.tick * 6) % 2;

    // 1. Armored Carapace Body (Dark slate purple)
    ctx.fillStyle = '#1e1b4b';
    ctx.fillRect(2, 2, 12, 8);
    ctx.fillRect(4, 1, 8, 1);
    ctx.fillRect(4, 10, 8, 1);

    // Shell rim highlight
    ctx.fillStyle = '#312e81';
    ctx.fillRect(3, 3, 9, 2);

    // 2. Horn (Amber gold)
    ctx.fillStyle = P.HONEY_AMBER;
    ctx.fillRect(13, 4, 3, 3);
    ctx.fillRect(15, 2, 2, 3);
    ctx.fillStyle = P.HONEY_PALE;
    ctx.fillRect(16, 1, 1, 2);

    // 3. Eye (Red)
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(12, 4, 2, 2);

    // 4. Exposed Core when Vulnerable / Stunned
    if (enemy.isVulnerable) {
      const corePulse = Math.floor(this.tick * 10) % 2 === 0;
      ctx.fillStyle = corePulse ? P.HONEY_PALE : P.HONEY_AMBER;
      ctx.fillRect(3, 4, 5, 4);
    }

    // 5. Walking Legs (2 frames)
    ctx.fillStyle = '#0f172a';
    if (walkFrame === 0) {
      ctx.fillRect(4, 11, 2, 2);
      ctx.fillRect(9, 11, 2, 2);
    } else {
      ctx.fillRect(6, 11, 2, 2);
      ctx.fillRect(11, 11, 2, 2);
    }

    ctx.restore();
  }

  /**
   * Draw Hive Grub in 256x240 pixel space.
   */
  drawHiveGrub(ctx, screenX, screenY, width, height, enemy) {
    if (enemy.isDead && enemy.defeatTimer > enemy.defeatDuration) return;

    ctx.save();
    const px = Math.round(screenX);
    const py = Math.round(screenY);
    const facing = enemy.facing || 1;

    // Squashed on stomp
    if (enemy.isDead) {
      ctx.fillStyle = P.HONEY_DARK;
      ctx.fillRect(px, py + 5, 12, 2);
      ctx.fillStyle = P.HONEY_AMBER;
      ctx.fillRect(px + 2, py + 4, 8, 2);
      ctx.restore();
      return;
    }

    if (facing < 0) {
      ctx.translate(px + 12, py);
      ctx.scale(-1, 1);
    } else {
      ctx.translate(px, py);
    }

    const crawlPhase = Math.floor(this.tick * 7) % 2;

    if (crawlPhase === 0) {
      // Extended crawling frame
      ctx.fillStyle = P.HONEY_AMBER;
      ctx.fillRect(0, 3, 3, 4);
      ctx.fillRect(3, 2, 3, 5);
      ctx.fillRect(6, 2, 3, 5);
      ctx.fillRect(9, 3, 3, 4);

      // Spots & eyes
      ctx.fillStyle = '#18181b';
      ctx.fillRect(10, 4, 1, 2); // Eye
      ctx.fillRect(4, 3, 1, 1);
      ctx.fillRect(7, 3, 1, 1);
    } else {
      // Compressed hunching frame
      ctx.fillStyle = P.HONEY_AMBER;
      ctx.fillRect(1, 3, 3, 4);
      ctx.fillRect(4, 1, 3, 6);
      ctx.fillRect(7, 3, 3, 4);

      // Spots & eyes
      ctx.fillStyle = '#18181b';
      ctx.fillRect(8, 4, 1, 2);
      ctx.fillRect(5, 2, 1, 1);
    }

    ctx.restore();
  }

  /**
   * Draw Hive Firefly in 256x240 pixel space.
   */
  drawHiveFirefly(ctx, screenX, screenY, width, height, enemy) {
    if (enemy.isDead && enemy.defeatTimer > enemy.defeatDuration) return;

    ctx.save();
    const px = Math.round(screenX);
    const py = Math.round(screenY);

    if (enemy.isDead) {
      ctx.globalAlpha = Math.max(0, 1 - enemy.defeatTimer / enemy.defeatDuration);
    }

    const wingFrame = Math.floor(this.tick * 12) % 2;
    const pulse = Math.floor(this.tick * 6) % 2;

    // Wings
    ctx.fillStyle = '#e2e8f0';
    if (wingFrame === 0) {
      ctx.fillRect(px + 1, py, 3, 2);
      ctx.fillRect(px + 5, py, 3, 2);
    } else {
      ctx.fillRect(px, py + 1, 2, 2);
      ctx.fillRect(px + 7, py + 1, 2, 2);
    }

    // Bug head & thorax
    ctx.fillStyle = '#334155';
    ctx.fillRect(px + 3, py + 2, 4, 3);

    // Glowing lantern abdomen
    ctx.fillStyle = pulse ? P.HONEY_PALE : P.HONEY_AMBER;
    ctx.fillRect(px + 3, py + 5, 4, 3);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(px + 4, py + 6, 2, 1);

    ctx.restore();
  }

  /**
   * Draw Honey Wisp in 256x240 pixel space.
   */
  drawHoneyWisp(ctx, screenX, screenY, width, height, enemy) {
    if (enemy.isDead && enemy.defeatTimer > enemy.defeatDuration) return;

    ctx.save();
    const px = Math.round(screenX);
    // Gentle bobbing motion
    const bob = Math.round(Math.sin(this.tick * 4) * 1.5);
    const py = Math.round(screenY) + bob;

    if (enemy.isDead) {
      ctx.globalAlpha = Math.max(0, 1 - enemy.defeatTimer / enemy.defeatDuration);
    }

    const flameFrame = Math.floor(this.tick * 8) % 2;

    // Outer warm amber flame
    ctx.fillStyle = P.HONEY_DARK;
    ctx.fillRect(px + 3, py + 1, 4, 9);
    ctx.fillRect(px + 1, py + 3, 8, 6);

    // Inner bright gold
    ctx.fillStyle = P.HONEY_AMBER;
    ctx.fillRect(px + 2, py + 4, 6, 5);

    // Core white-yellow
    ctx.fillStyle = P.HONEY_PALE;
    ctx.fillRect(px + 3, py + 5, 4, 3);

    // Animated flame tip
    ctx.fillStyle = P.HONEY_AMBER;
    if (flameFrame === 0) {
      ctx.fillRect(px + 4, py, 2, 2);
    } else {
      ctx.fillRect(px + 5, py, 2, 2);
    }

    // Little cute dark wisp eyes
    ctx.fillStyle = '#1e1b4b';
    ctx.fillRect(px + 3, py + 5, 1, 2);
    ctx.fillRect(px + 6, py + 5, 1, 2);

    ctx.restore();
  }
}

export const pixelEnemyRenderer = new PixelEnemyRenderer();
