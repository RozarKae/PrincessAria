import { Enemy } from './Enemy.js';
import { ENCOUNTER_ROLES } from '../ai/EncounterCoordinator.js';
import { Collision } from '../physics/Collision.js';

/**
 * SIR SLAM-A-LOT
 * Canonical Boss of World 3: The Castle of a Thousand Doors
 * 
 * Production-Grade 3-Phase Climax Boss:
 * - Colossal Iron Hammer Knight guarding the Gateway Wall
 * - Phase 1 (HP 8-6): Heavy strides, massive overhead warhammer ground slams,
 *                     lodging his hammer in bedrock and exposing his glowing Back Power Core.
 * - Phase 2 (HP 5-3): Enraged leaping slams! Flying Key Barrages (shoots winged keys at Aria),
 *                     faster recovery window, ground-skimming shockwaves.
 * - Phase 3 (HP 2-1): Meteor Warhammer Frenzy! Triple shockwave eruptions, glowing orange overdrive,
 *                     shatters the 3 Crest Pillars for massive arena tremors.
 * 
 * Features:
 * - Dynamic Portcullis Arena Lock-in at x: 9740 - 10660
 * - High-definition Boss Health Bar in the HUD with Castle Crimson/Gold theme
 * - Vulnerable Back Power Core targeted by Stardust Slash or Star Projectiles
 * - Grand Finale: Warhammer strikes down the ancient wall, unsealing the Portal to World 4!
 */
export class SirSlamALot extends Enemy {
  constructor(x, y) {
    super(x, y, 160, 180, {
      name: 'Sir Slam-A-Lot',
      species: 'sir_slam_a_lot',
      role: ENCOUNTER_ROLES.CONTROL,
      threatLevel: 5,
      counterHint: 'Dodge his hammer slam, jump behind him while his hammer is lodged in stone, and strike the glowing back core!',
      telegraphDesc: 'Hoists giant meteorite warhammer overhead as visor flares fiery orange',
      movementStyle: 'Heavy stomping stride, sudden leap slams, and flying key barrages',
      attackStyle: 'Earth-shattering warhammer ground slam & horizontal shockwaves',
      recoveryDesc: 'Hammer lodged in bedrock; glowing blue back-core exposed',
      environmentalPreference: 'The Throne Bastion Gateway Arena',
      health: 8,
      maxHealth: 8,
      damage: 1,
      speed: 70,
      gravity: 2400,
      detectionRange: 850,
      scoreValue: 7000,
    });

    this.baseX = x;
    this.baseY = y;
    this.arenaMinX = 9760;
    this.arenaMaxX = 10640;
    this.maxHealth = 8;
    this.health = 8;
    this.phase = 1;

    // Arena lock & encounter state
    this.isArenaActive = false;
    this.introTimer = 0;
    this.introDuration = 2.4;
    this.introComplete = false;
    this.isDefeated = false;
    this.hitFlashTimer = 0;

    // Hammer & Stun State
    this.slamTimer = 0;
    this.slamInterval = 3.8;
    this.isSlamming = false;
    this.isTelegraphing = false;
    this.telegraphTimer = 0;
    this.isHammerStuck = false;
    this.hammerStuckTimer = 0;
    this.shockwaveX = 0;

    // 3 Destructible Crest Pillars
    this.pillars = [
      { id: 'left_pillar', name: 'West Crest Pillar', x: 9940, y: 720, width: 48, height: 160, shattered: false },
      { id: 'center_pillar', name: 'Great Bastion Pillar', x: 10220, y: 680, width: 56, height: 200, shattered: false },
      { id: 'right_pillar', name: 'East Crest Pillar', x: 10500, y: 720, width: 48, height: 160, shattered: false },
    ];

    // Weak Point / Back Power Core
    this.powerCore = {
      x: x + 20,
      y: y + 45,
      width: 44,
      height: 44,
      hp: 8,
      maxHp: 8,
      vulnerable: false,
    };

    // Phase 2 & 3 Winged Key Projectiles
    this.flyingKeys = [];

    // Castellar Portcullis Gates (West and East)
    this.gateWest = { x: 9740, y: 460, width: 32, height: 460, alpha: 0 };
    this.gateEast = { x: 10660, y: 460, width: 32, height: 460, alpha: 0 };
  }

