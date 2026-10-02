/**
 * Centralized High-Definition Asset Manager.
 * Responsibilities:
 * - Preload and cache all high-resolution images, SVG vectors, and sprite sheets.
 * - Zero runtime allocations: Never recreates Image elements during render frames.
 * - Vite-compatible automated discovery via import.meta.glob with manual URL fallback.
 * - Asset readiness tracking and cache query APIs.
 */
export class AssetManager {
  constructor() {
    this.images = new Map();
    this.loadingPromises = [];
    this.totalAssets = 0;
    this.loadedAssets = 0;
    this.isReady = false;
  }

  /**
   * Preload an image from a URL or relative path and cache it.
   * @param {string} key Unique identifier for the asset
   * @param {string} src Image URL or path
   * @returns {Promise<HTMLImageElement>}
   */
  loadImage(key, src) {
    if (this.images.has(key)) {
      const existing = this.images.get(key);
      if (!existing || existing.complete || existing instanceof HTMLCanvasElement) {
        return Promise.resolve(existing);
      }
      return new Promise((resolve) => {
        const timeout = setTimeout(() => resolve(existing), 5000);
        existing.addEventListener('load', () => { clearTimeout(timeout); resolve(existing); }, { once: true });
        existing.addEventListener('error', () => { clearTimeout(timeout); resolve(existing); }, { once: true });
      });
    }

    this.totalAssets++;
    const img = new Image();
    if (src.startsWith('http://') || src.startsWith('https://')) {
      img.crossOrigin = 'anonymous';
    }
    // Cache immediately so getFrameSequence finds elements synchronously
    this.images.set(key, img);

    const promise = new Promise((resolve) => {
      const timeout = setTimeout(() => {
        console.warn(`[AssetManager] Image load timed out after 10s: ${src} for key: ${key}`);
        resolve(img);
      }, 10000);

      img.onload = () => {
        clearTimeout(timeout);
        this.loadedAssets++;
        resolve(img);
      };

      img.onerror = (err) => {
        clearTimeout(timeout);
        console.warn(`[AssetManager] Failed to load image: ${src} for key: ${key}`, err);
        // Create an emergency 1x1 transparent or fallback graphic
        const fallbackCanvas = document.createElement('canvas');
        fallbackCanvas.width = 64;
        fallbackCanvas.height = 64;
        const ctx = fallbackCanvas.getContext('2d');
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(0, 0, 64, 64);
        this.images.set(key, fallbackCanvas);
        this.loadedAssets++;
        resolve(fallbackCanvas);
      };

      img.src = src;
    });

    this.loadingPromises.push(promise);
    return promise;
  }

