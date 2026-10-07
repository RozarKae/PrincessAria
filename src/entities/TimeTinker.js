import { Enemy } from './Enemy.js';
import { ENCOUNTER_ROLES } from '../ai/EncounterCoordinator.js';
import { Collision } from '../physics/Collision.js';

/**
 * THE TIME TINKER
 * Canonical World 6 Climax Boss: Master Horologist of the Clockwork Kingdom.
 * 
 * Production-Grade 3-Phase Climax Boss:
 * - Phase 1 (HP 12-9): Stepped mechanical glides, rolling escapement wheels,
 *                      and ground chrono shockwaves. Stomping or striking the chassis
 *                      induces escapement desync, unwinding the mainspring and staggering
 *                      the boss (2.5s) to expose the glowing Sunstone Heart!
 * - Phase 2 (HP 8-5):  Time Dilation & Falling Gear Rain! Rotating chronometer pulses,
 *                      twin ground shockwaves, and falling gears across the battle tiers.
 * - Phase 3 (HP 4-1):  The Grand Astrolabe Overdrive! Temporal acceleration, radial
 *                      Sunstone bullet hell bursts, rapid chrono-shifts, and sweeping clock hands.
 * 
 * Features:
 * - Clockwork Citadel Portcullis Gates (x: 9740 - 10660) with player arena clamping
 * - Native HD Boss Bar integration with Chrono Amethyst & Polished Brass theme
 * - Vulnerable Sunstone Heart exposed during Mainspring Unwind / Stagger for Stardust Slash & Star Projectiles
 * - Rotating giant Astrolabe back-wheel & active rotating clock hands
 * - Grand Finale: The horologist releases temporal gears into radiant stardust, unsealing the Portal to World 7!
 */
export class TimeTinker extends Enemy {
  constructor(x, y) {
    super(x, y, 140, 160, {
      name: 'The Time Tinker',
      species: 'time_tinker',
      role: ENCOUNTER_ROLES.CONTROL,
      threatLevel: 5,
      counterHint: 'Dodge rolling escapement wheels, then strike the glowing Sunstone Heart when his mainspring unwinds!',
      telegraphDesc: 'Astrolabe back-wheel spins rapidly, grand chest clock chimes, ruby monocle glints',
      movementStyle: 'Stepped clockwork glide & instant chrono-shift repositioning',
      attackStyle: 'Rolling brass cogs, chrono shockwaves & sweeping clock hands',
      recoveryDesc: 'Clockwork mainspring unspools, exposed Sunstone Heart vulnerable for 2.8s',
      environmentalPreference: 'The Grand Chronometer Citadel Arena',
      health: 12,
      maxHealth: 12,
      damage: 1,
      speed: 85,
      gravity: 2200,
      detectionRange: 900,
      scoreValue: 10000,
    });

    this.baseX = x;
    this.baseY = y;
    this.arenaMinX = 9760;
    this.arenaMaxX = 10640;
    this.maxHealth = 12;
    this.health = 12;
    this.phase = 1; // Phase 1 (12-9), Phase 2 (8-5), Phase 3 (4-1)

    // Arena lock & encounter state
    this.isArenaActive = false;
    this.introTimer = 0;
    this.introDuration = 2.4;
    this.introComplete = false;
    this.isDefeated = false;
    this.hitFlashTimer = 0;

    // Clockwork & Desync Physics
    this.clockRotation = 0;
    this.clockHandsAngle = 0;
    this.wobbleAngle = 0;
    this.desyncHits = 0;
    this.desyncHitsRequired = 3;
    this.isStaggered = false;
    this.staggerTimer = 0;

    // Attack Scheduling
    this.attackTimer = 0;
    this.attackInterval = 3.4;
    this.isTelegraphing = false;
    this.telegraphTimer = 0;

    // Projectiles & Hazards
    this.projectiles = []; // Rolling cogs & gear rain
    this.shockwaves = [];  // Chrono ground shockwaves

    // Escapement Platforms (Boss Battle Tiers)
    this.escapementPlatforms = [
      { id: 'left_escapement', x: 9940, y: 720, width: 140, height: 26 },
      { id: 'center_dial', x: 10220, y: 620, width: 160, height: 26 },
      { id: 'right_escapement', x: 10500, y: 720, width: 140, height: 26 },
    ];

    // Weak Point: Exposed Sunstone Heart
    this.sunstoneHeart = {
      x: x + 45,
      y: y + 45,
      width: 50,
      height: 50,
      vulnerable: false,
    };

    // Clockwork Citadel Portcullis Gates (West & East)
    this.gateWest = { x: 9740, y: 440, width: 32, height: 460, alpha: 0 };
    this.gateEast = { x: 10660, y: 440, width: 32, height: 460, alpha: 0 };
  }

