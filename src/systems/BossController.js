/**
 * BOSS ARCHITECTURE (BossController)
 * Reusable, extensible boss battle state machine & director.
 * Prepared for the Queen Bee boss battle in the Hive Throne.
 * 
 * Features:
 * - Multi-phase state machine (Phases 1, 2, 3 with transition thresholds)
 * - Boss health bar & maximum health
 * - Attack patterns & telegraph queue
 * - Arena boundaries & camera clamping
 * - Invulnerability periods during phase shifts
 * - Cinematic entrance & defeat sequences
 */

export const BOSS_STATES = {
  INACTIVE: 'INACTIVE',
  ENTRANCE: 'ENTRANCE',
  IDLE: 'IDLE',
  TELEGRAPH: 'TELEGRAPH',
  ATTACKING: 'ATTACKING',
  VULNERABLE: 'VULNERABLE',
  HURT: 'HURT',
  PHASE_TRANSITION: 'PHASE_TRANSITION',
  DEFEAT: 'DEFEAT',
  VICTORY: 'VICTORY',
};

export class BossController {
  constructor(options = {}) {
    this.name = options.name || 'The Queen Bee';
    this.title = options.title || 'Monarch of the Corrupted Hive';

    // Health & Phases
    this.maxHealth = options.maxHealth || 12;
    this.health = this.maxHealth;
    this.currentPhase = 1;
    this.totalPhases = options.totalPhases || 3;
    this.phaseThresholds = options.phaseThresholds || [0.66, 0.33]; // HP percentages triggering phase shift

    // State
    this.state = BOSS_STATES.INACTIVE;
    this.stateTimer = 0;
    this.isInvulnerable = false;
    this.invulnerableTimer = 0;

    // Arena Boundaries
    this.arenaLeft = options.arenaLeft || 4000;
    this.arenaRight = options.arenaRight || 5600;
    this.arenaTop = options.arenaTop || 0;
    this.arenaBottom = options.arenaBottom || 900;
    this.isArenaLocked = false;

    // Attack Patterns & Telegraphing
    this.currentAttack = null;
    this.attackQueue = [];
    this.telegraphTimer = 0;
    this.telegraphDuration = 1.0;
    this.telegraphWarningLine = null;

    // Callbacks
    this.onPhaseChange = options.onPhaseChange || null;
    this.onDefeat = options.onDefeat || null;
  }

  /**
   * Start boss encounter with cinematic entrance.
   */
  startEncounter(camera, audio) {
    this.state = BOSS_STATES.ENTRANCE;
    this.stateTimer = 0;
    this.isArenaLocked = true;
    if (camera) {
      camera.setTarget((this.arenaLeft + this.arenaRight) / 2, (this.arenaTop + this.arenaBottom) / 2);
      camera.shake(12, 1.8);
    }
    if (audio && audio.playQueenBeeAppearance) {
      audio.playQueenBeeAppearance();
    }
  }

  update(dt, player, level, camera, audio) {
    if (this.state === BOSS_STATES.INACTIVE) return;

    this.stateTimer += dt;

    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer -= dt;
      if (this.invulnerableTimer <= 0) {
        this.isInvulnerable = false;
      }
    }

    // Keep camera locked in boss arena during battle
    if (this.isArenaLocked && camera) {
      camera.minX = this.arenaLeft;
      camera.maxX = this.arenaRight;
    }

