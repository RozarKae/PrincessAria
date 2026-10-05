import { Enemy } from './Enemy.js';
import { ENEMY_STATES } from '../ai/EnemyStateMachine.js';
import { ENCOUNTER_ROLES } from '../ai/EncounterCoordinator.js';

/**
 * SPORE BOMBER
 * Canonical Role: AERIAL HARASSER & CANOPY BOMBARDMENT
 * 
 * 8 Canonical Attributes:
 * 1. ROLE: AERIAL HARASSER (Floats high above, drops drifting spore hazards)
 * 2. THREAT: Rating 3/5 (Vertical hazard trajectory, hard to reach without bouncy mushrooms)
 * 3. COUNTER: Launch off Bouncy Mushrooms to intercept with Royal Stardust Burst
 * 4. TELEGRAPH: Underside gills glow bright cyan and pulse rapidly (0.5s)
 * 5. MOVEMENT STYLE: Sinusoidal airborne drifting
 * 6. ATTACK STYLE: Gravity-fed spore cluster drop
 * 7. RECOVERY: Upward buoyant recoil
 * 8. ENVIRONMENTAL PREFERENCE: High canopies, open chasms, above bouncy mushroom sequences
 */
export class SporeBomber extends Enemy {
  constructor(x, y, options = {}) {
    super(x, y, 48, 48, {
      name: 'Spore Bomber',
      species: 'spore_bomber',
      role: ENCOUNTER_ROLES.HARASSMENT,
      threatLevel: 3,
      counterHint: 'Use Bouncy Mushrooms to reach high altitude and strike with Stardust Slash',
      telegraphDesc: 'Underside gills pulsate with intense cyan light',
      movementStyle: 'Sinusoidal aerial drift',
      attackStyle: 'Dropping drifting spore hazard',
      recoveryDesc: 'Buoyant ascent pause',
      environmentalPreference: 'High canopy and chasm ceilings',
      health: 1,
      damage: 1,
      speed: 45,
      isFlying: true,
      gravity: 0,
      detectionRange: 340,
      scoreValue: 350,
    });

    this.baseY = y;
    this.amplitude = options.amplitude || 42;
    this.frequency = options.frequency || 2.0;
    this.timer = Math.random() * Math.PI * 2;
    this.dropTimer = 2.8;
  }

  setupStates() {
    super.setupStates();

    // 1. PATROL: Sine wave drift in the canopy
    this.fsm.register(ENEMY_STATES.PATROL, {
      onEnter: (e) => {},
      update: (e, dt, level, player) => {
        e.timer += dt * e.frequency;
        e.y = e.baseY + Math.sin(e.timer) * e.amplitude;
        e.vx = e.facing * e.speed;

        if (e.x <= e.patrolLeft && e.facing < 0) {
          e.facing = 1;
        } else if (e.x + e.width >= e.patrolRight && e.facing > 0) {
          e.facing = -1;
        }

        // Check if player is directly underneath
        if (player && !player.isDead) {
          const xDist = Math.abs((player.x + player.width / 2) - (e.x + e.width / 2));
          const yDist = (player.y - e.y);
          if (xDist < 140 && yDist > 40 && yDist < 360) {
            e.dropTimer -= dt;
            if (e.dropTimer <= 0) {
              e.dropTimer = 3.2;
              e.fsm.setState(ENEMY_STATES.AWARE);
            }
          }
        }
      },
    });

    // 2. AWARE / TELEGRAPH: Gills pulse brightly
    this.fsm.register(ENEMY_STATES.AWARE, {
      onEnter: (e) => {
        e.isTelegraphing = true;
        e.telegraphTimer = 0.5;
        e.vx *= 0.3;
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

    // 3. ATTACK: Release falling spore cluster
    this.fsm.register(ENEMY_STATES.ATTACK, {
      onEnter: (e) => {
        if (e.levelRef && e.levelRef.spawnBurst) {
          e.levelRef.spawnBurst(e.x + e.width / 2, e.y + e.height - 4, 8, '#38bdf8');
        }
      },
      update: (e, dt, level, player) => {
        if (e.fsm.stateTime > 0.3) {
          e.fsm.setState(ENEMY_STATES.RECOVER);
        }
      },
    });

    // 4. RECOVER: Recoil slightly upward
    this.fsm.register(ENEMY_STATES.RECOVER, {
      onEnter: (e) => {
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
    return this.takeDamage(1, player.facing * 120, -160, audio);
  }
}
