/**
 * DIRECTOR TELEMETRY ENGINE
 * 
 * Aggregates, tracks, and derives the 14 core gameplay and psychological signals
 * required by the Project Aria AI Level Director:
 * 
 * 1.  PLAYER POSITION
 * 2.  PLAYER HEALTH
 * 3.  PLAYER VELOCITY
 * 4.  PLAYER PROGRESS
 * 5.  RECENT DAMAGE
 * 6.  RECENT FAILURES
 * 7.  RECENT SUCCESS
 * 8.  CURRENT ENCOUNTER INTENSITY
 * 9.  TIME SINCE LAST ENCOUNTER
 * 10. TIME SINCE LAST REWARD
 * 11. CURRENT ROUTE
 * 12. EXPLORATION BEHAVIOR
 * 13. PLAYER SKILL SIGNALS
 * 14. CURRENT WORLD SECTION
 * 
 * STRICT ETHICAL RULE: These signals are used SOLELY by the Director to orchestrate
 * authored pacing, reward distribution, and breathing room. They are NEVER used to
 * artificially buff enemy health or cheat against skilled players.
 */

export class DirectorTelemetry {
  constructor() {
    this.reset();
  }

  reset() {
    // 1. Player Position & Spatial
    this.playerPosition = { x: 0, y: 0, footX: 0, footY: 0, elevation: 0 };
    this.furthestX = 0;

    // 2. Player Health
    this.playerHealth = { current: 3, max: 3, ratio: 1.0, isCritical: false };

    // 3. Player Velocity & State
    this.playerVelocity = {
      vx: 0,
      vy: 0,
      speed: 0,
      isDashing: false,
      isCrouching: false,
      isGrounded: false,
      isMovingForward: false,
    };

    // 4. Player Progress
    this.playerProgress = 0.0; // 0.0 to 1.0
    this.levelWidth = 2600;

    // 5. Recent Damage Tracking
    this.damageLog = []; // Rolling buffer of { time, amount, source, x, y }
    this.timeSinceLastDamage = 999;
    this.damageLast10s = 0;

    // 6. Recent Failures
    this.failureLog = []; // Rolling buffer of { time, type, x, y }
    this.consecutiveFailures = 0;
    this.timeSinceLastFailure = 999;

    // 7. Recent Success
    this.successLog = []; // Rolling buffer of { time, type, score, x, y }
    this.successStreak = 0;
    this.flawlessDistance = 0;
    this.lastFlawlessX = 0;

    // 8. Current Encounter Intensity
    this.currentEncounterIntensity = 0.0; // 0.0 (peaceful) to 1.0 (overwhelming threat)

    // 9. Time Since Last Encounter
    this.timeSinceLastEncounter = 999;
    this.activeCombatTimer = 0;

    // 10. Time Since Last Reward
    this.timeSinceLastReward = 999;
    this.totalRewardsCollected = 0;

    // 11. Current Route
    this.currentRoute = 'STANDARD_ROUTE';
    this.routeZoneId = null;

    // 12. Exploration Behavior
    this.explorationBehavior = {
      curiosityScore: 0.5,
      backtrackingTime: 0,
      verticalInspectionTime: 0,
      landmarksInspected: new Set(),
      secretAreasFound: 0,
      stationaryObservationTime: 0,
    };

    // 13. Player Skill Signals
    this.playerSkillSignals = {
      movementFluency: 0.7, // 0.0 (stuttery) to 1.0 (smooth momentum mastery)
      dashEfficiency: 0.6,  // Gap clears vs ground spam
      combatProficiency: 0.7, // Stomp/attack accuracy
      compositeSkillTier: 'INTERMEDIATE', // 'NOVICE' | 'INTERMEDIATE' | 'MASTER'
    };

    // 14. Current World Section
    this.currentWorldSection = {
      worldId: 1,
      stageId: 1,
      worldName: 'Honeywood Kingdom',
      sectionName: 'The Sunstone Glade',
      activeBeatName: 'QUIET',
    };

    // Internal trackers
    this.sessionTimer = 0;
    this.stationaryTimer = 0;
    this.lastX = 0;
    this.runningDistance = 0;
  }

