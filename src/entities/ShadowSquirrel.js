import { Enemy } from './Enemy.js';
import { ENEMY_STATES } from '../ai/EnemyStateMachine.js';
import { ENCOUNTER_ROLES } from '../ai/EncounterCoordinator.js';

/**
 * SHADOW SQUIRREL
 * Canonical Role: AMBUSH & HIGH-AGILITY CANOPY AMBUSHER
 * 
 * 8 Canonical Attributes:
 * 1. ROLE: AMBUSH & PRESSURE (Scampers swiftly along boughs, leaps at Arifa)
 * 2. THREAT: Rating 3/5 (High agility, sudden forward leap attack)
 * 3. COUNTER: Stomp from above during its leap, or strike with Stardust Slash
 * 4. TELEGRAPH: Pauses, twitches ears, fluffs tail with dark purple shadow sparks (0.35s)
 * 5. MOVEMENT STYLE: Rapid scamper with periodic perched vigilance
 * 6. ATTACK STYLE: High-arcing acrobatic pounce toward player
 * 7. RECOVERY: Brief landing balance recovery (0.45s)
 * 8. ENVIRONMENTAL PREFERENCE: High branches, canopy platforms, log bridges
 */
export class ShadowSquirrel extends Enemy {
  constructor(x, y, patrolLeft, patrolRight) {
    super(x, y, 54, 44, {
      name: 'Shadow Squirrel',
      species: 'shadow_squirrel',
      role: ENCOUNTER_ROLES.AMBUSH,
      threatLevel: 3,
      counterHint: 'Stomp during leap or slash with Stardust Burst',
      telegraphDesc: 'Tail puff and purple shadow sparks before pouncing leap',
      movementStyle: 'Rapid arboreal scamper',
      attackStyle: 'Acrobatic forward pounce',
      recoveryDesc: 'Landing balance adjustment',
      environmentalPreference: 'Canopy boughs and mossy bark platforms',
      health: 1,
      damage: 1,
      speed: 130,
      detectionRange: 320,
      attackRange: 220,
      patrolLeft,
      patrolRight,
      scoreValue: 300,
    });

    this.leapVx = 260;
    this.leapVy = -380;
    this.isLeaping = false;
    this.tailTimer = 0;
  }

  setupStates() {
    super.setupStates();

    // 1. PATROL: Fast scuttling scamper
    this.fsm.register(ENEMY_STATES.PATROL, {
      onEnter: (e) => {
        e.vx = e.facing * e.speed;
        e.isLeaping = false;
      },
      update: (e, dt, level, player) => {
        e.vx = e.facing * e.speed;

        // Turn around at patrol limits
        if (e.x <= e.patrolLeft && e.facing < 0) {
          e.facing = 1;
        } else if (e.x + e.width >= e.patrolRight && e.facing > 0) {
          e.facing = -1;
        }

        // Check for player detection
        if (player && !player.isDead) {
          const dist = Math.hypot((player.x + player.width / 2) - (e.x + e.width / 2), (player.y + player.height / 2) - (e.y + e.height / 2));
          if (dist < e.detectionRange) {
            e.fsm.setState(ENEMY_STATES.AWARE);
          }
        }
      },
    });

    // 2. AWARE / TELEGRAPH: Twitch ears, fluff shadow tail
    this.fsm.register(ENEMY_STATES.AWARE, {
      onEnter: (e) => {
        e.vx = 0;
        e.isTelegraphing = true;
        e.telegraphTimer = 0.35;
      },
      update: (e, dt, level, player) => {
        e.telegraphTimer -= dt;
        if (player) {
          e.facing = (player.x > e.x) ? 1 : -1;
        }
        if (e.telegraphTimer <= 0) {
          e.fsm.setState(ENEMY_STATES.ATTACK);
        }
      },
      onExit: (e) => {
        e.isTelegraphing = false;
      },
    });

    // 3. ATTACK: High acrobatic pounce
    this.fsm.register(ENEMY_STATES.ATTACK, {
      onEnter: (e) => {
        e.isLeaping = true;
        e.vx = e.facing * e.leapVx;
        e.vy = e.leapVy;
        e.isGrounded = false;
      },
      update: (e, dt, level, player) => {
        // Fall back to ground
        if (e.isGrounded && e.fsm.stateTime > 0.2) {
          e.fsm.setState(ENEMY_STATES.RECOVER);
        }
      },
      onExit: (e) => {
        e.isLeaping = false;
      },
    });

    // 4. RECOVER: Panting landing balance
    this.fsm.register(ENEMY_STATES.RECOVER, {
      onEnter: (e) => {
        e.vx = 0;
        e.isVulnerable = true;
        e.recoveryTimer = 0.45;
      },
      update: (e, dt, level, player) => {
        e.recoveryTimer -= dt;
        if (e.recoveryTimer <= 0) {
          e.fsm.setState(ENEMY_STATES.PATROL);
        }
      },
      onExit: (e) => {
        e.isVulnerable = false;
      },
    });
  }

  update(dt, level, player, camera) {
    this.tailTimer += dt;
    super.update(dt, level, player, camera);
  }

  stomp(player, audio) {
    return this.takeDamage(1, player.facing * 140, -180, audio);
  }
}
