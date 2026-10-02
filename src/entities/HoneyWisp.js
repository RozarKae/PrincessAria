import { Enemy } from './Enemy.js';
import { ENEMY_STATES } from '../ai/EnemyStateMachine.js';
import { ENCOUNTER_ROLES } from '../ai/EncounterCoordinator.js';
import { assetManager } from '../renderer/AssetManager.js';

/**
 * HONEY WISP
 * Canonical Role: DISTRACTION & AREA DENIAL
 * 
 * 8 Canonical Attributes:
 * 1. ROLE: DISTRACTION (Harasses from above, baits attacks, closes jump arcs)
 * 2. THREAT: Rating 2/5 (1 DMG, floating unpredictability, restricts safe jumping space)
 * 3. COUNTER: Mid-air Stardust Slash or downward stomp from canopy branches
 * 4. TELEGRAPH: Honey aura blazes crimson + swirling honey motes (0.4s)
 * 5. MOVEMENT STYLE: Sinusoidal floating hover drift
 * 6. ATTACK STYLE: Forward lunging dart through player airspace
 * 7. RECOVERY: Upward float into safe airspace, vulnerable to aerial slashes
 * 8. ENVIRONMENTAL PREFERENCE: Above suspended bridges, pits, high canopy boughs
 */
export class HoneyWisp extends Enemy {
  constructor(x, y, options = {}) {
    super(x, y, 48, 54, {
      name: 'Honey Wisp',
      species: 'wisp',
      role: ENCOUNTER_ROLES.DISTRACTION,
      threatLevel: 2,
      counterHint: 'Mid-air Stardust Slash or stomp from higher platform',
      telegraphDesc: 'Aura flashes crimson with swirling honey motes',
      movementStyle: 'Sinusoidal hover drift',
      attackStyle: 'Forward airborne lunge',
      recoveryDesc: 'Upward retreat into safe airspace',
      environmentalPreference: 'Airspace above rope bridges and canopy gaps',
      health: 1,
      damage: 1,
      speed: 70,
      isFlying: true,
      gravity: 0,
      detectionRange: 280,
      attackRange: 130,
      scoreValue: 250,
      ...options,
    });

    this.baseY = y;
    this.amplitude = options.amplitude || 65;
    this.frequency = options.frequency || 2.2;
    this.floatTimer = Math.random() * Math.PI * 2;
    this.auraPulseTimer = Math.random() * Math.PI;

    this.retreatTargetX = x;
    this.retreatTargetY = y;
  }