  /**
   * Log player taking damage.
   */
  recordDamage(amount = 1, source = 'hazard', x = 0, y = 0) {
    const now = this.sessionTimer;
    this.damageLog.push({ time: now, amount, source, x, y });
    this.timeSinceLastDamage = 0;
    this.consecutiveFailures++;
    this.successStreak = 0;
    this.flawlessDistance = 0;
    this.lastFlawlessX = x;
    this.recordFailure('damage');
  }

  /**
   * Log player failure (fall into pit, took hit, interrupted dash).
   */
  recordFailure(type = 'fall', x = 0, y = 0) {
    const now = this.sessionTimer;
    this.failureLog.push({ time: now, type, x, y });
    this.timeSinceLastFailure = 0;
    this.successStreak = 0;
    this.flawlessDistance = 0;
  }

  /**
   * Log player success (enemy defeat, stomp, cleanly crossing hazard).
   */
  recordSuccess(type = 'stomp', score = 100, x = 0, y = 0) {
    const now = this.sessionTimer;
    this.successLog.push({ time: now, type, score, x, y });
    this.successStreak++;
    this.consecutiveFailures = Math.max(0, this.consecutiveFailures - 1);
  }

  /**
   * Log player picking up a reward (Royal Shard, Sun Crystal, Heart).
   */
  recordReward(type = 'shard', value = 1) {
    this.timeSinceLastReward = 0;
    this.totalRewardsCollected += value;
    this.recordSuccess('reward', 50 * value);
  }

