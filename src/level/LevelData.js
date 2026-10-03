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

        // Solid Platforms (Modular 3-slice oak boughs, bouncy amber rafts, vines, stone terraces, crumble blocks, & hex pillars)
        platforms: [
          // ========================================================
          // SECTION 1: THE SUNSTONE GLADE (0 - 2,400px)
          // ========================================================
          // 1. Continuous Meadow Ground with Grass Cap & Root Loam (terminates at chasm brink x: 2460)
          { x: 0, y: 880, width: 2460, height: 200, type: 'ground' },

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
          // 7. Bouncy Amber Nectar Raft 1 (High elastic launch across chasm entry)
          { x: 2680, y: 760, width: 220, height: 42, type: 'honey' },

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

          // Encounter 8: "The Sovereign Throne Royal Guard" (Beat 19: x: 9700-10250)
          // Armored Control: Elite Honey Beetle defending the ante-chamber gatehouse
          { type: 'honey_beetle', x: 9940, y: 662, patrolMinX: 9840, patrolMaxX: 10120 },
          // Elite Aerial Bombardier: Hive Firefly circling high spire battlements
          { type: 'hive_firefly', x: 10050, y: 390, patrolMinX: 9880, patrolMaxX: 10250 },
          // Harassment Air Pressure: Honey Wisp guarding the throne approach
          { type: 'honey_wisp', x: 10180, y: 540, amplitude: 55, frequency: 2.2 },
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
};

export const LEVEL_1_1 = WORLDS.WORLD_1.levels['1-1'];
export const LEVEL_2_1 = WORLDS.WORLD_2.levels['2-1'];

