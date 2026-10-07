import { Enemy } from './Enemy.js';
import { ENCOUNTER_ROLES } from '../ai/EncounterCoordinator.js';

/**
 * PICKLE BOMBER
 * Canonical World 5 Desert Enemy: Airborne crinkle-cut dill pickle slice flying on crispy onion wings.
 * 
 * 8 Canonical Attributes:
 * 1. ROLE: HARASS (Airborne wave patrol, dropping tangy brine droplets)
 * 2. THREAT: Rating 2/5 (Wave flight pattern, aerial hazard drops)
 * 3. COUNTER: Shoot with Starbeam or jump-stomp (provides an extra-high trampoline bounce!)
 * 4. TELEGRAPH: Green dill slice vibrates with sour green brine sparkles before dropping brine (0.4s)
 * 5. MOVEMENT STYLE: Sinusoidal undulating wave flight above bread canyons
 * 6. ATTACK STYLE: Drops caustic brine droplets straight down
 * 7. RECOVERY: Slow gliding pullout
 * 8. ENVIRONMENTAL PREFERENCE: Open air above mustard rivers, Swiss cheese bridges
 */
export class PickleBomber extends Enemy {
  constructor(x, y) {
    super(x, y, 46, 36, {
      name: 'Pickle Bomber',
      species: 'pickle_bomber',
      role: ENCOUNTER_ROLES.HARASS,
      threatLevel: 2,
      counterHint: 'Shoot with Starbeam or stomp from above to get an extra-high bounce',
      telegraphDesc: 'Vibrates and sheds green sour sparkles before dropping brine',
      movementStyle: 'Undulating sinusoidal flight above bread canyons',
      attackStyle: 'Tangy brine droplet bomb',
      recoveryDesc: 'Glide pullout cooldown',
      environmentalPreference: 'Mustard river skies & cheese bridges',
      health: 1,
      damage: 1,
      speed: 85,
      gravity: 0, // Flying
      detectionRange: 420,
      scoreValue: 240,
    });

    this.baseY = y;
    this.waveTime = Math.random() * Math.PI * 2;
    this.dropTimer = 0;
    this.dropInterval = 2.8 + Math.random() * 1.2;
    this.isTelegraphing = false;
    this.telegraphTimer = 0;
    this.brineBombs = [];
  }

  hurt(damage = 1, attackDirection = 1, attackSource = 'stomp') {
    // If stomped, triggers bouncy pickle spring for Aria!
    return super.hurt(damage, attackDirection, attackSource);
  }

  update(dt, level, player, camera) {
    if (this.isDead) {
      super.update(dt, level, player, camera);
      return;
    }

    this.waveTime += dt * 3.0;
    this.y = this.baseY + Math.sin(this.waveTime) * 32;

    // Update brine bombs
    for (let i = this.brineBombs.length - 1; i >= 0; i--) {
      const b = this.brineBombs[i];
      b.y += b.vy * dt;
      b.vy += 850 * dt;
      b.life -= dt;

      if (player && !player.isDead && !player.isInvulnerable) {
        if (
          b.x > player.x &&
          b.x < player.x + player.width &&
          b.y > player.y &&
          b.y < player.y + player.height
        ) {
          const wasHurt = typeof player.takeDamage === 'function'
            ? player.takeDamage(5, 0)
            : (typeof player.hurt === 'function' ? player.hurt(5) : false);
          if (camera && wasHurt) camera.shake(10, 0.2);
          b.life = 0;
        }
      }

      if (b.life <= 0 || b.y > 1100) {
        this.brineBombs.splice(i, 1);
      }
    }

    if (player) {
      const dx = player.x - this.x;
      this.facing = dx > 0 ? 1 : -1;
      const dist = Math.hypot(dx, player.y - this.y);

      // Check drop trigger when nearly overhead
      if (!this.isTelegraphing) {
        this.dropTimer += dt;
        if (this.dropTimer >= this.dropInterval && Math.abs(dx) < 140 && dist < this.detectionRange) {
          this.isTelegraphing = true;
          this.telegraphTimer = 0.45;
        }
      }

      if (this.isTelegraphing) {
        this.telegraphTimer -= dt;
        if (level && Math.random() < 0.4) {
          level.spawnSparkles(this.x + this.width / 2, this.y + this.height, 1);
        }
        if (this.telegraphTimer <= 0) {
          this.isTelegraphing = false;
          this.dropTimer = 0;
          this.dropBrine();
        }
      }
    }

    this.vx = this.facing * this.speed;
    super.update(dt, level, player, camera);
  }

  dropBrine() {
    this.brineBombs.push({
      x: this.x + this.width / 2,
      y: this.y + this.height,
      vy: 120,
      life: 2.5,
    });
  }
}
