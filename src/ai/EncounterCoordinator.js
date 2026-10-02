/**
 * ENCOUNTER ROLES
 * Canonical tactical roles for coordinated enemy encounters.
 */
export const ENCOUNTER_ROLES = {
  PRESSURE: 'PRESSURE',         // Ground or relentless forward pace keeping player mobile
  CONTROL: 'CONTROL',           // Heavy, armored, or zone-commanding presence
  AMBUSH: 'AMBUSH',             // Vertical lurker or surprise dive predator
  DISTRACTION: 'DISTRACTION',   // Evasive harasser drawing attention and jump baits
  AREA_DENIAL: 'AREA_DENIAL',   // Denies safe landing spots or platforms
  CHASE: 'CHASE',               // Direct persistent tracker
  PROTECTION: 'PROTECTION',     // Guards key landmark, objective, or ally
};

/**
 * ENCOUNTER COORDINATOR
 * Orchestrates multi-enemy group combat dynamics to eliminate chaotic spam
 * and create readable, rhythmic, and strategic Soulslike/Metroidvania encounters.
 * 
 * Responsibilities:
 * - Attack Token Management (Limits simultaneous strikes: 1 Primary + 1 Harasser)
 * - Dynamic Role Assignment based on enemy species and environmental context
 * - Flanking Slot Distribution (prevents sprite clumping and coordinates encirclement)
 * - Group Sight Broadcasting (organic alert spread with staggered reaction times)
 * - Terrain & Tactical Synergy Awareness (e.g. Ground Pressure + Air Harassment)
 */
export class EncounterCoordinator {
  constructor() {
    this.enemies = [];

    // Attack token configuration
    this.primaryTokenHolder = null;
    this.harasserTokenHolder = null;
    this.tokenCooldownTimer = 0;
    this.minTokenInterval = 0.65; // Seconds between successive attack permits

    // Tactical slot assignments: Map of enemyId -> { slotType, offsetX, offsetY }
    this.tacticalSlots = new Map();

    // Group Alert State
    this.groupAlerted = false;
    this.lastAlertTime = 0;
    this.alertOrigin = null;

    // Metrics for HUD / Director
    this.activeEngagementsCount = 0;
    this.activeSynergy = null; // e.g. "GROUND_AIR_PINCER"
  }

  /**
   * Register or synchronize enemies present in the level.
   * @param {Array} enemies 
   */
  registerEnemies(enemies = []) {
    this.enemies = enemies;
  }

  /**
   * Per-frame coordinator tick.
   * @param {number} dt 
   * @param {Object} level 
   * @param {Object} player 
   */
  update(dt, level, player) {
    if (this.tokenCooldownTimer > 0) {
      this.tokenCooldownTimer -= dt;
    }

    // Filter alive enemies
    const activeEnemies = this.enemies.filter(e => !e.isDead);

    // Validate current token holders (release if dead, inactive, or no longer attacking)
    if (this.primaryTokenHolder) {
      if (
        this.primaryTokenHolder.isDead ||
        !this.primaryTokenHolder.fsm.is('ATTACK')
      ) {
        this.primaryTokenHolder = null;
      }
    }

    if (this.harasserTokenHolder) {
      if (
        this.harasserTokenHolder.isDead ||
        !this.harasserTokenHolder.fsm.is('ATTACK')
      ) {
        this.harasserTokenHolder = null;
      }
    }

    if (!player || player.isDead) {
      this.groupAlerted = false;
      this.activeSynergy = null;
      return;
    }

    // Analyze engaged enemies (those aware of or chasing player)
    const engagedEnemies = activeEnemies.filter(e =>
      e.fsm.isAny('AWARE', 'CHASE', 'POSITION', 'ATTACK', 'EVADE') ||
      (e.perception && e.perception.hasDirectSight)
    );

    this.activeEngagementsCount = engagedEnemies.length;
    this.groupAlerted = engagedEnemies.length > 0;

    // Assign tactical flanking slots to engaged enemies
    this.distributeTacticalSlots(engagedEnemies, player);

    // Detect environment & role synergies
    this.evaluateSynergies(engagedEnemies, player, level);
  }

  /**
   * Distribute tactical spacing and flanking positions so enemies surround player
   * instead of clumping into a single overlapping hitbox.
   */
  distributeTacticalSlots(engagedEnemies, player) {
    if (engagedEnemies.length === 0) return;

    // Sort engaged enemies by distance to player
    engagedEnemies.sort((a, b) => {
      const distA = Math.hypot(a.x - player.x, a.y - player.y);
      const distB = Math.hypot(b.x - player.x, b.y - player.y);
      return distA - distB;
    });

    let assignedLeft = false;
    let assignedRight = false;

    engagedEnemies.forEach((enemy, idx) => {
      let preferredOffsetX = 0;
      let preferredOffsetY = 0;

      if (enemy.isFlying) {
        // Flying enemies hover overhead with horizontal offset
        preferredOffsetX = (idx % 2 === 0 ? 1 : -1) * (110 + idx * 30);
        preferredOffsetY = -130;
      } else {
        // Ground enemies split left and right flanks
        if (!assignedRight && enemy.x >= player.x) {
          preferredOffsetX = 110;
          assignedRight = true;
        } else if (!assignedLeft && enemy.x < player.x) {
          preferredOffsetX = -110;
          assignedLeft = true;
        } else if (!assignedLeft) {
          preferredOffsetX = -120;
          assignedLeft = true;
        } else {
          preferredOffsetX = 130;
          assignedRight = true;
        }
      }

      this.tacticalSlots.set(enemy, {
        offsetX: preferredOffsetX,
        offsetY: preferredOffsetY,
        targetX: player.x + player.width * 0.5 + preferredOffsetX,
        targetY: player.y + player.height * 0.5 + preferredOffsetY,
      });
    });
  }

