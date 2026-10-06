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
  GAME_OVER: 'GAME_OVER',
  LEVEL_CLEAR: 'LEVEL_CLEAR',
};

// Keyboard mappings
export const KEY_BINDINGS = {
  LEFT: ['KeyA', 'ArrowLeft'],
  RIGHT: ['KeyD', 'ArrowRight'],
  UP: ['KeyW', 'ArrowUp'],
  DOWN: ['KeyS', 'ArrowDown'],
  JUMP: ['Space', 'KeyW', 'ArrowUp'],
  CROUCH: ['KeyS', 'ArrowDown'],
  DASH: ['ShiftLeft', 'ShiftRight', 'KeyX', 'KeyK'],
  ATTACK: ['KeyZ', 'KeyJ', 'KeyF'],
  SHOOT: ['KeyC', 'KeyL', 'KeyE', 'KeyQ'],
  START: ['Enter', 'Space'],
  RESTART: ['KeyR', 'Enter'],
  DEBUG: ['F3', 'KeyO', 'Backquote'],
  DEBUG_AI: ['F1', 'KeyB'],
  DEBUG_VISUAL: ['F2', 'KeyV'],
  MUTE: ['KeyM'],
  WORLD_1: ['Digit1', 'Numpad1'],
  WORLD_2: ['Digit2', 'Numpad2'],
  WORLD_3: ['Digit3', 'Numpad3'],
  WORLD_4: ['Digit4', 'Numpad4'],
  WORLD_5: ['Digit5', 'Numpad5'],
};
