import { PHYSICS } from '../game/Constants.js';

/**
 * Pure physics calculations for smooth 2D platformer movement.
 * Implements ground friction, air resistance, acceleration, and gravity.
 */
export class Physics {
  /**
   * Updates horizontal velocity based on input direction and surface state.
   * Supports dynamic surface friction, air control, and world movement modifiers.
   */
  static applyHorizontalMovement(vx, moveDir, isGrounded, maxSpeed, dt, frictionMultiplier = 1.0, accelMultiplier = 1.0) {
    const baseAccel = isGrounded ? PHYSICS.MOVE_ACCEL : PHYSICS.AIR_ACCEL;
    const baseDecel = isGrounded ? PHYSICS.MOVE_DECEL : PHYSICS.AIR_DECEL;
    const accel = baseAccel * accelMultiplier;
    const decel = baseDecel * frictionMultiplier;

    if (moveDir !== 0) {
      const targetVx = moveDir * maxSpeed;
      if (Math.sign(vx) !== 0 && Math.sign(vx) !== moveDir) {
        // Snappy turn-around when changing direction
        vx += moveDir * (accel + decel) * dt;
      } else {
        vx += moveDir * accel * dt;
        if (Math.abs(vx) > maxSpeed) {
          vx = targetVx;
        }
      }
    } else {
      // Natural deceleration / friction
      if (vx > 0) {
        vx = Math.max(0, vx - decel * dt);
      } else if (vx < 0) {
        vx = Math.min(0, vx + decel * dt);
      }
    }

    return vx;
  }

  /**
   * Applies gravity up to terminal velocity with optional world overrides.
   */
  static applyGravity(vy, dt, gravity = PHYSICS.GRAVITY, terminalVelocity = PHYSICS.TERMINAL_VELOCITY) {
    vy += gravity * dt;
    if (vy > terminalVelocity) {
      vy = terminalVelocity;
    }
    return vy;
  }
}
