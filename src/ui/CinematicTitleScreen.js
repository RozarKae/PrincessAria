/**
 * CinematicTitleScreen — Anime Video Montage Title Screen for Project Aria.
 *
 * Implements a continuous 9-shot anime cinematic opening sequence:
 * - Shot 01: The World (Wide aerial panorama of Honeywood)
 * - Shot 02: Princess Aria (Close-up of heroine's courageous determination)
 * - Shot 03: The Captured Batboy (Khan trapped in glowing amber chrysalis)
 * - Shot 04: Queen Bee Reveal (Fimabi reigning over her grand throne room)
 * - Shot 05: Villain Montage (Swarm, corrupted gears, and road to the hive)
 * - Shot 06: Castle Montage (Citadel of the Eternal Hive establishing shot)
 * - Shot 07: Aria Preparation (Aria gripping the bat pendant with resolve)
 * - Shot 08: Heroic Journey Shot (Solitary Aria embarking toward the mountain)
 * - Shot 09: Title Reveal & Living Loop (Aria on overlook, integrated typography & menu)
 *
 * Seamlessly transitions into the 256x240 retro pixel platformer upon selecting "BEGIN JOURNEY".
 */
export class CinematicTitleScreen {
  /**
   * @param {HTMLElement} container - The DOM parent element (#game-container)
   * @param {Function} onStartGame - Callback triggered when player selects "BEGIN JOURNEY"
   * @param {AudioManager} [audio] - Audio manager for title theme and SFX
   */
  constructor(container, onStartGame, audio = null) {
    this.container = container;
    this.onStartGame = onStartGame;
    this.audio = audio;

    this.isActive = false;
    this.isTransitioning = false;
    this.animationFrameId = null;

    const base = import.meta.env.BASE_URL || '/';
    const cleanBase = base.endsWith('/') ? base : base + '/';

    // Shot definition table
    this.shots = [
      { id: 'shot_01', src: `${cleanBase}cinematic/shot_01_world.jpg`, duration: 5500, label: 'THE REALM OF HONEYWOOD', zoom: [1.0, 1.07], pan: [0, 0, 0, -2] },
      { id: 'shot_02', src: `${cleanBase}cinematic/shot_02_aria.jpg`, duration: 6000, label: 'PRINCESS ARIA', zoom: [1.05, 1.0], pan: [1, 0, 0, 0] },
      { id: 'shot_03', src: `${cleanBase}cinematic/shot_03_batboy.jpg`, duration: 5500, label: 'THE CAPTURED BATBOY', zoom: [1.0, 1.06], pan: [0, 1, 0, -1] },
      { id: 'shot_04', src: `${cleanBase}cinematic/shot_04_queen_bee.jpg`, duration: 6500, label: 'FIMABI, QUEEN OF THE ETERNAL HIVE', zoom: [1.06, 1.0], pan: [0, -2, 0, 0] },
      { id: 'shot_05', src: `${cleanBase}cinematic/shot_05_montage.jpg`, duration: 5000, label: 'THE PERILOUS PATH', zoom: [1.0, 1.08], pan: [-2, 0, 0, 0] },
      { id: 'shot_06', src: `${cleanBase}cinematic/shot_06_castle.jpg`, duration: 6000, label: 'THE CITADEL OF THE ETERNAL HIVE', zoom: [1.04, 1.0], pan: [0, 1, 0, -1] },
      { id: 'shot_07', src: `${cleanBase}cinematic/shot_07_aria_prep.jpg`, duration: 5500, label: 'A PROMISE MADE', zoom: [1.0, 1.06], pan: [0, 0, 0, 0] },
      { id: 'shot_08', src: `${cleanBase}cinematic/shot_08_journey.jpg`, duration: 5500, label: 'THE RESCUE BEGINS', zoom: [1.05, 1.0], pan: [0, 0, 0, -2] },
      { id: 'shot_09', src: `${cleanBase}cinematic/shot_09_title_bg.jpg`, duration: 6000, label: 'PRINCESS ARIA: THE HONEYWOOD CHRONICLES', zoom: [1.0, 1.03], pan: [0, 0, 0, 0] },
    ];

    this.currentShotIndex = 0;
    this.shotStartTime = 0;
    this.isPlayingCinematic = true;

    // Menu state
    this.menuOptions = [
      { id: 'start', label: 'BEGIN JOURNEY' },
      { id: 'replay', label: 'REPLAY OPENING' },
      { id: 'credits', label: 'CREDITS' },
    ];
    this.selectedMenuIndex = 0;
    this.creditsOpen = false;

    // Motes particle system
    this.motes = [];
    for (let i = 0; i < 40; i++) {
      this.motes.push({
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 1.5 + Math.random() * 3.0,
        speedY: 0.8 + Math.random() * 1.6,
        speedX: (Math.random() - 0.5) * 0.8,
        opacity: 0.3 + Math.random() * 0.6,
        phase: Math.random() * Math.PI * 2,
      });
    }

    // DOM Elements
    this.root = null;
    this.imgA = null;
    this.imgB = null;
    this.activeImg = 'A';
    this.particleCanvas = null;
    this.particleCtx = null;
    this.shotLabelEl = null;
    this.uiOverlay = null;
    this.titleGroup = null;
    this.menuContainer = null;
    this.skipButton = null;
    this.fadeOverlay = null;
    this.creditsModal = null;

    this.boundOnKeyDown = this.onKeyDown.bind(this);
    this.boundOnResize = this.onResize.bind(this);

    this.preloadShots();
    this.initDOM();
  }

