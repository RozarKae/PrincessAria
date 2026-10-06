import { Enemy } from './Enemy.js';
import { ENEMY_STATES } from '../ai/EnemyStateMachine.js';
import { ENCOUNTER_ROLES } from '../ai/EncounterCoordinator.js';

/**
 * CASTLE KNIGHT
 * Canonical Role: ARMORED CONTROL & DEFENSIVE PHALANX
 * 
 * 8 Canonical Attributes:
 * 1. ROLE: ARMORED CONTROL (Heavy steel plate armor with heater shield and halberd)
 * 2. THREAT: Rating 4/5 (Deflects frontal melee attacks, long-reach halberd thrust)
 * 3. COUNTER: Vault over with double jump and strike the unarmored rear cape
 * 4. TELEGRAPH: Braces shield, eyes flash ruby red, halberd glints (0.5s)
 * 5. MOVEMENT STYLE: Heavy marching tread
 * 6. ATTACK STYLE: Lunging halberd spear thrust
 * 7. RECOVERY: Exhausted halberd pull-back (1.2s)
 * 8. ENVIRONMENTAL PREFERENCE: Castle battlements, grand doorways, gatehouses
 */
export class CastleKnight extends Enemy {
  constructor(x, y, patrolLeft, patrolRight) {
    super(x, y, 56, 68, {
      name: 'Castle Knight',
      species: 'castle_knight',
      role: ENCOUNTER_ROLES.CONTROL,
      threatLevel: 4,
      counterHint: 'Frontal attacks bounce off the heater shield; leap over and strike from behind',
      telegraphDesc: 'Braces shield and visor glints crimson',
      movementStyle: 'Heavy armored march',
      attackStyle: 'Halberd spear thrust',
      recoveryDesc: 'Halberd dislodge pause',
      environmentalPreference: 'Battlements and archway thresholds',
      health: 2,
      damage: 1,
      speed: 60,
      detectionRange: 280,
      attackRange: 200,
      patrolLeft,
      patrolRight,
      scoreValue: 500,
    });

    this.isThrusting = false;
  }

  setupStates() {
    super.setupStates();

    // 1. PATROL: Pacing with forward shield
    this.fsm.register(ENEMY_STATES.PATROL, {
      onEnter: (e) => {
        e.vx = e.facing * e.speed;
        e.isVulnerable = false;
        e.isThrusting = false;
      },
      update: (e, dt, level, player) => {
        e.vx = e.facing * e.speed;

        if (e.x <= e.patrolLeft && e.facing < 0) {
          e.facing = 1;
        } else if (e.x + e.width >= e.patrolRight && e.facing > 0) {
          e.facing = -1;
        }

        if (player && !player.isDead) {
          const dist = Math.abs((player.x + player.width / 2) - (e.x + e.width / 2));
          const yDist = Math.abs((player.y + player.height / 2) - (e.y + e.height / 2));
          if (dist < e.detectionRange && yDist < 100) {
            e.fsm.setState(ENEMY_STATES.AWARE);
          }
        }
      },
    });

    // 2. AWARE / TELEGRAPH: Braces shield, raises halberd
    this.fsm.register(ENEMY_STATES.AWARE, {
      onEnter: (e) => {
        e.vx = 0;
        e.isTelegraphing = true;
        e.telegraphTimer = 0.5;
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

    // 3. ATTACK: Halberd thrust forward
    this.fsm.register(ENEMY_STATES.ATTACK, {
      onEnter: (e) => {
        e.isThrusting = true;
        e.vx = e.facing * 180;
        e.attackCommitmentTimer = 0.6;
      },
      update: (e, dt, level, player) => {
        e.attackCommitmentTimer -= dt;
        if (e.attackCommitmentTimer <= 0) {
          e.fsm.setState(ENEMY_STATES.RECOVER);
        }
      },
      onExit: (e) => {
        e.isThrusting = false;
        e.vx = 0;
      },
    });

    // 4. RECOVER: Panting, halberd down
    this.fsm.register(ENEMY_STATES.RECOVER, {
      onEnter: (e) => {
        e.vx = 0;
        e.isVulnerable = true;
        e.recoveryTimer = 1.2;
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

  stomp(player, audio) {
    // Spiky helmet visor: stomping from above bounces player and deals 1 damage
    player.bounceFromEnemy();
    return this.takeDamage(1, player.facing * 160, -200, audio);
  }
}
