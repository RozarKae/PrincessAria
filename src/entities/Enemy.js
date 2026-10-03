import { EnemyStateMachine, ENEMY_STATES } from '../ai/EnemyStateMachine.js';
import { EnemyPerception } from '../ai/EnemyPerception.js';
import { ENCOUNTER_ROLES } from '../ai/EncounterCoordinator.js';
import { Collision } from '../physics/Collision.js';

/**
 * BASE ENEMY ARCHITECTURE
 * Reusable, intelligent, and coordinated foundation for all Project Aria enemies.
 * 
 * Every enemy incorporates the 8 Canonical Design Attributes:
 * 1. ROLE (Ground Pressure, Armored Control, Aerial Harasser, Zone Denial, Ambush)
 * 2. THREAT (Rating, engagement distance, and lethal potential)
 * 3. COUNTER (Explicit player counterplay: Stomp, Stardust Slash, Flanking, Punish on Recovery)
 * 4. TELEGRAPH (Visual anticipation, audio cue, and timing before attack commitment)
 * 5. MOVEMENT STYLE (Terrain adherence, scuttle, hover drift, parabolic swoop)
 * 6. ATTACK STYLE (Lunging charge, committed slam, diving intercept)
 * 7. RECOVERY (Exhaustion window, exposed weak points, vulnerable punishment frames)
 * 8. ENVIRONMENTAL PREFERENCE (Narrow bridges, platform ledges, canopy perches, chokepoints)
 * 
 * Intelligent Systems:
 * - 12-State Canonical State Machine (IDLE, PATROL, AWARE, INVESTIGATE, CHASE, POSITION, ATTACK, EVADE, RECOVER, SEARCH, RETREAT, RETURN)
 * - Non-omniscient Perception with Raycasted Line of Sight (LOS)
 * - Reaction Time Delay buffer (0.15s - 0.3s)
 * - Limited Memory & Search Behavior (investigates last known position)
 * - Target Prediction (predicts Aria's velocity; can be baited/juked)
 * - Attack Commitment (direction and trajectory locked during strike)
 * - Group Encounter Coordination & Attack Token integration
 */
export class Enemy {
  constructor(x, y, width, height, options = {}) {
    this.x = x;
    this.y = y;
    this.startX = x;
    this.startY = y;
    this.width = width;
    this.height = height;

    // 1. Core Identity & 8 Canonical Design Attributes
    this.name = options.name || 'Hive Minion';
    this.species = options.species || 'minion';
    this.role = options.role || ENCOUNTER_ROLES.PRESSURE;
    this.threatLevel = options.threatLevel || 1; // 1 to 5 scale
    this.counterHint = options.counterHint || 'Stomp from above or Stardust Slash';
    this.telegraphDesc = options.telegraphDesc || 'Antenna twitch and warning flare';
    this.movementStyle = options.movementStyle || 'Ground scuttle';
    this.attackStyle = options.attackStyle || 'Forward lunge';
    this.recoveryDesc = options.recoveryDesc || 'Brief panting pause';
    this.environmentalPreference = options.environmentalPreference || 'Open ground and platforms';

    // Combat Stats
    this.maxHealth = options.health !== undefined ? options.health : 1;
    this.health = this.maxHealth;
    this.damage = options.damage !== undefined ? options.damage : 1;
    this.scoreValue = options.scoreValue || 200;

    // Movement & Physics
    this.vx = 0;
    this.vy = 0;
    this.speed = options.speed || 85;
    this.gravity = options.gravity !== undefined ? options.gravity : 1800;
    this.isGrounded = false;
    this.isFlying = options.isFlying || false;

    // Facing direction: 1 = right, -1 = left
    this.dir = options.dir || 1;
    this.facing = this.dir;

    // Patrol Boundaries
    this.patrolLeft = options.patrolLeft !== undefined ? options.patrolLeft : x - 150;
    this.patrolRight = options.patrolRight !== undefined ? options.patrolRight : x + 150;

    // Sensory Perception System (Raycast LOS, Memory, FOV Cone)
    this.perception = new EnemyPerception(this, {
      sightRange: options.detectionRange || 300,
      fovAngle: options.fovAngle || Math.PI * 0.72,
      peripheralRadius: options.peripheralRadius || 75,
      reactionDelay: options.reactionDelay || 0.22,
      memoryDuration: options.memoryDuration || 3.0,
    });

    this.detectionRange = this.perception.sightRange;
    this.attackRange = options.attackRange || 85;
    this.alertRadius = options.alertRadius || 280;
    this.target = null;

    // Attack Commitment & Recovery Tuning
    this.isTelegraphing = false;
    this.telegraphTimer = 0;
    this.telegraphDuration = options.telegraphDuration || 0.45;
    this.attackCommitmentTimer = 0;
    this.attackDuration = options.attackDuration || 0.5;
    this.recoveryTimer = 0;
    this.recoveryDuration = options.recoveryDuration || 0.6;
    this.isVulnerable = false; // Flag indicating exposed punishment frames

    // Search and Investigate Timers
    this.searchTimer = 0;
    this.searchLookTimer = 0;
    this.searchLooksCount = 0;

    // Status & Life Cycle
    this.isDead = false;
    this.isInvulnerable = false;
    this.invulnerableTimer = 0;
    this.defeatTimer = 0;
    this.defeatDuration = 0.45;

    // Visual scale & Squash/Stretch
    this.scaleX = 1;
    this.scaleY = 1;
    this.flashWhiteTimer = 0;

    // Reference to Encounter Coordinator & Level
    this.coordinator = null;
    this.levelRef = null;

    // Initialize State Machine
    this.fsm = new EnemyStateMachine(this);
    this.setupStates();
    this.fsm.setState(ENEMY_STATES.PATROL);
  }

