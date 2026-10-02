import * as THREE from 'three';

/**
 * TitleScreen3D — Real-Time 3D Cinematic Title Screen for Project Aria.
 *
 * Implements a miniature 3D Honeywood scene:
 * - Foreground: Mossy stone overlook with Princess Aria overlooking the valley
 * - Character: Stylized 3D Princess Aria with breathing, flowing golden hair, fluttering ribbon and dress
 * - Midground: Layered pine trees swaying in the mountain wind, floating golden pollen, glowing amber shards
 * - Background: Celestial golden moon/dawn disc, atmospheric mist, distant mountain silhouettes, Queen Bee hive citadel
 * - Lighting: Soft cool moonlight key, warm amber rim lighting on Aria, and deep indigo hemisphere fill
 * - Typography: Integrated cinematic title "PRINCESS ARIA: THE HONEYWOOD CHRONICLES"
 * - Menu: Minimal, fully responsive keyboard/gamepad/mouse navigation ("BEGIN JOURNEY", "CREDITS")
 * - Transition: Cinematic fade to black into the 256x240 retro pixel gameplay engine
 */
export class TitleScreen3D {
  /**
   * @param {HTMLElement} container - The DOM parent element (#game-container)
   * @param {Function} onStartGame - Callback triggered when player selects "BEGIN JOURNEY"
   * @param {AudioManager} [audio] - Audio manager instance for music & SFX
   */
  constructor(container, onStartGame, audio = null) {
    this.container = container;
    this.onStartGame = onStartGame;
    this.audio = audio;
    this.isActive = false;
    this.isTransitioning = false;
    this.animationFrameId = null;
    this.clock = new THREE.Clock();

    // Menu state
    this.menuOptions = [
      { id: 'start', label: 'BEGIN JOURNEY' },
      { id: 'credits', label: 'CREDITS' },
    ];
    this.selectedMenuIndex = 0;
    this.creditsOpen = false;

    // DOM Elements
    this.root = null;
    this.canvas = null;
    this.uiOverlay = null;
    this.fadeOverlay = null;

    // Three.js Core
    this.renderer = null;
    this.scene = null;
    this.camera = null;

    // Animated objects registry
    this.animatedObjects = {
      ariaTorso: null,
      ariaHairSegments: [],
      ariaRibbons: [],
      ariaDress: null,
      trees: [],
      crystals: [],
      particles: null,
      particlePositions: null,
      particleSpeeds: null,
      hiveEyes: null,
      rimLight: null,
    };

    this.boundOnKeyDown = this.onKeyDown.bind(this);
    this.boundOnResize = this.onResize.bind(this);

    this.initDOM();
    this.initThree();
    this.buildScene();
  }

  /* -------------------------------------------------------------------------- */
  /* DOM & OVERLAY INITIALIZATION                                               */
  /* -------------------------------------------------------------------------- */

