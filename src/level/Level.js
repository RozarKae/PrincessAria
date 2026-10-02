import { RoyalShard } from '../entities/RoyalShard.js';
import { HiveGrub } from '../entities/HiveGrub.js';
import { HoneyWisp } from '../entities/HoneyWisp.js';
import { HoneyBeetle } from '../entities/HoneyBeetle.js';
import { HiveFirefly } from '../entities/HiveFirefly.js';
import { MovingPlatform } from '../entities/MovingPlatform.js';
import { Particle } from '../entities/Particle.js';
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
    this.theme = levelData.theme;
    this.spawnPoint = { ...levelData.spawn };
    this.checkpoints = levelData.checkpoints ? levelData.checkpoints.map(c => ({ ...c, activated: false })) : (levelData.checkpoint ? [{ ...levelData.checkpoint, activated: false }] : []);
    this.checkpoint = this.checkpoints[0] || { x: 740, y: 840, width: 40, height: 40, activated: false };
    this.goal = { ...levelData.goal };
    this.midgroundProps = levelData.midgroundProps || [];
    this.detailProps = levelData.detailProps || [];

    // Dynamic Entities
    this.shards = [];
    this.coins = []; // backward-compatibility alias
    this.enemies = [];
    this.movingPlatforms = [];
    this.particles = [];
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
    this.secretBannerTimer = 0;
    this.secretBannerText = '';

    // Landmark Shrine Event Tracking
    this.shrineCinematicTriggered = false;
    this.hollowRedwoodTriggered = false;
    this.outpostTriggered = false;
    this.watchtowerTriggered = false;
    this.shrineBannerTimer = 0;
    this.shrineBannerText = '';

    // Coordinated Encounter Ecosystem
    this.encounterCoordinator = new EncounterCoordinator();

    // AI Debug Mode Toggle
    this.debugAI = false;

    // AI Level Director Engine
    this.director = new LevelDirector();

    this.initButterflies();
    this.reset();
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
        case 'grub':
        case 'hive_grub':
        default:
          return new HiveGrub(e.x, e.y, pLeft, pRight);
      }
    });

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
    this.secretBannerTimer = 0;
    this.shrineCinematicTriggered = false;
    this.hollowRedwoodTriggered = false;
    this.outpostTriggered = false;
    this.watchtowerTriggered = false;
    this.shrineBannerTimer = 0;

    // Reset crumble blocks
    if (this.platforms) {
      this.platforms.forEach(p => {
        if (p.type === 'crumble_block' || p.type === 'crumble') {
          p.isShaking = false;
          p.shakeTimer = 0;
          p.isBroken = false;
          p.respawnTimer = 0;
        }
      });
    }

    if (this.director) {
      this.director.reset();
    }
  }

  /**
   * Return combined list of static and moving solid platforms for physics collision.
   * Filters out climbable vines and broken crumble blocks.
   */
  getAllSolidPlatforms() {
    return [
      ...this.platforms.filter(p => p.type !== 'climbable_vine' && p.type !== 'vine' && !((p.type === 'crumble_block' || p.type === 'crumble') && p.isBroken)),
      ...this.movingPlatforms
    ];
  }

  /**
   * Returns list of climbable hanging vines in the current world.
   */
  getClimbableVines() {
    return this.platforms.filter(p => p.type === 'climbable_vine' || p.type === 'vine');
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
    this.audioRef = audio;
    this.batboy.update(dt);

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
          // If attacking beetle from the front while active, shell deflects!
          const isBeetle = enemy instanceof HoneyBeetle;
          const playerFacingEnemy = (player.facing > 0 && enemy.x > player.x) || (player.facing < 0 && enemy.x < player.x);
          const isFrontal = isBeetle && !enemy.isVulnerable && ((enemy.facing < 0 && player.facing > 0) || (enemy.facing > 0 && player.facing < 0));

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
            // Player takes damage on side/bottom collision
            const wasHurt = player.hurt();
            if (wasHurt) {
              if (camera) camera.shake(11, 0.2);
              if (audio && audio.playDamage) audio.playDamage();
              else if (audio && audio.playHurt) audio.playHurt();
              gameState.loseLife();
              if (this.director) this.director.telemetry.recordDamage(1, 'enemy', player.x, player.y);
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

    if (this.secretBannerTimer > 0) {
      this.secretBannerTimer -= dt;
    }

    // 5B. Memorable Landmarks & Cinematic Triggers
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
    if (!this.watchtowerTriggered && player.x >= 6800) {
      this.watchtowerTriggered = true;
      this.shrineBannerText = '✨ LANDMARK: THE SUNSTONE FORTRESS WATCHTOWER';
      this.shrineBannerTimer = 4.0;
      this.spawnSparkles(7100, 520, 36);
      if (audio && audio.playCheckpoint) audio.playCheckpoint();
      if (camera && camera.focus) camera.focus(7100, 500, 2.5);
    }

    if (this.shrineBannerTimer > 0) {
      this.shrineBannerTimer -= dt;
    }

    // 5C. Crumble Blocks Simulation (Shake -> Shatter -> Reform)
    if (this.platforms) {
      this.platforms.forEach(plat => {
        if (plat.type === 'crumble_block' || plat.type === 'crumble') {
          if (plat.isShaking) {
            plat.shakeTimer -= dt;
            if (plat.shakeTimer <= 0) {
              plat.isShaking = false;
              plat.isBroken = true;
              plat.respawnTimer = 3.4;
              if (audio && audio.playCrumble) audio.playCrumble();
              this.spawnBurst(plat.x + plat.width / 2, plat.y + plat.height / 2, 16, '#94a3b8');
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
