// Comprehensive QA & Stability Audit Suite for Worlds 4, 5, and 6
import { LEVEL_4_1, LEVEL_5_1, LEVEL_6_1 } from '../src/level/LevelData.js';
import { Level } from '../src/level/Level.js';
import { Player } from '../src/entities/Player.js';

console.log('====================================================');
console.log('STARTING WORLDS 4, 5 & 6 COMPREHENSIVE QA AUDIT PASS');
console.log('====================================================\n');

const worlds = [
  { num: 4, name: 'The Volcano of Hot Honey', data: LEVEL_4_1 },
  { num: 5, name: 'The Desert of Endless Sandwiches', data: LEVEL_5_1 },
  { num: 6, name: 'The Clockwork Kingdom', data: LEVEL_6_1 },
];

const results = {};

for (const w of worlds) {
  console.log(`\n--- AUDITING WORLD ${w.num}: ${w.name} ---`);
  const data = w.data;
  const audit = {
    bugsFound: [],
    bugsFixed: [],
    enemyPlaneIssues: [],
    checkpointIssues: [],
    softLockIssues: [],
    runtimeErrors: [],
  };

  // 1. Check Level Geometry
  if (data.width !== 10800 || data.height !== 1080) {
    audit.bugsFound.push(`Invalid dimensions: ${data.width}x${data.height} (expected 10800x1080)`);
  }

  const spawn = data.spawnPoint || data.spawn;
  if (!spawn) {
    audit.bugsFound.push('Missing spawn point in LevelData!');
  } else {
    console.log(`Spawn point: x=${spawn.x}, y=${spawn.y}`);
  }

  // 2. Audit Enemy Placement & Plane Alignment
  console.log(`Auditing ${data.enemies.length} enemy placements for plane alignment...`);
  const solidPlatforms = data.platforms.filter(p => p.type !== 'lava' && p.type !== 'mustard_river' && p.type !== 'clock_pendulum' && p.type !== 'solar_grill');
  
  for (let i = 0; i < data.enemies.length; i++) {
    const e = data.enemies[i];
    const eType = e.type;

    // Find platform under ground enemies
    const isGroundEnemy = ['magma_grub', 'lava_beetle', 'mustard_mummy', 'cheese_scorpion', 'spring_knight', 'honey_dragon', 'sandwich_king', 'time_tinker'].includes(eType);
    const isFlyingEnemy = ['fire_bee', 'pickle_bomber', 'clockwork_bee'].includes(eType);
    const isCeilingEnemy = ['mechanical_spider'].includes(eType);

    if (isGroundEnemy) {
      // Find platform directly under enemy X position
      const platUnder = solidPlatforms.find(p => e.x >= p.x - 20 && e.x <= p.x + p.width + 20 && Math.abs(p.y - (e.y + 64)) < 120);
      if (!platUnder) {
        audit.enemyPlaneIssues.push(`Ground enemy #${i} '${eType}' at x:${e.x}, y:${e.y} has no solid platform directly underneath!`);
      } else {
        const expectedY = platUnder.y - 64; // Assuming height ~64 for standard ground entities
        const diff = Math.abs(e.y - expectedY);
        if (diff > 40) {
          audit.enemyPlaneIssues.push(`Ground enemy #${i} '${eType}' at x:${e.x}, y:${e.y} is misaligned with platform at y:${platUnder.y} (diff=${diff}px)`);
        }
      }
    }

    if (isFlyingEnemy) {
      if (e.y < 100 || e.y > 900) {
        audit.enemyPlaneIssues.push(`Flying enemy #${i} '${eType}' at x:${e.x}, y:${e.y} is out of playable vertical camera bounds!`);
      }
    }

    if (isCeilingEnemy) {
      if (e.y > 600) {
        audit.enemyPlaneIssues.push(`Ceiling enemy #${i} '${eType}' at x:${e.x}, y:${e.y} is spawned too low for a ceiling crawler!`);
      }
    }
  }

  // 3. Audit Checkpoints Safety & Alignment
  console.log(`Auditing ${data.checkpoints.length} regional checkpoints...`);
  for (let i = 0; i < data.checkpoints.length; i++) {
    const cp = data.checkpoints[i];
    const cpBottom = cp.y + cp.height;
    
    // Check if checkpoint sits on a solid platform
    const platformSustaining = solidPlatforms.find(p => cp.x + cp.width / 2 >= p.x && cp.x + cp.width / 2 <= p.x + p.width && Math.abs(p.y - cpBottom) < 40);
    
    if (!platformSustaining) {
      audit.checkpointIssues.push(`Checkpoint #${cp.id} at x:${cp.x}, y:${cp.y} is NOT positioned on a solid platform! (Could lead to pit/hazard respawn loop)`);
    } else {
      console.log(`Checkpoint #${cp.id} (x:${cp.x}, y:${cp.y}) correctly supported by platform (x:${platformSustaining.x}, y:${platformSustaining.y}, type:${platformSustaining.type})`);
    }

    // Check if checkpoint overlaps a hazard
    const hazardOverlap = data.platforms.find(p => (p.type === 'lava' || p.type === 'mustard_river' || p.type === 'molten_honey' || p.type === 'clock_pendulum') && 
      cp.x < p.x + p.width && cp.x + cp.width > p.x && cp.y < p.y + p.height && cp.y + cp.height > p.y);
    if (hazardOverlap) {
      audit.checkpointIssues.push(`Checkpoint #${cp.id} at x:${cp.x}, y:${cp.y} OVERLAPS A HAZARD (${hazardOverlap.type})!`);
    }
  }

  // 4. Runtime Simulation Test (Level instantiation + physics loop)
  try {
    const levelInstance = new Level(data);
    const playerInstance = new Player(spawn.x, spawn.y);

    console.log(`Running 3000 frames (50s simulation) for World ${w.num}...`);
    let dt = 1 / 60;
    for (let frame = 0; frame < 3000; frame++) {
      // Step player across level
      playerInstance.x = 200 + (frame / 3000) * 10200;
      playerInstance.y = 700;
      playerInstance.update(
        { isDown: () => false, justPressed: () => false },
        null,
        dt,
        levelInstance
      );
      levelInstance.update(playerInstance, { lives: 3, addScore: () => {}, loseLife: () => 3 }, null, null, dt);

      if (isNaN(playerInstance.x) || isNaN(playerInstance.y)) {
        audit.softLockIssues.push(`Player position became NaN at frame ${frame}!`);
        break;
      }
    }
    console.log(`World ${w.num} runtime simulation complete with 0 crashes.`);
  } catch (err) {
    audit.runtimeErrors.push(`Runtime error during simulation: ${err.stack || err.message}`);
  }

  results[w.num] = audit;
}

console.log('\n====================================================');
console.log('AUDIT RESULTS SUMMARY');
console.log('====================================================');
console.log(JSON.stringify(results, null, 2));
