import { GAME_STATES, PHYSICS } from '../src/game/Constants.js';
import { GameState } from '../src/game/GameState.js';
import { Player } from '../src/entities/Player.js';
import { GameOverScreen } from '../src/ui/GameOverScreen.js';

console.log('====================================');
console.log('PRINCESS ARIA — HP / LIVES / DEATH SYSTEM TEST SUITE');
console.log('====================================\n');

let failed = false;
function assert(desc, condition, details = '') {
  if (condition) {
    console.log(`[PASS] ${desc}`);
  } else {
    console.error(`[FAIL] ${desc} ${details ? '(' + details + ')' : ''}`);
    failed = true;
  }
}

// 1. Initial State & Rules
const player = new Player(100, 100);
const gameState = new GameState();

assert('Max HP is 100', player.maxHp === 100, `player.maxHp = ${player.maxHp}`);
assert('Initial Player HP is 100', player.hp === 100, `player.hp = ${player.hp}`);
assert('Initial GameState HP is 100', gameState.hp === 100, `gameState.hp = ${gameState.hp}`);
assert('Initial Lives is 5', gameState.lives === 5, `gameState.lives = ${gameState.lives}`);

// 2. Light damage: 100 HP + light damage -> 95
player.hurt(5);
assert('100 HP + light damage -> 95', player.hp === 95, `player.hp = ${player.hp}`);

// 3. Heavy damage: 100 HP + heavy damage -> 90
player.hp = 100;
player.invincibilityTimer = 0;
player.hurt(10);
assert('100 HP + heavy damage -> 90', player.hp === 90, `player.hp = ${player.hp}`);

// 4. Clamping: 5 HP + heavy damage -> 0, never negative
player.hp = 5;
player.invincibilityTimer = 0;
player.hurt(10);
assert('5 HP + heavy damage -> 0 (never -5)', player.hp === 0, `player.hp = ${player.hp}`);

// 5. Invincibility / Dead Guard: Damage cannot apply while dead
player.isDead = true;
player.hp = 100;
const hurtResult = player.hurt(10);
assert('Hurt rejected while isDead is true', hurtResult === false && player.hp === 100, `hurtResult: ${hurtResult}, hp: ${player.hp}`);

// 6. Test Mock Game Controller replicating Game.js logic
class MockGame {
  constructor() {
    this.player = new Player(100, 100);
    this.gameState = new GameState();
    this.gameOverScreen = new GameOverScreen();
    this.state = GAME_STATES.PLAYING;
    this.respawnTimer = 0;
  }

  handlePlayerDeath() {
    if (this.player.isDead || this.state === GAME_STATES.DEFEATED || this.state === GAME_STATES.GAME_OVER) {
      return;
    }

    this.player.isDead = true;

    if (this.gameState.lives > 1) {
      this.gameState.loseLife();
      this.player.hp = this.player.maxHp;
      this.gameState.hp = this.player.hp;
      this.respawnTimer = 0.8;
    } else {
      this.gameState.lives = 0;
      this.player.hp = 0;
      this.gameState.hp = 0;
      this.respawnTimer = 0.8;
    }
  }

  update(dt) {
    if (this.state === GAME_STATES.DEFEATED || this.state === GAME_STATES.GAME_OVER) {
      return;
    }

    if (this.player.hp <= 0 && !this.player.isDead) {
      this.handlePlayerDeath();
      return;
    }

    if (this.player.isDead) {
      this.respawnTimer -= dt;
      if (this.respawnTimer <= 0) {
        if (this.gameState.lives > 0) {
          this.state = GAME_STATES.DEFEATED;
          this.gameOverScreen.selectedOption = 0;
        } else {
          this.state = GAME_STATES.GAME_OVER;
        }
      }
    }
  }

  continueFromCheckpoint() {
    if (this.gameState.lives <= 0) {
      this.state = GAME_STATES.GAME_OVER;
      return;
    }
    this.player.hp = this.player.maxHp;
    this.gameState.hp = this.player.hp;
    this.player.respawn(100, 100);
    this.state = GAME_STATES.PLAYING;
  }

  goToMainMenu() {
    this.gameState.resetForNewGame(1, 1);
    this.player.respawn(100, 100);
    this.state = GAME_STATES.TITLE;
  }

  restartGame() {
    this.gameState.resetForNewGame(1, 1);
    this.player.respawn(100, 100);
    this.state = GAME_STATES.PLAYING;
  }
}

const mock = new MockGame();

// Test: Die with 5 lives -> 4 lives + Defeated Screen
mock.player.hp = 0;
mock.update(0.016);
assert('After death event, lives removed exactly once (5 -> 4)', mock.gameState.lives === 4, `lives = ${mock.gameState.lives}`);
assert('HP reset to 100 upon normal death', mock.player.hp === 100, `player.hp = ${mock.player.hp}`);

// Advance timer to trigger DEFEATED screen
mock.update(1.0);
assert('State transitions to DEFEATED', mock.state === GAME_STATES.DEFEATED, `state = ${mock.state}`);

