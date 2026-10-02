import { CANVAS_WIDTH, CANVAS_HEIGHT, GAME_STATES, PHYSICS } from './Constants.js';
import { GameState } from './GameState.js';
import { Input } from '../systems/Input.js';
import { Camera } from '../systems/Camera.js';
import { AudioManager } from '../audio/AudioManager.js';
import { Level } from '../level/Level.js';
import { LEVEL_1_1 } from '../level/LevelData.js';
import { Player } from '../entities/Player.js';
import { Renderer } from '../renderer/Renderer.js';
import { assetManager } from '../renderer/AssetManager.js';
import { HUD } from '../ui/HUD.js';
import { DialogueBox } from '../ui/DialogueBox.js';
import { TitleScreen } from '../ui/TitleScreen.js';
import { GameOverScreen } from '../ui/GameOverScreen.js';
import { Collision } from '../physics/Collision.js';
import { animationDebug } from '../ui/AnimationDebugOverlay.js';
import { characterRenderer } from '../renderer/HDCharacterRenderer.js';
import { preloadEnvironmentAssets } from '../environment/EnvironmentAssetLibrary.js';
import { directorHUD } from '../director/DirectorHUD.js';

/**
 * PRINCESS ARIA - Master Game Controller.
 * Coordinates input, physics updates, collision passes, camera tracking, and HD rendering.
 */
