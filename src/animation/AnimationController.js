import { AnimationClip } from './AnimationClip.js';

/**
 * Standardized Animation States
 */
export const ANIM_STATES = {
  IDLE: 'IDLE',
  WALK: 'WALK',
  RUN: 'RUN',
  JUMP: 'JUMP',
  JUMP_START: 'JUMP_START',
  JUMP_RISE: 'JUMP_RISE',
  FALL: 'FALL',
  LAND: 'LAND',
  CROUCH: 'CROUCH',
  DASH: 'DASH',
  HURT: 'HURT',
  DEATH: 'DEATH',
  VICTORY: 'VICTORY',
  ATTACK: 'ATTACK',
  REACTION: 'REACTION',
  ENVIRONMENTAL: 'ENVIRONMENTAL',
};

/**
 * High-Definition Reusable Character Animation Controller.
 * Supports:
 * - Frame sequence animation (individual PNG/SVG/WebP frames)
 * - Sprite sheets (source rect slicing)
 * - Future Spine/skeletal/procedural animation hooks
 * - Reusable across Player, NPCs, Bosses, Enemies
 * - Looping, one-shots, transitions, completion callbacks
 * - Direction flipping & animation speed control
 * - State hysteresis to prevent rapid flickering
 */
export class AnimationController {
  constructor(config = {}) {
    this.clips = new Map();
    this.currentClip = null;
    this.currentAnimationName = ANIM_STATES.IDLE;
    this.previousAnimationName = null;

    this.currentFrameIndex = 0;
    this.frameTimer = 0;
    this.stateTime = 0;
    this.speed = config.speed || 1.0;
    this.facing = 1; // 1 = right, -1 = left

    // Squash & stretch physics interpolation
    this.scaleX = 1;
    this.scaleY = 1;

    this.isFinished = false;
    this.listeners = new Map(); // animationName -> Set of callback functions

    // Anti-flicker state lock duration
    this.lockTimer = 0;

    // Backward-compatibility aliases for existing NPCs/Enemies
    this.timer = 0;
    this.reactionType = null;
    this.reactionTimer = 0;
    this.environmentType = null;
    this.environmentTimer = 0;
  }

  get currentState() {
    return this.currentAnimationName;
  }

  set currentState(val) {
    this.currentAnimationName = val;
  }

  get previousState() {
    return this.previousAnimationName;
  }

  set previousState(val) {
    this.previousAnimationName = val;
  }

  /**
   * Register an AnimationClip with the controller.
   * @param {string} name
   * @param {AnimationClip | Object} clipOrConfig
   */
  addAnimation(name, clipOrConfig) {
    let clip;
    if (clipOrConfig instanceof AnimationClip) {
      clip = clipOrConfig;
      clip.name = name;
    } else {
      clip = new AnimationClip({ name, ...clipOrConfig });
    }
    this.clips.set(name, clip);

    // If no clip is active or if replacing the currently active clip, update currentClip!
    if (!this.currentClip || this.currentAnimationName === name) {
      this.currentClip = clip;
    }
  }

  /**
   * Register a completion callback for an animation.
   * @param {string} animationName
   * @param {Function} callback
   */
  onComplete(animationName, callback) {
    if (!this.listeners.has(animationName)) {
      this.listeners.set(animationName, new Set());
    }
    this.listeners.get(animationName).add(callback);
  }

  /**
   * Remove a completion callback.
   * @param {string} animationName
   * @param {Function} callback
   */
  offComplete(animationName, callback) {
    if (this.listeners.has(animationName)) {
      this.listeners.get(animationName).delete(callback);
    }
  }

  /**
   * Set playback speed multiplier.
   * @param {number} speed
   */
  setSpeed(speed) {
    this.speed = Math.max(0, speed);
  }

  /**
   * Set facing direction (1 for right, -1 for left).
   * @param {number} direction
   */
  setFacing(direction) {
    if (direction !== 0) {
      this.facing = direction > 0 ? 1 : -1;
    }
  }

  /**
   * Play an animation.
   * @param {string} name State/Clip name to play
   * @param {boolean} force Force override even if locked or dead
   * @param {boolean} restartIfSame Whether to restart playback if already playing
   * @returns {boolean} Whether transition succeeded
   */
  play(name, force = false, restartIfSame = false) {
    if (this.currentAnimationName === name && !restartIfSame && !force) {
      return false;
    }

    // Lock condition: DEATH state cannot be transitioned out of unless forced (e.g. respawn)
    if (this.currentAnimationName === ANIM_STATES.DEATH && name !== ANIM_STATES.IDLE && !force) {
      return false;
    }

    // Lock condition: Active non-interruptible one-shot (e.g. HURT, LAND, JUMP_START)
    if (this.lockTimer > 0 && !force) {
      return false;
    }

    const clip = this.clips.get(name);
    this.previousAnimationName = this.currentAnimationName;
    this.currentAnimationName = name;
    this.currentClip = clip || null;

    this.currentFrameIndex = 0;
    this.frameTimer = 0;
    this.stateTime = 0;
    this.isFinished = false;

    if (clip && clip.minDuration > 0) {
      this.lockTimer = clip.minDuration;
    } else {
      this.lockTimer = 0;
    }

    return true;
  }

