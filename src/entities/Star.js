import { PickupBase } from './PickupBase.js';

export class Star extends PickupBase {
  constructor(x, y) {
    super(x, y, 30, 30);
  }

  onCollect(player, level, gameState, audio) {
    if (this.collected) return;
    super.onCollect(player, level, gameState, audio);
    // Grant extra life
    if (gameState && typeof gameState.lives === 'number') {
      gameState.lives = Math.min(gameState.maxLives || 9, gameState.lives + 1);
    } else if (player && typeof player.addLife === 'function') {
      player.addLife(1);
    }
  }
}
