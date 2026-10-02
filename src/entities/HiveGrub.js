import { Enemy } from './Enemy.js';
import { ENEMY_STATES } from '../ai/EnemyStateMachine.js';
import { ENCOUNTER_ROLES } from '../ai/EncounterCoordinator.js';
import { assetManager } from '../renderer/AssetManager.js';

/**
 * HIVE GRUB
 * Canonical Role: GROUND PRESSURE & CORNERING
 * 
 * 8 Canonical Attributes:
 * 1. ROLE: PRESSURE (Forces Aria to jump or attack rather than linger)
 * 2. THREAT: Rating 2/5 (1 DMG, rapid scuttle charge, persistent cornering)
 * 3. COUNTER: Stomp from above (squashes flat) or Royal Stardust Slash
 * 4. TELEGRAPH: Antenna twitching and warning flare (0.35s)
 * 5. MOVEMENT STYLE: Terrain-adhering scuttle with robust edge avoidance
 * 6. ATTACK STYLE: Scuttle rush with attack commitment (holds platform edges)
 * 7. RECOVERY: Exhausted panting pause (0.5s) exposing top head segment
 * 8. ENVIRONMENTAL PREFERENCE: Under-bridge clearings, low banks, chokepoints
 */
export class HiveGrub extends Enemy {
  constructor(x, y, patrolLeft, patrolRight) {
    super(x, y, 62, 44, {
      name: 'Hive Grub',
      species: 'grub',
      role: ENCOUNTER_ROLES.PRESSURE,
      threatLevel: 2,
      counterHint: 'Stomp from above or Stardust Slash',
      telegraphDesc: 'Antenna twitch and warning flare',
      movementStyle: 'Terrain scuttle with edge avoidance',
      attackStyle: 'Committed scuttle rush',
      recoveryDesc: 'Exhausted panting pause',
      environmentalPreference: 'Under-bridge ground and low banks',
      health: 1,
      damage: 1,
      speed: 82,
      detectionRange: 260,
      attackRange: 110,
      patrolLeft,
      patrolRight,
      scoreValue: 200,
    });

    this.crawlTimer = Math.random() * Math.PI * 2;
    this.idleTimer = 0;
  }

