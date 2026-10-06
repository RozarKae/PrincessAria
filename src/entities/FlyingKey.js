import { Enemy } from './Enemy.js';
import { ENEMY_STATES } from '../ai/EnemyStateMachine.js';
import { ENCOUNTER_ROLES } from '../ai/EncounterCoordinator.js';

/**
 * FLYING KEY
 * Canonical Role: AERIAL HARASSER & ELUSIVE COLLECTIBLE HAZARD
 * 
 * 8 Canonical Attributes:
 * 1. ROLE: AERIAL HARASSER (Winged golden key fluttering in figure-eight loops)
 * 2. THREAT: Rating 3/5 (Evasive trajectory, releases sparkling spark cascades)
 * 3. COUNTER: Jump off chains or bounce trampolines to intercept; rewards extra shards!
 * 4. TELEGRAPH: Wings flutter with high-frequency golden sparkles before swooping
 * 5. MOVEMENT STYLE: Smooth figure-eight and sinusoidal loop flying
 * 6. ATTACK STYLE: Sparkling downward starburst
 * 7. RECOVERY: Upward fluttering glide
 * 8. ENVIRONMENTAL PREFERENCE: High vaulted corridors, library stacks, above spike pits
 */
export class FlyingKey extends Enemy {
  constructor(x, y, options = {}) {
    super(x, y, 42, 42, {
      name: 'Flying Key',
      species: 'flying_key',
      role: ENCOUNTER_ROLES.HARASSMENT,
      threatLevel: 3,
      counterHint: 'Intercept from above; catching it unlocks bonus Royal Shards',
      telegraphDesc: 'Wings flash brilliant gold and emit high-pitched chime',
      movementStyle: 'Sinusoidal aerial figure-eight',
      attackStyle: 'Golden sparkle drop',
      recoveryDesc: 'Ascending hover glide',
      environmentalPreference: 'High vaulted ceilings and open chasms',
      health: 1,
      damage: 1,
      speed: 75,
      isFlying: true,
      gravity: 0,
      detectionRange: 320,
      scoreValue: 450,
    });

    this.baseX = x;
    this.baseY = y;
    this.amplitudeX = options.amplitudeX || 120;
    this.amplitudeY = options.amplitudeY || 45;
    this.frequency = options.frequency || 2.4;
    this.timer = Math.random() * Math.PI * 2;
    this.dropTimer = 2.2;
    this.wingTimer = 0;
  }

  setupStates() {
    super.setupStates();

    // 1. PATROL: Figure-eight flight
    this.fsm.register(ENEMY_STATES.PATROL, {
      onEnter: (e) => {},
      update: (e, dt, level, player) => {
        e.timer += dt * e.frequency;
        e.x = e.baseX + Math.sin(e.timer) * e.amplitudeX;
        e.y = e.baseY + Math.sin(e.timer * 2) * e.amplitudeY;
        e.wingTimer += dt * 18;

        if (player && !player.isDead) {
          const xDist = Math.abs((player.x + player.width / 2) - (e.x + e.width / 2));
          const yDist = player.y - e.y;
          if (xDist < 120 && yDist > 20 && yDist < 320) {
            e.dropTimer -= dt;
            if (e.dropTimer <= 0) {
              e.dropTimer = 2.8;
              e.fsm.setState(ENEMY_STATES.AWARE);
            }
          }
        }
      },
    });

    // 2. AWARE / TELEGRAPH: Wings shimmer with intense gold
    this.fsm.register(ENEMY_STATES.AWARE, {
      onEnter: (e) => {
        e.isTelegraphing = true;
        e.telegraphTimer = 0.4;
      },
      update: (e, dt, level, player) => {
        e.telegraphTimer -= dt;
        e.wingTimer += dt * 32;
        if (e.telegraphTimer <= 0) {
          e.fsm.setState(ENEMY_STATES.ATTACK);
        }
      },
      onExit: (e) => {
        e.isTelegraphing = false;
      },
    });

    // 3. ATTACK: Drops a glittering spark burst
    this.fsm.register(ENEMY_STATES.ATTACK, {
      onEnter: (e) => {
        if (e.levelRef && e.levelRef.spawnBurst) {
          e.levelRef.spawnBurst(e.x + e.width / 2, e.y + e.height, 10, '#fbbf24');
        }
      },
      update: (e, dt, level, player) => {
        if (e.fsm.stateTime > 0.3) {
          e.fsm.setState(ENEMY_STATES.RECOVER);
        }
      },
    });

    // 4. RECOVER: Glides upward safely
    this.fsm.register(ENEMY_STATES.RECOVER, {
      onEnter: (e) => {
        e.recoveryTimer = 0.5;
      },
      update: (e, dt, level, player) => {
        e.recoveryTimer -= dt;
        if (e.recoveryTimer <= 0) {
          e.fsm.setState(ENEMY_STATES.PATROL);
        }
      },
    });
  }

  takeDamage(amount, knockbackX = 0, knockbackY = 0, audio = null) {
    const defeated = super.takeDamage(amount, knockbackX, knockbackY, audio);
    if (defeated && this.levelRef) {
      // Award extra royal sparkles & coins when catching a flying key!
      if (this.levelRef.spawnSparkles) {
        this.levelRef.spawnSparkles(this.x + this.width / 2, this.y + this.height / 2, 20);
      }
      if (this.levelRef.gameState) {
        this.levelRef.gameState.addCoins(2);
      }
    }
    return defeated;
  }

  stomp(player, audio) {
    return this.takeDamage(1, player.facing * 140, -180, audio);
  }
}
