import { Enemy } from './Enemy.js';
import { ENEMY_STATES } from '../ai/EnemyStateMachine.js';
import { ENCOUNTER_ROLES } from '../ai/EncounterCoordinator.js';

/**
 * DOOR GOBLIN (MIMIC DOOR)
 * Canonical Role: AMBUSH & SPATIAL DECEPTION
 * 
 * 8 Canonical Attributes:
 * 1. ROLE: AMBUSH (Disguises as an unassuming arched wooden door on the corridor wall)
 * 2. THREAT: Rating 4/5 (Surprise factor, sudden forward snap-jaw lunge)
 * 3. COUNTER: Bait the chomp lunge, then stomp its hinge head or Stardust Slash while dizzy
 * 4. TELEGRAPH: Keyhole glows fiery red and door handle rattles vigorously (0.45s)
 * 5. MOVEMENT STYLE: Dormant disguise into sudden bipedal snap sprint
 * 6. ATTACK STYLE: Hinged jaw chomp lunge
 * 7. RECOVERY: Dazed rattle with tongue drooping out (1.1s)
 * 8. ENVIRONMENTAL PREFERENCE: Castle corridors, vestibule alcoves, between real portal doors
 */
export class DoorGoblin extends Enemy {
  constructor(x, y, patrolLeft, patrolRight) {
    super(x, y, 48, 64, {
      name: 'Door Goblin',
      species: 'door_goblin',
      role: ENCOUNTER_ROLES.AMBUSH,
      threatLevel: 4,
      counterHint: 'Watch for the rattling keyhole; dodge the snap lunge and punish the dazed recovery',
      telegraphDesc: 'Keyhole glints fiery crimson and door handle chatters',
      movementStyle: 'Disguised wall mimic into spring snap',
      attackStyle: 'Hinged jaw chomp lunge',
      recoveryDesc: 'Dazed rattle with mouth agape',
      environmentalPreference: 'Castle corridor walls and alcoves',
      health: 2,
      damage: 1,
      speed: 160,
      detectionRange: 220,
      attackRange: 160,
      patrolLeft,
      patrolRight,
      scoreValue: 400,
    });

    this.isDisguised = true;
    this.isChomping = false;
    this.rattleTimer = 0;
    this.chatterTimer = 0;
  }

  setupStates() {
    super.setupStates();

    // 1. IDLE / DISGUISED: Looks like an ordinary door
    this.fsm.register(ENEMY_STATES.IDLE, {
      onEnter: (e) => {
        e.isDisguised = true;
        e.vx = 0;
      },
      update: (e, dt, level, player) => {
        e.vx = 0;
        if (player && !player.isDead) {
          const dist = Math.hypot((player.x + player.width / 2) - (e.x + e.width / 2), (player.y + player.height / 2) - (e.y + e.height / 2));
          if (dist < e.detectionRange) {
            e.fsm.setState(ENEMY_STATES.AWARE);
          }
        }
      },
    });

    // 2. AWARE / TELEGRAPH: Rattles and keyhole glows
    this.fsm.register(ENEMY_STATES.AWARE, {
      onEnter: (e) => {
        e.isTelegraphing = true;
        e.telegraphTimer = 0.45;
        e.vx = 0;
      },
      update: (e, dt, level, player) => {
        e.telegraphTimer -= dt;
        e.rattleTimer += dt * 30;
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

    // 3. ATTACK: Reveals sharp wooden teeth & lunges
    this.fsm.register(ENEMY_STATES.ATTACK, {
      onEnter: (e) => {
        e.isDisguised = false;
        e.isChomping = true;
        e.vx = e.facing * 340;
        e.attackCommitmentTimer = 0.55;
        if (e.levelRef && e.levelRef.spawnDust) {
          e.levelRef.spawnDust(e.x + e.width / 2, e.y + e.height, 6);
        }
      },
      update: (e, dt, level, player) => {
        e.attackCommitmentTimer -= dt;
        if (e.attackCommitmentTimer <= 0) {
          e.fsm.setState(ENEMY_STATES.RECOVER);
        }
      },
      onExit: (e) => {
        e.isChomping = false;
        e.vx = 0;
      },
    });

    // 4. RECOVER: Dazed, tongue out, vulnerable
    this.fsm.register(ENEMY_STATES.RECOVER, {
      onEnter: (e) => {
        e.vx = 0;
        e.isVulnerable = true;
        e.recoveryTimer = 1.1;
      },
      update: (e, dt, level, player) => {
        e.recoveryTimer -= dt;
        if (e.recoveryTimer <= 0) {
          e.fsm.setState(ENEMY_STATES.PATROL);
        }
      },
      onExit: (e) => {
        e.isVulnerable = false;
        e.isDisguised = true;
      },
    });

    // 5. PATROL: Scuttles around seeking a new wall position
    this.fsm.register(ENEMY_STATES.PATROL, {
      onEnter: (e) => {
        e.isDisguised = false;
        e.vx = e.facing * (e.speed * 0.7);
      },
      update: (e, dt, level, player) => {
        e.vx = e.facing * (e.speed * 0.7);
        if (e.x <= e.patrolLeft && e.facing < 0) {
          e.facing = 1;
        } else if (e.x + e.width >= e.patrolRight && e.facing > 0) {
          e.facing = -1;
        }
        if (player && !player.isDead) {
          const dist = Math.abs((player.x + player.width / 2) - (e.x + e.width / 2));
          if (dist < e.detectionRange) {
            e.fsm.setState(ENEMY_STATES.AWARE);
          }
        }
      },
    });
  }

  stomp(player, audio) {
    if (this.isChomping) {
      // Stomping right into the open snapping jaws hurts the player!
      player.hurt();
      return false;
    }
    return this.takeDamage(1, player.facing * 180, -220, audio);
  }
}
