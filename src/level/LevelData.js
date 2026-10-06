/**
 * LEVEL DATA — HONEYWOOD GLADE & WHISPERING CANOPY (WORLD EXPANSION)
 * 
 * Production-grade authored interactive world (width: 5,200px):
 * SECTION 1: The Sunstone Glade (0–2,400px) — Morning glade, ancient oak boughs, rope bridge, landmark shrine
 * SECTION 2: The Whispering Canopy & Amber Chasm (2,400–5,200px) — Bottomless amber chasm, bouncy honey rafts,
 *            climbable hanging vines, The Great Hollow Redwood landmark, and The Forgotten Royal Apiary secret sanctuary.
 * 
 * Built strictly according to the Project Aria Master Visual Development Bible:
 * - 100% authored illustrated assets (zero primitive canvas shapes)
 * - Distinct biome materials, acoustics, vegetation, and lighting
 * - Coordinated enemy encounters with role synergies
 */

export const WORLDS = {
  WORLD_1: {
    id: 1,
    name: 'Honeywood Kingdom',
    description: 'An enchanted golden realm where giant fairytale oaks give way to ancient redwood canopies and wild honeycombs.',
    levels: {
      '1-1': {
        world: 1,
        stage: 1,
        name: 'The Honeywood Kingdom: Glade to Sovereign Spire',
        worldName: 'Honeywood Kingdom',
        width: 10800,
        height: 1080,
        spawn: { x: 280, y: 790 },

        theme: {
          skyPeaceful: '#0284c7',
          skyCorrupted: '#0f172a',
          forestGreen: '#15803d',
          hiveAmber: '#f59e0b',
        },

        // Baseline Physics Profile: Reference platformer controls
        physics: {
          gravity: 2500,
          jumpVelocity: -1020,
          doubleJumpVelocity: -880,
          friction: 1.0,
          airControl: 1.0,
        },

        // Midground Authored Props (Rare Monumental Landmarks only — negative space is intentional)
        midgroundProps: [
          // 1. Section 1 Forest Landmark: Ancient Fairytale Oak (x: 2100)
          { type: 'ancient_oak', x: 2100, y: 880, scale: 1.0 },
          // 2. Section 2 Deeper Forest Landmark: The Great Hollow Redwood (x: 3900)
          { type: 'hollow_redwood', x: 3900, y: 900, scale: 1.0 },
          // 3. Section 3 Fortress Approach Landmark: The Sunstone Watchtower (x: 7150)
          { type: 'fortress_watchtower', x: 7150, y: 880, scale: 1.0 },
          // 4. Section 4 Spire Gateway Landmark: The Colonnade Hex Archway (x: 8150)
          { type: 'spire_gateway', x: 8150, y: 760, scale: 1.0 },
          // 5. Section 4 Secret Landmark: The Queen's Forbidden Secret Chamber (x: 9380)
          { type: 'hive_secret_chamber', x: 9380, y: 340, scale: 1.0 },
          // 6. Section 4 Climax Landmark: The Sovereign Royal Chrysalis Throne (x: 10400)
          { type: 'sovereign_throne', x: 10400, y: 720, scale: 1.0 },
        ],

        // Solid Platforms (Modular oak boughs, wooden spoon crossings, snapping flowers, amber rafts, vines, stone terraces)
        platforms: [
          // ========================================================
          // SECTION 1: THE SUNSTONE GLADE (0 - 2,400px)
          // ========================================================
          // 1. Continuous Meadow Ground with Grass Cap & Root Loam (terminates at chasm brink x: 2460)
          { x: 0, y: 880, width: 2460, height: 200, type: 'ground' },

          // Hostile Snapping Flowers in Meadow Grass
          { x: 1100, y: 848, width: 44, height: 32, type: 'snapping_flower' },
          { x: 2180, y: 848, width: 44, height: 32, type: 'snapping_flower' },

          // 2. Traversal Challenge: Low Mossy Oak Bough
          { x: 620, y: 720, width: 220, height: 38, type: 'wood' },

          // 3. Hanging Climbable Ivy Vine (dangling from oak bough toward lower bank)
          { x: 680, y: 735, width: 48, height: 145, type: 'climbable_vine' },

          // 4. Traversal Challenge: Suspended Wooden Rope Bridge
          { x: 920, y: 640, width: 260, height: 38, type: 'rope_bridge' },

          // 5. Optional High Route: Secret Canopy Branch
          { x: 1260, y: 460, width: 200, height: 36, type: 'wood' },

          // 6. Post-Bridge Landing Terrace: Carved Granite Sunstone Slab
          { x: 1420, y: 640, width: 220, height: 38, type: 'stone' },

          // ========================================================
          // SECTION 2: THE WHISPERING CANOPY & AMBER CHASM (2,400 - 5,200px)
          // ========================================================
          // 7. Wooden Spoon Crossing 1 & Bouncy Amber Raft 1 (High elastic launch across chasm entry)
          { x: 2500, y: 780, width: 200, height: 28, type: 'spoon_bridge' },
          { x: 2720, y: 760, width: 200, height: 42, type: 'honey' },

          // 8. Hanging Climbable Sequoia Vine 1 (Vertical ascent to bridge)
          { x: 2940, y: 440, width: 48, height: 260, type: 'climbable_vine' },

          // 9. Suspended Chasm Rope Bridge
          { x: 3060, y: 640, width: 240, height: 38, type: 'rope_bridge' },

          // 10. Bouncy Amber Nectar Raft 2 (Launch toward Hollow Redwood base)
          { x: 3340, y: 740, width: 220, height: 42, type: 'honey' },

          // 11. Midpoint Sanctuary: Giant Redwood Root Base Terrace
          { x: 3520, y: 720, width: 280, height: 42, type: 'wood' },

          // 12. Landmark Interior: Hollow Redwood Low Fungal Shelf
          { x: 3780, y: 600, width: 220, height: 38, type: 'wood' },

          // 13. Landmark Interior: Glowing Amber Cataract Raft (Catapults to upper boughs!)
          { x: 3880, y: 480, width: 200, height: 40, type: 'honey' },

          // 14. Landmark Exterior: High Redwood Canopy Bough
          { x: 4060, y: 420, width: 240, height: 38, type: 'wood' },

          // 15. Hanging Canopy Vine 2 (Descent to Lower Root Bridge)
          { x: 4160, y: 440, width: 48, height: 240, type: 'climbable_vine' },

          // 16. Lower Route: Gnarled Redwood Root Bridge
          { x: 4320, y: 680, width: 260, height: 38, type: 'wood' },

          // 17. Lower Route: Ancient Sunstone Plinth Terrace
          { x: 4580, y: 680, width: 220, height: 42, type: 'stone' },

          // 17B. Wooden Spoon Crossing 2 over Amber Cataract
          { x: 4680, y: 740, width: 220, height: 28, type: 'spoon_bridge' },

          // 18. Upper Secret Route: The Forgotten Royal Apiary High Bough
          { x: 4360, y: 340, width: 240, height: 38, type: 'wood' },

          // 19. Section 2 Exit Outpost Stone Terrace (Gateway to Section 3 Fortress)
          { x: 4800, y: 780, width: 400, height: 200, type: 'stone' },

          // ========================================================
          // SECTION 3: THE SUNSTONE AQUEDUCT & CRUMBLING FORTRESS (5,200 - 8,000px)
          // ========================================================
          // 20. Colonnade Gateway Stone Terrace (Transition from Outpost)
          { x: 5240, y: 780, width: 280, height: 180, type: 'stone' },

          // 21. Crumble Block 1 (Aqueduct Viaduct Precision Leap)
          { x: 5780, y: 640, width: 160, height: 38, type: 'crumble_block' },

          // 22. Aqueduct Central Pillar Perch (Sentry Station)
          { x: 5980, y: 580, width: 200, height: 42, type: 'stone' },

          // 23. Lower Aqueduct Canal Crumble Block 2
          { x: 6240, y: 740, width: 160, height: 38, type: 'crumble_block' },

          // 24. High Secret Armory Vault Treasury Gallery
          { x: 6180, y: 360, width: 260, height: 38, type: 'stone' },

          // 25. Lower Canal Terrace
          { x: 6440, y: 740, width: 200, height: 42, type: 'stone' },

          // 26. Watchtower Moat Crumble Block 3
          { x: 6720, y: 620, width: 160, height: 38, type: 'crumble_block' },

          // 27. Watchtower Main Bastion Courtyard Terrace (Checkpoint 4)
          { x: 6860, y: 740, width: 340, height: 200, type: 'stone' },

          // 28. Watchtower Mid-Rampart Gallery Terrace
          { x: 7200, y: 600, width: 240, height: 40, type: 'stone' },

          // 29. Watchtower High Battlements Rampart
          { x: 7400, y: 480, width: 240, height: 40, type: 'stone' },

          // 30. High Crenellation Plinth (Stargazer Perch)
          { x: 7560, y: 360, width: 180, height: 38, type: 'stone' },

          // Hostile Snapping Flower 3 in Aqueduct Bed
          { x: 5780, y: 848, width: 44, height: 32, type: 'snapping_flower' },

          // 30B. Wooden Spoon Crossing 3 over Citadel Aqueduct
          { x: 7580, y: 740, width: 200, height: 28, type: 'spoon_bridge' },

          // 31. Grand Citadel Gateway Viaduct (Section 3 Climax & Spire Threshold)
          { x: 7680, y: 760, width: 320, height: 200, type: 'stone' },

          // ========================================================
          // SECTION 4: THE SOVEREIGN HIVE SPIRE (8,000 - 10,800px)
          // ========================================================
          // 32. Spire Threshold Colonnade Terrace (Checkpoint 5: x: 8180)
          { x: 8000, y: 760, width: 380, height: 220, type: 'stone' },

          // 33. Hex Gauntlet Platform 1 (Precision timing leap over obsidian void)
          { x: 8460, y: 680, width: 180, height: 42, type: 'hex_platform' },

          // 34. Hex Gauntlet Platform 2 (Mid-gauntlet rest perch)
          { x: 8700, y: 580, width: 180, height: 42, type: 'hex_platform' },

          // 35. Honey Geyser 1 (Vertical golden updraft launch into high galleries!)
          { x: 8940, y: 760, width: 120, height: 36, type: 'honey_geyser' },

          // 36. High Spire Hex Gallery (Vault access perched high above abyss)
          { x: 8980, y: 380, width: 220, height: 40, type: 'hex_platform' },

          // 37. The Queen's Secret Chamber High Vault Terrace (Secret Sanctuary)
          { x: 9260, y: 340, width: 240, height: 38, type: 'hex_platform' },

          // 38. Lower Route Sticky Amber Nectar Run (Viscous amber slowdown gauntlet)
          { x: 9240, y: 760, width: 300, height: 42, type: 'sticky_amber' },

          // 39. Lower Route Transition Hex Pier
          { x: 9600, y: 680, width: 200, height: 42, type: 'hex_platform' },

          // 40. High Spire Descending Hex Terrace
          { x: 9560, y: 440, width: 180, height: 40, type: 'hex_platform' },

          // 41. Royal Guard Ante-Chamber Terrace (Checkpoint 6: x: 9880)
          { x: 9840, y: 720, width: 320, height: 240, type: 'hex_platform' },

          // 42. Honey Geyser 2 (Ascending updraft to Sovereign Throne Dais!)
          { x: 10200, y: 740, width: 120, height: 36, type: 'honey_geyser' },

          // 43. Grand Sovereign Throne Dais (Climax Arena Platform)
          { x: 10320, y: 720, width: 480, height: 260, type: 'hex_platform' },

          // 44. Batboy Sovereign Chrysalis Throne Altar Perch (Climax Goal)
          { x: 10460, y: 580, width: 160, height: 40, type: 'hex_platform' },
        ],

        // Moving Platforms (Runestone Lifts & Hex Elevators)
        movingPlatforms: [
          // Moving Runestone 1: Horizontal Viaduct Cross-Chasm Ferry (Beat 11)
          { startX: 5540, startY: 700, endX: 5720, endY: 700, width: 160, height: 36, type: 'moving_runestone', speed: 1.1 },
          // Moving Runestone 2: Vertical Secret Armory Elevator (Beat 12: lifts Aria to high vault!)
          { startX: 6220, startY: 660, endX: 6220, endY: 420, width: 160, height: 36, type: 'moving_runestone', speed: 1.0, phaseOffset: 1.2 },
          // Moving Runestone 3: Horizontal Watchtower Moat Ferry (Beat 13)
          { startX: 6580, startY: 660, endX: 6740, endY: 660, width: 160, height: 36, type: 'moving_runestone', speed: 1.2, phaseOffset: 2.1 },
          // Moving Hex 4: Horizontal Gauntlet Cross-Void Ferry (Beat 17)
          { startX: 8640, startY: 660, endX: 8840, endY: 660, width: 160, height: 38, type: 'moving_hex', speed: 1.2, phaseOffset: 0.5 },
          // Moving Hex 5: Vertical Ante-Chamber Royal Elevator (Beat 19: lifts to high battlements)
          { startX: 9760, startY: 680, endX: 9760, endY: 460, width: 160, height: 38, type: 'moving_hex', speed: 1.1, phaseOffset: 1.5 },
        ],

        // Detail Props (Kept empty for disciplined retro negative space)
        detailProps: [],

        // Collectibles: Royal Shards across all 4 Sections
        shards: [
          // --- SECTION 1 SHARDS ---
          { x: 960, y: 560 },
          { x: 1020, y: 520 },
          { x: 1080, y: 520 },
          { x: 1140, y: 560 },
          { x: 1320, y: 410 },
          { x: 1400, y: 410 },
          { x: 1820, y: 800 },
          { x: 1900, y: 800 },

          // --- SECTION 2 SHARDS ---
          { x: 2520, y: 780 },
          { x: 2600, y: 730 },
          { x: 2700, y: 640 },
          { x: 2740, y: 560 },
          { x: 2950, y: 620 },
          { x: 2950, y: 520 },
          { x: 3840, y: 540 },
          { x: 3880, y: 400 },
          { x: 3940, y: 400 },
          { x: 4420, y: 260 },
          { x: 4460, y: 230 },
          { x: 4500, y: 230 },
          { x: 4540, y: 260 },
          { x: 4860, y: 720 },
          { x: 4940, y: 720 },

          // --- SECTION 3 SHARDS ---
          { x: 5600, y: 630 },
          { x: 5660, y: 610 },
          { x: 5840, y: 570 },
          { x: 5900, y: 530 },
          { x: 6240, y: 260 },
          { x: 6280, y: 230 },
          { x: 6320, y: 230 },
          { x: 6360, y: 260 },
          { x: 6320, y: 680 },
          { x: 6480, y: 670 },
          { x: 6660, y: 590 },
          { x: 6780, y: 540 },
          { x: 7240, y: 530 },
          { x: 7420, y: 410 },
          { x: 7580, y: 290 },
          { x: 7720, y: 700 },
          { x: 7780, y: 700 },
          { x: 7840, y: 700 },

          // --- SECTION 4 SHARDS ---
          // Spire Threshold Colonnade Approach (Beat 16)
          { x: 8080, y: 680 },
          { x: 8140, y: 650 },
          { x: 8200, y: 650 },
          { x: 8260, y: 680 },

          // Hex Gauntlet Leap Arc & Moving Hex Transfer (Beat 17)
          { x: 8520, y: 600 },
          { x: 8740, y: 510 },

          // Honey Geyser 1 Updraft Catapult Launch Arc (Beat 17)
          { x: 8980, y: 620 },
          { x: 8980, y: 470 },

          // High Secret Chamber Vault Keepsake Treasury (Beat 18)
          { x: 9320, y: 250 },
          { x: 9360, y: 220 },
          { x: 9400, y: 220 },
          { x: 9440, y: 250 },

          // Lower Sticky Amber Run Crossing (Beat 18)
          { x: 9340, y: 690 },
          { x: 9480, y: 690 },

          // Ante-Chamber Royal Elevator Ascent (Beat 19)
          { x: 9760, y: 570 },
          { x: 9920, y: 640 },
          { x: 10000, y: 640 },

          // Grand Sovereign Throne Climax Parabolic Approach (Beat 20)
          { x: 10240, y: 560 },
          { x: 10380, y: 490 },
          { x: 10440, y: 490 },
          { x: 10500, y: 550 },
        ],

        // Coordinated Enemy Encounter Ecosystem:
        // 8 Distinct Authored Encounters across the 10,800px Journey
        enemies: [
          // --- SECTION 1 ENCOUNTERS ---
          // Encounter 1: "The Suspended Bridge Pincer" (Beat 2: x: 920-1200)
          { type: 'hive_grub', x: 1040, y: 836, patrolMinX: 840, patrolMaxX: 1240 },
          { type: 'honey_wisp', x: 1050, y: 560, amplitude: 52, frequency: 2.1 },

          // Encounter 2: "The Sunstone Terrace Siege" (Beat 3: x: 1420-1780)
          { type: 'honey_beetle', x: 1540, y: 822, patrolMinX: 1380, patrolMaxX: 1780 },
          { type: 'hive_firefly', x: 1620, y: 520, patrolMinX: 1420, patrolMaxX: 1780 },

          // --- SECTION 2 ENCOUNTERS ---
          // Encounter 3: "The Chasm Aerial Ambush" (Beat 6: x: 2800-3350)
          { type: 'honey_wisp', x: 2920, y: 480, amplitude: 55, frequency: 2.2 },
          { type: 'hive_firefly', x: 3200, y: 420, patrolMinX: 2950, patrolMaxX: 3450 },

          // Encounter 4: "The Redwood Sentry Gate" (Beat 8: x: 4300-4700)
          { type: 'honey_beetle', x: 4420, y: 622, patrolMinX: 4320, patrolMaxX: 4560 },
          { type: 'hive_grub', x: 4640, y: 636, patrolMinX: 4580, patrolMaxX: 4780 },

          // --- SECTION 3 ENCOUNTERS ---
          // Encounter 5: "The Aqueduct Colonnade Phalanx" (Beat 11: x: 5600-6150)
          { type: 'honey_beetle', x: 6020, y: 522, patrolMinX: 5980, patrolMaxX: 6160 },
          { type: 'hive_firefly', x: 5820, y: 400, patrolMinX: 5650, patrolMaxX: 6150 },

          // Encounter 6: "The Watchtower Rampart Siege" (Beat 14: x: 6880-7550)
          { type: 'honey_beetle', x: 7000, y: 682, patrolMinX: 6880, patrolMaxX: 7160 },
          { type: 'honey_wisp', x: 7240, y: 520, amplitude: 50, frequency: 2.2 },
          { type: 'hive_firefly', x: 7450, y: 380, patrolMinX: 7300, patrolMaxX: 7600 },

          // --- SECTION 4 ENCOUNTERS ---
          // Encounter 7: "The Spire Hex Gauntlet" (Beat 17: x: 8460-9050)
          // Armored Control: Honey Beetle guards hex platform 1
          { type: 'honey_beetle', x: 8520, y: 622, patrolMinX: 8460, patrolMaxX: 8620 },
          // Elite Aerial Predator: Hive Firefly dive-bombing across hex chasm
          { type: 'hive_firefly', x: 8780, y: 440, patrolMinX: 8640, patrolMaxX: 8950 },
          // Harassment Distraction: Honey Wisp hovering over geyser 1
          { type: 'honey_wisp', x: 8980, y: 600, amplitude: 50, frequency: 2.3 },

          // Encounter 8: Canonical Climax Boss — "Honey Bumble" (Giant Armored Bee of the Canyon)
          { type: 'honey_bumble', x: 10100, y: 640 },
        ],

        // Checkpoints (6 Regional Checkpoints across the 10,800px Journey)
        checkpoint: { x: 740, y: 840, width: 40, height: 40 },
        checkpoints: [
          { id: 1, x: 740, y: 840, width: 40, height: 40 },
          { id: 2, x: 3540, y: 680, width: 40, height: 40 },
          { id: 3, x: 5360, y: 740, width: 40, height: 40 },
          { id: 4, x: 6920, y: 700, width: 40, height: 40 },
          { id: 5, x: 8180, y: 700, width: 40, height: 40 },
          { id: 6, x: 9880, y: 660, width: 40, height: 40 },
        ],

        // Goal: The Sovereign Royal Chrysalis Throne & Batboy Sanctuary (Beat 20)
        goal: { x: 10480, y: 520, width: 64, height: 64, type: 'batboy' },
      },
    },
  },

  WORLD_2: {
    id: 2,
    name: 'The Whispering Forest',
    description: 'An ancient mystical woodland where towering fairytale oaks whisper ancient warnings, giggling bioluminescent fungi mock travelers, and thorny brambles guard the corrupted Forest King.',
    levels: {
      '2-1': {
        world: 2,
        stage: 1,
        name: 'The Whispering Forest: Ancient Perimeter to the Heart of the Forest King',
        worldName: 'The Whispering Forest',
        width: 10800,
        height: 1080,
        spawn: { x: 260, y: 790 },

        theme: {
          skyPeaceful: '#1c0f2e',
          skyCorrupted: '#0a0614',
          forestGreen: '#15803d',
          fungusCyan: '#38bdf8',
          isForest2: true,
        },

        // World 2 Physics Profile: Dense mystical canopy, mossy traction, organic spring leaps
        physics: {
          gravity: 2550,
          jumpVelocity: -1010,
          doubleJumpVelocity: -870,
          friction: 1.15, // Grippy mossy bark traction
          airControl: 0.95,
        },

        // Canonical Sleeping Spores: Fungal puffballs emitting drowsy mist clouds
        sporePuffballs: [
          { x: 1800, y: 860 },
          { x: 3220, y: 860 },
          { x: 4800, y: 860 },
          { x: 6450, y: 860 },
          { x: 8240, y: 860 },
        ],

        // Canonical Mimic Trees: Deceptive ancient oaks that lash out if rushed
        mimicTrees: [
          { x: 2320, y: 880 },
          { x: 5850, y: 880 },
          { x: 7850, y: 880 },
        ],

        // Midground Monumental Landmarks across the 10,800px Journey
        midgroundProps: [
          // 1. Section 1 Landmark: The Whispering Elder Oak (x: 2100)
          { type: 'whispering_elder_oak', x: 2100, y: 880, scale: 1.0 },
          // 2. Section 2 Landmark: The Bioluminescent Mycelium Shrine (x: 4000)
          { type: 'mycelium_shrine', x: 4000, y: 880, scale: 1.0 },
          // 3. Section 3 Landmark: The Briar Gate of Ancient Thorns (x: 7200)
          { type: 'briar_gate', x: 7200, y: 880, scale: 1.0 },
          // 4. Section 4 Climax Landmark: The Sacred Grove of the Forest King (x: 10200)
          { type: 'forest_king', x: 10200, y: 880, scale: 1.0 },
        ],

        // Solid Platforms (Authored continuous terrain, bouncy mushrooms, mossy bark, vines, & thorn brambles)
        platforms: [
          // ========================================================
          // SECTION 1: THE WHISPERING PERIMETER & SPORE GLADES (0 - 2,500px)
          // ========================================================
          // 1. Continuous Forest Ground with Moss Cap & Root Loam (terminates at chasm brink x: 2480)
          { x: 0, y: 880, width: 2480, height: 200, type: 'ground' },

          // 2. Low Mossy Bark Bough
          { x: 560, y: 720, width: 220, height: 38, type: 'mossy_bark' },

          // 3. Hanging Climbable Liana Vine
          { x: 620, y: 735, width: 48, height: 145, type: 'climbable_vine' },

          // 4. Suspended Forest Rope Bridge
          { x: 860, y: 640, width: 260, height: 38, type: 'rope_bridge' },

          // 5. First Bouncy Bioluminescent Fungal Mushroom (High elastic launch!)
          { x: 1180, y: 840, width: 140, height: 42, type: 'bouncy_mushroom' },

          // 6. Optional High Canopy Route: Secret Giggling Fungus Hollow
          { x: 1260, y: 440, width: 220, height: 36, type: 'mossy_bark' },

          // 7. Post-Bridge Landing Terrace: Mossy Forest Slab
          { x: 1540, y: 640, width: 220, height: 38, type: 'wood' },

          // 8. Hanging Climbable Liana 2
          { x: 1720, y: 655, width: 48, height: 225, type: 'climbable_vine' },

          // 9. High Canopy Ledge approaching Elder Oak
          { x: 1840, y: 520, width: 200, height: 36, type: 'mossy_bark' },

          // ========================================================
          // SECTION 2: THE BIOLUMINESCENT FUNGAL HOLLOWS (2,500 - 5,400px)
          // ========================================================
          // 10. Bouncy Mushroom 1 (High elastic launch across chasm entry)
          { x: 2680, y: 780, width: 180, height: 42, type: 'bouncy_mushroom' },

          // 11. Hanging Climbable Root Liana 1
          { x: 2940, y: 440, width: 48, height: 280, type: 'climbable_vine' },

          // 12. Suspended Fungal Root Bridge
          { x: 3080, y: 640, width: 240, height: 38, type: 'rope_bridge' },

          // 13. Bouncy Mushroom 2 (Catapults to Mycelium Shrine terrace)
          { x: 3380, y: 760, width: 180, height: 42, type: 'bouncy_mushroom' },

          // 14. Subterranean Mycelium Terrace (Landmark Base)
          { x: 3620, y: 720, width: 680, height: 44, type: 'wood' },

          // 15. High Fairy Ring Mushroom Shelf 1
          { x: 4360, y: 520, width: 180, height: 38, type: 'bouncy_mushroom' },

          // 16. Secret Fairy Ring Sanctuary Canopy Shelf
          { x: 4480, y: 350, width: 240, height: 36, type: 'mossy_bark' },

          // 17. Hollow Bark Interior Tunnel
          { x: 4820, y: 680, width: 280, height: 42, type: 'mossy_bark' },

          // 18. Crumbling Bark Ledges (Shakes and reforms)
          { x: 5180, y: 640, width: 180, height: 38, type: 'crumble_block' },

          // ========================================================
          // SECTION 3: THE BRIAR THICKET & SHADOW CANOPY (5,400 - 8,200px)
          // ========================================================
          // 19. Briar Threshold Landing Terrace
          { x: 5420, y: 740, width: 360, height: 50, type: 'wood' },

          // 20. Thorn Bramble Hazard Pit 1
          { x: 5800, y: 860, width: 280, height: 40, type: 'thorn_bramble' },

          // 21. Overhead Mossy Bark Archway over Bramble Pit 1
          { x: 5840, y: 660, width: 220, height: 38, type: 'mossy_bark' },

          // 22. Hanging Climbable Liana to High Druidic Vault
          { x: 6100, y: 420, width: 48, height: 260, type: 'climbable_vine' },

          // 23. Secret Druidic Root Vault Stone Slab
          { x: 6240, y: 390, width: 240, height: 38, type: 'stone' },

          // 24. Thorn Bramble Hazard Pit 2
          { x: 6520, y: 860, width: 320, height: 40, type: 'thorn_bramble' },

          // 25. Bouncy Mushroom Launch across Bramble Pit 2
          { x: 6600, y: 720, width: 160, height: 40, type: 'bouncy_mushroom' },

          // 26. Crumbling Bark Ledges approaching Briar Gate
          { x: 6880, y: 620, width: 180, height: 38, type: 'crumble_block' },

          // 27. Briar Gatehouse Battlement
          { x: 7080, y: 680, width: 260, height: 42, type: 'mossy_bark' },

          // 28. Post-Gate Thorn Bramble Pit 3
          { x: 7460, y: 860, width: 280, height: 40, type: 'thorn_bramble' },

          // 29. Suspended Briar Rope Bridge
          { x: 7500, y: 660, width: 240, height: 38, type: 'rope_bridge' },

          // 30. Forest King Approach Terrace
          { x: 7820, y: 740, width: 320, height: 48, type: 'wood' },

          // ========================================================
          // SECTION 4: THE ANCIENT HEART & THE FOREST KING (8,200 - 10,800px)
          // ========================================================
          // 31. Sacred Grove Threshold
          { x: 8200, y: 760, width: 500, height: 50, type: 'wood' },

          // 32. Giant Root Arch
          { x: 8780, y: 640, width: 240, height: 40, type: 'mossy_bark' },

          // 33. Bouncy Mushroom Ascent to High Elder Canopy
          { x: 9100, y: 760, width: 160, height: 42, type: 'bouncy_mushroom' },

          // 34. Secret Elder Crown Canopy Bough
          { x: 9280, y: 360, width: 260, height: 38, type: 'mossy_bark' },

          // 35. Lower Canopy Terrace
          { x: 9340, y: 620, width: 280, height: 40, type: 'wood' },

          // 36. Forest King Sacred Grove Arena Floor
          { x: 9700, y: 880, width: 1000, height: 200, type: 'ground' },

          // 37. Left Bouncy Launch Mushroom (Catapults to Left Root Node!)
          { x: 9880, y: 840, width: 160, height: 42, type: 'bouncy_mushroom' },

          // 38. Right Bouncy Launch Mushroom (Catapults to Right Root Node!)
          { x: 10480, y: 840, width: 160, height: 42, type: 'bouncy_mushroom' },

          // 39. Left Corrupted Root Bough
          { x: 9980, y: 580, width: 200, height: 38, type: 'mossy_bark' },

          // 40. Right Corrupted Root Bough
          { x: 10260, y: 580, width: 200, height: 38, type: 'mossy_bark' },

          // 41. Center Forest King Heart Platform
          { x: 10120, y: 440, width: 180, height: 36, type: 'mossy_bark' },
        ],

        // Collectible Royal Shards (40 Authored Shards across the 10,800px Journey)
        shards: [
          // Section 1 Shards (1-10)
          { x: 420, y: 820 },
          { x: 620, y: 660 },
          { x: 740, y: 660 },
          { x: 940, y: 580 },
          { x: 1040, y: 580 },
          { x: 1200, y: 760 },
          // Secret 1: Giggling Fungus Hollow (4 shards)
          { x: 1300, y: 380 },
          { x: 1360, y: 380 },
          { x: 1420, y: 380 },
          { x: 1620, y: 580 },

          // Section 2 Shards (11-20)
          { x: 2720, y: 700 },
          { x: 3120, y: 580 },
          { x: 3220, y: 580 },
          { x: 3420, y: 680 },
          { x: 3740, y: 660 },
          // Secret 2: Fairy Ring Sanctuary (5 shards)
          { x: 4420, y: 290 },
          { x: 4480, y: 290 },
          { x: 4540, y: 290 },
          { x: 4600, y: 290 },
          { x: 4940, y: 620 },

          // Section 3 Shards (21-30)
          { x: 5520, y: 680 },
          { x: 5900, y: 600 },
          // Secret 3: Druidic Root Vault (5 shards)
          { x: 6280, y: 330 },
          { x: 6340, y: 330 },
          { x: 6400, y: 330 },
          { x: 6640, y: 640 },
          { x: 6940, y: 560 },
          { x: 7160, y: 620 },
          { x: 7560, y: 600 },
          { x: 7920, y: 680 },

          // Section 4 Shards (31-40)
          { x: 8340, y: 700 },
          { x: 8840, y: 580 },
          { x: 9140, y: 680 },
          // Secret 4: Elder Crown Canopy (4 shards)
          { x: 9320, y: 300 },
          { x: 9380, y: 300 },
          { x: 9440, y: 300 },
          { x: 9500, y: 300 },
          { x: 9940, y: 520 },
          { x: 10320, y: 520 },
          { x: 10520, y: 780 },
        ],

        // Coordinated Enemy Encounters across the 10,800px Journey
        enemies: [
          // --- SECTION 1 ENCOUNTERS ---
          // Encounter 1: "The Spore Glade Ambusher" (Beat 2: x: 920-1250)
          { type: 'shadow_squirrel', x: 1040, y: 836, patrolMinX: 920, patrolMaxX: 1220 },
          { type: 'spore_bomber', x: 1120, y: 520, amplitude: 45, frequency: 2.0 },

          // Encounter 2: "The Whispering Oak Vigil" (Beat 3: x: 1540-1920)
          { type: 'shadow_squirrel', x: 1620, y: 596, patrolMinX: 1540, patrolMaxX: 1860 },
          { type: 'vine_crawler', x: 1780, y: 842, patrolMinX: 1680, patrolMaxX: 1980 },

          // --- SECTION 2 ENCOUNTERS ---
          // Encounter 3: "The Fungal Hollows Aerial Ambush" (Beat 6: x: 2900-3450)
          { type: 'spore_bomber', x: 3100, y: 480, amplitude: 52, frequency: 2.2 },
          { type: 'vine_crawler', x: 3220, y: 602, patrolMinX: 3080, patrolMaxX: 3340 },

          // Encounter 4: "The Mycelium Shrine Phalanx" (Beat 8: x: 4200-4750)
          { type: 'thorn_goblin', x: 4320, y: 664, patrolMinX: 4220, patrolMaxX: 4520 },
          { type: 'spore_bomber', x: 4500, y: 440, amplitude: 48, frequency: 2.1 },

          // --- SECTION 3 ENCOUNTERS ---
          // Encounter 5: "The Briar Thicket Rolling Phalanx" (Beat 11: x: 5700-6300)
          { type: 'thorn_goblin', x: 5920, y: 604, patrolMinX: 5840, patrolMaxX: 6180 },
          { type: 'vine_crawler', x: 6140, y: 352, patrolMinX: 6020, patrolMaxX: 6360 },

          // Encounter 6: "The Briar Gatehouse Vanguard" (Beat 14: x: 6900-7550)
          { type: 'thorn_goblin', x: 7120, y: 624, patrolMinX: 7060, patrolMaxX: 7360 },
          { type: 'shadow_squirrel', x: 7360, y: 616, patrolMinX: 7220, patrolMaxX: 7540 },

          // --- SECTION 4 ENCOUNTERS ---
          // Encounter 7: "The Ancient Heart Guardians" (Beat 17: x: 8600-9400)
          { type: 'shadow_squirrel', x: 8820, y: 596, patrolMinX: 8740, patrolMaxX: 9080 },
          { type: 'spore_bomber', x: 9050, y: 460, amplitude: 50, frequency: 2.2 },
          { type: 'thorn_goblin', x: 9380, y: 564, patrolMinX: 9300, patrolMaxX: 9600 },

          // Encounter 8: "The Corrupted Forest King Titan Climax" (Beat 19-20: x: 9900-10600)
          { type: 'forest_king', x: 10200, y: 560 },
          { type: 'spore_bomber', x: 10080, y: 380, amplitude: 55, frequency: 2.3 },
          { type: 'shadow_squirrel', x: 10380, y: 836, patrolMinX: 10100, patrolMaxX: 10580 },
        ],

        // Checkpoints (6 Regional Checkpoints across the 10,800px Journey)
        checkpoint: { x: 700, y: 840, width: 40, height: 40 },
        checkpoints: [
          { id: 1, x: 700, y: 840, width: 40, height: 40 },
          { id: 2, x: 2520, y: 740, width: 40, height: 40 },
          { id: 3, x: 4200, y: 680, width: 40, height: 40 },
          { id: 4, x: 5600, y: 700, width: 40, height: 40 },
          { id: 5, x: 7400, y: 700, width: 40, height: 40 },
          { id: 6, x: 8800, y: 720, width: 40, height: 40 },
        ],

        // Goal: Ancient Gateway / Portal to World 3 (The Castle of a Thousand Doors)
        goal: { x: 10560, y: 780, width: 64, height: 64, type: 'portal' },
      },
    },
  },

  WORLD_3: {
    id: 3,
    name: 'The Castle of a Thousand Doors',
    description: 'A towering gothic citadel where every wall houses shifting dimensional doors, autonomous brooms sweep the stone corridors, winged keys flutter across chasms, and Sir Slam-A-Lot guards the northern bastion.',
    levels: {
      '3-1': {
        world: 3,
        stage: 1,
        name: 'The Castle of a Thousand Doors: Grand Vestibule to the Bastion Gate',
        worldName: 'The Castle of a Thousand Doors',
        width: 10800,
        height: 1080,
        spawn: { x: 260, y: 790 },

        theme: {
          skyMidnight: '#04040c',
          castleStone: '#1e293b',
          portalCyan: '#38bdf8',
          velvetCrimson: '#831843',
          isCastle3: true,
        },

        // World 3 Physics Profile: Polished Citadel Flagstones, slick slide momentum
        physics: {
          gravity: 2500,
          jumpVelocity: -1020,
          doubleJumpVelocity: -880,
          friction: 0.72, // Slick polished marble slide!
          airControl: 1.05,
        },

        // Midground Monumental Landmarks across the 10,800px Journey
        midgroundProps: [
          // 1. Section 1 Landmark: The Grand Vestibule Clocktower (x: 2100)
          { type: 'castle_clocktower', x: 2100, y: 880, scale: 1.0 },
          // 2. Section 2 Landmark: The Rose Stained-Glass Atrium (x: 4000)
          { type: 'rose_stained_glass', x: 4000, y: 880, scale: 1.0 },
          // 3. Section 3 Landmark: The High Castle Battlements & Catapult Spire (x: 7200)
          { type: 'castle_catapult_spire', x: 7200, y: 880, scale: 1.0 },
          // 4. Section 4 Climax Landmark: The Gateway Bastion of Sir Slam-A-Lot (x: 10200)
          { type: 'gateway_bastion', x: 10200, y: 880, scale: 1.0 },
        ],

        // Solid Platforms (Castle flagstone, stone slabs, climbable chains, velvet carpets, bouncy crests, crumble stone)
        platforms: [
          // ========================================================
          // SECTION 1: THE GRAND VESTIBULE & SHIFTING CORRIDORS (0 - 2,500px)
          // ========================================================
          // 1. Continuous Castle Flagstone Ground (terminates at grand staircase chasm x: 2480)
          { x: 0, y: 880, width: 2480, height: 200, type: 'castle_ground' },

          // 2. Low Granite Corridor Slab
          { x: 560, y: 720, width: 220, height: 38, type: 'castle_stone' },

          // 3. Hanging Climbable Iron Chain 1
          { x: 620, y: 735, width: 32, height: 145, type: 'climbable_chain' },

          // 4. Suspended Velvet Carpet Bridge 1
          { x: 860, y: 640, width: 260, height: 38, type: 'royal_carpet' },

          // 5. First Bouncy Crest Trampoline (High elastic launch!)
          { x: 1180, y: 840, width: 140, height: 42, type: 'bouncy_crest' },

          // 6. Optional High Vault Route: Secret Wine Vault
          { x: 1260, y: 440, width: 220, height: 36, type: 'castle_stone' },

          // 7. Post-Bridge Landing Terrace: Heavy Granite Ashlar
          { x: 1540, y: 640, width: 220, height: 38, type: 'castle_stone' },

          // 8. Hanging Climbable Chain 2
          { x: 1720, y: 655, width: 32, height: 225, type: 'climbable_chain' },

          // 9. High Gallery Ledge approaching Clocktower
          { x: 1840, y: 520, width: 200, height: 36, type: 'castle_stone' },

          // ========================================================
          // SECTION 2: THE HALL OF PORTRAITS & FLYING KEYS (2,500 - 5,400px)
          // ========================================================
          // 10. Bouncy Crest 2 across chasm entrance
          { x: 2680, y: 780, width: 180, height: 42, type: 'bouncy_crest' },

          // 11. Hanging Iron Chain 3
          { x: 2940, y: 440, width: 32, height: 280, type: 'climbable_chain' },

          // 12. Suspended Ornate Velvet Bridge 2
          { x: 3080, y: 640, width: 240, height: 38, type: 'royal_carpet' },

          // 13. Bouncy Crest 3 (Catapults to Stained Glass Atrium)
          { x: 3380, y: 760, width: 180, height: 42, type: 'bouncy_crest' },

          // 14. Grand Portrait Gallery Terrace (Landmark Base)
          { x: 3620, y: 720, width: 680, height: 44, type: 'castle_stone' },

          // 15. High Stained Glass Gallery Shelf 1
          { x: 4360, y: 520, width: 180, height: 38, type: 'bouncy_crest' },

          // 16. Secret Stained Glass Sanctuary Shelf
          { x: 4480, y: 350, width: 240, height: 36, type: 'castle_stone' },

          // 17. Vaulted Archway Corridor
          { x: 4820, y: 680, width: 280, height: 42, type: 'castle_stone' },

          // 18. Crumbling Stone Ledges (Cracks and drops)
          { x: 5180, y: 640, width: 180, height: 38, type: 'crumble_stone' },

          // ========================================================
          // SECTION 3: THE CLOCKWORK LIBRARY & BATTLEMENTS (5,400 - 8,200px)
          // ========================================================
          // 19. Battlement Threshold Landing Terrace
          { x: 5420, y: 740, width: 360, height: 50, type: 'castle_stone' },

          // 20. Iron Spikes Hazard Pit 1
          { x: 5800, y: 860, width: 280, height: 40, type: 'iron_spikes' },

          // 21. Overhead Granite Archway over Spike Pit 1
          { x: 5840, y: 660, width: 220, height: 38, type: 'castle_stone' },

          // 22. Hanging Climbable Chain to High Astrolabe Observatory
          { x: 6100, y: 420, width: 32, height: 260, type: 'climbable_chain' },

          // 23. Secret Astrolabe Observatory Stone Slab
          { x: 6240, y: 390, width: 240, height: 38, type: 'castle_stone' },

          // 23B. Bastion Portcullis Gate (Locked until Flying Key is captured!)
          { x: 6160, y: 640, width: 36, height: 240, type: 'bastion_portcullis' },

          // 24. Iron Spikes Hazard Pit 2
          { x: 6520, y: 860, width: 320, height: 40, type: 'iron_spikes' },
          { x: 6600, y: 720, width: 160, height: 40, type: 'bouncy_crest' },
          { x: 6880, y: 620, width: 180, height: 38, type: 'crumble_stone' },
          { x: 7080, y: 680, width: 260, height: 42, type: 'castle_stone' },
          { x: 7460, y: 860, width: 280, height: 40, type: 'iron_spikes' },
          { x: 7500, y: 660, width: 240, height: 38, type: 'royal_carpet' },
          { x: 7820, y: 740, width: 320, height: 48, type: 'castle_stone' },

          // Section 4 Platforms
          { x: 8200, y: 760, width: 500, height: 50, type: 'castle_stone' },
          { x: 8780, y: 640, width: 240, height: 40, type: 'castle_stone' },
          { x: 9100, y: 760, width: 160, height: 42, type: 'bouncy_crest' },
          { x: 9280, y: 360, width: 260, height: 38, type: 'castle_stone' },
          { x: 9340, y: 620, width: 280, height: 40, type: 'castle_stone' },
          { x: 9700, y: 880, width: 1100, height: 200, type: 'castle_ground' },
          { x: 9880, y: 840, width: 160, height: 42, type: 'bouncy_crest' },
          { x: 10480, y: 840, width: 160, height: 42, type: 'bouncy_crest' },
          { x: 9980, y: 580, width: 200, height: 38, type: 'castle_stone' },
          { x: 10260, y: 580, width: 200, height: 38, type: 'castle_stone' },
          { x: 10120, y: 440, width: 180, height: 36, type: 'castle_stone' },
        ],

        // Shifting Dimensional Portal Doors (Branching Crest Choices & Spatial Teleportation)
        portalDoors: [
          // Door Pair 1: Vestibule Alcove to High Vault Wine Rafters
          { id: 'p_1a', targetId: 'p_1b', x: 1480, y: 790, width: 48, height: 72, label: 'Vestibule Vault Door A' },
          { id: 'p_1b', targetId: 'p_1a', x: 1320, y: 368, width: 48, height: 72, label: 'Secret Wine Vault Door B' },

          // Section 2: Branching Crest Doors
          // Lion Crest Door -> High Vault Gallery (x: 4400, y: 380) where the Golden Flying Key flutters!
          { id: 'p_lion_a', targetId: 'p_lion_b', x: 3720, y: 648, width: 48, height: 72, crest: 'lion', label: 'Lion Crest Door' },
          { id: 'p_lion_b', targetId: 'p_lion_a', x: 4400, y: 380, width: 48, height: 72, crest: 'lion', label: 'Lion Vault Gallery' },

          // Raven Crest Door -> Secret Astrolabe Observatory
          { id: 'p_raven_a', targetId: 'p_raven_b', x: 3960, y: 648, width: 48, height: 72, crest: 'raven', label: 'Raven Crest Door' },
          { id: 'p_raven_b', targetId: 'p_raven_a', x: 6240, y: 340, width: 48, height: 72, crest: 'raven', label: 'Astrolabe Alcove' },

          // Serpent Crest Door -> Door Goblin Ambush Alcove
          { id: 'p_serpent_a', targetId: 'p_serpent_b', x: 4200, y: 648, width: 48, height: 72, crest: 'serpent', label: 'Serpent Crest Door' },
          { id: 'p_serpent_b', targetId: 'p_serpent_a', x: 5080, y: 680, width: 48, height: 72, crest: 'serpent', label: 'Serpent Ambush Lair' },
        ],

        // Collectible Royal Shards (40 Authored Shards across the 10,800px Journey)
        shards: [
          // Section 1 Shards (1-10)
          { x: 420, y: 820 },
          { x: 620, y: 660 },
          { x: 740, y: 660 },
          { x: 940, y: 580 },
          { x: 1040, y: 580 },
          { x: 1200, y: 760 },
          // Secret 1: Royal Wine Vault (4 shards)
          { x: 1300, y: 380 },
          { x: 1360, y: 380 },
          { x: 1420, y: 380 },
          { x: 1620, y: 580 },

          // Section 2 Shards (11-20)
          { x: 2720, y: 700 },
          { x: 3120, y: 580 },
          { x: 3220, y: 580 },
          { x: 3420, y: 680 },
          { x: 3740, y: 660 },
          // Secret 2: Stained Glass Gallery (5 shards)
          { x: 4420, y: 290 },
          { x: 4480, y: 290 },
          { x: 4540, y: 290 },
          { x: 4600, y: 290 },
          { x: 4940, y: 620 },

          // Section 3 Shards (21-30)
          { x: 5520, y: 680 },
          { x: 5900, y: 600 },
          // Secret 3: Astrolabe Observatory (5 shards)
          { x: 6280, y: 330 },
          { x: 6340, y: 330 },
          { x: 6400, y: 330 },
          { x: 6640, y: 640 },
          { x: 6940, y: 560 },
          { x: 7160, y: 620 },
          { x: 7560, y: 600 },
          { x: 7920, y: 680 },

          // Section 4 Shards (31-40)
          { x: 8340, y: 700 },
          { x: 8840, y: 580 },
          { x: 9140, y: 680 },
          // Secret 4: King's Armoury (4 shards)
          { x: 9320, y: 300 },
          { x: 9380, y: 300 },
          { x: 9440, y: 300 },
          { x: 9500, y: 300 },
          { x: 9940, y: 520 },
          { x: 10320, y: 520 },
          { x: 10520, y: 780 },
        ],

        // Coordinated Enemy Encounters across the 10,800px Journey
        enemies: [
          // --- SECTION 1 ENCOUNTERS ---
          // Encounter 1: "The Sweeping Vestibule" (x: 920-1250)
          { type: 'enchanted_broom', x: 1040, y: 824, patrolMinX: 920, patrolMaxX: 1220 },
          { type: 'flying_key', x: 1140, y: 520, amplitudeX: 90, amplitudeY: 40 },

          // Encounter 2: "The Disguised Corridors" (x: 1540-1920)
          { type: 'door_goblin', x: 1640, y: 816, patrolMinX: 1540, patrolMaxX: 1860 },
          { type: 'castle_knight', x: 1820, y: 812, patrolMinX: 1720, patrolMaxX: 1980 },

          // --- SECTION 2 ENCOUNTERS ---
          // Canonical Flying Key Retrieval: Perched in Lion Vault Gallery (Reached via Lion Crest Door)
          { type: 'flying_key', x: 4480, y: 320, amplitudeX: 90, amplitudeY: 45, frequency: 1.8 },
          // Serpent Crest Ambush: Door Goblin guarding false door room
          { type: 'door_goblin', x: 5120, y: 676, patrolMinX: 5040, patrolMaxX: 5240 },
          { type: 'castle_knight', x: 4320, y: 652, patrolMinX: 4220, patrolMaxX: 4520 },

          // --- SECTION 3 ENCOUNTERS ---
          // Canonical Broom Army Chase (x: 7400-8400): Sweeping broom phalanx forcing vertical chain ascent!
          { type: 'enchanted_broom', x: 7480, y: 824, patrolMinX: 7400, patrolMaxX: 7700 },
          { type: 'enchanted_broom', x: 7660, y: 824, patrolMinX: 7550, patrolMaxX: 7850 },
          { type: 'enchanted_broom', x: 7840, y: 824, patrolMinX: 7720, patrolMaxX: 8020 },
          { type: 'enchanted_broom', x: 8020, y: 824, patrolMinX: 7900, patrolMaxX: 8200 },
          { type: 'castle_knight', x: 7120, y: 612, patrolMinX: 7060, patrolMaxX: 7360 },

          // --- SECTION 4 ENCOUNTERS ---
          // Encounter 7: "The Royal Bastion Guardians" (x: 8600-9400)
          { type: 'castle_knight', x: 8820, y: 572, patrolMinX: 8740, patrolMaxX: 9080 },
          { type: 'enchanted_broom', x: 9050, y: 564, patrolMinX: 8940, patrolMaxX: 9240 },
          { type: 'door_goblin', x: 9380, y: 556, patrolMinX: 9300, patrolMaxX: 9600 },

          // Encounter 8: "The Sir Slam-A-Lot Titan Climax" (x: 9900-10600)
          { type: 'sir_slam_a_lot', x: 10200, y: 700 },
          { type: 'flying_key', x: 10080, y: 420, amplitudeX: 120, amplitudeY: 55 },
          { type: 'enchanted_broom', x: 10380, y: 824, patrolMinX: 10100, patrolMaxX: 10580 },
        ],

        // Checkpoints (6 Regional Checkpoints across the 10,800px Journey)
        checkpoint: { x: 700, y: 840, width: 40, height: 40 },
        checkpoints: [
          { id: 1, x: 700, y: 840, width: 40, height: 40 },
          { id: 2, x: 2520, y: 740, width: 40, height: 40 },
          { id: 3, x: 4200, y: 680, width: 40, height: 40 },
          { id: 4, x: 5600, y: 700, width: 40, height: 40 },
          { id: 5, x: 7400, y: 700, width: 40, height: 40 },
          { id: 6, x: 8800, y: 720, width: 40, height: 40 },
        ],

        // Goal: Ancient Grand Portal to World 4 (The Volcano of Hot Honey)
        goal: { x: 10560, y: 780, width: 64, height: 64, type: 'portal' },
      },
    },
  },

  // ========================================================
  // WORLD 4: THE VOLCANO OF HOT HONEY
  // ========================================================
  WORLD_4: {
    id: 4,
    name: 'The Volcano of Hot Honey',
    description: 'Erupting caldera of molten honey, thermal updrafts, armored fire beetles, and the legendary Honey Dragon',
    paletteTheme: 'volcano',
    levels: {
      '4-1': {
        world: 4,
        stage: 1,
        name: 'The Volcano of Hot Honey: Ash Caldera to the Heart of the Dragon',
        worldName: 'The Volcano of Hot Honey',
        biome: 'volcano',
        width: 10800,
        height: 1080,
        spawn: { x: 160, y: 820 },
        spawnPoint: { x: 160, y: 820 },

        // World 4 Physics Profile: Convective heat thermal buoyancy, lighter gravity, soaring momentum leaps
        physics: {
          gravity: 2350,
          jumpVelocity: -1000,
          doubleJumpVelocity: -940,
          friction: 0.95,
          airControl: 1.15,
        },

        // Ground & Platforms
        platforms: [
          // --- SECTION 1: THE ASH CALDERA & MOLTEN FALLS (x: 0 - 2,600) ---
          { x: 0, y: 880, width: 880, height: 200, type: 'basalt_ground' },
          // Molten honey river beneath basalt arches
          { x: 880, y: 980, width: 600, height: 100, type: 'molten_honey' },
          // Drifting Honey Rapids Raft 1 (Carries player forward at +160px/s; leaps inherit forward momentum!)
          { x: 920, y: 800, width: 140, height: 28, type: 'basalt_platform', currentVx: 160 },
          { x: 1120, y: 740, width: 120, height: 28, type: 'bouncy_amber_magma' },
          { x: 1300, y: 780, width: 160, height: 28, type: 'basalt_platform' },
          // Thermal Updraft #1
          { x: 1360, y: 880, width: 48, height: 100, type: 'thermal_updraft' },

          { x: 1480, y: 860, width: 640, height: 220, type: 'basalt_ground' },
          { x: 1680, y: 740, width: 160, height: 26, type: 'basalt_platform' },
          { x: 1900, y: 680, width: 140, height: 26, type: 'crumble_ash' },
          { x: 2100, y: 640, width: 160, height: 26, type: 'basalt_platform' },
          // Updraft #2
          { x: 2280, y: 820, width: 48, height: 120, type: 'thermal_updraft' },

          { x: 2260, y: 860, width: 540, height: 220, type: 'basalt_ground' },

          // --- SECTION 2: THE OBSIDIAN CAVERNS & LAVA RAPIDS (x: 2,600 - 5,400) ---
          // Wide boiling molten river
          { x: 2800, y: 980, width: 900, height: 100, type: 'molten_honey' },
          // Drifting Honey Rapids Raft 2 (Fast +180px/s forward drift across boiling chasm)
          { x: 2860, y: 800, width: 140, height: 28, type: 'basalt_platform', currentVx: 180 },
          { x: 3060, y: 740, width: 120, height: 26, type: 'crumble_ash' },
          { x: 3240, y: 680, width: 140, height: 28, type: 'basalt_platform' },
          // Updraft #3 (Launches to Secret Forge)
          { x: 3440, y: 860, width: 48, height: 120, type: 'thermal_updraft' },

          // Secret 1: The Obsidian Forge
          { x: 3400, y: 440, width: 280, height: 26, type: 'basalt_platform' },
          { x: 3480, y: 380, width: 120, height: 24, type: 'bouncy_amber_magma' },

          { x: 3660, y: 860, width: 680, height: 220, type: 'basalt_ground' },
          { x: 3900, y: 740, width: 160, height: 28, type: 'basalt_platform' },
          { x: 4120, y: 680, width: 140, height: 26, type: 'crumble_ash' },
          { x: 4320, y: 620, width: 160, height: 28, type: 'basalt_platform' },

          // Stepped lava falls
          { x: 4500, y: 980, width: 800, height: 100, type: 'molten_honey' },
          // Drifting Counter-Current Raft 3 (-140px/s upstream resistance)
          { x: 4560, y: 760, width: 120, height: 28, type: 'bouncy_amber_magma', currentVx: -140 },
          { x: 4740, y: 700, width: 140, height: 26, type: 'basalt_platform' },
          { x: 4940, y: 660, width: 140, height: 26, type: 'crumble_ash' },
          // Updraft #4
          { x: 5120, y: 880, width: 48, height: 100, type: 'thermal_updraft' },
          { x: 5200, y: 720, width: 160, height: 28, type: 'basalt_platform' },

          // --- SECTION 3: THE BOILING CRATERS & BASALT COLONNADE (x: 5,400 - 8,200) ---
          { x: 5400, y: 860, width: 680, height: 220, type: 'basalt_ground' },
          { x: 5620, y: 740, width: 140, height: 28, type: 'basalt_platform' },
          { x: 5820, y: 680, width: 120, height: 26, type: 'bouncy_amber_magma' },

          // Secret 2: Dragon's Hoard Cache
          { x: 6200, y: 380, width: 260, height: 26, type: 'basalt_platform' },
          { x: 6300, y: 320, width: 80, height: 24, type: 'bouncy_amber_magma' },

          // Wide Crater Molten Chasm
          { x: 6080, y: 980, width: 920, height: 100, type: 'molten_honey' },
          { x: 6140, y: 780, width: 120, height: 26, type: 'crumble_ash' },
          // Drifting Honey Rapids Raft 4 (Forward momentum sprint launch across crater abyss)
          { x: 6320, y: 720, width: 140, height: 28, type: 'basalt_platform', currentVx: 190 },
          { x: 6520, y: 660, width: 140, height: 26, type: 'crumble_ash' },
          // Updraft #5
          { x: 6720, y: 880, width: 48, height: 100, type: 'thermal_updraft' },
          { x: 6800, y: 700, width: 160, height: 28, type: 'basalt_platform' },

          { x: 7000, y: 860, width: 720, height: 220, type: 'basalt_ground' },
          { x: 7240, y: 740, width: 160, height: 28, type: 'basalt_platform' },
          { x: 7460, y: 680, width: 140, height: 26, type: 'crumble_ash' },
          { x: 7680, y: 640, width: 160, height: 28, type: 'bouncy_amber_magma' },

          // Gap to Section 4
          { x: 7860, y: 980, width: 400, height: 100, type: 'molten_honey' },
          { x: 7920, y: 760, width: 140, height: 28, type: 'basalt_platform' },
          // Updraft #6
          { x: 8100, y: 880, width: 48, height: 100, type: 'thermal_updraft' },

          // --- SECTION 4: THE HEART OF THE VOLCANO & DRAGON LAIR (x: 8,200 - 10,800) ---
          { x: 8200, y: 860, width: 720, height: 220, type: 'basalt_ground' },
          { x: 8460, y: 740, width: 160, height: 28, type: 'basalt_platform' },
          { x: 8680, y: 680, width: 140, height: 26, type: 'crumble_ash' },
          { x: 8900, y: 620, width: 160, height: 28, type: 'basalt_platform' },

          // Secret 3: Ancient Wyrm Nest
          { x: 9140, y: 400, width: 240, height: 26, type: 'basalt_platform' },
          { x: 9220, y: 340, width: 100, height: 24, type: 'bouncy_amber_magma' },

          // The Grand Honey Dragon Arena (x: 9,600 - 10,700)
          { x: 9600, y: 880, width: 1200, height: 200, type: 'basalt_ground' },
          // Flanking thermal updrafts for dodging the Dragon's sweeping breath
          { x: 9780, y: 840, width: 48, height: 80, type: 'thermal_updraft' },
          { x: 10580, y: 840, width: 48, height: 80, type: 'thermal_updraft' },
          // Overhead basalt viewing galleries
          { x: 9860, y: 560, width: 180, height: 28, type: 'basalt_platform' },
          { x: 10140, y: 500, width: 200, height: 28, type: 'basalt_platform' },
          { x: 10420, y: 560, width: 180, height: 28, type: 'basalt_platform' },
        ],

        // Moving Platforms traversing boiling magma pits
        movingPlatforms: [
          { x: 960, y: 720, width: 90, height: 22, minX: 920, maxX: 1220, speed: 70, type: 'moving_basalt' },
          { x: 2940, y: 740, width: 90, height: 22, minX: 2880, maxX: 3200, speed: 80, type: 'moving_basalt' },
          { x: 4620, y: 680, width: 90, height: 22, minX: 4560, maxX: 4880, speed: 85, type: 'moving_basalt' },
          { x: 6200, y: 740, width: 90, height: 22, minX: 6140, maxX: 6480, speed: 90, type: 'moving_basalt' },
          { x: 7920, y: 720, width: 90, height: 22, minX: 7860, maxX: 8160, speed: 75, type: 'moving_basalt' },
        ],

        // 40 Royal Shards
        shards: [
          // Section 1 Shards (1-10)
          { x: 280, y: 820 },
          { x: 440, y: 820 },
          { x: 660, y: 760 },
          { x: 960, y: 740 },
          { x: 1140, y: 680 },
          { x: 1380, y: 720 },
          { x: 1720, y: 680 },
          { x: 1940, y: 620 },
          { x: 2140, y: 580 },
          { x: 2420, y: 800 },

          // Section 2 Shards (11-20)
          { x: 2900, y: 740 },
          { x: 3100, y: 680 },
          { x: 3280, y: 620 },
          // Secret 1: Obsidian Forge (3 shards)
          { x: 3460, y: 380 },
          { x: 3520, y: 320 },
          { x: 3580, y: 380 },
          { x: 3940, y: 680 },
          { x: 4160, y: 620 },
          { x: 4600, y: 700 },
          { x: 4780, y: 640 },

          // Section 3 Shards (21-30)
          { x: 5460, y: 800 },
          { x: 5660, y: 680 },
          { x: 5860, y: 620 },
          // Secret 2: Dragon's Hoard (3 shards)
          { x: 6260, y: 320 },
          { x: 6320, y: 260 },
          { x: 6380, y: 320 },
          { x: 6600, y: 600 },
          { x: 7080, y: 800 },
          { x: 7280, y: 680 },
          { x: 7720, y: 580 },

          // Section 4 Shards (31-40)
          { x: 8320, y: 800 },
          { x: 8520, y: 680 },
          { x: 8740, y: 620 },
          // Secret 3: Ancient Wyrm Nest (3 shards)
          { x: 9180, y: 340 },
          { x: 9240, y: 280 },
          { x: 9300, y: 340 },
          { x: 9920, y: 500 },
          { x: 10200, y: 440 },
          { x: 10460, y: 500 },
          { x: 10540, y: 820 },
        ],

        // Coordinated Volcanic Encounters
        enemies: [
          // --- SECTION 1 ENCOUNTERS ---
          // Encounter 1: "The Ash Ridge Scouts" (x: 880-1300)
          { type: 'magma_grub', x: 960, y: 768, patrolMinX: 920, patrolMaxX: 1060 },
          { type: 'fire_bee', x: 1180, y: 560 },

          // Encounter 2: "The Molten Falls Crossers" (x: 1600-2100)
          { type: 'fire_bee', x: 1760, y: 520 },
          { type: 'lava_beetle', x: 1960, y: 820, patrolMinX: 1840, patrolMaxX: 2180 },

          // --- SECTION 2 ENCOUNTERS ---
          // Encounter 3: "The Obsidian Cavern Phalanx" (x: 2900-3400)
          { type: 'lava_beetle', x: 3080, y: 708, patrolMinX: 3020, patrolMaxX: 3200 },
          { type: 'fire_bee', x: 3260, y: 480 },

          // Encounter 4: "The Lava Rapids Swarm" (x: 3900-4450)
          { type: 'magma_grub', x: 3960, y: 708, patrolMinX: 3900, patrolMaxX: 4060 },
          { type: 'lava_beetle', x: 4180, y: 820, patrolMinX: 4080, patrolMaxX: 4340 },
          { type: 'fire_bee', x: 4360, y: 440 },

          // --- SECTION 3 ENCOUNTERS ---
          // Encounter 5: "The Boiling Crater Scouts" (x: 5600-6100)
          { type: 'fire_bee', x: 5740, y: 500 },
          { type: 'lava_beetle', x: 5900, y: 820, patrolMinX: 5780, patrolMaxX: 6060 },

          // Encounter 6: "The Basalt Colonnade Vanguard" (x: 6900-7600)
          { type: 'magma_grub', x: 7100, y: 828, patrolMinX: 7020, patrolMaxX: 7200 },
          { type: 'lava_beetle', x: 7320, y: 700, patrolMinX: 7240, patrolMaxX: 7420 },
          { type: 'fire_bee', x: 7520, y: 460 },

          // --- SECTION 4 ENCOUNTERS ---
          // Encounter 7: "The Dragon Lair Sentinels" (x: 8400-9200)
          { type: 'lava_beetle', x: 8560, y: 700, patrolMinX: 8480, patrolMaxX: 8640 },
          { type: 'fire_bee', x: 8820, y: 480 },
          { type: 'magma_grub', x: 9000, y: 588, patrolMinX: 8900, patrolMaxX: 9080 },

          // Encounter 8: "THE HONEY DRAGON CLIMAX" (x: 9800-10600)
          { type: 'honey_dragon', x: 10180, y: 640 },
          { type: 'fire_bee', x: 10020, y: 380 },
          { type: 'fire_bee', x: 10380, y: 380 },
        ],

        // 6 Regional Checkpoints
        checkpoint: { x: 600, y: 840, width: 40, height: 40 },
        checkpoints: [
          { id: 1, x: 600, y: 840, width: 40, height: 40 },
          { id: 2, x: 2400, y: 820, width: 40, height: 40 },
          { id: 3, x: 4200, y: 640, width: 40, height: 40 },
          { id: 4, x: 5800, y: 820, width: 40, height: 40 },
          { id: 5, x: 7600, y: 600, width: 40, height: 40 },
          { id: 6, x: 8800, y: 820, width: 40, height: 40 },
        ],

        // Goal: Ancient Portal to World 5 (The Desert of Endless Sandwiches)
        goal: { x: 10560, y: 780, width: 64, height: 64, type: 'portal' },
      },
    },
  },

  // ========================================================
  // WORLD 5: THE DESERT OF ENDLESS SANDWICHES
  // ========================================================
  WORLD_5: {
    id: 5,
    name: 'The Desert of Endless Sandwiches',
    description: 'Surreal desert of toasted bread dunes, spicy mustard rivers, slippery mayo slides, aged swiss cheese canyons, and the colossal Sandwich King',
    paletteTheme: 'sandwich',
    levels: {
      '5-1': {
        world: 5,
        stage: 1,
        name: 'The Desert of Endless Sandwiches: Bread Dunes to the Royal Deli Plateau',
        worldName: 'The Desert of Endless Sandwiches',
        biome: 'sandwich',
        width: 10800,
        height: 1080,
        spawn: { x: 280, y: 780 },
        spawnPoint: { x: 280, y: 780 },

        // World 5 Physics Profile: Crisp traction on toasted crust, slick slides on mayo, high springs on dill pickles
        physics: {
          gravity: 2400,
          jumpVelocity: -1000,
          doubleJumpVelocity: -900,
          friction: 1.0,
          airControl: 1.05,
        },

        // Ground & Platforms
        platforms: [
          // --- SECTION 1: THE BREAD DUNES & MUSTARD SPRINGS (x: 0 - 2,600) ---
          { x: 0, y: 880, width: 880, height: 200, type: 'bread_ground' },
          // Flowing Spicy Mustard River beneath toasted bread arches
          { x: 880, y: 980, width: 600, height: 100, type: 'mustard_river' },
          // Drifting Baguette Crust Raft
          { x: 920, y: 800, width: 140, height: 28, type: 'crust_platform' },
          // Crinkle-Cut Bouncy Dill Pickle Spring
          { x: 1120, y: 740, width: 120, height: 28, type: 'bouncy_pickle' },
          // Slippery Mayonnaise Slide Platform
          { x: 1300, y: 780, width: 160, height: 28, type: 'slippery_mayo' },
          // Climbable Party Toothpick with Spanish Olive
          { x: 1380, y: 560, width: 44, height: 220, type: 'climbable_toothpick' },

          { x: 1480, y: 860, width: 640, height: 220, type: 'bread_ground' },
          { x: 1680, y: 740, width: 160, height: 26, type: 'crust_platform' },
          { x: 1900, y: 680, width: 140, height: 26, type: 'crumble_cracker' },
          { x: 2100, y: 640, width: 160, height: 26, type: 'swiss_cheese_platform' },
          { x: 2280, y: 540, width: 44, height: 180, type: 'olive_spear' },

          { x: 2260, y: 860, width: 540, height: 220, type: 'bread_ground' },

          // --- SECTION 2: THE SWISS CHEESE CANYONS & PICKLE GROVES (x: 2,600 - 5,400) ---
          // Wide Mustard Rapids Chasm
          { x: 2800, y: 980, width: 900, height: 100, type: 'mustard_river' },
          { x: 2860, y: 800, width: 140, height: 28, type: 'crust_platform' },
          { x: 3060, y: 740, width: 120, height: 26, type: 'crumble_cracker' },
          { x: 3240, y: 680, width: 140, height: 28, type: 'swiss_cheese_platform' },
          { x: 3440, y: 480, width: 44, height: 200, type: 'climbable_toothpick' },

          // Secret 1: The Artisan Deli Vault (x: 3,400 - 3,680)
          { x: 3400, y: 440, width: 280, height: 26, type: 'crust_platform' },
          { x: 3480, y: 380, width: 120, height: 24, type: 'bouncy_pickle' },

          { x: 3660, y: 860, width: 680, height: 220, type: 'bread_ground' },
          { x: 3900, y: 740, width: 160, height: 28, type: 'swiss_cheese_platform' },
          { x: 4120, y: 680, width: 140, height: 26, type: 'crumble_cracker' },
          { x: 4320, y: 620, width: 160, height: 28, type: 'slippery_mayo' },

          // Stepped Mustard Falls
          { x: 4500, y: 980, width: 800, height: 100, type: 'mustard_river' },
          { x: 4560, y: 760, width: 120, height: 28, type: 'bouncy_pickle' },
          { x: 4740, y: 700, width: 140, height: 26, type: 'crust_platform' },
          { x: 4940, y: 660, width: 140, height: 26, type: 'crumble_cracker' },
          { x: 5120, y: 520, width: 44, height: 180, type: 'olive_spear' },
          { x: 5200, y: 720, width: 160, height: 28, type: 'swiss_cheese_platform' },

          // --- SECTION 3: THE CONDIMENT RAPIDS & CRACKER COLONNADE (x: 5,400 - 8,200) ---
          { x: 5400, y: 860, width: 680, height: 220, type: 'bread_ground' },
          { x: 5620, y: 740, width: 140, height: 28, type: 'crust_platform' },
          { x: 5820, y: 680, width: 120, height: 26, type: 'bouncy_pickle' },

          // Secret 2: The Aged Cheddar Grotto (x: 6,200 - 6,480)
          { x: 6200, y: 380, width: 260, height: 26, type: 'swiss_cheese_platform' },
          { x: 6300, y: 320, width: 80, height: 24, type: 'bouncy_pickle' },

          // Wide Canyon Chasm
          { x: 6080, y: 980, width: 920, height: 100, type: 'mustard_river' },
          { x: 6140, y: 780, width: 120, height: 26, type: 'crumble_cracker' },
          { x: 6320, y: 720, width: 140, height: 28, type: 'slippery_mayo' },
          { x: 6520, y: 660, width: 140, height: 26, type: 'crumble_cracker' },
          { x: 6720, y: 520, width: 44, height: 180, type: 'climbable_toothpick' },
          { x: 6800, y: 700, width: 160, height: 28, type: 'crust_platform' },

          { x: 7000, y: 860, width: 720, height: 220, type: 'bread_ground' },
          { x: 7240, y: 740, width: 160, height: 28, type: 'swiss_cheese_platform' },
          { x: 7460, y: 680, width: 140, height: 26, type: 'crumble_cracker' },
          { x: 7680, y: 640, width: 160, height: 28, type: 'bouncy_pickle' },

          // Gap to Section 4
          { x: 7860, y: 980, width: 400, height: 100, type: 'mustard_river' },
          { x: 7920, y: 760, width: 140, height: 28, type: 'crust_platform' },
          { x: 8100, y: 520, width: 44, height: 180, type: 'olive_spear' },

          // --- SECTION 4: THE ROYAL DELI PLATEAU & SANDWICH KING ARENA (x: 8,200 - 10,800) ---
          { x: 8200, y: 860, width: 720, height: 220, type: 'bread_ground' },
          { x: 8460, y: 740, width: 160, height: 28, type: 'crust_platform' },
          { x: 8680, y: 680, width: 140, height: 26, type: 'crumble_cracker' },
          { x: 8900, y: 620, width: 160, height: 28, type: 'swiss_cheese_platform' },

          // Secret 3: Golden Condiment Vault (x: 9,140 - 9,400)
          { x: 9140, y: 400, width: 240, height: 26, type: 'crust_platform' },
          { x: 9220, y: 340, width: 100, height: 24, type: 'bouncy_pickle' },

          // The Grand Sandwich King Banquet Arena (x: 9,600 - 10,750)
          { x: 9600, y: 880, width: 1200, height: 200, type: 'bread_ground' },
          // Flanking Bouncy Pickles for aerial evasion
          { x: 9780, y: 840, width: 64, height: 32, type: 'bouncy_pickle' },
          { x: 10580, y: 840, width: 64, height: 32, type: 'bouncy_pickle' },
          // Overhead Banquet Platter Viewing Galleries
          { x: 9860, y: 560, width: 180, height: 28, type: 'swiss_cheese_platform' },
          { x: 10140, y: 500, width: 200, height: 28, type: 'crust_platform' },
          { x: 10420, y: 560, width: 180, height: 28, type: 'swiss_cheese_platform' },
        ],

        // Moving Platforms across mustard rivers
        movingPlatforms: [
          { x: 960, y: 720, width: 90, height: 22, minX: 920, maxX: 1220, speed: 70, type: 'moving_crust' },
          { x: 2940, y: 740, width: 90, height: 22, minX: 2880, maxX: 3200, speed: 80, type: 'moving_cheese' },
          { x: 4620, y: 680, width: 90, height: 22, minX: 4560, maxX: 4880, speed: 85, type: 'moving_crust' },
          { x: 6200, y: 740, width: 90, height: 22, minX: 6140, maxX: 6480, speed: 90, type: 'moving_cheese' },
          { x: 7920, y: 720, width: 90, height: 22, minX: 7860, maxX: 8160, speed: 75, type: 'moving_crust' },
        ],

        // 40 Royal Shards
        shards: [
          // Section 1 Shards (1-10)
          { x: 280, y: 820 },
          { x: 440, y: 820 },
          { x: 660, y: 760 },
          { x: 960, y: 740 },
          { x: 1140, y: 680 },
          { x: 1380, y: 720 },
          { x: 1720, y: 680 },
          { x: 1940, y: 620 },
          { x: 2140, y: 580 },
          { x: 2420, y: 800 },

          // Section 2 Shards (11-20)
          { x: 2900, y: 740 },
          { x: 3100, y: 680 },
          { x: 3280, y: 620 },
          // Secret 1: Artisan Deli Vault (3 shards)
          { x: 3460, y: 380 },
          { x: 3520, y: 320 },
          { x: 3580, y: 380 },
          { x: 3940, y: 680 },
          { x: 4160, y: 620 },
          { x: 4600, y: 700 },
          { x: 4780, y: 640 },

          // Section 3 Shards (21-30)
          { x: 5460, y: 800 },
          { x: 5660, y: 680 },
          { x: 5860, y: 620 },
          // Secret 2: Aged Cheddar Grotto (3 shards)
          { x: 6260, y: 320 },
          { x: 6320, y: 260 },
          { x: 6380, y: 320 },
          { x: 6600, y: 600 },
          { x: 7080, y: 800 },
          { x: 7280, y: 680 },
          { x: 7720, y: 580 },

          // Section 4 Shards (31-40)
          { x: 8320, y: 800 },
          { x: 8520, y: 680 },
          { x: 8740, y: 620 },
          // Secret 3: Golden Condiment Vault (3 shards)
          { x: 9180, y: 340 },
          { x: 9240, y: 280 },
          { x: 9300, y: 340 },
          { x: 9920, y: 500 },
          { x: 10200, y: 440 },
          { x: 10460, y: 500 },
          { x: 10540, y: 820 },
        ],

        // Coordinated Desert Encounters
        enemies: [
          // --- SECTION 1 ENCOUNTERS ---
          // Encounter 1: "The Bread Dune Scouts" (x: 880-1300)
          { type: 'cheese_scorpion', x: 960, y: 768, patrolMinX: 920, patrolMaxX: 1060 },
          { type: 'pickle_bomber', x: 1180, y: 560 },

          // Encounter 2: "The Mustard Springs Vanguard" (x: 1600-2100)
          { type: 'pickle_bomber', x: 1760, y: 520 },
          { type: 'mustard_mummy', x: 1960, y: 820, patrolMinX: 1840, patrolMaxX: 2180 },

          // --- SECTION 2 ENCOUNTERS ---
          // Encounter 3: "The Swiss Canyon Phalanx" (x: 2900-3400)
          { type: 'mustard_mummy', x: 3080, y: 708, patrolMinX: 3020, patrolMaxX: 3200 },
          { type: 'cheese_scorpion', x: 3260, y: 648, patrolMinX: 3220, patrolMaxX: 3340 },

          // Encounter 4: "The Cracker Ridge Patrol" (x: 3900-4450)
          { type: 'cheese_scorpion', x: 3960, y: 708, patrolMinX: 3900, patrolMaxX: 4060 },
          { type: 'mustard_mummy', x: 4180, y: 820, patrolMinX: 4080, patrolMaxX: 4340 },
          { type: 'pickle_bomber', x: 4360, y: 440 },

          // --- SECTION 3 ENCOUNTERS ---
          // Encounter 5: "The Condiment Rapids Ambush" (x: 5600-6100)
          { type: 'pickle_bomber', x: 5740, y: 500 },
          { type: 'cheese_scorpion', x: 5900, y: 820, patrolMinX: 5780, patrolMaxX: 6060 },

          // Encounter 6: "The Cracker Colonnade Guards" (x: 6900-7600)
          { type: 'mustard_mummy', x: 7100, y: 828, patrolMinX: 7020, patrolMaxX: 7200 },
          { type: 'cheese_scorpion', x: 7320, y: 700, patrolMinX: 7240, patrolMaxX: 7420 },
          { type: 'pickle_bomber', x: 7520, y: 460 },

          // --- SECTION 4 ENCOUNTERS ---
          // Encounter 7: "The Royal Deli Sentinels" (x: 8400-9200)
          { type: 'mustard_mummy', x: 8560, y: 700, patrolMinX: 8480, patrolMaxX: 8640 },
          { type: 'pickle_bomber', x: 8820, y: 480 },
          { type: 'cheese_scorpion', x: 9000, y: 588, patrolMinX: 8900, patrolMaxX: 9080 },

          // Encounter 8: "THE SANDWICH KING CLIMAX" (x: 9800-10600)
          { type: 'sandwich_king', x: 10240, y: 640 },
          { type: 'pickle_bomber', x: 10020, y: 380 },
          { type: 'pickle_bomber', x: 10380, y: 380 },
        ],

        // 6 Regional Checkpoints
        checkpoint: { x: 600, y: 840, width: 40, height: 40 },
        checkpoints: [
          { id: 1, x: 600, y: 840, width: 40, height: 40 },
          { id: 2, x: 2400, y: 820, width: 40, height: 40 },
          { id: 3, x: 4200, y: 640, width: 40, height: 40 },
          { id: 4, x: 5800, y: 820, width: 40, height: 40 },
          { id: 5, x: 7600, y: 600, width: 40, height: 40 },
          { id: 6, x: 8800, y: 820, width: 40, height: 40 },
        ],

        // Goal: Ancient Portal to World 6 (The Clockwork Kingdom)
        goal: { x: 10560, y: 780, width: 64, height: 64, type: 'portal' },
      },
    },
  },

  // ========================================================
  // WORLD 6: THE CLOCKWORK KINGDOM
  // ========================================================
  WORLD_6: {
    name: 'The Clockwork Kingdom',
    levels: {
      '6-1': {
        name: 'The Grand Chronometer Citadel',
        world: 6,
        stage: 1,
        width: 10800,
        height: 1080,
        totalShards: 40,
        spawnPoint: { x: 120, y: 840 },
        theme: {
          isClockwork6: true,
          biome: 'clockwork',
          name: 'The Clockwork Kingdom',
        },

        // --- WORLD 6 PLATFORMS ---
        platforms: [
          // ========================================================
          // SECTION 1: THE BRASS GEARWORKS (0 - 2,700px)
          // ========================================================
          // Segment 1A: Entrance Portal Dais & Initial Gear Bridges (0 - 800px)
          { id: 'w6_ground_1a', x: 0, y: 880, width: 680, height: 200, type: 'clockwork_ground' },
          { id: 'w6_gear_1', x: 740, y: 800, width: 140, height: 32, type: 'rotating_gear', rotSpeed: 1.4 },
          { id: 'w6_bridge_1', x: 940, y: 740, width: 160, height: 24, type: 'ticking_bridge' },

          // Segment 1B: The Escapement Promenade & Astrolabe Gallery (800 - 1,800px)
          { id: 'w6_ground_1b', x: 1160, y: 880, width: 560, height: 200, type: 'clockwork_ground' },
          { id: 'w6_conveyor_1', x: 1300, y: 760, width: 220, height: 28, type: 'brass_conveyor', conveyorSpeed: 180 },
          { id: 'w6_spring_1', x: 1560, y: 680, width: 110, height: 24, type: 'collapsing_spring' },
          { id: 'w6_vent_1', x: 1700, y: 880, width: 70, height: 30, type: 'steam_vent' },

          // Secret 1: The Grand Astrolabe Gallery (Elevated Catwalk)
          { id: 'w6_secret1_catwalk', x: 1640, y: 440, width: 240, height: 24, type: 'clockwork_ground' },
          { id: 'w6_gear_2', x: 1920, y: 520, width: 120, height: 28, type: 'rotating_gear', rotSpeed: -1.2 },

          // Segment 1C: Gear Colonnade & Mainspring Arch (1,800 - 2,700px)
          { id: 'w6_ground_1c', x: 2080, y: 880, width: 640, height: 200, type: 'clockwork_ground' },
          { id: 'w6_bridge_2', x: 2240, y: 740, width: 150, height: 24, type: 'ticking_bridge' },
          { id: 'w6_chain_1', x: 2440, y: 380, width: 24, height: 360, type: 'climbable_gear_chain' },
          { id: 'w6_gear_3', x: 2500, y: 660, width: 130, height: 28, type: 'rotating_gear', rotSpeed: 1.5 },

          // ========================================================
          // SECTION 2: THE ASTROLABE CHASM & CHRONO BRIDGES (2,700 - 5,400px)
          // ========================================================
          // Segment 2A: Deep Chasm & Swinging Pendulum Crossing (2,700 - 3,600px)
          { id: 'w6_pendulum_gap_hazard', x: 2720, y: 1040, width: 780, height: 60, type: 'clock_pendulum' },
          { id: 'w6_gear_4', x: 2760, y: 780, width: 130, height: 28, type: 'rotating_gear', rotSpeed: -1.6 },
          { id: 'w6_spring_2', x: 2940, y: 700, width: 100, height: 24, type: 'collapsing_spring' },
          { id: 'w6_pendulum_1', x: 3080, y: 640, width: 40, height: 40, type: 'clock_pendulum' },
          { id: 'w6_bridge_3', x: 3160, y: 740, width: 160, height: 24, type: 'ticking_bridge' },
          { id: 'w6_gear_5', x: 3360, y: 680, width: 140, height: 28, type: 'rotating_gear', rotSpeed: 1.3 },

          // Segment 2B: The Celestial Horology Vault & Opposing Conveyors (3,600 - 4,500px)
          { id: 'w6_ground_2b', x: 3540, y: 880, width: 540, height: 200, type: 'clockwork_ground' },
          // Secret 2: High Horology Vault
          { id: 'w6_secret2_catwalk', x: 3520, y: 380, width: 260, height: 24, type: 'clockwork_ground' },
          { id: 'w6_chain_2', x: 3620, y: 404, width: 20, height: 360, type: 'climbable_gear_chain' },
          { id: 'w6_conveyor_2', x: 3740, y: 760, width: 240, height: 28, type: 'brass_conveyor', conveyorSpeed: -180 }, // Opposing speed!
          { id: 'w6_vent_2', x: 4020, y: 880, width: 70, height: 30, type: 'steam_vent' },

          // Segment 2C: High Chronometer Trusses (4,500 - 5,400px)
          { id: 'w6_ground_2c', x: 4120, y: 880, width: 620, height: 200, type: 'clockwork_ground' },
          { id: 'w6_gear_6', x: 4780, y: 780, width: 140, height: 28, type: 'rotating_gear', rotSpeed: -1.4 },
          { id: 'w6_bridge_4', x: 4960, y: 720, width: 160, height: 24, type: 'ticking_bridge' },
          { id: 'w6_spring_3', x: 5160, y: 660, width: 110, height: 24, type: 'collapsing_spring' },
          { id: 'w6_pendulum_2', x: 5300, y: 600, width: 40, height: 40, type: 'clock_pendulum' },

          // ========================================================
          // SECTION 3: THE SUNSTONE FOUNDRY & STEAM CONDUITS (5,400 - 8,200px)
          // ========================================================
          // Segment 3A: Solar Heat Grills & Steam Geysers (5,400 - 6,400px)
          { id: 'w6_ground_3a', x: 5440, y: 880, width: 620, height: 200, type: 'clockwork_ground' },
          { id: 'w6_solar_grill_1', x: 5660, y: 876, width: 180, height: 24, type: 'solar_grill' },
          { id: 'w6_vent_3', x: 5900, y: 880, width: 70, height: 30, type: 'steam_vent' },
          { id: 'w6_gear_7', x: 6020, y: 660, width: 150, height: 30, type: 'rotating_gear', rotSpeed: 1.5 },
          { id: 'w6_conveyor_3', x: 6220, y: 740, width: 220, height: 28, type: 'brass_conveyor', conveyorSpeed: 200 },

          // Segment 3B: The Eternal Mainspring Chamber (6,400 - 7,300px)
          { id: 'w6_ground_3b', x: 6480, y: 880, width: 580, height: 200, type: 'clockwork_ground' },
          // Secret 3: High Mainspring Chamber
          { id: 'w6_secret3_catwalk', x: 6840, y: 360, width: 280, height: 24, type: 'clockwork_ground' },
          { id: 'w6_chain_3', x: 6940, y: 384, width: 20, height: 380, type: 'climbable_gear_chain' },
          { id: 'w6_solar_grill_2', x: 6720, y: 876, width: 160, height: 24, type: 'solar_grill' },
          { id: 'w6_bridge_5', x: 7100, y: 720, width: 160, height: 24, type: 'ticking_bridge' },

          // Segment 3C: Foundry Battlement Towers (7,300 - 8,200px)
          { id: 'w6_ground_3c', x: 7300, y: 880, width: 680, height: 200, type: 'clockwork_ground' },
          { id: 'w6_gear_8', x: 7520, y: 740, width: 140, height: 28, type: 'rotating_gear', rotSpeed: -1.5 },
          { id: 'w6_spring_4', x: 7720, y: 680, width: 110, height: 24, type: 'collapsing_spring' },
          { id: 'w6_vent_4', x: 7880, y: 880, width: 70, height: 30, type: 'steam_vent' },
          { id: 'w6_conveyor_4', x: 8000, y: 760, width: 200, height: 28, type: 'brass_conveyor', conveyorSpeed: 180 },

          // ========================================================
          // SECTION 4: THE GRAND CHRONOMETER CITADEL & TIME TINKER (8,200 - 10,800px)
          // ========================================================
          // Segment 4A: The Royal Chronometer Gate (8,200 - 9,400px)
          { id: 'w6_ground_4a', x: 8240, y: 880, width: 680, height: 200, type: 'clockwork_ground' },
          { id: 'w6_gear_9', x: 8460, y: 760, width: 140, height: 28, type: 'rotating_gear', rotSpeed: 1.3 },
          { id: 'w6_bridge_6', x: 8660, y: 700, width: 160, height: 24, type: 'ticking_bridge' },
          { id: 'w6_ground_4b', x: 8960, y: 880, width: 720, height: 200, type: 'clockwork_ground' },
          { id: 'w6_spring_5', x: 9240, y: 740, width: 120, height: 24, type: 'collapsing_spring' },
          { id: 'w6_solar_grill_3', x: 9420, y: 876, width: 160, height: 24, type: 'solar_grill' },

          // Segment 4B: THE GRAND CHRONOMETER ARENA (9,800 - 10,800px)
          { id: 'w6_arena_floor', x: 9780, y: 880, width: 1020, height: 200, type: 'clockwork_ground' },
          // Escapement Platform Stations (Boss Battle Tiers)
          { id: 'w6_arena_tier_left', x: 9940, y: 720, width: 140, height: 26, type: 'rotating_gear', rotSpeed: 0.8 },
          { id: 'w6_arena_tier_center', x: 10220, y: 620, width: 160, height: 26, type: 'ticking_bridge' },
          { id: 'w6_arena_tier_right', x: 10500, y: 720, width: 140, height: 26, type: 'rotating_gear', rotSpeed: -0.8 },
        ],

        // --- WORLD 6 MIDGROUND PROPS (Landmarks & Clockwork Monuments) ---
        midgroundProps: [
          // Section 1 Landmark: The Grand Astrolabe Gallery
          { type: 'grand_astrolabe', x: 2100, y: 840 },
          // Section 2 Landmark: The Clock Tower of Thousand Escapements
          { type: 'clock_tower', x: 4200, y: 840 },
          // Section 3 Landmark: The Mainspring Forge Engine
          { type: 'mainspring_forge', x: 7200, y: 840 },
          // Section 4 Climax: The Time Tinker's Grand Chronometer Dais
          { type: 'chronometer_throne', x: 10240, y: 840 },
        ],

        // --- 40 ROYAL SUNSTONE SHARDS ---
        shards: [
          // Section 1 Shards (1 - 10)
          { id: 1, x: 380, y: 820 },
          { id: 2, x: 560, y: 800 },
          { id: 3, x: 780, y: 720 },
          { id: 4, x: 1010, y: 660 },
          { id: 5, x: 1380, y: 700 },
          { id: 6, x: 1580, y: 610 },
          // Secret 1: Astrolabe Gallery Shards
          { id: 7, x: 1680, y: 380 },
          { id: 8, x: 1760, y: 350 },
          { id: 9, x: 1840, y: 380 },
          { id: 10, x: 2300, y: 680 },

          // Section 2 Shards (11 - 20)
          { id: 11, x: 2620, y: 760 },
          { id: 12, x: 2810, y: 700 },
          { id: 13, x: 3000, y: 630 },
          { id: 14, x: 3220, y: 660 },
          { id: 15, x: 3420, y: 600 },
          // Secret 2: Horology Vault Shards
          { id: 16, x: 3580, y: 320 },
          { id: 17, x: 3660, y: 300 },
          { id: 18, x: 3740, y: 320 },
          { id: 19, x: 4320, y: 800 },
          { id: 20, x: 4840, y: 700 },

          // Section 3 Shards (21 - 30)
          { id: 21, x: 5040, y: 640 },
          { id: 22, x: 5240, y: 580 },
          { id: 23, x: 5540, y: 800 },
          { id: 24, x: 5740, y: 780 },
          { id: 25, x: 6080, y: 580 },
          { id: 26, x: 6300, y: 660 },
          // Secret 3: Mainspring Chamber Shards
          { id: 27, x: 6880, y: 300 },
          { id: 28, x: 6980, y: 280 },
          { id: 29, x: 7080, y: 300 },
          { id: 30, x: 7600, y: 660 },

          // Section 4 Shards (31 - 40)
          { id: 31, x: 7800, y: 600 },
          { id: 32, x: 8080, y: 680 },
          { id: 33, x: 8360, y: 800 },
          { id: 34, x: 8520, y: 680 },
          { id: 35, x: 8720, y: 620 },
          { id: 36, x: 9100, y: 800 },
          { id: 37, x: 9320, y: 660 },
          { id: 38, x: 9540, y: 780 },
          // Boss Arena Victory Shards
          { id: 39, x: 10000, y: 640 },
          { id: 40, x: 10440, y: 640 },
        ],

        movingPlatforms: [],

        // --- WORLD 6 BESTIARY ENCOUNTERS ---
        enemies: [
          // --- SECTION 1 ENCOUNTERS ---
          // Encounter 1: "The Gearworks Vanguard" (x: 400-900)
          { type: 'spring_knight', x: 520, y: 816, patrolMinX: 420, patrolMaxX: 620 },
          { type: 'clockwork_bee', x: 800, y: 580 },

          // Encounter 2: "The Escapement Ambush" (x: 1200-1700)
          { type: 'mechanical_spider', x: 1420, y: 460, dropDistance: 280 },
          { type: 'spring_knight', x: 1600, y: 816, patrolMinX: 1480, patrolMaxX: 1700 },

          // Encounter 3: "The Astrolabe Sentry" (x: 2100-2600)
          { type: 'clockwork_bee', x: 2260, y: 540 },
          { type: 'spring_knight', x: 2480, y: 816, patrolMinX: 2360, patrolMaxX: 2600 },

          // --- SECTION 2 ENCOUNTERS ---
          // Encounter 4: "The Chasm Droppers" (x: 2800-3400)
          { type: 'mechanical_spider', x: 2980, y: 420, dropDistance: 260 },
          { type: 'clockwork_bee', x: 3200, y: 500 },

          // Encounter 5: "The Horology Patrol" (x: 3600-4200)
          { type: 'spring_knight', x: 3820, y: 816, patrolMinX: 3700, patrolMaxX: 3980 },
          { type: 'mechanical_spider', x: 4100, y: 440, dropDistance: 280 },

          // Encounter 6: "The Chrono Bridge Sentinels" (x: 4600-5200)
          { type: 'clockwork_bee', x: 4760, y: 520 },
          { type: 'spring_knight', x: 5020, y: 656, patrolMinX: 4940, patrolMaxX: 5120 },

          // --- SECTION 3 ENCOUNTERS ---
          // Encounter 7: "The Solar Foundry Guards" (x: 5500-6200)
          { type: 'clockwork_bee', x: 5680, y: 520 },
          { type: 'spring_knight', x: 5960, y: 816, patrolMinX: 5840, patrolMaxX: 6060 },

          // Encounter 8: "The Mainspring Ambush" (x: 6500-7200)
          { type: 'mechanical_spider', x: 6680, y: 440, dropDistance: 280 },
          { type: 'clockwork_bee', x: 7040, y: 500 },

          // Encounter 9: "The Foundry Battlement Phalanx" (x: 7400-8000)
          { type: 'spring_knight', x: 7600, y: 816, patrolMinX: 7480, patrolMaxX: 7720 },
          { type: 'mechanical_spider', x: 7920, y: 460, dropDistance: 260 },

          // --- SECTION 4 ENCOUNTERS ---
          // Encounter 10: "The Citadel Portcullis Sentinels" (x: 8400-9200)
          { type: 'clockwork_bee', x: 8560, y: 520 },
          { type: 'spring_knight', x: 8840, y: 816, patrolMinX: 8700, patrolMaxX: 8980 },
          { type: 'mechanical_spider', x: 9140, y: 440, dropDistance: 280 },

          // Encounter 11: "THE TIME TINKER CLIMAX" (x: 9800-10600)
          { type: 'time_tinker', x: 10240, y: 720 },
          { type: 'clockwork_bee', x: 10020, y: 440 },
          { type: 'clockwork_bee', x: 10420, y: 440 },
        ],

        // 6 Regional Checkpoints
        checkpoint: { x: 600, y: 840, width: 40, height: 40 },
        checkpoints: [
          { id: 1, x: 600, y: 840, width: 40, height: 40 },
          { id: 2, x: 2400, y: 820, width: 40, height: 40 },
          { id: 3, x: 4200, y: 820, width: 40, height: 40 },
          { id: 4, x: 5800, y: 820, width: 40, height: 40 },
          { id: 5, x: 7600, y: 820, width: 40, height: 40 },
          { id: 6, x: 8800, y: 820, width: 40, height: 40 },
        ],

        // Goal: Ancient Ocean Gate to World 7 (The Kingdom Beneath the Sea)
        goal: { x: 10560, y: 780, width: 64, height: 64, type: 'portal' },
      },
    },
  },
};

export const LEVEL_1_1 = WORLDS.WORLD_1.levels['1-1'];
export const LEVEL_2_1 = WORLDS.WORLD_2.levels['2-1'];
export const LEVEL_3_1 = WORLDS.WORLD_3.levels['3-1'];
export const LEVEL_4_1 = WORLDS.WORLD_4.levels['4-1'];
export const LEVEL_5_1 = WORLDS.WORLD_5.levels['5-1'];
export const LEVEL_6_1 = WORLDS.WORLD_6.levels['6-1'];



