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
}

export const pixelEnemyRenderer = new PixelEnemyRenderer();
