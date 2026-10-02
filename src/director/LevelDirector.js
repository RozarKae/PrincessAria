/**
 * LEVEL DIRECTOR ENGINE — PROJECT ARIA
 * 
 * The authoritative AI Level Director orchestrating authored variation, pacing curves,
 * route topologies, and environmental events around the vertical slice.
 * 
 * REASONS ABOUT:
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
 * INFLUENCES (WITHOUT CHEATING):
 * - Encounter timing & breathing room
 * - Enemy combination variant selection from authored templates
 * - Optional challenges & exploration affordances
 * - Recovery areas & dynamic nectar flowers
 * - Reward placement & shard clustering
 * - Narrative pacing progression through 10 canonical beats
 * - Dynamic environmental events (pollen storms, wind shifts, camera rumbles)
 */

import { PacingCurve, PACING_BEATS } from './PacingCurve.js';
import { RouteManager, ROUTE_TYPES } from './RouteManager.js';
import { DirectorTelemetry } from './DirectorTelemetry.js';
import {
  EncounterTemplate,
  TraversalTemplate,
  ExplorationTemplate,
  SecretTemplate,
  RewardTemplate,
  CinematicTemplate,
  EnvironmentalEventTemplate,
  REWARD_TIERS,
} from './AuthoringTemplates.js';
import { HiveGrub } from '../entities/HiveGrub.js';
import { HoneyWisp } from '../entities/HoneyWisp.js';
import { HoneyBeetle } from '../entities/HoneyBeetle.js';
import { HiveFirefly } from '../entities/HiveFirefly.js';

export class LevelDirector {
  constructor(config = {}) {
    this.telemetry = new DirectorTelemetry();
    this.routeManager = config.routeManager || RouteManager.createDefaultHoneywoodRoutes();
    this.pacingCurve = config.pacingCurve || PacingCurve.createDefaultHoneywoodCurve();

    // Template registries
    this.encounterTemplates = new Map();
    this.traversalTemplates = new Map();
    this.explorationTemplates = new Map();
    this.secretTemplates = new Map();
    this.rewardTemplates = new Map();
    this.cinematicTemplates = new Map();
    this.environmentalTemplates = new Map();

    // Director action history & decision log
    this.decisionLog = [];
    this.activeInterventions = new Set();

    // Dynamic recovery spawn tracking
    this.hasSpawnedRecoveryNectar = false;

    // Director debug mode (toggled via F1 or KeyB)
    this.debugVisible = false;

    this.initDefaultTemplates();
  }

