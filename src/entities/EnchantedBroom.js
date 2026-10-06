import { Enemy } from './Enemy.js';
import { ENEMY_STATES } from '../ai/EnemyStateMachine.js';
import { ENCOUNTER_ROLES } from '../ai/EncounterCoordinator.js';

/**
 * ENCHANTED BROOM
 * Canonical Role: MOBILITY PRESSURE & AREA SWEEPER
 * 
 * 8 Canonical Attributes:
 * 1. ROLE: MOBILITY PRESSURE (Swift magical broom that sweeps along stone walkways)
 * 2. THREAT: Rating 3/5 (Swift lateral dash, kicks up dust clouds that push player back)
 * 3. COUNTER: Leap over sweeping rush and stomp on the straw bristles
 * 4. TELEGRAPH: Leans backward at a 45-degree angle, bristles flare with magical violet sparks (0.4s)
 * 5. MOVEMENT STYLE: Rapid rhythmic skating sweep with agile hops
 * 6. ATTACK STYLE: High-velocity sweeping charge kicking up dust waves
 * 7. RECOVERY: Upright balance wobble (0.6s)
 * 8. ENVIRONMENTAL PREFERENCE: Castle floors, gallery runways, library aisles
 */
export class EnchantedBroom extends Enemy {
  constructor(x, y, patrolLeft, patrolRight) {
    super(x, y, 40, 56, {
      name: 'Enchanted Broom',
      species: 'enchanted_broom',
      role: ENCOUNTER_ROLES.PRESSURE,
      threatLevel: 3,
      counterHint: 'Time your jump over its rapid sweeping charge and stomp the straw',
      telegraphDesc: 'Bristles flare with violet sparks and leans back',
      movementStyle: 'Rapid rhythmic sweep with hops',
      attackStyle: 'High-speed sweeping rush',
      recoveryDesc: 'Upright balance wobble',
      environmentalPreference: 'Castle halls and stone galleries',
      health: 1,
      damage: 1,
      speed: 120,
      detectionRange: 280,
      attackRange: 200,
      patrolLeft,
      patrolRight,
      scoreValue: 350,
    });

    this.sweepTimer = 0;
    this.tiltAngle = 0;
  }

  setupStates() {
    super.setupStates();

    // 1. PATROL: Sweeping back and forth
    this.fsm.register(ENEMY_STATES.PATROL, {
      onEnter: (e) => {
        e.vx = e.facing * e.speed;
      },
      update: (e, dt, level, player) => {
        e.sweepTimer += dt * 10;
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

    // 2. AWARE / TELEGRAPH: Leans back and sparks
    this.fsm.register(ENEMY_STATES.AWARE, {
      onEnter: (e) => {
        e.vx = 0;
        e.isTelegraphing = true;
        e.telegraphTimer = 0.4;
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

    // 3. ATTACK: High-speed sweep rush
    this.fsm.register(ENEMY_STATES.ATTACK, {
      onEnter: (e) => {
        e.vx = e.facing * 280;
        e.attackCommitmentTimer = 0.7;
        if (e.levelRef && e.levelRef.spawnDust) {
          e.levelRef.spawnDust(e.x + e.width / 2, e.y + e.height, 8);
        }
      },
      update: (e, dt, level, player) => {
        e.attackCommitmentTimer -= dt;
        if (e.attackCommitmentTimer <= 0 || (e.x <= e.patrolLeft && e.facing < 0) || (e.x + e.width >= e.patrolRight && e.facing > 0)) {
          e.fsm.setState(ENEMY_STATES.RECOVER);
        }
      },
      onExit: (e) => {
        e.vx = 0;
      },
    });

    // 4. RECOVER: Wobbles in place
    this.fsm.register(ENEMY_STATES.RECOVER, {
      onEnter: (e) => {
        e.vx = 0;
        e.isVulnerable = true;
        e.recoveryTimer = 0.6;
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
    return this.takeDamage(1, player.facing * 140, -180, audio);
  }
}