export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new Renderer(this.canvas);
    this.input = new Input();
    this.camera = new Camera();
    this.audio = new AudioManager();
    this.gameState = new GameState();

    this.hud = new HUD();
    this.dialogue = new DialogueBox();
    this.titleScreen = new TitleScreen();
    this.gameOverScreen = new GameOverScreen();

    this.state = GAME_STATES.TITLE;
    this.level = new Level(LEVEL_1_1);
    this.player = new Player(this.level.spawnPoint.x, this.level.spawnPoint.y);
    this.director = this.level.director;

    this.respawnTimer = 0;
    this.lastTime = performance.now();
    this.accumulator = 0;
    this.fixedStep = 1 / 60;
    this.fps = 60;
    this.fpsTimer = 0;
    this.framesCount = 0;

    // Attach click handler for on-screen debug pill and level completion buttons
    this.canvas.addEventListener('pointerdown', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = CANVAS_WIDTH / rect.width;
      const scaleY = CANVAS_HEIGHT / rect.height;
      const canvasX = (e.clientX - rect.left) * scaleX;
      const canvasY = (e.clientY - rect.top) * scaleY;

      // Ensure audio context is unlocked by user interaction
      if (this.audio) {
        this.audio.unlock();
      }

      // Check debug overlay click
      if (animationDebug.handleClick(canvasX, canvasY)) {
        return;
      }

      // Click anywhere to start on Title Screen
      if (this.state === GAME_STATES.TITLE) {
        this.restartGame();
        return;
      }

      // Check level clear continue button click
      if (this.state === GAME_STATES.LEVEL_CLEAR || this.state === GAME_STATES.GAME_OVER) {
        this.gameOverScreen.handleClick(canvasX, canvasY, () => {
          this.restartGame();
        });
      }
    });

    // Global user-gesture unlock for audio on first keypress
    const unlockAudioOnKey = () => {
      if (this.audio) {
        this.audio.unlock();
      }
      window.removeEventListener('keydown', unlockAudioOnKey);
    };
    window.addEventListener('keydown', unlockAudioOnKey, { passive: true });

    this.loop = this.loop.bind(this);
  }

  async start() {
    console.log('[Game] Preloading HD Princess Aria character & Honeywood Kingdom assets...');
    await assetManager.preloadAriaAssets();
    await preloadEnvironmentAssets();
    this.player.setupAnimations();
    console.log('[Game] Assets ready. Starting game loop.');

    // Autoplay query parameter for automated testing / headless review
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('play') === 'true' || urlParams.get('start') === 'true') {
      this.restartGame();
    }

    this.lastTime = performance.now();
    requestAnimationFrame(this.loop);
  }

  restartGame() {
    if (this.audio) {
      this.audio.unlock();
      this.audio.playStart();
      this.audio.setBiome('glade');
      this.audio.startProceduralMusic('glade');
    }
    this.gameState.resetForNewGame();
    this.level.reset();
    this.player.respawn(this.level.spawnPoint.x, this.level.spawnPoint.y);
    this.state = GAME_STATES.PLAYING;
  }

  loop(currentTime) {
    let dt = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    if (dt > 0.05) dt = 0.05;

    // FPS calculation
    this.framesCount++;
    this.fpsTimer += dt;
    if (this.fpsTimer >= 0.5) {
      this.fps = Math.round(this.framesCount / this.fpsTimer);
      this.framesCount = 0;
      this.fpsTimer = 0;
    }

    this.accumulator += dt;
    while (this.accumulator >= this.fixedStep) {
      this.fixedUpdate(this.fixedStep);
      this.accumulator -= this.fixedStep;
    }

    this.render();
    this.input.endFrame();

    requestAnimationFrame(this.loop);
  }

  fixedUpdate(dt) {
    this.renderer.update(dt);

    // Toggle debug overlay via hotkey
    if (this.input.justPressed('DEBUG')) {
      animationDebug.toggle();
    }
    if (this.input.justPressed('DEBUG_AI')) {
      if (this.level) this.level.toggleDebugAI();
    }
    if (this.input.justPressed('DEBUG_VISUAL')) {
      this.renderer.toggleDebugVisual();
    }

    // Toggle audio mute via hotkey 'M'
    if (this.input.justPressed('MUTE')) {
      if (this.audio) {
        this.audio.toggleMute();
      }
    }

    if (this.dialogue.active) {
      this.dialogue.update(dt, this.input);
    }

    if (this.state === GAME_STATES.TITLE) {
      this.titleScreen.update(dt, this.player);
      if (this.input.justPressed('START')) {
        this.restartGame();
      }
      return;
    }

    if (this.state === GAME_STATES.GAME_OVER || this.state === GAME_STATES.LEVEL_CLEAR) {
      this.gameOverScreen.update(dt);
      if (this.player) {
        this.player.anim.update(dt);
      }
      if (this.input.justPressed('RESTART') || this.input.justPressed('START')) {
        this.restartGame();
      }
      return;
    }

    // --- PLAYING STATE ---
    this.hud.update(dt);

    if (this.player.isDead) {
      this.player.anim.update(dt);
      this.respawnTimer -= dt;
      if (this.respawnTimer <= 0) {
        if (this.gameState.lives > 0) {
          this.player.respawn(this.level.spawnPoint.x, this.level.spawnPoint.y);
          this.level.spawnDust(this.player.x + this.player.width / 2, this.player.y + this.player.height, 8);
        } else {
          this.state = GAME_STATES.GAME_OVER;
        }
      }
      return;
    }

    // 1. Update Player Controls & Physical Intent (with level context for vine climbing)
    const wasGroundedBefore = this.player.isGrounded;
    this.player.update(this.input, this.audio, dt, this.level);

    // Dynamic Biome Music Modulation (Glade vs Canopy vs Fortress)
    if (this.audio && this.audio.setBiome) {
      if (this.player.x >= 5200) {
        this.audio.setBiome('fortress');
      } else if (this.player.x >= 2400) {
        this.audio.setBiome('canopy');
      } else {
        this.audio.setBiome('glade');
      }
    }

    // Toggle character render pipeline on F2 (Dev Fallback -> Silhouette -> Rig -> Frame Sequence)
    if (this.input.justPressed('F2')) {
      characterRenderer.cycleRenderMode();
    }

    // 2. Reset grounded state before collision detection pass
    this.player.isGrounded = false;

    // 3. Resolve Solid Platform Collisions (Static + Moving Platforms)
    const allPlatforms = this.level.getAllSolidPlatforms();
    allPlatforms.forEach(plat => {
      const res = Collision.resolveSolidPlatform(this.player, plat);
      if (res.bounced) {
        if (this.audio && this.audio.playBounce) {
          this.audio.playBounce();
        }
        this.level.spawnBurst(this.player.x + this.player.width / 2, this.player.y + this.player.height, 14, '#f59e0b');
        if (this.camera) this.camera.shake(5, 0.12);
      } else if (res.landed) {
        this.player.land();
        if (!wasGroundedBefore && this.audio && this.audio.playLand) {
          this.audio.playLand();
        }
      }
    });

    // Dynamic physical shadow scaling based on altitude above platform
    if (this.player.isGrounded) {
      this.player.groundDistance = 0;
    } else {
      let closestDist = 9999;
      const footX = this.player.x + this.player.width / 2;
      const footY = this.player.y + this.player.height;
      for (const plat of allPlatforms) {
        if (footX >= plat.x - 8 && footX <= plat.x + plat.width + 8) {
          if (plat.y >= footY - 8) {
            const d = plat.y - footY;
            if (d < closestDist) {
              closestDist = d;
            }
          }
        }
      }
      this.player.groundDistance = closestDist < 1000 ? closestDist : 400;
    }

    // 4. Fall Death Check
    if (this.player.y > PHYSICS.DEATH_Y) {
      this.player.isDead = true;
      this.player.anim.play('DEATH', true);
      if (this.audio) this.audio.playDeath();
      this.camera.shake(12, 0.25);
      const remainingLives = this.gameState.loseLife();
      this.respawnTimer = PHYSICS.RESPAWN_DELAY;
      if (remainingLives <= 0) {
        this.respawnTimer = 1.2;
      }
      return;
    }

    // 5. Update Level
    this.level.update(this.player, this.gameState, this.audio, this.camera, dt);

    // 6. Check Batboy Rescue Victory Condition
    if (Collision.intersects(this.player.getBounds(), this.level.goal)) {
      this.level.batboy.isRescued = true;
      if (this.audio) this.audio.playLevelComplete();
      this.gameState.addScore(1000);
      this.player.setVictory();
      this.state = GAME_STATES.LEVEL_CLEAR;
      return;
    }

    if (this.gameState.lives <= 0) {
      this.state = GAME_STATES.GAME_OVER;
      return;
    }

    // 7. Smooth 2D Camera Tracking with Vertical Dead-Zone
    this.camera.update(this.player, this.level.width, dt, this.level.height);
  }

  render() {
    this.renderer.clear();
    this.renderer.beginFrame();

    if (this.state === GAME_STATES.TITLE) {
      this.titleScreen.draw(this.renderer.ctx, this.player);
      animationDebug.draw(this.renderer.ctx, this.player, this.fps);
      this.renderer.endFrame();
      return;
    }

    // 1. Draw Multi-Layer Parallax Background & Atmospheric Progression
    this.renderer.drawBackground(this.camera, this.level);

    const ctx = this.renderer.ctx;
    const shake = this.camera.getShakeOffset();

    ctx.save();
    ctx.translate(-this.camera.x + shake.x, -this.camera.y + shake.y);

    // 2. Draw Midground Landmark Props (Ancient Oaks, Ruin Arches, Wild Honeycombs)
    this.renderer.drawMidgroundProps(this.level.midgroundProps, this.camera);

    // 3. Draw World Platforms (Static & Moving)
    this.renderer.drawPlatforms(this.level.platforms, this.camera);
    this.level.movingPlatforms.forEach(mp => mp.draw(ctx));

    // 4. Draw Detail Flora, Fungi & Signs
    this.renderer.drawDetails(this.level.detailProps, this.camera);

    // 5. Draw Checkpoints & Goal Beacon
    if (this.level.checkpoints) {
      this.renderer.drawCheckpoints(this.level.checkpoints);
    } else {
      this.renderer.drawCheckpoint(this.level.checkpoint);
    }
    this.renderer.drawGoal(this.level.goal, this.level.batboy);

    // 6. Draw Collectibles (Royal Shards)
    this.level.shards.forEach(s => s.draw(ctx));

    // 5. Draw Queen Bee Antagonist Presence & Batboy Chrysalis
    if (this.level.queenBeePresence) {
      this.level.queenBeePresence.draw(ctx, this.camera);
    }

    // 6. Draw Enemies (Hive Grub, Honey Wisp, Honey Beetle, Hive Firefly)
    this.level.enemies.forEach(e => {
      e.draw(ctx);
      if (this.level.debugAI) {
        e.drawDebug(ctx);
      }
    });

    // 7. Draw Environmental & Sparkle Particles
    this.level.particles.forEach(p => p.draw(ctx));

    // 8. Draw Princess Aria
    this.player.draw(ctx);

    ctx.restore();

    // AI Debug Mode Screen Indicator
    if (this.level.debugAI) {
      ctx.save();
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.fillRect(24, 110, 240, 40);
      ctx.strokeRect(24, 110, 240, 40);
      ctx.fillStyle = '#fef08a';
      ctx.font = 'bold 13px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('⚙️ AI DEBUG MODE: ON (F1/B)', 144, 134);
      ctx.restore();
    }

    // 8. Secret Area Discovery Banner & Landmark Shrine Cinematic Banner
    if (this.level.secretBannerTimer > 0) {
      this.renderer.drawSecretBanner(this.level.secretBannerTimer, this.level.secretBannerText);
    }
    if (this.level.shrineBannerTimer > 0) {
      this.renderer.drawShrineBanner(this.level.shrineBannerTimer, this.level.shrineBannerText);
    }
    this.renderer.cinematic.setLetterbox(this.level.shrineBannerTimer > 0, 48);

    // 9. 2D Lighting Layer & Atmospheric Ambient Pass
    this.renderer.drawLighting(this.camera, this.level, this.player);

    // 10. Foreground Framing Vignettes
    this.renderer.drawForeground(this.camera);

    // 11. Top HUD Bar (smoothly fades during cinematic moments)
    this.hud.draw(ctx, this.gameState, { letterboxHeight: this.renderer.cinematic.letterboxHeight });

    // 11. Cinematic Letterbox & Fade Transitions
    this.renderer.drawCinematic();

    // 12. Interactive Dialogue Box
    if (this.dialogue && this.dialogue.active) {
      this.dialogue.draw(ctx);
    }

    // 13. Game Over or Level Clear Screen
    if (this.state === GAME_STATES.GAME_OVER) {
      this.gameOverScreen.draw(ctx, this.gameState, false);
    } else if (this.state === GAME_STATES.LEVEL_CLEAR) {
      this.gameOverScreen.draw(ctx, this.gameState, true, { totalShards: this.level.shards.length });
    }

    // 14. Developer Overlays (Animation & Visual Pipeline & AI Director)
    animationDebug.draw(ctx, this.player, this.fps);
    this.renderer.drawDebugVisual(this.fps, this.camera, this.level);
    if (this.level && this.level.director) {
      directorHUD.draw(ctx, this.level.director);
    }

    this.renderer.endFrame();
  }
}
