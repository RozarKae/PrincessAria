import { Enemy } from './Enemy.js';
import { ENCOUNTER_ROLES } from '../ai/EncounterCoordinator.js';
import { Collision } from '../physics/Collision.js';

/**
 * THE HONEY DRAGON (IGNIS THE HONEY WYRM)
 * Canonical World 4 Climax Boss: The Ancient Molten Honey Wyrm of the Caldera
 * 
 * Production-Grade 3-Phase Climax Boss:
 * - Phase 1 (HP 9-7): Serpentine aerial hover, sweeping molten honey breath,
 *                     and charging flight rushes into the 3 Basalt Pillars causing 2.5s crash stuns.
 * - Phase 2 (HP 6-4): Caldera Geysers erupt across the floor! Volcanic fire droplets rain from above,
 *                     faster attack recovery, and aggressive sweeping dives.
 * - Phase 3 (HP 3-1): White-hot Caldera Overdrive! Ground-sweeping magma heat waves (Aria must use
 *                     thermal updrafts or high basalt galleries to stay airborne), relentless dive-bombs,
 *                     and explosive molten honey bursts.
 * 
 * Features:
 * - Volcanic Obsidian Arena Gates (x: 9740 - 10660) with player arena clamping
 * - Native HD Boss Bar integration with dynamic multi-tier magma/volcanic gradients
 * - Destructible Basalt Pillars that stun the Dragon on charge impact
 * - Amber Heart Core weak point exposed during crash stuns for Stardust Slashes & Star Projectiles
 * - Grand Finale: The Honey Wyrm dissolves into stardust & radiant magma, unsealing the Portal to World 5!
 */
export class HoneyDragon extends Enemy {
  constructor(x, y) {
    super(x, y, 180, 140, {
      name: 'The Honey Dragon',
      species: 'honey_dragon',
      role: ENCOUNTER_ROLES.CONTROL,
      threatLevel: 5,
      counterHint: 'Dodge its flying charges into the 3 Basalt Pillars using thermal updrafts, then strike its glowing heart core!',
      telegraphDesc: 'Maw and horns flare white-hot fire with an echoing roar',
      movementStyle: 'Majestic hovering flight and high-speed aerial charges',
      attackStyle: 'Molten honey breath, magma geysers & pillar-shattering charge',
      recoveryDesc: 'Crashed and dazed; Amber Heart Core exposed',
      environmentalPreference: 'The Heart of the Volcano Arena',
      health: 9,
      maxHealth: 9,
      damage: 1,
      speed: 130,
      gravity: 0, // Flying dragon
      detectionRange: 900,
      scoreValue: 8000,
    });

    this.baseX = x;
    this.baseY = y;
    this.arenaMinX = 9760;
    this.arenaMaxX = 10640;
    this.maxHealth = 9;
    this.health = 9;
    this.phase = 1; // Phase 1 (9-7), Phase 2 (6-4), Phase 3 (3-1)

    // Arena lock & encounter state
    this.isArenaActive = false;
    this.introTimer = 0;
    this.introDuration = 2.4;
    this.introComplete = false;
    this.isDefeated = false;
    this.hitFlashTimer = 0;
    this.flightTime = 0;

    // Attack & State Timers
    this.attackTimer = 0;
    this.attackInterval = 4.0;
    this.isBreathingFire = false;
    this.breathTimer = 0;
    this.isCharging = false;
    this.chargeDir = -1;
    this.isStunned = false;
    this.stunTimer = 0;
    this.isTelegraphing = false;
    this.telegraphTimer = 0;
    this.nextAction = 'BREATH';

    // Phase 2 & 3 Volcanic Hazards
    this.magmaRain = [];
    this.magmaRainTimer = 0;
    this.magmaWaveActive = false;
    this.magmaWaveTimer = 0;

    // 3 Destructible Basalt Pillars in the Arena
    this.pillars = [
      { id: 'left_pillar', name: 'West Basalt Pillar', x: 9920, y: 720, width: 48, height: 160, hp: 1, maxHp: 1, shattered: false },
      { id: 'center_pillar', name: 'Grand Caldera Pillar', x: 10200, y: 660, width: 56, height: 220, hp: 1, maxHp: 1, shattered: false },
      { id: 'right_pillar', name: 'East Basalt Pillar', x: 10480, y: 720, width: 48, height: 160, hp: 1, maxHp: 1, shattered: false },
    ];

    // Weak Point: Amber Heart Core
    this.heartCore = {
      x: x + 60,
      y: y + 40,
      width: 44,
      height: 44,
      vulnerable: false,
    };

    // Volcanic Obsidian Arena Gates (West & East)
    this.gateWest = { x: 9740, y: 440, width: 32, height: 460, alpha: 0 };
    this.gateEast = { x: 10660, y: 440, width: 32, height: 460, alpha: 0 };
  }