  setupStates() {
    super.setupStates();

    // 1. IDLE STATE: Rhythmic breathing, twitching antennae
    this.fsm.register(ENEMY_STATES.IDLE, {
      onEnter: (e) => {
        e.vx = 0;
        e.idleTimer = 0.8 + Math.random() * 0.8;
      },
      update: (e, dt, level, player) => {
        e.crawlTimer += dt * 3;
        e.scaleX = 1 + Math.sin(e.crawlTimer) * 0.05;
        e.scaleY = 1 - Math.sin(e.crawlTimer) * 0.05;

        e.idleTimer -= dt;
        if (e.idleTimer <= 0) {
          e.dir = -e.dir;
          e.facing = e.dir;
          e.fsm.setState(ENEMY_STATES.PATROL);
          return;
        }
        e.evaluateSensoryTransitions(level, player);
      },
    });

    // 2. PATROL STATE: Crawls along platform, checks edges & ends
    this.fsm.register(ENEMY_STATES.PATROL, {
      update: (e, dt, level, player) => {
        e.crawlTimer += dt * 7;
        e.scaleX = 1 + Math.sin(e.crawlTimer) * 0.08;
        e.scaleY = 1 - Math.sin(e.crawlTimer) * 0.08;

        e.updatePatrolMovement(dt, level);

        if (Math.random() < 0.003 && e.isGrounded) {
          e.fsm.setState(ENEMY_STATES.IDLE);
          return;
        }

        e.evaluateSensoryTransitions(level, player);
      },
    });

    // 3. AWARE / TELEGRAPH: Sights Aria, antenna tenses, telegraph badge triggers
    this.fsm.register(ENEMY_STATES.AWARE, {
      onEnter: (e) => {
        e.vx = 0;
        e.isTelegraphing = true;
        e.telegraphTimer = 0.35;
        e.scaleX = 0.85;
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

    // 4. CHASE: Scuttles eagerly toward Aria with confirmed LOS
    this.fsm.register(ENEMY_STATES.CHASE, {
      update: (e, dt, level, player) => {
        if (!player || player.isDead) {
          e.fsm.setState(ENEMY_STATES.RETURN);
          return;
        }

        if (e.perception && !e.perception.hasDirectSight) {
          e.fsm.setState(ENEMY_STATES.INVESTIGATE);
          return;
        }

        e.crawlTimer += dt * 11;
        e.scaleX = 1 + Math.sin(e.crawlTimer) * 0.1;
        e.scaleY = 1 - Math.sin(e.crawlTimer) * 0.1;

        e.faceTarget(player);

        // Anti-Stomp Evasion: Scuttles out of descending player's path
        if (e.checkAntiStompReflex(player, dt)) {
          e.vx = (player.x > e.x ? -1 : 1) * (e.speed * 2.0);
          return;
        }

        const dist = Math.hypot(player.x - e.x, player.y - e.y);

        if (dist <= e.attackRange) {
          const canAttack = e.coordinator ? e.coordinator.requestAttackToken(e, 'primary') : true;
          if (canAttack) {
            e.fsm.setState(ENEMY_STATES.ATTACK);
            return;
          } else {
            e.fsm.setState(ENEMY_STATES.POSITION);
            return;
          }
        }

        // Edge check: Grubs will NOT blindly jump to their deaths!
        if (e.hasGroundAhead(level, 20)) {
          e.vx = e.facing * e.speed * 1.45;
        } else {
          e.vx = 0;
          e.fsm.setState(ENEMY_STATES.POSITION);
        }
      },
    });

    // 5. ATTACK: Committed scuttle rush!
    this.fsm.register(ENEMY_STATES.ATTACK, {
      onEnter: (e) => {
        e.attackCommitmentTimer = 0.45;
        e.attackDir = e.facing;
        e.vx = e.attackDir * e.speed * 1.75;
        e.scaleX = 1.35;
        e.scaleY = 0.8;
      },
      update: (e, dt, level, player) => {
        e.attackCommitmentTimer -= dt;
        e.crawlTimer += dt * 14;

        // Maintain committed velocity
        e.vx = e.attackDir * e.speed * 1.75;

        // Platform edge check
        if (!e.hasGroundAhead(level, 18)) {
          e.vx = 0;
          e.fsm.setState(ENEMY_STATES.RECOVER);
          return;
        }

        if (e.attackCommitmentTimer <= 0) {
          e.fsm.setState(ENEMY_STATES.RECOVER);
        }
      },
      onExit: (e) => {
        if (e.coordinator) {
          e.coordinator.releaseAttackToken(e);
        }
      },
    });

    // 6. RECOVER: Exhausted panting pause, completely open to stomps
    this.fsm.register(ENEMY_STATES.RECOVER, {
      onEnter: (e) => {
        e.vx = 0;
        e.isVulnerable = true;
        e.recoveryTimer = 0.45;
        e.scaleX = 0.9;
        e.scaleY = 1.15;
      },
      update: (e, dt, level, player) => {
        e.recoveryTimer -= dt;
        e.scaleY = 1.0 + Math.sin(e.fsm.stateTime * 10) * 0.08;

        if (e.recoveryTimer <= 0) {
          e.isVulnerable = false;
          if (e.perception && e.perception.hasDirectSight) {
            e.fsm.setState(ENEMY_STATES.CHASE);
          } else {
            e.fsm.setState(ENEMY_STATES.SEARCH);
          }
        }
      },
      onExit: (e) => {
        e.isVulnerable = false;
      },
    });

    // 7. DEAD: Squashed flat
    this.fsm.register(ENEMY_STATES.DEAD, {
      onEnter: (e) => {
        e.isDead = true;
        e.scaleY = 0.18;
        e.scaleX = 1.45;
        e.vx = 0;
        e.vy = 0;
        if (e.coordinator) e.coordinator.releaseAttackToken(e);
      },
      update: (e, dt) => {
        e.defeatTimer += dt;
      },
    });
  }

  stomp(player, audio) {
    this.scaleY = 0.18;
    this.scaleX = 1.45;
    this.takeDamage(1, 0, 0, audio);
  }

  draw(ctx) {
    if (this.isDead && this.defeatTimer > this.defeatDuration) return;

    ctx.save();
    const centerX = this.x + this.width * 0.5;
    const bottomY = this.y + this.height;

    ctx.translate(centerX, bottomY);
    ctx.scale(this.facing * this.scaleX, this.scaleY);

    if (this.isDead) {
      const fade = Math.max(0, 1 - this.defeatTimer / this.defeatDuration);
      ctx.globalAlpha = fade;
    }

    if (this.flashWhiteTimer > 0) {
      ctx.filter = 'brightness(2.2)';
    }

    const grubImg = assetManager.getImage('worlds/honeywood/enemies/hive_grub');
    if (grubImg && grubImg.complete) {
      ctx.drawImage(grubImg, -this.width * 0.5 - 4, -this.height - 4, this.width + 8, this.height + 8);
    } else {
      // Vector rendering fallback
      const w = this.width;
      const h = this.height;

      const grad = ctx.createLinearGradient(0, -h, 0, 0);
      grad.addColorStop(0, '#fef08a');
      grad.addColorStop(0.4, '#fbbf24');
      grad.addColorStop(0.8, '#d97706');
      grad.addColorStop(1, '#78350f');
      ctx.fillStyle = grad;

      ctx.beginPath();
      ctx.ellipse(-14, -h * 0.45, 12, 11, 0, 0, Math.PI * 2);
      ctx.ellipse(0, -h * 0.5, 14, 13, 0, 0, Math.PI * 2);
      ctx.ellipse(16, -h * 0.55, 16, 15, 0, 0, Math.PI * 2);
      ctx.fill();

      // Honeycomb amber spots
      ctx.fillStyle = '#18181b';
      ctx.beginPath();
      ctx.arc(0, -h * 0.5, 3.5, 0, Math.PI * 2);
      ctx.arc(-12, -h * 0.45, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Alert red eye
      const eyeColor = this.fsm.is(ENEMY_STATES.AWARE) || this.fsm.is(ENEMY_STATES.ATTACK) ? '#ef4444' : '#f97316';
      ctx.fillStyle = eyeColor;
      ctx.beginPath();
      ctx.arc(22, -h * 0.6, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(24, -h * 0.65, 1.8, 0, Math.PI * 2);
      ctx.fill();

      // Crawling legs
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 2.5;
      [-12, -2, 8, 18].forEach((lx, i) => {
        const lift = Math.sin(this.crawlTimer + i) * 3;
        ctx.beginPath();
        ctx.moveTo(lx, -6);
        ctx.lineTo(lx + 2, 0 + lift);
        ctx.stroke();
      });
    }

    ctx.restore();

    this.drawTelegraph(ctx);
  }
}
