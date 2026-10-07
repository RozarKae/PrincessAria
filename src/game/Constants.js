/**
 * Global game constants and configuration parameters.
 * Designed for native 16:9 Full HD (1920x1080) logical internal resolution.
 */
export const CANVAS_WIDTH = 1920;
export const CANVAS_HEIGHT = 1080;
export const ASPECT_RATIO = 16 / 9;

// Platformer Physics Tuning (pixels/sec and pixels/sec^2)
export const PHYSICS = {
  GRAVITY: 2500,             // Gravitational acceleration
  TERMINAL_VELOCITY: 1350,   // Maximum downward fall speed
  MOVE_ACCEL: 3200,          // Ground acceleration
  MOVE_DECEL: 3400,          // Ground friction / stopping deceleration
  AIR_ACCEL: 2000,           // Air maneuverability acceleration
  AIR_DECEL: 1200,           // Air drag
  MAX_RUN_SPEED: 520,        // Top horizontal running speed
  CROUCH_SPEED: 200,         // Slower crawl speed while crouching
  DASH_SPEED: 820,           // Fast aerodynamic dash impulse
  DASH_DURATION: 0.22,       // Duration of dash burst in seconds
  DASH_COOLDOWN: 0.5,        // Delay between dashes
  JUMP_VELOCITY: -1020,      // Launch impulse (negative = upward)
  DOUBLE_JUMP_VELOCITY: -920,// Mid-air celestial flutter impulse
  MAX_JUMPS: 2,              // Double jump capacity
  JUMP_CUT_MULTIPLIER: 0.5,  // Releasing jump key early cuts upward velocity (variable jump height)
  BOUNCE_VELOCITY: -760,     // Upward bounce when stomping an enemy
  COYOTE_TIME: 0.1,          // Grace window (seconds) to jump after stepping off a platform
  JUMP_BUFFER_TIME: 0.12,    // Grace window (seconds) to queue jump right before landing
  DEATH_Y: 1180,             // Y position considered falling below level
  RESPAWN_DELAY: 1.0,        // Seconds before respawning after death
  INVINCIBILITY_TIME: 1.5,   // Seconds of invulnerability after taking damage
};

// Game States
export const GAME_STATES = {
  TITLE: 'TITLE',
  PLAYING: 'PLAYING',
  DEFEATED: 'DEFEATED',
  GAME_OVER: 'GAME_OVER',
  LEVEL_CLEAR: 'LEVEL_CLEAR',
};

// --- KEYBOARD MAPPINGS (PC / Web Keyboard) ---
export const KEYBOARD_BINDINGS = {
  LEFT: ['KeyA', 'ArrowLeft'],
  RIGHT: ['KeyD', 'ArrowRight'],
  UP: ['KeyW', 'ArrowUp'],
  DOWN: ['KeyS', 'ArrowDown'],
  JUMP: ['Space', 'KeyW', 'ArrowUp'],
  CROUCH: ['KeyS', 'ArrowDown'],
  DASH: ['ShiftLeft', 'ShiftRight', 'KeyX', 'KeyK'],
  ATTACK: ['KeyZ', 'KeyJ', 'KeyF'],
  SHOOT: ['KeyC', 'KeyL', 'KeyE', 'KeyQ'],
  SHIELD: ['KeyV', 'KeyB'],
  START: ['Enter', 'Space'],
  RESTART: ['KeyR', 'Enter'],
  DEBUG: ['F3', 'KeyO', 'Backquote'],
  DEBUG_AI: ['F1', 'KeyB'],
  DEBUG_VISUAL: ['F2'],
  MUTE: ['KeyM'],
  WORLD_1: ['Digit1', 'Numpad1'],
  WORLD_2: ['Digit2', 'Numpad2'],
  WORLD_3: ['Digit3', 'Numpad3'],
  WORLD_4: ['Digit4', 'Numpad4'],
  WORLD_5: ['Digit5', 'Numpad5'],
  WORLD_6: ['Digit6', 'Numpad6'],
};

// Aliased for backward compatibility across existing calls
export const KEY_BINDINGS = KEYBOARD_BINDINGS;

// --- GAMEPAD MAPPINGS (Xbox / PlayStation / Nintendo Switch / USB Controllers) ---
// Button Indices according to standard W3C Gamepad specification:
// 0: Bottom face (A / Cross / B)
// 1: Right face (B / Circle / A)
// 2: Left face (X / Square / Y)
// 3: Top face (Y / Triangle / X)
// 4: Left Bumper / L1 / L
// 5: Right Bumper / R1 / R
// 6: Left Trigger / L2 / ZL (analog or digital)
// 7: Right Trigger / R2 / ZR (analog or digital)
// 8: Select / Share / Back / Minus
// 9: Start / Options / Menu / Plus
// 10: Left Stick Click (L3)
// 11: Right Stick Click (R3)
// 12: D-Pad Up, 13: D-Pad Down, 14: D-Pad Left, 15: D-Pad Right
export const GAMEPAD_BINDINGS = {
  JUMP: [0],                        // A / Cross / B
  ATTACK: [2],                      // X / Square / Y (Dedicated primary attack / slash)
  SHOOT: [3, 7],                    // Y / Triangle / X or Right Trigger (RT/R2)
  DASH: [5, 1],                     // Right Bumper (RB/R1) or B / Circle
  SHIELD: [4, 6],                   // Left Bumper (LB/L1) or Left Trigger (LT/L2) (Dedicated hold shield)
  LEFT: ['dpad_left', 'stick_left'],
  RIGHT: ['dpad_right', 'stick_right'],
  UP: ['dpad_up', 'stick_up'],
  DOWN: ['dpad_down', 'stick_down'],
  CROUCH: ['dpad_down', 'stick_down'],
  START: [9],                       // Start / Options / Menu / +
  RESTART: [8],                     // Select / Back / Share / -
  DEBUG: [10],                      // L3 click
  MUTE: [11],                       // R3 click
};
