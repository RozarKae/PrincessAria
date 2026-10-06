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

    // 1. Armored Carapace Body (Deep cosmic indigo with sub-pixel gradient)
    ctx.fillStyle = '#110e2e';
    ctx.fillRect(2, 2, 12, 8);
    ctx.fillRect(4, 1, 8, 1);
    ctx.fillRect(4, 10, 8, 1);

    // Shell midtone & specular cyber-rim highlight
    ctx.fillStyle = '#27236d';
    ctx.fillRect(3, 3, 10, 2);
    ctx.fillRect(3, 7, 10, 2);
    ctx.fillStyle = '#6366f1';
    ctx.fillRect(5, 2, 6, 1); // Top shell specular glint
    ctx.fillRect(4, 3, 2, 1);

    // 2. Horn (Multi-tier polished amber gold with sharp specular tip)
    ctx.fillStyle = P.HONEY_DARK;
    ctx.fillRect(13, 5, 2, 2);
    ctx.fillStyle = P.HONEY_AMBER;
    ctx.fillRect(13, 3, 3, 3);
    ctx.fillRect(15, 2, 2, 3);
    ctx.fillStyle = P.HONEY_PALE;
    ctx.fillRect(16, 1, 1, 2);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(16, 1, 1, 1); // Horn tip glint

    // 3. Eye (Bioluminescent ruby with white pupil glint)
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(12, 4, 2, 2);
    ctx.fillStyle = '#fca5a5';
    ctx.fillRect(12, 4, 1, 1);

    // 4. Exposed Core when Vulnerable / Stunned
    if (enemy.isVulnerable) {
      const corePulse = Math.floor(this.tick * 10) % 2 === 0;
      ctx.fillStyle = corePulse ? P.HONEY_CORE : P.HONEY_AMBER;
      ctx.fillRect(3, 4, 5, 4);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(4, 5, 3, 2);
    }

    // 5. Walking Legs (2 frames with chitin joints)
    ctx.fillStyle = '#090d16';
    if (walkFrame === 0) {
      ctx.fillRect(4, 11, 2, 2);
      ctx.fillRect(9, 11, 2, 2);
      ctx.fillStyle = '#475569';
      ctx.fillRect(4, 11, 1, 1);
      ctx.fillRect(9, 11, 1, 1);
    } else {
      ctx.fillRect(6, 11, 2, 2);
      ctx.fillRect(11, 11, 2, 2);
      ctx.fillStyle = '#475569';
      ctx.fillRect(6, 11, 1, 1);
      ctx.fillRect(11, 11, 1, 1);
    }

    ctx.restore();
  }

  /**
   * Draw Hive Grub in 320x240 pixel space with modern accordion caterpillar segmentation.
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
      // Extended crawling frame with multi-shade segmentation
      ctx.fillStyle = P.HONEY_DARK;
      ctx.fillRect(0, 4, 3, 3);
      ctx.fillRect(3, 3, 3, 4);
      ctx.fillRect(6, 3, 3, 4);
      ctx.fillRect(9, 4, 3, 3);

      ctx.fillStyle = P.HONEY_AMBER;
      ctx.fillRect(0, 3, 3, 3);
      ctx.fillRect(3, 2, 3, 4);
      ctx.fillRect(6, 2, 3, 4);
      ctx.fillRect(9, 3, 3, 3);

      // Dorsal golden highlight ridges
      ctx.fillStyle = P.HONEY_CORE;
      ctx.fillRect(1, 2, 1, 1);
      ctx.fillRect(4, 1, 1, 1);
      ctx.fillRect(7, 1, 1, 1);
      ctx.fillRect(10, 2, 1, 1);

      // Spots & eyes with glint
      ctx.fillStyle = '#18181b';
      ctx.fillRect(10, 4, 1, 2); // Eye
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(10, 4, 1, 1); // Eye sparkle
      ctx.fillStyle = '#78350f';
      ctx.fillRect(4, 3, 1, 1);
      ctx.fillRect(7, 3, 1, 1);
    } else {
      // Compressed hunching frame
      ctx.fillStyle = P.HONEY_DARK;
      ctx.fillRect(1, 4, 3, 3);
      ctx.fillRect(4, 2, 3, 5);
      ctx.fillRect(7, 4, 3, 3);

      ctx.fillStyle = P.HONEY_AMBER;
      ctx.fillRect(1, 3, 3, 3);
      ctx.fillRect(4, 1, 3, 5);
      ctx.fillRect(7, 3, 3, 3);

      // Dorsal golden highlight
      ctx.fillStyle = P.HONEY_CORE;
      ctx.fillRect(2, 2, 1, 1);
      ctx.fillRect(5, 0, 1, 1);
      ctx.fillRect(8, 2, 1, 1);

      // Spots & eyes
      ctx.fillStyle = '#18181b';
      ctx.fillRect(8, 4, 1, 2);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(8, 4, 1, 1);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(5, 2, 1, 1);
    }

    ctx.restore();
  }

  /**
   * Draw Hive Firefly with pulsating lantern abdomen and translucent wings.
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

    // Translucent gossamer wings
    ctx.fillStyle = 'rgba(226, 232, 240, 0.85)';
    if (wingFrame === 0) {
      ctx.fillRect(px + 1, py, 3, 2);
      ctx.fillRect(px + 5, py, 3, 2);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(px + 2, py, 1, 1);
      ctx.fillRect(px + 6, py, 1, 1);
    } else {
      ctx.fillRect(px, py + 1, 2, 2);
      ctx.fillRect(px + 7, py + 1, 2, 2);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(px + 1, py + 1, 1, 1);
      ctx.fillRect(px + 8, py + 1, 1, 1);
    }

    // Bug head & thorax
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(px + 3, py + 2, 4, 3);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(px + 4, py + 3, 2, 1); // Cyber visor eye

    // Glowing lantern abdomen with volumetric radial glow
    ctx.fillStyle = pulse ? P.HONEY_PALE : P.HONEY_AMBER;
    ctx.fillRect(px + 3, py + 5, 4, 3);
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(px + 4, py + 6, 2, 2);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(px + 4, py + 6, 1, 1); // Specular filament glint

    ctx.restore();
  }

  /**
   * Draw Honey Wisp with multi-tier celestial flame droplet layers.
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

    // Outer warm amber flame rim
    ctx.fillStyle = P.HONEY_DARK;
    ctx.fillRect(px + 3, py + 1, 4, 9);
    ctx.fillRect(px + 1, py + 3, 8, 6);

    // Midtone warm honey
    ctx.fillStyle = P.HONEY_AMBER;
    ctx.fillRect(px + 2, py + 3, 6, 6);

    // Inner bright gold
    ctx.fillStyle = P.HONEY_PALE;
    ctx.fillRect(px + 3, py + 4, 4, 4);

    // Core white-hot radiance
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(px + 4, py + 5, 2, 2);

    // Animated dancing flame tip
    ctx.fillStyle = P.HONEY_AMBER;
    if (flameFrame === 0) {
      ctx.fillRect(px + 4, py, 2, 2);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(px + 4, py, 1, 1);
    } else {
      ctx.fillRect(px + 5, py, 2, 2);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(px + 5, py, 1, 1);
    }

    // Little cute dark wisp eyes with white sparkle
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(px + 3, py + 5, 1, 2);
    ctx.fillRect(px + 6, py + 5, 1, 2);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(px + 3, py + 5, 1, 1);
    ctx.fillRect(px + 6, py + 5, 1, 1);

    ctx.restore();
  }

  /**
   * Draw Shadow Squirrel with deep midnight violet fur, cosmic tail aura, and specular eye gleam.
   */
  drawShadowSquirrel(ctx, screenX, screenY, width, height, enemy) {
    if (enemy.isDead && enemy.defeatTimer > enemy.defeatDuration) return;

    ctx.save();
    const px = Math.round(screenX);
    const py = Math.round(screenY);
    const w = 14;
    const h = 11;

    if (enemy.isDead) {
      ctx.globalAlpha = Math.max(0, 1 - enemy.defeatTimer / enemy.defeatDuration);
    }

    const facing = enemy.facing || 1;
    if (facing < 0) {
      ctx.translate(px + w, py);
      ctx.scale(-1, 1);
    } else {
      ctx.translate(px, py);
    }

    const scamper = Math.floor(this.tick * 10) % 2;

    // Bushy Shadow Tail (curving upward behind with cosmic rim highlight)
    ctx.fillStyle = '#2e1065';
    ctx.fillRect(0, 1, 5, 8);
    ctx.fillStyle = '#6b21a8';
    ctx.fillRect(1, 0, 4, 3);
    ctx.fillStyle = '#a855f7';
    ctx.fillRect(2, 2, 2, 5);
    ctx.fillStyle = '#e9d5ff';
    ctx.fillRect(2, 1, 2, 1); // Specular tail fur glint

    // Body with deep shadow shading
    ctx.fillStyle = '#1e1124';
    ctx.fillRect(5, 5, 6, 4);
    ctx.fillStyle = '#3b0764';
    ctx.fillRect(5, 3, 6, 3);

    // Head
    ctx.fillStyle = '#2e1065';
    ctx.fillRect(9, 2, 4, 4);

    // Ears with luminous inner tips
    ctx.fillStyle = '#7e22ce';
    ctx.fillRect(10, 0, 2, 2);
    ctx.fillRect(12, 1, 1, 1);
    ctx.fillStyle = '#f5d0fe';
    ctx.fillRect(11, 0, 1, 1);

    // Bright Amber/Ruby Eye with glint
    ctx.fillStyle = '#fde047';
    ctx.fillRect(11, 3, 2, 2);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(11, 3, 1, 1);

    // Scampering Little Paws (2 frames)
    ctx.fillStyle = '#0f172a';
    if (enemy.isLeaping) {
      // Extended leaping aerodynamic pose
      ctx.fillRect(4, 9, 3, 1);
      ctx.fillRect(10, 8, 3, 1);
      ctx.fillStyle = '#a855f7';
      ctx.fillRect(3, 9, 1, 1);
    } else if (scamper === 0) {
      ctx.fillRect(5, 9, 2, 2);
      ctx.fillRect(9, 9, 2, 2);
    } else {
      ctx.fillRect(7, 9, 2, 2);
      ctx.fillRect(11, 9, 2, 2);
    }

    ctx.restore();
  }

  /**
   * Draw Thorn Goblin with armored bramble shield and menacing crimson pupil.
   */
  drawThornGoblin(ctx, screenX, screenY, width, height, enemy) {
    if (enemy.isDead && enemy.defeatTimer > enemy.defeatDuration) return;

    ctx.save();
    const px = Math.round(screenX);
    const py = Math.round(screenY);
    const w = 16;
    const h = 14;

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

    // 1. ROLLING BRAMBLE BALL STATE
    if (enemy.isRolling) {
      const rot = Math.floor(this.tick * 18) % 4;
      ctx.fillStyle = '#2e1065';
      ctx.fillRect(2, 2, 12, 12);
      ctx.fillStyle = '#581c87';
      ctx.fillRect(4, 4, 8, 8);
      ctx.fillStyle = '#9333ea';
      ctx.fillRect(5, 5, 6, 6);
      // Red sharp thorn spikes radiating out with razor tips
      ctx.fillStyle = '#ef4444';
      if (rot % 2 === 0) {
        ctx.fillRect(7, 0, 2, 2);
        ctx.fillRect(7, 14, 2, 2);
        ctx.fillRect(0, 7, 2, 2);
        ctx.fillRect(14, 7, 2, 2);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(7, 0, 1, 1);
        ctx.fillRect(14, 7, 1, 1);
      } else {
        ctx.fillRect(2, 2, 2, 2);
        ctx.fillRect(12, 2, 2, 2);
        ctx.fillRect(2, 12, 2, 2);
        ctx.fillRect(12, 12, 2, 2);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(2, 2, 1, 1);
        ctx.fillRect(12, 12, 1, 1);
      }
      ctx.restore();
      return;
    }

    // 2. NORMAL / PATROL / RECOVER STATE
    // Goblin Body (Dark forest moss green with shaded belly)
    ctx.fillStyle = '#064e3b';
    ctx.fillRect(3, 4, 8, 7);
    ctx.fillStyle = '#047857';
    ctx.fillRect(4, 5, 6, 5);

    // Goblin Head
    ctx.fillStyle = '#059669';
    ctx.fillRect(5, 2, 6, 5);
    ctx.fillStyle = '#10b981';
    ctx.fillRect(6, 2, 4, 1); // Forehead highlight

    // Pointy Goblin Ears
    ctx.fillStyle = '#047857';
    ctx.fillRect(3, 1, 2, 2);
    ctx.fillStyle = '#6ee7b7';
    ctx.fillRect(3, 1, 1, 1);

    // Red Gleaming Eye with specular spark
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(8, 3, 2, 2);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(8, 3, 1, 1);

    // Legs
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(4, 11, 2, 3);
    ctx.fillRect(8, 11, 2, 3);

    // Thorn Bramble Shield
    if (enemy.isVulnerable) {
      // Shield resting flat on floor during recovery!
      ctx.fillStyle = '#2e1065';
      ctx.fillRect(8, 12, 7, 2);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(10, 11, 3, 1);
      // Dizzy stars over head
      const starBlink = Math.floor(this.tick * 8) % 2 === 0;
      if (starBlink) {
        ctx.fillStyle = '#fde047';
        ctx.fillRect(5, 0, 2, 1);
        ctx.fillRect(9, 0, 2, 1);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(6, 0, 1, 1);
      }
    } else {
      // Upright curved thorn shield held in front
      ctx.fillStyle = '#2e1065';
      ctx.fillRect(10, 2, 4, 10);
      ctx.fillStyle = '#581c87';
      ctx.fillRect(11, 3, 2, 8);
      ctx.fillStyle = '#a855f7';
      ctx.fillRect(11, 3, 1, 8); // Shield specular rim
      // Red sharp thorn studs
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(14, 3, 2, 2);
      ctx.fillRect(14, 7, 2, 2);
      ctx.fillStyle = '#fca5a5';
      ctx.fillRect(15, 3, 1, 1);
      ctx.fillRect(15, 7, 1, 1);
    }

    ctx.restore();
  }

  /**
   * Draw Vine Crawler with segmented obsidian chitin and pulsating bio-spore core.
   */
  drawVineCrawler(ctx, screenX, screenY, width, height, enemy) {
    if (enemy.isDead && enemy.defeatTimer > enemy.defeatDuration) return;

    ctx.save();
    const px = Math.round(screenX);
    const py = Math.round(screenY);

    if (enemy.isDead) {
      ctx.globalAlpha = Math.max(0, 1 - enemy.defeatTimer / enemy.defeatDuration);
    }

    const crawl = Math.floor(this.tick * 7) % 2;

    // Segmented Thorny Body (Deep dark chitin)
    ctx.fillStyle = '#0f0a14';
    ctx.fillRect(px + 2, py + 5, 10, 4);
    ctx.fillStyle = '#2e1065';
    ctx.fillRect(px + 3, py + 4, 8, 4);

    // Glowing Bioluminescent Spore Bulb on back
    const pulse = Math.floor(this.tick * 6) % 2 === 0;
    ctx.fillStyle = pulse ? '#c084fc' : '#9333ea';
    ctx.fillRect(px + 4, py + 1, 6, 4);
    ctx.fillStyle = '#f5d0fe';
    ctx.fillRect(px + 5, py + 2, 4, 2);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(px + 6, py + 2, 2, 1); // Spore nucleus glint

    // Multi-legged Thorny Crawlers (2 frames)
    ctx.fillStyle = '#4c1d95';
    if (crawl === 0) {
      ctx.fillRect(px + 2, py + 8, 2, 2);
      ctx.fillRect(px + 6, py + 8, 2, 2);
      ctx.fillRect(px + 10, py + 8, 2, 2);
      ctx.fillStyle = '#8b5cf6';
      ctx.fillRect(px + 2, py + 8, 1, 1);
      ctx.fillRect(px + 6, py + 8, 1, 1);
    } else {
      ctx.fillRect(px + 3, py + 8, 2, 2);
      ctx.fillRect(px + 7, py + 8, 2, 2);
      ctx.fillRect(px + 11, py + 8, 2, 2);
      ctx.fillStyle = '#8b5cf6';
      ctx.fillRect(px + 3, py + 8, 1, 1);
      ctx.fillRect(px + 7, py + 8, 1, 1);
    }

    // Small glowing venom whiskers
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(px + 12, py + 4, 2, 1);
    ctx.fillStyle = '#fca5a5';
    ctx.fillRect(px + 13, py + 4, 1, 1);

    ctx.restore();
  }

  /**
   * Draw Spore Bomber with glowing cyan mushroom cap, translucent gills, and trailing spore tendrils.
   */
  drawSporeBomber(ctx, screenX, screenY, width, height, enemy) {
    if (enemy.isDead && enemy.defeatTimer > enemy.defeatDuration) return;

    ctx.save();
    const px = Math.round(screenX);
    const py = Math.round(screenY);

    if (enemy.isDead) {
      ctx.globalAlpha = Math.max(0, 1 - enemy.defeatTimer / enemy.defeatDuration);
    }

    const pulse = Math.floor(this.tick * 6) % 2 === 0;

    // Luminous Cyan Mushroom Dome Cap with 4-tone shading
    ctx.fillStyle = '#075985';
    ctx.fillRect(px + 1, py + 4, 12, 5);
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(px + 2, py + 2, 10, 5);
    ctx.fillStyle = '#0ea5e9';
    ctx.fillRect(px + 3, py + 1, 8, 3);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(px + 4, py, 6, 2);

    // Bioluminescent Spore Spots
    ctx.fillStyle = pulse ? '#ffffff' : '#7dd3fc';
    ctx.fillRect(px + 4, py + 2, 2, 2);
    ctx.fillRect(px + 8, py + 2, 2, 2);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(px + 4, py + 2, 1, 1);
    ctx.fillRect(px + 8, py + 2, 1, 1);

    // Gills underside with neon glow
    ctx.fillStyle = '#7dd3fc';
    ctx.fillRect(px + 2, py + 8, 10, 2);
    ctx.fillStyle = P.FUNGUS_CYAN_GLOW;
    ctx.fillRect(px + 3, py + 9, 8, 1);

    // Hanging Spore Tendrils
    ctx.fillStyle = '#bae6fd';
    const tentacleFrame = Math.floor(this.tick * 5) % 2;
    if (tentacleFrame === 0) {
      ctx.fillRect(px + 3, py + 10, 1, 3);
      ctx.fillRect(px + 6, py + 10, 1, 4);
      ctx.fillRect(px + 9, py + 10, 1, 3);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(px + 6, py + 13, 1, 1);
    } else {
      ctx.fillRect(px + 4, py + 10, 1, 4);
      ctx.fillRect(px + 7, py + 10, 1, 3);
      ctx.fillRect(px + 10, py + 10, 1, 4);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(px + 4, py + 13, 1, 1);
    }

    ctx.restore();
  }

  /**
   * Draw Forest King Boss with ancient sacred oak textures, corrupted vs purified states, and luminous weakpoints.
   */
  drawForestKing(ctx, screenX, screenY, width, height, boss) {
    ctx.save();
    const px = Math.round(screenX);
    const py = Math.round(screenY);

    // Massive Ancient Oak Trunk with deep wood grain
    ctx.fillStyle = '#18110b';
    ctx.fillRect(px + 6, py + 10, 36, 54);
    ctx.fillStyle = '#3b2618';
    ctx.fillRect(px + 10, py + 14, 28, 48);
    ctx.fillStyle = '#52341e';
    ctx.fillRect(px + 12, py + 16, 4, 44);
    ctx.fillRect(px + 28, py + 18, 4, 40);

    // Ancient Carved Face
    ctx.fillStyle = '#0a0604';
    // Brow
    ctx.fillRect(px + 14, py + 20, 20, 3);
    // Nose
    ctx.fillRect(px + 22, py + 24, 4, 8);
    // Mouth
    ctx.fillRect(px + 18, py + 34, 12, 4);

    // Eyes: Corrupted Purple vs Awakened Emerald with high-radiance iris
    const isPurified = boss.isPurified;
    const eyeColor = isPurified ? '#22c55e' : '#d946ef';
    ctx.fillStyle = eyeColor;
    ctx.fillRect(px + 16, py + 24, 4, 3);
    ctx.fillRect(px + 28, py + 24, 4, 3);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(px + 17, py + 24, 2, 1);
    ctx.fillRect(px + 29, py + 24, 2, 1);

    // Corrupted Root Nodes with pulsating rings
    if (!isPurified && boss.cores) {
      boss.cores.forEach((core, idx) => {
        if (!core.severed) {
          const coreBlink = Math.floor(this.tick * 6 + idx * 2) % 2 === 0;
          ctx.fillStyle = coreBlink ? '#f0abfc' : '#c026d3';
          if (idx === 0) {
            ctx.fillRect(px - 14, py + 24, 10, 10);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(px - 12, py + 26, 6, 6);
            ctx.fillStyle = '#fae8ff';
            ctx.fillRect(px - 10, py + 28, 2, 2);
          } else if (idx === 1) {
            ctx.fillRect(px + 52, py + 24, 10, 10);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(px + 54, py + 26, 6, 6);
            ctx.fillStyle = '#fae8ff';
            ctx.fillRect(px + 56, py + 28, 2, 2);
          } else {
            ctx.fillRect(px + 18, py - 4, 12, 12);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(px + 21, py - 1, 6, 6);
            ctx.fillStyle = '#fae8ff';
            ctx.fillRect(px + 23, py + 1, 2, 2);
          }
        }
      });
    }

    // Antler-like Crown Branches with mossy leaf tips
    ctx.fillStyle = '#3b2618';
    ctx.fillRect(px + 4, py + 2, 8, 8);
    ctx.fillRect(px + 36, py + 2, 8, 8);
    ctx.fillStyle = isPurified ? '#4ade80' : '#a855f7';
    ctx.fillRect(px + 3, py + 1, 3, 3);
    ctx.fillRect(px + 42, py + 1, 3, 3);

    ctx.restore();
  }

  /**
   * Draw Door Goblin (Mimic Door) in 256x240 pixel space.
   */
  drawDoorGoblin(ctx, screenX, screenY, width, height, enemy) {
    if (enemy.isDead && enemy.defeatTimer > enemy.defeatDuration) return;

    ctx.save();
    const px = Math.round(screenX);
    const py = Math.round(screenY);
    const w = 16;
    const h = 22;

    if (enemy.isDead) {
      ctx.globalAlpha = Math.max(0, 1 - enemy.defeatTimer / enemy.defeatDuration);
    }

    const facing = enemy.facing || 1;
    if (facing < 0) {
      ctx.translate(px + w, py);
      ctx.scale(-1, 1);
    } else {
      ctx.translate(px, py);
    }

    // Door frame & timber planks
    ctx.fillStyle = '#1c1007';
    ctx.fillRect(1, 1, 14, 20);
    ctx.fillStyle = '#451a03';
    ctx.fillRect(2, 2, 12, 18);
    ctx.fillStyle = '#78350f';
    ctx.fillRect(4, 3, 3, 16);
    ctx.fillRect(9, 3, 3, 16);

    // Iron reinforcement bands
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(2, 5, 12, 2);
    ctx.fillRect(2, 15, 12, 2);

    if (enemy.isChomping || !enemy.isDisguised) {
      // Mouth agape with sharp wooden teeth
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(3, 8, 10, 6);
      ctx.fillStyle = '#ffffff';
      // Top teeth
      ctx.fillRect(4, 8, 2, 2);
      ctx.fillRect(7, 8, 2, 2);
      ctx.fillRect(10, 8, 2, 2);
      // Bottom teeth
      ctx.fillRect(5, 12, 2, 2);
      ctx.fillRect(8, 12, 2, 2);
      // Tongue
      ctx.fillStyle = '#f43f5e';
      ctx.fillRect(6, 11, 4, 3);

      // Spindly running legs
      ctx.fillStyle = '#1c1007';
      const legStep = Math.floor(this.tick * 10) % 2;
      ctx.fillRect(3, 20, 3, 3 + (legStep ? 1 : -1));
      ctx.fillRect(10, 20, 3, 3 + (legStep ? -1 : 1));
    } else {
      // Golden keyhole and brass knob
      const rattle = enemy.isTelegraphing ? (Math.random() < 0.5 ? -1 : 1) : 0;
      ctx.fillStyle = enemy.isTelegraphing ? '#ef4444' : '#fbbf24';
      ctx.fillRect(11 + rattle, 10, 2, 3);
      ctx.fillRect(11 + rattle, 13, 2, 2);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(12 + rattle, 10, 1, 1);
    }

    ctx.restore();
  }

  /**
   * Draw Flying Key in 256x240 pixel space.
   */
  drawFlyingKey(ctx, screenX, screenY, width, height, enemy) {
    if (enemy.isDead && enemy.defeatTimer > enemy.defeatDuration) return;

    ctx.save();
    const px = Math.round(screenX);
    const py = Math.round(screenY);
    const w = 14;
    const h = 14;

    if (enemy.isDead) {
      ctx.globalAlpha = Math.max(0, 1 - enemy.defeatTimer / enemy.defeatDuration);
    }

    ctx.translate(px, py);

    // Animated Fluttering Feathery Wings
    const wingUp = Math.floor(this.tick * 14) % 2 === 0;
    ctx.fillStyle = '#ffffff';
    if (wingUp) {
      ctx.fillRect(1, 0, 4, 3);
      ctx.fillRect(9, 0, 4, 3);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(2, 1, 2, 1);
      ctx.fillRect(10, 1, 2, 1);
    } else {
      ctx.fillRect(1, 4, 4, 3);
      ctx.fillRect(9, 4, 4, 3);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(2, 5, 2, 1);
      ctx.fillRect(10, 5, 2, 1);
    }

    // Golden Skeleton Key Head (Ring)
    ctx.fillStyle = '#d97706';
    ctx.fillRect(4, 2, 6, 6);
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(5, 3, 4, 4);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(6, 4, 2, 2);

    // Key Stem
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(6, 8, 2, 5);

    // Key Teeth / Bit
    ctx.fillStyle = '#fde047';
    ctx.fillRect(8, 10, 3, 1);
    ctx.fillRect(8, 12, 2, 1);

    // Specular Glint
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(5, 3, 1, 1);

    ctx.restore();
  }

  /**
   * Draw Enchanted Broom in 256x240 pixel space.
   */
  drawEnchantedBroom(ctx, screenX, screenY, width, height, enemy) {
    if (enemy.isDead && enemy.defeatTimer > enemy.defeatDuration) return;

    ctx.save();
    const px = Math.round(screenX);
    const py = Math.round(screenY);
    const w = 14;
    const h = 20;

    if (enemy.isDead) {
      ctx.globalAlpha = Math.max(0, 1 - enemy.defeatTimer / enemy.defeatDuration);
    }

    const facing = enemy.facing || 1;
    if (facing < 0) {
      ctx.translate(px + w, py);
      ctx.scale(-1, 1);
    } else {
      ctx.translate(px, py);
    }

    // Handle tilt
    const sweepLean = Math.sin(this.tick * 8) * 0.15;
    ctx.rotate(sweepLean);

    // Polished Wooden Handle
    ctx.fillStyle = '#451a03';
    ctx.fillRect(9, 1, 2, 12);
    ctx.fillStyle = '#78350f';
    ctx.fillRect(10, 1, 1, 12);

    // Mystical Purple Spark at Handle Tip
    ctx.fillStyle = '#c084fc';
    ctx.fillRect(9, 0, 2, 2);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(9, 0, 1, 1);

    // Straw Bristles Bundle
    ctx.fillStyle = '#b45309';
    ctx.fillRect(6, 12, 6, 6);
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(5, 14, 7, 5);
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(4, 17, 8, 2);

    // Binding twine band
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(6, 13, 6, 1);

    ctx.restore();
  }

  /**
   * Draw Castle Knight in 256x240 pixel space.
   */
  drawCastleKnight(ctx, screenX, screenY, width, height, enemy) {
    if (enemy.isDead && enemy.defeatTimer > enemy.defeatDuration) return;

    ctx.save();
    const px = Math.round(screenX);
    const py = Math.round(screenY);
    const w = 18;
    const h = 24;

    if (enemy.isDead) {
      ctx.globalAlpha = Math.max(0, 1 - enemy.defeatTimer / enemy.defeatDuration);
    }

    const facing = enemy.facing || 1;
    if (facing < 0) {
      ctx.translate(px + w, py);
      ctx.scale(-1, 1);
    } else {
      ctx.translate(px, py);
    }

    const step = Math.floor(this.tick * 4) % 2;

    // Red Royal Cape behind armor
    ctx.fillStyle = '#831843';
    ctx.fillRect(2, 8, 4, 12);

    // Armored Legs
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(5, 17, 3, 5 + (step ? 1 : 0));
    ctx.fillRect(10, 17, 3, 5 + (step ? 0 : 1));

    // Steel Cuirass (Torso)
    ctx.fillStyle = '#334155';
    ctx.fillRect(4, 8, 10, 9);
    ctx.fillStyle = '#64748b';
    ctx.fillRect(5, 9, 8, 7);

    // Helmet & Visor
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(5, 2, 8, 6);
    ctx.fillStyle = '#64748b';
    ctx.fillRect(6, 3, 6, 4);

    // Glowing Visor Eye Slit
    ctx.fillStyle = enemy.isTelegraphing ? '#ef4444' : '#38bdf8';
    ctx.fillRect(8, 4, 4, 1);

    // Helmet Plume / Crest
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(6, 0, 4, 2);

    // Heater Shield (Frontal defense)
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(12, 7, 5, 9);
    ctx.fillStyle = '#334155';
    ctx.fillRect(13, 8, 3, 7);
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(14, 9, 1, 5); // Golden shield crest line

    // Halberd Pole & Blade
    ctx.fillStyle = '#451a03';
    ctx.fillRect(1, 3, 2, 18);
    // Halberd Axe Blade
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(0, 2, 4, 4);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 1, 2, 2);

    ctx.restore();
  }

  /**
   * Draw Sir Slam-A-Lot (Boss) in 256x240 pixel space.
   */
  drawSirSlamALot(ctx, screenX, screenY, width, height, boss) {
    if (boss.isDead && boss.defeatTimer > boss.defeatDuration) return;

    ctx.save();
    const px = Math.round(screenX);
    const py = Math.round(screenY);
    const w = 48;
    const h = 54;

    if (boss.isDead) {
      ctx.globalAlpha = Math.max(0, 1 - boss.defeatTimer / boss.defeatDuration);
    }

    const facing = boss.facing || 1;
    if (facing < 0) {
      ctx.translate(px + w, py);
      ctx.scale(-1, 1);
    } else {
      ctx.translate(px, py);
    }

    // Heavy Plated Armored Legs
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(10, 38, 10, 14);
    ctx.fillRect(26, 38, 10, 14);
    ctx.fillStyle = '#334155';
    ctx.fillRect(12, 40, 6, 10);
    ctx.fillRect(28, 40, 6, 10);

    // Colossal Torso Cuirass
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(8, 16, 30, 24);
    ctx.fillStyle = '#334155';
    ctx.fillRect(10, 18, 26, 20);
    ctx.fillStyle = '#64748b';
    ctx.fillRect(13, 20, 20, 16);

    // Gold Trim & Royal Lion Insignia
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(18, 22, 10, 2);
    ctx.fillRect(22, 24, 2, 8);

    // Glowing Power Core on Back (Vulnerable when hammer stuck)
    const coreVulnerable = boss.isHammerStuck;
    ctx.fillStyle = coreVulnerable ? '#38bdf8' : '#1e293b';
    ctx.fillRect(6, 22, 4, 8);
    if (coreVulnerable) {
      const corePulse = Math.floor(this.tick * 8) % 2 === 0;
      ctx.fillStyle = corePulse ? '#ffffff' : '#7dd3fc';
      ctx.fillRect(7, 24, 2, 4);
    }

    // Horned Greathelm
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(14, 4, 18, 14);
    ctx.fillStyle = '#334155';
    ctx.fillRect(16, 6, 14, 10);

    // Golden Horns
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(10, 2, 4, 6);
    ctx.fillRect(32, 2, 4, 6);
    ctx.fillRect(8, 0, 3, 3);
    ctx.fillRect(35, 0, 3, 3);

    // Glowing Visor
    ctx.fillStyle = boss.isTelegraphing ? '#f97316' : '#38bdf8';
    ctx.fillRect(22, 9, 8, 2);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(24, 9, 2, 1);

    // Colossal Meteorite Warhammer
    ctx.save();
    if (boss.isSlamming || boss.isTelegraphing) {
      // Hammer overhead
      ctx.fillStyle = '#451a03';
      ctx.fillRect(22, -18, 4, 28);
      // Massive Spiked Hammerhead
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(14, -28, 20, 14);
      ctx.fillStyle = '#f97316';
      ctx.fillRect(18, -24, 12, 6);
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(20, -22, 8, 2);
    } else if (boss.isHammerStuck) {
      // Hammer lodged into ground in front
      ctx.fillStyle = '#451a03';
      ctx.fillRect(36, 20, 4, 28);
      // Embedded hammerhead
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(30, 40, 16, 12);
      ctx.fillStyle = '#f97316';
      ctx.fillRect(34, 42, 8, 6);
    } else {
      // Resting on shoulder
      ctx.fillStyle = '#451a03';
      ctx.fillRect(32, 6, 4, 28);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(28, 2, 14, 10);
      ctx.fillStyle = '#f97316';
      ctx.fillRect(30, 4, 10, 6);
    }
    ctx.restore();

    ctx.restore();
  }

  /**
   * Draw Fire Bee in 256x240 pixel space with incandescent stinger glow and fluttering flame wings.
   */
  drawFireBee(ctx, screenX, screenY, width, height, enemy) {
    if (enemy.isDead && enemy.defeatTimer > enemy.defeatDuration) return;

    ctx.save();
    const px = Math.round(screenX);
    const py = Math.round(screenY);
    const w = 14;
    const h = 14;

    if (enemy.isDead) {
      ctx.globalAlpha = Math.max(0, 1 - enemy.defeatTimer / enemy.defeatDuration);
    }

    const facing = enemy.facing || 1;
    if (facing < 0) {
      ctx.translate(px + w, py);
      ctx.scale(-1, 1);
    } else {
      ctx.translate(px, py);
    }

    const wingFrame = Math.floor(this.tick * 16) % 2;
    const pulse = Math.floor(this.tick * 8) % 2;

    // Fluttering flame wings
    ctx.fillStyle = wingFrame === 0 ? '#fef08a' : '#f97316';
    ctx.fillRect(3, 0, 4, 3);
    ctx.fillRect(8, 0, 4, 3);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(4, 1, 2, 1);
    ctx.fillRect(9, 1, 2, 1);

    // Torso & head (Dark obsidian abdomen with amber stripes)
    ctx.fillStyle = '#1c1514';
    ctx.fillRect(2, 3, 10, 7);
    ctx.fillStyle = '#ea580c';
    ctx.fillRect(4, 4, 6, 2);
    ctx.fillRect(4, 7, 6, 2);

    // Glowing ruby eyes
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(10, 4, 2, 2);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(11, 4, 1, 1);

    // Incandescent molten stinger
    ctx.fillStyle = pulse ? '#ffffff' : '#fef08a';
    ctx.fillRect(0, 5, 2, 3);
    ctx.fillStyle = '#f97316';
    ctx.fillRect(1, 4, 1, 5);

    // Dive-bomb trailing sparks
    if (enemy.isSwooping) {
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(-2, 6, 2, 2);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-4, 7, 2, 1);
    }

    ctx.restore();
  }

  /**
   * Draw Lava Beetle in 256x240 pixel space with armored basalt shell and glowing magma seams.
   */
  drawLavaBeetle(ctx, screenX, screenY, width, height, enemy) {
    if (enemy.isDead && enemy.defeatTimer > enemy.defeatDuration) return;

    ctx.save();
    const px = Math.round(screenX);
    const py = Math.round(screenY);
    const w = 18;
    const h = 13;

    if (enemy.isDead) {
      ctx.globalAlpha = Math.max(0, 1 - enemy.defeatTimer / enemy.defeatDuration);
    }

    const facing = enemy.facing || 1;

    // Flipped state: overturned on back with exposed magma belly and kicking legs
    if (enemy.isFlipped) {
      ctx.translate(px, py + h);
      ctx.scale(facing < 0 ? -1 : 1, -1);

      // Exposed soft glowing magma belly
      ctx.fillStyle = '#ea580c';
      ctx.fillRect(3, 3, 12, 6);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(5, 4, 8, 4);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(7, 5, 4, 2);

      // Kicking little legs
      const kick = Math.floor(this.tick * 10) % 2;
      ctx.fillStyle = '#1c1514';
      ctx.fillRect(4, 9 + (kick ? 1 : -1), 2, 3);
      ctx.fillRect(8, 9 + (kick ? -1 : 1), 2, 3);
      ctx.fillRect(12, 9 + (kick ? 1 : -1), 2, 3);

      ctx.restore();
      return;
    }

    if (facing < 0) {
      ctx.translate(px + w, py);
      ctx.scale(-1, 1);
    } else {
      ctx.translate(px, py);
    }

    const walkFrame = Math.floor(this.tick * 6) % 2;

    // 1. Armored Basalt Carapace Shell
    ctx.fillStyle = '#0a0808';
    ctx.fillRect(2, 2, 12, 8);
    ctx.fillRect(4, 1, 8, 1);

    // Shell midtone
    ctx.fillStyle = '#1c1514';
    ctx.fillRect(3, 3, 10, 3);
    ctx.fillRect(3, 7, 10, 2);

    // Glowing orange magma fissure veins
    ctx.fillStyle = '#ea580c';
    ctx.fillRect(5, 4, 6, 1);
    ctx.fillRect(4, 6, 8, 1);
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(6, 4, 4, 1);

    // 2. Basalt Horn
    ctx.fillStyle = '#342624';
    ctx.fillRect(13, 4, 3, 3);
    ctx.fillRect(15, 2, 2, 3);
    ctx.fillStyle = '#f97316';
    ctx.fillRect(16, 2, 1, 1); // Horn tip ember

    // 3. Eye
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(12, 4, 2, 2);
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(13, 4, 1, 1);

    // 4. Walking Legs
    ctx.fillStyle = '#0a0808';
    if (walkFrame === 0) {
      ctx.fillRect(4, 10, 2, 2);
      ctx.fillRect(10, 10, 2, 2);
    } else {
      ctx.fillRect(6, 10, 2, 2);
      ctx.fillRect(12, 10, 2, 2);
    }

    ctx.restore();
  }

  /**
   * Draw Magma Grub in 256x240 pixel space with glowing segmented accordion crawling.
   */
  drawMagmaGrub(ctx, screenX, screenY, width, height, enemy) {
    if (enemy.isDead && enemy.defeatTimer > enemy.defeatDuration) return;

    ctx.save();
    const px = Math.round(screenX);
    const py = Math.round(screenY);
    const facing = enemy.facing || 1;

    // Squashed on stomp
    if (enemy.isDead) {
      ctx.fillStyle = '#7c1d0d';
      ctx.fillRect(px, py + 5, 12, 2);
      ctx.fillStyle = '#f97316';
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

    const crawlPhase = Math.floor(this.tick * 6) % 2;

    if (crawlPhase === 0) {
      // Extended crawling frame
      ctx.fillStyle = '#7c1d0d';
      ctx.fillRect(0, 3, 3, 4);
      ctx.fillRect(3, 2, 3, 5);
      ctx.fillRect(6, 2, 3, 5);
      ctx.fillRect(9, 3, 3, 4);

      // Glowing magma ridge highlights
      ctx.fillStyle = '#ea580c';
      ctx.fillRect(0, 2, 3, 2);
      ctx.fillRect(3, 1, 3, 2);
      ctx.fillRect(6, 1, 3, 2);
      ctx.fillRect(9, 2, 3, 2);

      ctx.fillStyle = '#fef08a';
      ctx.fillRect(4, 1, 1, 1);
      ctx.fillRect(7, 1, 1, 1);

      // Eye
      ctx.fillStyle = '#1c1514';
      ctx.fillRect(10, 3, 1, 2);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(10, 3, 1, 1);
    } else {
      // Compressed hunching frame
      ctx.fillStyle = '#7c1d0d';
      ctx.fillRect(1, 3, 3, 4);
      ctx.fillRect(4, 1, 3, 6);
      ctx.fillRect(7, 3, 3, 4);

      ctx.fillStyle = '#ea580c';
      ctx.fillRect(1, 2, 3, 2);
      ctx.fillRect(4, 0, 3, 2);
      ctx.fillRect(7, 2, 3, 2);

      ctx.fillStyle = '#fef08a';
      ctx.fillRect(5, 0, 1, 1);

      // Eye
      ctx.fillStyle = '#1c1514';
      ctx.fillRect(8, 3, 1, 2);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(8, 3, 1, 1);
    }

    ctx.restore();
  }

  /**
   * Draw The Honey Dragon (Ignis the Honey Wyrm) in 256x240 pixel space.
   */
  drawHoneyDragon(ctx, screenX, screenY, width, height, boss) {
    if (boss.isDead && boss.defeatTimer > boss.defeatDuration) return;

    ctx.save();
    const px = Math.round(screenX);
    const py = Math.round(screenY);
    const w = 48;
    const h = 36;

    if (boss.isDead) {
      ctx.globalAlpha = Math.max(0, 1 - boss.defeatTimer / boss.defeatDuration);
    }

    const facing = boss.facing || 1;
    if (facing < 0) {
      ctx.translate(px + w, py);
      ctx.scale(-1, 1);
    } else {
      ctx.translate(px, py);
    }

    const wingFlap = Math.floor(this.tick * 8) % 2;

    // 1. Great Membranous Dragon Wings (Hardened amber & molten gold)
    ctx.fillStyle = '#7c2d12';
    if (wingFlap === 0) {
      ctx.fillRect(14, -8, 22, 14);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(16, -6, 18, 10);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(18, -4, 14, 2);
    } else {
      ctx.fillRect(14, 2, 22, 12);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(16, 4, 18, 8);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(18, 6, 14, 2);
    }

    // 2. Serpentine Muscular Dragon Body (Hardened amber crystal scales)
    ctx.fillStyle = '#7c2d12';
    ctx.fillRect(10, 12, 26, 16);
    ctx.fillStyle = '#c2410c';
    ctx.fillRect(12, 14, 22, 12);
    ctx.fillStyle = '#ea580c';
    ctx.fillRect(14, 16, 18, 8);

    // 3. Glowing Amber Heart Core (Vulnerable when stunned!)
    const isVuln = boss.isStunned;
    ctx.fillStyle = isVuln ? '#ffffff' : '#f59e0b';
    ctx.fillRect(20, 18, 6, 6);
    if (isVuln) {
      const pulse = Math.floor(this.tick * 10) % 2 === 0;
      ctx.fillStyle = pulse ? '#fef08a' : '#ea580c';
      ctx.fillRect(21, 19, 4, 4);
    }

    // 4. Heavy Spiked Dragon Tail
    ctx.fillStyle = '#7c2d12';
    ctx.fillRect(2, 18, 10, 8);
    ctx.fillRect(0, 20, 4, 4);
    // Basalt tail spikes
    ctx.fillStyle = '#1c1514';
    ctx.fillRect(4, 16, 2, 3);
    ctx.fillRect(8, 16, 2, 3);

    // 5. Dragon Neck & Head
    ctx.fillStyle = '#7c2d12';
    ctx.fillRect(32, 8, 10, 16);
    ctx.fillStyle = '#c2410c';
    ctx.fillRect(34, 10, 8, 12);

    // Dragon Maw / Snout
    ctx.fillStyle = '#ea580c';
    ctx.fillRect(38, 12, 9, 8);

    // If breathing fire, glowing molten mouth
    if (boss.isBreathingFire) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(42, 14, 6, 4);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(44, 13, 8, 6);
    }

    // Basalt Horns sweeping backward
    ctx.fillStyle = '#1c1514';
    ctx.fillRect(34, 4, 4, 6);
    ctx.fillRect(30, 2, 6, 3);
    ctx.fillStyle = '#543f3b';
    ctx.fillRect(31, 3, 2, 1);

    // Glowing Ruby Eyes
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(40, 10, 2, 2);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(41, 10, 1, 1);

    // Dazed stars when stunned
    if (boss.isStunned) {
      const starBlink = Math.floor(this.tick * 8) % 2 === 0;
      if (starBlink) {
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(34, 0, 3, 2);
        ctx.fillRect(42, 0, 3, 2);
      }
    }

    ctx.restore();
  }

  /**
   * Draw The Sandwich King in 256x240 pixel space.
   * Multi-tiered colossal club sandwich monarch with golden crown, frilled olive scepter,
   * collapsing staggered layers, sesame bursts, and condiment shockwaves.
   */
  drawSandwichKing(ctx, screenX, screenY, width, height, boss) {
    if (boss.isDead && boss.defeatTimer > boss.defeatDuration) return;

    ctx.save();
    const px = Math.round(screenX);
    const py = Math.round(screenY);
    const w = 48; // Scaled pixel width
    const h = 42; // Scaled pixel height

    if (boss.isDead) {
      ctx.globalAlpha = Math.max(0, 1 - boss.defeatTimer / boss.defeatDuration);
    }

    const facing = boss.facing || 1;
    ctx.translate(px + w / 2, py + h);

    // Wobble or topple tilt
    if (boss.wobbleAngle) {
      ctx.rotate(boss.wobbleAngle * (facing > 0 ? 1 : -1));
    }

    if (facing < 0) {
      ctx.scale(-1, 1);
    }

    const originX = -w / 2;
    const originY = -h;

    // 1. Bottom Bread Bun & Crust
    ctx.fillStyle = '#451a03'; // Deep brown crust
    ctx.fillRect(originX + 4, originY + 36, 40, 6);
    ctx.fillStyle = '#b45309'; // Golden crumb
    ctx.fillRect(originX + 6, originY + 37, 36, 4);

    // 2. Crispy Bacon & Crinkle Dill Pickle Layer
    ctx.fillStyle = '#881337'; // Crisp bacon
    ctx.fillRect(originX + 6, originY + 33, 36, 3);
    ctx.fillStyle = '#15803d'; // Pickles
    ctx.fillRect(originX + 8, originY + 33, 6, 3);
    ctx.fillRect(originX + 22, originY + 33, 6, 3);
    ctx.fillRect(originX + 34, originY + 33, 6, 3);

    // 3. Middle Toasted Bread Slice
    ctx.fillStyle = '#451a03';
    ctx.fillRect(originX + 4, originY + 29, 40, 4);
    ctx.fillStyle = '#d97706';
    ctx.fillRect(originX + 6, originY + 30, 36, 2);

    // 4. Deli Turkey & Ruby Ham Layer
    ctx.fillStyle = '#e11d48'; // Ruby cured ham
    ctx.fillRect(originX + 4, originY + 25, 40, 4);
    ctx.fillStyle = '#f43f5e';
    ctx.fillRect(originX + 8, originY + 26, 32, 2);

    // 5. Melted Golden Cheddar Cheese (Drips over sides!)
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(originX + 2, originY + 21, 44, 4);
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(originX + 6, originY + 22, 36, 2);
    // Cheese drips
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(originX + 4, originY + 25, 3, 4);
    ctx.fillRect(originX + 20, originY + 25, 4, 3);
    ctx.fillRect(originX + 38, originY + 25, 3, 5);

    // Vulnerable Glow when staggered
    if (boss.isStaggered) {
      const pulse = Math.floor(this.tick * 10) % 2 === 0;
      ctx.fillStyle = pulse ? '#ffffff' : '#fde047';
      ctx.fillRect(originX + 16, originY + 21, 16, 4);
    }

    // 6. Ripe Crimson Tomato Slabs
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(originX + 4, originY + 17, 40, 4);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(originX + 8, originY + 18, 12, 2);
    ctx.fillRect(originX + 26, originY + 18, 12, 2);

    // 7. Crisp Frilly Emerald Lettuce
    ctx.fillStyle = '#16a34a';
    ctx.fillRect(originX + 2, originY + 13, 44, 4);
    ctx.fillStyle = '#4ade80';
    for (let i = 0; i < 7; i++) {
      ctx.fillRect(originX + 4 + i * 6, originY + 14, 4, 2);
    }

    // 8. Colossal Top Artisan Brioche Bun
    ctx.fillStyle = '#451a03'; // Crust outline
    ctx.fillRect(originX + 6, originY + 4, 36, 9);
    ctx.fillStyle = '#b45309'; // Warm golden toast
    ctx.fillRect(originX + 8, originY + 5, 32, 8);
    ctx.fillStyle = '#d97706'; // Highlight
    ctx.fillRect(originX + 10, originY + 6, 28, 4);

    // White / Golden Sesame Seeds sprinkled on top bun
    ctx.fillStyle = '#fef3c7';
    ctx.fillRect(originX + 10, originY + 7, 2, 1);
    ctx.fillRect(originX + 16, originY + 6, 2, 1);
    ctx.fillRect(originX + 22, originY + 8, 2, 1);
    ctx.fillRect(originX + 28, originY + 6, 2, 1);
    ctx.fillRect(originX + 34, originY + 7, 2, 1);

    // Royal Monarch Eyes
    ctx.fillStyle = '#110726';
    ctx.fillRect(originX + 16, originY + 9, 3, 3);
    ctx.fillRect(originX + 26, originY + 9, 3, 3);
    ctx.fillStyle = '#ef4444'; // Fierce red glow
    ctx.fillRect(originX + 17, originY + 10, 2, 2);
    ctx.fillRect(originX + 27, originY + 10, 2, 2);

    // 9. Majestic Golden Crown
    ctx.fillStyle = '#d97706';
    ctx.fillRect(originX + 14, originY - 2, 18, 6);
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(originX + 16, originY - 3, 14, 5);
    // Crown peaks
    ctx.fillRect(originX + 14, originY - 5, 3, 3);
    ctx.fillRect(originX + 21, originY - 6, 4, 4);
    ctx.fillRect(originX + 29, originY - 5, 3, 3);
    // Crown Jewels
    ctx.fillStyle = '#dc2626'; // Ruby
    ctx.fillRect(originX + 18, originY - 1, 2, 2);
    ctx.fillStyle = '#38bdf8'; // Sapphire
    ctx.fillRect(originX + 26, originY - 1, 2, 2);

    // 10. Frilled Party Toothpick with Spanish Olive (Scepter)
    // Wood skewer
    ctx.fillStyle = '#fde047';
    ctx.fillRect(originX + 36, originY - 12, 2, 20);
    // Spanish Green Olive
    ctx.fillStyle = '#365314';
    ctx.fillRect(originX + 33, originY - 10, 8, 8);
    ctx.fillStyle = '#65a30d';
    ctx.fillRect(originX + 34, originY - 9, 6, 6);
    // Red Pimento Core
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(originX + 36, originY - 7, 2, 2);
    // Cellophane party frill (red & gold)
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(originX + 35, originY - 14, 4, 3);
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(originX + 36, originY - 15, 2, 2);

    // Dazed stars when staggered
    if (boss.isStaggered) {
      const starBlink = Math.floor(this.tick * 8) % 2 === 0;
      if (starBlink) {
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(originX + 10, originY - 8, 3, 2);
        ctx.fillRect(originX + 22, originY - 10, 3, 2);
      }
    }

    ctx.restore();

    // Render Boss Projectiles & Shockwaves in world-to-screen coords
    if (boss.projectiles) {
      boss.projectiles.forEach(p => {
        const sx = Math.round((p.x - (boss.x - screenX / (1 / 4.5))) * (1 / 4.5));
        // Simple direct draw using screenX offset
        const prjX = Math.round(screenX + (p.x - boss.x) * (1 / 4.5));
        const prjY = Math.round(screenY + (p.y - boss.y) * (1 / 4.5));

        if (p.type === 'tomato') {
          ctx.fillStyle = '#dc2626';
          ctx.fillRect(prjX - 4, prjY - 4, 8, 8);
          ctx.fillStyle = '#fca5a5';
          ctx.fillRect(prjX - 2, prjY - 2, 4, 4);
        } else {
          // Sesame Starburst
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(prjX - 2, prjY - 2, 4, 4);
          ctx.fillStyle = '#fef08a';
          ctx.fillRect(prjX - 1, prjY - 1, 2, 2);
        }
      });
    }

    if (boss.shockwaves) {
      boss.shockwaves.forEach(sw => {
        const swX = Math.round(screenX + (sw.x - boss.x) * (1 / 4.5));
        const swY = Math.round(screenY + (sw.y - boss.y) * (1 / 4.5));
        ctx.fillStyle = '#eab308'; // Zesty mustard wave
        ctx.fillRect(swX - 6, swY - 8, 12, 8);
        ctx.fillStyle = '#fefce8'; // Creamy mayo crest
        ctx.fillRect(swX - 4, swY - 10, 8, 3);
      });
    }
  }

  /**
   * Draw Mustard Mummy in 256x240 pixel space.
   */
  drawMustardMummy(ctx, screenX, screenY, width, height, mummy) {
    if (mummy.isDead) return;

    ctx.save();
    const px = Math.round(screenX);
    const py = Math.round(screenY);
    const facing = mummy.facing || 1;

    if (facing < 0) {
      ctx.translate(px + 20, py);
      ctx.scale(-1, 1);
    } else {
      ctx.translate(px, py);
    }

    const walkOffset = mummy.isGrounded ? Math.floor(this.tick * 6) % 2 : 0;

    // 1. Shuffling Mummy Legs
    ctx.fillStyle = '#ca8a04'; // Mustard stain
    ctx.fillRect(4, 18, 4, 8 - walkOffset);
    ctx.fillRect(10, 18, 4, 8 + walkOffset);
    ctx.fillStyle = '#fefce8'; // Deli parchment wraps
    ctx.fillRect(4, 20, 4, 3);
    ctx.fillRect(10, 22, 4, 3);

    // 2. Parchment & Mustard Wrapped Torso
    ctx.fillStyle = '#ca8a04';
    ctx.fillRect(3, 8, 14, 11);
    ctx.fillStyle = '#fefce8'; // Clean paper wraps
    ctx.fillRect(4, 9, 12, 3);
    ctx.fillRect(4, 14, 12, 3);
    ctx.fillStyle = '#eab308'; // Spicy mustard drizzle
    ctx.fillRect(6, 12, 8, 2);

    // 3. Mummy Head & Glowing Eyes
    ctx.fillStyle = '#ca8a04';
    ctx.fillRect(4, 1, 12, 8);
    ctx.fillStyle = '#fefce8';
    ctx.fillRect(5, 2, 10, 3);
    // Glowing Condiment Eyes
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(11, 4, 2, 2);
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(12, 4, 1, 1);

    // Mustard Glob Charging telegraph
    if (mummy.isTelegraphing) {
      ctx.fillStyle = '#eab308';
      ctx.fillRect(14, 2, 5, 5);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(15, 3, 3, 3);
    }

    ctx.restore();

    // Mustard projectiles
    if (mummy.mustardProjectiles) {
      mummy.mustardProjectiles.forEach(p => {
        const prjX = Math.round(screenX + (p.x - mummy.x) * (1 / 4.5));
        const prjY = Math.round(screenY + (p.y - mummy.y) * (1 / 4.5));
        ctx.fillStyle = '#ca8a04';
        ctx.fillRect(prjX - 3, prjY - 3, 6, 6);
        ctx.fillStyle = '#fde047';
        ctx.fillRect(prjX - 2, prjY - 2, 4, 4);
      });
    }
  }

  /**
   * Draw Cheese Scorpion in 256x240 pixel space.
   */
  drawCheeseScorpion(ctx, screenX, screenY, width, height, scorpion) {
    if (scorpion.isDead) return;

    ctx.save();
    const px = Math.round(screenX);
    const py = Math.round(screenY);
    const facing = scorpion.facing || 1;

    if (facing < 0) {
      ctx.translate(px + 24, py);
      ctx.scale(-1, 1);
    } else {
      ctx.translate(px, py);
    }

    const legWalk = Math.floor(this.tick * 10) % 2;

    // 1. Skittering Legs (Swiss cheese crust color)
    ctx.fillStyle = '#b45309';
    ctx.fillRect(4, 14, 2, 4 + legWalk);
    ctx.fillRect(8, 14, 2, 4 - legWalk);
    ctx.fillRect(12, 14, 2, 4 + legWalk);

    // 2. Swiss Cheese Carapace Body (With cheese holes!)
    ctx.fillStyle = '#d97706';
    ctx.fillRect(3, 7, 14, 8);
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(4, 8, 12, 6);
    // Swiss cheese aeration holes
    ctx.fillStyle = '#b45309';
    ctx.fillRect(6, 9, 2, 2);
    ctx.fillRect(11, 11, 2, 2);

    // 3. Sharp Swiss Pincers / Claws
    ctx.fillStyle = '#b45309';
    ctx.fillRect(16, 9, 5, 3);
    ctx.fillRect(19, 7, 2, 3);
    ctx.fillRect(19, 12, 2, 3);

    // 4. Arched Cheddar Tail & Stinger
    ctx.fillStyle = '#d97706';
    ctx.fillRect(0, 5, 4, 4);
    ctx.fillRect(1, 2, 4, 4);
    ctx.fillRect(4, 0, 4, 3);
    // Cheddar Needle Stinger
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(7, 1, 3, 2);
    ctx.fillStyle = '#fde047'; // Sharp tip
    ctx.fillRect(9, 2, 2, 1);

    if (scorpion.isTelegraphing) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(8, 0, 3, 3);
    }

    ctx.restore();
  }

  /**
   * Draw Pickle Bomber in 256x240 pixel space.
   */
  drawPickleBomber(ctx, screenX, screenY, width, height, bomber) {
    if (bomber.isDead) return;

    ctx.save();
    const px = Math.round(screenX);
    const py = Math.round(screenY);
    const facing = bomber.facing || 1;

    if (facing < 0) {
      ctx.translate(px + 20, py);
      ctx.scale(-1, 1);
    } else {
      ctx.translate(px, py);
    }

    const wingFlap = Math.floor(this.tick * 8) % 2;

    // 1. Crispy Onion Ring Wings
    ctx.fillStyle = '#fde68a';
    if (wingFlap === 0) {
      ctx.fillRect(4, -3, 8, 4);
      ctx.fillStyle = '#b45309';
      ctx.fillRect(6, -2, 4, 2);
    } else {
      ctx.fillRect(4, 1, 8, 4);
      ctx.fillStyle = '#b45309';
      ctx.fillRect(6, 2, 4, 2);
    }

    // 2. Crinkle-Cut Dill Pickle Slice Body
    ctx.fillStyle = '#14532d'; // Dark cucumber skin rim
    ctx.fillRect(3, 4, 14, 10);
    ctx.fillStyle = '#16a34a'; // Vibrant dill flesh
    ctx.fillRect(4, 5, 12, 8);
    ctx.fillStyle = '#4ade80'; // Pale inner flesh
    ctx.fillRect(6, 6, 8, 6);

    // Pickle seed cavities
    ctx.fillStyle = '#bbf7d0';
    ctx.fillRect(7, 7, 2, 1);
    ctx.fillRect(11, 7, 2, 1);
    ctx.fillRect(8, 9, 2, 1);

    // Glowing Eyes
    ctx.fillStyle = '#14532d';
    ctx.fillRect(13, 6, 2, 2);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(14, 6, 1, 1);

    ctx.restore();

    // Brine bombs
    if (bomber.brineBombs) {
      bomber.brineBombs.forEach(b => {
        const bx = Math.round(screenX + (b.x - bomber.x) * (1 / 4.5));
        const by = Math.round(screenY + (b.y - bomber.y) * (1 / 4.5));
        ctx.fillStyle = '#4ade80';
        ctx.fillRect(bx - 2, by - 2, 4, 4);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(bx - 1, by - 1, 2, 2);
      });
    }
  }

  /**
   * Draw Clockwork Bee in 256x240 pixel space.
   */
  drawClockworkBee(ctx, screenX, screenY, width, height, bee) {
    if (bee.isDead && bee.defeatTimer > bee.defeatDuration) return;

    ctx.save();
    const px = Math.round(screenX);
    const py = Math.round(screenY);
    const facing = bee.facing || 1;

    if (bee.isDead) {
      ctx.globalAlpha = Math.max(0, 1 - bee.defeatTimer / bee.defeatDuration);
    }

    if (facing < 0) {
      ctx.translate(px + 22, py);
      ctx.scale(-1, 1);
    } else {
      ctx.translate(px, py);
    }

    const wingTick = Math.floor(this.tick * 16) % 2;

    // 1. Rotating Brass Wind-Up Key on Back
    const keyRot = Math.floor(this.tick * 8) % 4;
    ctx.fillStyle = '#d97706';
    ctx.fillRect(6, -4, 2, 5);
    ctx.fillStyle = '#f59e0b';
    if (keyRot % 2 === 0) {
      ctx.fillRect(3, -6, 8, 3);
      ctx.fillRect(5, -8, 4, 2);
    } else {
      ctx.fillRect(5, -6, 4, 3);
    }

    // 2. Translucent Mesh Brass Wings
    ctx.fillStyle = 'rgba(254, 243, 199, 0.75)';
    if (wingTick === 0) {
      ctx.fillRect(4, -3, 9, 4);
      ctx.fillRect(8, -5, 6, 3);
    } else {
      ctx.fillRect(4, 2, 9, 4);
      ctx.fillRect(8, 4, 6, 3);
    }

    // 3. Burnished Brass Armored Carapace Body
    ctx.fillStyle = '#78350f'; // Dark bronze rim
    ctx.fillRect(3, 4, 15, 10);
    ctx.fillStyle = '#b45309'; // Mid brass
    ctx.fillRect(4, 5, 13, 8);
    ctx.fillStyle = '#f59e0b'; // Polished core
    ctx.fillRect(6, 6, 9, 6);

    // Segmented brass bands
    ctx.fillStyle = '#78350f';
    ctx.fillRect(8, 4, 1, 10);
    ctx.fillRect(12, 4, 1, 10);

    // 4. Glowing Ruby Optical Lens
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(15, 6, 3, 3);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(16, 7, 1, 1);

    // 5. Sunstone Amber Needle Stinger
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(0, 8, 4, 2);
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(0, 9, 2, 1);

    if (bee.isTelegraphing) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(14, 5, 4, 4);
    }

    ctx.restore();

    // Render spinning brass gear dart projectiles
    if (bee.gearDarts) {
      bee.gearDarts.forEach(d => {
        const dx = Math.round(screenX + (d.x - bee.x) * (1 / 4.5));
        const dy = Math.round(screenY + (d.y - bee.y) * (1 / 4.5));
        ctx.save();
        ctx.translate(dx, dy);
        ctx.rotate(d.rotation || 0);
        ctx.fillStyle = '#d97706';
        ctx.fillRect(-3, -3, 6, 6);
        ctx.fillStyle = '#fde047';
        ctx.fillRect(-1, -1, 2, 2);
        // Cog teeth
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(-4, -1, 8, 2);
        ctx.fillRect(-1, -4, 2, 8);
        ctx.restore();
      });
    }
  }

  /**
   * Draw Spring Knight in 256x240 pixel space.
   */
  drawSpringKnight(ctx, screenX, screenY, width, height, knight) {
    if (knight.isDead && knight.defeatTimer > knight.defeatDuration) return;

    ctx.save();
    const px = Math.round(screenX);
    const py = Math.round(screenY);
    const facing = knight.facing || 1;

    if (knight.isDead) {
      ctx.globalAlpha = Math.max(0, 1 - knight.defeatTimer / knight.defeatDuration);
    }

    if (facing < 0) {
      ctx.translate(px + 24, py);
      ctx.scale(-1, 1);
    } else {
      ctx.translate(px, py);
    }

    const crouchOffset = knight.springCompression ? Math.round(knight.springCompression * 5) : 0;

    // 1. Heavy Armored Greaves & Boots
    ctx.fillStyle = '#78350f';
    ctx.fillRect(4, 22 - crouchOffset / 2, 6, 6 + crouchOffset / 2);
    ctx.fillRect(13, 22 - crouchOffset / 2, 6, 6 + crouchOffset / 2);
    ctx.fillStyle = '#b45309';
    ctx.fillRect(5, 23 - crouchOffset / 2, 4, 5);
    ctx.fillRect(14, 23 - crouchOffset / 2, 4, 5);

    // 2. Coiled Mainspring Midriff (Compresses or vibrates!)
    ctx.fillStyle = '#475569'; // Steel spring dark
    ctx.fillRect(6, 16 + crouchOffset, 11, 6 - crouchOffset);
    ctx.fillStyle = '#cbd5e1'; // Coiled spring highlight
    for (let s = 0; s < 3; s++) {
      ctx.fillRect(7 + s * 3, 17 + crouchOffset, 2, 4 - crouchOffset);
    }

    // 3. Heavy Burnished Bronze Cuirass (Torso)
    ctx.fillStyle = '#78350f';
    ctx.fillRect(4, 8 + crouchOffset, 15, 9);
    ctx.fillStyle = '#d97706';
    ctx.fillRect(5, 9 + crouchOffset, 13, 7);
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(7, 10 + crouchOffset, 9, 5);
    // Sunstone central crest
    ctx.fillStyle = '#fde047';
    ctx.fillRect(10, 11 + crouchOffset, 3, 3);

    // 4. Armored Horned Helmet & Glowing Visor
    ctx.fillStyle = '#78350f';
    ctx.fillRect(5, 0 + crouchOffset, 13, 9);
    ctx.fillStyle = '#d97706';
    ctx.fillRect(6, 1 + crouchOffset, 11, 7);
    // Helmet crest horn
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(9, -3 + crouchOffset, 5, 4);
    ctx.fillRect(10, -5 + crouchOffset, 3, 3);
    // Slit Visor (Amber / Ruby alert)
    ctx.fillStyle = knight.isCrouching ? '#ef4444' : '#f59e0b';
    ctx.fillRect(11, 4 + crouchOffset, 6, 2);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(14, 4 + crouchOffset, 2, 1);

    // 5. Brass Rapier / Lance
    ctx.fillStyle = '#64748b'; // Steel blade
    ctx.fillRect(18, 12 + crouchOffset, 9, 2);
    ctx.fillStyle = '#ffffff'; // Tip glint
    ctx.fillRect(27, 12 + crouchOffset, 2, 1);
    ctx.fillStyle = '#f59e0b'; // Brass crossguard
    ctx.fillRect(17, 10 + crouchOffset, 2, 6);

    // Vulnerable oscillating spring sparks when stunned
    if (knight.isRecovering) {
      const pulse = Math.floor(this.tick * 10) % 2 === 0;
      ctx.fillStyle = pulse ? '#ffffff' : '#fde047';
      ctx.fillRect(4, 15, 15, 2);
    }

    ctx.restore();
  }

  /**
   * Draw Mechanical Spider in 256x240 pixel space.
   */
  drawMechanicalSpider(ctx, screenX, screenY, width, height, spider) {
    if (spider.isDead && spider.defeatTimer > spider.defeatDuration) return;

    ctx.save();
    const px = Math.round(screenX);
    const py = Math.round(screenY);
    const facing = spider.facing || 1;

    // Draw hanging chain tether up to ceiling anchor
    if (spider.chainLength > 2) {
      const chainTopScrY = Math.round(screenY - (spider.chainLength * (1 / 4.5)));
      ctx.fillStyle = '#b45309';
      for (let cy = chainTopScrY; cy < py + 4; cy += 4) {
        ctx.fillRect(px + 10, cy, 2, 3);
        ctx.fillStyle = (ctx.fillStyle === '#b45309') ? '#fde047' : '#b45309';
      }
    }

    if (spider.isDead) {
      ctx.globalAlpha = Math.max(0, 1 - spider.defeatTimer / spider.defeatDuration);
    }

    if (facing < 0) {
      ctx.translate(px + 22, py);
      ctx.scale(-1, 1);
    } else {
      ctx.translate(px, py);
    }

    const legMove = Math.floor(this.tick * 8) % 2;

    // 1. Jointed Brass Legs (4 pairs)
    ctx.fillStyle = '#78350f';
    // Back legs
    ctx.fillRect(1, 4 + legMove, 2, 6);
    ctx.fillRect(5, 5 - legMove, 2, 6);
    // Front legs
    ctx.fillRect(15, 5 + legMove, 2, 6);
    ctx.fillRect(19, 4 - legMove, 2, 6);

    // 2. Central Cogwheel Abdomen & Exposed Gear Teeth
    ctx.fillStyle = '#78350f';
    ctx.fillRect(3, 1, 10, 8);
    ctx.fillStyle = '#d97706';
    ctx.fillRect(4, 2, 8, 6);
    // Cog teeth on abdomen
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(2, 3, 1, 4);
    ctx.fillRect(13, 3, 1, 4);
    ctx.fillRect(6, 0, 4, 1);
    ctx.fillRect(6, 8, 4, 1);
    // Sunstone center core
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(7, 4, 2, 2);

    // 3. Cephalothorax Head & Pincers
    ctx.fillStyle = '#b45309';
    ctx.fillRect(13, 3, 5, 5);
    // Red ocular sensors
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(17, 3, 2, 2);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(18, 4, 1, 1);
    // Brass pincers
    ctx.fillStyle = '#fde047';
    ctx.fillRect(18, 1, 3, 2);
    ctx.fillRect(18, 6, 3, 2);

    ctx.restore();
  }

  /**
   * Draw The Time Tinker in 256x240 pixel space.
   */
  drawTimeTinker(ctx, screenX, screenY, width, height, boss) {
    if (boss.isDead && boss.defeatTimer > boss.defeatDuration) return;

    ctx.save();
    const px = Math.round(screenX);
    const py = Math.round(screenY);
    const w = 44;
    const h = 48;

    if (boss.isDead) {
      ctx.globalAlpha = Math.max(0, 1 - boss.defeatTimer / boss.defeatDuration);
    }

    const facing = boss.facing || 1;
    ctx.translate(px + w / 2, py + h);

    if (boss.wobbleAngle) {
      ctx.rotate(boss.wobbleAngle * (facing > 0 ? 1 : -1));
    }

    if (facing < 0) {
      ctx.scale(-1, 1);
    }

    const originX = -w / 2;
    const originY = -h;

    // 1. Giant Rotating Astrolabe Back-Wheel
    ctx.save();
    ctx.translate(0, originY + 22);
    ctx.rotate(boss.clockRotation || 0);
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 18, 0, Math.PI * 2);
    ctx.stroke();
    // 8 Astrolabe radial spokes / gear teeth
    ctx.fillStyle = '#f59e0b';
    for (let a = 0; a < 8; a++) {
      const ang = (a * Math.PI) / 4;
      const sx = Math.cos(ang) * 19;
      const sy = Math.sin(ang) * 19;
      ctx.fillRect(sx - 1, sy - 1, 3, 3);
    }
    ctx.restore();

    // 2. Heavy Royal Velvet Cape (Dark purple with gold filigree)
    ctx.fillStyle = '#311042';
    ctx.fillRect(originX + 2, originY + 14, 38, 28);
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(originX + 1, originY + 40, 40, 2);

    // 3. Polished Bronze Chassis (Torso)
    ctx.fillStyle = '#78350f';
    ctx.fillRect(originX + 8, originY + 12, 26, 26);
    ctx.fillStyle = '#b45309';
    ctx.fillRect(originX + 10, originY + 14, 22, 22);

    // 4. Grand Ivory Clock Face Chest Dial
    ctx.fillStyle = '#fefce8'; // Ivory clock face
    ctx.beginPath();
    ctx.arc(0, originY + 25, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Rotating Clock Hands
    const handAngle = boss.clockHandsAngle || 0;
    ctx.strokeStyle = '#1c1917';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, originY + 25);
    ctx.lineTo(Math.cos(handAngle) * 7, originY + 25 + Math.sin(handAngle) * 7);
    ctx.stroke();

    // 5. Exposed Glowing Sunstone Heart (Center Core)
    const heartPulse = Math.sin(Date.now() * 0.01) * 0.5 + 0.5;
    ctx.fillStyle = boss.isStaggered ? (heartPulse > 0.5 ? '#ffffff' : '#fde047') : '#f59e0b';
    ctx.beginPath();
    ctx.arc(0, originY + 25, boss.isStaggered ? 5 : 3, 0, Math.PI * 2);
    ctx.fill();

    // 6. Horologist Automaton Head & Ruby Monocle
    ctx.fillStyle = '#78350f';
    ctx.fillRect(originX + 14, originY + 2, 14, 11);
    ctx.fillStyle = '#d97706';
    ctx.fillRect(originX + 15, originY + 3, 12, 9);
    // Master Top Hat / Brass Crown
    ctx.fillStyle = '#311042';
    ctx.fillRect(originX + 13, originY - 4, 16, 6);
    ctx.fillRect(originX + 11, originY + 1, 20, 2);
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(originX + 13, originY, 16, 1);
    // Ruby Monocle Eye
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(originX + 21, originY + 5, 4, 4);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(originX + 23, originY + 6, 1, 1);

    // 7. Brass Gauntlets
    ctx.fillStyle = '#d97706';
    ctx.fillRect(originX + 4, originY + 22, 6, 10);
    ctx.fillRect(originX + 32, originY + 22, 6, 10);

    ctx.restore();

    // Render rolling cogs & falling gear rain projectiles
    if (boss.projectiles) {
      boss.projectiles.forEach(p => {
        const px = Math.round(screenX + (p.x - boss.x) * (1 / 4.5));
        const py = Math.round(screenY + (p.y - boss.y) * (1 / 4.5));
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(p.rotation || 0);
        ctx.fillStyle = '#d97706';
        ctx.fillRect(-5, -5, 10, 10);
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(-7, -2, 14, 4);
        ctx.fillRect(-2, -7, 4, 14);
        ctx.fillStyle = '#fde047';
        ctx.fillRect(-2, -2, 4, 4);
        ctx.restore();
      });
    }

    // Render chrono shockwaves
    if (boss.shockwaves) {
      boss.shockwaves.forEach(sw => {
        const sx = Math.round(screenX + (sw.x - boss.x) * (1 / 4.5));
        const sy = Math.round(screenY + (sw.y - boss.y) * (1 / 4.5));
        const swW = Math.round(sw.width * (1 / 4.5));
        ctx.fillStyle = '#fde047';
        ctx.fillRect(sx, sy - 4, swW, 6);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(sx + 2, sy - 2, swW - 4, 2);
      });
    }
  }
}

export const pixelEnemyRenderer = new PixelEnemyRenderer();