  update(dt, level, player, camera) {
    if (this.isDefeated) {
      this.gateWest.alpha = Math.max(0, this.gateWest.alpha - dt * 1.5);
      this.gateEast.alpha = Math.max(0, this.gateEast.alpha - dt * 1.5);

      if (level && Math.random() < 0.35) {
        level.spawnSparkles(this.x + Math.random() * this.width, this.y + Math.random() * this.height, 4);
      }
      super.update(dt, level, player, camera);
      return;
    }

    if (this.hitFlashTimer > 0) {
      this.hitFlashTimer -= dt;
    }

    // 1. Arena Lock-in Trigger
    if (!this.isArenaActive && player && player.x >= 9780 && player.x <= 10640) {
      this.isArenaActive = true;
      this.introTimer = this.introDuration;
      if (camera) camera.focus(this.x + this.width / 2, this.y + this.height / 2, 2.4);
      if (camera) camera.shake(16, 0.8);
      if (level && level.spawnBurst) {
        level.spawnBurst(this.x + this.width / 2, this.y + this.height - 20, 36, '#f97316');
      }
    }

    // Raise portcullis gates when arena active
    if (this.isArenaActive && !this.isDefeated) {
      this.gateWest.alpha = Math.min(1.0, this.gateWest.alpha + dt * 2.0);
      this.gateEast.alpha = Math.min(1.0, this.gateEast.alpha + dt * 2.0);

      // Clamp player within arena bounds
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
    if (this.health <= 2 && this.phase < 3) {
      this.triggerPhase(3, level, camera);
    } else if (this.health <= 5 && this.phase < 2) {
      this.triggerPhase(2, level, camera);
    }

    // 3. Update Weak Point Position
    const backOffsetX = this.facing > 0 ? 8 : this.width - 52;
    this.powerCore.x = this.x + backOffsetX;
    this.powerCore.y = this.y + 45;
    this.powerCore.vulnerable = this.isHammerStuck;

    // 4. Update Flying Key Projectiles
    this.updateFlyingKeys(dt, level, player);

    // 5. Boss AI & State Handling
    if (this.isHammerStuck) {
      this.hammerStuckTimer -= dt;
      this.vx = 0;
      this.isVulnerable = true;

      // Vulnerable blue glow sparkles
      if (level && Math.random() < 0.3) {
        level.spawnSparkles(this.powerCore.x + 20, this.powerCore.y + 20, 2);
      }

      if (this.hammerStuckTimer <= 0) {
        this.isHammerStuck = false;
        this.isVulnerable = false;
        this.slamTimer = 0;
        if (level && level.spawnBurst) {
          level.spawnBurst(this.x + this.width / 2, this.y + this.height - 10, 14, '#94a3b8');
        }
      }
    } else if (this.isTelegraphing) {
      this.telegraphTimer -= dt;
      this.vx = 0;
      if (this.telegraphTimer <= 0) {
        this.executeHammerSlam(level, camera, player);
      }
    } else {
      // Facing Player
      if (player) {
        this.facing = player.x > this.x + this.width / 2 ? 1 : -1;
      }

      // Normal Stride towards player
      this.slamTimer += dt;
      if (player && !this.isSlamming) {
        const dist = Math.abs((player.x + player.width / 2) - (this.x + this.width / 2));
        if (dist > 180) {
          const moveSpeed = this.phase === 3 ? this.speed * 1.5 : (this.phase === 2 ? this.speed * 1.25 : this.speed);
          this.vx = this.facing * moveSpeed;
        } else {
          this.vx = 0;
        }
      }

      // Attack Trigger
      const interval = this.phase === 3 ? 2.2 : (this.phase === 2 ? 3.0 : 3.8);
      if (this.slamTimer >= interval && !this.isSlamming) {
        this.startHammerSlam(player, level, camera);
      }
    }

    // 6. Check Player Melee Attack against exposed power core
    if (player && player.isAttacking && player.getAttackBounds && this.isHammerStuck) {
      const atk = player.getAttackBounds();
      if (Collision.intersects(atk, this.powerCore)) {
        this.damageCore(1, level, camera);
      }
    }

    super.update(dt, level, player, camera);
  }

  startHammerSlam(player, level, camera) {
    this.isSlamming = true;
    this.vx = 0;
    this.isTelegraphing = true;
    this.telegraphTimer = this.phase === 3 ? 0.45 : 0.65;

    // In Phase 2 or 3, shoot winged keys during telegraph
    if (this.phase >= 2) {
      this.launchFlyingKeys(player, level);
    }
  }

  executeHammerSlam(level, camera, player) {
    this.isTelegraphing = false;
    this.isSlamming = false;
    this.isHammerStuck = true;
    this.hammerStuckTimer = this.phase === 3 ? 1.8 : 2.5; // Ample window for Aria to jump behind!

    const slamX = this.facing > 0 ? this.x + this.width + 25 : this.x - 25;
    const slamY = this.y + this.height - 10;

    // Earthquake Screen Shake
    if (camera && camera.shake) {
      camera.shake(this.phase === 3 ? 18 : 14, 0.55);
    }

    // Ground Dust & Meteor Sparks
    if (level) {
      if (level.spawnBurst) {
        level.spawnBurst(slamX, slamY, 26, '#f97316');
        level.spawnBurst(slamX, slamY, 18, '#fbbf24');
        level.spawnBurst(slamX, slamY, 14, '#94a3b8');
      }
      if (level.spawnDust) {
        for (let dx = -200; dx <= 200; dx += 45) {
          level.spawnDust(slamX + dx, 880, 5);
        }
      }

      // Check Proximity to Destructible Pillars
      this.pillars.forEach(pillar => {
        if (!pillar.shattered) {
          const distToPillar = Math.abs(slamX - (pillar.x + pillar.width / 2));
          if (distToPillar < 220) {
            pillar.shattered = true;
            if (level.spawnBurst) {
              level.spawnBurst(pillar.x + pillar.width / 2, pillar.y + pillar.height / 2, 34, '#64748b');
              level.spawnBurst(pillar.x + pillar.width / 2, pillar.y + pillar.height / 2, 22, '#fbbf24');
            }
            if (camera && camera.shake) camera.shake(20, 0.65);
          }
        }
      });
    }

    // Shockwave damage: hurts player if on ground near impact
    if (player && !player.isDead) {
      if (player.isGrounded && Math.abs((player.x + player.width / 2) - slamX) < 240) {
        player.hurt();
        player.vy = -380;
      }
    }
  }

  launchFlyingKeys(player, level) {
    const startX = this.x + this.width / 2;
    const startY = this.y + 20;
    const count = this.phase === 3 ? 3 : 2;

    for (let i = 0; i < count; i++) {
      const spread = (i - (count - 1) / 2) * 90;
      const targetX = (player ? player.x : this.x) + spread;
      const dx = targetX - startX;
      const speedX = dx * 1.5;
      const speedY = -280 - Math.random() * 80;

      this.flyingKeys.push({
        x: startX,
        y: startY,
        vx: speedX,
        vy: speedY,
        radius: 12,
        lifetime: 2.5,
      });
    }

    if (level && level.spawnBurst) {
      level.spawnBurst(startX, startY, 14, '#38bdf8');
    }
  }

  updateFlyingKeys(dt, level, player) {
    for (let i = this.flyingKeys.length - 1; i >= 0; i--) {
      const k = this.flyingKeys[i];
      k.vy += 650 * dt;
      k.x += k.vx * dt;
      k.y += k.vy * dt;
      k.lifetime -= dt;

      // Hit player check
      if (player && !player.isDead) {
        const pBounds = player.getBounds ? player.getBounds() : { x: player.x, y: player.y, width: player.width, height: player.height };
        const dist = Math.hypot(k.x - (pBounds.x + pBounds.width / 2), k.y - (pBounds.y + pBounds.height / 2));
        if (dist < k.radius + 18) {
          player.hurt();
          k.lifetime = 0;
          if (level && level.spawnBurst) {
            level.spawnBurst(k.x, k.y, 14, '#38bdf8');
          }
        }
      }

      if (k.lifetime <= 0 || k.y > 900) {
        if (level && level.spawnDust) {
          level.spawnDust(k.x, k.y, 3);
        }
        this.flyingKeys.splice(i, 1);
      }
    }
  }

  damageCore(amount, level, camera) {
    if (!this.isHammerStuck || this.isDefeated) return;

    this.powerCore.hp -= amount;
    this.health = this.powerCore.hp;
    this.hitFlashTimer = 0.22;

    if (level && level.spawnBurst) {
      level.spawnBurst(this.powerCore.x + 20, this.powerCore.y + 20, 20, '#38bdf8');
      level.spawnBurst(this.powerCore.x + 20, this.powerCore.y + 20, 12, '#fbbf24');
    }
    if (camera && camera.shake) camera.shake(10, 0.25);

    if (this.powerCore.hp <= 0) {
      this.defeatBoss(level, camera);
    } else {
      // Break out of stun on impact
      this.isHammerStuck = false;
      this.isVulnerable = false;
      this.slamTimer = 0;
    }
  }

  triggerPhase(newPhase, level, camera) {
    this.phase = newPhase;
    if (camera) camera.shake(16, 0.6);
    if (level && level.spawnBurst) {
      level.spawnBurst(this.x + this.width / 2, this.y + 50, 36, newPhase === 3 ? '#ef4444' : '#f97316');
      level.spawnSparkles(this.x + this.width / 2, this.y + 50, 20);
    }
  }

  defeatBoss(level, camera) {
    if (this.isDefeated) return;
    this.isDefeated = true;
    this.isDead = true;
    this.health = 0;
    this.vx = 0;

    // Grand Finale: Final Hammer Impact Breaches Gateway Wall!
    if (level && level.spawnSparkles) {
      level.spawnSparkles(this.x + this.width / 2, this.y + 60, 80);
      level.spawnBurst(this.x + this.width / 2, this.y + 60, 50, '#fbbf24');
      level.spawnBurst(this.x + this.width / 2, this.y + 60, 40, '#38bdf8');
    }
    if (camera && camera.shake) camera.shake(20, 0.9);

    // Shatter all remaining pillars
    this.pillars.forEach(p => p.shattered = true);

    // Dialog / Victory Announcement & Reveal Portal to World 4!
    if (level) {
      level.shrineBannerText = '🏰 SIR SLAM-A-LOT: "THOU ART WORTHY! THE GATEWAY TO WORLD 4 IS UNSEALED!"';
      level.shrineBannerTimer = 6.5;
      if (level.goal) {
        level.goal.x = this.x + 360;
        level.goal.y = 800;
      }
    }
  }

  takeDamage(amount, knockX, knockY, audio) {
    // Frontal body absorbs attacks; damage must hit exposed back power core
    if (audio && audio.playDeflect) audio.playDeflect();
    return false;
  }

  stomp(player, audio) {
    if (this.isHammerStuck) {
      this.damageCore(1, null, null);
      player.bounceFromEnemy();
      return true;
    }

    // Heavy horned greathelm bounces player safely
    player.bounceFromEnemy();
    if (audio && audio.playDeflect) audio.playDeflect();
    return false;
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

    // 1. Draw Flying Keys
    if (this.flyingKeys.length > 0) {
      ctx.save();
      for (const k of this.flyingKeys) {
        const kx = Math.round(k.x - camX);
        const ky = Math.round(k.y - camY);
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(kx, ky, k.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.arc(kx - 2, ky - 2, k.radius * 0.4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // 2. Draw Portcullis Gates
    if (this.gateWest.alpha > 0.05) {
      ctx.save();
      ctx.globalAlpha = this.gateWest.alpha;
      const wGx = Math.round(this.gateWest.x - camX);
      const wGy = Math.round(this.gateWest.y - camY);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(wGx, wGy, this.gateWest.width, this.gateWest.height);
      ctx.fillStyle = '#f97316';
      ctx.fillRect(wGx + 4, wGy + 4, this.gateWest.width - 8, this.gateWest.height - 8);

      const eGx = Math.round(this.gateEast.x - camX);
      const eGy = Math.round(this.gateEast.y - camY);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(eGx, eGy, this.gateEast.width, this.gateEast.height);
      ctx.fillStyle = '#f97316';
      ctx.fillRect(eGx + 4, eGy + 4, this.gateEast.width - 8, this.gateEast.height - 8);
      ctx.restore();
    }
  }
}
