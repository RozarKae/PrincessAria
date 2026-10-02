/**
 * ENEMY STATE MACHINE
 * Robust, decoupled Finite State Machine for all Project Aria enemies.
 * Supports the 12 Canonical States:
 * - IDLE: Standing at rest, observing surroundings
 * - PATROL: Moving along designated patrol route
 * - AWARE: Senses something, reaction delay buffer, initial suspicion
 * - INVESTIGATE: Moving toward suspected location or noise
 * - CHASE: Direct pursuit of player with confirmed line of sight
 * - POSITION: Tactical spacing, circling, holding high/low ground, flanking
 * - ATTACK: Committed attack action (cannot pivot mid-thrust)
 * - EVADE: Dodging incoming attack, stomps, or dangerous hazards
 * - RECOVER: Vulnerable post-attack window / exhaustion / punishment frames
 * - SEARCH: Lost direct sight; searching last known position
 * - RETREAT: Disengaging when overwhelmed or needing regrouping
 * - RETURN: Search failed; returning back to home post or route
 * (Also supports core status states: HURT, DEAD, and legacy aliases ALERT/STUNNED/FLEE)
 */

export const ENEMY_STATES = {
  IDLE: 'IDLE',
  PATROL: 'PATROL',
  AWARE: 'AWARE',
  INVESTIGATE: 'INVESTIGATE',
  CHASE: 'CHASE',
  POSITION: 'POSITION',
  ATTACK: 'ATTACK',
  EVADE: 'EVADE',
  RECOVER: 'RECOVER',
  SEARCH: 'SEARCH',
  RETREAT: 'RETREAT',
  RETURN: 'RETURN',
  // Status states
  HURT: 'HURT',
  DEAD: 'DEAD',
  // Backwards-compatible aliases
  ALERT: 'AWARE',
  STUNNED: 'RECOVER',
  FLEE: 'RETREAT',
};

export class EnemyStateMachine {
  constructor(owner) {
    this.owner = owner;
    this.currentState = ENEMY_STATES.IDLE;
    this.previousState = null;
    this.stateTime = 0;
    this.stateHandlers = {};
  }

  /**
   * Register state callbacks.
   * @param {string} state - Name of state from ENEMY_STATES
   * @param {Object} handlers - { onEnter, update, onExit }
   */
  register(state, handlers = {}) {
    this.stateHandlers[state] = handlers;
  }

  /**
   * Change current state with enter/exit lifecycle hooks.
   * @param {string} newState - Target state
   * @param {boolean} force - Force state change even if already in state
   */
  setState(newState, force = false) {
    if (this.currentState === newState && !force) return;

    // Exit old state
    const oldHandler = this.stateHandlers[this.currentState];
    if (oldHandler && oldHandler.onExit) {
      oldHandler.onExit(this.owner, newState);
    }

    this.previousState = this.currentState;
    this.currentState = newState;
    this.stateTime = 0;

    // Enter new state
    const newHandler = this.stateHandlers[newState];
    if (newHandler && newHandler.onEnter) {
      newHandler.onEnter(this.owner, this.previousState);
    }
  }

  update(dt, level, player) {
    this.stateTime += dt;
    const handler = this.stateHandlers[this.currentState];
    if (handler && handler.update) {
      handler.update(this.owner, dt, level, player);
    }
  }

  is(state) {
    return this.currentState === state;
  }

  isAny(...states) {
    return states.includes(this.currentState);
  }
}
