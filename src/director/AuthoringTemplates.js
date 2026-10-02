/**
 * AUTHORING TEMPLATES SYSTEM
 * 
 * Provides structured, designer-authorable templates for Project Aria:
 * 1. EncounterTemplate
 * 2. TraversalTemplate
 * 3. ExplorationTemplate
 * 4. SecretTemplate
 * 5. RewardTemplate
 * 6. CinematicTemplate
 * 7. EnvironmentalEventTemplate
 * 
 * Every template supports curated, authored candidate variants.
 * The AI Level Director selects among these designer-approved variants based on
 * telemetry and pacing curves, creating intelligent authored variation without
 * procedural randomness or rule-cheating.
 */

// --- 1. ENCOUNTER TEMPLATE ---
export class EncounterTemplate {
  constructor(config = {}) {
    this.id = config.id || 'encounter_default';
    this.name = config.name || 'Authored Encounter';
    this.beatAffinity = config.beatAffinity || 'CHALLENGE';
    this.routeAffinity = config.routeAffinity || 'STANDARD_ROUTE';
    this.triggerX = config.triggerX || 900;
    this.activationRadius = config.activationRadius || 450;
    
    // Authored candidate variants
    // Each variant is an array of enemy definitions: { type, x, y, patrolMinX, patrolMaxX, params }
    this.variants = config.variants || {
      // Gentle variant for struggling or recovering players
      RELAXED: [
        { type: 'grub', x: 1020, y: 880, patrolLeft: 880, patrolRight: 1140 },
      ],
      // Standard intended designer baseline
      STANDARD: [
        { type: 'grub', x: 1020, y: 880, patrolLeft: 840, patrolRight: 1180 },
      ],
      // Dynamic tactical variation for high-skill or advanced route players
      TACTICAL: [
        { type: 'grub', x: 980, y: 880, patrolLeft: 840, patrolRight: 1120 },
        { type: 'wisp', x: 1100, y: 700, amplitude: 35, frequency: 1.5 },
      ],
    };

    this.cooldown = config.cooldown || 10.0;
    this.triggered = false;
    this.selectedVariant = 'STANDARD';
  }

  /**
   * Intelligently select a designer-authored variant based on telemetry signals.
   */
  resolveVariant(telemetry) {
    // If player has taken multiple hits recently or is at critical health, choose RELAXED
    if (telemetry.playerHealth.isCritical || telemetry.damageLast10s >= 2) {
      this.selectedVariant = 'RELAXED';
    }
    // If player is on the ADVANCED route with high fluency and full health, choose TACTICAL
    else if (
      telemetry.currentRoute === 'ADVANCED_ROUTE' &&
      telemetry.playerSkillSignals.compositeSkillTier === 'MASTER' &&
      telemetry.playerHealth.ratio >= 0.7
    ) {
      this.selectedVariant = 'TACTICAL';
    } else {
      this.selectedVariant = 'STANDARD';
    }
    return this.variants[this.selectedVariant] || this.variants.STANDARD;
  }
}

// --- 2. TRAVERSAL TEMPLATE ---
export class TraversalTemplate {
  constructor(config = {}) {
    this.id = config.id || 'traversal_default';
    this.name = config.name || 'Authored Traversal';
    this.beatAffinity = config.beatAffinity || 'TEACH';
    this.platforms = config.platforms || [];
    
    // Authored Grace Aid: e.g., an auxiliary climbing vine or lower bounce mushroom
    // deployed only if the player has suffered repeated falls on this traversal
    this.graceAid = config.graceAid || null; // { type: 'climbable_vine', x, y, width, height }
    this.graceAidActive = false;
  }

  evaluateGrace(telemetry) {
    if (this.graceAid && telemetry.consecutiveFailures >= 2 && !this.graceAidActive) {
      this.graceAidActive = true;
      return this.graceAid;
    }
    return null;
  }
}

// --- 3. EXPLORATION TEMPLATE ---
export class ExplorationTemplate {
  constructor(config = {}) {
    this.id = config.id || 'exploration_default';
    this.name = config.name || 'Authored Exploration Opportunity';
    this.zoneId = config.zoneId || 'canopy_high_bough';
    this.beatAffinity = config.beatAffinity || 'EXPLORATION';
    
    // Subtle environmental guide cues (e.g. fluttering azure butterflies or gentle stardust)
    this.hintCues = config.hintCues || [
      { type: 'butterflies', x: 1260, y: 520, count: 3, color: '#38bdf8' },
      { type: 'sparkle_trail', x: 1260, y: 600 },
    ];

    this.hintActive = false;
  }

