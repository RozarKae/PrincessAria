/**
 * CinematicSequence.js
 * 
 * Master sequence coordinator in Project Aria cinematic architecture.
 * Manages:
 * - Ordered execution of CinematicScene instances
 * - Deterministic timing and progression
 * - Clean interruption and robust skip handling (JUMP / SHOOT / START)
 * - Safe lifecycle transitions and cleanup
 */
export class CinematicSequence {
  constructor(name = 'sequence') {
    this.name = name;
    this.scenes = [];
    this.currentSceneIndex = 0;
    this.isRunning = false;
    this.isFinished = false;
    this.isSkipped = false;
    this.hasCompleted = false;

    // Callbacks
    this.onSequenceComplete = null;
    this.onSequenceSkip = null;
  }

  addScene(scene) {
    this.scenes.push(scene);
    return scene;
  }

  get currentScene() {
    if (this.currentSceneIndex >= 0 && this.currentSceneIndex < this.scenes.length) {
      return this.scenes[this.currentSceneIndex];
    }
    return null;
  }

  start(game, onComplete = null) {
    this.currentSceneIndex = 0;
    this.isRunning = true;
    this.isFinished = false;
    this.isSkipped = false;
    this.hasCompleted = false;
    if (onComplete) {
      this.onSequenceComplete = onComplete;
    }

    if (this.scenes.length > 0) {
      this.scenes[0].start(game);
    } else {
      this.complete(game);
    }
  }

  skip(game) {
    if (this.hasCompleted || this.isFinished) return;
    this.hasCompleted = true;
    this.isSkipped = true;
    this.isRunning = false;
    this.isFinished = true;

    if (this.onSequenceSkip) {
      this.onSequenceSkip(game);
    } else {
      this.cleanup(game);
    }
  }

  complete(game) {
    if (this.hasCompleted) return;
    this.hasCompleted = true;
    this.isRunning = false;
    this.isFinished = true;

    this.cleanup(game);

    if (this.onSequenceComplete) {
      this.onSequenceComplete(game);
    }
  }

  update(dt, input, game) {
    if (!this.isRunning || this.isFinished) return;

    // Check user skip input
    if (input && (input.justPressed('JUMP') || input.justPressed('SHOOT') || input.justPressed('START'))) {
      this.skip(game);
      return;
    }

    const scene = this.currentScene;
    if (!scene) {
      this.complete(game);
      return;
    }

    scene.update(dt, game);

    if (scene.isFinished) {
      this.currentSceneIndex++;
      if (this.currentSceneIndex < this.scenes.length) {
        this.scenes[this.currentSceneIndex].start(game);
      } else {
        this.complete(game);
      }
    }
  }

  draw(ctx, camX = 0, camY = 0) {
    if (!this.isRunning && !this.isFinished) return;
    const scene = this.currentScene;
    if (scene) {
      scene.draw(ctx, camX, camY);
    }
  }

  cleanup(game) {
    // Override in specialized sequences or directors to restore state
  }
}