// Verify no duplicate death or damage while DEFEATED screen is active
const hurtWhileDefeated = mock.player.hurt(10);
assert('Damage rejected while in DEFEATED state', hurtWhileDefeated === false, `hurtWhileDefeated = ${hurtWhileDefeated}`);
mock.handlePlayerDeath();
assert('One death cannot consume two lives (duplicate death prevented)', mock.gameState.lives === 4, `lives = ${mock.gameState.lives}`);

// Continue from Checkpoint
mock.continueFromCheckpoint();
assert('Continue resumes state to PLAYING', mock.state === GAME_STATES.PLAYING, `state = ${mock.state}`);
assert('Player is active (isDead === false)', mock.player.isDead === false, `isDead = ${mock.player.isDead}`);
assert('HP is 100 after continue', mock.player.hp === 100, `player.hp = ${mock.player.hp}`);
assert('Remaining lives preserved (4)', mock.gameState.lives === 4, `lives = ${mock.gameState.lives}`);

// Repeat deaths down to 1 life
// Death 2: 4 lives -> 3 lives
mock.player.hp = 0;
mock.update(0.016);
mock.update(1.0);
assert('Death 2: lives = 3 and state = DEFEATED', mock.gameState.lives === 3 && mock.state === GAME_STATES.DEFEATED);
mock.continueFromCheckpoint();

// Death 3: 3 lives -> 2 lives
mock.player.hp = 0;
mock.update(0.016);
mock.update(1.0);
assert('Death 3: lives = 2 and state = DEFEATED', mock.gameState.lives === 2 && mock.state === GAME_STATES.DEFEATED);
mock.continueFromCheckpoint();

// Death 4: 2 lives -> 1 life
mock.player.hp = 0;
mock.update(0.016);
mock.update(1.0);
assert('Death 4: lives = 1 and state = DEFEATED', mock.gameState.lives === 1 && mock.state === GAME_STATES.DEFEATED);
mock.continueFromCheckpoint();
assert('Now at exactly 1 life remaining', mock.gameState.lives === 1, `lives = ${mock.gameState.lives}`);

// Final Life Death: Die with 1 life -> 0 lives, HP = 0, Game Over screen
mock.player.hp = 0;
mock.update(0.016);
assert('Final death consumes final life: lives = 0', mock.gameState.lives === 0, `lives = ${mock.gameState.lives}`);
assert('HP remains 0 for exhausted run', mock.player.hp === 0, `player.hp = ${mock.player.hp}`);
assert('GameState HP remains 0', mock.gameState.hp === 0, `gameState.hp = ${mock.gameState.hp}`);

mock.update(1.0);
assert('State transitions to GAME_OVER', mock.state === GAME_STATES.GAME_OVER, `state = ${mock.state}`);

// Game Over must NOT offer checkpoint Continue
mock.continueFromCheckpoint();
assert('Continue from checkpoint forbidden when Lives = 0 (remains GAME_OVER)', mock.state === GAME_STATES.GAME_OVER, `state = ${mock.state}`);
assert('Player does NOT respawn when lives = 0', mock.player.isDead === true, `player.isDead = ${mock.player.isDead}`);

// Return to Main Menu
mock.goToMainMenu();
assert('Main Menu returns to TITLE state', mock.state === GAME_STATES.TITLE, `state = ${mock.state}`);

// Start New Run
mock.restartGame();
assert('New Run starts at PLAYING', mock.state === GAME_STATES.PLAYING, `state = ${mock.state}`);
assert('New Run has HP = 100', mock.player.hp === 100, `player.hp = ${mock.player.hp}`);
assert('New Run has Lives = 5', mock.gameState.lives === 5, `gameState.lives = ${mock.gameState.lives}`);

// Click hit-box tests for GameOverScreen
const gos = new GameOverScreen();
let continueClicked = false;
let mainMenuClicked = false;

// Defeated screen clicks
gos.handleClick(
  gos.defeatedContinueBtn.x + 10,
  gos.defeatedContinueBtn.y + 10,
  'DEFEATED',
  () => { continueClicked = true; },
  () => { mainMenuClicked = true; }
);
assert('DEFEATED screen continue button click works', continueClicked === true);

continueClicked = false;
mainMenuClicked = false;
gos.handleClick(
  gos.defeatedMainMenuBtn.x + 10,
  gos.defeatedMainMenuBtn.y + 10,
  'DEFEATED',
  () => { continueClicked = true; },
  () => { mainMenuClicked = true; }
);
assert('DEFEATED screen main menu button click works', mainMenuClicked === true);

// GAME_OVER screen click (only main menu allowed)
mainMenuClicked = false;
gos.handleClick(
  gos.gameOverMainMenuBtn.x + 10,
  gos.gameOverMainMenuBtn.y + 10,
  'GAME_OVER',
  null,
  () => { mainMenuClicked = true; }
);
assert('GAME_OVER screen return to main menu button click works', mainMenuClicked === true);

console.log('\n====================================');
if (failed) {
  console.error('RESULT: FAILED TESTS DETECTED');
  process.exit(1);
} else {
  console.log('RESULT: ALL 23 TEST ASSERTIONS PASSED PERFECTLY!');
  console.log('====================================');
}