  /**
   * Activate visual cues if player exhibits curious exploration behavior or is in EXPLORATION beat.
   */
  shouldHighlight(telemetry) {
    return telemetry.explorationBehavior.curiosityScore > 0.45;
  }
}

// --- 4. SECRET TEMPLATE ---
export class SecretTemplate {
  constructor(config = {}) {
    this.id = config.id || 'secret_default';
    this.name = config.name || 'Authored Secret';
    this.triggerBounds = config.triggerBounds || { minX: 1240, maxX: 1460, minY: 300, maxY: 490 };
    this.bannerText = config.bannerText || '✨ SECRET DISCOVERY: SUNSTONE CANOPY SANCTUM (+500 PTS)';
    this.rewardScore = config.rewardScore || 500;
    this.soundHook = config.soundHook || 'playSecret';
    this.discovered = false;
  }

  checkTrigger(x, y) {
    if (this.discovered) return false;
    const b = this.triggerBounds;
    if (x >= b.minX && x <= b.maxX && y >= b.minY && y <= b.maxY) {
      this.discovered = true;
      return true;
    }
    return false;
  }
}

// --- 5. REWARD TEMPLATE ---
export const REWARD_TIERS = {
  STANDARD_SHARD: 'STANDARD_SHARD',
  ROYAL_CLUSTER: 'ROYAL_CLUSTER',
  SUN_CRYSTAL: 'SUN_CRYSTAL',
  NECTAR_HEART: 'NECTAR_HEART', // Health recovery
};

export class RewardTemplate {
  constructor(config = {}) {
    this.id = config.id || 'reward_default';
    this.tier = config.tier || REWARD_TIERS.STANDARD_SHARD;
    this.x = config.x || 0;
    this.y = config.y || 0;
    this.routeAffinity = config.routeAffinity || 'STANDARD_ROUTE';
    this.isDynamicRecovery = config.isDynamicRecovery || false;
    this.spawned = false;
  }

  /**
   * Determine reward payload based on player health & route.
   * If player is in critical health approaching recovery, deploy NECTAR_HEART.
   */
  resolveRewardTier(telemetry) {
    if (this.isDynamicRecovery && telemetry.playerHealth.isCritical) {
      return REWARD_TIERS.NECTAR_HEART;
    }
    if (telemetry.currentRoute === 'SECRET_ROUTE') {
      return REWARD_TIERS.SUN_CRYSTAL;
    }
    if (telemetry.currentRoute === 'ADVANCED_ROUTE') {
      return REWARD_TIERS.ROYAL_CLUSTER;
    }
    return this.tier;
  }
}

// --- 6. CINEMATIC TEMPLATE ---
export class CinematicTemplate {
  constructor(config = {}) {
    this.id = config.id || 'cinematic_default';
    this.name = config.name || 'Authored Cinematic Moment';
    this.triggerX = config.triggerX || 2050;
    this.letterboxHeight = config.letterboxHeight || 48;
    this.duration = config.duration || 4.5;
    this.cameraFocusX = config.cameraFocusX || 2100;
    this.cameraFocusY = config.cameraFocusY || 840;
    this.bannerTitle = config.bannerTitle || '✨ THE ANCIENT SUNSTONE SHRINE AWAKENS ✨';
    this.bannerSubtitle = config.bannerSubtitle || 'The Sacred Sanctuary of Batboy is Restored';
    this.audioHook = config.audioHook || 'playLevelComplete';
    this.triggered = false;
  }

  checkTrigger(playerX) {
    if (!this.triggered && playerX >= this.triggerX) {
      this.triggered = true;
      return true;
    }
    return false;
  }
}

// --- 7. ENVIRONMENTAL EVENT TEMPLATE ---
export class EnvironmentalEventTemplate {
  constructor(config = {}) {
    this.id = config.id || 'env_event_default';
    this.name = config.name || 'Authored Environmental Event';
    this.beatTrigger = config.beatTrigger || 'ESCALATION';
    this.windShift = config.windShift || { windX: 45, windY: 12 };
    this.pollenBurst = config.pollenBurst !== undefined ? config.pollenBurst : true;
    this.cameraShake = config.cameraShake || { intensity: 3, duration: 0.35 };
    this.soundCue = config.soundCue || 'queen_rumble';
    this.triggered = false;
  }

  shouldTrigger(activeBeatName) {
    if (!this.triggered && activeBeatName === this.beatTrigger) {
      this.triggered = true;
      return true;
    }
    return false;
  }
}