  hurt(damage = 1, attackDirection = 1, attackSource = 'projectile') {
    if (this.isDead || this.isDefeated) return false;

    // Direct damage when staggered / sunstone heart exposed
    if (this.isStaggered) {
      this.damageHeart(damage, null, null);
      return true;
    }

    // Attacks on brass chassis increment desync meter
    this.desyncHits += 1;
    this.hitFlashTimer = 0.18;
    this.wobbleAngle = (this.facing > 0 ? 1 : -1) * 0.15;

    if (this.desyncHits >= this.desyncHitsRequired) {
      this.triggerStagger();
    }

    return false; // Polished brass deflects direct damage until staggered!
  }

  damageHeart(amount = 1, level, camera) {
    if (this.isDead || this.isDefeated) return;

    this.health -= amount;
    this.hitFlashTimer = 0.22;

    const lvl = level || this.levelRef;
    if (lvl && lvl.spawnBurst) {
      lvl.spawnBurst(this.sunstoneHeart.x + 25, this.sunstoneHeart.y + 25, 24, '#f59e0b');
      lvl.spawnBurst(this.sunstoneHeart.x + 25, this.sunstoneHeart.y + 25, 16, '#fde047');
      lvl.spawnSparkles(this.sunstoneHeart.x + 25, this.sunstoneHeart.y + 25, 20);
    }
    if (camera && camera.shake) camera.shake(12, 0.3);

    if (this.health <= 0) {
      this.triggerDefeat(lvl, camera);
    } else {
      this.checkPhaseTransition(lvl, camera);
      // Break out of stagger on hit
      this.isStaggered = false;
      this.isVulnerable = false;
      this.sunstoneHeart.vulnerable = false;
      this.desyncHits = 0;
      this.attackTimer = 0;
      this.wobbleAngle = 0;
    }
  }

  checkPhaseTransition(level, camera) {
    if (this.health <= 4 && this.phase < 3) {
      this.triggerPhase(3, level, camera);
    } else if (this.health <= 8 && this.phase < 2) {
      this.triggerPhase(2, level, camera);
    }
  }

  triggerPhase(newPhase, level, camera) {
    this.phase = newPhase;
    this.desyncHitsRequired = newPhase === 3 ? 2 : (newPhase === 2 ? 3 : 4);
    if (camera && camera.shake) camera.shake(18, 0.65);
    const lvl = level || this.levelRef;
    if (lvl && lvl.spawnBurst) {
      lvl.spawnBurst(this.x + this.width / 2, this.y + 40, 40, newPhase === 3 ? '#a855f7' : '#f59e0b');
      lvl.spawnSparkles(this.x + this.width / 2, this.y + 40, 25);
    }
  }

  triggerStagger() {
    this.isStaggered = true;
    this.staggerTimer = this.phase === 3 ? 2.0 : 2.8; // Ample window for player to strike
    this.vx = 0;
    this.wobbleAngle = 0.28;
    this.isVulnerable = true;
    this.sunstoneHeart.vulnerable = true;

    if (this.levelRef && this.levelRef.spawnBurst) {
      this.levelRef.spawnBurst(this.x + this.width / 2, this.y + 50, 20, '#fbbf24');
    }
  }

  triggerDefeat(level, camera) {
    if (this.isDefeated) return;
    this.isDefeated = true;
    this.isDead = true;
    this.health = 0;
    this.vx = 0;
    this.vy = 40;
    this.defeatDuration = 4.0;
    this.defeatTimer = 0;
    this.wobbleAngle = 0.55;

    const lvl = level || this.levelRef;
    if (lvl && lvl.spawnSparkles) {
      lvl.spawnSparkles(this.x + this.width / 2, this.y + this.height / 2, 80);
      lvl.spawnBurst(this.x + this.width / 2, this.y + this.height / 2, 50, '#f59e0b');
      lvl.spawnBurst(this.x + this.width / 2, this.y + this.height / 2, 40, '#a855f7');
    }
    if (camera && camera.shake) camera.shake(22, 1.0);

    // Unseal Ancient Ocean Gate to World 7 (The Kingdom Beneath the Sea)
    if (lvl) {
      lvl.shrineBannerText = '⚙️ THE TIME TINKER CHIMES IN DEFEAT! THE OCEAN GATE TO WORLD 7 IS UNSEALED!';
      lvl.shrineBannerTimer = 6.5;
      if (lvl.goal) {
        lvl.goal.unlocked = true;
        lvl.goal.active = true;
      }
    }
  }

