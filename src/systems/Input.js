import { KEYBOARD_BINDINGS, GAMEPAD_BINDINGS, KEY_BINDINGS } from '../game/Constants.js';
import { gamepadManager } from './GamepadManager.js';

/**
 * Universal Input Manager for Project Aria.
 * Cleanly separates Keyboard and Gamepad mappings while providing unified or device-isolated queries.
 * Tracks key/button holding, single-frame presses, single-frame releases, and analog sticks.
 */
export class Input {
  constructor() {
    this.keys = new Set();
    this.pressed = new Set();
    this.released = new Set();

    // Dedicated Keyboard key mappings dictionary
    this.keyboardBindings = { ...KEYBOARD_BINDINGS };

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
   * Checks whether an action is sustained (held down).
   * @param {string} action - Semantic action name (e.g., 'JUMP', 'ATTACK')
   * @param {'keyboard'|'gamepad'|null} device - Optional device filter. If null, checks both.
   */
  isDown(action, device = null) {
    if (device === 'keyboard' || device === null) {
      const codes = this.keyboardBindings[action] || [action];
      if (codes.some(code => this.keys.has(code))) {
        return true;
      }
    }
    if (device === 'gamepad' || device === null) {
      return this.gamepad.isActionDown(action);
    }
    return false;
  }

  /**
   * Checks whether an action was triggered on this exact frame.
   * @param {string} action - Semantic action name (e.g., 'JUMP', 'ATTACK')
   * @param {'keyboard'|'gamepad'|null} device - Optional device filter. If null, checks both.
   */
  justPressed(action, device = null) {
    if (device === 'keyboard' || device === null) {
      const codes = this.keyboardBindings[action] || [action];
      if (codes.some(code => this.pressed.has(code))) {
        return true;
      }
    }
    if (device === 'gamepad' || device === null) {
      return this.gamepad.justActionPressed(action);
    }
    return false;
  }

  /**
   * Checks whether an action was released on this exact frame.
   * @param {string} action - Semantic action name (e.g., 'JUMP', 'ATTACK')
   * @param {'keyboard'|'gamepad'|null} device - Optional device filter. If null, checks both.
   */
  justReleased(action, device = null) {
    if (device === 'keyboard' || device === null) {
      const codes = this.keyboardBindings[action] || [action];
      if (codes.some(code => this.released.has(code))) {
        return true;
      }
    }
    if (device === 'gamepad' || device === null) {
      return this.gamepad.justActionReleased(action);
    }
    return false;
  }

  /* -------------------------------------------------------------------------- */
  /* KEYBOARD & GAMEPAD SEPARATE KEYMAPPING CONFIGURATION APIs                   */
  /* -------------------------------------------------------------------------- */

  getKeyboardBindings() {
    return { ...this.keyboardBindings };
  }

  setKeyboardBinding(action, keys) {
    if (Array.isArray(keys)) {
      this.keyboardBindings[action] = [...keys];
    }
  }

  setAllKeyboardBindings(mappings) {
    if (mappings && typeof mappings === 'object') {
      this.keyboardBindings = { ...mappings };
    }
  }

  getGamepadBindings() {
    return this.gamepad.getGamepadBindings();
  }

  setGamepadBinding(action, buttons) {
    this.gamepad.setGamepadBinding(action, buttons);
  }

  setAllGamepadBindings(mappings) {
    this.gamepad.setAllGamepadBindings(mappings);
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
