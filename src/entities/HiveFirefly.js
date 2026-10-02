import { Enemy } from './Enemy.js';
import { ENEMY_STATES } from '../ai/EnemyStateMachine.js';
import { ENCOUNTER_ROLES } from '../ai/EncounterCoordinator.js';
import { assetManager } from '../renderer/AssetManager.js';

/**
 * HIVE FIREFLY
 * Canonical Role: AIR PRESSURE & AMBUSH PREDATOR
 * 
 * 8 Canonical Attributes:
 * 1. ROLE: AMBUSH (Lurks at high cruising altitude, divebombs when player is occupied)
 * 2. THREAT: Rating 3/5 (1 DMG, 450px/s parabolic dive, intercepts jump trajectories)
 * 3. COUNTER: Sidestep or bait dive into ground, then punish during upward recovery
 * 4. TELEGRAPH: Abdomen lantern blazes radiant red with high-pitch flare (0.45s)
 * 5. MOVEMENT STYLE: High cruising hover
 * 6. ATTACK STYLE: Parabolic dive intercept leading player velocity
 * 7. RECOVERY: Upward pullout recovery (0.6s) with dampened speed
 * 8. ENVIRONMENTAL PREFERENCE: Upper canopy boughs, open airspace above terraces
 */
export class HiveFirefly extends Enemy {
  constructor(x, y, options = {}) {
    super(x, y, 54, 54, {
      name: 'Hive Firefly',
      species: 'firefly',
      role: ENCOUNTER_ROLES.AMBUSH,
      threatLevel: 3,
      counterHint: 'Bait dive, dodge sideways, and punish during upward recovery',
      telegraphDesc: 'Abdomen lantern blazes radiant red with warning sparks',
      movementStyle: 'High cruising hover',
      attackStyle: 'Committed parabolic dive intercept',
      recoveryDesc: 'Upward pullout swooping recovery',
      environmentalPreference: 'High canopy airspace and open sky above terraces',
      health: 1,
      damage: 1,
      speed: 110,
      isFlying: true,
      gravity: 0,
      detectionRange: 360,
      attackRange: 270,
      scoreValue: 300,
      ...options,
    });

    this.cruisingAltitude = y;
    this.hoverTimer = Math.random() * Math.PI * 2;
    this.diveTargetX = x;
    this.diveTargetY = y;
    this.wingBuzzTimer = 0;
  }

