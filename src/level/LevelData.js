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
        name: 'The Sunstone Glade & Whispering Canopy',
        worldName: 'Honeywood Kingdom',
        width: 8000,
        height: 1080,
        spawn: { x: 280, y: 790 },

        theme: {
          skyPeaceful: '#0284c7',
          skyCorrupted: '#0f172a',
          forestGreen: '#15803d',
          hiveAmber: '#f59e0b',
        },

        // Midground Authored Props (Landmarks, Ruin Arches & Secret Structures)
        midgroundProps: [
          // --- SECTION 1: THE SUNSTONE GLADE (0-2400px) ---
          // Beat 1: Arrival ancient oak framing on the far left edge
          { type: 'ancient_oak', x: 80, y: 880, scale: 0.9 },
          // Beat 3: Wild golden honeycomb nestled in canopy boughs above secret branch
          { type: 'wild_honeycomb', x: 1360, y: 380, scale: 0.85 },
          // Beat 4: Section 1 Landmark — Towering Ancient Oak & Sunstone Arch
          { type: 'ancient_oak', x: 2100, y: 880, scale: 1.15 },
          { type: 'sunstone_arch', x: 2100, y: 880, scale: 1.05 },

          // --- SECTION 2: THE WHISPERING CANOPY & AMBER CHASM (2400-5200px) ---
          // Beat 6: Chasm crossing wild honeycomb shelf
          { type: 'wild_honeycomb', x: 2880, y: 380, scale: 0.9 },
          // Beat 7: Section 2 Monumental Landmark — The Great Hollow Redwood & Amber Cataract
          { type: 'hollow_redwood', x: 3900, y: 900, scale: 1.15 },
          // Beat 8: Section 2 Secret Structure — The Forgotten Royal Apiary Sanctuary
          { type: 'royal_apiary', x: 4480, y: 340, scale: 0.95 },
          // Beat 8: Wild golden honeycomb shelf in upper sequoia boughs
          { type: 'wild_honeycomb', x: 4200, y: 340, scale: 0.85 },
          // Beat 9: Overgrown Outpost Gateway Arch to Section 3 Fortress
          { type: 'sunstone_arch', x: 5000, y: 780, scale: 1.1 },

          // --- SECTION 3: THE SUNSTONE AQUEDUCT & CRUMBLING FORTRESS (5200-8000px) ---
          // Beat 10: Classical Granite Aqueduct Colonnade Ruins spanning across viaduct
          { type: 'aqueduct_colonnade', x: 5520, y: 780, scale: 1.05 },
          // Beat 12: Section 3 Secret Structure — The Sunstone Armory Vault
          { type: 'fortress_armory', x: 6300, y: 360, scale: 0.95 },
          // Beat 13: Secondary Aqueduct Colonnade Arches
          { type: 'aqueduct_colonnade', x: 6540, y: 780, scale: 1.0 },
          // Beat 14: Section 3 Monumental Landmark — The Sunstone Fortress Watchtower
          { type: 'fortress_watchtower', x: 7150, y: 880, scale: 1.15 },
          // Beat 15: Grand Citadel Gateway Arch to Hive Spire
          { type: 'sunstone_arch', x: 7840, y: 760, scale: 1.15 },
        ],

        // Solid Platforms (Modular 3-slice oak boughs, bouncy amber rafts, vines, stone terraces & crumble blocks)
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

          // 31. Grand Citadel Gateway Viaduct (Section 3 Climax & Batboy Sanctuary)
          { x: 7680, y: 760, width: 320, height: 200, type: 'stone' },
        ],

        // Moving Platforms (Runestone Lifts & Elevators)
        movingPlatforms: [
          // Moving Runestone 1: Horizontal Viaduct Cross-Chasm Ferry (Beat 11)
          { startX: 5540, startY: 700, endX: 5720, endY: 700, width: 160, height: 36, type: 'moving_runestone', speed: 1.1 },
          // Moving Runestone 2: Vertical Secret Armory Elevator (Beat 12: lifts Aria to high vault!)
          { startX: 6220, startY: 660, endX: 6220, endY: 420, width: 160, height: 36, type: 'moving_runestone', speed: 1.0, phaseOffset: 1.2 },
          // Moving Runestone 3: Horizontal Watchtower Moat Ferry (Beat 13)
          { startX: 6580, startY: 660, endX: 6740, endY: 660, width: 160, height: 36, type: 'moving_runestone', speed: 1.2, phaseOffset: 2.1 },
        ],

        // Authored Detail Flora, Fungi, Signage & Magical Props
        detailProps: [
          // --- SECTION 1 DETAILS ---
          // Beat 1: Quiet Arrival clearing
          { type: 'bluebells', x: 140, y: 880, scale: 1.0 },
          { type: 'road_sign', x: 320, y: 880, scale: 1.0 },
          { type: 'pebbles', x: 420, y: 880, scale: 1.0 },

          // Beat 2: Under-bridge clearing
          { type: 'amber_bracket', x: 800, y: 880, scale: 1.0 },
          { type: 'bluebells', x: 960, y: 880, scale: 1.0 },
          { type: 'pebbles', x: 1100, y: 880, scale: 0.9 },

          // Beat 3: Secret high canopy branch & landing terrace
          { type: 'sun_crystal', x: 1360, y: 390, scale: 1.0 },
          { type: 'amber_bracket', x: 1290, y: 460, scale: 0.85 },
          { type: 'bluebells', x: 1480, y: 640, scale: 0.85 },

          // Beat 4: Landmark Courtyard & Altar
          { type: 'shrine_altar', x: 2100, y: 880, scale: 1.0 },
          { type: 'bluebells', x: 1960, y: 880, scale: 1.0 },
          { type: 'pebbles', x: 2030, y: 880, scale: 1.1 },
          { type: 'bluebells', x: 2220, y: 880, scale: 1.0 },

          // --- SECTION 2 DETAILS ---
          // Beat 5: Chasm Brink Warning
          { type: 'road_sign', x: 2420, y: 880, scale: 1.0 },
          { type: 'pebbles', x: 2440, y: 880, scale: 1.0 },

          // Beat 6: Chasm crossing details
          { type: 'amber_bracket', x: 3100, y: 640, scale: 0.85 },

          // Beat 7: Midpoint Hollow Redwood Sanctuary Checkpoint 2
          { type: 'shrine_altar', x: 3540, y: 720, scale: 1.0 },
          { type: 'bluebells', x: 3580, y: 720, scale: 1.0 },
          { type: 'pebbles', x: 3660, y: 720, scale: 1.0 },
          { type: 'amber_bracket', x: 3820, y: 600, scale: 0.9 },

          // Beat 8: Secret Royal Apiary Sanctuary Floating Relic
          { type: 'sun_crystal', x: 4480, y: 250, scale: 1.0 },
          { type: 'amber_bracket', x: 4340, y: 340, scale: 0.85 },
          { type: 'bluebells', x: 4620, y: 680, scale: 0.9 },

          // Beat 9: Outpost Approach
          { type: 'bluebells', x: 4860, y: 780, scale: 1.0 },
          { type: 'pebbles', x: 4940, y: 780, scale: 1.0 },

          // --- SECTION 3 DETAILS ---
          // Beat 10: Colonnade Gateway Checkpoint 3
          { type: 'shrine_altar', x: 5360, y: 780, scale: 1.0 },
          { type: 'road_sign', x: 5280, y: 780, scale: 1.0 },
          { type: 'pebbles', x: 5460, y: 780, scale: 1.1 },

          // Beat 12: Secret Sunstone Armory Vault Core
          { type: 'sun_crystal', x: 6300, y: 270, scale: 1.1 },
          { type: 'pebbles', x: 6460, y: 740, scale: 1.0 },

          // Beat 14: Watchtower Bastion Checkpoint 4 & Relic
          { type: 'shrine_altar', x: 6920, y: 740, scale: 1.0 },
          { type: 'pebbles', x: 7060, y: 740, scale: 1.1 },
          { type: 'sun_crystal', x: 7560, y: 280, scale: 1.0 },

          // Beat 15: Citadel Gateway Approach
          { type: 'pebbles', x: 7720, y: 760, scale: 1.1 },
        ],

        // Collectibles: Royal Shards
        shards: [
          // --- SECTION 1 SHARDS ---
          // Traversal Parabolic Jump Arc across Rope Bridge (Beat 2)
          { x: 960, y: 560 },
          { x: 1020, y: 520 },
          { x: 1080, y: 520 },
          { x: 1140, y: 560 },

          // Optional High Route Secret Discovery Reward (Beat 3)
          { x: 1320, y: 410 },
          { x: 1400, y: 410 },

          // Approach to Landmark Courtyard (Beat 4)
          { x: 1820, y: 800 },
          { x: 1900, y: 800 },

          // --- SECTION 2 SHARDS ---
          // Chasm Brink Leap Arc (Beat 5)
          { x: 2520, y: 780 },
          { x: 2600, y: 730 },

          // Bouncy Amber Launch Arc 1 (Beat 6)
          { x: 2700, y: 640 },
          { x: 2740, y: 560 },

          // High Vine Ascent Sequence (Beat 6)
          { x: 2950, y: 620 },
          { x: 2950, y: 520 },

          // Hollow Redwood Cataract Launch Arc (Beat 7)
          { x: 3840, y: 540 },
          { x: 3880, y: 400 },
          { x: 3940, y: 400 },

          // Secret Royal Apiary Sanctuary Crown Reward (Beat 8)
          { x: 4420, y: 260 },
          { x: 4460, y: 230 },
          { x: 4500, y: 230 },
          { x: 4540, y: 260 },

          // Outpost Gateway Approach (Beat 9)
          { x: 4860, y: 720 },
          { x: 4940, y: 720 },

          // --- SECTION 3 SHARDS ---
          // Moving Runestone 1 Ferry Leap Arc (Beat 11)
          { x: 5600, y: 630 },
          { x: 5660, y: 610 },

          // Crumble Block 1 Precision Landing Arc (Beat 11)
          { x: 5840, y: 570 },
          { x: 5900, y: 530 },

          // Secret Sunstone Armory Vault Crown Treasury (Beat 12)
          { x: 6240, y: 260 },
          { x: 6280, y: 230 },
          { x: 6320, y: 230 },
          { x: 6360, y: 260 },

          // Lower Canal Crumble Crossing (Beat 12)
          { x: 6320, y: 680 },
          { x: 6480, y: 670 },

          // Watchtower Moat Moving Ferry Leap (Beat 13)
          { x: 6660, y: 590 },
          { x: 6780, y: 540 },

          // Watchtower Rampart Ascent Stairway (Beat 14)
          { x: 7240, y: 530 },
          { x: 7420, y: 410 },
          { x: 7580, y: 290 },

          // Citadel Gateway Grand Approach (Beat 15)
          { x: 7720, y: 700 },
          { x: 7780, y: 700 },
          { x: 7840, y: 700 },
        ],

        // Coordinated Enemy Encounter Ecosystem:
        // 6 Distinct Authored Encounters across the 8,000px Journey
        enemies: [
          // --- SECTION 1 ENCOUNTERS ---
          // Encounter 1: "The Suspended Bridge Pincer" (Beat 2: x: 920-1200)
          // Ground Pressure: Hive Grub corners ground approaches
          { type: 'hive_grub', x: 1040, y: 836, patrolMinX: 840, patrolMaxX: 1240 },
          // Air Pressure & Distraction: Honey Wisp hovers directly above rope bridge
          { type: 'honey_wisp', x: 1050, y: 560, amplitude: 52, frequency: 2.1 },

          // Encounter 2: "The Sunstone Terrace Siege" (Beat 3: x: 1420-1780)
          // Armored Control: Honey Beetle charges across meadow, frontal armor deflects strikes
          { type: 'honey_beetle', x: 1540, y: 822, patrolMinX: 1380, patrolMaxX: 1780 },
          // Air Pressure & Ambush: Hive Firefly cruises canopy airspace, diving on jumps
          { type: 'hive_firefly', x: 1620, y: 520, patrolMinX: 1420, patrolMaxX: 1780 },

          // --- SECTION 2 ENCOUNTERS ---
          // Encounter 3: "The Chasm Aerial Ambush" (Beat 6: x: 2800-3350)
          // Harassment Distraction: Honey Wisp hovers over bouncy amber rafts
          { type: 'honey_wisp', x: 2920, y: 480, amplitude: 55, frequency: 2.2 },
          // Ambush Predator: Hive Firefly perched on high bough, diving to punish precarious leaps
          { type: 'hive_firefly', x: 3200, y: 420, patrolMinX: 2950, patrolMaxX: 3450 },

          // Encounter 4: "The Redwood Sentry Gate" (Beat 8: x: 4300-4700)
          // Armored Control: Honey Beetle guards the lower gnarled root bridge
          { type: 'honey_beetle', x: 4420, y: 622, patrolMinX: 4320, patrolMaxX: 4560 },
          // Ground Pressure: Hive Grub scuttles along the approach terrace
          { type: 'hive_grub', x: 4640, y: 636, patrolMinX: 4580, patrolMaxX: 4780 },

          // --- SECTION 3 ENCOUNTERS ---
          // Encounter 5: "The Aqueduct Colonnade Phalanx" (Beat 11: x: 5600-6150)
          // Armored Control: Honey Beetle guards the narrow central stone viaduct
          { type: 'honey_beetle', x: 6020, y: 522, patrolMinX: 5980, patrolMaxX: 6160 },
          // Air Pressure & Bombardment: Elite Hive Firefly diving from aqueduct archway
          { type: 'hive_firefly', x: 5820, y: 400, patrolMinX: 5650, patrolMaxX: 6150 },

          // Encounter 6: "The Watchtower Rampart Siege" (Beat 14: x: 6880-7550)
          // Armored Control: Honey Beetle defends the watchtower courtyard gate
          { type: 'honey_beetle', x: 7000, y: 682, patrolMinX: 6880, patrolMaxX: 7160 },
          // Harassment Distraction: Honey Wisp hovering over mid-ramparts
          { type: 'honey_wisp', x: 7240, y: 520, amplitude: 50, frequency: 2.2 },
          // Elite Aerial Predator: Hive Firefly circling high watchtower battlements
          { type: 'hive_firefly', x: 7450, y: 380, patrolMinX: 7300, patrolMaxX: 7600 },
        ],

        // Checkpoints (4 Regional Checkpoints across the 8,000px Journey)
        checkpoint: { x: 740, y: 840, width: 40, height: 40 },
        checkpoints: [
          { id: 1, x: 740, y: 840, width: 40, height: 40 },
          { id: 2, x: 3540, y: 680, width: 40, height: 40 },
          { id: 3, x: 5360, y: 740, width: 40, height: 40 },
          { id: 4, x: 6920, y: 700, width: 40, height: 40 },
        ],

        // Goal: Ancient Citadel Sunstone Shrine & Batboy Chrysalis Cage (Beat 15)
        goal: { x: 7860, y: 700, width: 64, height: 64, type: 'batboy' },
      },
    },
  },
};

export const LEVEL_1_1 = WORLDS.WORLD_1.levels['1-1'];
