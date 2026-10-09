/**
 * Manages player progression, lives, coins, scores, and save state.
 */
export class GameState {
  constructor() {
    this.defaultLives = 5;
    this.maxLives = 5;
    this.lives = this.defaultLives;
    this.maxHp = 100;
    this.hp = 100;
    this.coins = 0;
    this.score = 0;
    this.world = 1;
    this.level = 1;
    this.stars = 5;
    this.highScore = this.loadHighScore();
    // Inventory counts
    this.treasureBoxes = 0;
    // UI state helpers
    this.awaitingContinue = false;
  }

  resetForNewGame(world = 1, level = 1) {
    this.lives = this.defaultLives;
    this.hp = this.maxHp;
    this.coins = 0;
    this.score = 0;
    this.world = world;
    this.level = level;
    this.stars = 5;
    this.awaitingContinue = false;
  }

  addCoins(amount = 1) {
    this.coins += amount;
    // Coins grant score/shards without adding unrequested extra lives
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

  addTreasure(amount = 1) {
    this.treasureBoxes = (this.treasureBoxes || 0) + amount;
    return this.treasureBoxes;
  }
}
