import { KEY_BINDINGS } from '../game/Constants.js';

/**
 * Robust keyboard input manager.
 * Tracks key holding, single-frame presses, and single-frame releases.
 */
export class Input {
  constructor() {
    this.keys = new Set();
    this.pressed = new Set();
    this.released = new Set();

    // Prevent arrow keys and space from scrolling the browser window
    const preventKeys = new Set(['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);

    window.addEventListener('keydown', (e) => {
      if (preventKeys.has(e.code)) {
        e.preventDefault();
      }
      if (!this.keys.has(e.code)) {
        this.pressed.add(e.code);
      }
      this.keys.add(e.code);
    });

    window.addEventListener('keyup', (e) => {
      if (preventKeys.has(e.code)) {
        e.preventDefault();
      }
      this.keys.delete(e.code);
      this.released.add(e.code);
    });

    window.addEventListener('blur', () => {
      this.keys.clear();
      this.pressed.clear();
      this.released.clear();
    });
  }

  isDown(action) {
    const codes = KEY_BINDINGS[action] || [action];
    return codes.some(code => this.keys.has(code));
  }

  justPressed(action) {
    const codes = KEY_BINDINGS[action] || [action];
    return codes.some(code => this.pressed.has(code));
  }

  justReleased(action) {
    const codes = KEY_BINDINGS[action] || [action];
    return codes.some(code => this.released.has(code));
  }

  endFrame() {
    this.pressed.clear();
    this.released.clear();
  }
}
