console.log('[MAIN.JS TOP LEVEL LOADED]');
import { Game } from './game/Game.js';
import { MobileTouchControls } from './ui/MobileTouchControls.js';

function initGame() {
  const canvas = document.getElementById('game-canvas');
  if (!canvas) {
    console.error('Failed to locate game canvas element!');
    return;
  }

  const game = new Game(canvas);
  window.game = game;
  window.__game = game;

  // Initialize mobile touch controls overlay
  const mobileControls = new MobileTouchControls(game.input);
  window.mobileControls = mobileControls;

  game.start();
  console.log('HD Platformer engine initialized successfully with mobile touch support.');
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', initGame);
} else {
  initGame();
}

