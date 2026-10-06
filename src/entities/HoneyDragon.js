import { Enemy } from './Enemy.js';
import { ENCOUNTER_ROLES } from '../ai/EncounterCoordinator.js';
import { Collision } from '../physics/Collision.js';

/**
 * THE HONEY DRAGON (IGNIS THE HONEY WYRM)
 * Canonical World 4 Climax Boss: The Ancient Molten Honey Wyrm of the Caldera
 * 
 * 8 Canonical Attributes:
 * 1. ROLE: TITAN WORLD CLIMAX BOSS
 * 2. THREAT: Rating 5/5 (Caldera-wide area control, molten honey breath, crashing charges)
 * 3. COUNTER: Bait its charging rush into the 3 Basalt Pillars, then strike its exposed Amber Heart Core!
 * 4. TELEGRAPH: Throat and horns flare incandescent white-hot, wings flare wide with a deep roar (0.7s)
 * 5. MOVEMENT STYLE: Sinister aerial serpentine hover and earth-shattering swooping charges
 * 6. ATTACK STYLE: Sweeping molten honey flame breath, tail ground-slams, and charge rams
 * 7. RECOVERY: Stunned crash recovery after impacting basalt pillars; glowing heart core exposed (2.5s)
 * 8. ENVIRONMENTAL PREFERENCE: The Heart of the Volcano Caldera Arena (x: 9,800 - 10,700)
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
      attackStyle: 'Molten honey breath & pillar-shattering charge',
      recoveryDesc: 'Crashed and dazed; Amber Heart Core exposed',
      environmentalPreference: 'The Heart of the Volcano Arena',
      health: 9,
      damage: 1,
      speed: 120,
      gravity: 0, // Flying dragon
      detectionRange: 750,
      scoreValue: 4500,
    });

    this.baseY = y;
    this.flightTime = 0;
    this.isDefeated = false;
    this.phase = 1; // 1: Hover & Breath, 2: Tail Slam, 3: Pillar Charge
    this.attackTimer = 0;
    this.attackInterval = 4.2;
    this.isBreathingFire = false;
    this.breathTimer = 0;
    this.isCharging = false;
    this.chargeDir = -1;
    this.isStunned = false;
    this.stunTimer = 0;
    this.isTelegraphing = false;
    this.telegraphTimer = 0;

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
  }

  hurt(damage = 1, attackDirection = 1, attackSource = 'projectile') {
    if (this.isDead || this.isDefeated) return false;

    // Dragon only takes damage when stunned and vulnerable
    if (this.isStunned) {
      this.health -= damage;
      if (this.health <= 0) {
        this.triggerDefeat();
      }
      return true;
    }

    return false; // Hardened honey crystal scales deflect attacks
  }

  triggerDefeat() {
    this.isDefeated = true;
    this.isDead = true;
    this.vx = 0;
    this.vy = 80;
    this.defeatDuration = 3.5;
    this.defeatTimer = 0;

    // Unseal the ancient volcanic portal
    if (this.levelRef && this.levelRef.goal) {
      this.levelRef.goal.unlocked = true;
      this.levelRef.goal.active = true;
    }
  }

  update(dt, level, player, camera) {
    this.levelRef = level;

    if (this.isDefeated) {
      this.defeatTimer += dt;
      if (level && Math.random() < 0.4) {
        level.spawnBurst(
          this.x + Math.random() * this.width,
          this.y + Math.random() * this.height,
          6,
          Math.random() < 0.5 ? '#fbbf24' : '#f97316'
        );
        if (camera) camera.shake(7, 0.15);
      }
      super.update(dt, level, player, camera);
      return;
    }

    this.flightTime += dt * 2.5;

    // Position Amber Heart Core
    const heartOffsetX = this.facing > 0 ? 70 : 30;
    this.heartCore.x = this.x + heartOffsetX;
    this.heartCore.y = this.y + 40;
    this.heartCore.vulnerable = this.isStunned;

    // Stun recovery
    if (this.isStunned) {
      this.stunTimer -= dt;
      this.vx = 0;
      this.vy = 0;
      this.isVulnerable = true;
      if (this.stunTimer <= 0) {
        this.isStunned = false;
        this.isVulnerable = false;
        this.attackTimer = 0;
        if (level && level.spawnBurst) {
          level.spawnBurst(this.x + this.width / 2, this.y + this.height / 2, 16, '#f97316');
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

    // Telegraph countdown
    if (this.isTelegraphing) {
      this.telegraphTimer -= dt;
      if (level && Math.random() < 0.35) {
        level.spawnSparkles(
          this.x + (this.facing > 0 ? this.width : 0),
          this.y + 30,
          2
        );
      }
      if (this.telegraphTimer <= 0) {
        this.isTelegraphing = false;
        if (this.nextAction === 'BREATH') {
          this.isBreathingFire = true;
          this.breathTimer = 1.6;
        } else if (this.nextAction === 'CHARGE') {
          this.isCharging = true;
          this.chargeDir = this.facing;
          this.vx = this.chargeDir * 320;
        }
      }
      super.update(dt, level, player, camera);
      return;
    }

    // Active Molten Honey Breath
    if (this.isBreathingFire) {
      this.breathTimer -= dt;
      this.vx = 0;
      this.vy = 0;

      // Flame breath particle stream & hit detection
      const breathStartX = this.x + (this.facing > 0 ? this.width : 0);
      const breathStartY = this.y + 40;
      if (level && Math.random() < 0.6) {
        level.spawnBurst(
          breathStartX + this.facing * (Math.random() * 160 + 20),
          breathStartY + Math.random() * 40,
          4,
          Math.random() < 0.5 ? '#fef08a' : '#f97316'
        );
      }

      // Check player breath burn
      const breathRect = {
        x: this.facing > 0 ? breathStartX : breathStartX - 200,
        y: breathStartY - 20,
        width: 200,
        height: 70,
      };
      if (Collision.intersects(player.getBounds(), breathRect)) {
        player.hurt(1, this.facing);
      }

      if (this.breathTimer <= 0) {
        this.isBreathingFire = false;
        this.attackTimer = 0;
      }
      super.update(dt, level, player, camera);
      return;
    }

    // Active High-Speed Charge
    if (this.isCharging) {
      this.vx = this.chargeDir * 320;

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
          this.stunTimer = 2.6; // Vulnerability damage window!
          this.vx = 0;

          if (camera) camera.shake(16, 0.45);
          if (level && level.spawnBurst) {
            level.spawnBurst(pillar.x + pillar.width / 2, pillar.y + pillar.height / 2, 28, '#342624');
            level.spawnBurst(pillar.x + pillar.width / 2, pillar.y + pillar.height / 2, 16, '#f97316');
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

    // Normal Hover & Attack Cycling
    this.attackTimer += dt;
    const hoverY = this.baseY + Math.sin(this.flightTime) * 28;
    this.vy = (hoverY - this.y) * 2;
    this.vx = (player.x - (this.x + this.width / 2)) * 0.3;

    if (this.attackTimer >= this.attackInterval) {
      this.attackTimer = 0;
      // Alternate between Molten Breath and Charging Rush
      const intactPillars = this.pillars.filter(p => !p.shattered).length;
      if (intactPillars > 0 && Math.random() < 0.6) {
        this.nextAction = 'CHARGE';
      } else {
        this.nextAction = 'BREATH';
      }
      this.isTelegraphing = true;
      this.telegraphTimer = 0.7;
    }

    super.update(dt, level, player, camera);
  }
}
