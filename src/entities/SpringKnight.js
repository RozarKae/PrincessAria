import { Enemy } from './Enemy.js';
import { ENCOUNTER_ROLES } from '../ai/EncounterCoordinator.js';

/**
 * SPRING KNIGHT
 * Canonical World 6 Heavy Automaton: Sunstone-wound clockwork sentry of the Clockwork Kingdom.
 * 
 * 8 Canonical Attributes:
 * 1. ROLE: PRESSURE / ARMORED CONTROL (Heavy platform guardian, coiled leaps)
 * 2. THREAT: Rating 4/5 (Heavy brass armor, high coiled spring jumps, rapier lunge)
 * 3. COUNTER: Stomp from above during landing recovery or slash exposed back spring
 * 4. TELEGRAPH: Crouches deeply, mainspring compresses with loud ticking clicks, visor glows amber (0.55s)
 * 5. MOVEMENT STYLE: Heavy mechanical marching with sudden explosive spring releases
 * 6. ATTACK STYLE: High ballistic coiled leap and forward rapier thrust
 * 7. RECOVERY: Coiled spring rattles and oscillates, stunned for 1.2s after landing
 * 8. ENVIRONMENTAL PREFERENCE: Ticking bridges, brass conveyors, gear gateways
 */
export class SpringKnight extends Enemy {
  constructor(x, y, patrolLeft = null, patrolRight = null) {
    super(x, y, 52, 64, {
      name: 'Spring Knight',
      species: 'spring_knight',
      role: ENCOUNTER_ROLES.PRESSURE,
      threatLevel: 4,
      counterHint: 'Stomp or slash his back when his spring rattles during landing recovery',
      telegraphDesc: 'Crouches low, mainspring compresses with ticking clicks, visor flares amber',
      movementStyle: 'Heavy armored march & ballistic coiled leap',
      attackStyle: 'Explosive spring-loaded leap & rapier thrust',
      recoveryDesc: 'Mainspring oscillates after landing, vulnerable for 1.2s',
      environmentalPreference: 'Ticking bridges, gear gateways, narrow brass beams',
      health: 2,
      damage: 1,
      speed: 95,
      gravity: 2100,
      detectionRange: 420,
      scoreValue: 350,
      patrolLeft: patrolLeft !== null ? patrolLeft : x - 180,
      patrolRight: patrolRight !== null ? patrolRight : x + 180,
    });

    this.isCrouching = false;
    this.isSpringJumping = false;
    this.isRecovering = false;
    this.recoveryTimer = 0;
    this.jumpTimer = 0;
    this.jumpCooldown = 3.0 + Math.random() * 1.5;
    this.springCompression = 0; // 0 to 1
  }

  update(dt, level, player, camera) {
    if (this.isDead) {
      super.update(dt, level, player, camera);
      return;
    }

    // Apply gravity
    this.vy += this.gravity * dt;
    if (this.vy > 1200) this.vy = 1200;

    // Recovery state after jump
    if (this.isRecovering) {
      this.recoveryTimer -= dt;
      this.vx = 0;
      this.springCompression = Math.sin(Date.now() * 0.03) * 0.2; // Spring vibrating
      if (this.recoveryTimer <= 0) {
        this.isRecovering = false;
        this.springCompression = 0;
      }
      this.y += this.vy * dt;
      this.checkPlatformCollisions(level);
      return;
    }

    if (player) {
      const dist = Math.hypot(player.x - this.x, player.y - this.y);
      if (!this.isSpringJumping && !this.isCrouching) {
        this.facing = (player.x > this.x) ? 1 : -1;
      }

      // Check spring leap attack trigger
      if (!this.isSpringJumping && !this.isCrouching && dist < this.detectionRange) {
        this.jumpTimer += dt;
        if (this.jumpTimer >= this.jumpCooldown && this.isGrounded) {
          this.isCrouching = true;
          this.telegraphTimer = 0.55;
          this.vx = 0;
        }
      }

      // Telegraphing: Crouching low and compressing spring
      if (this.isCrouching) {
        this.telegraphTimer -= dt;
        this.springCompression = Math.min(1, 1 - (this.telegraphTimer / 0.55));
        if (level && Math.random() < 0.4) {
          level.spawnSparkles(this.x + this.width / 2, this.y + this.height - 10, 2);
        }

        if (this.telegraphTimer <= 0) {
          this.isCrouching = false;
          this.isSpringJumping = true;
          this.isGrounded = false;
          this.jumpTimer = 0;
          this.springCompression = 0;

          // Launch high coiled leap toward player
          const dir = (player.x > this.x) ? 1 : -1;
          this.facing = dir;
          this.vx = dir * 300;
          this.vy = -780;

          if (level) {
            level.spawnBurst(this.x + this.width / 2, this.y + this.height, 8, '#f59e0b');
          }
        }
      }
    }

    // Normal patrol when not jumping or crouching
    if (!this.isCrouching && !this.isSpringJumping) {
      this.x += this.facing * this.speed * dt;
      if (this.x < this.patrolLeft) {
        this.x = this.patrolLeft;
        this.facing = 1;
      } else if (this.x > this.patrolRight) {
        this.x = this.patrolRight;
        this.facing = -1;
      }
    } else if (this.isSpringJumping) {
      this.x += this.vx * dt;
    }

    this.y += this.vy * dt;
    this.checkPlatformCollisions(level);
  }

  checkPlatformCollisions(level) {
    if (!level || !level.platforms) return;
    this.isGrounded = false;

    for (const plat of level.platforms) {
      if (
        this.x + this.width > plat.x &&
        this.x < plat.x + plat.width &&
        this.y + this.height >= plat.y &&
        this.y + this.height <= plat.y + 24 &&
        this.vy >= 0
      ) {
        this.y = plat.y - this.height;
        this.vy = 0;
        this.isGrounded = true;

        // If we just landed from a coiled leap, enter recovery
        if (this.isSpringJumping) {
          this.isSpringJumping = false;
          this.isRecovering = true;
          this.recoveryTimer = 1.2;
          this.vx = 0;
          if (level) {
            level.spawnDust(this.x + this.width / 2, this.y + this.height, 6);
          }
        }
        break;
      }
    }
  }

  takeDamage(amount = 1, knockbackX = 0, knockbackY = -240, audio = null) {
    // If recovering, takes double damage!
    if (this.isRecovering) {
      amount *= 2;
    }
    return super.takeDamage(amount, knockbackX, knockbackY, audio);
  }
}
