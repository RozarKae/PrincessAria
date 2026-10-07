import { PickupBase } from './PickupBase.js';
import { Herb } from './Herb.js';
import { Elixir } from './Elixir.js';
import { Star } from './Star.js';

export class TreasureBox extends PickupBase {
  constructor(x, y) {
    super(x, y, 36, 30);
    this.opened = false;
  }

  onCollect(player, level, gameState, audio) {
    if (this.collected) return;
    this.collected = true;
    this.opened = true;
    level.spawnBurst(this.x + this.width / 2, this.y + this.height / 2, 18, '#fce7f3');
    if (audio && audio.playCollect) audio.playCollect();
    // Play a UI confirm + treasure open combo
    if (audio && audio.playMenuSelect) audio.playMenuSelect();
    if (audio && audio.playTreasureOpen) audio.playTreasureOpen();

    // Random loot table
    const roll = Math.random();
    if (roll < 0.45) {
      // Herb
      const herb = new Herb(this.x, this.y - 6);
      level.particles.push(herb);
      herb.onCollect(player, level, gameState, audio);
    } else if (roll < 0.75) {
      // Elixir (invincibility)
      const el = new Elixir(this.x, this.y - 6, 'invincibility', 6);
      level.particles.push(el);
      el.onCollect(player, level, gameState, audio);
    } else if (roll < 0.95) {
      // Star (extra life)
      const star = new Star(this.x, this.y - 6);
      level.particles.push(star);
      star.onCollect(player, level, gameState, audio);
    } else {
      // Super bomb: trigger immediate area clear
      if (level && typeof level.triggerSuperBomb === 'function') {
        level.triggerSuperBomb(this.x, this.y, player, audio);
      }
    }

    // Track that player opened a treasure box
    if (gameState && typeof gameState.addTreasure === 'function') {
      gameState.addTreasure(1);
    }
  }

  draw(ctx) {
    if (this.collected) return;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.fillStyle = '#8b5cf6';
    ctx.fillRect(0, 0, this.width, this.height);
    ctx.fillStyle = '#fde68a';
    ctx.fillRect(6, 6, this.width - 12, this.height - 12);
    ctx.restore();
  }
}
