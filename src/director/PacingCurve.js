/**
 * PACING CURVE & BEAT SYSTEM
 * 
 * Defines the canonical 10-beat narrative & emotional pacing architecture for Project Aria:
 * QUIET → DISCOVERY → TEACH → CHALLENGE → RELIEF → EXPLORATION → ESCALATION → SET_PIECE → RECOVERY → CLIMAX
 * 
 * Supports:
 * - Data structures allowing level designers to author custom progression curves per level/act
 * - Dynamic beat evaluation based on player progress, time, and telemetry
 * - Non-cheating pacing modulation (Director holds/eases beats without altering physics or rules)
 */

export const PACING_BEATS = {
  QUIET: 'QUIET',
  DISCOVERY: 'DISCOVERY',
  TEACH: 'TEACH',
  CHALLENGE: 'CHALLENGE',
  RELIEF: 'RELIEF',
  EXPLORATION: 'EXPLORATION',
  ESCALATION: 'ESCALATION',
  SET_PIECE: 'SET_PIECE',
  RECOVERY: 'RECOVERY',
  CLIMAX: 'CLIMAX',
};

export const PACING_BEAT_ORDER = [
  PACING_BEATS.QUIET,
  PACING_BEATS.DISCOVERY,
  PACING_BEATS.TEACH,
  PACING_BEATS.CHALLENGE,
  PACING_BEATS.RELIEF,
  PACING_BEATS.EXPLORATION,
  PACING_BEATS.ESCALATION,
  PACING_BEATS.SET_PIECE,
  PACING_BEATS.RECOVERY,
  PACING_BEATS.CLIMAX,
];

/**
 * Single authored beat within a level's pacing curve.
 */
export class PacingBeat {
  constructor(config = {}) {
    this.name = config.name || PACING_BEATS.QUIET;
    this.title = config.title || this.name;
    this.description = config.description || '';
    
    // Spatial boundary coordinates along primary progression axis
    this.minX = config.minX !== undefined ? config.minX : 0;
    this.maxX = config.maxX !== undefined ? config.maxX : 1000;
    
    // Target emotional & combat intensity (0.0 = calm/peaceful, 1.0 = peak climax)
    this.targetIntensity = config.targetIntensity !== undefined ? config.targetIntensity : 0.2;
    
    // Pacing rules
    this.minDuration = config.minDuration || 1.5; // Minimum time in seconds to hold beat
    this.maxDuration = config.maxDuration || 35.0; // Max time before director suggests gentle push
    this.allowEncounters = config.allowEncounters !== undefined ? config.allowEncounters : true;
    this.maxEncounterIntensity = config.maxEncounterIntensity !== undefined ? config.maxEncounterIntensity : 0.5;
    
    // Director affordances
    this.recoveryOpportunity = config.recoveryOpportunity || false;
    this.explorationIncentive = config.explorationIncentive || false;
    this.cinematicAffinity = config.cinematicAffinity || false;
    
    // Environmental styling parameters associated with this beat
    this.environmentMood = config.environmentMood || {
      windStrength: 25,
      pollenDensity: 0.5,
      audioIntensity: 0.3,
      lightingWarmth: 0.8,
    };
    
    // Optional custom trigger predicate: (telemetry) => boolean
    this.customTrigger = config.customTrigger || null;
  }

  /**
   * Check if a world X coordinate falls inside this beat's spatial envelope.
   */
  containsX(x) {
    return x >= this.minX && x < this.maxX;
  }

  /**
   * Normalized completion progress (0.0 to 1.0) within this beat.
   */
  getProgress(x) {
    if (this.maxX <= this.minX) return 1.0;
    return Math.max(0, Math.min(1, (x - this.minX) / (this.maxX - this.minX)));
  }
}

/**
 * PacingCurve manages an ordered sequence of PacingBeats.
 */
export class PacingCurve {
  constructor(beats = []) {
    this.beats = beats.map(b => (b instanceof PacingBeat ? b : new PacingBeat(b)));
    this.activeBeatIndex = 0;
    this.beatTimer = 0;
  }