  /**
   * Register authored templates for Honeywood Glade Vertical Slice.
   */
  initDefaultTemplates() {
    // 1. Encounter Template: Under-bridge & terrace encounter
    this.addEncounterTemplate(
      new EncounterTemplate({
        id: 'rope_bridge_grub_encounter',
        name: 'Rope Bridge Hive Grub Encounter',
        beatAffinity: PACING_BEATS.CHALLENGE,
        triggerX: 840,
        activationRadius: 400,
        variants: {
          RELAXED: [
            { type: 'grub', x: 1040, y: 836, patrolLeft: 920, patrolRight: 1140 },
          ],
          STANDARD: [
            { type: 'grub', x: 1040, y: 836, patrolLeft: 840, patrolRight: 1240 },
          ],
          TACTICAL: [
            { type: 'grub', x: 1040, y: 836, patrolLeft: 840, patrolRight: 1240 },
          ],
        },
      })
    );

    // 2. Traversal Template: Rope Bridge Crossing
    this.addTraversalTemplate(
      new TraversalTemplate({
        id: 'rope_bridge_traversal',
        name: 'Suspended Rope Bridge Platforming',
        beatAffinity: PACING_BEATS.CHALLENGE,
        graceAid: {
          type: 'climbable_vine',
          x: 940,
          y: 735,
          width: 48,
          height: 145,
          description: 'Auxiliary ivy vine assisting recovery if player repeatedly falls off bridge',
        },
      })
    );

    // 3. Exploration Template: High Canopy Ascent
    this.addExplorationTemplate(
      new ExplorationTemplate({
        id: 'canopy_secret_ascent',
        name: 'Canopy Bough Secret Ascent',
        zoneId: 'high_canopy_terrace',
        beatAffinity: PACING_BEATS.EXPLORATION,
        hintCues: [
          { type: 'butterflies', x: 1260, y: 520, count: 3, color: '#38bdf8' },
        ],
      })
    );

    // 4. Secret Template: Sunstone Canopy Sanctum
    this.addSecretTemplate(
      new SecretTemplate({
        id: 'sunstone_canopy_sanctum',
        name: 'Sunstone Canopy Sanctum',
        triggerBounds: { minX: 1240, maxX: 1460, minY: 320, maxY: 490 },
        bannerText: '✨ SECRET DISCOVERY: SUNSTONE CANOPY SANCTUM (+500 PTS)',
        rewardScore: 500,
        soundHook: 'playCheckpoint',
      })
    );

    // 5. Reward Template: Terrace Recovery & High Canopy Sun Crystal
    this.addRewardTemplate(
      new RewardTemplate({
        id: 'terrace_dynamic_recovery',
        tier: REWARD_TIERS.STANDARD_SHARD,
        x: 1480,
        y: 600,
        isDynamicRecovery: true,
      })
    );

    // 6. Cinematic Template: Sunstone Shrine Awakening
    this.addCinematicTemplate(
      new CinematicTemplate({
        id: 'sunstone_shrine_awakening',
        name: 'Ancient Sunstone Shrine Awakening',
        triggerX: 1960,
        letterboxHeight: 48,
        duration: 4.0,
        cameraFocusX: 2100,
        cameraFocusY: 840,
        bannerTitle: '✨ THE ANCIENT SUNSTONE SHRINE AWAKENS ✨',
        bannerSubtitle: 'The Sacred Sanctuary of Batboy is Restored',
      })
    );

    // 7. Environmental Event Template: Sacred Grove Tremor
    this.addEnvironmentalTemplate(
      new EnvironmentalEventTemplate({
        id: 'sacred_grove_queen_rumble',
        name: 'Sacred Grove Queen Bee Tremor',
        beatTrigger: PACING_BEATS.ESCALATION,
        windShift: { windX: 42, windY: 10 },
        cameraShake: { intensity: 4, duration: 0.35 },
        soundCue: 'queen_rumble',
      })
    );

    // 8. Section 2 Encounter: The Chasm Aerial Ambush (Honey Wisp + Hive Firefly)
    this.addEncounterTemplate(
      new EncounterTemplate({
        id: 'chasm_aerial_ambush_encounter',
        name: 'The Chasm Aerial Ambush',
        beatAffinity: PACING_BEATS.CHALLENGE,
        triggerX: 2900,
        activationRadius: 450,
        variants: {
          RELAXED: [
            { type: 'wisp', x: 2920, y: 480, amplitude: 45, frequency: 1.8 },
          ],
          STANDARD: [
            { type: 'wisp', x: 2920, y: 480, amplitude: 55, frequency: 2.2 },
            { type: 'firefly', x: 3200, y: 420, patrolLeft: 2950, patrolRight: 3450 },
          ],
          TACTICAL: [
            { type: 'wisp', x: 2920, y: 480, amplitude: 60, frequency: 2.4 },
            { type: 'firefly', x: 3200, y: 420, patrolLeft: 2950, patrolRight: 3450 },
          ],
        },
      })
    );

    // 9. Section 2 Encounter: The Redwood Sentry Gate (Honey Beetle + Hive Grub)
    this.addEncounterTemplate(
      new EncounterTemplate({
        id: 'redwood_sentry_gate_encounter',
        name: 'The Redwood Sentry Gate',
        beatAffinity: PACING_BEATS.CHALLENGE,
        triggerX: 4300,
        activationRadius: 400,
        variants: {
          RELAXED: [
            { type: 'beetle', x: 4420, y: 622, patrolLeft: 4320, patrolRight: 4560 },
          ],
          STANDARD: [
            { type: 'beetle', x: 4420, y: 622, patrolLeft: 4320, patrolRight: 4560 },
            { type: 'grub', x: 4640, y: 636, patrolLeft: 4580, patrolRight: 4780 },
          ],
          TACTICAL: [
            { type: 'beetle', x: 4420, y: 622, patrolLeft: 4320, patrolRight: 4560 },
            { type: 'grub', x: 4640, y: 636, patrolLeft: 4580, patrolRight: 4780 },
          ],
        },
      })
    );

    // 10. Section 2 Cinematic: The Great Hollow Redwood Landmark
    this.addCinematicTemplate(
      new CinematicTemplate({
        id: 'hollow_redwood_landmark_cinematic',
        name: 'The Great Hollow Redwood & Amber Cataract',
        triggerX: 3750,
        letterboxHeight: 48,
        duration: 3.8,
        cameraFocusX: 3900,
        cameraFocusY: 600,
        bannerTitle: '✨ LANDMARK: THE GREAT HOLLOW REDWOOD & AMBER CATARACT ✨',
        bannerSubtitle: 'Ancient sequoia sanctum cascading glowing amber nectar',
      })
    );

    // 11. Section 2 Secret: The Forgotten Royal Apiary
    this.addSecretTemplate(
      new SecretTemplate({
        id: 'royal_apiary_sanctuary_secret',
        name: 'The Forgotten Royal Apiary Sanctuary',
        triggerBounds: { minX: 4350, maxX: 4650, minY: 200, maxY: 380 },
        bannerText: '✨ SECRET DISCOVERY: THE FORGOTTEN ROYAL APIARY (+750 PTS)',
        rewardScore: 750,
        soundHook: 'playCheckpoint',
      })
    );

    // 12. Section 3 Encounter: The Aqueduct Colonnade Phalanx (Honey Beetle + Elite Firefly)
    this.addEncounterTemplate(
      new EncounterTemplate({
        id: 'aqueduct_colonnade_phalanx_encounter',
        name: 'The Aqueduct Colonnade Phalanx',
        beatAffinity: PACING_BEATS.CHALLENGE,
        triggerX: 5750,
        activationRadius: 420,
        variants: {
          RELAXED: [
            { type: 'beetle', x: 6020, y: 522, patrolLeft: 5980, patrolRight: 6160 },
          ],
          STANDARD: [
            { type: 'beetle', x: 6020, y: 522, patrolLeft: 5980, patrolRight: 6160 },
            { type: 'firefly', x: 5820, y: 400, patrolLeft: 5650, patrolRight: 6150 },
          ],
          TACTICAL: [
            { type: 'beetle', x: 6020, y: 522, patrolLeft: 5980, patrolRight: 6160 },
            { type: 'firefly', x: 5820, y: 400, patrolLeft: 5650, patrolRight: 6150 },
          ],
        },
      })
    );

    // 13. Section 3 Secret: The Sunstone Armory Vault
    this.addSecretTemplate(
      new SecretTemplate({
        id: 'fortress_armory_vault_secret',
        name: 'The Sunstone Armory Vault',
        triggerBounds: { minX: 6160, maxX: 6440, minY: 200, maxY: 420 },
        bannerText: '🗝️ SECRET DISCOVERED: THE SUNSTONE ARMORY VAULT (+750 PTS)',
        rewardScore: 750,
        soundHook: 'playCheckpoint',
      })
    );

    // 14. Section 3 Landmark Cinematic: The Sunstone Fortress Watchtower
    this.addCinematicTemplate(
      new CinematicTemplate({
        id: 'fortress_watchtower_landmark_cinematic',
        name: 'The Sunstone Fortress Watchtower',
        triggerX: 6860,
        letterboxHeight: 48,
        duration: 4.0,
        cameraFocusX: 7100,
        cameraFocusY: 500,
        bannerTitle: '✨ LANDMARK: THE SUNSTONE FORTRESS WATCHTOWER ✨',
        bannerSubtitle: 'Royal ashlar granite bastion standing resolute against hive corruption',
      })
    );

    // 15. Section 3 Encounter: The Watchtower Rampart Siege (Beetle + Wisp + Firefly)
    this.addEncounterTemplate(
      new EncounterTemplate({
        id: 'watchtower_rampart_siege_encounter',
        name: 'The Watchtower Rampart Siege',
        beatAffinity: PACING_BEATS.SET_PIECE,
        triggerX: 7000,
        activationRadius: 460,
        variants: {
          RELAXED: [
            { type: 'beetle', x: 7000, y: 682, patrolLeft: 6880, patrolRight: 7160 },
          ],
          STANDARD: [
            { type: 'beetle', x: 7000, y: 682, patrolLeft: 6880, patrolRight: 7160 },
            { type: 'wisp', x: 7240, y: 520, amplitude: 50, frequency: 2.2 },
            { type: 'firefly', x: 7450, y: 380, patrolLeft: 7300, patrolRight: 7600 },
          ],
          TACTICAL: [
            { type: 'beetle', x: 7000, y: 682, patrolLeft: 6880, patrolRight: 7160 },
            { type: 'wisp', x: 7240, y: 520, amplitude: 50, frequency: 2.2 },
            { type: 'firefly', x: 7450, y: 380, patrolLeft: 7300, patrolRight: 7600 },
          ],
        },
      })
    );
  }

