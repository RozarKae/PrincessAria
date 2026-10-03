import { KEY_BINDINGS } from '../game/Constants.js';

/**
 * MobileTouchOverlay.js
 * 
 * Provides ergonomic virtual on-screen game controls for mobile phones in both Portrait and Landscape modes.
 * - Virtual D-Pad / Thumbpad on the lower-left: LEFT, RIGHT, CROUCH/DOWN, UP/CLIMB
 * - Action buttons on the lower-right:
 *   [A / JUMP]: Primary jump & mid-air double jump
 *   [B / ATTACK]: Melee slash [Z]
 *   [Y / STAR]: Ranged Starbeam [C]
 *   [X / DASH]: Honey-silk speed dash [X]
 * - Utility buttons in upper corners: [PAUSE / RESTART], [WORLD 1 / WORLD 2]
 * 
 * Seamlessly interfaces with input.keys and Game loop.
 */
export class MobileTouchControls {
  constructor(input) {
    this.input = input;
    this.isTouchDevice = false;
    this.container = null;
    this.activeTouches = new Map();

    this.checkTouch();
    this.initDOM();
    this.setupListeners();
  }

  checkTouch() {
    this.isTouchDevice = (
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      window.matchMedia('(pointer: coarse)').matches
    );
  }

  initDOM() {
    this.container = document.createElement('div');
    this.container.id = 'mobile-touch-controls';
    this.container.className = 'touch-controls-container';
    
    this.container.innerHTML = `
      <!-- Top Utility Bar for Mobile -->
      <div class="mobile-top-bar">
        <button id="touch-btn-switch-world" class="touch-btn-util" type="button" aria-label="Switch World">
          <span class="util-badge">W1/W2</span>
        </button>
        <button id="touch-btn-start" class="touch-btn-util" type="button" aria-label="Start or Resume">
          <span class="util-badge">START</span>
        </button>
      </div>

      <!-- D-Pad Cluster (Left Hand) -->
      <div class="touch-dpad-cluster" id="touch-dpad-cluster">
        <div class="dpad-cross">
          <button id="touch-btn-up" class="touch-btn-dir dir-up" type="button" data-action="UP" aria-label="Up">
            ▲
          </button>
          <div class="dpad-mid-row">
            <button id="touch-btn-left" class="touch-btn-dir dir-left" type="button" data-action="LEFT" aria-label="Left">
              ◀
            </button>
            <div class="dpad-center-hub"></div>
            <button id="touch-btn-right" class="touch-btn-dir dir-right" type="button" data-action="RIGHT" aria-label="Right">
              ▶
            </button>
          </div>
          <button id="touch-btn-down" class="touch-btn-dir dir-down" type="button" data-action="CROUCH" aria-label="Down">
            ▼
          </button>
        </div>
      </div>

      <!-- Action Buttons Cluster (Right Hand) -->
      <div class="touch-action-cluster" id="touch-action-cluster">
        <!-- Top row: DASH & STARBEAM -->
        <div class="action-top-row">
          <button id="touch-btn-dash" class="touch-btn-action btn-dash" type="button" data-action="DASH" aria-label="Dash">
            <span class="action-symbol">⚡</span>
            <span class="action-label">DASH</span>
          </button>
          <button id="touch-btn-shoot" class="touch-btn-action btn-shoot" type="button" data-action="SHOOT" aria-label="Starbeam">
            <span class="action-symbol">✦</span>
            <span class="action-label">STAR</span>
          </button>
        </div>
        <!-- Bottom row: ATTACK & JUMP -->
        <div class="action-bottom-row">
          <button id="touch-btn-attack" class="touch-btn-action btn-attack" type="button" data-action="ATTACK" aria-label="Melee Attack">
            <span class="action-symbol">⚔</span>
            <span class="action-label">SLASH</span>
          </button>
          <button id="touch-btn-jump" class="touch-btn-action btn-jump" type="button" data-action="JUMP" aria-label="Jump">
            <span class="action-symbol">▲</span>
            <span class="action-label">JUMP</span>
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(this.container);
  }

  setupListeners() {
    // Map button elements to action strings
    const actionButtons = this.container.querySelectorAll('[data-action]');
    
    actionButtons.forEach(btn => {
      const action = btn.getAttribute('data-action');

      const handlePress = (e) => {
        e.preventDefault();
        e.stopPropagation();
        btn.classList.add('active');
        this.simulateActionDown(action);
        
        // Haptic feedback if supported on mobile
        if (navigator.vibrate) {
          navigator.vibrate(15);
        }
      };

      const handleRelease = (e) => {
        e.preventDefault();
        e.stopPropagation();
        btn.classList.remove('active');
        this.simulateActionUp(action);
      };

      btn.addEventListener('touchstart', handlePress, { passive: false });
      btn.addEventListener('touchend', handleRelease, { passive: false });
      btn.addEventListener('touchcancel', handleRelease, { passive: false });
      btn.addEventListener('mousedown', handlePress);
      btn.addEventListener('mouseup', handleRelease);
      btn.addEventListener('mouseleave', handleRelease);
    });

    // START button
    const startBtn = document.getElementById('touch-btn-start');
    if (startBtn) {
      const triggerStart = (e) => {
        e.preventDefault();
        this.simulateActionDown('START');
        setTimeout(() => this.simulateActionUp('START'), 100);
      };
      startBtn.addEventListener('touchstart', triggerStart, { passive: false });
      startBtn.addEventListener('click', triggerStart);
    }

    // World toggle button
    const worldBtn = document.getElementById('touch-btn-switch-world');
    if (worldBtn) {
      const toggleWorld = (e) => {
        e.preventDefault();
        if (window.game) {
          const nextWorld = (window.game.gameState.world === 1) ? 2 : 1;
          const url = new URL(window.location.href);
          url.searchParams.set('world', nextWorld);
          url.searchParams.set('play', 'true');
          window.location.href = url.toString();
        }
      };
      worldBtn.addEventListener('touchstart', toggleWorld, { passive: false });
      worldBtn.addEventListener('click', toggleWorld);
    }
  }

  simulateActionDown(action) {
    if (!this.input) return;
    const codes = KEY_BINDINGS[action] || [action];
    const primaryCode = codes[0];
    if (primaryCode) {
      if (!this.input.keys.has(primaryCode)) {
        this.input.pressed.add(primaryCode);
      }
      this.input.keys.add(primaryCode);
    }
  }

  simulateActionUp(action) {
    if (!this.input) return;
    const codes = KEY_BINDINGS[action] || [action];
    const primaryCode = codes[0];
    if (primaryCode) {
      this.input.keys.delete(primaryCode);
      this.input.released.add(primaryCode);
    }
  }
}