  /**
   * Set up default handlers for the 12 canonical states.
   * Concrete subclasses can override or extend these via this.fsm.register().
   */
  setupStates() {
    // 1. IDLE: Rest, breathe, check perception
    this.fsm.register(ENEMY_STATES.IDLE, {
      onEnter: (e) => {
        e.vx = 0;
      },
      update: (e, dt, level, player) => {
        if (e.fsm.stateTime > 1.4) {
          e.fsm.setState(ENEMY_STATES.PATROL);
          return;
        }
        e.evaluateSensoryTransitions(level, player);
      },
    });

    // 2. PATROL: Move along route, avoid edges, scan for player
    this.fsm.register(ENEMY_STATES.PATROL, {
      onEnter: (e) => {
        e.isVulnerable = false;
        e.isTelegraphing = false;
      },
      update: (e, dt, level, player) => {
        e.updatePatrolMovement(dt, level);
        e.evaluateSensoryTransitions(level, player);
      },
    });

    // 3. AWARE: Senses player or heard disturbance; reaction latency buffer
    this.fsm.register(ENEMY_STATES.AWARE, {
      onEnter: (e) => {
        e.vx = 0;
        e.isTelegraphing = true;
        e.telegraphTimer = e.telegraphDuration;
        e.scaleX = 0.88;
        e.scaleY = 1.2;

        // Broadcast alert to nearby allies via coordinator
        const targetPlayer = e.targetPlayer || (e.perception ? e.perception.targetPlayer : null);
        if (e.coordinator && targetPlayer) {
          e.coordinator.broadcastAlert(e, targetPlayer, e.alertRadius);
        } else if (e.levelRef) {
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
          } else if (e.perception && e.perception.lastKnownPos) {
            e.fsm.setState(ENEMY_STATES.INVESTIGATE);
          } else {
            e.fsm.setState(ENEMY_STATES.SEARCH);
          }
        }
      },
      onExit: (e) => {
        e.isTelegraphing = false;
      },
    });

    // 4. INVESTIGATE: Moving toward last known position where sight was broken
    this.fsm.register(ENEMY_STATES.INVESTIGATE, {
      onEnter: (e) => {
        e.isTelegraphing = false;
      },
      update: (e, dt, level, player) => {
        const lastPos = e.perception ? e.perception.lastKnownPos : null;
        if (!lastPos) {
          e.fsm.setState(ENEMY_STATES.SEARCH);
          return;
        }

        // Direct line of sight re-established: switch to CHASE!
        if (e.perception && e.perception.hasDirectSight) {
          e.fsm.setState(ENEMY_STATES.CHASE);
          return;
        }

        // Move cautiously toward last known coordinates
        const targetX = lastPos.x;
        const dx = targetX - (e.x + e.width * 0.5);
        e.facing = dx > 0 ? 1 : -1;
        e.dir = e.facing;

        if (Math.abs(dx) > 18) {
          if (!e.isFlying && !e.hasGroundAhead(level, 16)) {
            // Reached platform edge while investigating
            e.fsm.setState(ENEMY_STATES.SEARCH);
            return;
          }
          e.vx = e.facing * e.speed * 0.85;
        } else {
          // Arrived at last known spot and player is gone!
          e.fsm.setState(ENEMY_STATES.SEARCH);
        }
      },
    });