  // --- Registration helpers ---
  addEncounterTemplate(t) { this.encounterTemplates.set(t.id, t); }
  addTraversalTemplate(t) { this.traversalTemplates.set(t.id, t); }
  addExplorationTemplate(t) { this.explorationTemplates.set(t.id, t); }
  addSecretTemplate(t) { this.secretTemplates.set(t.id, t); }
  addRewardTemplate(t) { this.rewardTemplates.set(t.id, t); }
  addCinematicTemplate(t) { this.cinematicTemplates.set(t.id, t); }
  addEnvironmentalTemplate(t) { this.environmentalTemplates.set(t.id, t); }

  reset() {
    this.telemetry.reset();
    this.routeManager.reset();
    this.pacingCurve.reset();
    this.decisionLog = [];
    this.activeInterventions.clear();
    this.hasSpawnedRecoveryNectar = false;

    // Reset template states
    for (const t of this.encounterTemplates.values()) t.triggered = false;
    for (const t of this.traversalTemplates.values()) t.graceAidActive = false;
    for (const t of this.secretTemplates.values()) t.discovered = false;
    for (const t of this.cinematicTemplates.values()) t.triggered = false;
    for (const t of this.environmentalTemplates.values()) t.triggered = false;
  }

  toggleDebug() {
    this.debugVisible = !this.debugVisible;
    return this.debugVisible;
  }