  /**
   * Reset curve progress to beginning.
   */
  reset() {
    this.activeBeatIndex = 0;
    this.beatTimer = 0;
  }

  /**
   * Get the currently active beat.
   */
  get currentBeat() {
    return this.beats[this.activeBeatIndex] || this.beats[0] || null;
  }

  /**
   * Find which beat spatially contains the given player X coordinate.
   */
  getBeatForX(x) {
    for (let i = 0; i < this.beats.length; i++) {
      if (this.beats[i].containsX(x)) {
        return { beat: this.beats[i], index: i };
      }
    }
    // Fallback to last beat if beyond range
    if (this.beats.length > 0 && x >= this.beats[this.beats.length - 1].maxX) {
      return { beat: this.beats[this.beats.length - 1], index: this.beats.length - 1 };
    }
    return { beat: this.beats[0], index: 0 };
  }

  /**
   * Evaluate curve progression based on player position and telemetry signals.
   * Returns true if a beat transition occurred.
   */
  update(dt, telemetry) {
    this.beatTimer += dt;
    const current = this.currentBeat;
    if (!current) return false;

    // 1. Check spatial location
    const spatial = this.getBeatForX(telemetry.playerPosition.x);
    
    // 2. Check if we should advance to the spatially matching beat
    if (spatial.index !== this.activeBeatIndex) {
      // Respect minDuration so player doesn't flicker through beats if dashing across borders
      if (this.beatTimer >= current.minDuration) {
        this.transitionTo(spatial.index);
        return true;
      }
    }

    // 3. Custom trigger override if provided by designer
    if (current.customTrigger && typeof current.customTrigger === 'function') {
      if (current.customTrigger(telemetry, this.beatTimer)) {
        if (this.activeBeatIndex + 1 < this.beats.length) {
          this.transitionTo(this.activeBeatIndex + 1);
          return true;
        }
      }
    }

    return false;
  }

  transitionTo(index) {
    if (index >= 0 && index < this.beats.length) {
      this.activeBeatIndex = index;
      this.beatTimer = 0;
    }
  }

