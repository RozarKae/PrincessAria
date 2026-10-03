import { KEY_BINDINGS } from '../game/Constants.js';

/**
 * MobileTouchControls.js — Pro Gamer Edition
 * 
 * Features:
 * 1. Pro Controller Profile Selector:
 *    - PLAYSTATION 5 DualSense: (✕) Jump, (□) Slash/Melee, (△) Starbeam, (○) Dash
 *    - XBOX Series X: (A) Jump, (X) Slash/Melee, (Y) Starbeam, (B) Dash
 *    - NINTENDO Switch Pro: (B) Jump, (Y) Slash/Melee, (X) Starbeam, (A) Dash
 * 2. Ergonomic Floating Thumbstick / Cross-Dpad with glassmorphic haptic bevels
 * 3. Diamond layout with authentic button styling, authentic glyphs, micro-haptics & neon active glow
 * 4. Shoulder Bumper triggers (L1/LB Dash, R1/RB Slash) for pro two-finger claw grip
 * 5. Persistent profile storage via localStorage
 */

export const CONTROLLER_PROFILES = {
  PS5: {
    id: 'PS5',
    name: 'PS5 DualSense',
    tag: 'PS5',
    jump: { symbol: '✕', label: 'CROSS', action: 'JUMP', color: '#60a5fa', glow: '#3b82f6' },
    attack: { symbol: '□', label: 'SQUARE', action: 'ATTACK', color: '#f472b6', glow: '#ec4899' },
    shoot: { symbol: '△', label: 'TRIANGLE', action: 'SHOOT', color: '#34d399', glow: '#10b981' },
    dash: { symbol: '○', label: 'CIRCLE', action: 'DASH', color: '#f87171', glow: '#ef4444' },
    bumperL: { symbol: 'L1', label: 'DASH', action: 'DASH' },
    bumperR: { symbol: 'R1', label: 'STAR', action: 'SHOOT' }
  },
  XBOX: {
    id: 'XBOX',
    name: 'Xbox Series X',
    tag: 'XBOX',
    jump: { symbol: 'A', label: 'JUMP', action: 'JUMP', color: '#4ade80', glow: '#22c55e' },
    attack: { symbol: 'X', label: 'SLASH', action: 'ATTACK', color: '#60a5fa', glow: '#3b82f6' },
    shoot: { symbol: 'Y', label: 'STAR', action: 'SHOOT', color: '#facc15', glow: '#eab308' },
    dash: { symbol: 'B', label: 'DASH', action: 'DASH', color: '#f87171', glow: '#ef4444' },
    bumperL: { symbol: 'LB', label: 'DASH', action: 'DASH' },
    bumperR: { symbol: 'RB', label: 'STAR', action: 'SHOOT' }
  },
  NINTENDO: {
    id: 'NINTENDO',
    name: 'Nintendo Switch',
    tag: 'SWITCH',
    jump: { symbol: 'B', label: 'JUMP', action: 'JUMP', color: '#f87171', glow: '#ef4444' },
    attack: { symbol: 'Y', label: 'SLASH', action: 'ATTACK', color: '#38bdf8', glow: '#0284c7' },
    shoot: { symbol: 'X', label: 'STAR', action: 'SHOOT', color: '#60a5fa', glow: '#3b82f6' },
    dash: { symbol: 'A', label: 'DASH', action: 'DASH', color: '#ef4444', glow: '#dc2626' },
    bumperL: { symbol: 'L', label: 'DASH', action: 'DASH' },
    bumperR: { symbol: 'R', label: 'STAR', action: 'SHOOT' }
  }
};

export class MobileTouchControls {
  constructor(input) {
    this.input = input;
    this.container = null;
    this.activeTouches = new Map();

    // Default or stored pro profile (PS5, XBOX, NINTENDO)
    const stored = typeof localStorage !== 'undefined' ? localStorage.getItem('aria_pro_pad_profile') : null;
    this.currentProfile = (stored && CONTROLLER_PROFILES[stored]) ? stored : 'PS5';

    this.initDOM();
    this.setupListeners();
    this.applyProfile(this.currentProfile);
  }