  takeDamage(amount, knockX, knockY, audio) {
    if (this.isStaggered) {
      this.damageHeart(1, null, null);
      if (audio && audio.playEnemyHit) audio.playEnemyHit();
      return true;
    }
    this.hurt(amount, 1, 'melee');
    if (audio && audio.playDeflect) audio.playDeflect();
    return false;
  }

  stomp(player, audio) {
    if (this.isStaggered) {
      this.damageHeart(1, null, null);
      player.bounceFromEnemy();
      if (audio && audio.playEnemyHit) audio.playEnemyHit();
      return true;
    }

    // Stomping on the Top Hat / Clockwork Chassis induces heavy desync!
    this.desyncHits += 2;
    player.bounceFromEnemy();

    if (this.desyncHits >= this.desyncHitsRequired) {
      this.triggerStagger();
    }

    if (audio && audio.playEnemyHit) audio.playEnemyHit();
    return false;
  }

  update(dt, level, player, camera) {
    this.levelRef = level;

    // Defeat sequence handling
    if (this.isDefeated) {
      this.defeatTimer += dt;
      this.clockRotation += dt * 15;
      this.gateWest.alpha = Math.max(0, this.gateWest.alpha - dt * 1.5);
      this.gateEast.alpha = Math.max(0, this.gateEast.alpha - dt * 1.5);

      if (level && Math.random() < 0.45) {
        level.spawnSparkles(
          this.x + Math.random() * this.width,
          this.y + Math.random() * this.height,
          4
        );
        if (camera && camera.shake) camera.shake(6, 0.15);
      }
      super.update(dt, level, player, camera);
      return;
    }

    if (this.hitFlashTimer > 0) {
      this.hitFlashTimer -= dt;
    }

    // 1. Arena Lock-in Trigger (x: 9780 - 10640)
    if (!this.isArenaActive && player && player.x >= 9780 && player.x <= 10640) {
      this.isArenaActive = true;
      this.introTimer = this.introDuration;
      if (camera && camera.focus) camera.focus(this.x + this.width / 2, this.y + this.height / 2, 2.4);
      if (camera && camera.shake) camera.shake(16, 0.8);
      if (level && level.spawnBurst) {
        level.spawnBurst(this.x + this.width / 2, this.y + this.height / 2, 36, '#f59e0b');
      }
    }

    // Raise clockwork portcullis gates & clamp player within arena
    if (this.isArenaActive && !this.isDefeated) {
      this.gateWest.alpha = Math.min(1.0, this.gateWest.alpha + dt * 2.0);
      this.gateEast.alpha = Math.min(1.0, this.gateEast.alpha + dt * 2.0);

      if (player && player.x < 9760) {
        player.x = 9760;
        player.vx = Math.max(0, player.vx);
      } else if (player && player.x > 10620) {
        player.x = 10620;
        player.vx = Math.min(0, player.vx);
      }
    }

    if (this.introTimer > 0) {
      this.introTimer -= dt;
      if (this.introTimer <= 0) {
        this.introComplete = true;
      }
      return;
    }

    this.clockRotation += dt * 3.5;
    this.clockHandsAngle += dt * (this.phase === 3 ? 5.0 : 2.5);

    // 2. Update Weak Point Position
    this.sunstoneHeart.x = this.x + 45;
    this.sunstoneHeart.y = this.y + 45;
    this.sunstoneHeart.vulnerable = this.isStaggered;

    // 3. Stagger & Unwind Handling
    if (this.isStaggered) {
      this.staggerTimer -= dt;
      this.vx = 0;
      this.wobbleAngle = Math.sin(Date.now() * 0.015) * 0.22;

      if (level && Math.random() < 0.35) {
        level.spawnSparkles(this.sunstoneHeart.x + 25, this.sunstoneHeart.y + 25, 2);
      }

      if (this.staggerTimer <= 0) {
        this.isStaggered = false;
        this.isVulnerable = false;
        this.sunstoneHeart.vulnerable = false;
        this.wobbleAngle = 0;
        this.desyncHits = 0;
        this.attackTimer = 0;
        if (level && level.spawnBurst) {
          level.spawnBurst(this.x + this.width / 2, this.y + 50, 16, '#f59e0b');
        }
      }

      // Check player melee slash while staggered
      if (player && player.isAttacking && player.getAttackBounds) {
        const atk = player.getAttackBounds();
        if (Collision.intersects(atk, this.sunstoneHeart)) {
          this.damageHeart(1, level, camera);
        }
      }

      super.update(dt, level, player, camera);
      return;
    } else {
      this.wobbleAngle *= 0.90;
    }

    // 4. Update Hazards & Projectiles
    this.updateProjectiles(dt, level, player);
    this.updateShockwaves(dt, level, player);

    if (!player) {
      super.update(dt, level, player, camera);
      return;
    }

    const dx = player.x - this.x;
    this.facing = dx > 0 ? 1 : -1;

    // 5. Attack Telegraphing & Cycling
    if (this.isTelegraphing) {
      this.telegraphTimer -= dt;
      this.vx = 0;
      if (level && Math.random() < 0.4) {
        level.spawnSparkles(this.x + this.width / 2, this.y + 40, 2);
      }
      if (this.telegraphTimer <= 0) {
        this.isTelegraphing = false;
        this.attackTimer = 0;
        this.executeAttack(player, level, camera);
      }
      super.update(dt, level, player, camera);
      return;
    }

    this.attackTimer += dt;
    const interval = this.phase === 3 ? 2.2 : (this.phase === 2 ? 2.8 : 3.4);

    if (this.attackTimer >= interval) {
      this.isTelegraphing = true;
      this.telegraphTimer = this.phase === 3 ? 0.45 : 0.7;
      this.vx = 0;
    } else {
      // Stepped clockwork patrol
      const moveSpeed = this.phase === 3 ? this.speed * 1.35 : (this.phase === 2 ? this.speed * 1.15 : this.speed);
      this.vx = this.facing * moveSpeed;

      if (this.x < 9820) {
        this.x = 9820;
        this.facing = 1;
      } else if (this.x > 10580) {
        this.x = 10580;
        this.facing = -1;
      }
    }

    super.update(dt, level, player, camera);
  }