  /**
   * Creates the standard canonical vertical slice pacing curve for Honeywood Glade (2,600px).
   */
  static createDefaultHoneywoodCurve() {
    return new PacingCurve([
      new PacingBeat({
        name: PACING_BEATS.QUIET,
        title: 'Arrival & Morning Dew',
        description: 'Quiet atmospheric arrival in the outer clearing. Zero combat threat.',
        minX: 0,
        maxX: 460,
        targetIntensity: 0.1,
        minDuration: 1.5,
        allowEncounters: false,
        maxEncounterIntensity: 0.0,
        recoveryOpportunity: true,
        environmentMood: { windStrength: 15, pollenDensity: 0.4, audioIntensity: 0.2, lightingWarmth: 0.85 },
      }),
      new PacingBeat({
        name: PACING_BEATS.DISCOVERY,
        title: 'The Glade Marker',
        description: 'First ancient road sign and mossy oak roots. Glimpses of deep canopy.',
        minX: 460,
        maxX: 660,
        targetIntensity: 0.25,
        minDuration: 1.2,
        allowEncounters: false,
        maxEncounterIntensity: 0.1,
        environmentMood: { windStrength: 20, pollenDensity: 0.5, audioIntensity: 0.35, lightingWarmth: 0.8 },
      }),
      new PacingBeat({
        name: PACING_BEATS.TEACH,
        title: 'Low Oak Bough & Vine',
        description: 'Introduction to vertical traversal: low oak bough platform and hanging ivy vine.',
        minX: 660,
        maxX: 880,
        targetIntensity: 0.4,
        minDuration: 1.5,
        allowEncounters: false,
        maxEncounterIntensity: 0.2,
        environmentMood: { windStrength: 22, pollenDensity: 0.6, audioIntensity: 0.45, lightingWarmth: 0.8 },
      }),
      new PacingBeat({
        name: PACING_BEATS.CHALLENGE,
        title: 'Rope Bridge Crossing',
        description: 'Suspended wooden bridge platforming with parabolic shard arc & patrolling Hive Grub below.',
        minX: 880,
        maxX: 1220,
        targetIntensity: 0.65,
        minDuration: 2.0,
        allowEncounters: true,
        maxEncounterIntensity: 0.65,
        environmentMood: { windStrength: 30, pollenDensity: 0.7, audioIntensity: 0.65, lightingWarmth: 0.75 },
      }),
      new PacingBeat({
        name: PACING_BEATS.RELIEF,
        title: 'Sunstone Landing Terrace',
        description: 'Carved sunstone slab landing. Checkpoint resonance, breath of relief.',
        minX: 1220,
        maxX: 1340,
        targetIntensity: 0.25,
        minDuration: 1.2,
        allowEncounters: false,
        maxEncounterIntensity: 0.15,
        recoveryOpportunity: true,
        environmentMood: { windStrength: 18, pollenDensity: 0.45, audioIntensity: 0.3, lightingWarmth: 0.85 },
      }),
      new PacingBeat({
        name: PACING_BEATS.EXPLORATION,
        title: 'Canopy Secret Sanctum',
        description: 'Optional high route branching upward toward wild golden honeycomb & floating sun crystal.',
        minX: 1340,
        maxX: 1600,
        targetIntensity: 0.45,
        minDuration: 2.0,
        allowEncounters: false,
        maxEncounterIntensity: 0.3,
        explorationIncentive: true,
        environmentMood: { windStrength: 26, pollenDensity: 0.85, audioIntensity: 0.5, lightingWarmth: 0.95 },
      }),
      new PacingBeat({
        name: PACING_BEATS.ESCALATION,
        title: 'Approaching the Sacred Grove',
        description: 'Subtle ground tremors and amber pollen swirls hint at Queen Bee presence.',
        minX: 1600,
        maxX: 1840,
        targetIntensity: 0.6,
        minDuration: 1.8,
        allowEncounters: true,
        maxEncounterIntensity: 0.5,
        environmentMood: { windStrength: 35, pollenDensity: 0.9, audioIntensity: 0.7, lightingWarmth: 0.7 },
      }),
      new PacingBeat({
        name: PACING_BEATS.SET_PIECE,
        title: 'The Sunstone Courtyard Approach',
        description: 'Distant Queen Bee monarch silhouette crosses the dawn clouds with royal horn cue.',
        minX: 1840,
        maxX: 1980,
        targetIntensity: 0.75,
        minDuration: 2.0,
        allowEncounters: false,
        maxEncounterIntensity: 0.4,
        cinematicAffinity: true,
        environmentMood: { windStrength: 40, pollenDensity: 0.8, audioIntensity: 0.8, lightingWarmth: 0.65 },
      }),
      new PacingBeat({
        name: PACING_BEATS.RECOVERY,
        title: 'Shrine Threshold Sanctuary',
        description: 'Luminous bluebells and sunstone pediment restore calm before the goal.',
        minX: 1980,
        maxX: 2060,
        targetIntensity: 0.3,
        minDuration: 1.0,
        allowEncounters: false,
        maxEncounterIntensity: 0.0,
        recoveryOpportunity: true,
        environmentMood: { windStrength: 15, pollenDensity: 0.5, audioIntensity: 0.3, lightingWarmth: 0.9 },
      }),
      new PacingBeat({
        name: PACING_BEATS.CLIMAX,
        title: 'The Sunstone Shrine Awakening',
        description: 'Towering ancient oak & Celtic sunstone arch awaken. Letterbox glide and transition to the chasm brink.',
        minX: 2060,
        maxX: 2460,
        targetIntensity: 0.8,
        minDuration: 2.5,
        allowEncounters: false,
        maxEncounterIntensity: 0.0,
        cinematicAffinity: true,
        environmentMood: { windStrength: 25, pollenDensity: 1.0, audioIntensity: 0.85, lightingWarmth: 1.0 },
      }),
      // --- SECTION 2: THE WHISPERING CANOPY & AMBER CHASM ---
      new PacingBeat({
        name: PACING_BEATS.CHALLENGE,
        title: 'The Chasm Brink & Bouncy Amber Raft',
        description: 'Meadow turf ends. Leaping onto springy amber raft catapults Aria over misty abyss.',
        minX: 2460,
        maxX: 2820,
        targetIntensity: 0.7,
        minDuration: 2.0,
        allowEncounters: false,
        maxEncounterIntensity: 0.2,
        environmentMood: { windStrength: 35, pollenDensity: 0.6, audioIntensity: 0.6, lightingWarmth: 0.7 },
      }),
      new PacingBeat({
        name: PACING_BEATS.TEACH,
        title: 'Sequoia Vine Ascent & High Bridge',
        description: 'Vertical vine climbing introduces aerial transfer onto suspended chasm rope bridge.',
        minX: 2820,
        maxX: 3180,
        targetIntensity: 0.65,
        minDuration: 2.0,
        allowEncounters: true,
        maxEncounterIntensity: 0.5,
        environmentMood: { windStrength: 28, pollenDensity: 0.7, audioIntensity: 0.65, lightingWarmth: 0.65 },
      }),
      new PacingBeat({
        name: PACING_BEATS.CHALLENGE,
        title: 'The Chasm Aerial Ambush',
        description: 'Honey Wisp distraction hover combined with diving Hive Firefly ambush over bouncy amber raft.',
        minX: 3180,
        maxX: 3520,
        targetIntensity: 0.8,
        minDuration: 2.2,
        allowEncounters: true,
        maxEncounterIntensity: 0.8,
        environmentMood: { windStrength: 32, pollenDensity: 0.8, audioIntensity: 0.75, lightingWarmth: 0.6 },
      }),
      new PacingBeat({
        name: PACING_BEATS.RELIEF,
        title: 'Hollow Redwood Sanctuary & Checkpoint',
        description: 'Midpoint ancient sequoia terrace with storybook carved altar checkpoint. Relief and rest.',
        minX: 3520,
        maxX: 3750,
        targetIntensity: 0.3,
        minDuration: 1.5,
        allowEncounters: false,
        maxEncounterIntensity: 0.0,
        recoveryOpportunity: true,
        environmentMood: { windStrength: 18, pollenDensity: 0.5, audioIntensity: 0.35, lightingWarmth: 0.8 },
      }),
      new PacingBeat({
        name: PACING_BEATS.SET_PIECE,
        title: 'The Great Hollow Redwood & Amber Cataract',
        description: 'Ascending inside the monumental hollow sequoia with glowing cataract amber waterfall.',
        minX: 3750,
        maxX: 4250,
        targetIntensity: 0.85,
        minDuration: 3.0,
        allowEncounters: false,
        maxEncounterIntensity: 0.3,
        cinematicAffinity: true,
        environmentMood: { windStrength: 25, pollenDensity: 0.9, audioIntensity: 0.85, lightingWarmth: 0.85 },
      }),
      new PacingBeat({
        name: PACING_BEATS.EXPLORATION,
        title: 'The Forgotten Royal Apiary & Sentry Gate',
        description: 'Secret high canopy sanctuary branching above the guarded lower root bridge.',
        minX: 4250,
        maxX: 4750,
        targetIntensity: 0.75,
        minDuration: 2.5,
        allowEncounters: true,
        maxEncounterIntensity: 0.75,
        explorationIncentive: true,
        environmentMood: { windStrength: 22, pollenDensity: 0.85, audioIntensity: 0.7, lightingWarmth: 0.9 },
      }),
      new PacingBeat({
        name: PACING_BEATS.CLIMAX,
        title: 'Outpost Gateway & Crumbling Fortress Threshold',
        description: 'Overgrown sunstone arch gateway to the royal fortress.',
        minX: 4750,
        maxX: 5200,
        targetIntensity: 0.95,
        minDuration: 3.0,
        allowEncounters: false,
        maxEncounterIntensity: 0.0,
        cinematicAffinity: true,
        environmentMood: { windStrength: 30, pollenDensity: 1.0, audioIntensity: 0.95, lightingWarmth: 0.9 },
      }),
      // --- SECTION 3: THE SUNSTONE AQUEDUCT & CRUMBLING FORTRESS ---
      new PacingBeat({
        name: PACING_BEATS.DISCOVERY,
        title: 'The Colonnade Gateway & Checkpoint 3',
        description: 'Weathered granite aqueduct ruins and Checkpoint 3 altar as sky deepens to violet.',
        minX: 5200,
        maxX: 5540,
        targetIntensity: 0.4,
        minDuration: 1.8,
        allowEncounters: false,
        maxEncounterIntensity: 0.0,
        recoveryOpportunity: true,
        environmentMood: { windStrength: 20, pollenDensity: 0.4, audioIntensity: 0.4, lightingWarmth: 0.5 },
      }),
      new PacingBeat({
        name: PACING_BEATS.CHALLENGE,
        title: 'The Crumbling Aqueduct Viaduct & Phalanx',
        description: 'Moving runestone lifts and crumbling stone blocks over moat chasm with beetle and firefly defense.',
        minX: 5540,
        maxX: 6160,
        targetIntensity: 0.8,
        minDuration: 2.5,
        allowEncounters: true,
        maxEncounterIntensity: 0.8,
        environmentMood: { windStrength: 35, pollenDensity: 0.5, audioIntensity: 0.75, lightingWarmth: 0.4 },
      }),
      new PacingBeat({
        name: PACING_BEATS.EXPLORATION,
        title: 'The Secret Sunstone Armory Vault',
        description: 'Vertical moving runestone lift grants access to the high royal armory vault and sunstone relic.',
        minX: 6160,
        maxX: 6550,
        targetIntensity: 0.7,
        minDuration: 2.2,
        allowEncounters: true,
        maxEncounterIntensity: 0.6,
        explorationIncentive: true,
        environmentMood: { windStrength: 22, pollenDensity: 0.6, audioIntensity: 0.65, lightingWarmth: 0.7 },
      }),
      new PacingBeat({
        name: PACING_BEATS.TEACH,
        title: 'The Watchtower Moat Cross-Chasm Ferry',
        description: 'Horizontal moving runestone ferry and crumbling block coordination.',
        minX: 6550,
        maxX: 6860,
        targetIntensity: 0.65,
        minDuration: 2.0,
        allowEncounters: false,
        maxEncounterIntensity: 0.3,
        environmentMood: { windStrength: 28, pollenDensity: 0.5, audioIntensity: 0.6, lightingWarmth: 0.4 },
      }),
      new PacingBeat({
        name: PACING_BEATS.RELIEF,
        title: 'Watchtower Bastion Sanctuary & Checkpoint 4',
        description: 'Heavy granite bastion terrace with Checkpoint 4 altar before the high siege ascent.',
        minX: 6860,
        maxX: 7050,
        targetIntensity: 0.35,
        minDuration: 1.5,
        allowEncounters: false,
        maxEncounterIntensity: 0.0,
        recoveryOpportunity: true,
        environmentMood: { windStrength: 18, pollenDensity: 0.3, audioIntensity: 0.4, lightingWarmth: 0.6 },
      }),
      new PacingBeat({
        name: PACING_BEATS.SET_PIECE,
        title: 'The Sunstone Fortress Watchtower Monument',
        description: 'Ascending stepped ramparts of the monumental fortress watchtower landmark.',
        minX: 7050,
        maxX: 7450,
        targetIntensity: 0.88,
        minDuration: 3.0,
        allowEncounters: true,
        maxEncounterIntensity: 0.85,
        cinematicAffinity: true,
        environmentMood: { windStrength: 32, pollenDensity: 0.7, audioIntensity: 0.85, lightingWarmth: 0.5 },
      }),
      new PacingBeat({
        name: PACING_BEATS.ESCALATION,
        title: 'The Watchtower High Battlement Siege',
        description: 'High battlement platforms defended by coordinated firefly bombardiers and beetle guardians.',
        minX: 7450,
        maxX: 7680,
        targetIntensity: 0.82,
        minDuration: 2.0,
        allowEncounters: true,
        maxEncounterIntensity: 0.8,
        environmentMood: { windStrength: 38, pollenDensity: 0.8, audioIntensity: 0.8, lightingWarmth: 0.45 },
      }),
      new PacingBeat({
        name: PACING_BEATS.RELIEF,
        title: 'The Grand Citadel Gateway Viaduct',
        description: 'Grand royal citadel bridge and sunstone arch transitioning into the Spire threshold.',
        minX: 7680,
        maxX: 8000,
        targetIntensity: 0.5,
        minDuration: 2.0,
        allowEncounters: false,
        maxEncounterIntensity: 0.0,
        recoveryOpportunity: true,
        environmentMood: { windStrength: 25, pollenDensity: 0.6, audioIntensity: 0.5, lightingWarmth: 0.7 },
      }),
      // --- SECTION 4: THE SOVEREIGN HIVE SPIRE (8,000 - 10,800px) ---
      new PacingBeat({
        name: PACING_BEATS.DISCOVERY,
        title: 'The Spire Gateway Colonnade & Checkpoint 5',
        description: 'Obsidian hex pillars and gold filigree colonnade mark entry to the Sovereign Hive Spire as sky turns to starry void.',
        minX: 8000,
        maxX: 8400,
        targetIntensity: 0.45,
        minDuration: 2.0,
        allowEncounters: false,
        maxEncounterIntensity: 0.0,
        recoveryOpportunity: true,
        environmentMood: { windStrength: 22, pollenDensity: 0.5, audioIntensity: 0.55, lightingWarmth: 0.6 },
      }),
      new PacingBeat({
        name: PACING_BEATS.CHALLENGE,
        title: 'The Hexagonal Gauntlet & Honey Geysers',
        description: 'Moving hex lifts and vertical golden updraft geysers catapult Aria over the abyss under beetle and firefly defense.',
        minX: 8400,
        maxX: 9100,
        targetIntensity: 0.85,
        minDuration: 2.8,
        allowEncounters: true,
        maxEncounterIntensity: 0.85,
        environmentMood: { windStrength: 40, pollenDensity: 0.75, audioIntensity: 0.85, lightingWarmth: 0.5 },
      }),
      new PacingBeat({
        name: PACING_BEATS.EXPLORATION,
        title: "The Queen's Forbidden Secret Vault",
        description: "Upper route branches to hidden sanctuary housing Khan's enchanted keepsake, while lower path traverses sticky amber nectar.",
        minX: 9100,
        maxX: 9600,
        targetIntensity: 0.75,
        minDuration: 2.5,
        allowEncounters: true,
        maxEncounterIntensity: 0.7,
        explorationIncentive: true,
        environmentMood: { windStrength: 28, pollenDensity: 0.85, audioIntensity: 0.75, lightingWarmth: 0.8 },
      }),
      new PacingBeat({
        name: PACING_BEATS.ESCALATION,
        title: 'The Royal Chrysalis Ante-Chamber & Checkpoint 6',
        description: "Vertical hex elevators and stepped obsidian ramparts defended by the Queen's elite royal guard.",
        minX: 9600,
        maxX: 10180,
        targetIntensity: 0.88,
        minDuration: 2.5,
        allowEncounters: true,
        maxEncounterIntensity: 0.9,
        environmentMood: { windStrength: 42, pollenDensity: 0.9, audioIntensity: 0.9, lightingWarmth: 0.5 },
      }),
      new PacingBeat({
        name: PACING_BEATS.CLIMAX,
        title: 'The Sovereign Royal Chrysalis Throne & Victory',
        description: 'Monumental obsidian hive throne where the Queen Bee looms, and Khan the Bat Boy is rescued from the enchanted chrysalis!',
        minX: 10180,
        maxX: 10800,
        targetIntensity: 1.0,
        minDuration: 4.0,
        allowEncounters: false,
        maxEncounterIntensity: 0.0,
        cinematicAffinity: true,
        environmentMood: { windStrength: 50, pollenDensity: 1.0, audioIntensity: 1.0, lightingWarmth: 0.9 },
      }),
    ]);
  }
}
