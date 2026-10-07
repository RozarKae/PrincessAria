import { RoyalShard } from '../entities/RoyalShard.js';
import { HiveGrub } from '../entities/HiveGrub.js';
import { HoneyWisp } from '../entities/HoneyWisp.js';
import { HoneyBeetle } from '../entities/HoneyBeetle.js';
import { HiveFirefly } from '../entities/HiveFirefly.js';
import { ShadowSquirrel } from '../entities/ShadowSquirrel.js';
import { ThornGoblin } from '../entities/ThornGoblin.js';
import { VineCrawler } from '../entities/VineCrawler.js';
import { SporeBomber } from '../entities/SporeBomber.js';
import { ForestKing } from '../entities/ForestKing.js';
import { DoorGoblin } from '../entities/DoorGoblin.js';
import { FlyingKey } from '../entities/FlyingKey.js';
import { EnchantedBroom } from '../entities/EnchantedBroom.js';
import { CastleKnight } from '../entities/CastleKnight.js';
import { SirSlamALot } from '../entities/SirSlamALot.js';
import { FireBee } from '../entities/FireBee.js';
import { LavaBeetle } from '../entities/LavaBeetle.js';
import { MagmaGrub } from '../entities/MagmaGrub.js';
import { HoneyDragon } from '../entities/HoneyDragon.js';
import { HoneyBumble } from '../entities/HoneyBumble.js';
import { SandwichKing } from '../entities/SandwichKing.js';
import { MustardMummy } from '../entities/MustardMummy.js';
import { CheeseScorpion } from '../entities/CheeseScorpion.js';
import { PickleBomber } from '../entities/PickleBomber.js';
import { ClockworkBee } from '../entities/ClockworkBee.js';
import { SpringKnight } from '../entities/SpringKnight.js';
import { MechanicalSpider } from '../entities/MechanicalSpider.js';
import { TimeTinker } from '../entities/TimeTinker.js';
import { MovingPlatform } from '../entities/MovingPlatform.js';
import { Particle } from '../entities/Particle.js';
import { Herb } from '../entities/Herb.js';
import { Elixir } from '../entities/Elixir.js';
import { Star } from '../entities/Star.js';
import { TreasureBox } from '../entities/TreasureBox.js';
import { Batboy } from '../entities/Batboy.js';
import { QueenBeePresence } from '../systems/QueenBeePresence.js';
import { Collision } from '../physics/Collision.js';
import { assetManager } from '../renderer/AssetManager.js';
import { LevelDirector } from '../director/LevelDirector.js';
import { EncounterCoordinator } from '../ai/EncounterCoordinator.js';

/**
 * LEVEL MANAGER — World 1: Honeywood Kingdom
 * Manages:
 * - Playable terrain & moving platforms
 * - Collectible Royal Shards
 * - Original enemies: Hive Grub, Honey Wisp, Honey Beetle, Hive Firefly
 * - Combat interaction system (Stomping, Primary Attack, Frontal Armor deflection, Knockback)
 * - Coordinated Group Encounter Ecosystem & Attack Token Management
 * - Queen Bee presence encounter event & Batboy reveal
 * - Secret Area discovery
 * - Debug AI visualization
 */
export class Level {
  constructor(levelData) {
    this.data = levelData;
    this.world = levelData.world || 1;
    this.stage = levelData.stage || 1;
    this.name = levelData.name || 'Honeywood Glade';
    this.worldName = levelData.worldName || 'Honeywood Kingdom';
    this.width = levelData.width;
    this.height = levelData.height;
    this.platforms = levelData.platforms;
    this.physics = levelData.physics || {};
    this.theme = levelData.theme;
    this.spawnPoint = { ...(levelData.spawn || levelData.spawnPoint || { x: 280, y: 790 }) };
    this.checkpoints = levelData.checkpoints ? levelData.checkpoints.map(c => ({ ...c, activated: false })) : (levelData.checkpoint ? [{ ...levelData.checkpoint, activated: false }] : []);
    this.checkpoint = this.checkpoints[0] || (levelData.checkpoint ? { ...levelData.checkpoint, activated: false } : { x: 2400, y: 820, width: 40, height: 40, activated: false });
    this.goal = { ...levelData.goal };
    this.midgroundProps = levelData.midgroundProps || [];
    this.detailProps = levelData.detailProps || [];

    // World Differentiation & Puzzle State
    this.hasBastionKey = false;
    this.portcullisUnlocked = false;
    this.khanCloakDiscovered = false;
    this.sporePuffballs = levelData.sporePuffballs || [];
    this.mimicTrees = levelData.mimicTrees || [];

    // Dynamic Entities
    this.shards = [];
    this.coins = []; // backward-compatibility alias
    this.enemies = [];
    this.movingPlatforms = [];
    this.particles = [];
    this.pickups = [];
    // If the authored level data contains deterministic pickups, spawn them now
    if (this.data && Array.isArray(this.data.pickups)) {
      this.data.pickups.forEach(p => {
        try {
          this.spawnPickup(p.x, p.y, p.type || 'herb', p.options || {});
        } catch (e) {
          // ignore malformed pickup entries
        }
      });
    }
    this.ambientButterflies = [];

    this.batboy = new Batboy(this.goal.x + 10, this.goal.y + 40);

    // Queen Bee Antagonist Presence System
    this.queenBeePresence = new QueenBeePresence();
    this.queenBeeTriggerX = (levelData.queenBeeEvent && levelData.queenBeeEvent.triggerX) || 99999;
    this.queenBeeTriggered = false;

    // Secret Area Tracking
    this.secretAreaDiscovered = false;
    this.apiaryDiscovered = false;
    this.armoryDiscovered = false;
    this.spireSecretDiscovered = false;
    this.secretBannerTimer = 0;
    this.secretBannerText = '';

    // Landmark Shrine Event Tracking
    this.shrineCinematicTriggered = false;
    this.hollowRedwoodTriggered = false;
    this.outpostTriggered = false;
    this.watchtowerTriggered = false;
    this.spireGatewayTriggered = false;
    this.sovereignThroneTriggered = false;
    this.shrineBannerTimer = 0;
    this.shrineBannerText = '';

    // Coordinated Encounter Ecosystem
    this.encounterCoordinator = new EncounterCoordinator();

    // AI Debug Mode Toggle
    this.debugAI = false;

    // AI Level Director Engine
    this.director = new LevelDirector({
      world: this.world,
      levelData: this.data,
    });

    this.initButterflies();
    this.reset();
  }

  spawnPickup(x, y, type = 'herb', options = {}) {
    let p = null;
    switch (type) {
      case 'herb':
        p = new Herb(x, y);
        break;
      case 'elixir':
        p = new Elixir(x, y, options.subtype || 'invincibility', options.duration || 6);
        break;
      case 'star':
        p = new Star(x, y);
        break;
      case 'treasure':
        p = new TreasureBox(x, y);
        break;
      default:
        p = new Herb(x, y);
    }
    if (!this.pickups) this.pickups = [];
    this.pickups.push(p);
    return p;
  }

  scatterPickups(count = 6) {
    // scatter across level width avoiding very top/bottom
    for (let i = 0; i < count; i++) {
      const x = 200 + Math.random() * Math.max(0, (this.width || 2000) - 400);
      const y = 140 + Math.random() * Math.max(0, (this.height || 900) - 300);
      const r = Math.random();
      if (r < 0.4) this.spawnPickup(x, y, 'herb');
      else if (r < 0.7) this.spawnPickup(x, y, 'elixir', { subtype: Math.random() < 0.6 ? 'invincibility' : 'flight', duration: 6 });
      else if (r < 0.9) this.spawnPickup(x, y, 'star');
      else this.spawnPickup(x, y, 'treasure');
    }
  }

  toggleDebugAI() {
    this.debugAI = !this.debugAI;
    if (this.director) {
      this.director.toggleDebug();
    }
    return this.debugAI;
  }