    // 5. CHASE: Direct pursuit with confirmed Line of Sight
    this.fsm.register(ENEMY_STATES.CHASE, {
      update: (e, dt, level, player) => {
        if (!player || player.isDead) {
          e.fsm.setState(ENEMY_STATES.RETURN);
          return;
        }

        // Check if line of sight was broken
        if (e.perception && !e.perception.hasDirectSight) {
          // Transition to investigate last known coordinates
          e.fsm.setState(ENEMY_STATES.INVESTIGATE);
          return;
        }

        e.faceTarget(player);

        const dx = player.x + player.width * 0.5 - (e.x + e.width * 0.5);
        const dy = player.y + player.height * 0.5 - (e.y + e.height * 0.5);
        const dist = Math.hypot(dx, dy);

        // Within striking distance: attempt to request attack token
        if (dist <= e.attackRange) {
          const tokenGranted = e.coordinator ? e.coordinator.requestAttackToken(e, e.role) : true;
          if (tokenGranted) {
            e.fsm.setState(ENEMY_STATES.ATTACK);
            return;
          } else {
            // Token denied (another enemy attacking): take tactical POSITION instead!
            e.fsm.setState(ENEMY_STATES.POSITION);
            return;
          }
        }

        // Approach player while respecting platform boundaries
        if (!e.isFlying && !e.hasGroundAhead(level, 20)) {
          e.vx = 0; // Don't leap to death! Hold edge
          e.fsm.setState(ENEMY_STATES.POSITION);
        } else {
          e.vx = e.facing * e.speed * 1.25;
        }
      },
    });

    // 6. POSITION: Tactical spacing, encirclement, or waiting for attack token
    this.fsm.register(ENEMY_STATES.POSITION, {
      onEnter: (e) => {
        e.searchTimer = 1.0 + Math.random() * 0.8;
      },
      update: (e, dt, level, player) => {
        if (!player || player.isDead) {
          e.fsm.setState(ENEMY_STATES.RETURN);
          return;
        }

        e.faceTarget(player);

        // Try requesting attack token again
        const tokenGranted = e.coordinator ? e.coordinator.requestAttackToken(e, e.role) : true;
        if (tokenGranted) {
          const dx = player.x - e.x;
          const dy = player.y - e.y;
          if (Math.hypot(dx, dy) <= e.attackRange * 1.2) {
            e.fsm.setState(ENEMY_STATES.ATTACK);
            return;
          } else {
            e.fsm.setState(ENEMY_STATES.CHASE);
            return;
          }
        }

        // Tactical positioning slot from coordinator
        const slot = e.coordinator ? e.coordinator.getTacticalSlot(e) : null;
        if (slot) {
          const slotDx = slot.targetX - (e.x + e.width * 0.5);
          if (Math.abs(slotDx) > 20) {
            if (e.isFlying || e.hasGroundAhead(level, 16)) {
              e.vx = Math.sign(slotDx) * e.speed * 0.8;
            } else {
              e.vx = 0;
            }
          } else {
            e.vx = 0;
          }
        } else {
          // Default pacing behavior
          e.vx = Math.sin(e.fsm.stateTime * 3) * (e.speed * 0.5);
        }

        // Lost sight check
        if (e.perception && !e.perception.hasDirectSight) {
          e.fsm.setState(ENEMY_STATES.INVESTIGATE);
        }
      },
    });

    // 7. ATTACK: Committed Strike (direction and trajectory locked)
    this.fsm.register(ENEMY_STATES.ATTACK, {
      onEnter: (e) => {
        e.attackCommitmentTimer = e.attackDuration;
        e.isTelegraphing = false;
        // Lock attack direction: CANNOT unnaturally pivot mid-attack
        e.attackDir = e.facing;
        e.vx = e.attackDir * e.speed * 1.6;
        e.scaleX = 1.25;
        e.scaleY = 0.85;
      },
      update: (e, dt, level, player) => {
        e.attackCommitmentTimer -= dt;
        e.vx = e.attackDir * e.speed * 1.6;

        // Ground edge check: stops before falling into pits
        if (!e.isFlying && !e.hasGroundAhead(level, 18)) {
          e.fsm.setState(ENEMY_STATES.RECOVER);
          return;
        }

        if (e.attackCommitmentTimer <= 0) {
          e.fsm.setState(ENEMY_STATES.RECOVER);
        }
      },
      onExit: (e) => {
        // Release coordinator attack token
        if (e.coordinator) {
          e.coordinator.releaseAttackToken(e);
        }
      },
    });