  /**
   * Update all 14 signals every frame.
   */
  update(dt, player, level, gameState, currentRouteInfo, currentBeatName) {
    this.sessionTimer += dt;
    this.timeSinceLastDamage += dt;
    this.timeSinceLastFailure += dt;
    this.timeSinceLastEncounter += dt;
    this.timeSinceLastReward += dt;

    if (!player || !level) return;

    this.levelWidth = level.width || 2600;

    // 1. POSITION
    const px = player.x;
    const py = player.y;
    this.playerPosition.x = px;
    this.playerPosition.y = py;
    this.playerPosition.footX = px + player.width / 2;
    this.playerPosition.footY = py + player.height;
    this.playerPosition.elevation = Math.max(0, 880 - (py + player.height));

    if (px > this.furthestX) {
      this.furthestX = px;
    }

    // 2. HEALTH
    if (gameState) {
      this.playerHealth.current = gameState.lives;
      this.playerHealth.max = gameState.maxLives || 3;
      this.playerHealth.ratio = this.playerHealth.current / this.playerHealth.max;
      this.playerHealth.isCritical = this.playerHealth.current <= 1;
    }

    // 3. VELOCITY & ACTIONS
    this.playerVelocity.vx = player.vx || 0;
    this.playerVelocity.vy = player.vy || 0;
    this.playerVelocity.speed = Math.hypot(player.vx || 0, player.vy || 0);
    this.playerVelocity.isDashing = !!player.isDashing;
    this.playerVelocity.isCrouching = !!player.isCrouching;
    this.playerVelocity.isGrounded = !!player.isGrounded;
    this.playerVelocity.isMovingForward = (player.vx || 0) > 40;

    // 4. PROGRESS
    this.playerProgress = Math.max(0, Math.min(1.0, px / this.levelWidth));

    // 5. PRUNE ROLLING LOGS & DERIVE RECENT DAMAGE
    const cutoff15 = this.sessionTimer - 15;
    const cutoff10 = this.sessionTimer - 10;
    this.damageLog = this.damageLog.filter(e => e.time >= cutoff15);
    this.failureLog = this.failureLog.filter(e => e.time >= cutoff15);
    this.successLog = this.successLog.filter(e => e.time >= cutoff15);

    this.damageLast10s = this.damageLog
      .filter(e => e.time >= cutoff10)
      .reduce((sum, e) => sum + e.amount, 0);

    // 6 & 7. FLAWLESS RUN DISTANCE
    if (this.timeSinceLastDamage > 0.5) {
      const deltaX = Math.max(0, px - this.lastFlawlessX);
      this.flawlessDistance += deltaX;
      this.lastFlawlessX = px;
    }

    // 8 & 9. ENCOUNTER INTENSITY & COMBAT RECENCY
    let threatAccumulator = 0;
    let nearbyHostiles = 0;

    if (level.enemies && level.enemies.length > 0) {
      for (const enemy of level.enemies) {
        if (enemy.isDead) continue;
        const ex = enemy.x + (enemy.width || 48) / 2;
        const ey = enemy.y + (enemy.height || 48) / 2;
        const dist = Math.hypot(px - ex, py - ey);

        // Hostile proximity window: 600px
        if (dist < 600) {
          nearbyHostiles++;
          const proximityFactor = Math.max(0, 1.0 - dist / 600);
          const enemyWeight = enemy.scoreValue ? enemy.scoreValue / 150 : 0.5;
          threatAccumulator += proximityFactor * enemyWeight;
        }
      }
    }

    this.currentEncounterIntensity = Math.min(1.0, threatAccumulator);
    if (nearbyHostiles > 0 || this.currentEncounterIntensity > 0.15) {
      this.timeSinceLastEncounter = 0;
      this.activeCombatTimer += dt;
    } else {
      this.activeCombatTimer = 0;
    }

    // 11. CURRENT ROUTE
    if (currentRouteInfo) {
      this.currentRoute = currentRouteInfo.currentRoute || 'STANDARD_ROUTE';
      this.routeZoneId = currentRouteInfo.currentZone ? currentRouteInfo.currentZone.id : null;
    }

    // 12. EXPLORATION BEHAVIOR
    // Backtracking detection: moving left while furthest progress is well ahead
    if (player.vx < -60 && this.furthestX - px > 160) {
      this.explorationBehavior.backtrackingTime += dt;
    }

    // High elevation / vertical inspection
    if (this.playerPosition.elevation > 140) {
      this.explorationBehavior.verticalInspectionTime += dt;
    }

    // Stationary observation (stopping to gaze at landmarks)
    if (Math.abs(player.vx) < 10 && Math.abs(player.vy) < 10 && player.isGrounded) {
      this.stationaryTimer += dt;
      if (this.stationaryTimer > 1.2) {
        this.explorationBehavior.stationaryObservationTime += dt;
      }
    } else {
      this.stationaryTimer = 0;
    }

    // Derived Curiosity Index
    const curiosityRaw =
      (this.explorationBehavior.verticalInspectionTime * 0.4 +
       this.explorationBehavior.backtrackingTime * 0.3 +
       this.explorationBehavior.stationaryObservationTime * 0.3) / 10.0;
    this.explorationBehavior.curiosityScore = Math.max(0.1, Math.min(1.0, curiosityRaw + 0.3));

    // 13. PLAYER SKILL SIGNALS
    // Movement fluency: rewarded for maintaining steady forward speed without repetitive collisions
    if (player.isGrounded && Math.abs(player.vx) > 180) {
      this.playerSkillSignals.movementFluency = Math.min(1.0, this.playerSkillSignals.movementFluency + dt * 0.05);
    } else if (this.consecutiveFailures > 0) {
      this.playerSkillSignals.movementFluency = Math.max(0.1, this.playerSkillSignals.movementFluency - dt * 0.1);
    }

    // Combat proficiency: based on ratio of defeats vs damage taken
    const totalHitsTaken = this.damageLog.length;
    const totalDefeats = this.successLog.filter(s => s.type === 'stomp' || s.type === 'attack').length;
    const combatRatio = totalHitsTaken === 0 ? 0.9 : Math.min(1.0, totalDefeats / (totalHitsTaken + 1));
    this.playerSkillSignals.combatProficiency = combatRatio;

    // Composite skill tier evaluation (used for authored variant selection)
    const compositeScore =
      this.playerSkillSignals.movementFluency * 0.45 +
      this.playerSkillSignals.combatProficiency * 0.35 +
      Math.min(1.0, this.flawlessDistance / 800) * 0.2;

    if (compositeScore >= 0.78 && this.playerHealth.ratio >= 0.66) {
      this.playerSkillSignals.compositeSkillTier = 'MASTER';
    } else if (compositeScore <= 0.38 || this.playerHealth.isCritical) {
      this.playerSkillSignals.compositeSkillTier = 'NOVICE';
    } else {
      this.playerSkillSignals.compositeSkillTier = 'INTERMEDIATE';
    }

    // 14. CURRENT WORLD SECTION
    this.currentWorldSection.activeBeatName = currentBeatName || 'QUIET';
    this.currentWorldSection.worldId = level.world || 1;
    this.currentWorldSection.stageId = level.stage || 1;
    this.currentWorldSection.sectionName = level.name || 'The Sunstone Glade';

    this.lastX = px;
  }
}