  initButterflies() {
    this.ambientButterflies = [];
    for (let i = 0; i < 7; i++) {
      this.ambientButterflies.push({
        x: 200 + i * 350 + Math.random() * 100,
        y: 650 + (i % 3) * 60,
        baseY: 650 + (i % 3) * 60,
        timer: Math.random() * Math.PI * 2,
        speedX: 15 + Math.random() * 20,
        color: i % 2 === 0 ? '#fde047' : '#38bdf8',
      });
    }
  }

  reset() {
    // 1. Initialize Royal Shards
    const shardList = this.data.shards || this.data.coins || [];
    this.shards = shardList.map(s => new RoyalShard(s.x, s.y));
    this.coins = this.shards;

    // 2. Initialize Moving Platforms
    const movingList = this.data.movingPlatforms || [];
    this.movingPlatforms = movingList.map(m => new MovingPlatform(m));

    // 3. Initialize Enemies: Hive Grub, Honey Wisp, Honey Beetle, Hive Firefly
    const enemyList = this.data.enemies || [];
    this.enemies = enemyList.map(e => {
      const pLeft = e.patrolLeft !== undefined ? e.patrolLeft : (e.patrolMinX !== undefined ? e.patrolMinX : e.x - 150);
      const pRight = e.patrolRight !== undefined ? e.patrolRight : (e.patrolMaxX !== undefined ? e.patrolMaxX : e.x + 150);

      switch (e.type) {
        case 'wisp':
        case 'honey_wisp':
          return new HoneyWisp(e.x, e.y, { amplitude: e.amplitude, frequency: e.frequency });
        case 'beetle':
        case 'honey_beetle':
          return new HoneyBeetle(e.x, e.y, pLeft, pRight);
        case 'firefly':
        case 'hive_firefly':
          return new HiveFirefly(e.x, e.y, { patrolLeft: pLeft, patrolRight: pRight });
        case 'shadow_squirrel':
        case 'squirrel':
          return new ShadowSquirrel(e.x, e.y, pLeft, pRight);
        case 'thorn_goblin':
        case 'goblin':
          return new ThornGoblin(e.x, e.y, pLeft, pRight);
        case 'vine_crawler':
        case 'crawler':
          return new VineCrawler(e.x, e.y, { patrolLeft: pLeft, patrolRight: pRight });
        case 'spore_bomber':
        case 'bomber':
          return new SporeBomber(e.x, e.y, { amplitude: e.amplitude, frequency: e.frequency });
        case 'forest_king':
          return new ForestKing(e.x, e.y);
        case 'door_goblin':
        case 'mimic_door':
          return new DoorGoblin(e.x, e.y, pLeft, pRight);
        case 'flying_key':
        case 'key':
          return new FlyingKey(e.x, e.y, { amplitudeX: e.amplitudeX, amplitudeY: e.amplitudeY, frequency: e.frequency });
        case 'enchanted_broom':
        case 'broom':
          return new EnchantedBroom(e.x, e.y, pLeft, pRight);
        case 'castle_knight':
        case 'knight':
          return new CastleKnight(e.x, e.y, pLeft, pRight);
        case 'sir_slam_a_lot':
        case 'slam_a_lot':
          return new SirSlamALot(e.x, e.y);
        case 'fire_bee':
          return new FireBee(e.x, e.y);
        case 'lava_beetle':
          return new LavaBeetle(e.x, e.y);
        case 'magma_grub':
          return new MagmaGrub(e.x, e.y);
        case 'honey_dragon':
          return new HoneyDragon(e.x, e.y);
        case 'sandwich_king':
          return new SandwichKing(e.x, e.y);
        case 'mustard_mummy':
          return new MustardMummy(e.x, e.y, pLeft, pRight);
        case 'cheese_scorpion':
          return new CheeseScorpion(e.x, e.y, pLeft, pRight);
        case 'pickle_bomber':
          return new PickleBomber(e.x, e.y);
        case 'clockwork_bee':
          return new ClockworkBee(e.x, e.y);
        case 'spring_knight':
          return new SpringKnight(e.x, e.y, pLeft, pRight);
        case 'mechanical_spider':
          return new MechanicalSpider(e.x, e.y, { patrolLeft: pLeft, patrolRight: pRight, dropDistance: e.dropDistance });
        case 'time_tinker':
          return new TimeTinker(e.x, e.y);
        case 'honey_bumble':
        case 'bumble':
          return new HoneyBumble(e.x, e.y);
        case 'grub':
        case 'hive_grub':
        default:
          return new HiveGrub(e.x, e.y, pLeft, pRight);
      }
    });

    this.honeyBumble = this.enemies.find(e => e instanceof HoneyBumble) || null;
    this.forestKing = this.enemies.find(e => e instanceof ForestKing) || null;
    this.sirSlamALot = this.enemies.find(e => e instanceof SirSlamALot) || null;
    this.honeyDragon = this.enemies.find(e => e instanceof HoneyDragon) || null;
    this.sandwichKing = this.enemies.find(e => e instanceof SandwichKing) || null;
    this.timeTinker = this.enemies.find(e => e instanceof TimeTinker) || null;
    this.portalDoors = this.data.portalDoors || [];
    this.portalCooldown = 0;

    // Register enemies with Encounter Coordinator
    if (this.encounterCoordinator) {
      this.encounterCoordinator.reset();
      this.encounterCoordinator.registerEnemies(this.enemies);
    }

    this.particles = [];
    this.checkpoints.forEach(c => c.activated = false);
    this.checkpoint.activated = false;
    this.batboy.isRescued = false;
    this.queenBeeTriggered = false;
    this.secretAreaDiscovered = false;
    this.apiaryDiscovered = false;
    this.armoryDiscovered = false;
    this.spireSecretDiscovered = false;
    this.secretBannerTimer = 0;
    this.shrineCinematicTriggered = false;
    this.hollowRedwoodTriggered = false;
    this.outpostTriggered = false;
    this.watchtowerTriggered = false;
    this.spireGatewayTriggered = false;
    this.sovereignThroneTriggered = false;
    this.shrineBannerTimer = 0;
    this.batboy.x = this.goal.x + 10;
    this.batboy.y = this.goal.y + 40;

    // pickups list
    this.pickups = [];

    // Reset crumble blocks
    if (this.platforms) {
      this.platforms.forEach(p => {
        if (p.type === 'crumble_block' || p.type === 'crumble' || p.type === 'crumble_stone' || p.type === 'crumble_ash' || p.type === 'crumble_cracker' || p.type === 'crumble_toast' || p.type === 'collapsing_spring') {
          p.isShaking = false;
          p.shakeTimer = 0;
          p.isBroken = false;
          p.respawnTimer = 0;
        }
      });
    }

    this.hasBastionKey = false;
    this.portcullisUnlocked = false;
    this.khanCloakDiscovered = false;

    if (this.director) {
      this.director.reset();
    }
  }

  /**
   * Return combined list of static and moving solid platforms for physics collision.
   * Filters out climbable vines, broken crumble blocks, and unlocked portcullises.
   */
  getAllSolidPlatforms() {
    return [
      ...this.platforms.filter(p => p.type !== 'climbable_vine' && p.type !== 'vine' && p.type !== 'climbable_chain' && p.type !== 'chain' && p.type !== 'climbable_toothpick' && p.type !== 'olive_spear' && p.type !== 'climbable_gear_chain' && p.type !== 'gear_chain' && p.type !== 'portal_door' && p.type !== 'crest_door' && p.type !== 'thermal_updraft' && p.type !== 'updraft' && !(p.type === 'bastion_portcullis' && this.portcullisUnlocked) && !((p.type === 'crumble_block' || p.type === 'crumble' || p.type === 'crumble_stone' || p.type === 'crumble_ash' || p.type === 'crumble_cracker' || p.type === 'crumble_toast' || p.type === 'collapsing_spring') && p.isBroken)),
      ...this.movingPlatforms
    ];
  }

