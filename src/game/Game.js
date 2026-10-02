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
import { TitleScreen3D } from '../ui/TitleScreen3D.js';
import { CinematicTitleScreen } from '../ui/CinematicTitleScreen.js';
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
    this.container = this.canvas.parentElement;
    this.renderer = new Renderer(this.canvas);
    this.input = new Input();
    this.camera = new Camera();
    this.audio = new AudioManager();
    this.gameState = new GameState();

    this.hud = new HUD();
    this.dialogue = new DialogueBox();
    this.titleScreen = new CinematicTitleScreen(this.container, () => {
      this.restartGame();
    }, this.audio);
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
      const scaleX = 256 / rect.width;
      const scaleY = 240 / rect.height;
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

      // Clicks on Title Screen handled by TitleScreen3D
      if (this.state === GAME_STATES.TITLE) {
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
    console.log('[Game] Initializing 1985 Pixel Platformer engine & Anime Cinematic Title Screen...');
    this.player.setupAnimations();

    // Autoplay query parameter for automated testing / headless review
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('play') === 'true' || urlParams.get('start') === 'true') {
      if (this.titleScreen) {
        this.titleScreen.hide();
      }
      this.restartGame();
    } else {
      this.state = GAME_STATES.TITLE;
      if (this.titleScreen) {
        this.titleScreen.start();
      }
    }

    this.lastTime = performance.now();
    requestAnimationFrame(this.loop);
    console.log('[Game] Engine ready. Loop running.');

    // Preload legacy assets in background for story scenes
    Promise.all([
      assetManager.preloadAriaAssets(),
      preloadEnvironmentAssets()
    ]).catch(e => console.warn('[Game] Background preload:', e));
  }

  restartGame() {
    if (this.titleScreen) {
      this.titleScreen.hide();
    }
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
      // 3D Title Screen runs its own continuous loop and handles input
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
      // 3D Title screen is active on its overlay canvas; clear underlying 2D canvas
      this.renderer.clear();
      this.renderer.endFrame();
      return;
    }

    if (this.state === GAME_STATES.GAME_OVER) {
      this.renderer.drawWorld(this.camera, this.level, this.player, this.gameState);
      this.renderer.drawGameOverScreen(this.gameOverScreen, this.gameState, false);
      this.renderer.endFrame();
      return;
    }

    if (this.state === GAME_STATES.LEVEL_CLEAR) {
      this.renderer.drawWorld(this.camera, this.level, this.player, this.gameState);
      this.renderer.drawGameOverScreen(this.gameOverScreen, this.gameState, true, { totalShards: this.level.shards.length });
      this.renderer.endFrame();
      return;
    }

    // --- PLAYING STATE ---
    this.renderer.drawWorld(this.camera, this.level, this.player, this.gameState);

    // Interactive Dialogue Box (if triggered)
    if (this.dialogue && this.dialogue.active) {
      this.dialogue.draw(this.renderer.internalCtx);
    }

    // Cinematic Fades / Transitions
    this.renderer.drawCinematic();

    this.renderer.endFrame();
  }
}
