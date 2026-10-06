import { Enemy } from './Enemy.js';
import { ENEMY_STATES } from '../ai/EnemyStateMachine.js';
import { ENCOUNTER_ROLES } from '../ai/EncounterCoordinator.js';
import { Collision } from '../physics/Collision.js';

/**
 * SIR SLAM-A-LOT
 * Canonical Boss: The Colossal Hammer Knight of the Thousand Doors
 * 
 * 8 Canonical Attributes:
 * 1. ROLE: TITAN WORLD CLIMAX BOSS
 * 2. THREAT: Rating 5/5 (Massive area presence, earthquake hammer slams, shockwaves)
 * 3. COUNTER: Bait his overhead hammer slam into the 3 Crest Pillars, then strike his exposed back-core!
 * 4. TELEGRAPH: Hoists giant warhammer, eyes flare cyan, hammerhead crackles with orange energy (0.65s)
 * 5. MOVEMENT STYLE: Heavy earth-shaking strides and leap smashes
 * 6. ATTACK STYLE: Earth-shattering warhammer ground slam & horizontal shockwave waves
 * 7. RECOVERY: Hammer embedded in stone floor, vulnerable glowing back-core (1.8s)
 * 8. ENVIRONMENTAL PREFERENCE: The Throne Bastion & Gateway Wall Arena (x: 9,800 - 10,700)
 */
export class SirSlamALot extends Enemy {
  constructor(x, y) {
    super(x, y, 160, 180, {
      name: 'Sir Slam-A-Lot',
      species: 'sir_slam_a_lot',
      role: ENCOUNTER_ROLES.CONTROL,
      threatLevel: 5,
      counterHint: 'Lure his hammer slams near the 3 Crest Pillars to shatter them, then strike his glowing back core',
      telegraphDesc: 'Raises colossal meteorite warhammer with roaring orange energy',
      movementStyle: 'Heavy stomping stride and leaping hammer drop',
      attackStyle: 'Earth-shaking hammer slam & shockwaves',
      recoveryDesc: 'Hammer lodged in bedrock; back-core exposed',
      environmentalPreference: 'The Throne Bastion Gateway Arena',
      health: 8,
      damage: 1,
      speed: 65,
      gravity: 2400,
      detectionRange: 600,
      scoreValue: 3500,
    });

    this.isDefeated = false;
    this.slamTimer = 0;
    this.slamInterval = 4.0;
    this.isSlamming = false;
    this.isHammerStuck = false;
    this.hammerStuckTimer = 0;
    this.hammerX = x + 100;
    this.hammerY = y + 80;

    // 3 Destructible Crest Pillars in the Throne Bastion Arena
    this.pillars = [
      { id: 'left_pillar', name: 'West Bastion Pillar', x: 9940, y: 740, width: 48, height: 140, hp: 1, maxHp: 1, shattered: false },
      { id: 'center_pillar', name: 'Great Gate Pillar', x: 10220, y: 680, width: 56, height: 200, hp: 1, maxHp: 1, shattered: false },
      { id: 'right_pillar', name: 'East Bastion Pillar', x: 10500, y: 740, width: 48, height: 140, hp: 1, maxHp: 1, shattered: false },
    ];

    // Weak point / back power core
    this.powerCore = {
      x: x + 20,
      y: y + 40,
      width: 40,
      height: 40,
      hp: 8,
      maxHp: 8,
      vulnerable: false,
    };
  }