  setupStates() {
    super.setupStates();

    // 1. PATROL: Gentle hovering wave at cruising altitude
    this.fsm.register(ENEMY_STATES.PATROL, {
      update: (e, dt, level, player) => {
        e.hoverTimer += dt * 3;
        e.y = e.cruisingAltitude + Math.sin(e.hoverTimer) * 22;

        e.vx = e.facing * 45;
        if (e.x >= e.patrolRight) {
          e.facing = -1;
          e.dir = -1;
        } else if (e.x <= e.patrolLeft) {
          e.facing = 1;
          e.dir = 1;
        }

        e.evaluateSensoryTransitions(level, player);
      },
    });

    // 2. AWARE / TELEGRAPH: Scans player vector, calculates predictive intercept
    this.fsm.register(ENEMY_STATES.AWARE, {
      onEnter: (e) => {
        e.vx = 0;
        e.vy = -30; // Brief anticipation lift
        e.isTelegraphing = true;
        e.telegraphTimer = 0.45;
        e.scaleX = 1.25;
        e.scaleY = 1.25;

        if (e.coordinator && e.target) {
          e.coordinator.broadcastAlert(e, e.target, e.alertRadius);
        } else {
          e.notifyNearbyAllies(e.levelRef);
        }
      },
      update: (e, dt, level, player) => {
        e.telegraphTimer -= dt;
        if (player) {
          e.faceTarget(player);
          const predicted = e.predictTargetPosition(player, 0.4);
          e.diveTargetX = predicted.x;
          e.diveTargetY = Math.min(predicted.y, 880);
        }
        if (e.telegraphTimer <= 0) {
          if (e.perception && e.perception.hasDirectSight) {
            e.fsm.setState(ENEMY_STATES.CHASE);
          } else {
            e.fsm.setState(ENEMY_STATES.INVESTIGATE);
          }
        }
      },
      onExit: (e) => {
        e.isTelegraphing = false;
      },
    });

    // 3. CHASE: Stalks from high altitude, aligning dive angle
    this.fsm.register(ENEMY_STATES.CHASE, {
      update: (e, dt, level, player) => {
        if (!player || player.isDead) {
          e.fsm.setState(ENEMY_STATES.RETREAT);
          return;
        }

        if (e.perception && !e.perception.hasDirectSight) {
          e.fsm.setState(ENEMY_STATES.INVESTIGATE);
          return;
        }

        e.faceTarget(player);

        // Keep cruising altitude while positioning horizontally
        const targetX = player.x + player.width * 0.5;
        const dx = targetX - (e.x + e.width * 0.5);
        if (Math.abs(dx) > 60) {
          e.vx = Math.sign(dx) * e.speed;
        } else {
          e.vx = 0;
        }

        const dy = e.cruisingAltitude - e.y;
        e.vy = dy * 2;

        const dist = Math.hypot(dx, player.y - e.y);

        if (dist <= e.attackRange) {
          const tokenGranted = e.coordinator ? e.coordinator.requestAttackToken(e, 'harasser') : true;
          if (tokenGranted) {
            e.fsm.setState(ENEMY_STATES.ATTACK);
            return;
          } else {
            e.fsm.setState(ENEMY_STATES.POSITION);
            return;
          }
        }
      },
    });

    // 4. ATTACK: Committed Parabolic Dive Intercept!
    this.fsm.register(ENEMY_STATES.ATTACK, {
      onEnter: (e) => {
        const dx = e.diveTargetX - (e.x + e.width * 0.5);
        const dy = e.diveTargetY - (e.y + e.height * 0.5);
        const dist = Math.hypot(dx, dy) || 1;
        const diveSpeed = 440;

        e.attackDir = Math.sign(dx) || e.facing;
        e.vx = (dx / dist) * diveSpeed;
        e.vy = (dy / dist) * diveSpeed;
        e.scaleX = 1.35;
        e.scaleY = 0.8;
      },
      update: (e, dt, level, player) => {
        // Anti-Stomp Evasion: Jinks if player stomps directly mid-dive
        if (player && e.checkAntiStompReflex(player, dt)) {
          e.vx = (player.x > e.x ? -1 : 1) * 280;
          e.vy = -180;
          e.fsm.setState(ENEMY_STATES.RECOVER);
          return;
        }

        if (e.fsm.stateTime > 0.65 || e.y >= e.diveTargetY + 30) {
          e.fsm.setState(ENEMY_STATES.RECOVER);
        }
      },
      onExit: (e) => {
        if (e.coordinator) {
          e.coordinator.releaseAttackToken(e);
        }
      },
    });

    // 5. RECOVER: Pullout swoop, energy depleted, vulnerable!
    this.fsm.register(ENEMY_STATES.RECOVER, {
      onEnter: (e) => {
        e.isVulnerable = true;
        e.recoveryTimer = 0.65;
        e.scaleX = 0.9;
        e.scaleY = 1.2;
      },
      update: (e, dt) => {
        e.recoveryTimer -= dt;
        e.vy = -200; // Pulling up
        e.vx *= 0.95;

        if (e.recoveryTimer <= 0) {
          e.isVulnerable = false;
          e.fsm.setState(ENEMY_STATES.RETREAT);
        }
      },
      onExit: (e) => {
        e.isVulnerable = false;
      },
    });

    // 6. RETREAT: Returns to cruising altitude
    this.fsm.register(ENEMY_STATES.RETREAT, {
      update: (e, dt) => {
        const dy = e.cruisingAltitude - e.y;
        e.vy = -210;
        e.vx *= 0.96;

        if (Math.abs(dy) < 15 || e.y <= e.cruisingAltitude) {
          e.y = e.cruisingAltitude;
          e.fsm.setState(ENEMY_STATES.PATROL);
        }
      },
    });

    // 7. HURT
    this.fsm.register(ENEMY_STATES.HURT, {
      onEnter: (e) => {
        e.flashWhiteTimer = 0.2;
      },
      update: (e, dt) => {
        if (e.fsm.stateTime > 0.25) {
          e.fsm.setState(ENEMY_STATES.RECOVER);
        }
      },
    });

    // 8. DEAD
    this.fsm.register(ENEMY_STATES.DEAD, {
      onEnter: (e) => {
        e.isDead = true;
        e.vx = 0;
        e.vy = 0;
        if (e.coordinator) e.coordinator.releaseAttackToken(e);
      },
      update: (e, dt) => {
        e.defeatTimer += dt;
      },
    });
  }

  update(dt, level, player, camera) {
    if (this.isDead) {
      this.defeatTimer += dt;
      return;
    }
    this.wingBuzzTimer += dt * 35;
    super.update(dt, level, player, camera);
  }

  stomp(player, audio) {
    this.takeDamage(1, 0, 0, audio);
  }

  draw(ctx) {
    if (this.isDead && this.defeatTimer > this.defeatDuration) return;

    ctx.save();
    const centerX = this.x + this.width * 0.5;
    const centerY = this.y + this.height * 0.5;

    ctx.translate(centerX, centerY);
    ctx.scale(this.facing * this.scaleX, this.scaleY);

    if (this.isDead) {
      const fade = Math.max(0, 1 - this.defeatTimer / this.defeatDuration);
      ctx.globalAlpha = fade;
      ctx.scale(1 + (this.defeatTimer / this.defeatDuration) * 0.7, 1 + (this.defeatTimer / this.defeatDuration) * 0.7);
    }

    if (this.flashWhiteTimer > 0) {
      ctx.filter = 'brightness(2.4)';
    }

    const fireflyImg = assetManager.getImage('worlds/honeywood/enemies/hive_firefly');
    if (fireflyImg && fireflyImg.complete) {
      ctx.drawImage(fireflyImg, -this.width * 0.5 - 8, -this.height * 0.5 - 8, this.width + 16, this.height + 16);
    } else {
      const r = this.width * 0.5;

      // Glowing Lantern
      const lanternColor = this.fsm.is(ENEMY_STATES.AWARE) || this.fsm.is(ENEMY_STATES.ATTACK) ? '#ef4444' : '#fbbf24';
      ctx.fillStyle = lanternColor;
      ctx.beginPath();
      ctx.arc(-r * 0.35, r * 0.15, 12, 0, Math.PI * 2);
      ctx.fill();

      // Body & Eye
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.ellipse(r * 0.2, 0, 10, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(r * 0.4, -2, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    this.drawTelegraph(ctx);
  }
}
