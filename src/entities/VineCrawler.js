import { Enemy } from './Enemy.js';
import { ENEMY_STATES } from '../ai/EnemyStateMachine.js';
import { ENCOUNTER_ROLES } from '../ai/EncounterCoordinator.js';

/**
 * VINE CRAWLER
 * Canonical Role: ZONE DENIAL & CREEPING PATROL
 * 
 * 8 Canonical Attributes:
 * 1. ROLE: ZONE DENIAL (Creeps along vines and bark, periodically expels spore bursts)
 * 2. THREAT: Rating 2/5 (Steady movement, spore area denial)
 * 3. COUNTER: Direct Stomp from above or Stardust Slash
 * 4. TELEGRAPH: Swells glowing purple bioluminescent bulb (0.4s)
 * 5. MOVEMENT STYLE: Multilegged undulating crawl
 * 6. ATTACK STYLE: Radial spore puff
 * 7. RECOVERY: Deflated bulb resting state (0.5s)
 * 8. ENVIRONMENTAL PREFERENCE: Hanging vines, narrow log ledges, vertical trunks
 */
export class VineCrawler extends Enemy {
  constructor(x, y, options = {}) {
    const pLeft = options.patrolLeft !== undefined ? options.patrolLeft : x - 120;
    const pRight = options.patrolRight !== undefined ? options.patrolRight : x + 120;

    super(x, y, 52, 38, {
      name: 'Vine Crawler',
      species: 'vine_crawler',
      role: ENCOUNTER_ROLES.ZONE_DENIAL,
      threatLevel: 2,
      counterHint: 'Stomp from above or strike with Stardust Slash',
      telegraphDesc: 'Purple bioluminescent spore sac expands and glows',
      movementStyle: 'Undulating multilegged creeping',
      attackStyle: 'Radial spore puff',
      recoveryDesc: 'Spore sac contraction pause',
      environmentalPreference: 'Narrow branches and vertical vines',
      health: 1,
      damage: 1,
      speed: 48,
      detectionRange: 260,
      attackRange: 160,
      patrolLeft: pLeft,
      patrolRight: pRight,
      scoreValue: 300,
    });

    this.sporeTimer = 0;
    this.sporeCooldown = 3.5;
  }

  setupStates() {
    super.setupStates();

    // 1. PATROL: Creeping along platform
    this.fsm.register(ENEMY_STATES.PATROL, {
      onEnter: (e) => {
        e.vx = e.facing * e.speed;
      },
      update: (e, dt, level, player) => {
        e.vx = e.facing * e.speed;

        if (e.x <= e.patrolLeft && e.facing < 0) {
          e.facing = 1;
        } else if (e.x + e.width >= e.patrolRight && e.facing > 0) {
          e.facing = -1;
        }

        // Periodic spore puff when player is nearby
        if (player && !player.isDead) {
          const dist = Math.hypot((player.x + player.width / 2) - (e.x + e.width / 2), (player.y + player.height / 2) - (e.y + e.height / 2));
          if (dist < e.detectionRange) {
            e.fsm.setState(ENEMY_STATES.AWARE);
          }
        }
      },
    });

    // 2. AWARE / TELEGRAPH: Bulb expands and pulses with purple spores
    this.fsm.register(ENEMY_STATES.AWARE, {
      onEnter: (e) => {
        e.vx = 0;
        e.isTelegraphing = true;
        e.telegraphTimer = 0.45;
      },
      update: (e, dt, level, player) => {
        e.telegraphTimer -= dt;
        if (e.telegraphTimer <= 0) {
          e.fsm.setState(ENEMY_STATES.ATTACK);
        }
      },
      onExit: (e) => {
        e.isTelegraphing = false;
      },
    });

    // 3. ATTACK: Spore burst expulsion
    this.fsm.register(ENEMY_STATES.ATTACK, {
      onEnter: (e) => {
        e.vx = 0;
        // Spawn spore burst particles
        if (level && level.spawnBurst) {
          level.spawnBurst(e.x + e.width / 2, e.y + 10, 10, '#c084fc');
        }
      },
      update: (e, dt, level, player) => {
        if (e.fsm.stateTime > 0.4) {
          e.fsm.setState(ENEMY_STATES.RECOVER);
        }
      },
    });

    // 4. RECOVER: Bulb deflates
    this.fsm.register(ENEMY_STATES.RECOVER, {
      onEnter: (e) => {
        e.vx = 0;
        e.recoveryTimer = 0.6;
      },
      update: (e, dt, level, player) => {
        e.recoveryTimer -= dt;
        if (e.recoveryTimer <= 0) {
          e.fsm.setState(ENEMY_STATES.PATROL);
        }
      },
    });
  }

  stomp(player, audio) {
    return this.takeDamage(1, player.facing * 140, -180, audio);
  }
}