    switch (this.state) {
      case BOSS_STATES.ENTRANCE:
        if (this.stateTimer > 3.0) {
          this.state = BOSS_STATES.IDLE;
          this.stateTimer = 0;
        }
        break;

      case BOSS_STATES.IDLE:
        if (this.stateTimer > 1.5) {
          this.queueNextAttack();
        }
        break;

      case BOSS_STATES.TELEGRAPH:
        this.telegraphTimer -= dt;
        if (this.telegraphTimer <= 0) {
          this.executeCurrentAttack(audio);
        }
        break;

      case BOSS_STATES.ATTACKING:
        if (this.stateTimer > 2.0) {
          this.state = BOSS_STATES.VULNERABLE;
          this.stateTimer = 0;
        }
        break;

      case BOSS_STATES.VULNERABLE:
        if (this.stateTimer > 2.2) {
          this.state = BOSS_STATES.IDLE;
          this.stateTimer = 0;
        }
        break;

      case BOSS_STATES.PHASE_TRANSITION:
        if (this.stateTimer > 2.5) {
          this.isInvulnerable = false;
          this.state = BOSS_STATES.IDLE;
          this.stateTimer = 0;
        }
        break;

      case BOSS_STATES.DEFEAT:
        if (this.stateTimer > 4.0) {
          this.state = BOSS_STATES.VICTORY;
          this.isArenaLocked = false;
          if (this.onDefeat) this.onDefeat();
        }
        break;
    }
  }

  /**
   * Queue next attack with a readable telegraph warning.
   */
  queueNextAttack() {
    this.state = BOSS_STATES.TELEGRAPH;
    this.stateTimer = 0;
    this.telegraphTimer = this.telegraphDuration;
    // Example telegraph: warning line or danger flash
    this.telegraphWarningLine = {
      startX: this.arenaLeft + 200,
      startY: 500,
      endX: this.arenaRight - 200,
      endY: 500,
    };
  }

  executeCurrentAttack(audio) {
    this.state = BOSS_STATES.ATTACKING;
    this.stateTimer = 0;
    if (audio && audio.playQueenBeeAttack) {
      audio.playQueenBeeAttack();
    }
  }

  takeDamage(amount, audio, camera) {
    if (this.isInvulnerable || this.state === BOSS_STATES.PHASE_TRANSITION || this.state === BOSS_STATES.DEFEAT) {
      return false;
    }

    this.health = Math.max(0, this.health - amount);
    this.isInvulnerable = true;
    this.invulnerableTimer = 1.0;

    if (audio && audio.playEnemyHurt) audio.playEnemyHurt();
    if (camera) camera.shake(10, 0.3);

    // Check Phase Shift
    const hpRatio = this.health / this.maxHealth;
    if (this.currentPhase === 1 && hpRatio <= this.phaseThresholds[0]) {
      this.triggerPhaseShift(2, audio, camera);
      return true;
    } else if (this.currentPhase === 2 && hpRatio <= this.phaseThresholds[1]) {
      this.triggerPhaseShift(3, audio, camera);
      return true;
    }

    // Check Defeat
    if (this.health <= 0) {
      this.triggerDefeat(audio, camera);
      return true;
    }

    this.state = BOSS_STATES.HURT;
    this.stateTimer = 0;
    return true;
  }

  triggerPhaseShift(newPhase, audio, camera) {
    this.currentPhase = newPhase;
    this.state = BOSS_STATES.PHASE_TRANSITION;
    this.stateTimer = 0;
    this.isInvulnerable = true;
    this.invulnerableTimer = 2.5;

    if (camera) camera.shake(16, 1.5);
    if (audio && audio.playQueenBeeBuzz) audio.playQueenBeeBuzz();
    if (this.onPhaseChange) this.onPhaseChange(newPhase);
  }

  triggerDefeat(audio, camera) {
    this.state = BOSS_STATES.DEFEAT;
    this.stateTimer = 0;
    this.isInvulnerable = true;
    if (camera) camera.shake(20, 3.0);
    if (audio && audio.playEnemyDefeat) audio.playEnemyDefeat();
  }

  /**
   * Draw boss health bar and telegraph warning lines.
   */
  draw(ctx) {
    if (this.state === BOSS_STATES.INACTIVE) return;

    ctx.save();

    // 1. Draw Telegraph Warning Indicator
    if (this.state === BOSS_STATES.TELEGRAPH && this.telegraphWarningLine) {
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.7)';
      ctx.lineWidth = 4;
      ctx.setLineDash([16, 8]);
      ctx.beginPath();
      ctx.moveTo(this.telegraphWarningLine.startX, this.telegraphWarningLine.startY);
      ctx.lineTo(this.telegraphWarningLine.endX, this.telegraphWarningLine.endY);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 2. Draw Boss Health Bar (Centered at top of screen)
    const barWidth = 600;
    const barHeight = 22;
    const barX = (1920 - barWidth) / 2;
    const barY = 48;

    // Background Frame
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2.5;
    ctx.fillRect(barX - 4, barY - 4, barWidth + 8, barHeight + 8);
    ctx.strokeRect(barX - 4, barY - 4, barWidth + 8, barHeight + 8);

    // Health Fill
    const fillWidth = (this.health / this.maxHealth) * barWidth;
    const hpGrad = ctx.createLinearGradient(barX, 0, barX + barWidth, 0);
    hpGrad.addColorStop(0, '#ef4444');
    hpGrad.addColorStop(0.5, '#f59e0b');
    hpGrad.addColorStop(1, '#fef08a');
    ctx.fillStyle = hpGrad;
    ctx.fillRect(barX, barY, fillWidth, barHeight);

    // Boss Name & Phase Badge
    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 18px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${this.name.toUpperCase()} — PHASE ${this.currentPhase}`, 960, barY - 12);

    ctx.restore();
  }
}
