import { Enemy } from './Enemy.js';
import { ENEMY_STATES } from '../ai/EnemyStateMachine.js';
import { ENCOUNTER_ROLES } from '../ai/EncounterCoordinator.js';

/**
 * FIRE BEE
 * Canonical Volcanic Enemy: Flying incendiary scout of the hot honey caldera.
 * 
 * 8 Canonical Attributes:
 * 1. ROLE: HARASS (Airborne flanker, incendiary honey trails)
 * 2. THREAT: Rating 3/5 (Fast diagonal dive-bombs, aerial area denial)
 * 3. COUNTER: Princess Starbeam projectile shot or timed jump-stomp when swooping
 * 4. TELEGRAPH: Pauses mid-air, stinger glows incandescent yellow-white, wings buzz sharply (0.45s)
 * 5. MOVEMENT STYLE: Sinusoidal wave flight with predatory dive-bombs
 * 6. ATTACK STYLE: High-speed swoop toward player trailing flame cinders
 * 7. RECOVERY: Upward pullout ascent, slow hover for 1.2s
 * 8. ENVIRONMENTAL PREFERENCE: Molten honey falls, bubbling craters, thermal updrafts
 */
export class FireBee extends Enemy {
  constructor(x, y) {
    super(x, y, 48, 48, {
      name: 'Fire Bee',
      species: 'fire_bee',
      role: ENCOUNTER_ROLES.HARASS,
      threatLevel: 3,
      counterHint: 'Shoot with Starbeam or stomp during swoop recovery',
      telegraphDesc: 'Hover stop, stinger glows incandescent yellow',
      movementStyle: 'Wave flight & high-speed swooping dives',
      attackStyle: 'Fiery stinger swoop trail',
      recoveryDesc: 'Ascending pullout & hovering cooldown',
      environmentalPreference: 'Molten honey falls & bubbling craters',
      health: 1,
      damage: 1,
      speed: 130,
      gravity: 0, // Flying
      detectionRange: 420,
      scoreValue: 220,
    });

    this.baseY = y;
    this.flightTime = Math.random() * Math.PI * 2;
    this.swoopTimer = 0;
    this.swoopCooldown = 2.8 + Math.random() * 1.2;
    this.isSwooping = false;
    this.swoopTargetX = 0;
    this.swoopTargetY = 0;
    this.isTelegraphing = false;
    this.telegraphTimer = 0;
  }

  update(dt, level, player, camera) {
    if (this.isDead) {
      super.update(dt, level, player, camera);
      return;
    }

    this.flightTime += dt * 3.5;

    // Player tracking
    if (player) {
      const dist = Math.hypot(player.x - this.x, player.y - this.y);
      this.facing = (player.x > this.x) ? 1 : -1;

      // Check swoop trigger
      if (!this.isSwooping && !this.isTelegraphing) {
        this.swoopTimer += dt;
        if (this.swoopTimer >= this.swoopCooldown && dist < this.detectionRange) {
          this.isTelegraphing = true;
          this.telegraphTimer = 0.45;
          this.vx = 0;
          this.vy = 0;
        }
      }

      // Telegraphing phase
      if (this.isTelegraphing) {
        this.telegraphTimer -= dt;
        // Jitter / glow telegraph
        if (level && Math.random() < 0.3) {
          level.spawnSparkles(this.x + this.width / 2, this.y + this.height - 4, 1);
        }
        if (this.telegraphTimer <= 0) {
          this.isTelegraphing = false;
          this.isSwooping = true;
          this.swoopTargetX = player.x;
          this.swoopTargetY = player.y;

          const angle = Math.atan2(this.swoopTargetY - this.y, this.swoopTargetX - this.x);
          const swoopSpeed = 280;
          this.vx = Math.cos(angle) * swoopSpeed;
          this.vy = Math.sin(angle) * swoopSpeed;
        }
      }

      // Active swooping phase
      if (this.isSwooping) {
        // Leave cinder particle trail
        if (level && Math.random() < 0.4) {
          level.spawnDust(this.x + this.width / 2, this.y + this.height / 2, 2);
        }

        // Check if swoop finished (overshot or reached floor)
        if (this.y >= this.swoopTargetY || this.y > this.baseY + 160) {
          this.isSwooping = false;
          this.swoopTimer = 0;
          this.vy = -120; // Ascend back to base altitude
        }
      }
    }

    // Normal sinusoidal patrolling flight
    if (!this.isSwooping && !this.isTelegraphing) {
      this.vx = this.facing * this.speed * 0.7;
      const waveY = this.baseY + Math.sin(this.flightTime) * 32;
      this.vy = (waveY - this.y) * 3;
    }

    super.update(dt, level, player, camera);
  }
}