  /**
   * Main Director Tick — Evaluates telemetry, pacing curve, routes, and applies non-cheating influences.
   */
  update(dt, player, level, gameState, audio, camera) {
    if (!player || !level) return;

    // 1. Evaluate Route Topology
    const routeInfo = this.routeManager.update(dt, player);

    // 2. Evaluate Pacing Curve Beat Transitions
    const beatTransition = this.pacingCurve.update(dt, this.telemetry);
    const currentBeat = this.pacingCurve.currentBeat;

    // 3. Update all 14 Telemetry Signals
    this.telemetry.update(
      dt,
      player,
      level,
      gameState,
      routeInfo,
      currentBeat ? currentBeat.name : 'QUIET'
    );

    // 4. Log Beat Transition if one occurred
    if (beatTransition && currentBeat) {
      this.logDecision(`Pacing transition to beat: ${currentBeat.name} (${currentBeat.title})`, 'PACING');
      // Apply ambient atmosphere shift from beat
      if (level.atmosphere && currentBeat.environmentMood) {
        level.atmosphere.windX = currentBeat.environmentMood.windStrength || 25;
      }
    }

    // 5. DIRECTORIAL REASONING & INFLUENCES (NON-CHEATING)
    this.evaluateEncounterTiming(level, player);
    this.evaluateRecoveryPlacement(level, player, gameState);
    this.evaluateExplorationOpportunities(level, player);
    this.evaluateSecretsAndCinematics(level, player, audio, camera);
    this.evaluateEnvironmentalEvents(level, currentBeat ? currentBeat.name : '', camera, audio);
  }