  initDOM() {
    this.container = document.createElement('div');
    this.container.id = 'mobile-touch-controls';
    this.container.className = 'touch-controls-container pro-gamer-pad';

    this.container.innerHTML = `
      <!-- Pro Gamer Top Utility Bar -->
      <div class="mobile-top-bar">
        <!-- Controller Profile Switcher Pill -->
        <div class="pro-profile-pill" id="pro-profile-pill">
          <span class="pro-profile-title">PAD:</span>
          <button type="button" class="pro-profile-btn" data-profile="PS5" id="btn-profile-ps5">PS5</button>
          <button type="button" class="pro-profile-btn" data-profile="XBOX" id="btn-profile-xbox">XBOX</button>
          <button type="button" class="pro-profile-btn" data-profile="NINTENDO" id="btn-profile-nintendo">NSW</button>
        </div>

        <button id="touch-btn-rotate" class="touch-btn-util pro-util-btn" type="button" aria-label="Rotate Orientation">
          <span class="util-icon">🔄</span>
          <span class="util-text">ROTATE</span>
        </button>

        <button id="touch-btn-switch-world" class="touch-btn-util pro-util-btn" type="button" aria-label="Switch World">
          <span class="util-badge">W1/W2</span>
        </button>

        <button id="touch-btn-start" class="touch-btn-util pro-util-btn" type="button" aria-label="Start / Pause">
          <span class="util-badge">OPTIONS</span>
        </button>
      </div>

      <!-- Quick Orientation Banner / Mobile Prompt -->
      <div id="mobile-rotate-banner" class="mobile-rotate-banner">
        <span>🎮 Pro Mode Active • Rotate device for 16:9 widescreen or enjoy tactile portrait controls</span>
        <button id="close-rotate-banner" type="button" aria-label="Dismiss">✕</button>
      </div>

      <!-- Upper Shoulder Bumpers (L1/LB and R1/RB) for Pro Claw-Grip -->
      <div class="pro-bumpers-bar">
        <button class="pro-bumper-btn bumper-left" data-action="DASH" id="touch-bumper-l">
          <span class="bumper-name" id="label-bumper-l">L1</span>
          <span class="bumper-action">DASH ⚡</span>
        </button>
        <button class="pro-bumper-btn bumper-right" data-action="SHOOT" id="touch-bumper-r">
          <span class="bumper-name" id="label-bumper-r">R1</span>
          <span class="bumper-action">STAR ✦</span>
        </button>
      </div>

      <!-- Pro D-Pad Cluster (Left Hand) -->
      <div class="touch-dpad-cluster" id="touch-dpad-cluster">
        <div class="pro-dpad-base">
          <div class="pro-dpad-housing">
            <button id="touch-btn-up" class="pro-dpad-dir dir-up" type="button" data-action="UP" aria-label="Up">
              <span class="dpad-arrow">▲</span>
            </button>
            <div class="pro-dpad-middle">
              <button id="touch-btn-left" class="pro-dpad-dir dir-left" type="button" data-action="LEFT" aria-label="Left">
                <span class="dpad-arrow">◀</span>
              </button>
              <div class="pro-dpad-pivot">
                <div class="pro-pivot-indent"></div>
              </div>
              <button id="touch-btn-right" class="pro-dpad-dir dir-right" type="button" data-action="RIGHT" aria-label="Right">
                <span class="dpad-arrow">▶</span>
              </button>
            </div>
            <button id="touch-btn-down" class="pro-dpad-dir dir-down" type="button" data-action="CROUCH" aria-label="Down">
              <span class="dpad-arrow">▼</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Pro Action Diamond Cluster (Right Hand) -->
      <div class="touch-action-cluster" id="touch-action-cluster">
        <div class="pro-action-diamond">
          <!-- TOP Button: SHOOT (Triangle / Y / X) -->
          <button id="touch-btn-top" class="pro-action-btn btn-top" type="button" data-action="SHOOT" aria-label="Top Action">
            <span class="pro-glyph" id="glyph-top">△</span>
            <span class="pro-sub" id="sub-top">STAR</span>
          </button>

          <!-- LEFT Button: ATTACK/SLASH (Square / X / Y) -->
          <button id="touch-btn-left-action" class="pro-action-btn btn-left" type="button" data-action="ATTACK" aria-label="Left Action">
            <span class="pro-glyph" id="glyph-left">□</span>
            <span class="pro-sub" id="sub-left">SLASH</span>
          </button>

          <!-- RIGHT Button: DASH (Circle / B / A) -->
          <button id="touch-btn-right-action" class="pro-action-btn btn-right" type="button" data-action="DASH" aria-label="Right Action">
            <span class="pro-glyph" id="glyph-right">○</span>
            <span class="pro-sub" id="sub-right">DASH</span>
          </button>

          <!-- BOTTOM Button: JUMP (Cross / A / B) -->
          <button id="touch-btn-bottom" class="pro-action-btn btn-bottom primary-jump" type="button" data-action="JUMP" aria-label="Bottom Action">
            <span class="pro-glyph" id="glyph-bottom">✕</span>
            <span class="pro-sub" id="sub-bottom">JUMP</span>
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(this.container);
  }

  applyProfile(profileKey) {
    const prof = CONTROLLER_PROFILES[profileKey] || CONTROLLER_PROFILES.PS5;
    this.currentProfile = prof.id;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('aria_pro_pad_profile', prof.id);
    }

    // Update active state in switcher pill
    const profileButtons = this.container.querySelectorAll('.pro-profile-btn');
    profileButtons.forEach(btn => {
      const match = btn.getAttribute('data-profile') === prof.id;
      btn.classList.toggle('active', match);
    });

    // Update Shoulder Bumper labels
    const bumperL = document.getElementById('label-bumper-l');
    const bumperR = document.getElementById('label-bumper-r');
    if (bumperL) bumperL.textContent = prof.bumperL.symbol;
    if (bumperR) bumperR.textContent = prof.bumperR.symbol;

    // Update Top button (Shoot / Star)
    const btnTop = document.getElementById('touch-btn-top');
    const glyphTop = document.getElementById('glyph-top');
    const subTop = document.getElementById('sub-top');
    if (btnTop && glyphTop && subTop) {
      glyphTop.textContent = prof.shoot.symbol;
      subTop.textContent = prof.shoot.label;
      btnTop.style.setProperty('--btn-glow', prof.shoot.glow);
      btnTop.style.setProperty('--btn-color', prof.shoot.color);
    }

    // Update Left button (Attack / Slash)
    const btnLeft = document.getElementById('touch-btn-left-action');
    const glyphLeft = document.getElementById('glyph-left');
    const subLeft = document.getElementById('sub-left');
    if (btnLeft && glyphLeft && subLeft) {
      glyphLeft.textContent = prof.attack.symbol;
      subLeft.textContent = prof.attack.label;
      btnLeft.style.setProperty('--btn-glow', prof.attack.glow);
      btnLeft.style.setProperty('--btn-color', prof.attack.color);
    }

    // Update Right button (Dash)
    const btnRight = document.getElementById('touch-btn-right-action');
    const glyphRight = document.getElementById('glyph-right');
    const subRight = document.getElementById('sub-right');
    if (btnRight && glyphRight && subRight) {
      glyphRight.textContent = prof.dash.symbol;
      subRight.textContent = prof.dash.label;
      btnRight.style.setProperty('--btn-glow', prof.dash.glow);
      btnRight.style.setProperty('--btn-color', prof.dash.color);
    }

    // Update Bottom button (Jump)
    const btnBottom = document.getElementById('touch-btn-bottom');
    const glyphBottom = document.getElementById('glyph-bottom');
    const subBottom = document.getElementById('sub-bottom');
    if (btnBottom && glyphBottom && subBottom) {
      glyphBottom.textContent = prof.jump.symbol;
      subBottom.textContent = prof.jump.label;
      btnBottom.style.setProperty('--btn-glow', prof.jump.glow);
      btnBottom.style.setProperty('--btn-color', prof.jump.color);
    }
  }

  setupListeners() {
    // 1. Controller profile buttons (PS5, XBOX, NSW)
    const profileBtns = this.container.querySelectorAll('.pro-profile-btn');
    profileBtns.forEach(btn => {
      const chooseProfile = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const p = btn.getAttribute('data-profile');
        this.applyProfile(p);
        if (navigator.vibrate) navigator.vibrate(20);
      };
      btn.addEventListener('touchstart', chooseProfile, { passive: false });
      btn.addEventListener('click', chooseProfile);
    });

    // 2. Action buttons and D-Pad with micro-haptic and pro response
    const actionButtons = this.container.querySelectorAll('[data-action]');
    actionButtons.forEach(btn => {
      const action = btn.getAttribute('data-action');

      const handlePress = (e) => {
        e.preventDefault();
        e.stopPropagation();
        btn.classList.add('active');
        this.simulateActionDown(action);

        if (navigator.vibrate) {
          navigator.vibrate(action === 'JUMP' ? 22 : 14);
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

    // 3. START / OPTIONS button
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

    // 4. ROTATE / Fullscreen Orientation Toggle
    const rotateBtn = document.getElementById('touch-btn-rotate');
    if (rotateBtn) {
      const handleRotate = async (e) => {
        e.preventDefault();
        try {
          if (!document.fullscreenElement) {
            await document.documentElement.requestFullscreen?.();
            if (screen.orientation && screen.orientation.lock) {
              await screen.orientation.lock('landscape').catch(() => {});
            }
          } else {
            await document.exitFullscreen?.();
          }
        } catch (err) {
          console.log('[MobileControls] Orientation toggle hint:', err);
        }
      };
      rotateBtn.addEventListener('touchstart', handleRotate, { passive: false });
      rotateBtn.addEventListener('click', handleRotate);
    }

    // 5. Dismiss banner
    const closeBannerBtn = document.getElementById('close-rotate-banner');
    const rotateBanner = document.getElementById('mobile-rotate-banner');
    if (closeBannerBtn && rotateBanner) {
      const dismiss = (e) => {
        e.preventDefault();
        rotateBanner.style.display = 'none';
      };
      closeBannerBtn.addEventListener('click', dismiss);
      closeBannerBtn.addEventListener('touchstart', dismiss, { passive: false });
    }

    // 6. World toggle button
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