  preloadShots() {
    this.preloadedImages = [];
    for (const shot of this.shots) {
      const img = new Image();
      img.src = shot.src;
      this.preloadedImages.push(img);
    }
  }

  initDOM() {
    this.root = document.createElement('div');
    this.root.id = 'cinematic-title-root';
    this.root.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 25;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      user-select: none;
      -webkit-user-select: none;
      background-color: #030611;
      font-family: -apple-system, BlinkMacSystemFont, "Cinzel", "Outfit", "Segoe UI", serif, sans-serif;
    `;

    // Layer 1: Two alternating crossfade native img elements with GPU acceleration
    const createCinematicImg = (id) => {
      const img = document.createElement('img');
      img.id = id;
      img.alt = 'Project Aria Cinematic Shot';
      img.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        object-position: center;
        opacity: 0;
        transition: opacity 1.0s ease-in-out;
        transform-origin: center center;
        will-change: transform, opacity;
        z-index: 1;
        pointer-events: none;
        display: block;
      `;
      return img;
    };

    this.imgA = createCinematicImg('cinematic-img-a');
    this.imgB = createCinematicImg('cinematic-img-b');
    this.root.appendChild(this.imgA);
    this.root.appendChild(this.imgB);

    // Layer 2: Atmospheric Vignette & Soft Letterbox
    const vignette = document.createElement('div');
    vignette.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: radial-gradient(circle at center, transparent 60%, rgba(3, 6, 17, 0.3) 85%, rgba(3, 6, 17, 0.75) 100%);
      pointer-events: none;
      z-index: 3;
    `;
    this.root.appendChild(vignette);

    // Layer 3: Ambient Golden Motes Canvas
    this.particleCanvas = document.createElement('canvas');
    this.particleCanvas.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 4;
    `;
    this.particleCtx = this.particleCanvas.getContext('2d');
    this.root.appendChild(this.particleCanvas);

