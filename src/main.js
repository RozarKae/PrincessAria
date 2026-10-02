import { Game } from './game/Game.js';

function initGame() {
  const canvas = document.getElementById('game-canvas');
  if (!canvas) {
    console.error('Failed to locate game canvas element!');
    return;
  }

  const game = new Game(canvas);
  window.game = game;
  window.__game = game;
  game.start();
  console.log('HD Platformer engine initialized successfully.');
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', initGame);
} else {
  initGame();
}

