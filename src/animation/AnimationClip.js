/**
 * AnimationClip
 * Encapsulates a single animation sequence.
 * Supports:
 * - Individual frame sequences (array of preloaded Images / SVG elements)
 * - Sprite sheets (with source rectangles)
 * - Procedural/vector fallbacks or future Spine hooks
 * - Custom frame rates (FPS), looping, one-shot chaining, and completion callbacks
 */
export class AnimationClip {
  constructor(options = {}) {
    this.name = options.name || 'UNNAMED';
    this.type = options.type || 'frame_sequence'; // 'frame_sequence' | 'spritesheet' | 'rig' | 'procedural'
    this.frames = options.frames || [];
    this.rig = options.rig || null; // CharacterRig instance when type === 'rig'
    this.fps = options.fps || 12;
    this.loop = options.loop !== undefined ? options.loop : true;
    this.nextAnimation = options.nextAnimation || null;
    this.onComplete = options.onComplete || null;
    this.speedMultiplier = options.speedMultiplier || 1.0;
    this.anchorX = options.anchorX !== undefined ? options.anchorX : 0.5; // normalized 0..1 (0.5 = center)
    this.anchorY = options.anchorY !== undefined ? options.anchorY : 0.95; // normalized 0..1 (0.95 = feet)
    this.allowInterrupt = options.allowInterrupt !== undefined ? options.allowInterrupt : true;
    this.minDuration = options.minDuration || 0; // minimum play duration in seconds before interrupt
  }

  get totalFrames() {
    if (this.type === 'rig') {
      return Math.max(1, Math.round(this.fps * 0.8));
    }
    return this.frames.length;
  }

  get frameDuration() {
    const effectiveFps = Math.max(1, this.fps * this.speedMultiplier);
    return 1 / effectiveFps;
  }

  get totalDuration() {
    return this.totalFrames * this.frameDuration;
  }

  getFrame(index, progress = 0) {
    if (this.type === 'rig' && this.rig) {
      this.rig.applyPose(this.name, progress);
      return {
        type: 'rig',
        rig: this.rig,
        name: this.name,
      };
    }
    if (this.frames.length === 0) return null;
    const clampedIndex = Math.max(0, Math.min(this.frames.length - 1, index));
    return this.frames[clampedIndex];
  }
}