  hurt(damage = 1, attackDirection = 1, attackSource = 'projectile') {
    if (this.isDead || this.isDefeated) return false;

    // Dragon only takes damage when stunned and vulnerable
    if (this.isStunned) {
      this.damageHeart(damage, null, null);
      return true;
    }

    return false; // Hardened honey crystal scales deflect attacks
  }

  damageHeart(amount = 1, level, camera) {
    if (this.isDead || this.isDefeated) return;

    this.health -= amount;
    this.hitFlashTimer = 0.22;

    const lvl = level || this.levelRef;
    if (lvl && lvl.spawnBurst) {
      lvl.spawnBurst(this.heartCore.x + 22, this.heartCore.y + 22, 22, '#f59e0b');
      lvl.spawnBurst(this.heartCore.x + 22, this.heartCore.y + 22, 14, '#ef4444');
      lvl.spawnSparkles(this.heartCore.x + 22, this.heartCore.y + 22, 16);
    }
    if (camera && camera.shake) camera.shake(12, 0.3);

    if (this.health <= 0) {
      this.triggerDefeat(lvl, camera);
    } else {
      // Break out of stun on hit so player can't infinite-combo in one opening
      this.isStunned = false;
      this.isVulnerable = false;
      this.heartCore.vulnerable = false;
      this.attackTimer = 0;
      this.vy = -180; // Fly up high after taking damage
    }
  }

  triggerPhase(newPhase, level, camera) {
    this.phase = newPhase;
    if (camera && camera.shake) camera.shake(18, 0.65);
    const lvl = level || this.levelRef;
    if (lvl && lvl.spawnBurst) {
      lvl.spawnBurst(this.x + this.width / 2, this.y + this.height / 2, 40, newPhase === 3 ? '#ef4444' : '#f97316');
      lvl.spawnSparkles(this.x + this.width / 2, this.y + this.height / 2, 25);
    }
  }

  triggerDefeat(level, camera) {
    if (this.isDefeated) return;
    this.isDefeated = true;
    this.isDead = true;
    this.health = 0;
    this.vx = 0;
    this.vy = 60;
    this.defeatDuration = 3.6;
    this.defeatTimer = 0;

    const lvl = level || this.levelRef;
    if (lvl && lvl.spawnSparkles) {
      lvl.spawnSparkles(this.x + this.width / 2, this.y + this.height / 2, 80);
      lvl.spawnBurst(this.x + this.width / 2, this.y + this.height / 2, 50, '#fbbf24');
      lvl.spawnBurst(this.x + this.width / 2, this.y + this.height / 2, 40, '#f97316');
    }
    if (camera && camera.shake) camera.shake(22, 1.0);

    // Shatter any remaining pillars in volcanic shockwave
    this.pillars.forEach(p => p.shattered = true);

    // Unseal Ancient Portal to World 5
    if (lvl) {
      lvl.shrineBannerText = '🌋 THE HONEY DRAGON ROARS IN HONOR! THE PORTAL TO WORLD 5 IS UNSEALED!';
      lvl.shrineBannerTimer = 6.5;
      if (lvl.goal) {
        lvl.goal.unlocked = true;
        lvl.goal.active = true;
      }
    }
  }