  /**
   * Returns list of climbable hanging vines/chains/toothpicks/gear chains in the current world.
   */
  getClimbableVines() {
    return this.platforms.filter(p => p.type === 'climbable_vine' || p.type === 'vine' || p.type === 'climbable_chain' || p.type === 'chain' || p.type === 'climbable_toothpick' || p.type === 'olive_spear' || p.type === 'climbable_gear_chain' || p.type === 'gear_chain');
  }

  addParticle(p) {
    this.particles.push(p);
  }

  spawnDust(x, y, count = 4) {
    for (let i = 0; i < count; i++) {
      const vx = (Math.random() - 0.5) * 80;
      const vy = -Math.random() * 40;
      this.particles.push(new Particle(x, y, vx, vy, 'dust', '#fef08a', 0.35, 5));
    }
  }

  spawnSparkles(x, y, count = 8) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const speed = 120 + Math.random() * 100;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      this.particles.push(new Particle(x, y, vx, vy, 'sparkle', '#fbbf24', 0.5, 7));
    }
  }

  spawnBurst(x, y, count = 12, color = '#fbbf24') {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 140 + Math.random() * 160;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed - 60;
      this.particles.push(new Particle(x, y, vx, vy, 'burst', color, 0.45, 6));
    }
  }

  update(player, gameState, audio, camera, dt) {
    this.gameState = gameState;
    this.audioRef = audio;
    this.batboy.update(dt);

    // Update pickups
    if (this.pickups) {
      this.pickups.forEach((p, idx) => {
        if (p.update) p.update(dt, this);
        if (!p.collected && player && p.getBounds && Collision.intersects(player.getBounds(), p.getBounds())) {
          p.onCollect(player, this, gameState, audio);
          p.collected = true;
        }
      });
      // remove collected
      this.pickups = this.pickups.filter(p => !p.collected);
    }

    // 1. Update Moving Platforms
    this.movingPlatforms.forEach(mp => mp.update(dt, player));

    // 2. Update Collectibles (Royal Shards)
    this.shards.forEach(shard => {
      shard.update(dt, this);
      if (!shard.collected && Collision.intersects(player.getBounds(), shard.getBounds())) {
        shard.collected = true;
        gameState.addCoins(1);
        gameState.addScore(150);
        if (this.director) this.director.telemetry.recordReward('shard', 1);
        this.spawnSparkles(shard.x + shard.width / 2, shard.y + shard.height / 2, 10);
        if (audio && audio.playCollect) audio.playCollect();
        else if (audio && audio.playCoin) audio.playCoin();
      }
    });

    // 3. COMBAT INTERACTION SYSTEM: Update Enemies & Process Attacks
    const attackBounds = player.getAttackBounds ? player.getAttackBounds() : null;

    this.enemies.forEach(enemy => {
      enemy.update(dt, this, player, camera);

      if (!enemy.isDead && !player.isDead) {
        const enemyBounds = enemy.getBounds();

        // A. PLAYER ATTACK INTERACTION (Royal Stardust Burst)
        if (attackBounds && Collision.intersects(attackBounds, enemyBounds)) {
          // If attacking beetle or thorn goblin from the front while active, armor/shield deflects!
          const isBeetle = enemy instanceof HoneyBeetle;
          const isGoblin = enemy instanceof ThornGoblin;
          const playerFacingEnemy = (player.facing > 0 && enemy.x > player.x) || (player.facing < 0 && enemy.x < player.x);
          const isFrontal = (isBeetle || isGoblin) && !enemy.isVulnerable && ((enemy.facing < 0 && player.facing > 0) || (enemy.facing > 0 && player.facing < 0));

          if (isFrontal) {
            // Deflected by armor
            enemy.scaleX = 1.25;
            this.spawnSparkles(enemy.x + enemy.width / 2, enemy.y + 15, 6);
            if (audio && audio.playEnemyHit) audio.playEnemyHit();
          } else {
            // Successful attack strike
            const defeated = enemy.takeDamage(1, player.facing * 220, -280, audio);
            if (defeated) {
              gameState.addScore(enemy.scoreValue);
              if (this.director) this.director.telemetry.recordSuccess('attack', enemy.scoreValue, enemy.x, enemy.y);
              this.spawnBurst(enemy.x + enemy.width / 2, enemy.y + 15, 16, '#fbbf24');
              if (camera) camera.shake(8, 0.15);
            } else {
              this.spawnBurst(enemy.x + enemy.width / 2, enemy.y + 15, 8, '#f59e0b');
            }
          }
        }

        // B. PLAYER PHYSICAL COLLISION (Stomp vs Body Damage)
        if (Collision.intersects(player.getBounds(), enemyBounds)) {
          const playerBottom = player.y + player.height;
          const enemyCenterY = enemy.y + enemy.height * 0.45;

          // Stomp detection from above (player falling)
          if (player.vy > 0 && playerBottom <= enemyCenterY + 22) {
            enemy.stomp(player, audio);
            player.bounceFromEnemy();
            this.spawnBurst(enemy.x + enemy.width / 2, enemy.y + 10, 14, '#f59e0b');

            if (enemy.isDead) {
              gameState.addScore(enemy.scoreValue);
              if (this.director) this.director.telemetry.recordSuccess('stomp', enemy.scoreValue, enemy.x, enemy.y);
            }
            if (camera) camera.shake(7, 0.12);
          } else {
            // Player takes damage on side/bottom collision:
            // Standard enemy collision applies LIGHT (5 HP) or HEAVY (10 HP if threatLevel >= 4 or boss)
            const dmgTier = (enemy.threatLevel >= 4 || enemy.isBoss) ? 10 : 5;
            const knockDir = player.x < enemy.x ? -1 : 1;
            const wasHurt = player.hurt(dmgTier, knockDir);
            if (wasHurt) {
              if (gameState) gameState.hp = player.hp;
              if (camera) camera.shake(11, 0.2);
              if (audio && audio.playDamage) audio.playDamage();
              else if (audio && audio.playHurt) audio.playHurt();
              if (this.director) this.director.telemetry.recordDamage(dmgTier, 'enemy', player.x, player.y);
            }
          }
        }
      }
    });

    // 4. Check Checkpoints (Section 1 Glade & Section 2 Hollow Redwood Base)
    this.checkpoints.forEach(cp => {
      if (!cp.activated && Collision.intersects(player.getBounds(), cp)) {
        cp.activated = true;
        this.checkpoint = cp;
        this.spawnPoint = { x: cp.x, y: cp.y - 10 };
        this.spawnSparkles(cp.x + 20, cp.y + 20, 16);
        if (audio && audio.playCheckpoint) audio.playCheckpoint();
        else if (audio && audio.playCollect) audio.playCollect();
      }
    });

    // 5. Secret Area Discovery Checks
    if (this.world === 2) {
      // WORLD 2 SECRETS
      // Secret 1: The Giggling Fungus Hollow (x: 1200-1460, y <= 480)
      if (!this.secretAreaDiscovered && player.x >= 1200 && player.x <= 1460 && player.y <= 480) {
        this.secretAreaDiscovered = true;
        this.secretBannerText = '✨ SECRET DISCOVERY: THE GIGGLING FUNGUS HOLLOW (+500 PTS)';
        this.secretBannerTimer = 3.5;
        gameState.addScore(500);
        this.spawnSparkles(player.x + player.width / 2, player.y, 24);
        if (audio && audio.playSecretDiscovery) audio.playSecretDiscovery();
        else if (audio && audio.playCollect) audio.playCollect();
      }

      // Secret 2: The Fairy Ring Sanctuary (x: 4380-4680, y <= 380)
      if (!this.apiaryDiscovered && player.x >= 4380 && player.x <= 4680 && player.y <= 380) {
        this.apiaryDiscovered = true;
        this.secretBannerText = '✨ SECRET DISCOVERY: THE FAIRY RING SANCTUARY (+750 PTS)';
        this.secretBannerTimer = 3.8;
        gameState.addScore(750);
        this.spawnSparkles(player.x + player.width / 2, player.y, 32);
        if (audio && audio.playSecretDiscovery) audio.playSecretDiscovery();
        else if (audio && audio.playCollect) audio.playCollect();
      }

      // Secret 3: The Druidic Root Vault (x: 6180-6440, y <= 420)
      if (!this.armoryDiscovered && player.x >= 6180 && player.x <= 6440 && player.y <= 420) {
        this.armoryDiscovered = true;
        this.secretBannerText = '🗝️ SECRET DISCOVERED: THE DRUIDIC ROOT VAULT (+750 PTS)';
        this.secretBannerTimer = 4.0;
        gameState.addScore(750);
        this.spawnSparkles(player.x + player.width / 2, player.y, 36);
        if (audio && audio.playSecretDiscovery) audio.playSecretDiscovery();
        else if (audio && audio.playCollect) audio.playCollect();
      }

      // Secret 4: The Elder Crown Canopy (x: 9250-9500, y <= 380)
      if (!this.spireSecretDiscovered && player.x >= 9250 && player.x <= 9500 && player.y <= 380) {
        this.spireSecretDiscovered = true;
        this.secretBannerText = '🗝️ SECRET DISCOVERED: THE ELDER CROWN CANOPY (+1,000 PTS)';
        this.secretBannerTimer = 4.2;
        gameState.addScore(1000);
        this.spawnSparkles(player.x + player.width / 2, player.y, 40);
        if (audio && audio.playSecretDiscovery) audio.playSecretDiscovery();
        else if (audio && audio.playCollect) audio.playCollect();
      }

      // WORLD 2 LANDMARKS
      // Landmark 1: The Whispering Elder Oak (x >= 1950 and x < 2400)
      if (!this.shrineCinematicTriggered && player.x >= 1950 && player.x < 2400) {
        this.shrineCinematicTriggered = true;
        this.shrineBannerText = '✨ LANDMARK: THE WHISPERING ELDER OAK AWAKENS';
        this.shrineBannerTimer = 3.5;
        this.spawnSparkles(2100, 840, 28);
        if (audio && audio.playCheckpoint) audio.playCheckpoint();
        if (camera && camera.focus) camera.focus(2100, 750, 2.2);
      }

      // Landmark 2: The Bioluminescent Mycelium Shrine (x >= 3800 and x < 4300)
      if (!this.hollowRedwoodTriggered && player.x >= 3800 && player.x < 4300) {
        this.hollowRedwoodTriggered = true;
        this.shrineBannerText = '✨ LANDMARK: THE BIOLUMINESCENT MYCELIUM SHRINE';
        this.shrineBannerTimer = 3.8;
        this.spawnSparkles(4000, 600, 36);
        if (audio && audio.playCheckpoint) audio.playCheckpoint();
        if (camera && camera.focus) camera.focus(4000, 600, 2.5);
      }

      // Landmark 3: The Briar Gate of Ancient Thorns (x >= 7000 and x < 7500)
      if (!this.watchtowerTriggered && player.x >= 7000 && player.x < 7500) {
        this.watchtowerTriggered = true;
        this.shrineBannerText = '✨ LANDMARK: THE BRIAR GATE OF ANCIENT THORNS';
        this.shrineBannerTimer = 4.0;
        this.spawnSparkles(7200, 520, 36);
        if (audio && audio.playCheckpoint) audio.playCheckpoint();
        if (camera && camera.focus) camera.focus(7200, 500, 2.5);
      }

      // Landmark 4: The Forest King's Sacred Grove (x >= 10000)
      if (!this.sovereignThroneTriggered && player.x >= 10000) {
        this.sovereignThroneTriggered = true;
        this.shrineBannerText = '👑 CLIMAX: THE CORRUPTED FOREST KING AWAKENS!';
        this.shrineBannerTimer = 4.5;
        this.spawnSparkles(10200, 600, 48);
        if (audio && audio.playQueenBeeAppearance) audio.playQueenBeeAppearance();
        if (camera && camera.focus) camera.focus(10200, 560, 2.8);
        if (camera && camera.shake) camera.shake(10, 0.4);
      }
    } else if (this.world === 3) {
      // WORLD 3 SECRETS
      // Secret 1: The Royal Wine Vault (x: 1200-1460, y <= 480)
      if (!this.secretAreaDiscovered && player.x >= 1200 && player.x <= 1460 && player.y <= 480) {
        this.secretAreaDiscovered = true;
        this.secretBannerText = '✨ SECRET DISCOVERY: THE ROYAL WINE VAULT (+500 PTS)';
        this.secretBannerTimer = 3.5;
        gameState.addScore(500);
        this.spawnSparkles(player.x + player.width / 2, player.y, 24);
        if (audio && audio.playSecretDiscovery) audio.playSecretDiscovery();
        else if (audio && audio.playCollect) audio.playCollect();
      }

      // Secret 2: The Stained Glass Gallery (x: 4380-4680, y <= 380)
      if (!this.apiaryDiscovered && player.x >= 4380 && player.x <= 4680 && player.y <= 380) {
        this.apiaryDiscovered = true;
        this.secretBannerText = '✨ SECRET DISCOVERY: THE STAINED GLASS SANCTUARY (+750 PTS)';
        this.secretBannerTimer = 3.8;
        gameState.addScore(750);
        this.spawnSparkles(player.x + player.width / 2, player.y, 32);
        if (audio && audio.playSecretDiscovery) audio.playSecretDiscovery();
        else if (audio && audio.playCollect) audio.playCollect();
      }

      // Secret 3: The Astrolabe Observatory (x: 6180-6440, y <= 420)
      if (!this.armoryDiscovered && player.x >= 6180 && player.x <= 6440 && player.y <= 420) {
        this.armoryDiscovered = true;
        this.secretBannerText = '🗝️ SECRET DISCOVERED: THE ASTROLABE OBSERVATORY (+750 PTS)';
        this.secretBannerTimer = 4.0;
        gameState.addScore(750);
        this.spawnSparkles(player.x + player.width / 2, player.y, 36);
        if (audio && audio.playSecretDiscovery) audio.playSecretDiscovery();
        else if (audio && audio.playCollect) audio.playCollect();
      }

      // Secret 4: The King\'s Secret Armoury (x: 9250-9500, y <= 380)
      if (!this.spireSecretDiscovered && player.x >= 9250 && player.x <= 9500 && player.y <= 380) {
        this.spireSecretDiscovered = true;
        this.secretBannerText = "🗝️ SECRET DISCOVERED: THE KING'S SECRET ARMOURY (+1,000 PTS)";
        this.secretBannerTimer = 4.2;
        gameState.addScore(1000);
        this.spawnSparkles(player.x + player.width / 2, player.y, 40);
        if (audio && audio.playSecretDiscovery) audio.playSecretDiscovery();
        else if (audio && audio.playCollect) audio.playCollect();
      }

      // WORLD 3 LANDMARKS
      // Landmark 1: The Grand Vestibule Clocktower (x >= 1950 and x < 2400)
      if (!this.shrineCinematicTriggered && player.x >= 1950 && player.x < 2400) {
        this.shrineCinematicTriggered = true;
        this.shrineBannerText = '✨ LANDMARK: THE GRAND VESTIBULE CLOCKTOWER';
        this.shrineBannerTimer = 3.5;
        this.spawnSparkles(2100, 840, 28);
        if (audio && audio.playCheckpoint) audio.playCheckpoint();
        if (camera && camera.focus) camera.focus(2100, 750, 2.2);
      }

      // Landmark 2: The Rose Stained-Glass Atrium (x >= 3800 and x < 4300)
      if (!this.hollowRedwoodTriggered && player.x >= 3800 && player.x < 4300) {
        this.hollowRedwoodTriggered = true;
        this.shrineBannerText = '✨ LANDMARK: THE ROSE STAINED-GLASS ATRIUM';
        this.shrineBannerTimer = 3.8;
        this.spawnSparkles(4000, 600, 36);
        if (audio && audio.playCheckpoint) audio.playCheckpoint();
        if (camera && camera.focus) camera.focus(4000, 600, 2.5);
      }

      // Landmark 3: The High Catapult Spire (x >= 7000 and x < 7500)
      if (!this.watchtowerTriggered && player.x >= 7000 && player.x < 7500) {
        this.watchtowerTriggered = true;
        this.shrineBannerText = '✨ LANDMARK: THE HIGH CATAPULT BATTLEMENT';
        this.shrineBannerTimer = 4.0;
        this.spawnSparkles(7200, 520, 36);
        if (audio && audio.playCheckpoint) audio.playCheckpoint();
        if (camera && camera.focus) camera.focus(7200, 520, 2.5);
      }

      // Landmark 4: The Gateway Bastion of Sir Slam-A-Lot (x >= 9950)
      if (!this.sovereignThroneTriggered && player.x >= 9950) {
        this.sovereignThroneTriggered = true;
        this.shrineBannerText = '⚔️ CLIMAX: SIR SLAM-A-LOT — THE GATEWAY BASTION!';
        this.shrineBannerTimer = 4.5;
        this.spawnSparkles(10200, 700, 48);
        if (audio && audio.playQueenBeeAppearance) audio.playQueenBeeAppearance();
        if (camera && camera.focus) camera.focus(10200, 680, 2.8);
        if (camera && camera.shake) camera.shake(12, 0.5);
      }
    } else if (this.world === 4) {
      // WORLD 4 SECRETS & LANDMARKS: THE VOLCANO OF HOT HONEY
      // Secret 1: The Obsidian Forge (x: 3400-3660, y <= 460)
      if (!this.secretAreaDiscovered && player.x >= 3400 && player.x <= 3660 && player.y <= 460) {
        this.secretAreaDiscovered = true;
        this.secretBannerText = '✨ SECRET DISCOVERY: THE OBSIDIAN FORGE (+500 PTS)';
        this.secretBannerTimer = 3.5;
        gameState.addScore(500);
        this.spawnSparkles(player.x + player.width / 2, player.y, 24);
        if (audio && audio.playSecretDiscovery) audio.playSecretDiscovery();
        else if (audio && audio.playCollect) audio.playCollect();
      }

      // Secret 2: Dragon's Hoard Cache (x: 6200-6460, y <= 400)
      if (!this.apiaryDiscovered && player.x >= 6200 && player.x <= 6460 && player.y <= 400) {
        this.apiaryDiscovered = true;
        this.secretBannerText = "✨ SECRET DISCOVERY: THE DRAGON'S HOARD (+750 PTS)";
        this.secretBannerTimer = 3.8;
        gameState.addScore(750);
        this.spawnSparkles(player.x + player.width / 2, player.y, 32);
        if (audio && audio.playSecretDiscovery) audio.playSecretDiscovery();
        else if (audio && audio.playCollect) audio.playCollect();
      }

      // Secret 3: Ancient Wyrm Nest (x: 9140-9380, y <= 420)
      if (!this.armoryDiscovered && player.x >= 9140 && player.x <= 9380 && player.y <= 420) {
        this.armoryDiscovered = true;
        this.secretBannerText = '🗝️ SECRET DISCOVERED: THE ANCIENT WYRM NEST (+1,000 PTS)';
        this.secretBannerTimer = 4.2;
        gameState.addScore(1000);
        this.spawnSparkles(player.x + player.width / 2, player.y, 40);
        if (audio && audio.playSecretDiscovery) audio.playSecretDiscovery();
        else if (audio && audio.playCollect) audio.playCollect();
      }

      // Landmark 1: The Ash Caldera Peak (x >= 1700 and x < 2100)
      if (!this.shrineCinematicTriggered && player.x >= 1700 && player.x < 2100) {
        this.shrineCinematicTriggered = true;
        this.shrineBannerText = '🌋 LANDMARK: THE ASH CALDERA PEAK';
        this.shrineBannerTimer = 3.5;
        this.spawnSparkles(1900, 840, 28);
        if (audio && audio.playCheckpoint) audio.playCheckpoint();
        if (camera && camera.focus) camera.focus(1900, 750, 2.2);
      }

      // Landmark 2: The Boiling Geyser Spire (x >= 4200 and x < 4600)
      if (!this.hollowRedwoodTriggered && player.x >= 4200 && player.x < 4600) {
        this.hollowRedwoodTriggered = true;
        this.shrineBannerText = '🌋 LANDMARK: THE BOILING GEYSER SPIRE';
        this.shrineBannerTimer = 3.8;
        this.spawnSparkles(4400, 600, 36);
        if (audio && audio.playCheckpoint) audio.playCheckpoint();
        if (camera && camera.focus) camera.focus(4400, 600, 2.5);
      }

      // Landmark 3: The Dragon Tooth Spire (x >= 7000 and x < 7450)
      if (!this.watchtowerTriggered && player.x >= 7000 && player.x < 7450) {
        this.watchtowerTriggered = true;
        this.shrineBannerText = '🌋 LANDMARK: THE DRAGON TOOTH SPIRE';
        this.shrineBannerTimer = 4.0;
        this.spawnSparkles(7200, 520, 36);
        if (audio && audio.playCheckpoint) audio.playCheckpoint();
        if (camera && camera.focus) camera.focus(7200, 520, 2.5);
      }

      // Landmark 4: The Heart of the Volcano (x >= 9950)
      if (!this.sovereignThroneTriggered && player.x >= 9950) {
        this.sovereignThroneTriggered = true;
        this.shrineBannerText = '🔥 CLIMAX: THE HONEY DRAGON — CALDERA ARENA!';
        this.shrineBannerTimer = 4.5;
        this.spawnSparkles(10200, 700, 48);
        if (audio && audio.playQueenBeeAppearance) audio.playQueenBeeAppearance();
        if (camera && camera.focus) camera.focus(10200, 680, 2.8);
        if (camera && camera.shake) camera.shake(14, 0.5);
      }
    } else if (this.world === 6) {
      // WORLD 6 SECRETS & LANDMARKS: THE CLOCKWORK KINGDOM
      // Secret 1: The Grand Astrolabe Gallery (x: 1600-1900, y <= 400)
      if (!this.secretAreaDiscovered && player.x >= 1600 && player.x <= 1900 && player.y <= 400) {
        this.secretAreaDiscovered = true;
        this.secretBannerText = '✨ SECRET DISCOVERY: THE GRAND ASTROLABE GALLERY (+500 PTS)';
        this.secretBannerTimer = 3.5;
        gameState.addScore(500);
        this.spawnSparkles(player.x + player.width / 2, player.y, 24);
        if (audio && audio.playSecretDiscovery) audio.playSecretDiscovery();
        else if (audio && audio.playCollect) audio.playCollect();
      }

      // Secret 2: The Celestial Horology Vault (x: 3500-3800, y <= 350)
      if (!this.apiaryDiscovered && player.x >= 3500 && player.x <= 3800 && player.y <= 350) {
        this.apiaryDiscovered = true;
        this.secretBannerText = '✨ SECRET DISCOVERY: THE CELESTIAL HOROLOGY VAULT (+750 PTS)';
        this.secretBannerTimer = 3.8;
        gameState.addScore(750);
        this.spawnSparkles(player.x + player.width / 2, player.y, 32);
        if (audio && audio.playSecretDiscovery) audio.playSecretDiscovery();
        else if (audio && audio.playCollect) audio.playCollect();
      }

      // Secret 3: The Eternal Mainspring Chamber (x: 6800-7150, y <= 320)
      if (!this.armoryDiscovered && player.x >= 6800 && player.x <= 7150 && player.y <= 320) {
        this.armoryDiscovered = true;
        this.secretBannerText = '🗝️ SECRET DISCOVERED: THE ETERNAL MAINSPRING CHAMBER (+1,000 PTS)';
        this.secretBannerTimer = 4.2;
        gameState.addScore(1000);
        this.spawnSparkles(player.x + player.width / 2, player.y, 40);
        if (audio && audio.playSecretDiscovery) audio.playSecretDiscovery();
        else if (audio && audio.playCollect) audio.playCollect();
      }

      // Landmark 1: The Brass Gearworks Colonnade (x >= 1950 and x < 2400)
      if (!this.shrineCinematicTriggered && player.x >= 1950 && player.x < 2400) {
        this.shrineCinematicTriggered = true;
        this.shrineBannerText = '⚙️ LANDMARK: THE BRASS GEARWORKS COLONNADE';
        this.shrineBannerTimer = 3.5;
        this.spawnSparkles(2100, 840, 28);
        if (audio && audio.playCheckpoint) audio.playCheckpoint();
        if (camera && camera.focus) camera.focus(2100, 750, 2.2);
      }

      // Landmark 2: The Great Escapement Chasm (x >= 4000 and x < 4500)
      if (!this.hollowRedwoodTriggered && player.x >= 4000 && player.x < 4500) {
        this.hollowRedwoodTriggered = true;
        this.shrineBannerText = '⚙️ LANDMARK: THE GREAT ESCAPEMENT CHASM';
        this.shrineBannerTimer = 3.8;
        this.spawnSparkles(4200, 600, 36);
        if (audio && audio.playCheckpoint) audio.playCheckpoint();
        if (camera && camera.focus) camera.focus(4200, 600, 2.5);
      }

      // Landmark 3: The Sunstone Foundry Furnace (x >= 7000 and x < 7450)
      if (!this.watchtowerTriggered && player.x >= 7000 && player.x < 7450) {
        this.watchtowerTriggered = true;
        this.shrineBannerText = '☀️ LANDMARK: THE SUNSTONE FOUNDRY FURNACE';
        this.shrineBannerTimer = 4.0;
        this.spawnSparkles(7200, 520, 36);
        if (audio && audio.playCheckpoint) audio.playCheckpoint();
        if (camera && camera.focus) camera.focus(7200, 520, 2.5);
      }

      // Landmark 4: The Grand Chronometer Citadel (x >= 9950)
      if (!this.sovereignThroneTriggered && player.x >= 9950) {
        this.sovereignThroneTriggered = true;
        this.shrineBannerText = '🕰️ CLIMAX: THE TIME TINKER — GRAND CHRONOMETER CITADEL!';
        this.shrineBannerTimer = 4.5;
        this.spawnSparkles(10200, 700, 48);
        if (audio && audio.playQueenBeeAppearance) audio.playQueenBeeAppearance();
        if (camera && camera.focus) camera.focus(10200, 680, 2.8);
        if (camera && camera.shake) camera.shake(14, 0.5);
      }
    } else {
      // WORLD 1 SECRETS & LANDMARKS
      // Secret 1: Sunstone Canopy Sanctum (x: 1240-1460, y <= 490)
      if (!this.secretAreaDiscovered && player.x >= 1240 && player.x <= 1460 && player.y <= 490) {
        this.secretAreaDiscovered = true;
        this.secretBannerText = '✨ SECRET DISCOVERY: SUNSTONE CANOPY SANCTUM (+500 PTS)';
        this.secretBannerTimer = 3.5;
        gameState.addScore(500);
        this.spawnSparkles(player.x + player.width / 2, player.y, 24);
        if (audio && audio.playSecretDiscovery) audio.playSecretDiscovery();
        else if (audio && audio.playCollect) audio.playCollect();
      }

      // Secret 2: The Forgotten Royal Apiary Sanctuary (Section 2: x: 4350-4650, y <= 360)
      if (!this.apiaryDiscovered && player.x >= 4350 && player.x <= 4650 && player.y <= 360) {
        this.apiaryDiscovered = true;
        this.secretBannerText = '✨ SECRET DISCOVERY: THE FORGOTTEN ROYAL APIARY (+750 PTS)';
        this.secretBannerTimer = 3.8;
        gameState.addScore(750);
        this.spawnSparkles(player.x + player.width / 2, player.y, 32);
        if (audio && audio.playSecretDiscovery) audio.playSecretDiscovery();
        else if (audio && audio.playCollect) audio.playCollect();
      }

      // Secret 3: The Sunstone Armory Vault (Section 3: x: 6160-6440, y <= 420)
      if (!this.armoryDiscovered && player.x >= 6160 && player.x <= 6440 && player.y <= 420) {
        this.armoryDiscovered = true;
        this.secretBannerText = '🗝️ SECRET DISCOVERED: THE SUNSTONE ARMORY VAULT (+750 PTS)';
        this.secretBannerTimer = 4.0;
        gameState.addScore(750);
        this.spawnSparkles(player.x + player.width / 2, player.y, 36);
        if (audio && audio.playSecretDiscovery) audio.playSecretDiscovery();
        else if (audio && audio.playCollect) audio.playCollect();
      }

      // Secret 4: The Queen's Forbidden Secret Vault (Section 4: x: 9240-9520, y <= 380)
      if (!this.spireSecretDiscovered && player.x >= 9240 && player.x <= 9520 && player.y <= 380) {
        this.spireSecretDiscovered = true;
        this.secretBannerText = "🗝️ SECRET DISCOVERED: THE QUEEN'S FORBIDDEN VAULT (+1,000 PTS)";
        this.secretBannerTimer = 4.2;
        gameState.addScore(1000);
        this.spawnSparkles(player.x + player.width / 2, player.y, 40);
        if (audio && audio.playSecretDiscovery) audio.playSecretDiscovery();
        else if (audio && audio.playCollect) audio.playCollect();
      }

      // Landmark 1: The Sunstone Ruin Arch & Altar (Section 1: x >= 1950)
      if (!this.shrineCinematicTriggered && player.x >= 1950 && player.x < 2400) {
        this.shrineCinematicTriggered = true;
        this.shrineBannerText = '✨ THE ANCIENT SUNSTONE SHRINE AWAKENS';
        this.shrineBannerTimer = 3.5;
        this.spawnSparkles(2100, 840, 28);
        if (audio && audio.playCheckpoint) audio.playCheckpoint();
        if (camera && camera.focus) camera.focus(2100, 750, 2.2);
      }

      // Landmark 2: The Great Hollow Redwood & Amber Cataract (Section 2: x >= 3700)
      if (!this.hollowRedwoodTriggered && player.x >= 3700 && player.x < 4250) {
        this.hollowRedwoodTriggered = true;
        this.shrineBannerText = '✨ LANDMARK: THE GREAT HOLLOW REDWOOD & AMBER CATARACT';
        this.shrineBannerTimer = 3.8;
        this.spawnSparkles(3900, 600, 36);
        if (audio && audio.playCheckpoint) audio.playCheckpoint();
        if (camera && camera.focus) camera.focus(3900, 600, 2.5);
      }

      // Landmark 3: The Overgrown Outpost Gateway (Section 2 Exit: x >= 4900)
      if (!this.outpostTriggered && player.x >= 4900 && player.x < 5500) {
        this.outpostTriggered = true;
        this.shrineBannerText = '✨ OUTPOST GATEWAY: APPROACHING CRUMBLING FORTRESS';
        this.shrineBannerTimer = 3.5;
        this.spawnSparkles(5020, 720, 28);
        if (audio && audio.playCheckpoint) audio.playCheckpoint();
      }

      // Landmark 4: The Sunstone Fortress Watchtower (Section 3: x >= 6800)
      if (!this.watchtowerTriggered && player.x >= 6800 && player.x < 8000) {
        this.watchtowerTriggered = true;
        this.shrineBannerText = '✨ LANDMARK: THE SUNSTONE FORTRESS WATCHTOWER';
        this.shrineBannerTimer = 4.0;
        this.spawnSparkles(7100, 520, 36);
        if (audio && audio.playCheckpoint) audio.playCheckpoint();
        if (camera && camera.focus) camera.focus(7100, 500, 2.5);
      }

      // Landmark 5: The Spire Gateway Colonnade (Section 4 Entry: x >= 8080 and x < 8500)
      if (!this.spireGatewayTriggered && player.x >= 8080 && player.x < 8500) {
        this.spireGatewayTriggered = true;
        this.shrineBannerText = '✨ SPIRE GATEWAY: ENTERING THE SOVEREIGN HIVE SPIRE';
        this.shrineBannerTimer = 3.8;
        this.spawnSparkles(8180, 720, 32);
        if (audio && audio.playCheckpoint) audio.playCheckpoint();
        if (camera && camera.focus) camera.focus(8180, 680, 2.5);
      }

      // Landmark 6: The Sovereign Royal Chrysalis Throne (Section 4 Climax: x >= 10180)
      if (!this.sovereignThroneTriggered && player.x >= 10180) {
        this.sovereignThroneTriggered = true;
        this.shrineBannerText = '👑 CLIMAX: THE SOVEREIGN HIVE SPIRE — RESCUE KHAN!';
        this.shrineBannerTimer = 4.5;
        this.spawnSparkles(10400, 600, 48);
        if (audio && audio.playQueenBeeAppearance) audio.playQueenBeeAppearance();
        if (camera && camera.focus) camera.focus(10400, 560, 2.8);
        if (camera && camera.shake) camera.shake(10, 0.4);
      }
    }

    if (this.secretBannerTimer > 0) {
      this.secretBannerTimer -= dt;
    }
    if (this.shrineBannerTimer > 0) {
      this.shrineBannerTimer -= dt;
    }

    // 5B. Portal Doors Interaction (Castle of a Thousand Doors)
    if (this.portalCooldown > 0) {
      this.portalCooldown -= dt;
    }
    if (this.portalDoors && this.portalDoors.length > 0) {
      this.portalDoors.forEach(door => {
        if (this.portalCooldown <= 0 && Collision.intersects(player.getBounds(), door)) {
          const dest = this.portalDoors.find(d => d.id === door.targetId);
          if (dest) {
            this.portalCooldown = 1.2;
            this.spawnBurst(player.x + player.width / 2, player.y + player.height / 2, 20, '#38bdf8');
            this.spawnSparkles(player.x + player.width / 2, player.y + player.height / 2, 16);
            player.x = dest.x + (dest.width - player.width) / 2;
            player.y = dest.y + dest.height - player.height;
            player.vx = 0;
            this.spawnBurst(player.x + player.width / 2, player.y + player.height / 2, 20, '#c084fc');
            this.spawnSparkles(player.x + player.width / 2, player.y + player.height / 2, 16);
            if (audio && audio.playCollect) audio.playCollect();
            if (camera && camera.shake) camera.shake(6, 0.15);
          }
        }
      });
    }

    // 5C. Crumble Blocks Simulation (Shake -> Shatter -> Reform)
    if (this.platforms) {
      this.platforms.forEach(plat => {
        if (plat.type === 'crumble_block' || plat.type === 'crumble' || plat.type === 'crumble_stone' || plat.type === 'crumble_ash' || plat.type === 'crumble_cracker' || plat.type === 'collapsing_spring') {
          if (plat.isShaking) {
            plat.shakeTimer -= dt;
            if (plat.shakeTimer <= 0) {
              plat.isShaking = false;
              plat.isBroken = true;
              plat.respawnTimer = 3.2;
              if (audio && audio.playCrumble) audio.playCrumble();
              this.spawnBurst(plat.x + plat.width / 2, plat.y + plat.height / 2, 16, plat.type === 'collapsing_spring' ? '#d97706' : (plat.type === 'crumble_ash' ? '#543f3b' : '#94a3b8'));
              this.spawnDust(plat.x + plat.width / 2, plat.y + plat.height / 2, 10);
              if (camera && camera.shake) camera.shake(5, 0.15);
            }
          } else if (plat.isBroken) {
            plat.respawnTimer -= dt;
            if (plat.respawnTimer <= 0) {
              plat.isBroken = false;
              this.spawnSparkles(plat.x + plat.width / 2, plat.y + plat.height / 2, 12);
            }
          }
        }
      });
    }

    // 5D. Honey Geyser & Thermal Updraft / Steam Vent Ambient Rising Particles
    if (this.platforms && Math.random() < 0.45) {
      this.platforms.forEach(plat => {
        if (plat.type === 'honey_geyser' || plat.type === 'geyser' || plat.type === 'thermal_updraft' || plat.type === 'updraft' || plat.type === 'steam_vent') {
          const gx = plat.x + Math.random() * plat.width;
          const gy = plat.y + plat.height * 0.7;
          const vy = -180 - Math.random() * 120;
          const color = plat.type === 'steam_vent' ? '#fef3c7' : ((plat.type === 'thermal_updraft' || plat.type === 'updraft') ? '#f97316' : '#fef08a');
          this.particles.push(new Particle(gx, gy, (Math.random() - 0.5) * 20, vy, 'sparkle', color, 0.6, 5));
        }
      });
    }

    // 5E. WORLD-SPECIFIC ENVIRONMENTAL MECHANICS
    if (this.platforms) {
      this.platforms.forEach(plat => {
        if (plat.type === 'snapping_flower') {
          plat.timer = (plat.timer || 0) + dt;
          const cycle = plat.timer % 2.8;
          // Open 0..1.8s (sweet nectar, safe), snapping shut 1.8..2.8s (hazardous jaws)
          plat.isSnapping = cycle >= 1.8;
          plat.openFactor = cycle < 1.8 ? 1.0 : (Math.sin((cycle - 1.8) * Math.PI) * 0.15);
        } else if (plat.type === 'spoon_bridge') {
          // Re-center spoon tilt when player is not actively standing on it
          if (player.standingPlatform !== plat) {
            plat.tilt = (plat.tilt || 0) * (1 - 6 * dt);
          }
        } else if (plat.type === 'ticking_bridge') {
          plat.tickTimer = (plat.tickTimer || 0) + dt;
          const cycle = plat.tickTimer % 2.6; // 1.6s extended, 1.0s retracted
          plat.isRetracted = cycle >= 1.6;
          plat.tickPhase = cycle / 2.6;
        } else if (plat.type === 'solar_grill') {
          plat.heatTimer = (plat.heatTimer || 0) + dt;
          const cycle = plat.heatTimer % 3.0; // 2.0s safe, 1.0s incandescent solar burst
          plat.isHot = cycle >= 2.0;
        } else if (plat.type === 'rotating_gear' || plat.type === 'cog_platform') {
          plat.rotation = (plat.rotation || 0) + dt * (plat.rotSpeed || 1.2);
        }
      });
    }

    // World 1 Story Landmark: Khan's Cloak Clue
    if (this.world === 1 && !this.khanCloakDiscovered && player.x >= 4180 && player.x <= 4420) {
      this.khanCloakDiscovered = true;
      this.secretBannerText = "🧣 STORY CLUE: A torn scrap of Batboy Khan's cloak clings to the thorns! He was carried towards the Forest!";
      this.secretBannerTimer = 5.0;
      this.spawnSparkles(4260, 680, 24);
      if (audio && audio.playSecretDiscovery) audio.playSecretDiscovery();
    }

    // World 2: Sleeping Spores (Spore Puffballs)
    if (this.world === 2 && this.sporePuffballs) {
      this.sporePuffballs.forEach(puff => {
        puff.timer = (puff.timer || 0) + dt;
        const cycle = puff.timer % 3.2;
        puff.isEmitting = cycle >= 1.4;
        if (puff.isEmitting) {
          const dx = (player.x + player.width / 2) - puff.x;
          const dy = (player.y + player.height / 2) - puff.y;
          const distSq = dx * dx + dy * dy;
          if (distSq < 80 * 80 && !player.isDashing) {
            player.applyDrowsy(2.5);
            if (Math.random() < 0.25) {
              this.spawnDust(player.x + player.width / 2, player.y + 10, 2);
            }
          }
          if (Math.random() < 0.35) {
            const px = puff.x + (Math.random() - 0.5) * 60;
            const py = puff.y - Math.random() * 45;
            this.particles.push(new Particle(px, py, (Math.random() - 0.5) * 25, -25 - Math.random() * 20, 'sparkle', '#a7f3d0', 0.8, 4));
          }
        }
      });
    }

    // World 2: Mimic Trees
    if (this.world === 2 && this.mimicTrees) {
      this.mimicTrees.forEach(mimic => {
        const dx = (player.x + player.width / 2) - mimic.x;
        const dy = (player.y + player.height / 2) - mimic.y;
        const inProximity = Math.abs(dx) < 140 && Math.abs(dy) < 140;
        if (inProximity) {
          mimic.activeTimer = (mimic.activeTimer || 0) + dt;
          mimic.isAwake = true;
          if (mimic.activeTimer > 0.45 && Math.abs(dx) < 65 && !player.isDashing && player.y + player.height > mimic.y - 35) {
            const wasHurt = player.hurt(10, dx > 0 ? 1 : -1);
            if (wasHurt) {
              if (gameState) gameState.hp = player.hp;
              if (camera) camera.shake(10, 0.2);
              if (audio && audio.playDamage) audio.playDamage();
            }
          }
        } else {
          mimic.isAwake = false;
          mimic.activeTimer = 0;
        }
      });
    }

    // World 3: Flying Key Capture & Bastion Portcullis Unlock
    if (this.world === 3) {
      const keyObj = this.enemies.find(e => e instanceof FlyingKey);
      if (keyObj && !keyObj.isDead && Collision.intersects(player.getBounds(), keyObj.getBounds())) {
        keyObj.isDead = true;
        this.hasBastionKey = true;
        this.portcullisUnlocked = true;
        this.secretBannerText = '🗝️ THE GOLDEN FLYING KEY HAS BEEN CAPTURED! THE BASTION PORTCULLIS IS UNLOCKED!';
        this.secretBannerTimer = 4.5;
        gameState.addScore(1000);
        this.spawnBurst(keyObj.x, keyObj.y, 28, '#fde047');
        this.spawnSparkles(keyObj.x, keyObj.y, 20);
        if (audio && audio.playSecretDiscovery) audio.playSecretDiscovery();
        if (camera) camera.shake(8, 0.2);
      }

      // Check Bastion Portcullis approach without key
      if (!this.hasBastionKey && player.x >= 6120 && player.x <= 6190) {
        if (!this.portcullisPromptTimer || this.portcullisPromptTimer <= 0) {
          this.secretBannerText = '🔒 BASTION PORTCULLIS LOCKED! ENTER THE LION CREST DOOR & RETRIEVE THE FLYING KEY!';
          this.secretBannerTimer = 3.5;
          this.portcullisPromptTimer = 4.0;
        }
      }
      if (this.portcullisPromptTimer > 0) this.portcullisPromptTimer -= dt;
    }

    // 6. Queen Bee Presence Environmental Event Trigger
    if (!this.queenBeeTriggered && player.x >= this.queenBeeTriggerX) {
      this.queenBeeTriggered = true;
      this.queenBeePresence.triggerEvent(player.x, player.y, audio, camera);
    }
    this.queenBeePresence.update(dt, player, camera, audio);

    // 7. Ambient Butterflies
    this.ambientButterflies.forEach(b => {
      b.timer += dt * 3.5;
      b.x += b.speedX * dt;
      b.y = b.baseY + Math.sin(b.timer) * 18;
      if (b.x > 1800) {
        b.x = 100;
      }
    });

    // 8. Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.update(dt);
      if (p.isDead) {
        this.particles.splice(i, 1);
      }
    }

    // 9. AI Level Director Update (Pacing, Telemetry, Routes, Authored Variations)
    if (this.director) {
      this.director.update(dt, player, this, gameState, audio, camera);
    }

    // 10. Coordinated Encounter Ecosystem Tick
    if (this.encounterCoordinator) {
      this.encounterCoordinator.update(dt, this, player);
    }
  }

  triggerSuperBomb(cx, cy, player, audio) {
    // Damage or kill all enemies within radius
    const radius = 420;
    this.enemies.forEach(e => {
      const dx = (e.x + e.width / 2) - cx;
      const dy = (e.y + e.height / 2) - cy;
      const d2 = dx * dx + dy * dy;
      if (d2 <= radius * radius) {
        if (typeof e.takeDamage === 'function') {
          e.takeDamage(999, 0, -200, audio);
        }
      }
    });
    if (audio && audio.playExplosion) audio.playExplosion();
    this.spawnBurst(cx, cy, 36, '#fb7185');
  }

  /**
   * Draw dynamic level elements: platforms, enemies, collectibles, Queen Bee presence, and debug AI.
   */
  draw(ctx, camera) {
    // 1. Draw Queen Bee Presence (monarch silhouette, sweeping shadow, Batboy chrysalis)
    this.queenBeePresence.draw(ctx, camera);

    // 2. Draw Moving Platforms
    this.movingPlatforms.forEach(mp => mp.draw(ctx));

    // 3. Draw Collectible Royal Shards
    this.shards.forEach(s => s.draw(ctx));

    // 4. Draw Enemies
    this.enemies.forEach(e => {
      e.draw(ctx);
      if (this.debugAI) {
        e.drawDebug(ctx);
      }
    });

    // 4B. Coordinated Encounter Ecosystem Debug Overlay
    if (this.debugAI && this.encounterCoordinator) {
      this.drawEncounterDebug(ctx, camera);
    }

    // 5. Draw Goal & Captive Batboy
    this.batboy.draw(ctx);

    // 6. Draw Particles
    this.particles.forEach(p => p.draw(ctx));
  }

  /**
   * Tactical encounter overlay when F1 / KeyB AI debug mode is active.
   */
  drawEncounterDebug(ctx, camera) {
    const coord = this.encounterCoordinator;
    if (!coord) return;

    ctx.save();
    // Render on screen fixed coordinates (invert camera translation if any, or offset by camera)
    const hudX = (camera ? camera.x : 0) + 960;
    const hudY = (camera ? camera.y : 0) + 110;

    const synergy = coord.activeSynergy || (coord.groupAlerted ? 'ENGAGED_PRESSURE' : 'STANDBY_PATROL');
    const primaryHolder = coord.primaryTokenHolder ? coord.primaryTokenHolder.name : 'NONE';
    const harasserHolder = coord.harasserTokenHolder ? coord.harasserTokenHolder.name : 'NONE';

    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.strokeStyle = coord.activeSynergy ? '#f59e0b' : '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.fillRect(hudX - 190, hudY, 380, 48);
    ctx.strokeRect(hudX - 190, hudY, 380, 48);

    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`GROUP ENCOUNTER: ${synergy}`, hudX, hudY + 18);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px monospace';
    ctx.fillText(`TOKENS: [PRI: ${primaryHolder}] | [HAR: ${harasserHolder}]`, hudX, hudY + 36);

    ctx.restore();
  }
}