  /**
   * Reason about Encounter Timing & Authored Variants
   * Respects pacing curve allowEncounters & player distress signals.
   */
  evaluateEncounterTiming(level, player) {
    const currentBeat = this.pacingCurve.currentBeat;
    if (!currentBeat) return;

    for (const template of this.encounterTemplates.values()) {
      if (template.triggered) continue;

      const dist = Math.abs(player.x - template.triggerX);
      if (dist < template.activationRadius) {
        // Only trigger if active beat allows encounters
        if (currentBeat.allowEncounters) {
          template.triggered = true;
          const chosenVariant = template.resolveVariant(this.telemetry);
          this.logDecision(
            `Triggered encounter '${template.name}' using variant: ${template.selectedVariant} (Skill: ${this.telemetry.playerSkillSignals.compositeSkillTier})`,
            'ENCOUNTER'
          );

          // Spawn authored variant enemies into the level if not already present
          this.deployEncounterVariant(level, chosenVariant);
        }
      }
    }
  }

  /**
   * Safely instantiate authored enemy variant without duplicate spawning.
   */
  deployEncounterVariant(level, enemyDefs) {
    if (!level || !enemyDefs) return;
    for (const def of enemyDefs) {
      // Check if an enemy is already at or near this coordinate
      const exists = level.enemies.some(
        e => Math.abs(e.x - def.x) < 40 && Math.abs(e.y - def.y) < 40
      );
      if (exists) continue;

      let newEnemy = null;
      switch (def.type) {
        case 'wisp':
          newEnemy = new HoneyWisp(def.x, def.y, { amplitude: def.amplitude, frequency: def.frequency });
          break;
        case 'beetle':
          newEnemy = new HoneyBeetle(def.x, def.y, def.patrolLeft, def.patrolRight);
          break;
        case 'firefly':
          newEnemy = new HiveFirefly(def.x, def.y, { patrolLeft: def.patrolLeft, patrolRight: def.patrolRight });
          break;
        case 'grub':
        default:
          newEnemy = new HiveGrub(def.x, def.y, def.patrolLeft, def.patrolRight);
          break;
      }
      if (newEnemy) {
        level.enemies.push(newEnemy);
      }
    }
    if (level.encounterCoordinator) {
      level.encounterCoordinator.registerEnemies(level.enemies);
    }
  }

  /**
   * Reason about Recovery Areas (Spawns Nectar Heart when player is low health entering RELIEF/RECOVERY).
   */
  evaluateRecoveryPlacement(level, player, gameState) {
    const currentBeat = this.pacingCurve.currentBeat;
    if (!currentBeat || !currentBeat.recoveryOpportunity) return;

    // If player health is critical (<= 1 heart) and hasn't received recovery yet
    if (this.telemetry.playerHealth.isCritical && !this.hasSpawnedRecoveryNectar) {
      this.hasSpawnedRecoveryNectar = true;
      this.logDecision(
        `Critical health (${gameState.lives}/${gameState.maxLives}) detected during ${currentBeat.name}. Deployed Sunstone Nectar recovery flower.`,
        'RECOVERY'
      );

      // Add a luminous golden restoration bloom prop at the landing terrace (x: 1480, y: 640)
      if (level.detailProps) {
        level.detailProps.push({
          type: 'bluebells',
          x: 1480,
          y: 640,
          scale: 1.35,
          isNectarFlower: true,
        });
      }
      // Add a gentle floating sparkle cluster
      level.spawnSparkles(1480, 620, 12);
    }
  }

  /**
   * Reason about Exploration Opportunities (Highlights high canopy branch when curiosity is high).
   */
  evaluateExplorationOpportunities(level, player) {
    const currentBeat = this.pacingCurve.currentBeat;
    if (!currentBeat) return;

    for (const exp of this.explorationTemplates.values()) {
      if (!exp.hintActive && exp.shouldHighlight(this.telemetry)) {
        exp.hintActive = true;
        this.logDecision(
          `High curiosity score (${this.telemetry.explorationBehavior.curiosityScore.toFixed(2)}). Emitted azure guide butterflies to hint secret canopy ascent.`,
          'EXPLORATION'
        );

        // Spawn ambient azure butterflies near the climbing ivy vine
        if (level.ambientButterflies) {
          level.ambientButterflies.push({
            x: 1260,
            y: 520,
            baseY: 520,
            timer: 0,
            speedX: 25,
            color: '#38bdf8',
          });
        }
      }
    }
  }

