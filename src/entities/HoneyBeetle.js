import { Enemy } from './Enemy.js';
import { ENEMY_STATES } from '../ai/EnemyStateMachine.js';
import { ENCOUNTER_ROLES } from '../ai/EncounterCoordinator.js';
import { assetManager } from '../renderer/AssetManager.js';

/**
 * HONEY BEETLE
 * Canonical Role: HEAVY ARMORED CONTROL & JUGGERNAUT
 * 
 * 8 Canonical Attributes:
 * 1. ROLE: CONTROL (Commands space, forces aerial evasions, deflects frontal attacks)
 * 2. THREAT: Rating 4/5 (2 HP, frontal deflect, crushing high-speed charge)
 * 3. COUNTER: Strike rear glowing abdomen, or jump over charge and punish during RECOVER
 * 4. TELEGRAPH: Horn scrape with amber sparks + incandescent horn flare (0.65s)
 * 5. MOVEMENT STYLE: Heavy, deliberate armored march
 * 6. ATTACK STYLE: High-speed committed horn charge (crashes into obstacles)
 * 7. RECOVERY: Exhausted panting state (1.4s), carapace popped open exposing amber core
 * 8. ENVIRONMENTAL PREFERENCE: Stone terraces, long bridge approaches, flat battlefields
 */
export class HoneyBeetle extends Enemy {
  constructor(x, y, patrolLeft, patrolRight) {
    super(x, y, 92, 58, {
      name: 'Honey Beetle',
      species: 'beetle',
      role: ENCOUNTER_ROLES.CONTROL,
      threatLevel: 4,
      counterHint: 'Strike soft rear abdomen or punish during RECOVER after charge',
      telegraphDesc: 'Horn ground scrape and incandescent amber flare',
      movementStyle: 'Heavy armored march',
      attackStyle: 'Committed high-speed horn charge',
      recoveryDesc: 'Exhausted panting with open shell exposing amber core',
      environmentalPreference: 'Sunstone terraces and bridge approaches',
      health: 2,
      damage: 1,
      speed: 56,
      detectionRange: 340,
      attackRange: 280,
      patrolLeft,
      patrolRight,
      scoreValue: 400,
    });

    this.chargeSpeed = 390;
    this.chargeDuration = 0.95;
    this.stunDuration = 1.4;
    this.scrapeTimer = 0;
  }

