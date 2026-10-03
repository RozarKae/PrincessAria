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
import { ShadowSquirrel } from '../entities/ShadowSquirrel.js';
import { ThornGoblin } from '../entities/ThornGoblin.js';
import { VineCrawler } from '../entities/VineCrawler.js';
import { SporeBomber } from '../entities/SporeBomber.js';
import { ForestKing } from '../entities/ForestKing.js';

export class LevelDirector {
  constructor(config = {}) {
    this.world = config.world || (config.levelData ? config.levelData.world : 1);
    this.levelData = config.levelData || null;
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
   * Register authored templates according to current World.
   */
  initDefaultTemplates() {
    if (this.world === 2) {
      this.initWorld2Templates();
    } else {
      this.initWorld1Templates();
    }
  }

  /**
   * Register authored templates for Honeywood Glade & Spire (World 1).
   */
  initWorld1Templates() {
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

    // 16. Section 4 Landmark Cinematic: The Spire Gateway Colonnade
    this.addCinematicTemplate(
      new CinematicTemplate({
        id: 'spire_gateway_landmark_cinematic',
        name: 'The Spire Gateway Colonnade',
        triggerX: 8080,
        letterboxHeight: 48,
        duration: 3.8,
        cameraFocusX: 8180,
        cameraFocusY: 680,
        bannerTitle: '✨ LANDMARK: THE SPIRE GATEWAY COLONNADE ✨',
        bannerSubtitle: 'Bioluminescent obsidian and golden hex colonnade marking threshold to the Sovereign Spire',
      })
    );

    // 17. Section 4 Secret: The Queen\'s Forbidden Secret Vault
    this.addSecretTemplate(
      new SecretTemplate({
        id: 'queen_secret_vault',
        name: "The Queen's Forbidden Secret Vault",
        triggerBounds: { minX: 9240, maxX: 9520, minY: 200, maxY: 400 },
        bannerText: "🗝️ SECRET DISCOVERED: THE QUEEN'S FORBIDDEN VAULT (+1,000 PTS)",
        rewardScore: 1000,
        soundHook: 'playCheckpoint',
      })
    );

    // 18. Section 4 Landmark Cinematic: The Sovereign Royal Chrysalis Throne
    this.addCinematicTemplate(
      new CinematicTemplate({
        id: 'sovereign_throne_landmark_cinematic',
        name: 'The Sovereign Royal Chrysalis Throne',
        triggerX: 10180,
        letterboxHeight: 52,
        duration: 4.5,
        cameraFocusX: 10400,
        cameraFocusY: 560,
        bannerTitle: '👑 CLIMAX: THE SOVEREIGN HIVE SPIRE — RESCUE KHAN! 👑',
        bannerSubtitle: 'Shatter the enchanted amber chrysalis to liberate Khan the Bat Boy!',
      })
    );

    // 19. Section 4 Encounter: The Sovereign Royal Guard (Beetle + Firefly + Wisp)
    this.addEncounterTemplate(
      new EncounterTemplate({
        id: 'sovereign_royal_guard_encounter',
        name: 'The Sovereign Throne Royal Guard',
        beatAffinity: PACING_BEATS.ESCALATION,
        triggerX: 9800,
        activationRadius: 480,
        variants: {
          RELAXED: [
            { type: 'beetle', x: 9940, y: 662, patrolLeft: 9840, patrolRight: 10120 },
          ],
          STANDARD: [
            { type: 'beetle', x: 9940, y: 662, patrolLeft: 9840, patrolRight: 10120 },
            { type: 'firefly', x: 10050, y: 390, patrolLeft: 9880, patrolRight: 10250 },
            { type: 'wisp', x: 10180, y: 540, amplitude: 55, frequency: 2.2 },
          ],
          TACTICAL: [
            { type: 'beetle', x: 9940, y: 662, patrolLeft: 9840, patrolRight: 10120 },
            { type: 'firefly', x: 10050, y: 390, patrolLeft: 9880, patrolRight: 10250 },
            { type: 'wisp', x: 10180, y: 540, amplitude: 55, frequency: 2.2 },
          ],
        },
      })
    );
  }

  /**
   * Register authored templates for The Whispering Forest (World 2).
   */
  initWorld2Templates() {
    // 1. Encounter Template: Spore Glade Ambush (Shadow Squirrel + Spore Bomber)
    this.addEncounterTemplate(
      new EncounterTemplate({
        id: 'spore_glade_ambush_encounter',
        name: 'The Spore Glade Ambusher',
        beatAffinity: PACING_BEATS.CHALLENGE,
        triggerX: 860,
        activationRadius: 400,
        variants: {
          RELAXED: [
            { type: 'shadow_squirrel', x: 1040, y: 836, patrolLeft: 920, patrolRight: 1220 },
          ],
          STANDARD: [
            { type: 'shadow_squirrel', x: 1040, y: 836, patrolLeft: 920, patrolRight: 1220 },
            { type: 'spore_bomber', x: 1120, y: 520, amplitude: 45, frequency: 2.0 },
          ],
          TACTICAL: [
            { type: 'shadow_squirrel', x: 1040, y: 836, patrolLeft: 920, patrolRight: 1220 },
            { type: 'spore_bomber', x: 1120, y: 520, amplitude: 50, frequency: 2.2 },
          ],
        },
      })
    );

    // 2. Traversal Template: Bouncy Mushroom Trampoline
    this.addTraversalTemplate(
      new TraversalTemplate({
        id: 'bouncy_mushroom_traversal',
        name: 'Bouncy Bioluminescent Mushroom Trampoline',
        beatAffinity: PACING_BEATS.CHALLENGE,
        graceAid: {
          type: 'climbable_vine',
          x: 1180,
          y: 720,
          width: 48,
          height: 160,
          description: 'Hanging liana vine assisting traversal near first bouncy mushroom',
        },
      })
    );

    // 3. Secret Template: Giggling Fungus Hollow
    this.addSecretTemplate(
      new SecretTemplate({
        id: 'giggling_fungus_secret',
        name: 'Giggling Fungus Hollow',
        triggerBounds: { minX: 1260, maxX: 1480, minY: 320, maxY: 480 },
        bannerText: '✨ SECRET DISCOVERY: GIGGLING FUNGUS HOLLOW (+500 PTS)',
        rewardScore: 500,
        soundHook: 'playCheckpoint',
      })
    );

    // 4. Landmark Cinematic: The Whispering Elder Oak
    this.addCinematicTemplate(
      new CinematicTemplate({
        id: 'elder_oak_landmark_cinematic',
        name: 'The Whispering Elder Oak',
        triggerX: 1960,
        letterboxHeight: 48,
        duration: 3.5,
        cameraFocusX: 2100,
        cameraFocusY: 840,
        bannerTitle: '✨ LANDMARK: THE WHISPERING ELDER OAK AWAKENS ✨',
        bannerSubtitle: 'Ancient fairytale oak murmuring warnings of the corrupted forest depths',
      })
    );

    // 5. Encounter Template: The Whispering Oak Vigil
    this.addEncounterTemplate(
      new EncounterTemplate({
        id: 'whispering_oak_vigil_encounter',
        name: 'The Whispering Oak Vigil',
        beatAffinity: PACING_BEATS.CHALLENGE,
        triggerX: 1620,
        activationRadius: 420,
        variants: {
          RELAXED: [
            { type: 'shadow_squirrel', x: 1620, y: 596, patrolLeft: 1540, patrolRight: 1860 },
          ],
          STANDARD: [
            { type: 'shadow_squirrel', x: 1620, y: 596, patrolLeft: 1540, patrolRight: 1860 },
            { type: 'vine_crawler', x: 1780, y: 842, patrolLeft: 1680, patrolRight: 1980 },
          ],
          TACTICAL: [
            { type: 'shadow_squirrel', x: 1620, y: 596, patrolLeft: 1540, patrolRight: 1860 },
            { type: 'vine_crawler', x: 1780, y: 842, patrolLeft: 1680, patrolRight: 1980 },
          ],
        },
      })
    );

    // 6. Section 2 Encounter: Fungal Hollows Aerial Ambush
    this.addEncounterTemplate(
      new EncounterTemplate({
        id: 'fungal_hollows_aerial_ambush_encounter',
        name: 'The Fungal Hollows Aerial Ambush',
        beatAffinity: PACING_BEATS.CHALLENGE,
        triggerX: 2900,
        activationRadius: 450,
        variants: {
          RELAXED: [
            { type: 'spore_bomber', x: 3100, y: 480, amplitude: 52, frequency: 2.2 },
          ],
          STANDARD: [
            { type: 'spore_bomber', x: 3100, y: 480, amplitude: 52, frequency: 2.2 },
            { type: 'vine_crawler', x: 3220, y: 602, patrolLeft: 3080, patrolRight: 3340 },
          ],
          TACTICAL: [
            { type: 'spore_bomber', x: 3100, y: 480, amplitude: 52, frequency: 2.2 },
            { type: 'vine_crawler', x: 3220, y: 602, patrolLeft: 3080, patrolRight: 3340 },
          ],
        },
      })
    );

    // 7. Section 2 Landmark Cinematic: The Bioluminescent Mycelium Shrine
    this.addCinematicTemplate(
      new CinematicTemplate({
        id: 'mycelium_shrine_cinematic',
        name: 'The Bioluminescent Mycelium Shrine',
        triggerX: 3860,
        letterboxHeight: 48,
        duration: 3.8,
        cameraFocusX: 4000,
        cameraFocusY: 600,
        bannerTitle: '✨ LANDMARK: THE BIOLUMINESCENT MYCELIUM SHRINE ✨',
        bannerSubtitle: 'Glowering fungal sanctum illuminating ancient forest secrets',
      })
    );

    // 8. Section 2 Secret: The Fairy Ring Sanctuary
    this.addSecretTemplate(
      new SecretTemplate({
        id: 'fairy_ring_secret',
        name: 'The Fairy Ring Sanctuary',
        triggerBounds: { minX: 4380, maxX: 4660, minY: 220, maxY: 380 },
        bannerText: '✨ SECRET DISCOVERY: THE FAIRY RING SANCTUARY (+750 PTS)',
        rewardScore: 750,
        soundHook: 'playCheckpoint',
      })
    );

    // 9. Section 3 Secret: The Druidic Root Vault
    this.addSecretTemplate(
      new SecretTemplate({
        id: 'druidic_root_vault_secret',
        name: 'The Druidic Root Vault',
        triggerBounds: { minX: 6240, maxX: 6480, minY: 240, maxY: 420 },
        bannerText: '🗝️ SECRET DISCOVERED: THE DRUIDIC ROOT VAULT (+750 PTS)',
        rewardScore: 750,
        soundHook: 'playCheckpoint',
      })
    );

    // 10. Section 3 Landmark Cinematic: The Briar Gate of Ancient Thorns
    this.addCinematicTemplate(
      new CinematicTemplate({
        id: 'briar_gate_cinematic',
        name: 'The Briar Gate of Ancient Thorns',
        triggerX: 7060,
        letterboxHeight: 48,
        duration: 4.0,
        cameraFocusX: 7200,
        cameraFocusY: 500,
        bannerTitle: '✨ LANDMARK: THE BRIAR GATE OF ANCIENT THORNS ✨',
        bannerSubtitle: 'Twisting thorn brambles guarding the boundary of the Forest King',
      })
    );

    // 11. Section 4 Secret: The Elder Crown Canopy
    this.addSecretTemplate(
      new SecretTemplate({
        id: 'elder_crown_canopy_secret',
        name: 'The Elder Crown Canopy',
        triggerBounds: { minX: 9280, maxX: 9540, minY: 220, maxY: 380 },
        bannerText: '🗝️ SECRET DISCOVERED: THE ELDER CROWN CANOPY (+1,000 PTS)',
        rewardScore: 1000,
        soundHook: 'playCheckpoint',
      })
    );

    // 12. Section 4 Landmark Cinematic: The Sacred Grove of the Forest King
    this.addCinematicTemplate(
      new CinematicTemplate({
        id: 'forest_king_grove_cinematic',
        name: 'The Sacred Grove of the Forest King',
        triggerX: 10060,
        letterboxHeight: 52,
        duration: 4.5,
        cameraFocusX: 10200,
        cameraFocusY: 560,
        bannerTitle: '👑 CLIMAX: THE CORRUPTED FOREST KING AWAKENS! 👑',
        bannerSubtitle: 'Defeat the colossal thorn titan to restore the Whispering Forest!',
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
   * Safely coordinate authored encounters without duplicate pop-in spawning.
   */
  deployEncounterVariant(level, enemyDefs) {
    if (!level || !enemyDefs) return;

    // When level data has authored enemies, all enemies are already loaded into level.enemies
    // at level initialization (Level.js reset()). Spawning new enemy objects mid-game causes
    // pop-in/duplicate bugs (such as a caterpillar popping out of nowhere when moving forward).
    if (level.data && level.data.enemies && level.data.enemies.length > 0) {
      if (level.encounterCoordinator && level.enemies) {
        // Coordinate existing nearby enemies in that encounter zone
        const encounterRadius = 600;
        level.enemies.forEach(e => {
          if (enemyDefs.some(def => Math.abs(e.x - def.x) < encounterRadius)) {
            if (e.alert) e.alert();
          }
        });
      }
      return;
    }

    // Fallback only for procedural / blank levels without pre-authored enemies
    for (const def of enemyDefs) {
      // Check if an enemy is already at or near this coordinate or patrol zone
      const exists = level.enemies.some(
        e => Math.abs(e.x - def.x) < 150 || (e.patrolLeft && def.patrolLeft && Math.abs(e.patrolLeft - def.patrolLeft) < 100)
      );
      if (exists) continue;

      let newEnemy = null;
      switch (def.type) {
        case 'wisp':
        case 'honey_wisp':
          newEnemy = new HoneyWisp(def.x, def.y, { amplitude: def.amplitude, frequency: def.frequency });
          break;
        case 'beetle':
        case 'honey_beetle':
          newEnemy = new HoneyBeetle(def.x, def.y, def.patrolLeft, def.patrolRight);
          break;
        case 'firefly':
        case 'hive_firefly':
          newEnemy = new HiveFirefly(def.x, def.y, { patrolLeft: def.patrolLeft, patrolRight: def.patrolRight });
          break;
        case 'shadow_squirrel':
        case 'squirrel':
          newEnemy = new ShadowSquirrel(def.x, def.y, def.patrolLeft, def.patrolRight);
          break;
        case 'thorn_goblin':
        case 'goblin':
          newEnemy = new ThornGoblin(def.x, def.y, def.patrolLeft, def.patrolRight);
          break;
        case 'vine_crawler':
        case 'crawler':
          newEnemy = new VineCrawler(def.x, def.y, { patrolLeft: def.patrolLeft, patrolRight: def.patrolRight });
          break;
        case 'spore_bomber':
        case 'bomber':
          newEnemy = new SporeBomber(def.x, def.y, { amplitude: def.amplitude, frequency: def.frequency });
          break;
        case 'forest_king':
          newEnemy = new ForestKing(def.x, def.y);
          break;
        case 'grub':
        case 'hive_grub':
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
        if (cin.bannerTitle && !level.shrineCinematicTriggered) {
          level.shrineBannerText = cin.bannerTitle;
          level.shrineBannerTimer = cin.duration || 3.5;
        }
        if (camera) {
          camera.shake(6, 0.4);
        }
        if (cin.soundHook && audio && audio[cin.soundHook]) {
          audio[cin.soundHook]();
        } else if (audio && audio.playCheckpoint) {
          audio.playCheckpoint();
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
