/**
 * Manages player progression, lives, coins, scores, and save state.
 */
export class GameState {
  constructor() {
    this.defaultLives = 5;
    this.maxLives = 5;
    this.lives = this.defaultLives;
    this.coins = 0;
    this.score = 0;
    this.world = 1;
    this.level = 1;
    this.highScore = this.loadHighScore();
  }

  resetForNewGame(world = 1, level = 1) {
    this.lives = this.defaultLives;
    this.coins = 0;
    this.score = 0;
    this.world = world;
    this.level = level;
  }

  addCoins(amount = 1) {
    this.coins += amount;
    // Every 50 coins grants an extra life
    if (this.coins >= 50) {
      this.coins -= 50;
      this.lives += 1;
    }
  }

  gainLife(amount = 1) {
    this.lives = Math.min(this.maxLives || 9, (this.lives || 0) + amount);
    return this.lives;
  }

  addScore(pts) {
    this.score += pts;
    if (this.score > this.highScore) {
      this.highScore = this.score;
      this.saveHighScore();
    }
  }

  loseLife() {
    this.lives = Math.max(0, this.lives - 1);
    return this.lives;
  }

  loadHighScore() {
    try {
      return parseInt(localStorage.getItem('hd_platformer_highscore') || '0', 10);
    } catch {
      return 0;
    }
  }

  saveHighScore() {
    try {
      localStorage.setItem('hd_platformer_highscore', this.highScore.toString());
    } catch {}
  }
}