  setupStates() {
    super.setupStates();

    // 1. IDLE: Heavy, slow breathing
    this.fsm.register(ENEMY_STATES.IDLE, {
      onEnter: (e) => {
        e.vx = 0;
      },
      update: (e, dt, level, player) => {
        if (e.fsm.stateTime > 1.2) {
          e.fsm.setState(ENEMY_STATES.PATROL);
          return;
        }
        e.evaluateSensoryTransitions(level, player);
      },
    });

    // 2. PATROL: Deliberate armored march
    this.fsm.register(ENEMY_STATES.PATROL, {
      onEnter: (e) => {
        e.isVulnerable = false;
      },
      update: (e, dt, level, player) => {
        e.updatePatrolMovement(dt, level);
        e.evaluateSensoryTransitions(level, player);
      },
    });

    // 3. AWARE / TELEGRAPH: Horn ground scrape and amber flare
    this.fsm.register(ENEMY_STATES.AWARE, {
      onEnter: (e) => {
        e.vx = 0;
        e.isTelegraphing = true;
        e.telegraphTimer = 0.65;
        e.scaleX = 1.15;
        e.scaleY = 0.9;

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
        e.scrapeTimer += dt * 16;

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

    // 4. CHASE: Advances heavily toward Aria, locks trajectory for charge
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

        e.faceTarget(player);

        const dist = Math.hypot(player.x - e.x, player.y - e.y);

        if (dist <= e.attackRange) {
          const tokenGranted = e.coordinator ? e.coordinator.requestAttackToken(e, 'primary') : true;
          if (tokenGranted) {
            e.fsm.setState(ENEMY_STATES.ATTACK);
            return;
          } else {
            e.fsm.setState(ENEMY_STATES.POSITION);
            return;
          }
        }

        if (e.hasGroundAhead(level, 24)) {
          e.vx = e.facing * e.speed * 1.35;
        } else {
          e.vx = 0;
          e.fsm.setState(ENEMY_STATES.POSITION);
        }
      },
    });

    // 5. ATTACK: High-speed committed charge! Cannot turn mid-charge
    this.fsm.register(ENEMY_STATES.ATTACK, {
      onEnter: (e) => {
        e.attackDir = e.facing;
        e.vx = e.attackDir * e.chargeSpeed;
        e.scaleX = 1.3;
        e.scaleY = 0.85;
      },
      update: (e, dt, level, player) => {
        e.vx = e.attackDir * e.chargeSpeed;

        // Smart player bypass check: if Aria leaped over and is now far behind
        if (player && e.fsm.stateTime > 0.4) {
          const isFarBehind = (e.attackDir > 0 && player.x < e.x - 120) || (e.attackDir < 0 && player.x > e.x + e.width + 120);
          if (isFarBehind && Math.random() < 0.08) {
            e.fsm.setState(ENEMY_STATES.RECOVER);
            return;
          }
        }

        // Ledge or boundary crash check
        if (!e.hasGroundAhead(level, 30) || (e.attackDir > 0 && e.x + e.width >= e.patrolRight) || (e.attackDir < 0 && e.x <= e.patrolLeft)) {
          // Crash into wall / boundary: enters stunned recovery!
          e.fsm.setState(ENEMY_STATES.RECOVER);
          return;
        }

        if (e.fsm.stateTime >= e.chargeDuration) {
          e.fsm.setState(ENEMY_STATES.RECOVER);
        }
      },
      onExit: (e) => {
        if (e.coordinator) {
          e.coordinator.releaseAttackToken(e);
        }
      },
    });

    // 6. RECOVER: Stunned & exhausted, carapace popped open, completely vulnerable!
    this.fsm.register(ENEMY_STATES.RECOVER, {
      onEnter: (e) => {
        e.vx = 0;
        e.isVulnerable = true;
        e.recoveryTimer = e.stunDuration;
        e.scaleX = 0.92;
        e.scaleY = 1.15;
      },
      update: (e, dt, level, player) => {
        e.recoveryTimer -= dt;
        e.scaleY = 1.0 + Math.sin(e.fsm.stateTime * 8) * 0.09;

        if (e.recoveryTimer <= 0) {
          e.isVulnerable = false;
          e.dir = -e.dir;
          e.facing = e.dir;
          if (e.perception && e.perception.hasDirectSight) {
            e.fsm.setState(ENEMY_STATES.CHASE);
          } else {
            e.fsm.setState(ENEMY_STATES.PATROL);
          }
        }
      },
      onExit: (e) => {
        e.isVulnerable = false;
      },
    });

    // 7. HURT: Heavy stagger
    this.fsm.register(ENEMY_STATES.HURT, {
      onEnter: (e) => {
        e.flashWhiteTimer = 0.25;
        e.scaleX = 0.8;
        e.scaleY = 1.25;
      },
      update: (e, dt) => {
        if (e.fsm.stateTime > 0.35) {
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

  /**
   * Overridden Stomp & Combat interaction:
   * Frontal attacks hit heavy armored carapace and bounce off!
   * Stomp from behind or during RECOVER state deals real damage!
   */
  stomp(player, audio) {
    if (this.isDead) return;

    const playerCenterX = player.x + player.width * 0.5;
    const myCenterX = this.x + this.width * 0.5;
    const isBehind = (this.facing > 0 && playerCenterX < myCenterX) || (this.facing < 0 && playerCenterX > myCenterX);

    if (this.isVulnerable || isBehind) {
      this.takeDamage(1, -this.facing * 140, -260, audio);
    } else {
      // Armored front deflects!
      this.scaleY = 0.85;
      this.scaleX = 1.2;
      if (audio?.playEnemyHit) audio.playEnemyHit();
    }
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

    const beetleImg = assetManager.getImage('worlds/honeywood/enemies/honey_beetle');
    if (beetleImg && beetleImg.complete) {
      ctx.drawImage(beetleImg, -this.width * 0.5 - 8, -this.height - 4, this.width + 16, this.height + 8);
    } else {
      const w = this.width;
      const h = this.height;

      // Heavy armored shell
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.ellipse(0, -h * 0.5, w * 0.45, h * 0.45, 0, 0, Math.PI * 2);
      ctx.fill();

      // Front Horn
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.moveTo(w * 0.35, -h * 0.5);
      ctx.lineTo(w * 0.6, -h * 0.8);
      ctx.lineTo(w * 0.38, -h * 0.3);
      ctx.closePath();
      ctx.fill();

      // Eye
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(w * 0.3, -h * 0.6, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Glowing core indicator when vulnerable / exhausted in RECOVER state
    if (this.isVulnerable) {
      ctx.fillStyle = 'rgba(254, 240, 138, 0.5)';
      ctx.shadowColor = '#fbbf24';
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(-this.width * 0.22, -this.height * 0.42, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    ctx.restore();

    this.drawTelegraph(ctx);
  }
}
