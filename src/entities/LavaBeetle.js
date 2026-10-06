import { Enemy } from './Enemy.js';
import { ENEMY_STATES } from '../ai/EnemyStateMachine.js';
import { ENCOUNTER_ROLES } from '../ai/EncounterCoordinator.js';

/**
 * LAVA BEETLE
 * Canonical Volcanic Enemy: Armored basalt scarab with glowing magma shell.
 * 
 * 8 Canonical Attributes:
 * 1. ROLE: PRESSURE (Forward advance, armored frontal shell deflection)
 * 2. THREAT: Rating 3/5 (Immune to frontal starbeams, hot cinder defense)
 * 3. COUNTER: Jump-stomp its shell to flip it upside-down, then strike its soft glowing belly!
 * 4. TELEGRAPH: Carapace cracks glow bright incandescent orange before charge (0.5s)
 * 5. MOVEMENT STYLE: Steady heavy scurrying walk along basalt platforms
 * 6. ATTACK STYLE: Horned forward charge pushing player back
 * 7. RECOVERY: Overturned on back with kicking legs, soft core exposed (2.2s)
 * 8. ENVIRONMENTAL PREFERENCE: Basalt ledges, magma rivers, lava bridges
 */
export class LavaBeetle extends Enemy {
  constructor(x, y) {
    super(x, y, 64, 48, {
      name: 'Lava Beetle',
      species: 'lava_beetle',
      role: ENCOUNTER_ROLES.PRESSURE,
      threatLevel: 3,
      counterHint: 'Stomp its shell to flip it over, then attack its exposed glowing belly',
      telegraphDesc: 'Basalt fissures flare bright magma orange',
      movementStyle: 'Heavy grounded scurry and armored charges',
      attackStyle: 'Armored horn ram',
      recoveryDesc: 'Flipped on back with exposed core',
      environmentalPreference: 'Basalt ledges & lava bridges',
      health: 2,
      damage: 1,
      speed: 70,
      gravity: 2100,
      detectionRange: 380,
      scoreValue: 280,
    });

    this.isFlipped = false;
    this.flipTimer = 0;
    this.patrolStartX = x - 140;
    this.patrolEndX = x + 140;
    this.facing = 1;
    this.chargeTimer = 0;
    this.isCharging = false;
    this.isTelegraphing = false;
    this.telegraphTimer = 0;
  }

  hurt(damage = 1, attackDirection = 1, attackSource = 'stomp') {
    if (this.isDead) return false;

    // If flipped on back, takes direct damage to soft magma core
    if (this.isFlipped) {
      return super.hurt(damage, attackDirection, attackSource);
    }

    // If stomped from above, flips over!
    if (attackSource === 'stomp' || attackSource === 'jump') {
      this.isFlipped = true;
      this.isVulnerable = true;
      this.flipTimer = 2.4;
      this.vx = attackDirection * 60;
      this.vy = -180;
      return false; // Stomp stuns and flips rather than instant killing
    }

    // Frontal starbeam or melee hit checks facing
    // If attacked from behind (attackDirection matches beetle facing), damage passes through!
    const hitFromBehind = (attackDirection > 0 && this.facing > 0) || (attackDirection < 0 && this.facing < 0);
    if (hitFromBehind) {
      return super.hurt(damage, attackDirection, attackSource);
    }

    // Frontal hit: Basalt shell deflects!
    return false;
  }

  update(dt, level, player, camera) {
    if (this.isDead) {
      super.update(dt, level, player, camera);
      return;
    }

    // Flipped recovery
    if (this.isFlipped) {
      this.flipTimer -= dt;
      this.vx *= 0.9;
      if (this.flipTimer <= 0) {
        this.isFlipped = false;
        this.isVulnerable = false;
        this.chargeTimer = 0;
        if (level && level.spawnBurst) {
          level.spawnBurst(this.x + this.width / 2, this.y + this.height - 8, 8, '#f97316');
        }
      }
      super.update(dt, level, player, camera);
      return;
    }

    // Player detection & charge behavior
    if (player) {
      const dist = Math.abs(player.x - (this.x + this.width / 2));
      const sameAltitude = Math.abs(player.y - this.y) < 80;

      if (dist < this.detectionRange && sameAltitude) {
        const playerDir = player.x > this.x ? 1 : -1;

        if (!this.isCharging && !this.isTelegraphing) {
          this.chargeTimer += dt;
          if (this.chargeTimer > 2.2) {
            this.isTelegraphing = true;
            this.telegraphTimer = 0.5;
            this.facing = playerDir;
            this.vx = 0;
          }
        }

        if (this.isTelegraphing) {
          this.telegraphTimer -= dt;
          if (level && Math.random() < 0.3) {
            level.spawnSparkles(this.x + this.width / 2, this.y + 10, 1);
          }
          if (this.telegraphTimer <= 0) {
            this.isTelegraphing = false;
            this.isCharging = true;
            this.chargeTimer = 0;
            this.vx = this.facing * 160;
          }
        }

        if (this.isCharging) {
          this.vx = this.facing * 160;
          // Spawn hot cinder dust
          if (level && Math.random() < 0.25) {
            level.spawnDust(this.x + this.width / 2, this.y + this.height, 1);
          }
          // Turn back if reached edge or past player
          if ((this.facing > 0 && this.x > player.x + 180) || (this.facing < 0 && this.x < player.x - 180)) {
            this.isCharging = false;
          }
        }
      } else {
        this.isCharging = false;
        this.isTelegraphing = false;
      }
    }

    // Normal patrol walking
    if (!this.isCharging && !this.isTelegraphing) {
      this.vx = this.facing * this.speed;
      if (this.x > this.patrolEndX) {
        this.facing = -1;
      } else if (this.x < this.patrolStartX) {
        this.facing = 1;
      }
    }

    super.update(dt, level, player, camera);
  }
}
