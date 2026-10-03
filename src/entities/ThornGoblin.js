import { Enemy } from './Enemy.js';
import { ENEMY_STATES } from '../ai/EnemyStateMachine.js';
import { ENCOUNTER_ROLES } from '../ai/EncounterCoordinator.js';

/**
 * THORN GOBLIN
 * Canonical Role: ARMORED DEFENSIVE CONTROL & ROLLING BRAMBLE JUGGERNAUT
 * 
 * 8 Canonical Attributes:
 * 1. ROLE: ARMORED CONTROL (Carries spiky bramble shield, curls into rolling ball)
 * 2. THREAT: Rating 4/5 (2 HP, frontal shield deflection, rolling hazard charge)
 * 3. COUNTER: Jump over bramble ball, then stomp or slash from behind during RECOVER
 * 4. TELEGRAPH: Raises thorn shield, stomps ground, shield glints crimson (0.5s)
 * 5. MOVEMENT STYLE: Heavy armored waddle with spiky roll
 * 6. ATTACK STYLE: Rolling bramble charge
 * 7. RECOVERY: Stunned/dizzy panting state with shield down (1.3s)
 * 8. ENVIRONMENTAL PREFERENCE: Forest paths, briar bridges, narrow corridors
 */
export class ThornGoblin extends Enemy {
  constructor(x, y, patrolLeft, patrolRight) {
    super(x, y, 64, 56, {
      name: 'Thorn Goblin',
      species: 'thorn_goblin',
      role: ENCOUNTER_ROLES.CONTROL,
      threatLevel: 4,
      counterHint: 'Avoid frontal shield; leap over roll and punish dizzy recovery',
      telegraphDesc: 'Raises thorn shield and glints crimson',
      movementStyle: 'Heavy armored waddle',
      attackStyle: 'Rolling bramble charge',
      recoveryDesc: 'Dizzy uncurled state with shield on ground',
      environmentalPreference: 'Briar bridges and overgrown paths',
      health: 2,
      damage: 1,
      speed: 65,
      detectionRange: 320,
      attackRange: 240,
      patrolLeft,
      patrolRight,
      scoreValue: 450,
    });

    this.isRolling = false;
    this.rollSpeed = 310;
    this.rollDuration = 1.1;
  }

  setupStates() {
    super.setupStates();

    // 1. PATROL: Pacing with forward thorn shield
    this.fsm.register(ENEMY_STATES.PATROL, {
      onEnter: (e) => {
        e.vx = e.facing * e.speed;
        e.isRolling = false;
        e.isVulnerable = false;
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
          if (dist < e.detectionRange && yDist < 120) {
            e.fsm.setState(ENEMY_STATES.AWARE);
          }
        }
      },
    });

    // 2. AWARE / TELEGRAPH: Slams shield down
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

    // 3. ATTACK: Curls into rolling bramble ball
    this.fsm.register(ENEMY_STATES.ATTACK, {
      onEnter: (e) => {
        e.isRolling = true;
        e.vx = e.facing * e.rollSpeed;
        e.attackCommitmentTimer = e.rollDuration;
      },
      update: (e, dt, level, player) => {
        e.vx = e.facing * e.rollSpeed;
        e.attackCommitmentTimer -= dt;

        // Check if reached patrol boundary or timeout
        if ((e.x <= e.patrolLeft && e.facing < 0) || (e.x + e.width >= e.patrolRight && e.facing > 0) || e.attackCommitmentTimer <= 0) {
          e.fsm.setState(ENEMY_STATES.RECOVER);
        }
      },
      onExit: (e) => {
        e.isRolling = false;
      },
    });

    // 4. RECOVER: Uncurls, dizzy and exhausted, shield resting on floor!
    this.fsm.register(ENEMY_STATES.RECOVER, {
      onEnter: (e) => {
        e.vx = 0;
        e.isVulnerable = true;
        e.recoveryTimer = 1.3;
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
    if (this.isRolling) {
      // Stomping a rolling thorn ball hurts the player!
      player.hurt();
      return false;
    }
    return this.takeDamage(1, player.facing * 160, -220, audio);
  }
}
