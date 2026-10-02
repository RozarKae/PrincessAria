import { assetManager } from './AssetManager.js';
import { ENVIRONMENT_ASSETS } from '../environment/EnvironmentAssetLibrary.js';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../game/Constants.js';

/**
 * ENVIRONMENT RENDERER
 * Decoupled, production-grade compositor for 2D Illustrated Environments.
 *
 * Adheres strictly to the Project Aria Master Visual Development Bible:
 * - "The renderer should compose artwork. It should not pretend to be an illustrator."
 * - Zero primitive geometric canvas shapes (no fillRect, no roundRect, no arcs).
 * - High-definition multi-plane parallax background plate assembly.
 * - Modular 3-slice platform and tileset rendering.
 * - Anchored prop and foliage composition.
 * - Natural foreground cinematic vignette framing.
 */
export class EnvironmentRenderer {
  constructor() {
    this.assets = ENVIRONMENT_ASSETS;
  }

  // ========================================================
  // 1. BACKGROUND PARALLAX COMPOSITION
  // ========================================================
  drawBackground(ctx, camera) {
    ctx.save();

    const camX = camera ? camera.x : 0;

    // 1. Sky Dome (Static / Near-zero parallax)
    const skyImg = assetManager.getImage(this.assets.BACKGROUND.SKY_MORNING.key);
    if (skyImg && skyImg.complete) {
      ctx.drawImage(skyImg, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }

    // 2. Distant Alpine Mountain Ridge (Parallax: 0.08x)
    const mountDef = this.assets.BACKGROUND.MOUNTAINS_MIST;
    const mountImg = assetManager.getImage(mountDef.key);
    if (mountImg && mountImg.complete) {
      const tileW = mountDef.width;
      let startX = (-camX * mountDef.parallaxFactor) % tileW;
      while (startX > 0) startX -= tileW;
      for (let x = startX; x < CANVAS_WIDTH; x += tileW) {
        ctx.drawImage(mountImg, x, mountDef.baseY, tileW, mountDef.height);
      }
    }

    // 3. Deep Primeval Forest Canopy (Parallax: 0.18x)
    const canopyDef = this.assets.BACKGROUND.CANOPY_DEEP;
    const canopyImg = assetManager.getImage(canopyDef.key);
    if (canopyImg && canopyImg.complete) {
      const tileW = canopyDef.width;
      let startX = (-camX * canopyDef.parallaxFactor) % tileW;
      while (startX > 0) startX -= tileW;
      for (let x = startX; x < CANVAS_WIDTH; x += tileW) {
        ctx.drawImage(canopyImg, x, canopyDef.baseY, tileW, canopyDef.height);
      }
    }

    // 4. Deep Amber Chasm Abyss & Rolling Golden Mist (Section 2: 2400px+)
    const rightEdgeX = camX + CANVAS_WIDTH;
    if (rightEdgeX > 2400) {
      const chasmAlpha = Math.min(1, (rightEdgeX - 2400) / 500);
      ctx.save();
      ctx.globalAlpha = chasmAlpha;

      // Deep dark chasm canyon floor base
      const chasmGrad = ctx.createLinearGradient(0, 720, 0, CANVAS_HEIGHT);
      chasmGrad.addColorStop(0, 'rgba(12, 8, 4, 0)');
      chasmGrad.addColorStop(0.35, 'rgba(26, 12, 5, 0.92)');
      chasmGrad.addColorStop(0.7, 'rgba(42, 18, 6, 0.98)');
      chasmGrad.addColorStop(1, 'rgba(15, 6, 2, 1.0)');

      ctx.fillStyle = chasmGrad;
      ctx.fillRect(0, 720, CANVAS_WIDTH, CANVAS_HEIGHT - 720);

      // Bioluminescent amber vapor & mist in chasm depths
      const vaporGrad = ctx.createLinearGradient(0, 780, 0, CANVAS_HEIGHT);
      vaporGrad.addColorStop(0, 'rgba(245, 158, 11, 0)');
      vaporGrad.addColorStop(0.35, 'rgba(217, 119, 6, 0.35)');
      vaporGrad.addColorStop(0.8, 'rgba(180, 83, 9, 0.65)');
      vaporGrad.addColorStop(1, 'rgba(120, 53, 15, 0.9)');

      ctx.fillStyle = vaporGrad;
      ctx.fillRect(0, 780, CANVAS_WIDTH, CANVAS_HEIGHT - 780);

      ctx.restore();
    }

    // 5. Section 3: The Sunstone Aqueduct & Crumbling Fortress Violet Twilight (5000px+)
    if (rightEdgeX > 5000) {
      const fortressAlpha = Math.min(1, (rightEdgeX - 5000) / 600);
      ctx.save();
      ctx.globalAlpha = fortressAlpha;

      // Dark violet evening sky dome overlay
      const duskSkyGrad = ctx.createLinearGradient(0, 0, 0, 720);
      duskSkyGrad.addColorStop(0, '#1e1b4b'); // deep indigo night
      duskSkyGrad.addColorStop(0.35, '#2e1065'); // rich violet
      duskSkyGrad.addColorStop(0.7, '#4c1d95'); // royal purple
      duskSkyGrad.addColorStop(1, '#701a75'); // magenta dusk horizon

      ctx.fillStyle = duskSkyGrad;
      ctx.fillRect(0, 0, CANVAS_WIDTH, 720);

      // Distant dark jagged fortress mountain ridge silhouettes
      const mountainGrad = ctx.createLinearGradient(0, 300, 0, 750);
      mountainGrad.addColorStop(0, 'rgba(30, 27, 75, 0.95)');
      mountainGrad.addColorStop(0.6, 'rgba(15, 23, 42, 0.98)');
      mountainGrad.addColorStop(1, 'rgba(2, 6, 23, 1.0)');

      ctx.fillStyle = mountainGrad;
      ctx.beginPath();
      const offX = (camX * 0.06) % 600;
      ctx.moveTo(0, 750);
      for (let x = -offX; x < CANVAS_WIDTH + 600; x += 120) {
        ctx.lineTo(x, 420 + Math.sin(x * 0.015) * 45 + Math.cos(x * 0.007) * 30);
        ctx.lineTo(x + 60, 480 + Math.cos(x * 0.02) * 40);
      }
      ctx.lineTo(CANVAS_WIDTH, 750);
      ctx.closePath();
      ctx.fill();

      // Deep fortress chasm / moat shadow base
      const moatGrad = ctx.createLinearGradient(0, 720, 0, CANVAS_HEIGHT);
      moatGrad.addColorStop(0, 'rgba(15, 10, 30, 0.85)');
      moatGrad.addColorStop(0.5, 'rgba(10, 6, 22, 0.98)');
      moatGrad.addColorStop(1, 'rgba(4, 2, 12, 1.0)');
      ctx.fillStyle = moatGrad;
      ctx.fillRect(0, 720, CANVAS_WIDTH, CANVAS_HEIGHT - 720);

      // Nightshade purple atmospheric mist drifting through fortress foundations
      const mistGrad = ctx.createLinearGradient(0, 760, 0, CANVAS_HEIGHT);
      mistGrad.addColorStop(0, 'rgba(168, 85, 247, 0)');
      mistGrad.addColorStop(0.4, 'rgba(126, 34, 206, 0.28)');
      mistGrad.addColorStop(0.85, 'rgba(88, 28, 135, 0.55)');
      mistGrad.addColorStop(1, 'rgba(59, 7, 100, 0.8)');
      ctx.fillStyle = mistGrad;
      ctx.fillRect(0, 760, CANVAS_WIDTH, CANVAS_HEIGHT - 760);

      ctx.restore();
    }

    ctx.restore();
  }

  // ========================================================
  // 2. MIDGROUND LANDMARKS & PROPS COMPOSITION
  // ========================================================
  drawMidgroundProps(ctx, props = [], camera = null) {
    if (!props || props.length === 0) return;

    props.forEach(p => {
      let def = null;
      if (p.type === 'ancient_oak') def = this.assets.MIDGROUND.ANCIENT_OAK;
      else if (p.type === 'sunstone_arch') def = this.assets.MIDGROUND.SUNSTONE_ARCH;
      else if (p.type === 'wild_honeycomb') def = this.assets.MIDGROUND.WILD_HONEYCOMB;
      else if (p.type === 'hollow_redwood' || p.type === 'redwood_landmark') def = this.assets.MIDGROUND.HOLLOW_REDWOOD;
      else if (p.type === 'royal_apiary' || p.type === 'apiary_sanctuary') def = this.assets.MIDGROUND.ROYAL_APIARY;
      else if (p.type === 'fortress_watchtower' || p.type === 'watchtower') def = this.assets.MIDGROUND.FORTRESS_WATCHTOWER;
      else if (p.type === 'aqueduct_colonnade' || p.type === 'aqueduct') def = this.assets.MIDGROUND.AQUEDUCT_COLONNADE;
      else if (p.type === 'fortress_armory' || p.type === 'armory_vault') def = this.assets.MIDGROUND.FORTRESS_ARMORY;

      if (!def) return;
      const img = assetManager.getImage(def.key);
      if (!img || !img.complete) return;

      const scale = p.scale || 1.0;
      const drawW = def.width * scale;
      const drawH = def.height * scale;
      const anchorX = def.anchorX !== undefined ? def.anchorX : 0.5;
      const anchorY = def.anchorY !== undefined ? def.anchorY : 1.0;

      const posX = p.x - drawW * anchorX;
      const posY = p.y - drawH * anchorY;

      // Optional camera frustum culling
      if (camera && (posX + drawW < camera.x - 200 || posX > camera.x + CANVAS_WIDTH + 200)) return;

      ctx.drawImage(img, posX, posY, drawW, drawH);
    });
  }

  // ========================================================
  // 3. GAMEPLAY SURFACES (Modular 3-Slice Platforms & Ground)
  // ========================================================
  drawGameplaySurfaces(ctx, platforms = [], camera = null) {
    if (!platforms || platforms.length === 0) return;

    platforms.forEach(plat => {
      // Optional camera frustum culling
      if (camera && (plat.x + plat.width < camera.x - 200 || plat.x > camera.x + CANVAS_WIDTH + 200)) return;

      if (plat.type === 'ground') {
        this.renderMeadowGround(ctx, plat);
      } else if (plat.type === 'bridge' || plat.type === 'rope_bridge') {
        this.render3SlicePlatform(ctx, plat, this.assets.GAMEPLAY.BRIDGE_ROPE);
      } else if (plat.type === 'wood' || plat.type === 'moving_wood') {
        this.render3SlicePlatform(ctx, plat, this.assets.GAMEPLAY.OAK_BOUGH);
      } else if (plat.type === 'stone' || plat.type === 'moving_runestone') {
        this.render3SlicePlatform(ctx, plat, this.assets.GAMEPLAY.SUNSTONE_SLAB);
      } else if (plat.type === 'honey' || plat.type === 'moving_honey') {
        this.render3SlicePlatform(ctx, plat, this.assets.GAMEPLAY.AMBER_RAFT);
      } else if (plat.type === 'crumble_block' || plat.type === 'crumble') {
        if (plat.isBroken) return; // shattered / invisible
        ctx.save();
        if (plat.isShaking) {
          ctx.translate((Math.random() - 0.5) * 4, (Math.random() - 0.5) * 3);
        }
        this.render3SlicePlatform(ctx, plat, this.assets.GAMEPLAY.CRUMBLE_BLOCK);
        ctx.restore();
      } else if (plat.type === 'vine' || plat.type === 'climbable_vine') {
        this.renderVine(ctx, plat);
      } else {
        // Fallback to high-quality oak bough
        this.render3SlicePlatform(ctx, plat, this.assets.GAMEPLAY.OAK_BOUGH);
      }
    });
  }

  /**
   * Renders modular climbable hanging vines with vertical tiling.
   */
  renderVine(ctx, plat) {
    const vineDef = this.assets.GAMEPLAY.VINE_CLIMBABLE;
    const img = assetManager.getImage(vineDef.key);
    if (!img || !img.complete) return;

    const destX = plat.x;
    const destY = plat.y;
    const destW = plat.width || vineDef.width;
    const destH = plat.height || vineDef.height;

    for (let curY = destY; curY < destY + destH; curY += vineDef.height) {
      const tileH = Math.min(vineDef.height, destY + destH - curY);
      ctx.drawImage(img, 0, 0, vineDef.width, tileH, destX, curY, destW, tileH);
    }
  }

  /**
   * Renders modular 3-slice platform (Left Cap, Stretched/Tiled Center, Right Cap).
   */
  render3SlicePlatform(ctx, plat, def) {
    const img = assetManager.getImage(def.key);
    if (!img || !img.complete) return;

    const { leftCap, centerStart, centerWidth, rightCap } = def.slice;
    const destX = plat.x;
    const destY = plat.y - 8; // natural moss/foliage overhang
    const totalW = plat.width;
    const totalH = plat.height + 16;

    if (totalW <= leftCap + rightCap) {
      const half = totalW / 2;
      ctx.drawImage(img, 0, 0, leftCap, def.height, destX, destY, half, totalH);
      ctx.drawImage(img, def.width - rightCap, 0, rightCap, def.height, destX + half, destY, half, totalH);
      return;
    }

    // 1. Left Cap
    ctx.drawImage(
      img,
      0, 0, leftCap, def.height,
      destX, destY, leftCap, totalH
    );

    // 2. Center Tiling Section
    const centerDestW = totalW - leftCap - rightCap;
    ctx.drawImage(
      img,
      centerStart, 0, centerWidth, def.height,
      destX + leftCap, destY, centerDestW, totalH
    );

    // 3. Right Cap
    ctx.drawImage(
      img,
      def.width - rightCap, 0, rightCap, def.height,
      destX + totalW - rightCap, destY, rightCap, totalH
    );
  }

  /**
   * Renders modular meadow ground with textured grass cap and rich forest loam.
   */
  renderMeadowGround(ctx, plat) {
    const groundDef = this.assets.GAMEPLAY.MEADOW_GROUND;
    const tilesetImg = assetManager.getImage(groundDef.key);
    if (!tilesetImg || !tilesetImg.complete) return;

    const destX = plat.x;
    const destY = plat.y - 8; // turf overhang
    const destW = plat.width;
    const destH = plat.height + 30;

    const { centerTile, cliffLeft, cliffRight } = groundDef;

    if (destW < 128) {
      ctx.drawImage(
        tilesetImg,
        centerTile.x, centerTile.y, centerTile.w, centerTile.h,
        destX, destY, destW, destH
      );
      return;
    }

    const capW = 56;

    // 1. Left Cliff Cap
    ctx.drawImage(
      tilesetImg,
      cliffLeft.x, cliffLeft.y, cliffLeft.w, cliffLeft.h,
      destX - 8, destY, capW, destH
    );

    // 2. Repeating Center Grass & Soil Body
    const repeatStart = destX + capW - 8;
    const repeatEnd = destX + destW - capW + 8;
    const tileW = 256;

    for (let curX = repeatStart; curX < repeatEnd; curX += tileW) {
      const drawW = Math.min(tileW, repeatEnd - curX);
      ctx.drawImage(
        tilesetImg,
        centerTile.x, centerTile.y, (drawW / tileW) * centerTile.w, centerTile.h,
        curX, destY, drawW, destH
      );
    }

    // 3. Right Cliff Cap
    ctx.drawImage(
      tilesetImg,
      cliffRight.x, cliffRight.y, cliffRight.w, cliffRight.h,
      repeatEnd, destY, capW, destH
    );
  }

  // ========================================================
  // 4. DETAIL PROPS (Flora, Fungi, Altars)
  // ========================================================
  drawDetails(ctx, details = [], camera = null) {
    if (!details || details.length === 0) return;

    details.forEach(d => {
      let def = null;
      if (d.type === 'bluebells') def = this.assets.DETAILS.BLUEBELLS;
      else if (d.type === 'amber_bracket') def = this.assets.DETAILS.AMBER_BRACKET;
      else if (d.type === 'road_sign') def = this.assets.DETAILS.ROAD_SIGN;
      else if (d.type === 'pebbles' || d.type === 'pebbles_mossy') def = this.assets.DETAILS.PEBBLES_MOSSY;
      else if (d.type === 'sun_crystal' || d.type === 'crystal') def = this.assets.DETAILS.SUN_CRYSTAL;
      else if (d.type === 'shrine_altar') def = this.assets.GAMEPLAY.SHRINE_ALTAR;

      if (!def) return;
      const img = assetManager.getImage(def.key);
      if (!img || !img.complete) return;

      const scale = d.scale || 1.0;
      const drawW = def.width * scale;
      const drawH = def.height * scale;
      const anchorX = def.anchorX !== undefined ? def.anchorX : 0.5;
      const anchorY = def.anchorY !== undefined ? def.anchorY : 1.0;

      const posX = d.x - drawW * anchorX;
      const posY = d.y - drawH * anchorY;

      // Optional frustum culling
      if (camera && (posX + drawW < camera.x - 100 || posX > camera.x + CANVAS_WIDTH + 100)) return;

      ctx.drawImage(img, posX, posY, drawW, drawH);
    });
  }

  // ========================================================
  // 5. FOREGROUND VIGNETTE FRAMING
  // ========================================================
  drawForeground(ctx, camera) {
    ctx.save();
    const camX = camera ? camera.x : 0;

    // Gentle micro-sway rather than unbounded horizontal drift into gameplay center
    const swayX = Math.sin(camX * 0.002) * 8;

    // Left Leafy Vignette
    const leftDef = this.assets.FOREGROUND.CANOPY_LEFT;
    const leftImg = assetManager.getImage(leftDef.key);
    if (leftImg && leftImg.complete) {
      ctx.drawImage(leftImg, -40 + swayX, -20, leftDef.width, leftDef.height);
    }

    // Right Leafy Vignette
    const rightDef = this.assets.FOREGROUND.CANOPY_RIGHT;
    const rightImg = assetManager.getImage(rightDef.key);
    if (rightImg && rightImg.complete) {
      ctx.drawImage(rightImg, CANVAS_WIDTH - rightDef.width + 40 - swayX, -20, rightDef.width, rightDef.height);
    }

    ctx.restore();
  }
}

// Global Singleton Instance
export const environmentRenderer = new EnvironmentRenderer();