  /**
   * Backward-compatible alias for play()
   */
  setState(newState, force = false) {
    return this.play(newState, force);
  }

  triggerReaction(type, duration = 0.8) {
    this.reactionType = type;
    this.reactionTimer = duration;
    this.play(ANIM_STATES.REACTION, true);
  }

  triggerHitReaction(intensity = 1.0) {
    this.scaleX = 1.25 * intensity;
    this.scaleY = 0.75 / intensity;
    this.lockTimer = 0.3;
    this.play(ANIM_STATES.HURT, true);
  }

  setEnvironmentalReaction(type) {
    this.environmentType = type;
    if (type) {
      this.play(ANIM_STATES.ENVIRONMENTAL);
    } else if (this.currentAnimationName === ANIM_STATES.ENVIRONMENTAL) {
      this.play(ANIM_STATES.IDLE);
    }
  }

  /**
   * Update animation playback time and frames.
   * @param {number} dt Delta time in seconds
   */
  update(dt) {
    const effectiveDt = dt * this.speed;
    this.timer += effectiveDt;
    this.stateTime += effectiveDt;

    if (this.lockTimer > 0) {
      this.lockTimer = Math.max(0, this.lockTimer - dt);
    }

    // Squash & stretch recovery
    this.scaleX += (1 - this.scaleX) * 12 * dt;
    this.scaleY += (1 - this.scaleY) * 12 * dt;

    const clip = this.currentClip;
    if (!clip || clip.totalFrames === 0) {
      // Fallback for states without frame clips
      return;
    }

    const frameDuration = clip.frameDuration;
    this.frameTimer += effectiveDt;

    while (this.frameTimer >= frameDuration) {
      this.frameTimer -= frameDuration;

      if (this.currentFrameIndex < clip.totalFrames - 1) {
        this.currentFrameIndex++;
      } else {
        // Reached end of animation sequence
        if (clip.loop) {
          this.currentFrameIndex = 0;
        } else {
          this.isFinished = true;

          // Fire completion callbacks
          if (typeof clip.onComplete === 'function') {
            clip.onComplete(this.currentAnimationName);
          }
          if (this.listeners.has(this.currentAnimationName)) {
            const callbacks = this.listeners.get(this.currentAnimationName);
            for (const cb of callbacks) {
              cb(this.currentAnimationName);
            }
          }

          // Auto-transition if configured
          if (clip.nextAnimation) {
            this.play(clip.nextAnimation, true);
            break;
          }
        }
      }
    }

    if (this.reactionTimer > 0) {
      this.reactionTimer -= dt;
      if (this.reactionTimer <= 0) {
        this.reactionType = null;
      }
    }
  }

  /**
   * Progress of the current animation normalized from 0.0 to 1.0.
   */
  getProgress() {
    const clip = this.currentClip;
    if (!clip || clip.totalFrames === 0) return 0;
    const dur = clip.totalDuration;
    if (dur <= 0) return 0;
    return clip.loop ? (this.stateTime % dur) / dur : Math.min(1, this.stateTime / dur);
  }

  /**
   * Retrieve active frame descriptor for the decoupled renderer.
   */
  getCurrentFrame() {
    const clip = this.currentClip;
    const progress = this.getProgress();
    const frameData = clip ? clip.getFrame(this.currentFrameIndex, progress) : null;

    return {
      animationName: this.currentAnimationName,
      frameIndex: this.currentFrameIndex,
      totalFrames: clip ? clip.totalFrames : 0,
      frameData: frameData,
      type: clip ? clip.type : 'none',
      fps: clip ? clip.fps : 12,
      facing: this.facing,
      progress: progress,
      scaleX: this.scaleX,
      scaleY: this.scaleY,
      anchorX: clip ? clip.anchorX : 0.5,
      anchorY: clip ? clip.anchorY : 0.95,
      isFinished: this.isFinished,
    };
  }

  /**
   * Debug info helper for the on-screen animation inspector.
   */
  getDebugInfo() {
    const clip = this.currentClip;
    return {
      name: this.currentAnimationName,
      frame: (this.currentFrameIndex + 1) + ' / ' + (clip ? clip.totalFrames : 1),
      frameIndex: this.currentFrameIndex,
      totalFrames: clip ? clip.totalFrames : 1,
      fps: clip ? clip.fps * this.speed * clip.speedMultiplier : 12,
      progress: (this.getProgress() * 100).toFixed(0) + '%',
      loop: clip ? clip.loop : false,
      isFinished: this.isFinished,
      facing: this.facing > 0 ? 'RIGHT' : 'LEFT',
      speed: this.speed.toFixed(2),
    };
  }
}
