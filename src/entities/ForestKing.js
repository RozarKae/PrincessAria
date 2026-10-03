import { Enemy } from './Enemy.js';
import { ENEMY_STATES } from '../ai/EnemyStateMachine.js';
import { ENCOUNTER_ROLES } from '../ai/EncounterCoordinator.js';
import { Collision } from '../physics/Collision.js';

/**
 * FOREST KING
 * Canonical Boss: Colossal Sentient Ancient Oak Corrupted by Dark Hive Root Magic
 * 
 * 8 Canonical Attributes:
 * 1. ROLE: TITAN WORLD CLIMAX BOSS
 * 2. THREAT: Rating 5/5 (Massive area presence, root shockwaves, spore showers)
 * 3. COUNTER: Launch off Bouncy Mushrooms to sever 2 Branch Root Cores, then strike the Heart-Crown!
 * 4. TELEGRAPH: Trunk tremors, pulsing purple root veins, and deep ancient groans
 * 5. MOVEMENT STYLE: Immovable rooted ancient titan
 * 6. ATTACK STYLE: Ground root quakes, bramble eruptions, canopy spore storms
 * 7. RECOVERY: Vulnerable stun window after root quake slams
 * 8. ENVIRONMENTAL PREFERENCE: The Sacred Heart Grove of the Whispering Forest (x: 9,800 - 10,600)
 */
export class ForestKing extends Enemy {
  constructor(x, y) {
    super(x, y, 220, 320, {
      name: 'Forest King',
      species: 'forest_king',
      role: ENCOUNTER_ROLES.CONTROL,
      threatLevel: 5,
      counterHint: 'Bounce on mushrooms to strike corrupted root nodes; sever all 3 to free the Forest King',
      telegraphDesc: 'Trunk groans and root veins pulse with dark purple energy',
      movementStyle: 'Rooted colossal titan',
      attackStyle: 'Root quake and spore storm',
      recoveryDesc: 'Root exhaustion window',
      environmentalPreference: 'The Ancient Sacred Grove',
      health: 7, // 2 (Left) + 2 (Right) + 3 (Crown)
      damage: 1,
      speed: 0,
      gravity: 0,
      isFlying: true,
      detectionRange: 600,
      scoreValue: 2500,
    });

    this.isPurified = false;
    this.quakeTimer = 0;
    this.quakeInterval = 4.2;
    this.isQuaking = false;
    this.rumbleDuration = 0.8;

    // 3 Corrupted Root Cores
    this.cores = [
      { id: 'left_root', name: 'Left Corrupted Root', x: x - 120, y: y + 80, width: 44, height: 44, hp: 2, maxHp: 2, severed: false },
      { id: 'right_root', name: 'Right Corrupted Root', x: x + 160, y: y + 80, width: 44, height: 44, hp: 2, maxHp: 2, severed: false },
      { id: 'heart_crown', name: 'Corrupted Heart Crown', x: x + 20, y: y - 80, width: 56, height: 56, hp: 3, maxHp: 3, severed: false, shielded: true },
    ];
  }

  update(dt, level, player, camera) {
    if (this.isPurified) return;

    // Check if branch cores are severed to lower shield on heart crown
    const branchesSevered = this.cores[0].severed && this.cores[1].severed;
    if (branchesSevered) {
      this.cores[2].shielded = false;
    }

    // Check Boss Victory / Purification
    if (this.cores[0].severed && this.cores[1].severed && this.cores[2].severed) {
      this.purify(level, camera);
      return;
    }

    // Root Quake Attack Cycle
    this.quakeTimer += dt;
    if (this.quakeTimer >= this.quakeInterval) {
      this.quakeTimer = 0;
      this.triggerRootQuake(level, camera);
    }

    // Check Player Attack Collisions against Root Cores
    if (player && player.isAttacking && player.getAttackBounds) {
      const atk = player.getAttackBounds();
      this.cores.forEach(core => {
        if (!core.severed && !core.shielded) {
          if (Collision.intersects(atk, core)) {
            core.hp -= 1;
            if (level && level.spawnBurst) {
              level.spawnBurst(core.x + core.width / 2, core.y + core.height / 2, 16, '#d946ef');
            }
            if (camera && camera.shake) camera.shake(8, 0.18);

            if (core.hp <= 0) {
              core.severed = true;
              if (level && level.spawnSparkles) {
                level.spawnSparkles(core.x + core.width / 2, core.y + core.height / 2, 28);
              }
            }
          }
        }
      });
    }

    super.update(dt, level, player, camera);
  }

  triggerRootQuake(level, camera) {
    if (camera && camera.shake) camera.shake(10, 0.45);
    if (level && level.spawnDust) {
      for (let px = this.x - 300; px <= this.x + 300; px += 80) {
        level.spawnDust(px, 880, 4);
      }
    }
  }

  purify(level, camera) {
    if (this.isPurified) return;
    this.isPurified = true;
    this.isDead = true;

    if (level && level.spawnSparkles) {
      level.spawnSparkles(this.x + 100, this.y + 100, 60);
      level.spawnBurst(this.x + 100, this.y + 100, 40, '#22c55e');
    }
    if (camera && camera.shake) camera.shake(14, 0.6);

    // Forest King dialogue reveal & goal unlock
    if (level) {
      level.shrineBannerText = '🌿 THE FOREST KING AWAKENS: "BEHOLD THE PATH TO WORLD 3!"';
      level.shrineBannerTimer = 6.0;
      if (level.goal) {
        level.goal.x = this.x + 280;
        level.goal.y = 800;
      }
    }
  }

  stomp(player, audio) {
    // Forest King is an ancient titan; stomping on his crown doesn't kill him, but bounces Arifa!
    player.bounceFromEnemy();
    return false;
  }
}
