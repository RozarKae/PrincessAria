// Comprehensive Node verification of World 6: The Clockwork Kingdom
async function verifyWorld6() {
  console.log('Testing World 6 Level Integrity & Architecture...');
  const levelDataModule = await import('../src/level/LevelData.js');
  const { WORLDS, LEVEL_6_1 } = levelDataModule;

  if (!WORLDS.WORLD_6) {
    throw new Error('WORLDS.WORLD_6 missing in LevelData.js!');
  }
  if (!LEVEL_6_1) {
    throw new Error('LEVEL_6_1 export missing in LevelData.js!');
  }

  console.log('Level Name:', LEVEL_6_1.name);
  console.log('Level Width:', LEVEL_6_1.width, 'Height:', LEVEL_6_1.height);
  if (LEVEL_6_1.width !== 10800 || LEVEL_6_1.height !== 1080) {
    throw new Error(`Invalid level geometry: expected 10800x1080, got ${LEVEL_6_1.width}x${LEVEL_6_1.height}`);
  }

  console.log('Total Platforms:', LEVEL_6_1.platforms.length);
  console.log('Moving Platforms:', LEVEL_6_1.movingPlatforms.length);
  console.log('Royal Sunstone Shards:', LEVEL_6_1.shards.length);
  console.log('Total Enemies:', LEVEL_6_1.enemies.length);
  console.log('Checkpoints:', LEVEL_6_1.checkpoints.length);
  console.log('Goal Portal:', LEVEL_6_1.goal);

  if (LEVEL_6_1.shards.length !== 40) {
    throw new Error(`Expected exactly 40 Sunstone Shards, got ${LEVEL_6_1.shards.length}`);
  }

  if (LEVEL_6_1.checkpoints.length !== 6) {
    throw new Error(`Expected exactly 6 checkpoints, got ${LEVEL_6_1.checkpoints.length}`);
  }

  // Check interactive mechanical platform types
  const platformTypes = new Set(LEVEL_6_1.platforms.map(p => p.type));
  console.log('Platform types present in level:', Array.from(platformTypes));
  const expectedTypes = [
    'clockwork_ground',
    'rotating_gear',
    'ticking_bridge',
    'brass_conveyor',
    'solar_grill',
    'steam_vent',
    'clock_pendulum',
    'climbable_gear_chain',
    'collapsing_spring'
  ];
  for (const t of expectedTypes) {
    if (!platformTypes.has(t)) {
      throw new Error(`Missing expected platform type in World 6: ${t}`);
    }
  }

  // Check specific enemy types & Climax Boss
  const boss = LEVEL_6_1.enemies.find(e => e.type === 'time_tinker');
  if (!boss) throw new Error('Time Tinker climax boss missing in World 6!');
  console.log('Boss Time Tinker found at x:', boss.x, 'y:', boss.y);

  const bees = LEVEL_6_1.enemies.filter(e => e.type === 'clockwork_bee');
  const knights = LEVEL_6_1.enemies.filter(e => e.type === 'spring_knight');
  const spiders = LEVEL_6_1.enemies.filter(e => e.type === 'mechanical_spider');

  console.log(`Enemies breakdown: ${bees.length} Clockwork Bees, ${knights.length} Spring Knights, ${spiders.length} Mechanical Spiders, 1 Time Tinker Boss.`);
  if (bees.length === 0 || knights.length === 0 || spiders.length === 0) {
    throw new Error('Enemy bestiary incomplete!');
  }

  // Check Keybindings in Constants
  const constantsModule = await import('../src/game/Constants.js');
  const { KEY_BINDINGS } = constantsModule;
  if (!KEY_BINDINGS.WORLD_6) {
    throw new Error('KEY_BINDINGS.WORLD_6 missing in Constants.js!');
  }
  console.log('KEY_BINDINGS.WORLD_6 verified:', KEY_BINDINGS.WORLD_6);

  // Check Audio Manager themes
  const audioModule = await import('../src/audio/AudioManager.js');
  const { AudioManager } = audioModule;
  const am = new AudioManager();
  const requiredThemes = ['clockwork', 'escapement_bridge', 'steam_conduit', 'time_tinker'];
  for (const theme of requiredThemes) {
    if (!am.sceneThemes || !am.sceneThemes[theme]) {
      throw new Error(`AudioManager missing theme profile: ${theme}`);
    }
  }
  console.log('All 4 World 6 scene themes verified in AudioManager:', requiredThemes);

  // Check Pixel Palette tokens
  const paletteModule = await import('../src/renderer/PixelPalette.js');
  const { PIXEL_PALETTE } = paletteModule;
  const paletteTokens = [
    'CLOCKWORK_SKY_DEEP',
    'CLOCKWORK_SKY_MID',
    'CLOCKWORK_SKY_BRONZE',
    'CLOCKWORK_SKY_AMBER',
    'CLOCKWORK_SKY_GLOW',
    'BRASS_DARK',
    'BRASS_MID',
    'BRASS_LIGHT',
    'BRASS_POLISHED',
    'BRONZE_SHADOW',
    'BRONZE_MID',
    'SUNSTONE_AMBER_BRIGHT',
    'STEAM_VENT_WARM',
    'ESCAPEMENT_STEEL_DARK',
    'PENDULUM_RUBY',
    'CLOCK_FACE_IVORY',
    'TINKER_ROBE_PURPLE',
    'TINKER_SUNSTONE_HEART'
  ];
  for (const token of paletteTokens) {
    if (!PIXEL_PALETTE[token]) {
      throw new Error(`PIXEL_PALETTE missing token: ${token}`);
    }
  }
  console.log('World 6 Pixel Palette tokens verified!');

  console.log('==================================================');
  console.log('ALL WORLD 6 AUDITS PASSED WITH ZERO ERRORS!');
  console.log('==================================================');
}

verifyWorld6().catch(e => {
  console.error('Verification failed:', e);
  process.exit(1);
});
