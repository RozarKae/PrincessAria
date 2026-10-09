/**
 * CinematicScene.js
 * 
 * Represents a cohesive narrative beat/scene within a CinematicSequence.
 * Manages:
 * - Deterministic duration and playback progress
 * - Timeline-based event callbacks
 * - Depth-ordered layers of sprites and effects
 * - Camera motion tracks
 * - Audio cue triggers
 * - Scene transition fades
 */
export class CinematicScene {
  constructor(options = {}) {
    this.name = options.name || 'scene';
    this.duration = options.duration || 2.0;
    this.elapsed = 0;
    this.isFinished = false;

    // Depth layers
    this.layers = [];

    // Timeline events: [{ time: 1.2, callback: () => {}, fired: false }]
    this.events = [];

    // Audio cues: [{ time: 0.5, cue: 'portal-open', played: false }]
    this.audioCues = [];

    // Camera waypoint / motion handler
    this.cameraMotion = options.cameraMotion || null;

    // Lifecycle hooks
    this.onStart = options.onStart || null;
    this.onUpdate = options.onUpdate || null;
    this.onComplete = options.onComplete || null;

    // Screen Fade
    this.fadeAlpha = options.fadeAlpha !== undefined ? options.fadeAlpha : 0;
    this.fadeColor = options.fadeColor || '#000000';
  }

  addLayer(layer) {
    if (!this.layers.includes(layer)) {
      this.layers.push(layer);
      this.layers.sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
    }
    return layer;
  }

  getLayer(name) {
    return this.layers.find(l => l.name === name) || null;
  }

  addEvent(time, callback) {
    this.events.push({ time, callback, fired: false });
    this.events.sort((a, b) => a.time - b.time);
  }

  addAudioCue(time, cue) {
    this.audioCues.push({ time, cue, played: false });
    this.audioCues.sort((a, b) => a.time - b.time);
  }

  start(game) {
    this.elapsed = 0;
    this.isFinished = false;

    // Reset events
    for (let i = 0; i < this.events.length; i++) {
      this.events[i].fired = false;
    }
    // Reset audio cues
    for (let i = 0; i < this.audioCues.length; i++) {
      this.audioCues[i].played = false;
    }

    if (this.onStart) {
      this.onStart(game, this);
    }
  }

  update(dt, game) {
    if (this.isFinished) return;

    this.elapsed += dt;

    // 1. Process Timeline Events
    for (let i = 0; i < this.events.length; i++) {
      const evt = this.events[i];
      if (!evt.fired && this.elapsed >= evt.time) {
        evt.fired = true;
        evt.callback(game, this);
      }
    }

    // 2. Process Audio Cues
    for (let i = 0; i < this.audioCues.length; i++) {
      const cue = this.audioCues[i];
      if (!cue.played && this.elapsed >= cue.time) {
        cue.played = true;
        this.triggerAudioCue(game, cue.cue);
      }
    }

    // 3. Update Camera Motion Track
    if (this.cameraMotion && game.camera) {
      this.cameraMotion(game.camera, this, dt);
    }

    // 4. Update Layers
    for (let i = 0; i < this.layers.length; i++) {
      this.layers[i].update(dt);
    }

    // 5. Scene-level Custom Update
    if (this.onUpdate) {
      this.onUpdate(dt, game, this);
    }

    // Check completion
    if (this.elapsed >= this.duration) {
      this.isFinished = true;
      if (this.onComplete) {
        this.onComplete(game, this);
      }
    }
  }

  triggerAudioCue(game, cue) {
    if (!game.audio) return;
    if (cue === 'portal-open') {
      if (game.audio.playCheckpoint) game.audio.playCheckpoint();
      else if (game.audio.playSecret) game.audio.playSecret();
    } else if (cue === 'arrival' || cue === 'flutter') {
      if (game.audio.playDoubleJump) game.audio.playDoubleJump();
      else if (game.audio.playJump) game.audio.playJump();
    } else if (cue === 'land') {
      if (game.audio.playLand) game.audio.playLand();
    } else if (cue === 'victory') {
      if (game.audio.playLevelComplete) game.audio.playLevelComplete();
    } else if (cue === 'shatter') {
      if (game.audio.playSecret) game.audio.playSecret();
    } else if (cue === 'portal-close') {
      if (game.audio.playDash) game.audio.playDash();
    }
  }

  draw(ctx, camX = 0, camY = 0) {
    // Draw all layers in depth order
    for (let i = 0; i < this.layers.length; i++) {
      this.layers[i].draw(ctx, camX, camY);
    }

    // Draw fade overlay if active
    if (this.fadeAlpha > 0) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, this.fadeAlpha));
      ctx.fillStyle = this.fadeColor;
      ctx.fillRect(0, 0, ctx.canvas.width || 320, ctx.canvas.height || 240);
      ctx.restore();
    }
  }
}