    // 8. EVADE: Dodging incoming attack, stomps, or dangerous hazards
    this.fsm.register(ENEMY_STATES.EVADE, {
      onEnter: (e) => {
        e.vx = -e.facing * (e.speed * 1.8);
        if (e.isFlying) e.vy = -120;
        e.scaleX = 0.8;
        e.scaleY = 1.3;
      },
      update: (e, dt) => {
        e.vx *= 0.92;
        if (e.fsm.stateTime > 0.4) {
          e.fsm.setState(ENEMY_STATES.CHASE);
        }
      },
    });

    // 9. RECOVER: Vulnerable punishment frames / exhaustion
    this.fsm.register(ENEMY_STATES.RECOVER, {
      onEnter: (e) => {
        e.vx = 0;
        e.isVulnerable = true;
        e.recoveryTimer = e.recoveryDuration;
        e.scaleX = 0.9;
        e.scaleY = 1.1;
      },
      update: (e, dt, level, player) => {
        e.recoveryTimer -= dt;
        // Panting wobble
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

    // 10. SEARCH: Lost direct sight; searches area, looks around
    this.fsm.register(ENEMY_STATES.SEARCH, {
      onEnter: (e) => {
        e.vx = 0;
        e.searchTimer = 2.4;
        e.searchLookTimer = 0.7;
        e.searchLooksCount = 0;
      },
      update: (e, dt, level, player) => {
        // If player spotted during search, immediate alert!
        if (e.perception && e.perception.hasDirectSight) {
          e.fsm.setState(ENEMY_STATES.AWARE);
          return;
        }

        e.searchTimer -= dt;
        e.searchLookTimer -= dt;

        if (e.searchLookTimer <= 0) {
          e.searchLookTimer = 0.8;
          e.facing = -e.facing; // Look the other way
          e.dir = e.facing;
          e.searchLooksCount++;
        }

        if (e.searchTimer <= 0 || e.searchLooksCount >= 3) {
          // Gave up search; return home
          if (e.perception) e.perception.clearMemory();
          e.fsm.setState(ENEMY_STATES.RETURN);
        }
      },
    });

    // 11. RETREAT: Disengage to safe distance or home post
    this.fsm.register(ENEMY_STATES.RETREAT, {
      onEnter: (e) => {
        e.vx = -e.facing * e.speed * 1.3;
      },
      update: (e, dt) => {
        if (e.fsm.stateTime > 0.8) {
          e.fsm.setState(ENEMY_STATES.RETURN);
        }
      },
    });

    // 12. RETURN: Return to spawn/patrol post
    this.fsm.register(ENEMY_STATES.RETURN, {
      update: (e, dt, level, player) => {
        // Spotted again during return?
        if (e.perception && e.perception.hasDirectSight) {
          e.fsm.setState(ENEMY_STATES.AWARE);
          return;
        }

        const dx = e.startX - e.x;
        if (Math.abs(dx) > 25) {
          e.facing = dx > 0 ? 1 : -1;
          e.dir = e.facing;
          if (e.isFlying || e.hasGroundAhead(level, 16)) {
            e.vx = e.facing * e.speed * 0.9;
          } else {
            e.vx = 0;
            e.fsm.setState(ENEMY_STATES.PATROL);
          }
        } else {
          // Arrived home
          e.x = e.startX;
          e.vx = 0;
          e.fsm.setState(ENEMY_STATES.PATROL);
        }
      },
    });

    // STATUS: HURT
    this.fsm.register(ENEMY_STATES.HURT, {
      onEnter: (e) => {
        e.flashWhiteTimer = 0.25;
      },
      update: (e, dt) => {
        if (e.fsm.stateTime > 0.35) {
          e.fsm.setState(ENEMY_STATES.RECOVER);
        }
      },
    });

    // STATUS: DEAD
    this.fsm.register(ENEMY_STATES.DEAD, {
      onEnter: (e) => {
        e.isDead = true;
        e.vx = 0;
        e.vy = 0;
        if (e.coordinator) {
          e.coordinator.releaseAttackToken(e);
        }
      },
      update: (e, dt) => {
        e.defeatTimer += dt;
      },
    });
  }

  /**
   * Main per-frame update loop.
   */
  update(dt, level, player, camera) {
    if (this.isDead) {
      this.defeatTimer += dt;
      return;
    }

    this.levelRef = level;
    if (level && level.encounterCoordinator) {
      this.coordinator = level.encounterCoordinator;
    }

    // Performance Culling: Skip calculation if far away from viewport
    if (camera && Math.abs(this.x - (camera.x + 960)) > 1700) {
      return;
    }

    if (this.flashWhiteTimer > 0) {
      this.flashWhiteTimer -= dt;
    }
    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer -= dt;
      if (this.invulnerableTimer <= 0) {
        this.isInvulnerable = false;
      }
    }

    // Smooth recovery of squash & stretch
    this.scaleX += (1 - this.scaleX) * 12 * dt;
    this.scaleY += (1 - this.scaleY) * 12 * dt;

    this.levelRef = level;
    this.targetPlayer = player;

    // 1. Sensory Perception Update (LOS, memory, reaction)
    if (this.perception) {
      this.perception.update(dt, level, player);
    }

    // 2. State Machine Update
    this.fsm.update(dt, level, player);

    // 3. Physics & Gravity
    if (!this.isFlying) {
      this.vy += this.gravity * dt;
      if (this.vy > 1200) this.vy = 1200;
    }

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // 4. Ground platform collision resolution
    if (!this.isFlying && level) {
      this.resolveGroundCollision(level);
    }
  }

  /**
   * Evaluates sensory perceptions during idle/patrol to initiate realistic transitions.
   */
  evaluateSensoryTransitions(level, player) {
    if (!this.perception || !player || player.isDead) return;

    if (this.perception.hasDirectSight) {
      this.target = player;
      this.fsm.setState(ENEMY_STATES.AWARE);
      if (this.levelRef?.audioRef?.playEnemyAlert) {
        this.levelRef.audioRef.playEnemyAlert();
      }
    } else if (this.perception.lastKnownPos && this.perception.lostSightTimer < 1.0) {
      this.fsm.setState(ENEMY_STATES.INVESTIGATE);
    }
  }

  /**
   * Backward-compatible alias for sensory check.
   */
  checkPlayerDetection(player) {
    this.evaluateSensoryTransitions(this.levelRef, player);
  }

  /**
   * Platform collision handling.
   */
  resolveGroundCollision(level) {
    const bounds = this.getBounds();
    const allPlatforms = level.getAllSolidPlatforms ? level.getAllSolidPlatforms() : (level?.platforms || []);

    for (const plat of allPlatforms) {
      const snapThreshold = Math.max(26, this.vy * 0.06 + 18);
      if (
        this.vy >= 0 &&
        bounds.x + bounds.width > plat.x &&
        bounds.x < plat.x + plat.width &&
        bounds.y + bounds.height >= plat.y &&
        bounds.y + bounds.height <= plat.y + snapThreshold
      ) {
        this.y = plat.y - this.height;
        this.vy = 0;
        this.isGrounded = true;
        return;
      }
    }
    this.isGrounded = false;
  }

  /**
   * Check if ground exists ahead to prevent falling off ledges.
   */
  hasGroundAhead(level, forwardOffset = 18) {
    if (!level) return true;
    const probeX = this.facing > 0 ? this.x + this.width + forwardOffset : this.x - forwardOffset;
    const probeY = this.y + this.height + 8;

    const allPlatforms = level.getAllSolidPlatforms ? level.getAllSolidPlatforms() : (level?.platforms || []);
    for (const plat of allPlatforms) {
      if (
        probeX >= plat.x &&
        probeX <= plat.x + plat.width &&
        probeY >= plat.y &&
        probeY <= plat.y + plat.height + 14
      ) {
        return true;
      }
    }
    return false;
  }

  /**
   * Patrol movement between designated bounds with ledge safety.
   */
  updatePatrolMovement(dt, level) {
    this.vx = this.dir * this.speed;
    this.facing = this.dir;

    if (this.dir > 0 && this.x + this.width >= this.patrolRight) {
      this.dir = -1;
      this.facing = -1;
    } else if (this.dir < 0 && this.x <= this.patrolLeft) {
      this.dir = 1;
      this.facing = 1;
    } else if (!this.isFlying && !this.hasGroundAhead(level)) {
      this.dir = -this.dir;
      this.facing = this.dir;
    }
  }

  /**
   * Predict target position based on player velocity.
   */
  predictTargetPosition(target, leadTime = 0.3) {
    if (this.perception) {
      return this.perception.predictTargetPosition(target, leadTime);
    }
    if (!target) return { x: this.x, y: this.y };
    return {
      x: target.x + target.width * 0.5 + (target.vx || 0) * leadTime,
      y: target.y + target.height * 0.5 + (target.vy || 0) * leadTime,
    };
  }

  /**
   * Anti-Stomp Evasion Reflex: detects if Aria is descending right on head.
   */
  checkAntiStompReflex(player, dt) {
    if (!player || player.isDead || player.vy <= 120) return false;
    const playerCenterX = player.x + player.width * 0.5;
    const myCenterX = this.x + this.width * 0.5;
    const dx = Math.abs(playerCenterX - myCenterX);
    const verticalGap = this.y - (player.y + player.height);

    return dx < 48 && verticalGap > 0 && verticalGap < 130;
  }

  faceTarget(target) {
    if (!target) return;
    const targetCenterX = target.x + (target.width ? target.width * 0.5 : 0);
    const myCenterX = this.x + this.width * 0.5;
    this.facing = targetCenterX > myCenterX ? 1 : -1;
    this.dir = this.facing;
  }

  /**
   * Fallback communication broadcast to nearby allies without coordinator.
   */
  notifyNearbyAllies(level) {
    if (!level || !level.enemies) return;
    const centerX = this.x + this.width * 0.5;
    const centerY = this.y + this.height * 0.5;

    level.enemies.forEach(ally => {
      if (ally === this || ally.isDead) return;
      const dist = Math.hypot(ally.x + ally.width * 0.5 - centerX, ally.y + ally.height * 0.5 - centerY);
      if (dist < this.alertRadius && ally.fsm.isAny('PATROL', 'IDLE', 'RETURN')) {
        setTimeout(() => {
          if (!ally.isDead && ally.fsm.isAny('PATROL', 'IDLE', 'RETURN')) {
            ally.target = this.target;
            ally.faceTarget(this.target || this);
            ally.fsm.setState(ENEMY_STATES.AWARE);
          }
        }, 160 + Math.random() * 180);
      }
    });
  }

  /**
   * Apply damage and knockback.
   */
  takeDamage(amount, knockbackX = 0, knockbackY = -350, audio = null) {
    if (this.isDead || this.isInvulnerable) return false;

    this.health -= amount;
    this.isInvulnerable = true;
    this.invulnerableTimer = 0.25;
    this.vx = knockbackX;
    this.vy = knockbackY;
    this.scaleX = 0.8;
    this.scaleY = 1.25;

    if (this.health <= 0) {
      this.health = 0;
      this.fsm.setState(ENEMY_STATES.DEAD);
      if (audio?.playEnemyDefeat) audio.playEnemyDefeat();
      return true;
    } else {
      this.fsm.setState(ENEMY_STATES.HURT);
      if (audio?.playEnemyHurt) audio.playEnemyHurt();
      return true;
    }
  }

  stomp(player, audio) {
    this.takeDamage(1, 0, -200, audio);
  }

  getBounds() {
    return {
      x: this.x + 4,
      y: this.y + 4,
      width: this.width - 8,
      height: this.height - 4,
    };
  }

  /**
   * Visual telegraph indicator:
   * Displays Suspicion '?', Alert '!', Attack Windup, or Exhausted recovery.
   */
  drawTelegraph(ctx) {
    const centerX = this.x + this.width * 0.5;
    const topY = this.y - 18;

    // 1. RECOVERY / EXHAUSTION TELEGRAPH: Panting sweat drops and exposed vulnerability
    if (this.fsm.is(ENEMY_STATES.RECOVER) || this.isVulnerable) {
      ctx.save();
      const wobble = Math.sin(this.fsm.stateTime * 10) * 3;
      ctx.fillStyle = '#38bdf8';
      ctx.shadowColor = '#0284c7';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      // Little sweat drop
      ctx.arc(centerX + 12 + wobble, topY - 4, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return;
    }

    // 2. ALERT & ATTACK TELEGRAPHS
    if (!this.isTelegraphing && !this.fsm.is(ENEMY_STATES.AWARE)) return;

    ctx.save();
    const pulse = 0.88 + Math.sin(this.fsm.stateTime * 14) * 0.12;
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 12 * pulse;

    // Diamond Plaque
    ctx.fillStyle = '#b91c1c';
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerX, topY - 14 * pulse);
    ctx.lineTo(centerX + 11 * pulse, topY);
    ctx.lineTo(centerX, topY + 14 * pulse);
    ctx.lineTo(centerX - 11 * pulse, topY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Exclamation Mark
    ctx.fillStyle = '#fef08a';
    ctx.shadowColor = '#fbbf24';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.roundRect(centerX - 2, topY - 8, 4, 9, 1.5);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(centerX, topY + 6, 2.2, 0, Math.PI * 2);
    ctx.fill();

    // Warning Sparks
    ctx.fillStyle = '#fbbf24';
    const sparkDist = 18 * pulse;
    for (let i = 0; i < 3; i++) {
      const angle = -Math.PI * 0.5 + (i - 1) * 0.6;
      const sx = centerX + Math.cos(angle) * sparkDist;
      const sy = topY + Math.sin(angle) * sparkDist;
      ctx.beginPath();
      ctx.arc(sx, sy, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  /**
   * AI Debug overlay:
   * Displays Line of Sight Ray, Vision Cone, State, Role, and Memory Position.
   */
  drawDebug(ctx) {
    ctx.save();
    const eyeX = this.x + this.width * 0.5;
    const eyeY = this.y + this.height * 0.35;

    // 1. Vision Cone Wireframe
    if (this.perception) {
      const range = this.perception.sightRange;
      const fov = this.perception.fovAngle;
      const baseAngle = this.facing > 0 ? 0 : Math.PI;

      ctx.strokeStyle = this.perception.hasDirectSight ? 'rgba(34, 197, 94, 0.45)' : 'rgba(239, 68, 68, 0.25)';
      ctx.fillStyle = this.perception.hasDirectSight ? 'rgba(34, 197, 94, 0.06)' : 'rgba(239, 68, 68, 0.03)';
      ctx.lineWidth = 1.5;

      ctx.beginPath();
      ctx.moveTo(eyeX, eyeY);
      ctx.arc(eyeX, eyeY, range, baseAngle - fov * 0.5, baseAngle + fov * 0.5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Peripheral Proximity Ring
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.3)';
      ctx.beginPath();
      ctx.arc(eyeX, eyeY, this.perception.peripheralRadius, 0, Math.PI * 2);
      ctx.stroke();

      // Line of Sight Ray to Player / Last Known Position
      if (this.perception.lastKnownPos) {
        ctx.strokeStyle = this.perception.hasDirectSight ? '#22c55e' : '#f59e0b';
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(eyeX, eyeY);
        ctx.lineTo(this.perception.lastKnownPos.x, this.perception.lastKnownPos.y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Last known position target marker
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(this.perception.lastKnownPos.x - 4, this.perception.lastKnownPos.y - 4, 8, 8);
      }
    }

    // 2. State & Role Info Label
    const labelX = this.x + this.width * 0.5;
    const labelY = this.y - 34;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 1;
    ctx.fillRect(labelX - 80, labelY - 32, 160, 44);
    ctx.strokeRect(labelX - 80, labelY - 32, 160, 44);

    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${this.name.toUpperCase()} [${this.role}]`, labelX, labelY - 18);

    ctx.fillStyle = this.fsm.is('ATTACK') ? '#ef4444' : this.fsm.is('RECOVER') ? '#38bdf8' : '#34d399';
    ctx.fillText(`STATE: ${this.fsm.currentState} | HP: ${this.health}/${this.maxHealth}`, labelX, labelY - 6);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '9px monospace';
    const losTxt = this.perception?.hasDirectSight ? 'LOS: YES' : 'LOS: NO';
    ctx.fillText(`${losTxt} | T-LOCK: ${this.coordinator?.primaryTokenHolder === this ? 'TOKEN_HELD' : 'FREE'}`, labelX, labelY + 6);

    ctx.restore();
  }
}
