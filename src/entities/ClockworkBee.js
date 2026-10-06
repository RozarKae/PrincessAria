import { Enemy } from './Enemy.js';
import { ENCOUNTER_ROLES } from '../ai/EncounterCoordinator.js';

/**
 * CLOCKWORK BEE
 * Canonical World 6 Enemy: Mechanized sunstone-powered brass bee of the Clockwork Kingdom.
 * 
 * 8 Canonical Attributes:
 * 1. ROLE: HARASS (Airborne gear-flanker, precision gear darts)
 * 2. THREAT: Rating 3/5 (Hovering sinusoidal tracking & spinning brass gear projectile)
 * 3. COUNTER: Princess Starbeam projectile shot or timed aerial stomp from above
 * 4. TELEGRAPH: Wind-up key spins furiously, eye lens flashes ruby red, ticking sound accelerates (0.5s)
 * 5. MOVEMENT STYLE: Precise mechanical stepped hover with rhythmic ticking wingbeats
 * 6. ATTACK STYLE: High-velocity spinning brass cog dart fired at player's predicted position
 * 7. RECOVERY: Mainspring unwinds with a metallic clatter, hovering motionless for 1.4s
 * 8. ENVIRONMENTAL PREFERENCE: High gearworks, astrolabe chasms, ceiling trusses
 */
export class ClockworkBee extends Enemy {
  constructor(x, y) {
    super(x, y, 48, 48, {
      name: 'Clockwork Bee',
      species: 'clockwork_bee',
      role: ENCOUNTER_ROLES.HARASS,
      threatLevel: 3,
      counterHint: 'Shoot with Starbeam or stomp when its mainspring unwinds',
      telegraphDesc: 'Wind-up key spins rapidly, ruby lens glows with gear sparkles',
      movementStyle: 'Stepped mechanical hover & rapid strafing',
      attackStyle: 'Spinning brass cog dart projectile',
      recoveryDesc: 'Clockwork unspools, hovering stationary for 1.4s',
      environmentalPreference: 'High gearworks & astrolabe chasms',
      health: 1,
      damage: 1,
      speed: 120,
      gravity: 0, // Flying
      detectionRange: 500,
      scoreValue: 240,
    });

    this.baseY = y;
    this.flightTime = Math.random() * Math.PI * 2;
    this.shootTimer = 0;
    this.shootInterval = 2.6 + Math.random() * 1.0;
    this.isTelegraphing = false;
    this.telegraphTimer = 0;
    this.gearDarts = [];
  }

  update(dt, level, player, camera) {
    if (this.isDead) {
      super.update(dt, level, player, camera);
      return;
    }

    this.flightTime += dt * 4.0;

    // Update active gear dart projectiles
    for (let i = this.gearDarts.length - 1; i >= 0; i--) {
      const dart = this.gearDarts[i];
      dart.x += dart.vx * dt;
      dart.y += dart.vy * dt;
      dart.life -= dt;
      dart.rotation = (dart.rotation || 0) + dt * 15;

      // Check collision with player
      if (player && !player.isDead) {
        const dx = (dart.x) - (player.x + player.width / 2);
        const dy = (dart.y) - (player.y + player.height / 2);
        if (Math.hypot(dx, dy) < 22) {
          player.hurt();
          if (level) level.spawnBurst(dart.x, dart.y, 8, '#f59e0b');
          this.gearDarts.splice(i, 1);
          continue;
        }
      }

      if (dart.life <= 0) {
        if (level) level.spawnSparkles(dart.x, dart.y, 4);
        this.gearDarts.splice(i, 1);
      }
    }

    if (player) {
      const dist = Math.hypot(player.x - this.x, player.y - this.y);
      this.facing = (player.x > this.x) ? 1 : -1;

      // Hover & patrol behavior: maintain altitude above player
      const targetY = this.baseY + Math.sin(this.flightTime) * 28;
      this.y += (targetY - this.y) * dt * 3.0;

      if (!this.isTelegraphing) {
        // Sway horizontally toward player when in range
        if (dist < this.detectionRange && dist > 140) {
          const moveDir = (player.x > this.x) ? 1 : -1;
          this.x += moveDir * this.speed * dt * 0.7;
        }

        this.shootTimer += dt;
        if (this.shootTimer >= this.shootInterval && dist < this.detectionRange) {
          this.isTelegraphing = true;
          this.telegraphTimer = 0.5;
        }
      } else {
        // Telegraphing: Wind-up key spinning fast, charging gear dart
        this.telegraphTimer -= dt;
        if (level && Math.random() < 0.4) {
          level.spawnSparkles(this.x + this.width / 2, this.y + this.height / 2, 2);
        }

        if (this.telegraphTimer <= 0) {
          this.isTelegraphing = false;
          this.shootTimer = 0;
          this.fireGearDart(player, level);
        }
      }
    }

    // Wrap around boundaries if any
    this.startX = this.x;
  }

  fireGearDart(player, level) {
    if (!player) return;
    const originX = this.x + this.width / 2;
    const originY = this.y + this.height / 2;
    const angle = Math.atan2((player.y + player.height / 2) - originY, (player.x + player.width / 2) - originX);
    const speed = 360;

    this.gearDarts.push({
      x: originX,
      y: originY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 2.2,
      rotation: 0,
    });

    if (level) {
      level.spawnBurst(originX, originY, 6, '#fbbf24');
    }
  }

  stomp(player, audio) {
    super.stomp(player, audio);
    if (audio && audio.playEnemyHit) audio.playEnemyHit();
  }
}