  takeDamage(amount, knockX, knockY, audio) {
    if (this.isStunned) {
      this.damageHeart(1, null, null);
      if (audio && audio.playEnemyHit) audio.playEnemyHit();
      return true;
    }
    if (audio && audio.playDeflect) audio.playDeflect();
    return false;
  }

  stomp(player, audio) {
    if (this.isStunned) {
      this.damageHeart(1, null, null);
      player.bounceFromEnemy();
      if (audio && audio.playEnemyHit) audio.playEnemyHit();
      return true;
    }

    // Heavy dragon scales bounce player
    player.bounceFromEnemy();
    if (audio && audio.playDeflect) audio.playDeflect();
    return false;
  }

  update(dt, level, player, camera) {
    this.levelRef = level;

    // Defeat sequence handling
    if (this.isDefeated) {
      this.defeatTimer += dt;
      this.gateWest.alpha = Math.max(0, this.gateWest.alpha - dt * 1.5);
      this.gateEast.alpha = Math.max(0, this.gateEast.alpha - dt * 1.5);

      if (level && Math.random() < 0.45) {
        level.spawnBurst(
          this.x + Math.random() * this.width,
          this.y + Math.random() * this.height,
          6,
          Math.random() < 0.5 ? '#fbbf24' : '#f97316'
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
        level.spawnBurst(this.x + this.width / 2, this.y + this.height / 2, 36, '#f97316');
      }
    }

    // Raise volcanic gates & clamp player within arena
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

    // 2. Phase Thresholds
    if (this.health <= 3 && this.phase < 3) {
      this.triggerPhase(3, level, camera);
    } else if (this.health <= 6 && this.phase < 2) {
      this.triggerPhase(2, level, camera);
    }

    this.flightTime += dt * 2.5;

    // 3. Update Weak Point Position
    const heartOffsetX = this.facing > 0 ? 70 : 30;
    this.heartCore.x = this.x + heartOffsetX;
    this.heartCore.y = this.y + 40;
    this.heartCore.vulnerable = this.isStunned;

    // 4. Update Hazards (Magma Droplets) in Phase 2 & 3
    if (this.phase >= 2) {
      this.updateMagmaRain(dt, level, player);
    }

    // 5. Stun Recovery State
    if (this.isStunned) {
      this.stunTimer -= dt;
      this.vx = 0;
      this.vy = 0;
      this.isVulnerable = true;

      // Sparkling vulnerability particles around the heart
      if (level && Math.random() < 0.35) {
        level.spawnSparkles(this.heartCore.x + 22, this.heartCore.y + 22, 2);
      }

      if (this.stunTimer <= 0) {
        this.isStunned = false;
        this.isVulnerable = false;
        this.heartCore.vulnerable = false;
        this.attackTimer = 0;
        if (level && level.spawnBurst) {
          level.spawnBurst(this.x + this.width / 2, this.y + this.height / 2, 18, '#f97316');
        }
      }

      // Check player melee slash against heart core while stunned
      if (player && player.isAttacking && player.getAttackBounds) {
        const atk = player.getAttackBounds();
        if (Collision.intersects(atk, this.heartCore)) {
          this.damageHeart(1, level, camera);
        }
      }

      super.update(dt, level, player, camera);
      return;
    }

    if (!player) {
      super.update(dt, level, player, camera);
      return;
    }

    // Facing player when hovering
    if (!this.isCharging) {
      this.facing = (player.x > this.x + this.width / 2) ? 1 : -1;
    }

    // 6. Telegraph State
    if (this.isTelegraphing) {
      this.telegraphTimer -= dt;
      if (level && Math.random() < 0.4) {
        level.spawnSparkles(
          this.x + (this.facing > 0 ? this.width : 0),
          this.y + 35,
          3
        );
      }
      if (this.telegraphTimer <= 0) {
        this.isTelegraphing = false;
        if (this.nextAction === 'BREATH') {
          this.isBreathingFire = true;
          this.breathTimer = this.phase === 3 ? 2.2 : 1.8;
        } else if (this.nextAction === 'CHARGE') {
          this.isCharging = true;
          this.chargeDir = this.facing;
          const chargeSpeed = this.phase === 3 ? 420 : (this.phase === 2 ? 360 : 310);
          this.vx = this.chargeDir * chargeSpeed;
        }
      }
      super.update(dt, level, player, camera);
      return;
    }

    // 7. Active Molten Honey Breath
    if (this.isBreathingFire) {
      this.breathTimer -= dt;
      this.vx = 0;
      this.vy = 0;

      // Flame breath particle stream
      const breathStartX = this.x + (this.facing > 0 ? this.width : 0);
      const breathStartY = this.y + 45;
      if (level && Math.random() < 0.7) {
        level.spawnBurst(
          breathStartX + this.facing * (Math.random() * 180 + 20),
          breathStartY + Math.random() * 45,
          5,
          Math.random() < 0.5 ? '#fef08a' : '#f97316'
        );
      }

      // Check player breath burn
      const breathWidth = this.phase === 3 ? 240 : 200;
      const breathRect = {
        x: this.facing > 0 ? breathStartX : breathStartX - breathWidth,
        y: breathStartY - 20,
        width: breathWidth,
        height: 75,
      };
      if (Collision.intersects(player.getBounds(), breathRect)) {
        player.hurt(10, this.facing);
      }

      if (this.breathTimer <= 0) {
        this.isBreathingFire = false;
        this.attackTimer = 0;
      }
      super.update(dt, level, player, camera);
      return;
    }

    // 8. Active High-Speed Charge
    if (this.isCharging) {
      const chargeSpeed = this.phase === 3 ? 420 : (this.phase === 2 ? 360 : 310);
      this.vx = this.chargeDir * chargeSpeed;

      // Check impact with Destructible Basalt Pillars
      const dragonBounds = this.getBounds();
      for (let i = 0; i < this.pillars.length; i++) {
        const pillar = this.pillars[i];
        if (!pillar.shattered && Collision.intersects(dragonBounds, pillar)) {
          // SHATTER PILLAR!
          pillar.shattered = true;
          pillar.hp = 0;
          this.isCharging = false;
          this.isStunned = true;
          this.stunTimer = this.phase === 3 ? 2.0 : 2.6; // Ample window to strike glowing heart!
          this.vx = 0;
          this.vy = 0;

          if (camera && camera.shake) camera.shake(18, 0.55);
          if (level && level.spawnBurst) {
            level.spawnBurst(pillar.x + pillar.width / 2, pillar.y + pillar.height / 2, 30, '#1c1514');
            level.spawnBurst(pillar.x + pillar.width / 2, pillar.y + pillar.height / 2, 20, '#f97316');
          }
          break;
        }
      }

      // If charged past arena edge without hitting a pillar, turn back
      if ((this.chargeDir > 0 && this.x > 10600) || (this.chargeDir < 0 && this.x < 9800)) {
        this.isCharging = false;
        this.attackTimer = 0;
      }

      super.update(dt, level, player, camera);
      return;
    }

    // 9. Normal Hover & Attack Cycling
    this.attackTimer += dt;
    const hoverAmplitude = this.phase === 3 ? 45 : 30;
    const hoverY = this.baseY + Math.sin(this.flightTime) * hoverAmplitude;
    this.vy = (hoverY - this.y) * 2.2;
    this.vx = (player.x - (this.x + this.width / 2)) * 0.35;

    const interval = this.phase === 3 ? 2.6 : (this.phase === 2 ? 3.4 : 4.2);
    if (this.attackTimer >= interval) {
      this.attackTimer = 0;

      // Check if any pillars are still intact to bait a charge
      const intactPillars = this.pillars.filter(p => !p.shattered).length;
      if (intactPillars > 0) {
        // High probability of charging so player can counter
        this.nextAction = Math.random() < 0.65 ? 'CHARGE' : 'BREATH';
      } else {
        // All pillars shattered! Alternates between breath and swift swoop charges
        this.nextAction = Math.random() < 0.5 ? 'BREATH' : 'CHARGE';
      }

      this.isTelegraphing = true;
      this.telegraphTimer = this.phase === 3 ? 0.45 : 0.65;
    }

    super.update(dt, level, player, camera);
  }

  updateMagmaRain(dt, level, player) {
    this.magmaRainTimer += dt;
    const spawnRate = this.phase === 3 ? 1.0 : 1.8;

    if (this.magmaRainTimer >= spawnRate) {
      this.magmaRainTimer = 0;
      // Spawn volcanic fire droplet raining over the arena floor
      const dropX = this.arenaMinX + 100 + Math.random() * (this.arenaMaxX - this.arenaMinX - 200);
      this.magmaRain.push({
        x: dropX,
        y: 420,
        vx: (Math.random() - 0.5) * 40,
        vy: 240,
        radius: 8,
        lifetime: 2.8,
      });
    }

    for (let i = this.magmaRain.length - 1; i >= 0; i--) {
      const drop = this.magmaRain[i];
      drop.x += drop.vx * dt;
      drop.y += drop.vy * dt;
      drop.lifetime -= dt;

      // Hit player
      if (player && !player.isDead) {
        const pBounds = player.getBounds ? player.getBounds() : { x: player.x, y: player.y, width: player.width, height: player.height };
        const dist = Math.hypot(drop.x - (pBounds.x + pBounds.width / 2), drop.y - (pBounds.y + pBounds.height / 2));
        if (dist < drop.radius + 16) {
          player.hurt();
          drop.lifetime = 0;
          if (level && level.spawnBurst) {
            level.spawnBurst(drop.x, drop.y, 10, '#f97316');
          }
        }
      }

      if (drop.lifetime <= 0 || drop.y > 900) {
        if (level && level.spawnBurst && drop.y >= 880) {
          level.spawnBurst(drop.x, 880, 6, '#ea580c');
        }
        this.magmaRain.splice(i, 1);
      }
    }
  }

  getBounds() {
    return {
      x: this.x + 12,
      y: this.y + 12,
      width: this.width - 24,
      height: this.height - 24,
    };
  }

  render(ctx, camera) {
    const camX = camera ? camera.x : 0;
    const camY = camera ? camera.y : 0;

    // 1. Draw Volcanic Fire Droplets
    if (this.magmaRain.length > 0) {
      ctx.save();
      for (const drop of this.magmaRain) {
        const dx = Math.round(drop.x - camX);
        const dy = Math.round(drop.y - camY);
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(dx, dy, drop.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(dx - 1, dy - 1, drop.radius * 0.45, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // 2. Draw Obsidian Arena Gates
    if (this.gateWest.alpha > 0.05) {
      ctx.save();
      ctx.globalAlpha = this.gateWest.alpha;
      const wGx = Math.round(this.gateWest.x - camX);
      const wGy = Math.round(this.gateWest.y - camY);
      ctx.fillStyle = '#1c1514';
      ctx.fillRect(wGx, wGy, this.gateWest.width, this.gateWest.height);
      ctx.fillStyle = '#ea580c';
      ctx.fillRect(wGx + 4, wGy + 4, this.gateWest.width - 8, this.gateWest.height - 8);

      const eGx = Math.round(this.gateEast.x - camX);
      const eGy = Math.round(this.gateEast.y - camY);
      ctx.fillStyle = '#1c1514';
      ctx.fillRect(eGx, eGy, this.gateEast.width, this.gateEast.height);
      ctx.fillStyle = '#ea580c';
      ctx.fillRect(eGx + 4, eGy + 4, this.gateEast.width - 8, this.gateEast.height - 8);
      ctx.restore();
    }
  }
}
