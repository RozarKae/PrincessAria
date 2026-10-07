import { CANVAS_WIDTH, CANVAS_HEIGHT, GAME_STATES, PHYSICS } from './Constants.js';
import { GameState } from './GameState.js';
import { Input } from '../systems/Input.js';
import { Camera } from '../systems/Camera.js';
import { AudioManager } from '../audio/AudioManager.js';
import { Level } from '../level/Level.js';
import { LEVEL_1_1, LEVEL_2_1, LEVEL_3_1, LEVEL_4_1, LEVEL_5_1, LEVEL_6_1 } from '../level/LevelData.js';
import { Player } from '../entities/Player.js';
import { Renderer } from '../renderer/Renderer.js';
import { assetManager } from '../renderer/AssetManager.js';
import { HUD } from '../ui/HUD.js';
import { DialogueBox } from '../ui/DialogueBox.js';
import { ContinueDialog } from '../ui/ContinueDialog.js';
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
    this.continueDialog = new ContinueDialog();
    this.titleScreen = new CinematicTitleScreen(this.container, () => {
      this.restartGame();
    }, this.audio);
    this.gameOverScreen = new GameOverScreen();

    // Check initial level/world parameter (?world=2 or ?world=3 or ?world=4 or ?world=5 or ?world=6)
    const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const requestedWorld = urlParams ? (urlParams.get('world') || urlParams.get('w') || urlParams.get('level')) : null;
    const isW6 = requestedWorld === '6' || requestedWorld === '6-1';
    const isW5 = requestedWorld === '5' || requestedWorld === '5-1';
    const isW4 = requestedWorld === '4' || requestedWorld === '4-1';
    const isW3 = requestedWorld === '3' || requestedWorld === '3-1';
    const isW2 = requestedWorld === '2' || requestedWorld === '2-1';
    this.currentLevelData = isW6 ? LEVEL_6_1 : (isW5 ? LEVEL_5_1 : (isW4 ? LEVEL_4_1 : (isW3 ? LEVEL_3_1 : (isW2 ? LEVEL_2_1 : LEVEL_1_1))));
    this.gameState.world = this.currentLevelData.world || 1;
    this.gameState.level = this.currentLevelData.stage || 1;

    this.state = GAME_STATES.TITLE;
    this.level = new Level(this.currentLevelData);
    this.player = new Player(this.level.spawnPoint.x, this.level.spawnPoint.y);
    this.director = this.level.director;
    // Scatter pickups for this level (lightweight default distribution)
    if (this.level && typeof this.level.scatterPickups === 'function') {
      this.level.scatterPickups(8 + Math.floor(Math.random() * 6));
    }

    this.respawnTimer = 0;
    this.awaitingContinue = false;
    this.deathRemainingLives = 0;
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

      // Clicks on Title Screen handled by TitleScreen3D
      if (this.state === GAME_STATES.TITLE) {
        return;
      }

      // Check level clear, defeated, or game over button clicks
      if (this.state === GAME_STATES.LEVEL_CLEAR) {
        this.gameOverScreen.handleClick(canvasX, canvasY, 'VICTORY', () => {
          this.advanceToNextWorld();
        });
      } else if (this.state === GAME_STATES.DEFEATED) {
        this.gameOverScreen.handleClick(canvasX, canvasY, 'DEFEATED', () => {
          this.continueFromCheckpoint();
        }, () => {
          this.goToMainMenu();
        });
      } else if (this.state === GAME_STATES.GAME_OVER) {
        this.gameOverScreen.handleClick(canvasX, canvasY, 'GAME_OVER', null, () => {
          this.goToMainMenu();
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
    const requestedWorld = urlParams.get('world') || urlParams.get('w') || urlParams.get('level');
    if (requestedWorld === '6' || requestedWorld === '6-1') {
      this.currentLevelData = LEVEL_6_1;
      this.gameState.world = 6;
    } else if (requestedWorld === '5' || requestedWorld === '5-1') {
      this.currentLevelData = LEVEL_5_1;
      this.gameState.world = 5;
    } else if (requestedWorld === '4' || requestedWorld === '4-1') {
      this.currentLevelData = LEVEL_4_1;
      this.gameState.world = 4;
    } else if (requestedWorld === '3' || requestedWorld === '3-1') {
      this.currentLevelData = LEVEL_3_1;
      this.gameState.world = 3;
    } else if (requestedWorld === '2' || requestedWorld === '2-1') {
      this.currentLevelData = LEVEL_2_1;
      this.gameState.world = 2;
    }
    if (urlParams.get('play') === 'true' || urlParams.get('start') === 'true') {
      if (this.titleScreen) {
        this.titleScreen.hide();
      }
      this.restartGame(this.currentLevelData);
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

  restartGame(targetLevelData = null) {
    if (this.titleScreen) {
      this.titleScreen.hide();
    }
    if (targetLevelData) {
      this.currentLevelData = targetLevelData;
    } else if (!this.currentLevelData) {
      const urlParams = new URLSearchParams(window.location.search);
      const requestedWorld = urlParams.get('world') || urlParams.get('w') || urlParams.get('level');
      if (requestedWorld === '6' || requestedWorld === '6-1') {
        this.currentLevelData = LEVEL_6_1;
      } else if (requestedWorld === '5' || requestedWorld === '5-1') {
        this.currentLevelData = LEVEL_5_1;
      } else if (requestedWorld === '4' || requestedWorld === '4-1') {
        this.currentLevelData = LEVEL_4_1;
      } else if (requestedWorld === '3' || requestedWorld === '3-1') {
        this.currentLevelData = LEVEL_3_1;
      } else if (requestedWorld === '2' || requestedWorld === '2-1') {
        this.currentLevelData = LEVEL_2_1;
      } else {
        this.currentLevelData = LEVEL_1_1;
      }
    }

    const isWorld6 = this.currentLevelData && this.currentLevelData.world === 6;
    const isWorld5 = this.currentLevelData && this.currentLevelData.world === 5;
    const isWorld4 = this.currentLevelData && this.currentLevelData.world === 4;
    const isWorld3 = this.currentLevelData && this.currentLevelData.world === 3;
    const isWorld2 = this.currentLevelData && this.currentLevelData.world === 2;
    const initialBiome = isWorld6 ? 'clockwork' : (isWorld5 ? 'desert' : (isWorld4 ? 'volcano' : (isWorld3 ? 'castle' : (isWorld2 ? 'forest' : 'glade'))));

    if (this.audio) {
      this.audio.unlock();
      this.audio.playStart();
      this.audio.setBiome(initialBiome);
      this.audio.startProceduralMusic(initialBiome);
    }
    this.gameState.resetForNewGame(this.currentLevelData.world || 1, this.currentLevelData.stage || 1);
    this.level = new Level(this.currentLevelData);
    this.director = this.level.director;
    this.player.respawn(this.level.spawnPoint.x, this.level.spawnPoint.y);
    if (this.camera) {
      this.camera.x = this.player.x - CANVAS_WIDTH / 2;
      this.camera.y = this.player.y - CANVAS_HEIGHT / 2;
    }
    this.state = GAME_STATES.PLAYING;
  }

  /**
   * End current run and return to Main Menu / Title Screen.
   * Clears temporary run state, resets death state, and restores starting parameters.
   */
  goToMainMenu() {
    this.currentLevelData = LEVEL_1_1;
    this.gameState.resetForNewGame(1, 1);
    this.level = new Level(this.currentLevelData);
    this.director = this.level.director;
    this.player.respawn(this.level.spawnPoint.x, this.level.spawnPoint.y);
    if (this.camera) {
      this.camera.x = this.player.x - CANVAS_WIDTH / 2;
      this.camera.y = this.player.y - CANVAS_HEIGHT / 2;
    }
    this.state = GAME_STATES.TITLE;
    if (this.titleScreen) {
      this.titleScreen.start();
    }
  }

  /**
   * Centralized Player Death Handler.
   * Guarantees:
   * 1. Exactly one death removes only ONE life.
   * 2. Prevents duplicate death events across frames.
   * 3. Lives > 1 before death -> loses 1 life, HP resets to 100, pause gameplay, enter DEFEATED state.
   * 4. Lives == 1 before death -> loses final life (lives = 0), HP stays 0, no checkpoint respawn, enter GAME_OVER state.
   */
  handlePlayerDeath() {
    if (this.player.isDead || this.state === GAME_STATES.DEFEATED || this.state === GAME_STATES.GAME_OVER) {
      return;
    }

    this.player.isDead = true;
    this.player.anim.play('DEATH', true);
    if (this.audio && this.audio.playDeath) this.audio.playDeath();
    if (this.camera) this.camera.shake(14, 0.3);

    if (this.gameState.lives > 1) {
      // Normal Death: remove 1 life, reset HP to 100, keep latest checkpoint
      this.gameState.loseLife();
      this.player.hp = this.player.maxHp;
      this.gameState.hp = this.player.hp;
      this.respawnTimer = 0.8; // Brief delay to let death animation register before showing screen
    } else {
      // Final Life Death: lives becomes 0, HP stays 0, no checkpoint continue allowed
      this.gameState.lives = 0;
      this.player.hp = 0;
      this.gameState.hp = 0;
      this.respawnTimer = 0.8;
    }
  }

  /**
   * Continue from the most recently activated checkpoint after Normal Defeat.
   * Preserves current lives, restores HP = 100, sets player to ALIVE, and resumes gameplay.
   */
  continueFromCheckpoint() {
    if (this.gameState.lives <= 0) {
      this.state = GAME_STATES.GAME_OVER;
      return;
    }

    // Keep current life count and restore HP = 100
    this.player.hp = this.player.maxHp;
    this.gameState.hp = this.player.hp;

    // Respawn player at latest checkpoint / spawn point
    const spawnX = this.level?.spawnPoint?.x ?? this.player.startX;
    const spawnY = this.level?.spawnPoint?.y ?? this.player.startY;
    this.player.respawn(spawnX, spawnY);

    if (this.camera) {
      this.camera.x = this.player.x - CANVAS_WIDTH / 2;
      this.camera.y = this.player.y - CANVAS_HEIGHT / 2;
    }

    if (this.level && this.level.spawnDust) {
      this.level.spawnDust(this.player.x + this.player.width / 2, this.player.y + this.player.height, 10);
    }

    // Clear temporary death state, re-enable player controls, resume gameplay
    this.state = GAME_STATES.PLAYING;
  }

  loadLevel(levelData) {
    console.log(`[Game] Loading World ${levelData.world}-${levelData.stage}: ${levelData.name}`);
    this.currentLevelData = levelData;
    this.gameState.world = levelData.world || 1;
    this.gameState.level = levelData.stage || 1;
    this.level = new Level(levelData);
    this.director = this.level.director;
    this.player.respawn(this.level.spawnPoint.x, this.level.spawnPoint.y);
    if (this.camera) {
      this.camera.x = this.player.x - CANVAS_WIDTH / 2;
      this.camera.y = this.player.y - CANVAS_HEIGHT / 2;
    }
    const isWorld6 = levelData.world === 6;
    const isWorld5 = levelData.world === 5;
    const isWorld4 = levelData.world === 4;
    const isWorld3 = levelData.world === 3;
    const isWorld2 = levelData.world === 2;
    const initialBiome = isWorld6 ? 'clockwork' : (isWorld5 ? 'desert' : (isWorld4 ? 'volcano' : (isWorld3 ? 'castle' : (isWorld2 ? 'forest' : 'glade'))));
    if (this.audio) {
      this.audio.setBiome(initialBiome);
      this.audio.startProceduralMusic(initialBiome);
    }
    this.state = GAME_STATES.PLAYING;
  }

  advanceToNextWorld() {
    if (this.gameState.world === 1) {
      console.log('[Game] Advancing from World 1 to World 2: The Whispering Forest!');
      this.loadLevel(LEVEL_2_1);
    } else if (this.gameState.world === 2) {
      console.log('[Game] Advancing from World 2 to World 3: The Castle of a Thousand Doors!');
      this.loadLevel(LEVEL_3_1);
    } else if (this.gameState.world === 3) {
      console.log('[Game] Advancing from World 3 to World 4: The Volcano of Hot Honey!');
      this.loadLevel(LEVEL_4_1);
    } else if (this.gameState.world === 4) {
      console.log('[Game] Advancing from World 4 to World 5: The Desert of Endless Sandwiches!');
      this.loadLevel(LEVEL_5_1);
    } else if (this.gameState.world === 5) {
      console.log('[Game] Advancing from World 5 to World 6: The Clockwork Kingdom!');
      this.loadLevel(LEVEL_6_1);
    } else if (this.gameState.world === 6) {
      console.log('[Game] World 6 Complete! Time Tinker defeated & Grand Chronometer restored! Heading to World 7...');
      this.loadLevel(LEVEL_1_1);
    } else {
      this.loadLevel(LEVEL_1_1);
    }
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

    this.input.update();

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

    // Hotkeys '1', '2', '3', '4', and '5' to switch between Worlds
    if (this.input.justPressed('WORLD_1')) {
      this.loadLevel(LEVEL_1_1);
    }
    if (this.input.justPressed('WORLD_2')) {
      this.loadLevel(LEVEL_2_1);
    }
    if (this.input.justPressed('WORLD_3')) {
      this.loadLevel(LEVEL_3_1);
    }
    if (this.input.justPressed('WORLD_4')) {
      this.loadLevel(LEVEL_4_1);
    }
    if (this.input.justPressed('WORLD_5')) {
      this.loadLevel(LEVEL_5_1);
    }
    if (this.input.justPressed('WORLD_6')) {
      this.loadLevel(LEVEL_6_1);
    }

    if (this.dialogue.active) {
      this.dialogue.update(dt, this.input);
    }

    if (this.state === GAME_STATES.TITLE) {
      // 3D Title Screen runs its own continuous loop and handles input
      return;
    }

    if (this.state === GAME_STATES.DEFEATED) {
      this.gameOverScreen.update(dt);
      if (this.player) {
        this.player.anim.update(dt);
      }
      // Menu navigation between [ CONTINUE FROM CHECKPOINT ] (0) and [ MAIN MENU ] (1)
      if (this.input.justPressed('UP') || this.input.justPressed('DOWN')) {
        this.gameOverScreen.selectedOption = this.gameOverScreen.selectedOption === 0 ? 1 : 0;
        if (this.audio && this.audio.playSelect) this.audio.playSelect();
      }
      if (this.input.justPressed('START') || this.input.justPressed('JUMP') || this.input.justPressed('ATTACK')) {
        if (this.gameOverScreen.selectedOption === 0) {
          this.continueFromCheckpoint();
        } else {
          this.goToMainMenu();
        }
      }
      return;
    }

    if (this.state === GAME_STATES.GAME_OVER || this.state === GAME_STATES.LEVEL_CLEAR) {
      this.gameOverScreen.update(dt);
      if (this.player) {
        this.player.anim.update(dt);
      }
      if (this.input.justPressed('RESTART') || this.input.justPressed('START') || this.input.justPressed('JUMP') || this.input.justPressed('ATTACK')) {
        if (this.state === GAME_STATES.LEVEL_CLEAR) {
          this.advanceToNextWorld();
        } else {
          this.goToMainMenu();
        }
      }
      return;
    }

    // --- PLAYING STATE ---
    this.hud.update(dt);

    // HP Zero Death Trigger check during active play
    if (this.player.hp <= 0 && !this.player.isDead) {
      this.handlePlayerDeath();
      return;
    }

    if (this.player.isDead) {
      this.player.anim.update(dt);
      this.respawnTimer -= dt;
      if (this.respawnTimer <= 0) {
        if (this.gameState.lives > 0) {
          this.state = GAME_STATES.DEFEATED;
          this.gameOverScreen.selectedOption = 0;
        } else {
          this.state = GAME_STATES.GAME_OVER;
        }
      }
      return;
    }

    // 1. Update Player Controls & Physical Intent (with level context for vine climbing)
    const wasGroundedBefore = this.player.isGrounded;
    this.player.update(this.input, this.audio, dt, this.level);

    // Dynamic Scene-Wise Music Elevation & Modulation
    this.updateMusicDirector(dt);

    // Toggle character render pipeline on F2 (Dev Fallback -> Silhouette -> Rig -> Frame Sequence)
    if (this.input.justPressed('F2')) {
      characterRenderer.cycleRenderMode();
    }

    // 2. Reset grounded state & surface interactions before collision detection pass
    this.player.isGrounded = false;
    this.player.standingPlatform = null;
    this.player.surfaceVx = 0;
    this.player.currentSurfaceFriction = 1.0;

    // 3. Resolve Solid Platform Collisions (Static + Moving Platforms)
    const allPlatforms = this.level.getAllSolidPlatforms();
    allPlatforms.forEach(plat => {
      const res = Collision.resolveSolidPlatform(this.player, plat);
      if (res.hazard) {
        // Platform hazards deal HEAVY damage = 10 HP
        const wasHurt = this.player.hurt(10);
        if (wasHurt) {
          this.gameState.hp = this.player.hp;
          if (this.camera) this.camera.shake(11, 0.2);
          if (this.audio && this.audio.playDamage) this.audio.playDamage();
          if (this.player.hp <= 0) {
            this.handlePlayerDeath();
          }
        }
      } else if (res.shroomBounce) {
        if (this.audio && this.audio.playBounce) {
          this.audio.playBounce();
        }
        this.level.spawnBurst(this.player.x + this.player.width / 2, this.player.y + this.player.height, 16, '#38bdf8');
        this.level.spawnSparkles(this.player.x + this.player.width / 2, this.player.y + this.player.height, 12);
        if (this.camera) this.camera.shake(5, 0.12);
      } else if (res.geyserLaunch) {
        if (this.audio && this.audio.playGeyser) {
          this.audio.playGeyser();
        }
        this.level.spawnBurst(this.player.x + this.player.width / 2, this.player.y + this.player.height, 18, '#fef08a');
        this.level.spawnSparkles(this.player.x + this.player.width / 2, this.player.y + this.player.height, 12);
        if (this.camera) this.camera.shake(6, 0.18);
      } else if (res.bounced) {
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

    // 4. Fall Death Check (Instant Lethal -> HP 0 -> Death Event)
    if (this.player.y > PHYSICS.DEATH_Y) {
      this.player.hp = 0;
      this.gameState.hp = 0;
      this.handlePlayerDeath();
      return;
    }

    // 5. Update Level
    this.level.update(this.player, this.gameState, this.audio, this.camera, dt);

    // 6. Check Goal / Batboy Rescue / Forest King Portal Victory Condition
    if (Collision.intersects(this.player.getBounds(), this.level.goal)) {
      if (this.level.batboy) {
        this.level.batboy.isRescued = true;
      }
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

  /**
   * Scene-wise music director: evaluates player position across the 10,800px continuum,
   * combat encounters, secret discoveries, and monumental landmarks to dynamically
   * modulate procedural Web Audio harmony, tempo, and mix layers.
   */
  updateMusicDirector(dt) {
    if (!this.audio) return;

    const isWorld6 = this.gameState && this.gameState.world === 6;
    const isWorld5 = this.gameState && this.gameState.world === 5;
    const isWorld4 = this.gameState && this.gameState.world === 4;
    const isWorld3 = this.gameState && this.gameState.world === 3;
    const isWorld2 = this.gameState && this.gameState.world === 2;

    // 1. Determine Scene Progression Across 10,800px Continuum
    let scene = isWorld6 ? 'clockwork' : (isWorld5 ? 'desert_dunes' : (isWorld4 ? 'volcano' : (isWorld3 ? 'castle' : (isWorld2 ? 'forest' : 'glade'))));
    if (isWorld6) {
      if (this.player.x >= 8200) {
        scene = 'time_tinker';        // Section 4: Grand Chronometer Citadel & Time Tinker (148 BPM)
      } else if (this.player.x >= 5400) {
        scene = 'steam_conduit';      // Section 3: High-Pressure Steam Conduits (136 BPM)
      } else if (this.player.x >= 2600) {
        scene = 'escapement_bridge';  // Section 2: Celestial Astrolabe & Escapement Bridge (126 BPM)
      } else {
        scene = 'clockwork';          // Section 1: Great Gear Ascent (118 BPM)
      }
    } else if (isWorld5) {
      if (this.player.x >= 8200) {
        scene = 'sandwich_king';  // Section 4: Royal Deli Plateau & Sandwich King Climax (146 BPM)
      } else if (this.player.x >= 5400) {
        scene = 'mustard_rapids'; // Section 3: Condiment Rapids & Cracker Colonnade (134 BPM)
      } else if (this.player.x >= 2600) {
        scene = 'cheese_canyon';  // Section 2: Swiss Cheese Canyons & Pickle Groves (124 BPM)
      } else {
        scene = 'desert_dunes';   // Section 1: Bread Dunes & Mustard Springs (116 BPM)
      }
    } else if (isWorld4) {
      if (this.player.x >= 8200) {
        scene = 'honey_dragon';   // Section 4: The Heart of the Volcano & Ignis the Wyrm (148 BPM)
      } else if (this.player.x >= 5400) {
        scene = 'boiling_crater'; // Section 3: Geyser Fields & Boiling Crater (136 BPM)
      } else if (this.player.x >= 2600) {
        scene = 'lava_rapids';    // Section 2: Obsidian Caverns & Lava Rapids (128 BPM)
      } else {
        scene = 'volcano';        // Section 1: Ash Caldera & Molten Falls (118 BPM)
      }
    } else if (isWorld3) {
      if (this.player.x >= 8200) {
        scene = 'slam_a_lot';   // Section 4: Sir Slam-A-Lot Arena & Breach (146 BPM)
      } else if (this.player.x >= 5400) {
        scene = 'library';       // Section 3: Arcane Archives & Battlements (132 BPM)
      } else if (this.player.x >= 2600) {
        scene = 'portrait_hall'; // Section 2: Hall of Whispering Portraits & Secret Vaults (124 BPM)
      } else {
        scene = 'castle';        // Section 1: Grand Colonnade & Clocktower (116 BPM)
      }
    } else if (isWorld2) {
      if (this.player.x >= 8200) {
        scene = 'forest_king'; // Section 4: The Ancient Heart & The Forest King (142 BPM)
      } else if (this.player.x >= 5400) {
        scene = 'briar';       // Section 3: The Briar Thicket & Shadow Canopy (130 BPM)
      } else if (this.player.x >= 2500) {
        scene = 'fungal';      // Section 2: The Bioluminescent Fungal Hollows (122 BPM)
      } else {
        scene = 'forest';      // Section 1: The Whispering Perimeter & Spore Glades (114 BPM)
      }
    } else {
      if (this.player.x >= 10250) {
        scene = 'climax';   // Sovereign Throne Dais & Batboy Rescue Climax (144 BPM)
      } else if (this.player.x >= 8000) {
        scene = 'spire';     // Section 4: The Sovereign Hive Spire (136 BPM)
      } else if (this.player.x >= 5200) {
        scene = 'fortress';  // Section 3: The Sunstone Fortress & Aqueduct (128 BPM)
      } else if (this.player.x >= 2400) {
        scene = 'canopy';    // Section 2: Whispering Canopy & Amber Chasm (120 BPM)
      } else {
        scene = 'glade';     // Section 1: The Sunstone Glade (112 BPM)
      }
    }

    // 2. Determine Special Mode: Secret Sanctum vs Cinematic Landmark vs Climax
    let specialMode = 'normal';
    if (this.level && this.level.secretBannerTimer > 0) {
      specialMode = 'secret'; // Delicate celestial music box, drums muted
    } else if (this.level && this.level.shrineBannerTimer > 0) {
      specialMode = 'cinematic'; // Majestic brass/string swell & sparkling arpeggios
    } else if (scene === 'climax' || scene === 'forest_king' || scene === 'slam_a_lot' || scene === 'honey_dragon' || scene === 'sandwich_king' || scene === 'time_tinker') {
      specialMode = 'climax'; // Maximum heroic rescue urgency
    }

    // 3. Determine Dynamic Intensity (0.0 to 1.0)
    let intensity = 0.2; // Baseline peaceful exploration
    if (scene === 'climax' || scene === 'forest_king' || scene === 'slam_a_lot' || scene === 'honey_dragon' || scene === 'sandwich_king' || scene === 'time_tinker') {
      intensity = 1.0;
    } else if (this.level && this.level.encounterCoordinator && this.level.encounterCoordinator.activeSynergy) {
      intensity = 0.85; // High coordinated encounter synergy
    } else if (this.level && this.level.enemies) {
      let maxThreat = 0;
      const px = this.player.x;
      for (let i = 0; i < this.level.enemies.length; i++) {
        const e = this.level.enemies[i];
        if (e.isDead) continue;
        const dist = Math.abs(e.x - px);
        if (dist < 460) {
          let threat = 0.45;
          if (e.fsm) {
            const st = e.fsm.currentState;
            if (st === 'ATTACK') threat = 0.80;
            else if (st === 'AWARE' || st === 'INVESTIGATE') threat = 0.65;
          }
          if (threat > maxThreat) maxThreat = threat;
        }
      }
      intensity = Math.max(0.2, maxThreat);
    }

    if (this.audio.updateDynamicBGM) {
      this.audio.updateDynamicBGM(scene, intensity, specialMode);
    } else if (this.audio.setBiome) {
      this.audio.setBiome(scene);
    }
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

    if (this.state === GAME_STATES.DEFEATED) {
      // Draw world in background, then blit pixel art, then draw HD Defeated overlay
      this.renderer.drawWorld(this.camera, this.level, this.player, this.gameState);
      this.renderer.endFrame();
      this.renderer.drawGameOverOverlay(this.gameOverScreen, this.gameState, 'DEFEATED');
      return;
    }

    if (this.state === GAME_STATES.GAME_OVER) {
      // Draw world in background, then blit pixel art, then draw HD Game Over overlay
      this.renderer.drawWorld(this.camera, this.level, this.player, this.gameState);
      this.renderer.endFrame();
      this.renderer.drawGameOverOverlay(this.gameOverScreen, this.gameState, 'GAME_OVER');
      return;
    }

    if (this.state === GAME_STATES.LEVEL_CLEAR) {
      // Draw world in background, then blit pixel art, then draw HD Level Clear overlay
      this.renderer.drawWorld(this.camera, this.level, this.player, this.gameState);
      this.renderer.endFrame();
      this.renderer.drawGameOverOverlay(this.gameOverScreen, this.gameState, 'VICTORY', { totalShards: this.level.shards.length });
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

    // Blit pixel art world to display canvas
    this.renderer.endFrame();

    // Find any active boss in the current level for the boss health bar HUD
    const activeBoss = this.level?.honeyBumble?.isArenaActive ? this.level.honeyBumble
      : (this.level?.forestKing && !this.level.forestKing.isPurified ? this.level.forestKing
      : (this.level?.sirSlamALot && !this.level.sirSlamALot.isDead ? this.level.sirSlamALot
      : (this.level?.honeyDragon && !this.level.honeyDragon.isDead ? this.level.honeyDragon
      : (this.level?.sandwichKing && !this.level.sandwichKing.isDead ? this.level.sandwichKing
      : (this.level?.timeTinker && !this.level.timeTinker.isDead ? this.level.timeTinker : null)))));

    // Draw HUD at native display resolution (sharp text, icons, and boss bar)
    this.renderer.drawHUDOverlay(this.hud, this.gameState, this.player, activeBoss);

    // Draw ContinueDialog modal on top of everything when active
    if (this.continueDialog && this.continueDialog.active) {
      // Draw at display resolution using the HUD canvas context
      const ctx = this.renderer.ctx;
      ctx.save();
      // scale to HUD coordinate space
      const dW = this.renderer.canvas.width;
      const dH = this.renderer.canvas.height;
      ctx.scale(dW / CANVAS_WIDTH, dH / CANVAS_HEIGHT);
      this.continueDialog.draw(ctx);
      ctx.restore();
    }
  }
}