  setupStates() {
    super.setupStates();

    // 1. PATROL: Vertical sine float at patrol altitude
    this.fsm.register(ENEMY_STATES.PATROL, {
      update: (e, dt, level, player) => {
        e.floatTimer += dt * e.frequency;
        e.y = e.baseY + Math.sin(e.floatTimer) * e.amplitude;
        e.vx = 0;
        e.vy = 0;

        e.evaluateSensoryTransitions(level, player);
      },
    });

    // 2. AWARE / TELEGRAPH: Flares crimson aura, draws attention
    this.fsm.register(ENEMY_STATES.AWARE, {
      onEnter: (e) => {
        e.isTelegraphing = true;
        e.telegraphTimer = 0.4;
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

    // 3. CHASE: Predictive hover pursuit
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

        // Anti-Stomp Evasion: Pulses outward to avoid direct downward stomps
        if (e.checkAntiStompReflex(player, dt)) {
          e.vx = (player.x > e.x ? -1 : 1) * (e.speed * 2.2);
          e.vy = -130;
          return;
        }

        // Predictive intercept calculation
        const predicted = e.predictTargetPosition(player, 0.28);
        const dx = predicted.x - (e.x + e.width * 0.5);
        const dy = (predicted.y - 25) - (e.y + e.height * 0.5);
        const dist = Math.hypot(dx, dy);

        if (dist > 12) {
          e.vx = (dx / dist) * (e.speed * 1.35);
          e.vy = (dy / dist) * (e.speed * 0.95);
        }

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

    // 4. ATTACK: Forward lunging dart through player airspace
    this.fsm.register(ENEMY_STATES.ATTACK, {
      onEnter: (e) => {
        e.attackCommitmentTimer = 0.42;
        e.attackDir = e.facing;
        e.scaleX = 1.35;
        e.scaleY = 0.75;
        e.vx = e.attackDir * 190;
        e.vy = 45;
      },
      update: (e, dt) => {
        e.attackCommitmentTimer -= dt;
        e.vx *= 0.95;
        e.vy *= 0.95;

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

    // 5. RECOVER: Drifts upward into safe airspace
    this.fsm.register(ENEMY_STATES.RECOVER, {
      onEnter: (e) => {
        e.isVulnerable = true;
        e.recoveryTimer = 0.55;
        e.scaleX = 0.9;
        e.scaleY = 1.15;
      },
      update: (e, dt) => {
        e.recoveryTimer -= dt;
        e.vy = -110; // Lift into upper airspace
        e.vx *= 0.92;

        if (e.recoveryTimer <= 0) {
          e.isVulnerable = false;
          e.fsm.setState(ENEMY_STATES.RETREAT);
        }
      },
      onExit: (e) => {
        e.isVulnerable = false;
      },
    });

    // 6. RETREAT: Returns smoothly to base patrol altitude
    this.fsm.register(ENEMY_STATES.RETREAT, {
      onEnter: (e) => {
        e.retreatTargetX = e.startX;
        e.retreatTargetY = e.baseY;
      },
      update: (e, dt) => {
        const dx = e.retreatTargetX - e.x;
        const dy = e.retreatTargetY - e.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 25) {
          e.vx = (dx / dist) * e.speed * 0.9;
          e.vy = (dy / dist) * e.speed * 0.9;
        } else {
          e.fsm.setState(ENEMY_STATES.PATROL);
        }
      },
    });

    // 7. HURT: Wobble
    this.fsm.register(ENEMY_STATES.HURT, {
      onEnter: (e) => {
        e.flashWhiteTimer = 0.2;
        e.scaleX = 0.7;
        e.scaleY = 1.3;
      },
      update: (e, dt) => {
        if (e.fsm.stateTime > 0.25) {
          e.fsm.setState(ENEMY_STATES.RETREAT);
        }
      },
    });

    // 8. DEAD: Dissolves into golden mist
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
    this.auraPulseTimer += dt * 3.5;
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
      const expand = 1 + (this.defeatTimer / this.defeatDuration) * 0.8;
      ctx.globalAlpha = fade;
      ctx.scale(expand, expand);
    } else {
      const pulse = 1 + Math.sin(this.auraPulseTimer) * 0.06;
      ctx.scale(pulse, pulse);
    }

    if (this.flashWhiteTimer > 0) {
      ctx.filter = 'brightness(2.5)';
    }

    const wispImg = assetManager.getImage('worlds/honeywood/enemies/honey_wisp');
    if (wispImg && wispImg.complete) {
      ctx.drawImage(wispImg, -this.width * 0.5 - 8, -this.height * 0.5 - 8, this.width + 16, this.height + 16);
    } else {
      const r = this.width * 0.5;

      const glowColor = this.fsm.is(ENEMY_STATES.AWARE) || this.fsm.is(ENEMY_STATES.ATTACK)
        ? 'rgba(239, 68, 68, 0.65)'
        : 'rgba(245, 158, 11, 0.4)';
      const glow = ctx.createRadialGradient(0, 0, 4, 0, 0, r * 1.5);
      glow.addColorStop(0, 'rgba(254, 240, 138, 0.9)');
      glow.addColorStop(0.5, glowColor);
      glow.addColorStop(1, 'rgba(245, 158, 11, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(0, 0, r * 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Honey Teardrop Core
      const coreGrad = ctx.createLinearGradient(0, -r, 0, r);
      coreGrad.addColorStop(0, '#ffffff');
      coreGrad.addColorStop(0.3, '#fef08a');
      coreGrad.addColorStop(0.7, '#f59e0b');
      coreGrad.addColorStop(1, '#b45309');
      ctx.fillStyle = coreGrad;

      ctx.beginPath();
      ctx.moveTo(0, -r * 0.9);
      ctx.bezierCurveTo(r, -r * 0.4, r, r * 0.6, 0, r * 1.1);
      ctx.bezierCurveTo(-r, r * 0.6, -r, -r * 0.4, 0, -r * 0.9);
      ctx.closePath();
      ctx.fill();

      // Mischievous Wisp Eyes
      const eyeCol = this.fsm.is(ENEMY_STATES.ATTACK) ? '#dc2626' : '#78350f';
      ctx.fillStyle = eyeCol;
      ctx.beginPath();
      ctx.ellipse(-7, -2, 3, 4.5, 0, 0, Math.PI * 2);
      ctx.ellipse(7, -2, 3, 4.5, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-6, -3, 1.2, 0, Math.PI * 2);
      ctx.arc(8, -3, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    this.drawTelegraph(ctx);
  }
}
