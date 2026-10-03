import { KEY_BINDINGS } from '../game/Constants.js';
import { gamepadManager } from './GamepadManager.js';

/**
 * Universal Input Manager for Project Aria.
 * Unifies Keyboard and Gaming Controllers (Xbox, PlayStation, Nintendo, 8BitDo, USB pads).
 * Tracks key/button holding, single-frame presses, single-frame releases, and analog sticks.
 */
export class Input {
  constructor() {
    this.keys = new Set();
    this.pressed = new Set();
    this.released = new Set();

    // Universal Gamepad Subsystem reference
    this.gamepad = gamepadManager;

    // Prevent arrow keys and space from scrolling the browser window
    const preventKeys = new Set(['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);

    window.addEventListener('keydown', (e) => {
      this.gamepad.lastActiveDevice = 'keyboard';
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

  /**
   * Called at the start of each frame before fixedUpdate.
   * Polls connected gamepads and calculates current frame inputs.
   */
  update() {
    this.gamepad.update();
  }

  /**
   * Checks whether an action is sustained (held down) via keyboard or any controller.
   */
  isDown(action) {
    const codes = KEY_BINDINGS[action] || [action];
    const keyHit = codes.some(code => this.keys.has(code));
    if (keyHit) return true;
    return this.gamepad.isActionDown(action);
  }

  /**
   * Checks whether an action was triggered on this exact frame via keyboard or any controller.
   */
  justPressed(action) {
    const codes = KEY_BINDINGS[action] || [action];
    const keyHit = codes.some(code => this.pressed.has(code));
    if (keyHit) return true;
    return this.gamepad.justActionPressed(action);
  }

  /**
   * Checks whether an action was released on this exact frame via keyboard or any controller.
   */
  justReleased(action) {
    const codes = KEY_BINDINGS[action] || [action];
    const keyHit = codes.some(code => this.released.has(code));
    if (keyHit) return true;
    return this.gamepad.justActionReleased(action);
  }

  getLeftStickX() {
    return this.gamepad.getLeftStickX();
  }

  getLeftStickY() {
    return this.gamepad.getLeftStickY();
  }

  /* -------------------------------------------------------------------------- */
  /* HAPTIC RUMBLE FEEDBACK DELEGATES                                            */
  /* -------------------------------------------------------------------------- */

  rumbleJump() {
    this.gamepad.rumbleJump();
  }

  rumbleDoubleJump() {
    this.gamepad.rumbleDoubleJump();
  }

  rumbleAttack() {
    this.gamepad.rumbleAttack();
  }

  rumbleShoot() {
    this.gamepad.rumbleShoot();
  }

  rumbleDash() {
    this.gamepad.rumbleDash();
  }

  rumbleStomp() {
    this.gamepad.rumbleStomp();
  }

  rumbleDamage() {
    this.gamepad.rumbleDamage();
  }

  rumbleBossDamage() {
    this.gamepad.rumbleBossDamage();
  }

  rumbleLand() {
    this.gamepad.rumbleLand();
  }

  endFrame() {
    this.pressed.clear();
    this.released.clear();
  }
}
