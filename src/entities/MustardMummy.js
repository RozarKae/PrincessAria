import { Enemy } from './Enemy.js';
import { ENCOUNTER_ROLES } from '../ai/EncounterCoordinator.js';

/**
 * MUSTARD MUMMY
 * Canonical World 5 Desert Enemy: Ancient deli guardian wrapped in parchment paper
 * and spicy yellow mustard bandages.
 * 
 * 8 Canonical Attributes:
 * 1. ROLE: RANGED AREA CONTROL (Lobbed condiment globs & spicy mustard hazards)
 * 2. THREAT: Rating 3/5 (Parabolic arc projectiles, denying platform space)
 * 3. COUNTER: Princess Starbeam projectile shot or timed jump-stomp during reload
 * 4. TELEGRAPH: Yellow mustard bandages pulse bright gold; raises arms with mustard splash (0.5s)
 * 5. MOVEMENT STYLE: Shuffling slow patrol along toasted bread dunes
 * 6. ATTACK STYLE: Lobs arcing spicy mustard projectiles that leave slippery hazards
 * 7. RECOVERY: Stumbles back in a shower of dry deli paper crumbs (1.4s)
 * 8. ENVIRONMENTAL PREFERENCE: Toasted bread dunes, mustard river banks, cracker ruins
 */
export class MustardMummy extends Enemy {
  constructor(x, y, patrolLeft = null, patrolRight = null) {
    super(x, y, 52, 64, {
      name: 'Mustard Mummy',
      species: 'mustard_mummy',
      role: ENCOUNTER_ROLES.CONTROL,
      threatLevel: 3,
      counterHint: 'Shoot with Starbeam or jump over the mustard arc to stomp',
      telegraphDesc: 'Mustard bandages pulse bright yellow before lobbing projectile',
      movementStyle: 'Shuffling slow patrol along bread dunes',
      attackStyle: 'Arcing spicy mustard glob',
      recoveryDesc: 'Crumbly deli paper reload stumble',
      environmentalPreference: 'Toasted bread dunes & mustard banks',
      health: 2,
      damage: 1,
      speed: 45,
      gravity: 2100,
      detectionRange: 460,
      scoreValue: 260,
    });

    this.patrolStartX = patrolLeft ?? (x - 120);
    this.patrolEndX = patrolRight ?? (x + 120);
    this.shootTimer = 0;
    this.shootInterval = 3.2 + Math.random() * 0.8;
    this.isTelegraphing = false;
    this.telegraphTimer = 0;
    this.mustardProjectiles = [];
  }

  update(dt, level, player, camera) {
    if (this.isDead) {
      super.update(dt, level, player, camera);
      return;
    }

    // Update active mustard glob projectiles
    for (let i = this.mustardProjectiles.length - 1; i >= 0; i--) {
      const p = this.mustardProjectiles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 900 * dt; // Gravity arc
      p.life -= dt;

      // Check collision with player
      if (player && !player.isDead && !player.isInvulnerable) {
        if (
          p.x > player.x &&
          p.x < player.x + player.width &&
          p.y > player.y &&
          p.y < player.y + player.height
        ) {
          const wasHurt = typeof player.takeDamage === 'function'
            ? player.takeDamage(1, p.vx > 0 ? 1 : -1)
            : (typeof player.hurt === 'function' ? player.hurt() : false);
          if (wasHurt && level && level.gameState && typeof level.gameState.loseLife === 'function') {
            level.gameState.loseLife();
          }
          if (camera && wasHurt) camera.shake(10, 0.2);
          p.life = 0;
        }
      }

      if (p.life <= 0 || p.y > 1100) {
        this.mustardProjectiles.splice(i, 1);
      }
    }

    if (player) {
      const dist = Math.abs(player.x - this.x);
      this.facing = player.x > this.x ? 1 : -1;

      // Handle shooting behavior
      if (!this.isTelegraphing) {
        this.shootTimer += dt;
        if (this.shootTimer >= this.shootInterval && dist < this.detectionRange) {
          this.isTelegraphing = true;
          this.telegraphTimer = 0.55;
          this.vx = 0;
        }
      }

      if (this.isTelegraphing) {
        this.telegraphTimer -= dt;
        if (level && Math.random() < 0.3) {
          level.spawnSparkles(this.x + this.width / 2, this.y + 12, 1);
        }

        if (this.telegraphTimer <= 0) {
          this.isTelegraphing = false;
          this.shootTimer = 0;
          this.fireMustardGlob(player);
        }
      }
    }

    // Patrol movement when not shooting
    if (!this.isTelegraphing) {
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

  fireMustardGlob(player) {
    const startX = this.x + (this.facing > 0 ? this.width : 0);
    const startY = this.y + 16;
    const targetX = player ? player.x : (startX + this.facing * 240);
    const dx = targetX - startX;
    const timeOfFlight = 0.9;
    const vx = dx / timeOfFlight;
    const vy = -380; // High lob

    this.mustardProjectiles.push({
      x: startX,
      y: startY,
      vx: Math.max(-320, Math.min(320, vx)),
      vy,
      life: 2.2,
      radius: 8,
    });
  }
}
