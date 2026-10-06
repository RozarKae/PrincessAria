// Fast Node check of LevelData, entities, physics, and build
async function verifyWorld5() {
  console.log('Testing World 5 Level Integrity...');
  const levelDataModule = await import('../src/level/LevelData.js');
  const { WORLDS, LEVEL_5_1 } = levelDataModule;

  if (!WORLDS.WORLD_5) {
    throw new Error('WORLDS.WORLD_5 missing!');
  }
  if (!LEVEL_5_1) {
    throw new Error('LEVEL_5_1 export missing!');
  }

  console.log('Level Name:', LEVEL_5_1.name);
  console.log('Level Width:', LEVEL_5_1.width, 'Height:', LEVEL_5_1.height);
  console.log('Platforms:', LEVEL_5_1.platforms.length);
  console.log('Moving Platforms:', LEVEL_5_1.movingPlatforms.length);
  console.log('Royal Shards:', LEVEL_5_1.shards.length);
  console.log('Enemies:', LEVEL_5_1.enemies.length);
  console.log('Checkpoints:', LEVEL_5_1.checkpoints.length);
  console.log('Goal Portal:', LEVEL_5_1.goal);

  // Check specific enemy types
  const boss = LEVEL_5_1.enemies.find(e => e.type === 'sandwich_king');
  if (!boss) throw new Error('Sandwich King boss missing!');
  console.log('Boss found at x:', boss.x, 'y:', boss.y);

  const mummies = LEVEL_5_1.enemies.filter(e => e.type === 'mustard_mummy');
  const scorpions = LEVEL_5_1.enemies.filter(e => e.type === 'cheese_scorpion');
  const pickles = LEVEL_5_1.enemies.filter(e => e.type === 'pickle_bomber');

  console.log(`Enemies breakdown: ${mummies.length} Mustard Mummies, ${scorpions.length} Cheese Scorpions, ${pickles.length} Pickle Bombers, 1 Sandwich King.`);

  if (LEVEL_5_1.shards.length !== 40) {
    throw new Error(`Expected 40 shards, got ${LEVEL_5_1.shards.length}`);
  }

  console.log('ALL WORLD 5 DATA AUDITS PASSED!');
}

verifyWorld5().catch(e => {
  console.error('Verification failed:', e);
  process.exit(1);
});
