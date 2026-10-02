import { Collision } from '../physics/Collision.js';

/**
 * ENEMY PERCEPTION SYSTEM
 * Provides realistic, non-omniscient sensory awareness for Project Aria enemies.
 * 
 * Features:
 * - Line of Sight (LOS) raycasting through level platforms
 * - Forward Vision Cone (FOV) with direction bias
 * - Close-range peripheral / auditory proximity sense
 * - Human-like reaction time delay (prevents instant superhuman snaps)
 * - Limited memory buffer (tracks last known position before losing sight)
 * - Target velocity prediction (can be baited/juked by player movement)
 * - Awareness meter (0.0 to 1.0) driving '?' -> '!' telegraphs
 */
export class EnemyPerception {
  constructor(owner, config = {}) {
    this.owner = owner;

    // Vision configuration
    this.sightRange = config.sightRange || 320;
    this.fovAngle = config.fovAngle || (Math.PI * 0.72); // ~130 degrees forward cone
    this.peripheralRadius = config.peripheralRadius || 75; // Close hearing/proximity radius
    this.verticalTolerance = config.verticalTolerance || 240; // Max vertical difference for vision

    // Reaction and Memory
    this.reactionDelay = config.reactionDelay || 0.22; // Seconds to react upon sighting
    this.reactionTimer = 0;
    this.memoryDuration = config.memoryDuration || 3.0; // Seconds before forgetting player
    this.lostSightTimer = 0;

    // Perception state
    this.hasDirectSight = false;
    this.lastKnownPos = null; // { x, y }
    this.awareness = 0; // 0 = unaware, 0.5 = suspicious, 1.0 = fully engaged
    this.wasVisibleLastFrame = false;
    this.investigationTarget = null;
  }

  /**
   * Main perception evaluation per frame.
   * @param {number} dt 
   * @param {Object} level 
   * @param {Object} player 
   * @returns {Object} Perception report
   */
  update(dt, level, player) {
    if (!player || player.isDead) {
      this.hasDirectSight = false;
      this.awareness = Math.max(0, this.awareness - dt * 2);
      return {
        hasDirectSight: false,
        awareness: this.awareness,
        lastKnownPos: null,
      };
    }

    const eyeX = this.owner.x + this.owner.width * 0.5;
    const eyeY = this.owner.y + this.owner.height * 0.35;

    // Check multiple target points (center, top, bottom) to prevent partial occlusion misses
    const targetPoints = [
      { x: player.x + player.width * 0.5, y: player.y + player.height * 0.5 },
      { x: player.x + player.width * 0.5, y: player.y + 8 },
      { x: player.x + player.width * 0.5, y: player.y + player.height - 8 },
    ];

    const dx = targetPoints[0].x - eyeX;
    const dy = targetPoints[0].y - eyeY;
    const dist = Math.hypot(dx, dy);

    let canSense = false;

    // 1. Proximity / Peripheral Hearing Sense (cannot hide within breathing distance)
    if (dist <= this.peripheralRadius) {
      canSense = true;
    } 
    // 2. Vision Cone Check
    else if (dist <= this.sightRange && Math.abs(dy) <= this.verticalTolerance) {
      const angleToTarget = Math.atan2(dy, dx);
      const facingAngle = this.owner.facing > 0 ? 0 : Math.PI;

      // Angular difference wrapped between -PI and PI
      let angleDiff = Math.abs(angleToTarget - facingAngle);
      if (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff;

      if (angleDiff <= this.fovAngle * 0.5) {
        canSense = true;
      }
    }

    // 3. Line of Sight Raycasting (if in cone or proximity, check solid platforms)
    let visible = false;
    if (canSense) {
      const platforms = level && level.getAllSolidPlatforms ? level.getAllSolidPlatforms() : (level?.platforms || []);
      
      for (const pt of targetPoints) {
        if (Collision.hasLineOfSight(eyeX, eyeY, pt.x, pt.y, platforms)) {
          visible = true;
          break;
        }
      }
    }

    this.hasDirectSight = visible;

    // Update memory and awareness metrics
    if (visible) {
      this.lostSightTimer = 0;
      this.lastKnownPos = {
        x: player.x + player.width * 0.5,
        y: player.y + player.height * 0.5,
      };

      // Reaction time progression
      if (!this.wasVisibleLastFrame) {
        this.reactionTimer = this.reactionDelay;
      } else if (this.reactionTimer > 0) {
        this.reactionTimer -= dt;
      }

      this.awareness = Math.min(1.0, this.awareness + dt * 4);
    } else {
      // Senses lost: memory decay
      if (this.lastKnownPos) {
        this.lostSightTimer += dt;
        if (this.lostSightTimer >= this.memoryDuration) {
          this.lastKnownPos = null; // Memory expired!
        }
      }
      this.awareness = Math.max(0, this.awareness - dt * 0.6);
    }

    this.wasVisibleLastFrame = visible;

    return {
      hasDirectSight: this.hasDirectSight,
      awareness: this.awareness,
      isReactionReady: this.reactionTimer <= 0,
      lastKnownPos: this.lastKnownPos,
      lostSightTimer: this.lostSightTimer,
      distanceToPlayer: dist,
    };
  }

  /**
   * Predictive Lead Position Calculation:
   * Predicts where Aria will be in `leadTime` seconds based on player velocity.
   * Can be baited/juked by player sudden stop or jump!
   */
  predictTargetPosition(target, leadTime = 0.3) {
    if (!target) return this.lastKnownPos || { x: this.owner.x, y: this.owner.y };
    const pVx = target.vx || 0;
    const pVy = target.vy || 0;
    return {
      x: (target.x + target.width * 0.5) + pVx * leadTime,
      y: (target.y + target.height * 0.5) + pVy * leadTime,
    };
  }

  /**
   * Clear memory immediately (e.g. after successful search or reset).
   */
  clearMemory() {
    this.lastKnownPos = null;
    this.lostSightTimer = 0;
    this.awareness = 0;
  }
}