  update(dt, level, player, camera) {
    if (this.isDefeated) {
      super.update(dt, level, player, camera);
      return;
    }

    // Keep power core positioned relative to Sir Slam-A-Lot
    const backOffsetX = this.facing > 0 ? 10 : this.width - 50;
    this.powerCore.x = this.x + backOffsetX;
    this.powerCore.y = this.y + 45;
    this.powerCore.vulnerable = this.isHammerStuck;

    // Facing player
    if (!this.isHammerStuck && !this.isSlamming && player) {
      this.facing = (player.x > this.x + this.width / 2) ? 1 : -1;
    }

    // Hammer stuck recovery countdown
    if (this.isHammerStuck) {
      this.hammerStuckTimer -= dt;
      this.vx = 0;
      this.isVulnerable = true;
      if (this.hammerStuckTimer <= 0) {
        this.isHammerStuck = false;
        this.isVulnerable = false;
        this.slamTimer = 0;
        if (level && level.spawnBurst) {
          level.spawnBurst(this.x + this.width / 2, this.y + this.height - 10, 12, '#94a3b8');
        }
      }
    } else {
      // Normal attack cycle
      this.slamTimer += dt;

      // Pacing stride towards player
      if (player && !this.isSlamming) {
        const dist = Math.abs((player.x + player.width / 2) - (this.x + this.width / 2));
        if (dist > 180) {
          this.vx = this.facing * this.speed;
        } else {
          this.vx = 0;
        }
      }

      // Trigger hammer slam
      if (this.slamTimer >= this.slamInterval && !this.isSlamming) {
        this.startHammerSlam(level, camera);
      }
    }

    // Check Player Melee Attack against exposed power core
    if (player && player.isAttacking && player.getAttackBounds && this.isHammerStuck) {
      const atk = player.getAttackBounds();
      if (Collision.intersects(atk, this.powerCore)) {
        this.powerCore.hp -= 1;
        this.health = this.powerCore.hp;

        if (level && level.spawnBurst) {
          level.spawnBurst(this.powerCore.x + 20, this.powerCore.y + 20, 18, '#38bdf8');
          level.spawnBurst(this.powerCore.x + 20, this.powerCore.y + 20, 10, '#fbbf24');
        }
        if (camera && camera.shake) camera.shake(9, 0.2);

        if (this.powerCore.hp <= 0) {
          this.defeatBoss(level, camera);
        } else {
          // Break out of stun early when hit
          this.isHammerStuck = false;
          this.isVulnerable = false;
          this.slamTimer = 0;
        }
      }
    }

    super.update(dt, level, player, camera);
  }

  startHammerSlam(level, camera) {
    this.isSlamming = true;
    this.vx = 0;
    this.isTelegraphing = true;
    this.telegraphTimer = 0.65;

    setTimeout(() => {
      if (this.isDefeated) return;
      this.executeHammerSlam(level, camera);
    }, 650);
  }

  executeHammerSlam(level, camera) {
    this.isTelegraphing = false;
    this.isSlamming = false;
    this.isHammerStuck = true;
    this.hammerStuckTimer = 1.8;

    const slamX = this.facing > 0 ? this.x + this.width + 20 : this.x - 20;
    const slamY = this.y + this.height - 10;

    // Earthquake Screen Shake
    if (camera && camera.shake) {
      camera.shake(14, 0.5);
    }

    // Ground Dust and Meteor Sparks
    if (level) {
      if (level.spawnBurst) {
        level.spawnBurst(slamX, slamY, 24, '#f97316');
        level.spawnBurst(slamX, slamY, 16, '#fbbf24');
        level.spawnBurst(slamX, slamY, 12, '#94a3b8');
      }
      if (level.spawnDust) {
        for (let dx = -180; dx <= 180; dx += 45) {
          level.spawnDust(slamX + dx, 880, 5);
        }
      }

      // Check proximity to Destructible Pillars
      this.pillars.forEach(pillar => {
        if (!pillar.shattered) {
          const distToPillar = Math.abs(slamX - (pillar.x + pillar.width / 2));
          if (distToPillar < 200) {
            pillar.shattered = true;
            if (level.spawnBurst) {
              level.spawnBurst(pillar.x + pillar.width / 2, pillar.y + pillar.height / 2, 32, '#64748b');
              level.spawnBurst(pillar.x + pillar.width / 2, pillar.y + pillar.height / 2, 20, '#fbbf24');
            }
            if (camera && camera.shake) camera.shake(18, 0.6);
          }
        }
      });
    }

    // Check if player is on the ground near the slam point (shockwave hazard)
    if (level && level.targetPlayer) {
      const p = level.targetPlayer;
      if (p.isGrounded && Math.abs((p.x + p.width / 2) - slamX) < 220) {
        p.hurt();
        p.vy = -380;
      }
    }
  }

  defeatBoss(level, camera) {
    if (this.isDefeated) return;
    this.isDefeated = true;
    this.isDead = true;
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
        level.goal.x = this.x + 320;
        level.goal.y = 800;
      }
    }
  }

  stomp(player, audio) {
    if (this.isHammerStuck) {
      // Direct stomp on exposed back core during stun deals damage
      this.powerCore.hp -= 1;
      this.health = this.powerCore.hp;
      player.bounceFromEnemy();

      if (this.levelRef && this.levelRef.spawnBurst) {
        this.levelRef.spawnBurst(this.powerCore.x + 20, this.powerCore.y + 20, 16, '#38bdf8');
      }

      if (this.powerCore.hp <= 0) {
        this.defeatBoss(this.levelRef, null);
      }
      return true;
    }

    // Heavy steel helmet bounces player safely without hurting the boss
    player.bounceFromEnemy();
    return false;
  }
}