    // Layer 4: Shot Subtitle / Film Title Caption (During Cinematic Montage)
    this.shotLabelEl = document.createElement('div');
    this.shotLabelEl.style.cssText = `
      position: absolute;
      bottom: clamp(18px, 4vh, 32px);
      left: 50%;
      transform: translateX(-50%);
      font-size: clamp(11px, 1.4vw, 15px);
      font-weight: 600;
      letter-spacing: clamp(4px, 0.8vw, 8px);
      color: #fef08a;
      text-transform: uppercase;
      text-shadow: 0 2px 10px rgba(0, 0, 0, 0.9), 0 0 20px rgba(245, 158, 11, 0.5);
      opacity: 0;
      transition: opacity 0.8s ease;
      z-index: 4;
      pointer-events: none;
      white-space: nowrap;
    `;
    this.root.appendChild(this.shotLabelEl);

    // Layer 5: Interactive Cinematic Skip Prompt
    this.skipButton = document.createElement('div');
    this.skipButton.style.cssText = `
      position: absolute;
      top: clamp(16px, 3vh, 28px);
      right: clamp(16px, 3vw, 32px);
      font-size: clamp(10px, 1.1vw, 12px);
      font-weight: 600;
      letter-spacing: 2px;
      color: #94a3b8;
      background: rgba(10, 15, 29, 0.6);
      padding: 6px 14px;
      border-radius: 4px;
      border: 1px solid rgba(255, 255, 255, 0.15);
      cursor: pointer;
      z-index: 5;
      pointer-events: auto;
      transition: all 0.2s ease;
      backdrop-filter: blur(4px);
    `;
    this.skipButton.textContent = 'PRESS SPACE / 🎮 (A) TO SKIP ▸';
    this.skipButton.addEventListener('mouseenter', () => {
      this.skipButton.style.color = '#fef08a';
      this.skipButton.style.borderColor = 'rgba(245, 158, 11, 0.6)';
    });
    this.skipButton.addEventListener('mouseleave', () => {
      this.skipButton.style.color = '#94a3b8';
      this.skipButton.style.borderColor = 'rgba(255, 255, 255, 0.15)';
    });
    this.skipButton.addEventListener('click', () => {
      this.unlockAudio();
      this.skipToLivingMenu();
    });
    this.root.appendChild(this.skipButton);