  /**
   * Automatically discovers and preloads all Princess Aria frame assets.
   */
  async preloadAriaAssets() {
    // 1. Check if Vite's import.meta.glob is available
    let globFiles = null;
    try {
      globFiles = import.meta.glob('/src/assets/**/*.{svg,png,webp}', {
        eager: true,
        query: '?url',
        import: 'default',
      });
    } catch {
      globFiles = null;
    }

    if (globFiles && Object.keys(globFiles).length > 0) {
      for (const [filePath, url] of Object.entries(globFiles)) {
        if (filePath.includes('master_model_sheet') || filePath.includes('scale_test')) continue;
        // Normalize key, e.g., 'characters/aria/walk/frame_0' or 'art/worlds/honeywood/backgrounds/honeywood_bg_sky_01'
        const cleanKey = filePath
          .replace(/\\/g, '/')
          .replace(/^.*?assets\//, '')
          .replace(/\.(svg|png|webp)$/, '');
        this.loadImage(cleanKey, url);
      }
    } else {
      // Fallback: manually load known generated frames (production & legacy)
      const anims = {
        idle: 8,
        walk: 8,
        run: 10,
        jump_start: 4,
        jump_rise: 4,
        fall: 4,
        land: 5,
        crouch: 4,
        dash: 6,
        hurt: 4,
        death: 8,
        victory: 10,
      };

      for (const [anim, count] of Object.entries(anims)) {
        for (let i = 0; i < count; i++) {
          const prodKey = `art/characters/aria/animation/${anim}/frame_${i}`;
          const prodUrl = `/src/assets/art/characters/aria/animation/${anim}/frame_${i}.svg`;
          this.loadImage(prodKey, prodUrl);

          const legacyKey = `characters/aria/${anim}/frame_${i}`;
          const legacyUrl = `/src/assets/characters/aria/${anim}/frame_${i}.svg`;
          this.loadImage(legacyKey, legacyUrl);
        }
      }

      // Master reference art & expressions
      const masterFiles = ['front_view', 'three_quarter_front_view', 'side_view', 'three_quarter_back_view', 'back_view', 'master_character_sheet'];
      masterFiles.forEach(f => {
        this.loadImage(`art/characters/aria/master/${f}`, `/src/assets/art/characters/aria/master/${f}.svg`);
      });

      const exprFiles = ['expression_neutral', 'expression_smile', 'expression_determined', 'expression_surprised', 'expression_worried', 'expression_angry_focused'];
      exprFiles.forEach(e => {
        this.loadImage(`art/characters/aria/master/${e}`, `/src/assets/art/characters/aria/master/${e}.svg`);
      });

      // Illustrated 2D Rig Layers (Princess Aria v2.0)
      const layerFiles = [
        'face', 'eyes', 'hair_front', 'hair_back', 'crown', 'earrings', 'ribbon',
        'torso_front', 'torso_back', 'shoulder_L', 'shoulder_R',
        'skirt_front', 'skirt_side_L', 'skirt_side_R', 'skirt_back', 'ribbon_flow',
        'upper_arm_L', 'forearm_L', 'hand_L', 'upperarm_R', 'forearm_R', 'hand_R',
        'thigh_L', 'lower_leg_L', 'foot_L', 'thigh_R', 'lower_leg_R', 'foot_R',
        'tail_base', 'tail_mid', 'tail_tip', 'tail_ribbon',
        'ribbon_L', 'ribbon_R', 'waist_jewel', 'thigh_jewel_L', 'thigh_jewel_R'
      ];
      layerFiles.forEach(layer => {
        this.loadImage(`art/characters/aria/layers/${layer.toLowerCase()}`, `/src/assets/art/characters/aria/layers/${layer}.png`);
      });
    }

    // Preload Approved Illustrated Master Character Plates
    const approvedMasterPlates = [
      'aria_master_front_transparent',
      'aria_master_turnaround_transparent',
      'aria_master_front_view',
      'aria_master_three_quarter_view',
      'aria_master_side_view',
      'aria_master_back_view'
    ];
    const priorityPromises = [];
    for (const plate of approvedMasterPlates) {
      priorityPromises.push(this.loadImage(`art/characters/aria/master/${plate}`, `/src/assets/art/characters/aria/master/${plate}.png`));
    }

    // Preload Approved Illustrated Mouth Expression Assets
    const mouthExpressions = ['neutral', 'smile', 'surprised', 'hurt'];
    for (const expr of mouthExpressions) {
      priorityPromises.push(this.loadImage(`art/characters/aria/layers/mouth_${expr}`, `/src/assets/art/characters/aria/layers/mouth_${expr}.png`));
    }

    // Explicitly await the critical illustrated master plates so they are guaranteed complete
    await Promise.allSettled(priorityPromises);

    const safetyTimeout = new Promise((resolve) => setTimeout(resolve, 3000));
    await Promise.race([Promise.allSettled(this.loadingPromises), safetyTimeout]);
    this.isReady = true;
    console.log(`[AssetManager] Preloaded ${this.images.size} HD assets successfully. Master plates verified ready.`);
  }

  /**
   * Retrieve cached image or canvas element.
   * @param {string} key
   * @returns {HTMLImageElement | HTMLCanvasElement | null}
   */
  getImage(key) {
    return this.images.get(key) || null;
  }

  /**
   * Retrieve an array of frames for an animation.
   * @param {string} character e.g. 'aria'
   * @param {string} animation e.g. 'walk'
   * @param {number} count Total frames to find
   * @returns {Array<HTMLImageElement>}
   */
  getFrameSequence(character, animation, count) {
    const frames = [];
    for (let i = 0; i < count; i++) {
      // Prioritize production art path
      const prodKey = `art/characters/${character}/animation/${animation}/frame_${i}`;
      const legacyKey = `characters/${character}/${animation}/frame_${i}`;
      const img = this.getImage(prodKey) || this.getImage(legacyKey);
      if (img) {
        frames.push(img);
      }
    }
    return frames;
  }

  get progress() {
    return this.totalAssets > 0 ? this.loadedAssets / this.totalAssets : 1;
  }
}

// Global singleton instance for easy access across renderers and entities
export const assetManager = new AssetManager();
if (typeof window !== 'undefined') {
  window.assetManager = assetManager;
}
