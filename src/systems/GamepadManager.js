/**
 * GamepadManager.js — Universal Gaming Controller Subsystem for Project Aria.
 * 
 * Supports:
 * - Xbox Controllers (Series X|S, One, 360, XInput)
 * - PlayStation Controllers (DualSense PS5, DualShock 4 PS4, DualShock 3 PS3)
 * - Nintendo Switch (Switch Pro Controller, Joy-Cons, Joy-Con Grip)
 * - 8BitDo & Retro USB Controllers (SN30, Pro 2, Arcade Fightsticks)
 * - Steam Deck & Handheld PC Controllers (ROG Ally, Legion Go)
 * - Generic DirectInput & USB Gamepads (automatic non-standard heuristic fallback)
 * 
 * Features:
 * - Standard W3C mapping & intelligent non-standard axis/button heuristics
 * - Zero-drift axial deadzone filtering (0.22 deadzone)
 * - Single-frame press, hold, and release tracking
 * - Dual-Rumble Haptic Feedback (vibration actuator support for all major actions)
 * - Hotplug detection with elegant on-screen toast notifications
 * - Adaptive button glyph detection (Xbox ABXY vs PS Cross/Square vs Nintendo B/A/Y/X)
 * - Up to 4 simultaneous gamepads with seamless multi-controller participation
 */

export class GamepadManager {
  constructor() {
    this.controllers = new Map();
    this.activeGamepadIndex = null;
    this.lastActiveDevice = 'keyboard'; // 'keyboard' | 'gamepad'
    this.deadzone = 0.22;
    this.triggerThreshold = 0.25;

    // Previous frame button states: Map<gamepadIndex, Set<buttonIndex>>
    this.prevButtons = new Map();
    this.currButtons = new Map();

    // Action mappings for standard controllers
    // Maps semantic action names to standard gamepad button indices or analog triggers
    this.STANDARD_ACTION_MAP = {
      JUMP: [0],                 // Bottom face button (Xbox A, PS Cross, Switch B)
      DASH: [5, 4, 1, 7],        // Right bumper (RB/R1), Left bumper (LB/L1), Right face (B/Circle), RT
      ATTACK: [2, 1],            // Left face button (Xbox X, PS Square, Switch Y), B/Circle
      SHOOT: [3, 7, 6],          // Top face button (Xbox Y, PS Triangle, Switch X), RT, LT
      SHIELD: [4, 5, 6],         // Map to bumpers / triggers as default hold shield (LB/RB/RT)
      LEFT: ['dpad_left', 'stick_left'],
      RIGHT: ['dpad_right', 'stick_right'],
      UP: ['dpad_up', 'stick_up'],
      DOWN: ['dpad_down', 'stick_down'],
      CROUCH: ['dpad_down', 'stick_down'],
      START: [9, 0],             // Start / Options / Menu / +, or A button
      RESTART: [8, 9],           // Select / Back / Share / -, or Start
      DEBUG: [10],               // Left stick click (L3)
      MUTE: [11],                // Right stick click (R3)
    };

    // Connection listeners
    this.onGamepadConnected = this.handleGamepadConnected.bind(this);
    this.onGamepadDisconnected = this.handleGamepadDisconnected.bind(this);

    if (typeof window !== 'undefined') {
      window.addEventListener('gamepadconnected', this.onGamepadConnected);
      window.addEventListener('gamepaddisconnected', this.onGamepadDisconnected);
    }

    // Toast notification container
    this.initToastDOM();

    // Check initially connected gamepads
    this.scanInitialGamepads();
  }

  scanInitialGamepads() {
    if (typeof navigator === 'undefined' || !navigator.getGamepads) return;
    try {
      const pads = navigator.getGamepads();
      for (let i = 0; i < pads.length; i++) {
        if (pads[i]) {
          this.registerGamepad(pads[i], false);
        }
      }
    } catch (e) {
      // Ignored if browser security restricts early polling
    }
  }

