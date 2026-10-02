import { AnimationController, ANIM_STATES } from '../animation/AnimationController.js';

export class NPC {
  constructor(x, y, width, height, config = {}) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.vx = 0;
    this.vy = 0;
    this.facing = config.facing || 1;
    this.isGrounded = false;
    this.isDead = false;
    this.name = config.name || 'NPC';

    this.anim = new AnimationController(config.animConfig);
    this.anim.facing = this.facing;

    this.health = config.health || 1;
    this.maxHealth = this.health;
    this.patrolLeft = config.patrolLeft !== undefined ? config.patrolLeft : x - 160;
    this.patrolRight = config.patrolRight !== undefined ? config.patrolRight : x + 160;
    this.speed = config.speed || 130;
    this.alertRadius = config.alertRadius || 260;
    this.isAlerted = false;
  }

  getBounds() {
    return {
      x: this.x + 4,
      y: this.y + 4,
      width: this.width - 8,
      height: this.height - 8,
    };
  }

  takeDamage(amount = 1) {
    this.health -= amount;
    this.anim.triggerHitReaction();
    if (this.health <= 0) {
      this.isDead = true;
      this.anim.setState(ANIM_STATES.DEATH);
    }
  }

  triggerAlert() {
    if (!this.isAlerted) {
      this.isAlerted = true;
      this.anim.triggerReaction('ALERT');
    }
  }

  update(dt, level, player) {
    this.anim.update(dt);
  }

  draw(ctx) {
    // Override in subclass
  }
}
