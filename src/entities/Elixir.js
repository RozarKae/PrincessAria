import { PickupBase } from './PickupBase.js';

export class Elixir extends PickupBase {
  // Grants temporary invincibility or flight depending on subtype
  constructor(x, y, subtype = 'invincibility', duration = 6) {
    super(x, y, 28, 28);
    this.subtype = subtype;
    this.duration = duration;
  }

  onCollect(player, level, gameState, audio) {
    if (this.collected) return;
    super.onCollect(player, level, gameState, audio);
    if (!player) return;
    if (this.subtype === 'invincibility') {
      player.invincibilityTimer = Math.max(player.invincibilityTimer || 0, this.duration);
    } else if (this.subtype === 'flight') {
      player.flightTimer = Math.max(player.flightTimer || 0, this.duration);
      player.canFly = true;
    }
  }
}