    // Layer 6: Main Title & Living Menu Overlay (Hidden during cinematic shots 1-8, reveals at shot 9 / menu loop)
    this.uiOverlay = document.createElement('div');
    this.uiOverlay.id = 'cinematic-ui-overlay';
    this.uiOverlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 6;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      align-items: flex-end;
      padding: clamp(32px, 6vh, 64px) clamp(36px, 6vw, 72px);
      box-sizing: border-box;
      pointer-events: none;
      opacity: 0;
      transition: opacity 1.5s ease-in-out;
    `;

    // Title Group (Anchored elegantly on the upper-right)
    this.titleGroup = document.createElement('div');
    this.titleGroup.style.cssText = `
      text-align: right;
      margin-top: clamp(8px, 2vh, 24px);
      pointer-events: auto;
    `;

    const titleH1 = document.createElement('h1');
    titleH1.textContent = 'PRINCESS ARIA';
    titleH1.style.cssText = `
      font-size: clamp(32px, 5.5vw, 62px);
      font-weight: 700;
      letter-spacing: clamp(6px, 1.2vw, 14px);
      margin: 0;
      padding: 0;
      background: linear-gradient(180deg, #ffffff 0%, #fef08a 45%, #f59e0b 80%, #b45309 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      filter: drop-shadow(0 3px 12px rgba(0, 0, 0, 0.95));
      text-transform: uppercase;
      font-family: inherit;
    `;

    const subtitle = document.createElement('div');
    subtitle.textContent = 'THE HONEYWOOD CHRONICLES';
    subtitle.style.cssText = `
      font-size: clamp(11px, 1.4vw, 15px);
      font-weight: 600;
      letter-spacing: clamp(4px, 0.8vw, 9px);
      color: #fde68a;
      margin-top: 10px;
      text-transform: uppercase;
      text-shadow: 0 2px 8px rgba(0, 0, 0, 0.9);
      opacity: 0.95;
    `;

    const titleDivider = document.createElement('div');
    titleDivider.style.cssText = `
      width: clamp(100px, 18vw, 180px);
      height: 2px;
      background: linear-gradient(90deg, transparent, #fbbf24, transparent);
      margin: 12px 0 0 auto;
    `;

    this.titleGroup.appendChild(titleH1);
    this.titleGroup.appendChild(subtitle);
    this.titleGroup.appendChild(titleDivider);
    this.uiOverlay.appendChild(this.titleGroup);

    // Menu Container (Anchored in the lower-right)
    this.menuContainer = document.createElement('div');
    this.menuContainer.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: clamp(12px, 2vh, 20px);
      margin-bottom: clamp(12px, 3vh, 32px);
      pointer-events: auto;
    `;
    this.renderMenuOptions();
    this.uiOverlay.appendChild(this.menuContainer);

    // Footer Hint
    const footerHint = document.createElement('div');
    footerHint.style.cssText = `
      font-size: clamp(9px, 1.0vw, 11px);
      letter-spacing: 2px;
      color: #94a3b8;
      opacity: 0.65;
      text-align: right;
    `;
    footerHint.textContent = 'KEYBOARD: [W][S] / [ENTER]  •  CONTROLLER: 🎮 D-PAD / (A) SELECT';
    this.uiOverlay.appendChild(footerHint);

    this.root.appendChild(this.uiOverlay);

    // Layer 7: Interactive Credits Modal
    this.creditsModal = document.createElement('div');
    this.creditsModal.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: min(90%, 480px);
      background: rgba(8, 12, 24, 0.95);
      border: 1px solid rgba(245, 158, 11, 0.5);
      box-shadow: 0 25px 60px rgba(0, 0, 0, 0.95), 0 0 35px rgba(245, 158, 11, 0.2);
      border-radius: 8px;
      padding: 32px 28px;
      color: #f1f5f9;
      text-align: center;
      z-index: 10;
      display: none;
      pointer-events: auto;
      backdrop-filter: blur(10px);
    `;
    this.creditsModal.innerHTML = `
      <div style="font-size: 20px; font-weight: 700; letter-spacing: 4px; color: #fbbf24; margin-bottom: 8px; text-transform: uppercase;">
        PRINCESS ARIA
      </div>
      <div style="font-size: 11px; letter-spacing: 2px; color: #fde68a; margin-bottom: 20px; text-transform: uppercase;">
        THE RESCUE OF KHAN THE BAT BOY • 25 WORLDS
      </div>
      <div style="font-size: 12px; line-height: 1.8; color: #cbd5e1; margin-bottom: 24px; text-align: left; padding: 0 12px;">
        ✦ <strong>Story:</strong> Princess Arifa's Great Rescue of Khan across the 25 Worlds of the Eternal Hive.<br />
        ✦ <strong>Antagonist:</strong> Fimabi, Queen of the Eternal Hive.<br />
        ✦ <strong>Aesthetic:</strong> Living Anime Fantasy Cinematic Title & 1985 Retro NES Pixel Platformer Engine.<br />
        ✦ <strong>Soundtrack:</strong> Procedural Royal WebAudio Synthesizer.
      </div>
      <button id="cinematic-credits-close-btn" style="
        background: transparent;
        border: 1px solid rgba(251, 191, 36, 0.6);
        color: #fef08a;
        font-family: inherit;
        font-size: 12px;
        letter-spacing: 3px;
        padding: 8px 26px;
        cursor: pointer;
        border-radius: 4px;
        transition: all 0.2s ease;
      ">RETURN</button>
    `;
    this.root.appendChild(this.creditsModal);

    const closeBtn = this.creditsModal.querySelector('#cinematic-credits-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.toggleCredits(false));
      closeBtn.addEventListener('mouseenter', () => {
        closeBtn.style.background = 'rgba(245, 158, 11, 0.25)';
        closeBtn.style.borderColor = '#fbbf24';
      });
      closeBtn.addEventListener('mouseleave', () => {
        closeBtn.style.background = 'transparent';
        closeBtn.style.borderColor = 'rgba(251, 191, 36, 0.6)';
      });
    }

    // Layer 8: Smooth Cinematic Fade to Black Screen Overlay
    this.fadeOverlay = document.createElement('div');
    this.fadeOverlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: #000000;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.55s ease-in-out;
      z-index: 20;
    `;
    this.root.appendChild(this.fadeOverlay);

    this.container.appendChild(this.root);
  }

  renderMenuOptions() {
    this.menuContainer.innerHTML = '';

    this.menuOptions.forEach((opt, idx) => {
      const isSelected = idx === this.selectedMenuIndex;
      const btn = document.createElement('button');
      btn.dataset.index = idx;
      btn.textContent = opt.label;
      btn.style.cssText = `
        background: transparent;
        border: none;
        outline: none;
        cursor: pointer;
        font-family: inherit;
        font-size: clamp(14px, 1.8vw, 18px);
        font-weight: 600;
        letter-spacing: clamp(3px, 0.6vw, 6px);
        color: ${isSelected ? '#fef08a' : '#e2e8f0'};
        opacity: ${isSelected ? '1' : '0.65'};
        padding: 6px 16px;
        position: relative;
        transition: all 0.25s ease;
        text-shadow: ${isSelected ? '0 0 18px rgba(245, 158, 11, 0.7), 0 2px 4px rgba(0, 0, 0, 0.95)' : '0 2px 4px rgba(0, 0, 0, 0.9)'};
        transform: ${isSelected ? 'scale(1.05) translateX(-8px)' : 'scale(1.0)'};
      `;

      if (isSelected) {
        const marker = document.createElement('span');
        marker.textContent = '▸ ';
        marker.style.color = '#f59e0b';
        marker.style.marginRight = '6px';
        btn.prepend(marker);
      }

      btn.addEventListener('mouseenter', () => {
        this.unlockAudio();
        if (this.selectedMenuIndex !== idx) {
          this.selectedMenuIndex = idx;
          this.renderMenuOptions();
        }
      });

      btn.addEventListener('click', () => {
        this.unlockAudio();
        this.selectCurrentOption();
      });

      this.menuContainer.appendChild(btn);
    });
  }

  /* -------------------------------------------------------------------------- */
  /* CINEMATIC TIMELINE & PLAYBACK CONTROLLER                                   */
  /* -------------------------------------------------------------------------- */

  start() {
    if (this.isActive) return;
    this.isActive = true;
    this.isTransitioning = false;
    this.root.style.display = 'flex';
    this.fadeOverlay.style.opacity = '0';

    window.addEventListener('keydown', this.boundOnKeyDown);
    window.addEventListener('resize', this.boundOnResize);
    this.onResize();

    this.playCinematicSequence();
    this.loop();
  }

  stop() {
    this.isActive = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    window.removeEventListener('keydown', this.boundOnKeyDown);
    window.removeEventListener('resize', this.boundOnResize);
  }

  hide() {
    this.stop();
    if (this.root) {
      this.root.style.display = 'none';
    }
  }

  playCinematicSequence() {
    this.isPlayingCinematic = true;
    this.currentShotIndex = 0;
    this.skipButton.style.display = 'block';
    this.uiOverlay.style.opacity = '0';
    this.uiOverlay.style.pointerEvents = 'none';

    // Direct initialization of Shot 01 on imgA
    this.activeImg = 'A';
    const shot = this.shots[0];
    this.imgA.src = shot.src;
    this.imgA.style.opacity = '1';
    this.imgA.style.zIndex = '2';
    this.imgB.style.opacity = '0';
    this.imgB.style.zIndex = '1';

    // Ken Burns zoom/pan animation on Shot 01
    const [zStart, zEnd] = shot.zoom;
    const [pStartX, pStartY, pEndX, pEndY] = shot.pan;
    this.imgA.style.transform = `scale(${zStart}) translate(${pStartX}%, ${pStartY}%)`;
    requestAnimationFrame(() => {
      this.imgA.style.transition = `transform ${shot.duration}ms cubic-bezier(0.25, 0.1, 0.25, 1), opacity 1.0s ease-in-out`;
      this.imgA.style.transform = `scale(${zEnd}) translate(${pEndX}%, ${pEndY}%)`;
    });

    this.shotLabelEl.textContent = shot.label;
    this.shotLabelEl.style.opacity = '0.9';
    setTimeout(() => {
      if (this.currentShotIndex === 0 && this.isPlayingCinematic) {
        this.shotLabelEl.style.opacity = '0';
      }
    }, shot.duration - 800);

    if (this.shotTimeout) clearTimeout(this.shotTimeout);
    this.shotTimeout = setTimeout(() => {
      if (this.isActive && this.isPlayingCinematic) {
        this.showShot(1);
      }
    }, shot.duration);
  }

  showShot(index) {
    if (!this.isActive) return;
    if (index >= this.shots.length - 1) {
      // Reached Shot 09 -> Transition into the Living Menu Loop!
      this.enterLivingMenuLoop();
      return;
    }

    const shot = this.shots[index];
    this.currentShotIndex = index;
    this.shotStartTime = performance.now();

    // Alternate between imgA and imgB for seamless crossfade
    const incomingImg = this.activeImg === 'A' ? this.imgB : this.imgA;
    const outgoingImg = this.activeImg === 'A' ? this.imgA : this.imgB;
    this.activeImg = this.activeImg === 'A' ? 'B' : 'A';

    incomingImg.src = shot.src;
    incomingImg.style.zIndex = '2';
    outgoingImg.style.zIndex = '1';
    incomingImg.style.transition = 'opacity 1.0s ease-in-out';
    incomingImg.style.opacity = '1';
    outgoingImg.style.opacity = '0';

    // Apply Ken Burns zoom/pan animation to incoming image
    const [zStart, zEnd] = shot.zoom;
    const [pStartX, pStartY, pEndX, pEndY] = shot.pan;
    incomingImg.style.transform = `scale(${zStart}) translate(${pStartX}%, ${pStartY}%)`;

    requestAnimationFrame(() => {
      incomingImg.style.transition = `transform ${shot.duration}ms cubic-bezier(0.25, 0.1, 0.25, 1), opacity 1.0s ease-in-out`;
      incomingImg.style.transform = `scale(${zEnd}) translate(${pEndX}%, ${pEndY}%)`;
    });

    // Subtitle label fade-in and fade-out
    this.shotLabelEl.textContent = shot.label;
    this.shotLabelEl.style.opacity = '0.9';
    setTimeout(() => {
      if (this.currentShotIndex === index && this.isPlayingCinematic) {
        this.shotLabelEl.style.opacity = '0';
      }
    }, shot.duration - 800);

    // Schedule next shot
    this.shotTimeout = setTimeout(() => {
      if (this.isActive && this.isPlayingCinematic) {
        this.showShot(index + 1);
      }
    }, shot.duration);
  }

  enterLivingMenuLoop() {
    this.isPlayingCinematic = false;
    this.currentShotIndex = 8; // Shot 09 (Title Background)
    const shot = this.shots[8];

    if (this.shotTimeout) clearTimeout(this.shotTimeout);

    const activeEl = this.activeImg === 'A' ? this.imgA : this.imgB;
    const otherEl = this.activeImg === 'A' ? this.imgB : this.imgA;

    activeEl.src = shot.src;
    activeEl.style.zIndex = '2';
    activeEl.style.opacity = '1';
    activeEl.style.transition = 'opacity 1.2s ease-in-out';
    otherEl.style.opacity = '0';
    otherEl.style.zIndex = '1';

    // Living subtle camera breathing
    activeEl.style.transform = 'scale(1.02)';

    // Hide cinematic caption & skip button
    this.shotLabelEl.style.opacity = '0';
    this.skipButton.style.display = 'none';

    // Reveal Title & Living Menu overlay
    this.uiOverlay.style.opacity = '1';
    this.uiOverlay.style.pointerEvents = 'auto';
    this.renderMenuOptions();
  }

  skipToLivingMenu() {
    if (this.shotTimeout) clearTimeout(this.shotTimeout);
    this.enterLivingMenuLoop();
  }

  /* -------------------------------------------------------------------------- */
  /* ATMOSPHERIC PARTICLES & CONTINUOUS LIVING LOOP                             */
  /* -------------------------------------------------------------------------- */

  loop() {
    if (!this.isActive) return;

    this.animationFrameId = requestAnimationFrame(() => this.loop());

    this.pollGamepad();

    const width = this.particleCanvas.width;
    const height = this.particleCanvas.height;
    if (!this.particleCtx || width === 0 || height === 0) return;

    this.particleCtx.clearRect(0, 0, width, height);

    const time = performance.now() * 0.001;

    // Subtle breathing drift on the title background during the living menu state
    if (!this.isPlayingCinematic) {
      const activeEl = this.activeImg === 'A' ? this.imgA : this.imgB;
      const breathScale = 1.02 + Math.sin(time * 0.5) * 0.012;
      const driftX = Math.sin(time * 0.3) * 0.4;
      const driftY = Math.cos(time * 0.25) * 0.3;
      activeEl.style.transform = `scale(${breathScale}) translate(${driftX}%, ${driftY}%)`;
    }

    // Render floating golden pollen / amber motes
    this.particleCtx.save();
    this.motes.forEach((mote) => {
      mote.y -= mote.speedY * 0.15;
      mote.x += Math.sin(time * 1.5 + mote.phase) * mote.speedX * 0.1;

      if (mote.y < -5) {
        mote.y = 105;
        mote.x = Math.random() * 100;
      }

      const px = (mote.x / 100) * width;
      const py = (mote.y / 100) * height;
      const pulseOpacity = mote.opacity * (0.7 + 0.3 * Math.sin(time * 2.0 + mote.phase));

      this.particleCtx.fillStyle = `rgba(254, 240, 138, ${pulseOpacity})`;
      this.particleCtx.shadowColor = '#fbbf24';
      this.particleCtx.shadowBlur = 8;
      this.particleCtx.beginPath();
      this.particleCtx.arc(px, py, mote.size, 0, Math.PI * 2);
      this.particleCtx.fill();
    });
    this.particleCtx.restore();
  }

  /* -------------------------------------------------------------------------- */
  /* INTERACTIVITY & MENU NAVIGATION                                            */
  /* -------------------------------------------------------------------------- */

  onKeyDown(e) {
    if (this.isTransitioning) return;
    this.unlockAudio();

    // If currently playing cinematic, pressing Space or Enter skips immediately to the living menu
    if (this.isPlayingCinematic) {
      if (e.key === ' ' || e.key === 'Enter' || e.key === 'Escape') {
        e.preventDefault();
        this.skipToLivingMenu();
        return;
      }
    }

    if (this.creditsOpen) {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.toggleCredits(false);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        e.preventDefault();
        this.navigateMenu(-1);
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        e.preventDefault();
        this.navigateMenu(1);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        this.selectCurrentOption();
        break;
    }
  }

  pollGamepad() {
    if (this.isTransitioning) return;
    if (typeof navigator === 'undefined' || !navigator.getGamepads) return;
    const pads = navigator.getGamepads();
    let pad = null;
    for (let i = 0; i < pads.length; i++) {
      if (pads[i] && pads[i].connected) {
        pad = pads[i];
        break;
      }
    }
    if (!pad) return;

    const now = performance.now();
    if (!this.gamepadDebounce) this.gamepadDebounce = 0;

    const btnA = pad.buttons[0]?.pressed || pad.buttons[0]?.value > 0.4;
    const btnB = pad.buttons[1]?.pressed || pad.buttons[1]?.value > 0.4;
    const btnX = pad.buttons[2]?.pressed || pad.buttons[2]?.value > 0.4;
    const btnY = pad.buttons[3]?.pressed || pad.buttons[3]?.value > 0.4;
    const btnStart = pad.buttons[9]?.pressed || pad.buttons[8]?.pressed;

    const dpadUp = pad.buttons[12]?.pressed || (pad.axes && pad.axes[1] < -0.42);
    const dpadDown = pad.buttons[13]?.pressed || (pad.axes && pad.axes[1] > 0.42);

    if (this.isPlayingCinematic) {
      if (btnA || btnB || btnX || btnY || btnStart) {
        if (now > this.gamepadDebounce) {
          this.gamepadDebounce = now + 400;
          this.unlockAudio();
          this.skipToLivingMenu();
        }
        return;
      }
    }

    if (this.creditsOpen) {
      if (btnA || btnB || btnStart || btnX) {
        if (now > this.gamepadDebounce) {
          this.gamepadDebounce = now + 350;
          this.toggleCredits(false);
        }
      }
      return;
    }

    if (dpadUp) {
      if (now > this.gamepadDebounce) {
        this.gamepadDebounce = now + 220;
        this.navigateMenu(-1);
      }
    } else if (dpadDown) {
      if (now > this.gamepadDebounce) {
        this.gamepadDebounce = now + 220;
        this.navigateMenu(1);
      }
    } else if (btnA || btnStart) {
      if (now > this.gamepadDebounce) {
        this.gamepadDebounce = now + 400;
        this.selectCurrentOption();
      }
    }
  }

  navigateMenu(direction) {
    const prev = this.selectedMenuIndex;
    this.selectedMenuIndex = (this.selectedMenuIndex + direction + this.menuOptions.length) % this.menuOptions.length;
    if (prev !== this.selectedMenuIndex) {
      this.renderMenuOptions();
    }
  }

  selectCurrentOption() {
    if (this.isTransitioning) return;

    const opt = this.menuOptions[this.selectedMenuIndex];
    if (opt.id === 'start') {
      this.triggerStartGame();
    } else if (opt.id === 'replay') {
      this.playCinematicSequence();
    } else if (opt.id === 'credits') {
      this.toggleCredits(true);
    }
  }

  toggleCredits(open) {
    this.creditsOpen = open;
    this.creditsModal.style.display = open ? 'block' : 'none';
  }

  triggerStartGame() {
    if (this.isTransitioning) return;
    this.isTransitioning = true;

    if (this.audio) {
      this.audio.unlock();
      this.audio.playStart();
    }

    // Smooth 0.55s cinematic fade to black
    this.fadeOverlay.style.opacity = '1';

    setTimeout(() => {
      this.hide();
      if (typeof this.onStartGame === 'function') {
        this.onStartGame();
      }
    }, 560);
  }

  unlockAudio() {
    if (this.audio) {
      this.audio.unlock();
      this.audio.startTitleMusic();
    }
  }

  onResize() {
    if (!this.container || !this.particleCanvas) return;
    const rect = this.container.getBoundingClientRect();
    this.particleCanvas.width = rect.width;
    this.particleCanvas.height = rect.height;
  }

  destroy() {
    this.stop();
    if (this.shotTimeout) clearTimeout(this.shotTimeout);
    if (this.root && this.root.parentElement) {
      this.root.parentElement.removeChild(this.root);
    }
  }
}
