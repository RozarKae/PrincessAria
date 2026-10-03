import { assetManager } from '../renderer/AssetManager.js';

/**
 * ENVIRONMENT ASSET LIBRARY
 * Production registry of all authored 2D environment assets.
 * Categorized strictly according to the Project Aria Master Visual Development Bible:
 * - BACKGROUND
 * - MIDGROUND
 * - GAMEPLAY
 * - FOREGROUND
 * - DETAILS
 *
 * Provides metadata: natural dimensions, anchor points, slicing metrics (3-slice),
 * and asset keys for clean decoupled composition.
 */
export const ENVIRONMENT_ASSETS = {
  // ========================================================
  // 1. BACKGROUND ASSETS (Distant Sky, Mountains, Canopy)
  // ========================================================
  BACKGROUND: {
    SKY_MORNING: {
      key: 'environment/background/sky_morning',
      src: '/src/assets/environment/background/sky_morning.svg',
      width: 1920,
      height: 1080,
      parallaxFactor: 0.02,
    },
    MOUNTAINS_MIST: {
      key: 'environment/background/mountains_mist',
      src: '/src/assets/environment/background/mountains_mist.svg',
      width: 2048,
      height: 600,
      parallaxFactor: 0.08,
      baseY: 260,
    },
    CANOPY_DEEP: {
      key: 'environment/background/canopy_deep',
      src: '/src/assets/environment/background/canopy_deep.svg',
      width: 2048,
      height: 600,
      parallaxFactor: 0.18,
      baseY: 340,
    },
    SKY_TWILIGHT: {
      key: 'environment/background/sky_twilight_forest',
      src: '/src/assets/environment/background/sky_twilight_forest.svg',
      width: 1920,
      height: 1080,
      parallaxFactor: 0.02,
    },
    CANOPY_WHISPERING: {
      key: 'environment/background/canopy_whispering_woods',
      src: '/src/assets/environment/background/canopy_whispering_woods.svg',
      width: 2048,
      height: 600,
      parallaxFactor: 0.18,
      baseY: 340,
    },
  },

  // ========================================================
  // 2. MIDGROUND ASSETS (Landmarks, Structures, Honeycombs)
  // ========================================================
  MIDGROUND: {
    ANCIENT_OAK: {
      key: 'environment/midground/ancient_oak_landmark',
      src: '/src/assets/environment/midground/ancient_oak_landmark.svg',
      width: 720,
      height: 900,
      anchorX: 0.5,
      anchorY: 1.0,
      parallaxFactor: 0.35,
    },
    SUNSTONE_ARCH: {
      key: 'environment/midground/sunstone_ruin_arch',
      src: '/src/assets/environment/midground/sunstone_ruin_arch.svg',
      width: 400,
      height: 520,
      anchorX: 0.5,
      anchorY: 1.0,
      parallaxFactor: 0.38,
    },
    WILD_HONEYCOMB: {
      key: 'environment/midground/honeycomb_wild_shelf',
      src: '/src/assets/environment/midground/honeycomb_wild_shelf.svg',
      width: 360,
      height: 280,
      anchorX: 0.5,
      anchorY: 0.5,
      parallaxFactor: 0.42,
    },
    HOLLOW_REDWOOD: {
      key: 'environment/midground/hollow_redwood_landmark',
      src: '/src/assets/environment/midground/hollow_redwood_landmark.svg',
      width: 760,
      height: 980,
      anchorX: 0.5,
      anchorY: 1.0,
      parallaxFactor: 0.35,
    },
    ROYAL_APIARY: {
      key: 'environment/midground/royal_apiary_sanctuary',
      src: '/src/assets/environment/midground/royal_apiary_sanctuary.svg',
      width: 440,
      height: 460,
      anchorX: 0.5,
      anchorY: 1.0,
      parallaxFactor: 0.38,
    },
    FORTRESS_WATCHTOWER: {
      key: 'environment/midground/fortress_watchtower_landmark',
      src: '/src/assets/environment/midground/fortress_watchtower_landmark.svg',
      width: 780,
      height: 980,
      anchorX: 0.5,
      anchorY: 1.0,
      parallaxFactor: 0.35,
    },
    AQUEDUCT_COLONNADE: {
      key: 'environment/midground/aqueduct_colonnade_ruins',
      src: '/src/assets/environment/midground/aqueduct_colonnade_ruins.svg',
      width: 680,
      height: 540,
      anchorX: 0.5,
      anchorY: 1.0,
      parallaxFactor: 0.36,
    },
    FORTRESS_ARMORY: {
      key: 'environment/midground/fortress_armory_vault',
      src: '/src/assets/environment/midground/fortress_armory_vault.svg',
      width: 480,
      height: 500,
      anchorX: 0.5,
      anchorY: 1.0,
      parallaxFactor: 0.38,
    },
    SOVEREIGN_THRONE: {
      key: 'environment/midground/sovereign_throne_landmark',
      src: '/src/assets/environment/midground/sovereign_throne_landmark.svg',
      width: 840,
      height: 980,
      anchorX: 0.5,
      anchorY: 1.0,
      parallaxFactor: 0.35,
    },
    SPIRE_GATEWAY: {
      key: 'environment/midground/spire_hex_pillar_gateway',
      src: '/src/assets/environment/midground/spire_hex_pillar_gateway.svg',
      width: 600,
      height: 520,
      anchorX: 0.5,
      anchorY: 1.0,
      parallaxFactor: 0.36,
    },
    HIVE_SECRET_CHAMBER: {
      key: 'environment/midground/hive_secret_chamber',
      src: '/src/assets/environment/midground/hive_secret_chamber.svg',
      width: 480,
      height: 460,
      anchorX: 0.5,
      anchorY: 1.0,
      parallaxFactor: 0.38,
    },
    WHISPERING_ELDER_OAK: {
      key: 'environment/midground/whispering_elder_oak_landmark',
      src: '/src/assets/environment/midground/whispering_elder_oak_landmark.svg',
      width: 720,
      height: 900,
      anchorX: 0.5,
      anchorY: 1.0,
      parallaxFactor: 0.35,
    },
    MYCELIUM_SHRINE: {
      key: 'environment/midground/mycelium_shrine_landmark',
      src: '/src/assets/environment/midground/mycelium_shrine_landmark.svg',
      width: 680,
      height: 880,
      anchorX: 0.5,
      anchorY: 1.0,
      parallaxFactor: 0.36,
    },
    BRIAR_GATE: {
      key: 'environment/midground/briar_gate_landmark',
      src: '/src/assets/environment/midground/briar_gate_landmark.svg',
      width: 640,
      height: 840,
      anchorX: 0.5,
      anchorY: 1.0,
      parallaxFactor: 0.36,
    },
    FOREST_KING: {
      key: 'environment/midground/forest_king_boss_landmark',
      src: '/src/assets/environment/midground/forest_king_boss_landmark.svg',
      width: 760,
      height: 980,
      anchorX: 0.5,
      anchorY: 1.0,
      parallaxFactor: 0.35,
    },
  },

  // ========================================================
  // 3. GAMEPLAY ASSETS (Modular 3-Slice Platforms & Ground)
  // ========================================================
  GAMEPLAY: {
    BOUNCY_MUSHROOM: {
      key: 'environment/gameplay/platform_bouncy_mushroom',
      src: '/src/assets/environment/gameplay/platform_bouncy_mushroom.svg',
      width: 240,
      height: 120,
      slice: {
        leftCap: 36,
        centerStart: 36,
        centerWidth: 168,
        rightCap: 36,
      },
    },
    MOSSY_BARK: {
      key: 'environment/gameplay/platform_mossy_bark',
      src: '/src/assets/environment/gameplay/platform_mossy_bark.svg',
      width: 280,
      height: 80,
      slice: {
        leftCap: 40,
        centerStart: 40,
        centerWidth: 200,
        rightCap: 40,
      },
    },
    THORN_BRAMBLE: {
      key: 'environment/gameplay/hazard_thorn_bramble',
      src: '/src/assets/environment/gameplay/hazard_thorn_bramble.svg',
      width: 240,
      height: 60,
      slice: {
        leftCap: 30,
        centerStart: 30,
        centerWidth: 180,
        rightCap: 30,
      },
    },
    HEX_PILLAR: {
      key: 'environment/gameplay/platform_hex_pillar',
      src: '/src/assets/environment/gameplay/platform_hex_pillar.svg',
      width: 180,
      height: 48,
      slice: {
        leftCap: 36,
        centerStart: 36,
        centerWidth: 108,
        rightCap: 36,
      },
    },
    HONEY_GEYSER: {
      key: 'environment/gameplay/geyser_honey_updraft',
      src: '/src/assets/environment/gameplay/geyser_honey_updraft.svg',
      width: 120,
      height: 160,
    },
    CRUMBLE_BLOCK: {
      key: 'environment/gameplay/platform_crumble_block',
      src: '/src/assets/environment/gameplay/platform_crumble_block.svg',
      width: 160,
      height: 48,
      slice: {
        leftCap: 32,
        centerStart: 32,
        centerWidth: 96,
        rightCap: 32,
      },
    },
    MEADOW_GROUND: {
      key: 'environment/gameplay/ground_meadow_tileset',
      src: '/src/assets/environment/gameplay/ground_meadow_tileset.svg',
      sourceWidth: 512,
      sourceHeight: 256,
      // Sub-rectangles within the tileset sheet
      centerTile: { x: 0, y: 0, w: 256, h: 256 },
      cliffLeft: { x: 256, y: 0, w: 128, h: 256 },
      cliffRight: { x: 384, y: 0, w: 128, h: 256 },
    },
    OAK_BOUGH: {
      key: 'environment/gameplay/platform_oak_bough',
      src: '/src/assets/environment/gameplay/platform_oak_bough.svg',
      width: 320,
      height: 64,
      // 3-slice metrics
      slice: {
        leftCap: 48,
        centerStart: 48,
        centerWidth: 224,
        rightCap: 48,
      },
    },
    SUNSTONE_SLAB: {
      key: 'environment/gameplay/platform_sunstone_slab',
      src: '/src/assets/environment/gameplay/platform_sunstone_slab.svg',
      width: 320,
      height: 64,
      slice: {
        leftCap: 48,
        centerStart: 48,
        centerWidth: 224,
        rightCap: 48,
      },
    },
    AMBER_RAFT: {
      key: 'environment/gameplay/platform_amber_raft',
      src: '/src/assets/environment/gameplay/platform_amber_raft.svg',
      width: 280,
      height: 64,
      slice: {
        leftCap: 40,
        centerStart: 40,
        centerWidth: 200,
        rightCap: 40,
      },
    },
    BRIDGE_ROPE: {
      key: 'environment/gameplay/bridge_wood_rope',
      src: '/src/assets/environment/gameplay/bridge_wood_rope.svg',
      width: 320,
      height: 64,
      slice: {
        leftCap: 48,
        centerStart: 48,
        centerWidth: 224,
        rightCap: 48,
      },
    },
    VINE_CLIMBABLE: {
      key: 'environment/gameplay/vine_climbable',
      src: '/src/assets/environment/gameplay/vine_climbable.svg',
      width: 64,
      height: 256,
      anchorX: 0.5,
      anchorY: 0.0,
    },
    SHRINE_ALTAR: {
      key: 'environment/gameplay/sunstone_shrine_altar',
      src: '/src/assets/environment/gameplay/sunstone_shrine_altar.svg',
      width: 120,
      height: 160,
      anchorX: 0.5,
      anchorY: 1.0,
    },
  },

  // ========================================================
  // 4. FOREGROUND ASSETS (Vignettes & Framing Silhouettes)
  // ========================================================
  FOREGROUND: {
    CANOPY_LEFT: {
      key: 'environment/foreground/canopy_framing_left',
      src: '/src/assets/environment/foreground/canopy_framing_left.svg',
      width: 500,
      height: 700,
      parallaxFactor: 1.18,
    },
    CANOPY_RIGHT: {
      key: 'environment/foreground/canopy_framing_right',
      src: '/src/assets/environment/foreground/canopy_framing_right.svg',
      width: 500,
      height: 700,
      parallaxFactor: 1.18,
    },
  },

  // ========================================================
  // 5. DETAIL ASSETS (Flora, Fungi, Signage)
  // ========================================================
  DETAILS: {
    BLUEBELLS: {
      key: 'environment/details/flower_bluebells',
      src: '/src/assets/environment/details/flower_bluebells.svg',
      width: 64,
      height: 64,
      anchorX: 0.5,
      anchorY: 1.0,
    },
    AMBER_BRACKET: {
      key: 'environment/details/mushroom_amber_bracket',
      src: '/src/assets/environment/details/mushroom_amber_bracket.svg',
      width: 80,
      height: 60,
      anchorX: 0.5,
      anchorY: 1.0,
    },
    ROAD_SIGN: {
      key: 'environment/details/ancient_road_sign',
      src: '/src/assets/environment/details/ancient_road_sign.svg',
      width: 90,
      height: 130,
      anchorX: 0.5,
      anchorY: 1.0,
    },
    PEBBLES_MOSSY: {
      key: 'environment/details/pebbles_mossy_cluster',
      src: '/src/assets/environment/details/pebbles_mossy_cluster.svg',
      width: 72,
      height: 40,
      anchorX: 0.5,
      anchorY: 1.0,
    },
    SUN_CRYSTAL: {
      key: 'environment/details/floating_sun_crystal',
      src: '/src/assets/environment/details/floating_sun_crystal.svg',
      width: 64,
      height: 96,
      anchorX: 0.5,
      anchorY: 0.5,
    },
  },

  // ========================================================
  // 6. ANTAGONIST & CINEMATIC EFFECTS
  // ========================================================
  EFFECTS: {
    QUEEN_MONARCH: {
      key: 'worlds/honeywood/effects/queen_bee_monarch',
      src: '/src/assets/worlds/honeywood/effects/queen_bee_monarch.svg',
      width: 600,
      height: 480,
    },
    QUEEN_EYES: {
      key: 'worlds/honeywood/effects/queen_bee_eyes',
      src: '/src/assets/worlds/honeywood/effects/queen_bee_eyes.svg',
      width: 110,
      height: 58,
    },
  },
};

/**
 * Preloads all environment kit assets into AssetManager cache.
 */
export async function preloadEnvironmentAssets() {
  const categories = Object.values(ENVIRONMENT_ASSETS);
  const promises = [];

  for (const cat of categories) {
    for (const def of Object.values(cat)) {
      if (def.key && def.src) {
        promises.push(assetManager.loadImage(def.key, def.src));
      }
    }
  }

  await Promise.all(promises);
  console.log(`[EnvironmentAssetLibrary] All ${promises.length} environment assets loaded successfully.`);
}