  initToastDOM() {
    if (typeof document === 'undefined') return;
    this.toastEl = document.createElement('div');
    this.toastEl.id = 'aria-controller-toast';
    this.toastEl.style.cssText = `
      position: absolute;
      top: 24px;
      right: 24px;
      z-index: 1000;
      pointer-events: none;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 20px;
      background: rgba(15, 23, 42, 0.94);
      border: 2px solid #fbbf24;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6), 0 0 16px rgba(251, 191, 36, 0.35);
      color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 15px;
      font-weight: 600;
      opacity: 0;
      transform: translateY(-20px) scale(0.96);
      transition: opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1), transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    `;
    const container = document.getElementById('game-container') || document.body;
    container.appendChild(this.toastEl);
    this.toastTimeout = null;
  }

  showToast(icon, title, subtitle) {
    if (!this.toastEl) return;
    this.toastEl.innerHTML = `
      <span style="font-size: 26px; line-height: 1;">${icon}</span>
      <div>
        <div style="color: #fef08a; font-weight: 800; font-size: 15px; letter-spacing: 0.5px;">${title}</div>
        <div style="color: #94a3b8; font-size: 13px; font-weight: 500; margin-top: 2px;">${subtitle}</div>
      </div>
    `;
    this.toastEl.style.opacity = '1';
    this.toastEl.style.transform = 'translateY(0) scale(1)';

    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      this.toastEl.style.opacity = '0';
      this.toastEl.style.transform = 'translateY(-20px) scale(0.96)';
    }, 4200);
  }

  handleGamepadConnected(e) {
    const pad = e.gamepad;
    this.registerGamepad(pad, true);
  }

  handleGamepadDisconnected(e) {
    const pad = e.gamepad;
    const info = this.controllers.get(pad.index);
    this.controllers.delete(pad.index);
    this.prevButtons.delete(pad.index);
    this.currButtons.delete(pad.index);

    const name = info ? info.name : 'Gaming Controller';
    this.showToast('🎮', `${name} Disconnected`, 'Switched to Keyboard controls ([A]/[D] Move, [SPACE] Jump)');
    console.log(`[Gamepad] Disconnected: index ${pad.index} (${pad.id})`);
  }

  registerGamepad(pad, showNotification = true) {
    const info = this.identifyController(pad);
    this.controllers.set(pad.index, info);
    this.activeGamepadIndex = pad.index;
    this.lastActiveDevice = 'gamepad';

    console.log(`[Gamepad] Connected: [${info.brand.toUpperCase()}] "${info.name}" (index ${pad.index}, mapping: "${pad.mapping}")`);

    if (showNotification) {
      const glyphGuide = this.getGlyphGuide(info.brand);
      this.showToast(
        info.icon,
        `${info.name} Connected!`,
        `${glyphGuide.jump} Jump | ${glyphGuide.attack} Attack | ${glyphGuide.dash} Dash | ${glyphGuide.shoot} Starbeam`
      );
      this.playVibration({ duration: 80, weakMagnitude: 0.4, strongMagnitude: 0.2 });
    }
  }

  identifyController(pad) {
    const id = (pad.id || '').toLowerCase();
    let brand = 'generic';
    let name = 'Universal Gamepad';
    let icon = '🎮';

    if (id.includes('xbox') || id.includes('xinput') || id.includes('045e')) {
      brand = 'xbox';
      name = 'Xbox Wireless Controller';
      icon = '🎮';
      if (id.includes('360')) name = 'Xbox 360 Controller';
      else if (id.includes('one')) name = 'Xbox One Controller';
      else if (id.includes('series')) name = 'Xbox Series X|S Controller';
    } else if (
      id.includes('dualsense') ||
      id.includes('dualshock') ||
      id.includes('sony') ||
      id.includes('054c') ||
      id.includes('playstation')
    ) {
      brand = 'playstation';
      name = 'PlayStation Controller';
      icon = '🎮';
      if (id.includes('dualsense') || id.includes('0ce6')) name = 'PS5 DualSense Controller';
      else if (id.includes('dualshock 4') || id.includes('05c4') || id.includes('09cc')) name = 'PS4 DualShock 4 Controller';
    } else if (
      id.includes('switch') ||
      id.includes('joy-con') ||
      id.includes('pro controller') ||
      id.includes('057e') ||
      id.includes('nintendo')
    ) {
      brand = 'nintendo';
      name = 'Nintendo Switch Pro Controller';
      icon = '🎮';
      if (id.includes('joy-con (l)')) name = 'Nintendo Joy-Con (L)';
      else if (id.includes('joy-con (r)')) name = 'Nintendo Joy-Con (R)';
      else if (id.includes('joy-con')) name = 'Nintendo Joy-Con Grip';
    } else if (id.includes('8bitdo') || id.includes('sn30') || id.includes('2dc8')) {
      brand = '8bitdo';
      name = '8BitDo Wireless Controller';
      icon = '🕹️';
    } else if (id.includes('steam deck') || id.includes('28de')) {
      brand = 'steamdeck';
      name = 'Steam Deck Controller';
      icon = '🎮';
    } else if (id.includes('arcade') || id.includes('fightstick')) {
      brand = 'arcade';
      name = 'Arcade Fightstick';
      icon = '🕹️';
    } else {
      // Heuristic from button and axis count
      if (pad.buttons && pad.buttons.length >= 10) {
        name = 'USB Gamepad Controller';
      } else {
        name = 'Retro Game Controller';
        icon = '🕹️';
      }
    }

    return {
      index: pad.index,
      id: pad.id,
      brand,
      name,
      icon,
      isStandard: pad.mapping === 'standard',
      buttonsCount: pad.buttons ? pad.buttons.length : 0,
      axesCount: pad.axes ? pad.axes.length : 0,
    };
  }

  getGlyphGuide(brand) {
    switch (brand) {
      case 'playstation':
        return { jump: '[✕]', attack: '[□]', dash: '[R1]/[◯]', shoot: '[△]/[R2]' };
      case 'nintendo':
        return { jump: '[B]', attack: '[Y]', dash: '[R]/[A]', shoot: '[X]/[ZR]' };
      default: // Xbox & Generic
        return { jump: '[A]', attack: '[X]', dash: '[RB]/[B]', shoot: '[Y]/[RT]' };
    }
  }

  getActiveBrand() {
    if (this.activeGamepadIndex !== null && this.controllers.has(this.activeGamepadIndex)) {
      return this.controllers.get(this.activeGamepadIndex).brand;
    }
    return 'xbox'; // Default standard glyphs
  }

  getButtonGlyph(action) {
    const brand = this.getActiveBrand();
    const guide = this.getGlyphGuide(brand);
    switch (action) {
      case 'JUMP': return guide.jump;
      case 'ATTACK': return guide.attack;
      case 'DASH': return guide.dash;
      case 'SHOOT': return guide.shoot;
      case 'START': return '[START]';
      case 'RESTART': return '[SELECT]';
      default: return '[🎮]';
    }
  }

  getConnectedGamepads() {
    if (typeof navigator === 'undefined' || !navigator.getGamepads) return [];
    try {
      const raw = navigator.getGamepads();
      const list = [];
      for (let i = 0; i < raw.length; i++) {
        if (raw[i] && raw[i].connected) list.push(raw[i]);
      }
      return list;
    } catch (e) {
      return [];
    }
  }

  /**
   * Called at the start of each frame before fixedUpdate / input queries.
   * Polls gamepads, extracts raw states, applies deadzones, and tracks button presses.
   */
  update() {
    const pads = this.getConnectedGamepads();
    if (pads.length === 0) return;

    // Shift previous frame button states
    for (const [index, set] of this.currButtons.entries()) {
      this.prevButtons.set(index, new Set(set));
    }
    this.currButtons.clear();

    for (const pad of pads) {
      // Ensure controller is registered
      if (!this.controllers.has(pad.index)) {
        this.registerGamepad(pad, true);
      }

      const activeSet = new Set();

      // 1. Process Digital Buttons
      if (pad.buttons) {
        for (let b = 0; b < pad.buttons.length; b++) {
          const btn = pad.buttons[b];
          if (btn && (btn.pressed || btn.value > this.triggerThreshold)) {
            activeSet.add(b);
          }
        }
      }

      // 2. Process Analog Sticks & D-Pad Virtual Buttons
      if (pad.axes && pad.axes.length >= 2) {
        const lx = this.applyDeadzone(pad.axes[0]);
        const ly = this.applyDeadzone(pad.axes[1]);

        if (lx < -0.28) activeSet.add('stick_left');
        if (lx > 0.28) activeSet.add('stick_right');
        if (ly < -0.38) activeSet.add('stick_up');
        if (ly > 0.38) activeSet.add('stick_down');

        // W3C Standard D-pad buttons (12: Up, 13: Down, 14: Left, 15: Right)
        if (activeSet.has(12)) activeSet.add('dpad_up');
        if (activeSet.has(13)) activeSet.add('dpad_down');
        if (activeSet.has(14)) activeSet.add('dpad_left');
        if (activeSet.has(15)) activeSet.add('dpad_right');

        // Fallback for non-standard gamepads where D-pad is on axes 4 & 5 or 6 & 7
        if (pad.mapping !== 'standard' && pad.axes.length >= 6) {
          const dpx = this.applyDeadzone(pad.axes[4]);
          const dpy = this.applyDeadzone(pad.axes[5]);
          if (dpx < -0.4) activeSet.add('dpad_left');
          if (dpx > 0.4) activeSet.add('dpad_right');
          if (dpy < -0.4) activeSet.add('dpad_up');
          if (dpy > 0.4) activeSet.add('dpad_down');
        }
      }

      // If any button or stick input detected, flag gamepad as active
      if (activeSet.size > 0) {
        this.activeGamepadIndex = pad.index;
        this.lastActiveDevice = 'gamepad';
      }

      this.currButtons.set(pad.index, activeSet);
    }
  }

  applyDeadzone(value) {
    if (Math.abs(value) < this.deadzone) return 0;
    // Remap [deadzone, 1.0] -> [0.0, 1.0] for ultra-smooth responsiveness
    const sign = Math.sign(value);
    return sign * ((Math.abs(value) - this.deadzone) / (1 - this.deadzone));
  }

  /**
   * Check if a semantic action is currently held down on any connected gamepad.
   */
  isActionDown(action) {
    const targets = this.STANDARD_ACTION_MAP[action];
    if (!targets) return false;

    for (const [_, curr] of this.currButtons.entries()) {
      for (const t of targets) {
        if (curr.has(t)) return true;
      }
    }
    return false;
  }

  /**
   * Check if a semantic action was pressed in the current frame on any connected gamepad.
   */
  justActionPressed(action) {
    const targets = this.STANDARD_ACTION_MAP[action];
    if (!targets) return false;

    for (const [padIndex, curr] of this.currButtons.entries()) {
      const prev = this.prevButtons.get(padIndex) || new Set();
      for (const t of targets) {
        if (curr.has(t) && !prev.has(t)) return true;
      }
    }
    return false;
  }

  /**
   * Check if a semantic action was released in the current frame on any connected gamepad.
   */
  justActionReleased(action) {
    const targets = this.STANDARD_ACTION_MAP[action];
    if (!targets) return false;

    for (const [padIndex, _] of this.currButtons.entries()) {
      const prev = this.prevButtons.get(padIndex) || new Set();
      const curr = this.currButtons.get(padIndex) || new Set();
      for (const t of targets) {
        if (prev.has(t) && !curr.has(t)) return true;
      }
    }
    return false;
  }

  /**
   * Returns analog left stick X value (-1.0 to 1.0) with deadzone applied.
   */
  getLeftStickX() {
    const pads = this.getConnectedGamepads();
    for (const pad of pads) {
      if (pad.axes && pad.axes.length >= 1) {
        const val = this.applyDeadzone(pad.axes[0]);
        if (Math.abs(val) > 0.01) return val;
      }
    }
    return 0;
  }

  /**
   * Returns analog left stick Y value (-1.0 to 1.0) with deadzone applied.
   */
  getLeftStickY() {
    const pads = this.getConnectedGamepads();
    for (const pad of pads) {
      if (pad.axes && pad.axes.length >= 2) {
        const val = this.applyDeadzone(pad.axes[1]);
        if (Math.abs(val) > 0.01) return val;
      }
    }
    return 0;
  }

  /* -------------------------------------------------------------------------- */
  /* HAPTIC FEEDBACK / DUAL-RUMBLE CONTROLLER VIBRATION                          */
  /* -------------------------------------------------------------------------- */

  /**
   * Triggers dual-rumble vibration on active or all connected controllers.
   * Gracefully falls back if browser or controller does not support actuators.
   */
  playVibration({ duration = 100, weakMagnitude = 0.5, strongMagnitude = 0.5 } = {}) {
    const pads = this.getConnectedGamepads();
    for (const pad of pads) {
      try {
        if (pad.vibrationActuator && typeof pad.vibrationActuator.playEffect === 'function') {
          pad.vibrationActuator.playEffect('dual-rumble', {
            startDelay: 0,
            duration: Math.max(10, Math.min(2000, duration)),
            weakMagnitude: Math.max(0, Math.min(1, weakMagnitude)),
            strongMagnitude: Math.max(0, Math.min(1, strongMagnitude)),
          }).catch(() => {});
        } else if (pad.hapticActuators && pad.hapticActuators.length > 0) {
          pad.hapticActuators[0].pulse(Math.max(0, Math.min(1, strongMagnitude)), duration).catch(() => {});
        }
      } catch (e) {
        // Haptics unsupported or disabled by OS/browser permissions
      }
    }
  }

  // Semantic Rumble Presets tuned specifically for Princess Aria:
  rumbleJump() {
    this.playVibration({ duration: 40, weakMagnitude: 0.25, strongMagnitude: 0.0 });
  }

  rumbleDoubleJump() {
    // Ethereal celestial starlight flutter pulse
    this.playVibration({ duration: 70, weakMagnitude: 0.45, strongMagnitude: 0.15 });
  }

  rumbleAttack() {
    // Crisp melee stardust slash impact
    this.playVibration({ duration: 70, weakMagnitude: 0.5, strongMagnitude: 0.35 });
  }

  rumbleShoot() {
    // Royal starbeam recoil pulse
    this.playVibration({ duration: 55, weakMagnitude: 0.55, strongMagnitude: 0.2 });
  }

  rumbleDash() {
    // Swift aerodynamic whoosh
    this.playVibration({ duration: 110, weakMagnitude: 0.4, strongMagnitude: 0.15 });
  }

  rumbleStomp() {
    // Bouncy enemy head stomp thud
    this.playVibration({ duration: 80, weakMagnitude: 0.3, strongMagnitude: 0.6 });
  }

  rumbleDamage() {
    // Heavy shudder upon taking damage
    this.playVibration({ duration: 220, weakMagnitude: 0.5, strongMagnitude: 0.85 });
  }

  rumbleBossDamage() {
    // Deep tectonic reverberation upon striking Forest King root core
    this.playVibration({ duration: 280, weakMagnitude: 0.7, strongMagnitude: 0.95 });
  }

  rumbleLand() {
    // Subtle ground contact thud after high descent
    this.playVibration({ duration: 35, weakMagnitude: 0.2, strongMagnitude: 0.25 });
  }
}

export const gamepadManager = new GamepadManager();