  initDOM() {
    this.root = document.createElement('div');
    this.root.id = 'title-screen-3d-root';
    this.root.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 20;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      user-select: none;
      -webkit-user-select: none;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Cinzel", "Outfit", serif, sans-serif;
    `;

    // 3D Canvas
    this.canvas = document.createElement('canvas');
    this.canvas.id = 'title-canvas-3d';
    this.canvas.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: block;
      z-index: 1;
    `;
    this.root.appendChild(this.canvas);

    // Cinematic UI Overlay
    this.uiOverlay = document.createElement('div');
    this.uiOverlay.id = 'title-ui-overlay';
    this.uiOverlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 2;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      align-items: center;
      padding: clamp(24px, 5vh, 60px) clamp(20px, 4vw, 48px);
      box-sizing: border-box;
      pointer-events: none;
    `;

    // Header Title Group
    const titleGroup = document.createElement('div');
    titleGroup.style.cssText = `
      text-align: center;
      margin-top: clamp(8px, 2vh, 24px);
      pointer-events: auto;
      text-shadow: 0 4px 20px rgba(0, 0, 0, 0.85), 0 0 35px rgba(245, 158, 11, 0.25);
    `;

    const titleH1 = document.createElement('h1');
    titleH1.textContent = 'PRINCESS ARIA';
    titleH1.style.cssText = `
      font-size: clamp(28px, 5.2vw, 54px);
      font-weight: 700;
      letter-spacing: clamp(6px, 1.2vw, 14px);
      margin: 0;
      padding: 0;
      background: linear-gradient(180deg, #ffffff 0%, #fef08a 40%, #f59e0b 80%, #b45309 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.9));
      font-family: inherit;
      text-transform: uppercase;
    `;

    const subtitle = document.createElement('div');
    subtitle.textContent = 'THE HONEYWOOD CHRONICLES';
    subtitle.style.cssText = `
      font-size: clamp(10px, 1.4vw, 14px);
      font-weight: 600;
      letter-spacing: clamp(4px, 0.8vw, 8px);
      color: #fde68a;
      margin-top: 8px;
      opacity: 0.92;
      text-transform: uppercase;
    `;

    const titleDivider = document.createElement('div');
    titleDivider.style.cssText = `
      width: clamp(80px, 16vw, 160px);
      height: 1px;
      background: linear-gradient(90deg, transparent, #fbbf24, transparent);
      margin: 10px auto 0 auto;
    `;

    titleGroup.appendChild(titleH1);
    titleGroup.appendChild(subtitle);
    titleGroup.appendChild(titleDivider);
    this.uiOverlay.appendChild(titleGroup);

    // Menu Container
    this.menuContainer = document.createElement('div');
    this.menuContainer.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: clamp(10px, 1.8vh, 18px);
      margin-bottom: clamp(16px, 3vh, 32px);
      pointer-events: auto;
    `;

    this.renderMenuOptions();
    this.uiOverlay.appendChild(this.menuContainer);

    // Footer Info
    const footer = document.createElement('div');
    footer.style.cssText = `
      font-size: clamp(9px, 1.1vw, 11px);
      letter-spacing: 2px;
      color: #94a3b8;
      opacity: 0.7;
      text-align: center;
      margin-bottom: 4px;
    `;
    footer.textContent = 'PRESS SPACE / ENTER TO SELECT • USE ARROWS OR MOUSE';
    this.uiOverlay.appendChild(footer);

    this.root.appendChild(this.uiOverlay);

    // Credits Modal Card
    this.creditsModal = document.createElement('div');
    this.creditsModal.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: min(90%, 460px);
      background: rgba(10, 15, 29, 0.95);
      border: 1px solid rgba(245, 158, 11, 0.4);
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.9), 0 0 30px rgba(245, 158, 11, 0.15);
      border-radius: 8px;
      padding: 28px 24px;
      color: #f1f5f9;
      text-align: center;
      z-index: 5;
      display: none;
      pointer-events: auto;
      backdrop-filter: blur(8px);
    `;
    this.creditsModal.innerHTML = `
      <div style="font-size: 18px; font-weight: 700; letter-spacing: 4px; color: #fbbf24; margin-bottom: 14px; text-transform: uppercase;">
        PRINCESS ARIA
      </div>
      <div style="font-size: 11px; letter-spacing: 2px; color: #94a3b8; margin-bottom: 18px;">
        1985 RETRO PLATFORMER FOUNDATION & REAL-TIME 3D CINEMATICS
      </div>
      <div style="font-size: 12px; line-height: 1.8; color: #cbd5e1; margin-bottom: 22px;">
        Direction: Pair Programming Studio<br />
        Aesthetic: 1985 NES Visual Discipline<br />
        Audio & Music: Procedural WebAudio Synthesizer<br />
        Story: The Rescue of Batboy
      </div>
      <button id="credits-close-btn" style="
        background: transparent;
        border: 1px solid rgba(251, 191, 36, 0.6);
        color: #fef08a;
        font-family: inherit;
        font-size: 12px;
        letter-spacing: 3px;
        padding: 8px 24px;
        cursor: pointer;
        border-radius: 4px;
        transition: all 0.2s ease;
      ">RETURN</button>
    `;
    this.root.appendChild(this.creditsModal);

    const closeBtn = this.creditsModal.querySelector('#credits-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.toggleCredits(false));
      closeBtn.addEventListener('mouseenter', () => {
        closeBtn.style.background = 'rgba(245, 158, 11, 0.2)';
        closeBtn.style.borderColor = '#fbbf24';
      });
      closeBtn.addEventListener('mouseleave', () => {
        closeBtn.style.background = 'transparent';
        closeBtn.style.borderColor = 'rgba(251, 191, 36, 0.6)';
      });
    }

    // Fade to Black Screen Overlay
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
      z-index: 10;
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
        font-size: clamp(13px, 1.8vw, 17px);
        font-weight: 600;
        letter-spacing: clamp(3px, 0.6vw, 6px);
        color: ${isSelected ? '#fef08a' : '#cbd5e1'};
        opacity: ${isSelected ? '1' : '0.65'};
        padding: 6px 16px;
        position: relative;
        transition: all 0.25s ease;
        text-shadow: ${isSelected ? '0 0 16px rgba(245, 158, 11, 0.6), 0 2px 4px rgba(0, 0, 0, 0.9)' : '0 2px 4px rgba(0, 0, 0, 0.8)'};
        transform: ${isSelected ? 'scale(1.05)' : 'scale(1.0)'};
      `;

      if (isSelected) {
        const marker = document.createElement('span');
        marker.textContent = '▸ ';
        marker.style.color = '#f59e0b';
        marker.style.marginRight = '4px';
        btn.prepend(marker);
      }

      btn.addEventListener('mouseenter', () => {
        if (this.selectedMenuIndex !== idx) {
          this.selectedMenuIndex = idx;
          this.renderMenuOptions();
        }
      });

      btn.addEventListener('click', () => {
        this.selectCurrentOption();
      });

      this.menuContainer.appendChild(btn);
    });
  }

  /* -------------------------------------------------------------------------- */
  /* THREE.JS ENGINE SETUP                                                      */
  /* -------------------------------------------------------------------------- */

  initThree() {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x060913);
    this.scene.fog = new THREE.FogExp2(0x070c18, 0.035);

    this.camera = new THREE.PerspectiveCamera(44, width / height, 0.1, 100);
    this.camera.position.set(0.3, 1.95, 6.0);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
  }

  /* -------------------------------------------------------------------------- */
  /* 3D SCENE COMPOSITION                                                       */
  /* -------------------------------------------------------------------------- */

  buildScene() {
    this.setupLighting();
    this.buildForegroundOverlook();
    this.buildStylizedAria();
    this.buildMidgroundForest();
    this.buildFloatingPollen();
    this.buildFloatingHoneyCrystals();
    this.buildBackgroundVistas();
  }

  setupLighting() {
    // 1. Cool Moonlight Key Light
    const moonLight = new THREE.DirectionalLight(0x93c5fd, 1.3);
    moonLight.position.set(4, 9, 5);
    this.scene.add(moonLight);

    // 2. Warm Honey Rim Light (accentuating Aria from the right horizon)
    this.animatedObjects.rimLight = new THREE.PointLight(0xf59e0b, 2.8, 10, 1.2);
    this.animatedObjects.rimLight.position.set(-1.0, 1.9, 1.2);
    this.scene.add(this.animatedObjects.rimLight);

    // 3. Cliff Brazier Warm Flame (casting flickering warm light on Aria)
    const brazierLight = new THREE.PointLight(0xfbbf24, 1.4, 5, 1.5);
    brazierLight.position.set(-2.4, 1.1, 2.0);
    this.scene.add(brazierLight);
    this.animatedObjects.brazierLight = brazierLight;

    // 4. Deep Indigo Hemisphere Light
    const hemiLight = new THREE.HemisphereLight(0x1e1b4b, 0x064e3b, 0.75);
    this.scene.add(hemiLight);

    // 5. Subtle Ambient Fill
    const ambient = new THREE.AmbientLight(0x090d16, 0.5);
    this.scene.add(ambient);
  }

  buildForegroundOverlook() {
    const overlookGroup = new THREE.Group();

    // Rocky Overlook Cliff on the Left Flank
    const rockGeo = new THREE.CylinderGeometry(2.4, 3.8, 3.4, 9);
    const rockMat = new THREE.MeshStandardMaterial({
      color: 0x1f2937,
      roughness: 0.85,
      metalness: 0.1,
      flatShading: true,
    });
    const rockMesh = new THREE.Mesh(rockGeo, rockMat);
    rockMesh.position.set(-2.0, -1.2, 1.6);
    rockMesh.rotation.y = 0.6;
    overlookGroup.add(rockMesh);

    // Moss Top Cap
    const mossGeo = new THREE.CylinderGeometry(2.42, 2.42, 0.15, 9);
    const mossMat = new THREE.MeshStandardMaterial({
      color: 0x15803d,
      roughness: 0.95,
      metalness: 0.05,
      flatShading: true,
    });
    const mossMesh = new THREE.Mesh(mossGeo, mossMat);
    mossMesh.position.set(-2.0, 0.45, 1.6);
    overlookGroup.add(mossMesh);

    // Ancient Stone Pedestal Marker
    const pedestalGeo = new THREE.BoxGeometry(0.75, 0.22, 0.75);
    const pedestalMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.75,
      metalness: 0.2,
      flatShading: true,
    });
    const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
    pedestal.position.set(-1.75, 0.55, 1.65);
    overlookGroup.add(pedestal);

    // Stone Brazier / Beacon
    const brazierBaseGeo = new THREE.CylinderGeometry(0.18, 0.25, 0.45, 6);
    const brazierMesh = new THREE.Mesh(brazierBaseGeo, pedestalMat);
    brazierMesh.position.set(-2.45, 0.72, 1.95);
    overlookGroup.add(brazierMesh);

    // Glowing Amber Flame in Brazier
    const flameGeo = new THREE.OctahedronGeometry(0.1, 0);
    const flameMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    const flameMesh = new THREE.Mesh(flameGeo, flameMat);
    flameMesh.position.set(-2.45, 1.05, 1.95);
    overlookGroup.add(flameMesh);
    this.animatedObjects.flameMesh = flameMesh;

    // Small Flora Tufts
    for (let i = 0; i < 7; i++) {
      const angle = (i / 7) * Math.PI * 1.5 - 0.2;
      const fx = -2.0 + Math.cos(angle) * 1.7;
      const fz = 1.6 + Math.sin(angle) * 1.7;
      const floraGeo = new THREE.ConeGeometry(0.11, 0.32, 4);
      const floraMat = new THREE.MeshStandardMaterial({
        color: i % 2 === 0 ? 0x22c55e : 0xf59e0b,
        roughness: 0.8,
        flatShading: true,
      });
      const flora = new THREE.Mesh(floraGeo, floraMat);
      flora.position.set(fx, 0.58, fz);
      flora.rotation.z = (Math.random() - 0.5) * 0.3;
      overlookGroup.add(flora);
    }

    this.scene.add(overlookGroup);
  }

  buildStylizedAria() {
    const ariaGroup = new THREE.Group();
    // Positioned proudly on the lookout pedestal, facing three-quarters towards the vast Honeywood horizon
    ariaGroup.position.set(-1.75, 0.66, 1.65);
    ariaGroup.rotation.y = -Math.PI * 0.38; // Facing right toward the valley and distant citadel

    // Materials
    const dressMat = new THREE.MeshStandardMaterial({
      color: 0x7c3aed, // Royal violet
      roughness: 0.5,
      metalness: 0.2,
      flatShading: true,
    });
    const goldTrimMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24, // Bright Honey Gold
      roughness: 0.3,
      metalness: 0.8,
      flatShading: true,
    });
    const skinMat = new THREE.MeshStandardMaterial({
      color: 0xfed7aa, // Pale Peach
      roughness: 0.7,
      metalness: 0.05,
    });
    const hairMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15, // Radiant Golden Hair
      roughness: 0.4,
      metalness: 0.25,
      flatShading: true,
    });
    const crownMat = new THREE.MeshStandardMaterial({
      color: 0xfde047,
      roughness: 0.15,
      metalness: 0.9,
    });
    const gemMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4, // Cyan jewel
    });

    // 1. Skirt / Dress (Flared faceted cone)
    const skirtGeo = new THREE.ConeGeometry(0.38, 0.65, 8);
    const skirtMesh = new THREE.Mesh(skirtGeo, dressMat);
    skirtMesh.position.y = 0.32;
    ariaGroup.add(skirtMesh);
    this.animatedObjects.ariaDress = skirtMesh;

    // Golden Skirt Hem Trim Band (Fitted at base of skirt)
    const hemGeo = new THREE.CylinderGeometry(0.38, 0.39, 0.05, 8);
    const hemMesh = new THREE.Mesh(hemGeo, goldTrimMat);
    hemMesh.position.y = -0.3;
    skirtMesh.add(hemMesh);

    // 2. Torso (Bodice)
    const torsoGeo = new THREE.CylinderGeometry(0.16, 0.21, 0.34, 7);
    const torsoMesh = new THREE.Mesh(torsoGeo, dressMat);
    torsoMesh.position.y = 0.74;
    ariaGroup.add(torsoMesh);
    this.animatedObjects.ariaTorso = torsoMesh;

    // Golden Bodice Collar
    const collarGeo = new THREE.CylinderGeometry(0.17, 0.17, 0.03, 7);
    const collarMesh = new THREE.Mesh(collarGeo, goldTrimMat);
    collarMesh.position.y = 0.16;
    torsoMesh.add(collarMesh);

    // 3. Head & Neck
    const neckGeo = new THREE.CylinderGeometry(0.065, 0.075, 0.08, 6);
    const neckMesh = new THREE.Mesh(neckGeo, skinMat);
    neckMesh.position.y = 0.94;
    ariaGroup.add(neckMesh);

    const headGeo = new THREE.SphereGeometry(0.14, 8, 8);
    const headMesh = new THREE.Mesh(headGeo, skinMat);
    headMesh.position.y = 1.07;
    ariaGroup.add(headMesh);

    // 4. Golden Hair Front & Flowing Braid
    const hairFrontGeo = new THREE.SphereGeometry(0.155, 7, 7, 0, Math.PI * 2, 0, Math.PI * 0.55);
    const hairFrontMesh = new THREE.Mesh(hairFrontGeo, hairMat);
    hairFrontMesh.position.y = 1.09;
    ariaGroup.add(hairFrontMesh);

    // Flowing Long Hair (4 articulated segments cascading behind in the breeze)
    let parentHair = ariaGroup;
    let segY = 1.07;
    let segZ = -0.1;
    for (let i = 0; i < 4; i++) {
      const hairSegGeo = new THREE.ConeGeometry(0.11 - i * 0.02, 0.22, 6);
      hairSegGeo.rotateX(Math.PI);
      const hairSegMesh = new THREE.Mesh(hairSegGeo, hairMat);
      hairSegMesh.position.set(0, segY, segZ);
      parentHair.add(hairSegMesh);
      this.animatedObjects.ariaHairSegments.push(hairSegMesh);
      segY -= 0.15;
      segZ -= 0.04;
    }

    // 5. Flowing Royal Ribbon Streamers
    for (let r = 0; r < 2; r++) {
      const ribbonGeo = new THREE.PlaneGeometry(0.05, 0.38, 1, 3);
      const ribbonMat = new THREE.MeshStandardMaterial({
        color: 0x9333ea,
        side: THREE.DoubleSide,
        roughness: 0.6,
      });
      const ribbonMesh = new THREE.Mesh(ribbonGeo, ribbonMat);
      ribbonMesh.position.set((r === 0 ? -0.06 : 0.06), 1.0, -0.12);
      ariaGroup.add(ribbonMesh);
      this.animatedObjects.ariaRibbons.push(ribbonMesh);
    }

    // 6. Royal Crown & Cyan Gem
    const crownGeo = new THREE.CylinderGeometry(0.11, 0.09, 0.07, 5, 1, true);
    const crownMesh = new THREE.Mesh(crownGeo, crownMat);
    crownMesh.position.y = 1.2;
    ariaGroup.add(crownMesh);

    const gemGeo = new THREE.OctahedronGeometry(0.035, 0);
    const gemMesh = new THREE.Mesh(gemGeo, gemMat);
    gemMesh.position.set(0, 1.22, 0.1);
    ariaGroup.add(gemMesh);

    // 7. Arms (Looking out over the realm)
    const armGeo = new THREE.CylinderGeometry(0.045, 0.04, 0.32, 6);
    const leftArm = new THREE.Mesh(armGeo, dressMat);
    leftArm.position.set(-0.21, 0.7, 0.04);
    leftArm.rotation.set(0.3, 0, -0.25);
    ariaGroup.add(leftArm);

    const rightArm = new THREE.Mesh(armGeo, dressMat);
    rightArm.position.set(0.21, 0.7, 0.04);
    rightArm.rotation.set(0.3, 0, 0.25);
    ariaGroup.add(rightArm);

    this.scene.add(ariaGroup);
  }


  buildMidgroundForest() {
    const forestGroup = new THREE.Group();

    // Stylized Pine Trees placed in cascading depth tiers
    const treePositions = [
      { x: -3.2, y: -0.6, z: -1.8, h: 2.8, r: 0.8 },
      { x: -2.1, y: -1.2, z: -3.6, h: 3.4, r: 0.95 },
      { x: -4.5, y: -0.8, z: -5.2, h: 4.2, r: 1.1 },
      { x: 3.5, y: -0.9, z: -2.4, h: 3.0, r: 0.85 },
      { x: 4.8, y: -1.1, z: -4.8, h: 3.8, r: 1.0 },
      { x: 2.2, y: -1.8, z: -6.5, h: 4.5, r: 1.2 },
      { x: -0.8, y: -2.2, z: -8.0, h: 5.0, r: 1.3 },
      { x: 1.4, y: -2.4, z: -10.5, h: 5.6, r: 1.4 },
      { x: -3.6, y: -2.6, z: -12.0, h: 6.2, r: 1.5 },
      { x: 4.2, y: -2.5, z: -13.5, h: 5.8, r: 1.4 },
    ];

    const trunkMat = new THREE.MeshStandardMaterial({
      color: 0x3e2723,
      roughness: 0.9,
      flatShading: true,
    });

    const foliageColors = [0x0c381e, 0x166534, 0x064e3b, 0x1e3a8a];

    treePositions.forEach((pos, idx) => {
      const tree = new THREE.Group();
      tree.position.set(pos.x, pos.y, pos.z);
      tree.userData = { seed: idx * 0.73 };

      // Trunk
      const trunkGeo = new THREE.CylinderGeometry(0.12 * pos.r, 0.18 * pos.r, pos.h * 0.45, 6);
      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.y = pos.h * 0.225;
      tree.add(trunk);

      // Multi-tier Conical Canopy
      const tiers = 3;
      const foliageMat = new THREE.MeshStandardMaterial({
        color: foliageColors[idx % foliageColors.length],
        roughness: 0.85,
        flatShading: true,
      });

      for (let t = 0; t < tiers; t++) {
        const tierRadius = pos.r * (1.0 - t * 0.22);
        const tierHeight = pos.h * 0.35;
        const coneGeo = new THREE.ConeGeometry(tierRadius, tierHeight, 6);
        const cone = new THREE.Mesh(coneGeo, foliageMat);
        cone.position.y = pos.h * 0.35 + t * (pos.h * 0.22);
        tree.add(cone);
      }

      forestGroup.add(tree);
      this.animatedObjects.trees.push(tree);
    });

    this.scene.add(forestGroup);
  }

  buildFloatingPollen() {
    // 70 floating golden dust motes drifting upward with horizontal oscillation
    const count = 70;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const speeds = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 12;
      positions[i * 3 + 1] = Math.random() * 6 - 1.5;
      positions[i * 3 + 2] = Math.random() * 10 - 4;
      speeds[i] = 0.2 + Math.random() * 0.35;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0xfef08a,
      size: 0.075,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(geometry, material);
    this.scene.add(particles);

    this.animatedObjects.particles = particles;
    this.animatedObjects.particlePositions = positions;
    this.animatedObjects.particleSpeeds = speeds;
  }

  buildFloatingHoneyCrystals() {
    // Small floating amber octahedrons slowly bobbing in midground
    const crystalGeo = new THREE.OctahedronGeometry(0.18, 0);
    const crystalMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xd97706,
      emissiveIntensity: 0.45,
      roughness: 0.25,
      metalness: 0.8,
      flatShading: true,
    });

    const crystalCoords = [
      { x: -1.6, y: 1.4, z: 0.5 },
      { x: 2.2, y: 1.9, z: -0.8 },
      { x: -0.9, y: 2.2, z: -2.4 },
    ];

    crystalCoords.forEach((coord, i) => {
      const mesh = new THREE.Mesh(crystalGeo, crystalMat);
      mesh.position.set(coord.x, coord.y, coord.z);
      mesh.userData = { baseY: coord.y, seed: i * 1.5 };
      this.scene.add(mesh);
      this.animatedObjects.crystals.push(mesh);
    });
  }

  buildBackgroundVistas() {
    const bgGroup = new THREE.Group();

    // 1. Distant Mountain Ridge Silhouettes (Jagged Low-Poly)
    const mountainGeo = new THREE.ConeGeometry(12, 14, 5);
    const mountainMat = new THREE.MeshStandardMaterial({
      color: 0x090f1d,
      roughness: 0.95,
      flatShading: true,
    });

    const m1 = new THREE.Mesh(mountainGeo, mountainMat);
    m1.position.set(-10, -2, -26);
    m1.rotation.y = 0.5;
    bgGroup.add(m1);

    const m2 = new THREE.Mesh(mountainGeo, mountainMat);
    m2.position.set(8, -1, -28);
    m2.scale.set(1.2, 1.3, 1.2);
    m2.rotation.y = 0.8;
    bgGroup.add(m2);

    // 2. Distant Queen Bee Hive Citadel (Silhouette on the High Ridge)
    const citadelGroup = new THREE.Group();
    citadelGroup.position.set(3.2, 4.2, -25);

    // Honeycomb Spire Citadel
    const spireGeo = new THREE.CylinderGeometry(0.6, 1.8, 5.0, 6);
    const spireMat = new THREE.MeshStandardMaterial({
      color: 0x060913,
      roughness: 0.95,
      flatShading: true,
    });
    const spire = new THREE.Mesh(spireGeo, spireMat);
    citadelGroup.add(spire);

    // Glowing Amber Windows in Citadel
    const windowMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    for (let w = 0; w < 4; w++) {
      const winGeo = new THREE.BoxGeometry(0.12, 0.22, 0.12);
      const win = new THREE.Mesh(winGeo, windowMat);
      win.position.set(
        Math.sin((w / 4) * Math.PI * 2) * 0.9,
        0.5 + w * 0.6,
        Math.cos((w / 4) * Math.PI * 2) * 0.9
      );
      citadelGroup.add(win);
    }

    // Glowing Red Eyes of Queen Bee hovering atop the Citadel
    const eyeGeo = new THREE.SphereGeometry(0.045, 6, 6);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const eyeLeft = new THREE.Mesh(eyeGeo, eyeMat);
    eyeLeft.position.set(-0.12, 2.9, 0.2);
    const eyeRight = new THREE.Mesh(eyeGeo, eyeMat);
    eyeRight.position.set(0.12, 2.9, 0.2);

    citadelGroup.add(eyeLeft);
    citadelGroup.add(eyeRight);
    this.animatedObjects.hiveEyes = [eyeLeft, eyeRight];

    bgGroup.add(citadelGroup);

    // 3. Golden Dawn / Moon Celestial Disc
    const moonGeo = new THREE.CircleGeometry(4.2, 32);
    const moonMat = new THREE.MeshBasicMaterial({
      color: 0xfef08a,
      transparent: true,
      opacity: 0.9,
    });
    const moon = new THREE.Mesh(moonGeo, moonMat);
    moon.position.set(-2.5, 6.8, -32);
    bgGroup.add(moon);

    // Soft Celestial Glow Halo
    const haloGeo = new THREE.RingGeometry(4.2, 7.8, 32);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.18,
      side: THREE.DoubleSide,
    });
    const halo = new THREE.Mesh(haloGeo, haloMat);
    halo.position.set(-2.5, 6.8, -32.1);
    bgGroup.add(halo);

    this.scene.add(bgGroup);
  }

  /* -------------------------------------------------------------------------- */
  /* ANIMATION & RENDER LOOP                                                    */
  /* -------------------------------------------------------------------------- */

  start() {
    if (this.isActive) return;
    this.isActive = true;
    this.isTransitioning = false;
    this.root.style.display = 'flex';
    this.fadeOverlay.style.opacity = '0';
    this.clock.start();

    window.addEventListener('keydown', this.boundOnKeyDown);
    window.addEventListener('resize', this.boundOnResize);
    this.onResize();

    this.renderMenuOptions();
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

  loop() {
    if (!this.isActive) return;

    this.animationFrameId = requestAnimationFrame(() => this.loop());

    const dt = Math.min(this.clock.getDelta(), 0.1);
    const t = this.clock.getElapsedTime();

    this.updateAnimations(t, dt);

    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  updateAnimations(t, dt) {
    // 1. Slow, Subconscious Cinematic Camera Breathing & Drift
    this.camera.position.x = 0.3 + Math.sin(t * 0.12) * 0.22;
    this.camera.position.y = 1.95 + Math.sin(t * 0.18) * 0.06;
    this.camera.position.z = 6.0 + Math.cos(t * 0.14) * 0.18;
    this.camera.lookAt(-0.5, 1.25, -2.0);

    // 2. Princess Aria Subtle Life Animations
    // Idle breathing (chest expansion & subtle vertical position)
    if (this.animatedObjects.ariaTorso) {
      this.animatedObjects.ariaTorso.position.y = 0.72 + Math.sin(t * 2.3) * 0.012;
      this.animatedObjects.ariaTorso.scale.x = 1.0 + Math.sin(t * 2.3) * 0.02;
      this.animatedObjects.ariaTorso.scale.z = 1.0 + Math.sin(t * 2.3) * 0.02;
    }

    // Hair sway in mountain wind
    this.animatedObjects.ariaHairSegments.forEach((seg, i) => {
      seg.rotation.z = Math.sin(t * 3.4 - i * 0.45) * 0.07;
      seg.rotation.x = Math.PI + Math.cos(t * 2.8 - i * 0.4) * 0.05;
    });

    // Ribbon sway
    this.animatedObjects.ariaRibbons.forEach((rib, i) => {
      rib.rotation.z = Math.sin(t * 4.2 + i * 0.6) * 0.12;
      rib.rotation.x = Math.cos(t * 3.8 + i * 0.5) * 0.08;
    });

    // Dress subtle flutter
    if (this.animatedObjects.ariaDress) {
      this.animatedObjects.ariaDress.rotation.z = Math.sin(t * 2.5) * 0.02;
    }

    // 3. Trees Sway in Mountain Breeze
    this.animatedObjects.trees.forEach((tree) => {
      const seed = tree.userData.seed || 0;
      tree.rotation.z = Math.sin(t * 1.4 + seed) * 0.022;
      tree.rotation.x = Math.cos(t * 1.1 + seed) * 0.015;
    });

    // 4. Floating Golden Pollen Motes
    if (this.animatedObjects.particles && this.animatedObjects.particlePositions) {
      const pos = this.animatedObjects.particlePositions;
      const speeds = this.animatedObjects.particleSpeeds;
      const count = speeds.length;

      for (let i = 0; i < count; i++) {
        // Upward drift
        pos[i * 3 + 1] += speeds[i] * dt;
        // Horizontal sway
        pos[i * 3 + 0] += Math.sin(t * 1.8 + i) * 0.008;

        // Frustum wrap-around
        if (pos[i * 3 + 1] > 6.0) {
          pos[i * 3 + 1] = -1.5;
          pos[i * 3 + 0] = (Math.random() - 0.5) * 12;
        }
      }
      this.animatedObjects.particles.geometry.attributes.position.needsUpdate = true;
    }

    // 5. Honey Crystals Bobbing & Spin
    this.animatedObjects.crystals.forEach((c) => {
      c.rotation.y += dt * 0.75;
      c.rotation.x += dt * 0.4;
      c.position.y = c.userData.baseY + Math.sin(t * 2.0 + c.userData.seed) * 0.12;
    });

    // 6. Queen Bee Hive Eyes Pulsing
    if (this.animatedObjects.hiveEyes) {
      const eyePulse = 0.6 + 0.4 * Math.sin(t * 2.0);
      this.animatedObjects.hiveEyes.forEach((eye) => {
        eye.scale.setScalar(eyePulse);
      });
    }

    // 7. Subtle Rim Light Fluctuation & Brazier Flame Flicker
    if (this.animatedObjects.rimLight) {
      this.animatedObjects.rimLight.intensity = 2.6 + Math.sin(t * 1.8) * 0.25;
    }

    if (this.animatedObjects.flameMesh && this.animatedObjects.brazierLight) {
      const flicker = 1.0 + Math.sin(t * 14.0) * 0.15 + Math.cos(t * 8.3) * 0.1;
      this.animatedObjects.flameMesh.scale.set(flicker, flicker * 1.25, flicker);
      this.animatedObjects.brazierLight.intensity = 1.4 * flicker;
    }
  }

  /* -------------------------------------------------------------------------- */
  /* INTERACTIVITY & MENU NAVIGATION                                            */
  /* -------------------------------------------------------------------------- */

  onKeyDown(e) {
    if (this.isTransitioning) return;

    if (this.audio) {
      this.audio.unlock();
      this.audio.startTitleMusic();
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

    // Smooth 0.55s fade to black
    this.fadeOverlay.style.opacity = '1';

    setTimeout(() => {
      this.hide();
      if (typeof this.onStartGame === 'function') {
        this.onStartGame();
      }
    }, 560);
  }

  onResize() {
    if (!this.container || !this.renderer || !this.camera) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  destroy() {
    this.stop();
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer = null;
    }
    if (this.root && this.root.parentElement) {
      this.root.parentElement.removeChild(this.root);
    }
  }
}
