import { Enemy } from './Enemy.js';
import { ENCOUNTER_ROLES } from '../ai/EncounterCoordinator.js';

/**
 * CHEESE SCORPION
 * Canonical World 5 Desert Enemy: Aggressive predatory scorpion crafted from sharp
 * aged Swiss cheese with a lethal cheddar stinger tail.
 * 
 * 8 Canonical Attributes:
 * 1. ROLE: PRESSURE / PUNISHER (Fast scuttle, lunge attacks, tail stinger thrust)
 * 2. THREAT: Rating 3/5 (High ground speed, sudden lunging stinger strikes)
 * 3. COUNTER: Princess Starbeam projectile shot or timed aerial jump-stomp during post-lunge recovery
 * 4. TELEGRAPH: Cheddar stinger tail arches forward and trembles with yellow sparks (0.4s)
 * 5. MOVEMENT STYLE: Rapid multi-legged skitter across crust dunes and cracker ledges
 * 6. ATTACK STYLE: High-speed forward charge ending with a piercing stinger stab
 * 7. RECOVERY: Stinger lodged in bread crust, immobilized for 1.2s
 * 8. ENVIRONMENTAL PREFERENCE: Swiss cheese canyons, bread dunes, crumbly toast platforms
 */
export class CheeseScorpion extends Enemy {
  constructor(x, y, patrolLeft = null, patrolRight = null) {
    super(x, y, 62, 44, {
      name: 'Cheese Scorpion',
      species: 'cheese_scorpion',
      role: ENCOUNTER_ROLES.PRESSURE,
      threatLevel: 3,
      counterHint: 'Stomp when its stinger is stuck in the crust after lunging',
      telegraphDesc: 'Cheddar stinger tail curls forward with yellow sparks',
      movementStyle: 'Fast skitter and sudden stinger thrusts',
      attackStyle: 'Piercing tail stinger charge',
      recoveryDesc: 'Stinger momentarily lodged in platform crust',
      environmentalPreference: 'Swiss cheese canyons & toast dunes',
      health: 2,
      damage: 1,
      speed: 95,
      gravity: 2100,
      detectionRange: 380,
      scoreValue: 300,
    });

    this.patrolStartX = patrolLeft ?? (x - 140);
    this.patrolEndX = patrolRight ?? (x + 140);
    this.isLunging = false;
    this.isLodged = false;
    this.lodgedTimer = 0;
    this.isTelegraphing = false;
    this.telegraphTimer = 0;
    this.lungeCooldown = 2.6;
    this.lungeTimer = 0;
    this.lungeVx = 0;
  }

  update(dt, level, player, camera) {
    if (this.isDead) {
      super.update(dt, level, player, camera);
      return;
    }

    // Lodged recovery state
    if (this.isLodged) {
      this.lodgedTimer -= dt;
      this.vx = 0;
      if (this.lodgedTimer <= 0) {
        this.isLodged = false;
        this.lungeTimer = 0;
      }
      super.update(dt, level, player, camera);
      return;
    }

    if (player) {
      const dist = Math.abs(player.x - this.x);
      const isPlayerAhead = (this.facing > 0 && player.x > this.x) || (this.facing < 0 && player.x < this.x);

      // Check lunge trigger
      if (!this.isLunging && !this.isTelegraphing) {
        this.lungeTimer += dt;
        if (this.lungeTimer >= this.lungeCooldown && dist < this.detectionRange && isPlayerAhead) {
          this.isTelegraphing = true;
          this.telegraphTimer = 0.42;
          this.vx = 0;
        }
      }

      // Telegraphing
      if (this.isTelegraphing) {
        this.telegraphTimer -= dt;
        if (level && Math.random() < 0.35) {
          level.spawnSparkles(this.x + (this.facing > 0 ? this.width : 0), this.y - 10, 1);
        }
        if (this.telegraphTimer <= 0) {
          this.isTelegraphing = false;
          this.isLunging = true;
          this.lungeVx = this.facing * 280;
          this.vx = this.lungeVx;
        }
      }

      // Lunging
      if (this.isLunging) {
        this.vx = this.lungeVx;
        // Stop after hitting wall or short sprint
        if (
          (this.facing > 0 && this.x > this.patrolEndX + 60) ||
          (this.facing < 0 && this.x < this.patrolStartX - 60) ||
          Math.abs(this.vx) < 10
        ) {
          this.isLunging = false;
          this.isLodged = true;
          this.lodgedTimer = 1.1; // Stinger stuck in crumb crust
        }
      }
    }

    // Normal patrol
    if (!this.isTelegraphing && !this.isLunging && !this.isLodged) {
      if (this.facing > 0) {
        this.vx = this.speed;
        if (this.x > this.patrolEndX) {
          this.facing = -1;
        }
      } else {
        this.vx = -this.speed;
        if (this.x < this.patrolStartX) {
          this.facing = 1;
        }
      }
    }

    super.update(dt, level, player, camera);
  }
}