  /**
   * Reason about Secrets & Cinematic Moments.
   */
  evaluateSecretsAndCinematics(level, player, audio, camera) {
    // 1. Secret Template Check
    for (const secret of this.secretTemplates.values()) {
      if (secret.checkTrigger(player.x, player.y)) {
        this.logDecision(`Secret discovery triggered: ${secret.name}`, 'SECRET');
        level.secretAreaDiscovered = true;
        level.secretBannerTimer = 3.5;
        this.telemetry.recordSuccess('secret', secret.rewardScore);
        if (audio && audio.playCheckpoint) audio.playCheckpoint();
      }
    }

    // 2. Cinematic Template Check
    for (const cin of this.cinematicTemplates.values()) {
      if (cin.checkTrigger(player.x)) {
        this.logDecision(`Cinematic moment activated: ${cin.name}`, 'CINEMATIC');
        level.shrineCinematicTriggered = true;
        level.shrineBannerTimer = cin.duration;
        if (camera) {
          camera.shake(6, 0.4);
        }
        if (audio && audio.playLevelComplete) {
          audio.playLevelComplete();
        }
      }
    }
  }

  /**
   * Reason about Dynamic Environmental Events (Wind gusts, Queen Bee rumble, sunbursts).
   */
  evaluateEnvironmentalEvents(level, beatName, camera, audio) {
    for (const event of this.environmentalTemplates.values()) {
      if (event.shouldTrigger(beatName)) {
        this.logDecision(
          `Environmental event triggered: ${event.name} during beat: ${beatName}`,
          'ENVIRONMENT'
        );

        if (camera && event.cameraShake) {
          camera.shake(event.cameraShake.intensity, event.cameraShake.duration);
        }

        if (level.atmosphere && event.windShift) {
          level.atmosphere.windX = event.windShift.windX;
          level.atmosphere.windY = event.windShift.windY;
        }

        // Particle burst
        if (event.pollenBurst) {
          level.spawnSparkles(this.telemetry.playerPosition.x + 300, 450, 16);
        }
      }
    }
  }

  /**
   * Log an authored directorial decision.
   */
  logDecision(message, category = 'PACING') {
    const entry = {
      timestamp: performance.now(),
      simTime: this.telemetry.sessionTimer.toFixed(1) + 's',
      category,
      message,
    };
    this.decisionLog.unshift(entry);
    if (this.decisionLog.length > 25) {
      this.decisionLog.pop();
    }
    console.log(`[LevelDirector][${category}] ${message}`);
  }

  /**
   * Comprehensive state snapshot for debugging & developer tooling.
   */
  getDirectorState() {
    return {
      activeBeat: this.pacingCurve.currentBeat ? this.pacingCurve.currentBeat.name : 'NONE',
      beatTitle: this.pacingCurve.currentBeat ? this.pacingCurve.currentBeat.title : '',
      targetIntensity: this.pacingCurve.currentBeat ? this.pacingCurve.currentBeat.targetIntensity : 0,
      currentRoute: this.telemetry.currentRoute,
      encounterIntensity: this.telemetry.currentEncounterIntensity,
      health: `${this.telemetry.playerHealth.current}/${this.telemetry.playerHealth.max}`,
      skillTier: this.telemetry.playerSkillSignals.compositeSkillTier,
      fluency: this.telemetry.playerSkillSignals.movementFluency.toFixed(2),
      curiosity: this.telemetry.explorationBehavior.curiosityScore.toFixed(2),
      damageLast10s: this.telemetry.damageLast10s,
      consecutiveFailures: this.telemetry.consecutiveFailures,
      successStreak: this.telemetry.successStreak,
      recentDecisions: this.decisionLog.slice(0, 5),
    };
  }
}