  executeAttack(player, level, camera) {
    if (!player) return;
    if (camera && camera.shake) camera.shake(12, 0.35);

    if (this.phase === 1) {
      // Phase 1: Rolling Escapement Wheel & Ground Chrono Shockwave
      const originX = this.x + (this.facing > 0 ? this.width : 0);
      const originY = this.y + this.height - 30;

      this.projectiles.push({
        x: originX,
        y: originY,
        vx: this.facing * 340,
        vy: 0,
        radius: 12,
        life: 4.0,
        isRolling: true,
        rotation: 0,
      });

      this.shockwaves.push({
        x: originX,
        y: originY + 10,
        vx: this.facing * 280,
        width: 30,
        height: 24,
        life: 2.2,
      });

      if (level && level.spawnBurst) {
        level.spawnBurst(originX, originY, 14, '#f59e0b');
      }
    } else if (this.phase === 2) {
      // Phase 2: Time Dilation & Falling Gear Rain
      for (let i = 0; i < 5; i++) {
        const dropX = 9920 + i * 140 + Math.random() * 60;
        this.projectiles.push({
          x: dropX,
          y: this.y - 280,
          vx: (Math.random() - 0.5) * 60,
          vy: 360 + Math.random() * 80,
          radius: 10,
          life: 2.5,
          isRolling: false,
          rotation: 0,
        });
      }

      // Twin pulse shockwaves
      this.shockwaves.push({
        x: this.x + this.width / 2,
        y: this.y + this.height - 20,
        vx: 260,
        width: 30,
        height: 24,
        life: 2.0,
      });
      this.shockwaves.push({
        x: this.x + this.width / 2,
        y: this.y + this.height - 20,
        vx: -260,
        width: 30,
        height: 24,
        life: 2.0,
      });
    } else {
      // Phase 3: Grand Astrolabe Overdrive - Radial Sunstone Bullet Burst
      const originX = this.x + this.width / 2;
      const originY = this.y + this.height / 2;

      for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 4) {
        this.projectiles.push({
          x: originX,
          y: originY,
          vx: Math.cos(angle) * 330,
          vy: Math.sin(angle) * 330,
          radius: 8,
          life: 2.2,
          isRolling: false,
          rotation: 0,
        });
      }

      if (level && level.spawnBurst) {
        level.spawnBurst(originX, originY, 20, '#a855f7');
        level.spawnBurst(originX, originY, 14, '#fde047');
      }
    }
  }

  updateProjectiles(dt, level, player) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      p.rotation = (p.rotation || 0) + dt * 10;

      // Bounce on arena boundaries if rolling
      if (p.isRolling && (p.x < 9840 || p.x > 10600)) {
        p.vx = -p.vx;
      }

      if (player && !player.isDead) {
        const pBounds = player.getBounds ? player.getBounds() : { x: player.x, y: player.y, width: player.width, height: player.height };
        const dist = Math.hypot(p.x - (pBounds.x + pBounds.width / 2), p.y - (pBounds.y + pBounds.height / 2));
        if (dist < (p.radius || 10) + 16) {
          player.hurt();
          p.life = 0;
          if (level && level.spawnBurst) {
            level.spawnBurst(p.x, p.y, 8, '#f59e0b');
          }
        }
      }

      if (p.life <= 0 || p.y > 1050) {
        if (level && level.spawnSparkles) {
          level.spawnSparkles(p.x, p.y, 4);
        }
        this.projectiles.splice(i, 1);
      }
    }
  }

  updateShockwaves(dt, level, player) {
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.x += sw.vx * dt;
      sw.life -= dt;
      sw.width = Math.min(60, (sw.width || 30) + dt * 40);

      if (player && !player.isDead) {
        if (
          player.x + player.width > sw.x &&
          player.x < sw.x + sw.width &&
          player.y + player.height >= sw.y - 12 &&
          player.y + player.height <= sw.y + 30
        ) {
          player.hurt();
          sw.life = 0;
        }
      }

      if (sw.life <= 0) {
        this.shockwaves.splice(i, 1);
      }
    }
  }

  getBounds() {
    return {
      x: this.x + 10,
      y: this.y + 10,
      width: this.width - 20,
      height: this.height - 20,
    };
  }

  render(ctx, camera) {
    const camX = camera ? camera.x : 0;
    const camY = camera ? camera.y : 0;

    // 1. Draw Rolling Cogs & Gear Rain
    if (this.projectiles.length > 0) {
      ctx.save();
      for (const p of this.projectiles) {
        const px = Math.round(p.x - camX);
        const py = Math.round(p.y - camY);
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(p.rotation || 0);
        ctx.fillStyle = '#d97706';
        ctx.fillRect(-6, -6, 12, 12);
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(-8, -2, 16, 4);
        ctx.fillRect(-2, -8, 4, 16);
        ctx.fillStyle = '#fde047';
        ctx.fillRect(-3, -3, 6, 6);
        ctx.restore();
      }
      ctx.restore();
    }

    // 2. Draw Chrono Shockwaves
    if (this.shockwaves.length > 0) {
      ctx.save();
      for (const sw of this.shockwaves) {
        const sx = Math.round(sw.x - camX);
        const sy = Math.round(sw.y - camY);
        const swW = Math.round(sw.width || 30);
        ctx.fillStyle = '#fde047';
        ctx.fillRect(sx, sy - 4, swW, 8);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(sx + 2, sy - 2, swW - 4, 4);
      }
      ctx.restore();
    }

    // 3. Draw Clockwork Citadel Portcullis Gates
    if (this.gateWest.alpha > 0.05) {
      ctx.save();
      ctx.globalAlpha = this.gateWest.alpha;
      const wGx = Math.round(this.gateWest.x - camX);
      const wGy = Math.round(this.gateWest.y - camY);
      ctx.fillStyle = '#311042';
      ctx.fillRect(wGx, wGy, this.gateWest.width, this.gateWest.height);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(wGx + 4, wGy + 4, this.gateWest.width - 8, this.gateWest.height - 8);

      const eGx = Math.round(this.gateEast.x - camX);
      const eGy = Math.round(this.gateEast.y - camY);
      ctx.fillStyle = '#311042';
      ctx.fillRect(eGx, eGy, this.gateEast.width, this.gateEast.height);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(eGx + 4, eGy + 4, this.gateEast.width - 8, this.gateEast.height - 8);
      ctx.restore();
    }
  }
}
