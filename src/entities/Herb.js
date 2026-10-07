import { PickupBase } from './PickupBase.js';

export class Herb extends PickupBase {
  constructor(x, y) {
    super(x, y, 26, 26);
  }

  onCollect(player, level, gameState, audio) {
    if (this.collected) return;
    super.onCollect(player, level, gameState, audio);
    // Heal player 1 HP or give a life if at full health
    if (player && typeof player.heal === 'function') {
      player.heal(1);
    } else if (gameState) {
      // fallback: grant an extra life if heal not available
      gameState.lives = Math.min(gameState.maxLives || 9, (gameState.lives || 0) + 1);
    }
  }
}