  /**
   * Query the assigned tactical position offset for a specific enemy.
   */
  getTacticalSlot(enemy) {
    return this.tacticalSlots.get(enemy) || null;
  }

  /**
   * Request permission to launch an attack.
   * Enforces token throttling so player faces choreographed, readable attacks.
   * @param {Object} enemy 
   * @param {string} role - 'primary' | 'harasser'
   * @returns {boolean} Whether attack is permitted
   */
  requestAttackToken(enemy, role = 'primary') {
    if (this.tokenCooldownTimer > 0) return false;

    // If already holds a token, continue
    if (this.primaryTokenHolder === enemy || this.harasserTokenHolder === enemy) {
      return true;
    }

    // Flying/harassers can take the secondary token
    if (enemy.isFlying || role === 'harasser') {
      if (!this.harasserTokenHolder) {
        this.harasserTokenHolder = enemy;
        return true;
      }
      return false;
    }

    // Ground/primary heavy attack token
    if (!this.primaryTokenHolder) {
      this.primaryTokenHolder = enemy;
      return true;
    }

    return false; // Token currently denied; enemy should POSITION or wait!
  }

  /**
   * Explicitly release an attack token (e.g. entering RECOVER or STUN).
   * @param {Object} enemy 
   */
  releaseAttackToken(enemy) {
    if (this.primaryTokenHolder === enemy) {
      this.primaryTokenHolder = null;
      this.tokenCooldownTimer = this.minTokenInterval;
    }
    if (this.harasserTokenHolder === enemy) {
      this.harasserTokenHolder = null;
    }
  }

  /**
   * Broadcast an alert from an enemy who sighted Aria to nearby comrades.
   * Staggers responses with organic reaction delays.
   * @param {Object} sourceEnemy 
   * @param {Object} targetPlayer 
   * @param {number} alertRadius 
   */
  broadcastAlert(sourceEnemy, targetPlayer, alertRadius = 320) {
    const srcX = sourceEnemy.x + sourceEnemy.width * 0.5;
    const srcY = sourceEnemy.y + sourceEnemy.height * 0.5;

    this.enemies.forEach(ally => {
      if (ally === sourceEnemy || ally.isDead) return;

      const allyX = ally.x + ally.width * 0.5;
      const allyY = ally.y + ally.height * 0.5;
      const dist = Math.hypot(allyX - srcX, allyY - srcY);

      if (dist <= alertRadius) {
        // Staggered awareness trigger: only if currently idle, patrolling, or searching
        if (ally.fsm.isAny('IDLE', 'PATROL', 'SEARCH', 'RETURN')) {
          const delay = 140 + Math.random() * 220; // 140ms - 360ms organic delay
          setTimeout(() => {
            if (!ally.isDead && ally.fsm.isAny('IDLE', 'PATROL', 'SEARCH', 'RETURN')) {
              if (ally.perception) {
                ally.perception.lastKnownPos = {
                  x: targetPlayer.x + targetPlayer.width * 0.5,
                  y: targetPlayer.y + targetPlayer.height * 0.5,
                };
                ally.perception.awareness = 0.8;
              }
              ally.faceTarget(targetPlayer);
              ally.fsm.setState('AWARE');
            }
          }, delay);
        }
      }
    });
  }

  /**
   * Evaluate active synergy combinations:
   * e.g. Ground Pressure (Grub/Beetle) + Air Pressure (Wisp/Firefly) on Narrow Bridge.
   */
  evaluateSynergies(engagedEnemies, player, level) {
    let hasGroundPressure = false;
    let hasAirPressure = false;
    let hasArmoredControl = false;

    for (const e of engagedEnemies) {
      if (e.isFlying) hasAirPressure = true;
      else if (e.species === 'beetle') hasArmoredControl = true;
      else hasGroundPressure = true;
    }

    // Check if player is on the narrow suspended bridge (x: 920-1180)
    const onBridge = player.x >= 900 && player.x <= 1200 && player.y <= 660 && player.y >= 580;

    if (hasGroundPressure && hasAirPressure && onBridge) {
      this.activeSynergy = 'BRIDGE_PINCER'; // Ground pressure + aerial interception on narrow bridge!
    } else if (hasGroundPressure && hasAirPressure) {
      this.activeSynergy = 'GROUND_AIR_COORDINATION';
    } else if (hasArmoredControl && hasAirPressure) {
      this.activeSynergy = 'ARMORED_AERIAL_SIEGE';
    } else if (engagedEnemies.length >= 2) {
      this.activeSynergy = 'DUAL_FLANK';
    } else {
      this.activeSynergy = null;
    }
  }

  /**
   * Reset coordinator on level restart.
   */
  reset() {
    this.primaryTokenHolder = null;
    this.harasserTokenHolder = null;
    this.tokenCooldownTimer = 0;
    this.tacticalSlots.clear();
    this.groupAlerted = false;
    this.activeSynergy = null;
    this.activeEngagementsCount = 0;
  }
}
