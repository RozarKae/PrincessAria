import { GAME_STATES } from '../game/Constants.js';
import { INTERNAL_WIDTH, INTERNAL_HEIGHT, WORLD_TO_PIXEL, PIXEL_PALETTE } from '../renderer/PixelPalette.js';
import { ANIM_STATES } from '../animation/AnimationController.js';
import { CinematicSequence } from './CinematicSequence.js';
import { CinematicScene } from './CinematicScene.js';
import { CinematicLayer } from './CinematicLayer.js';
import { CinematicSprite } from './CinematicSprite.js';
import { CinematicPortal, PORTAL_PHASES } from './CinematicPortal.js';
import { CinematicDialogue, WORLD_LORE } from './CinematicDialogue.js';

const P = PIXEL_PALETTE;
const VIEW_W = INTERNAL_WIDTH / WORLD_TO_PIXEL; // 1440
const VIEW_H = INTERNAL_HEIGHT / WORLD_TO_PIXEL; // 1080

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function smoothstep(e0, e1, x) {
  const t = clamp((x - e0) / Math.max(0.0001, e1 - e0), 0, 1);
  return t * t * (3 - 2 * t);
}

/**
 * Master Pixel-Art Cinematic Director for Project Aria.
 * Orchestrates authored intro and outro sequences with authentic pixel-art
 * frame animation, layered depth occlusion, dimensional portals, and safe lifecycles.
 */
export class CinematicDirector {
  constructor() {
    this.activeSequence = null;
    this.dialogue = new CinematicDialogue();
    this.letterboxHeight = 18; // 18px pixel letterbox
    this.letterboxAlpha = 0;
    this.fadeAlpha = 0;
    this.fadeColor = '#000000';
    this.hasCompleted = false;
  }

  // ========================================================
  // INTRO SEQUENCE CREATION (7 PHASES)
  // ========================================================
  startIntro(game) {
    this.hasCompleted = false;
    const spawn = game.level.spawnPoint;
    const worldNum = game.gameState.world || 1;
    const lore = WORLD_LORE[worldNum] || WORLD_LORE[1];

    const groundY = spawn.y + (game.player?.height || 84);
    // Dimensional portal stands firmly on the grass platform
    const portalX = spawn.x - 70;
    const portalY = groundY;

    const portal = new CinematicPortal(portalX, portalY);
    const ariaSprite = new CinematicSprite({
      name: 'aria',
      frames: ['jump_rise'],
      fps: 6,
      loop: true,
      x: portalX,
      y: groundY,
      worldSpace: true,
      facing: 1,
      visible: false,
    });

    // Hide gameplay player during intro
    game.player.visible = false;
    game.player.x = spawn.x;
    game.player.y = spawn.y;
    game.player.vx = 0;
    game.player.vy = 0;
    game.player.isGrounded = true;

    // Position camera near spawn
    game.camera.focusInstantly(spawn.x + 80, spawn.y - 120);

    const seq = new CinematicSequence('WORLD_INTRO');

    // ----------------------------------------------------
    // PHASE 1: BLACK / ATMOSPHERE (0.75s)
    // ----------------------------------------------------
    const scene1 = new CinematicScene({
      name: 'PHASE_1_ATMOSPHERE',
      duration: 0.75,
      onStart: () => {
        this.letterboxAlpha = 1.0;
        this.fadeAlpha = 1.0;
        this.dialogue.hide();
        if (game.audio?.unlock) game.audio.unlock();
      },
      onUpdate: (dt, g, s) => {
        this.fadeAlpha = Math.max(0, 1.0 - (s.elapsed / s.duration));
      },
    });
    seq.addScene(scene1);

    // ----------------------------------------------------
    // PHASE 2: WORLD REVEAL (1.2s)
    // ----------------------------------------------------
    const scene2 = new CinematicScene({
      name: 'PHASE_2_WORLD_REVEAL',
      duration: 1.2,
      onStart: () => {
        this.fadeAlpha = 0;
      },
      cameraMotion: (cam, s, dt) => {
        // Subtle establishing pan
        const targetX = spawn.x + 40;
        const targetY = spawn.y - 120;
        cam.x += (targetX - cam.width / 2 - cam.x) * (0.04 * dt * 60);
        cam.y += (targetY - cam.height / 2 - cam.y) * (0.04 * dt * 60);
      },
    });
    seq.addScene(scene2);

    // ----------------------------------------------------
    // PHASE 3: PORTAL MANIFESTATION (1.5s)
    // ----------------------------------------------------
    const scene3 = new CinematicScene({
      name: 'PHASE_3_PORTAL',
      duration: 1.5,
      onStart: () => {
        portal.setPhase(PORTAL_PHASES.SPARK);
      },
      onUpdate: (dt, g, s) => {
        if (s.elapsed > 0.4 && portal.phase === PORTAL_PHASES.SPARK) {
          portal.setPhase(PORTAL_PHASES.OPENING);
        }
      },
    });
    scene3.addAudioCue(0.35, 'portal-open');

    // Add portal layers
    const p3BackLayer = new CinematicLayer('portal_back', 10);
    p3BackLayer.add({ draw: (ctx, cx, cy) => portal.drawBack(ctx, cx, cy), update: (dt) => portal.update(dt) });
    const p3FrontLayer = new CinematicLayer('portal_front', 30);
    p3FrontLayer.add({ draw: (ctx, cx, cy) => portal.drawFront(ctx, cx, cy) });
    scene3.addLayer(p3BackLayer);
    scene3.addLayer(p3FrontLayer);
    seq.addScene(scene3);

    // ----------------------------------------------------
    // PHASE 4: ARIA ENTRY (1.5s)
    // ----------------------------------------------------
    const scene4 = new CinematicScene({
      name: 'PHASE_4_ARIA_ENTRY',
      duration: 1.5,
      onStart: () => {
        portal.setPhase(PORTAL_PHASES.ACTIVE);
        ariaSprite.visible = true;
        ariaSprite.facing = 1;
        ariaSprite.setAnimation(['jump_rise'], 8, false);
      },
      onUpdate: (dt, g, s) => {
        const progress = s.elapsed / s.duration;
        // Flight arc from portal exit to landing position
        ariaSprite.x = lerp(portalX, spawn.x, smoothstep(0, 1, progress));
        // Parabolic trajectory (leaping out of portal, arcing up, descending)
        const arcY = Math.sin(progress * Math.PI) * 44;
        ariaSprite.y = groundY - arcY;

        // Switch to fall frame after apex
        if (progress > 0.52 && ariaSprite.currentFrameKey !== 'fall') {
          ariaSprite.setAnimation(['fall'], 8, false);
        }
      },
      cameraMotion: (cam, s, dt) => {
        const targetX = ariaSprite.x + 40;
        const targetY = ariaSprite.y - 120;
        cam.x += (targetX - cam.width / 2 - cam.x) * (0.08 * dt * 60);
        cam.y += (targetY - cam.height / 2 - cam.y) * (0.08 * dt * 60);
      },
    });
    scene4.addAudioCue(0.05, 'arrival');

    const p4BackLayer = new CinematicLayer('portal_back', 10);
    p4BackLayer.add({ draw: (ctx, cx, cy) => portal.drawBack(ctx, cx, cy), update: (dt) => portal.update(dt) });
    const p4AriaLayer = new CinematicLayer('aria_mid', 20);
    p4AriaLayer.add(ariaSprite);
    const p4FrontLayer = new CinematicLayer('portal_front', 30);
    p4FrontLayer.add({ draw: (ctx, cx, cy) => portal.drawFront(ctx, cx, cy) });

    scene4.addLayer(p4BackLayer);
    scene4.addLayer(p4AriaLayer);
    scene4.addLayer(p4FrontLayer);
    seq.addScene(scene4);

    // ----------------------------------------------------
    // PHASE 5: LANDING & IDLE (1.1s)
    // ----------------------------------------------------
    const scene5 = new CinematicScene({
      name: 'PHASE_5_LANDING',
      duration: 1.1,
      onStart: () => {
        ariaSprite.x = spawn.x;
        ariaSprite.y = groundY;
        ariaSprite.setAnimation(['land'], 8, false);
        portal.setPhase(PORTAL_PHASES.CLOSING);
        if (game.level?.spawnDust) {
          game.level.spawnDust(spawn.x, spawn.y, 6);
        }
      },
      onUpdate: (dt, g, s) => {
        if (s.elapsed > 0.35 && ariaSprite.currentFrameKey === 'land') {
          ariaSprite.setAnimation(['idle_0', 'idle_1', 'idle_2', 'idle_3'], 6, true);
        }
      },
    });
    scene5.addAudioCue(0.02, 'land');
    scene5.addAudioCue(0.4, 'portal-close');

    const p5BackLayer = new CinematicLayer('portal_back', 10);
    p5BackLayer.add({ draw: (ctx, cx, cy) => portal.drawBack(ctx, cx, cy), update: (dt) => portal.update(dt) });
    const p5AriaLayer = new CinematicLayer('aria_mid', 20);
    p5AriaLayer.add(ariaSprite);
    const p5FrontLayer = new CinematicLayer('portal_front', 30);
    p5FrontLayer.add({ draw: (ctx, cx, cy) => portal.drawFront(ctx, cx, cy) });

    scene5.addLayer(p5BackLayer);
    scene5.addLayer(p5AriaLayer);
    scene5.addLayer(p5FrontLayer);
    seq.addScene(scene5);

    // ----------------------------------------------------
    // PHASE 6: STORY & LORE (2.8s)
    // ----------------------------------------------------
    const scene6 = new CinematicScene({
      name: 'PHASE_6_STORY',
      duration: 2.8,
      onStart: () => {
        ariaSprite.setAnimation(['idle_0', 'idle_1', 'idle_2', 'idle_3'], 6, true);
        this.dialogue.show(lore.title, lore.introLines);
      },
    });
    const p6AriaLayer = new CinematicLayer('aria_mid', 20);
    p6AriaLayer.add(ariaSprite);
    scene6.addLayer(p6AriaLayer);
    seq.addScene(scene6);

    // ----------------------------------------------------
    // PHASE 7: GAMEPLAY HANDOFF (0.5s)
    // ----------------------------------------------------
    const scene7 = new CinematicScene({
      name: 'PHASE_7_HANDOFF',
      duration: 0.5,
      onStart: () => {
        this.dialogue.hide();
      },
      onUpdate: (dt, g, s) => {
        this.letterboxAlpha = Math.max(0, 1.0 - (s.elapsed / s.duration));
      },
    });
    const p7AriaLayer = new CinematicLayer('aria_mid', 20);
    p7AriaLayer.add(ariaSprite);
    scene7.addLayer(p7AriaLayer);
    seq.addScene(scene7);

    // Sequence completion hook
    seq.onSequenceComplete = () => {
      this.completeIntro(game);
    };

    seq.onSequenceSkip = () => {
      this.completeIntro(game);
    };

    this.activeSequence = seq;
    seq.start(game);
  }

  completeIntro(game) {
    if (this.hasCompleted) return;
    this.hasCompleted = true;

    this.dialogue.hide();
    this.letterboxAlpha = 0;
    this.fadeAlpha = 0;
    this.activeSequence = null;

    // Restore gameplay player
    const spawn = game.level.spawnPoint;
    game.player.visible = true;
    game.player.x = spawn.x;
    game.player.y = spawn.y;
    game.player.vx = 0;
    game.player.vy = 0;
    game.player.isGrounded = true;
    game.player.isVictorious = false;
    game.player.facing = 1;
    game.player.anim.setFacing(1);
    game.player.anim.play(ANIM_STATES.IDLE, true);

    // Restore camera tracking cleanly onto player
    game.camera.resetCinematic(game.player);

    // Transition authoritative game state
    game.state = GAME_STATES.PLAYING;
  }

  // ========================================================
  // OUTRO SEQUENCE CREATION
  // ========================================================
  startOutro(game) {
    this.hasCompleted = false;
    const worldNum = game.gameState.world || 1;
    const lore = WORLD_LORE[worldNum] || WORLD_LORE[1];

    const groundY = game.player.y + (game.player?.height || 84);
    const startX = game.player.x;
    const startY = groundY;
    const portalX = startX + 130;
    const portalY = groundY;

    const portal = new CinematicPortal(portalX, portalY);
    const ariaSprite = new CinematicSprite({
      name: 'aria',
      frames: ['victory'],
      fps: 6,
      loop: true,
      x: startX,
      y: groundY,
      worldSpace: true,
      facing: 1,
      visible: true,
    });

    // Hide gameplay player entity so animated cinematic sprite drives visual
    game.player.visible = false;
    game.camera.focusInstantly(startX + 80, startY - 110);

    const seq = new CinematicSequence('WORLD_OUTRO');

    // ----------------------------------------------------
    // PHASE 1: VICTORY POSE (1.5s)
    // ----------------------------------------------------
    const scene1 = new CinematicScene({
      name: 'OUTRO_1_VICTORY',
      duration: 1.5,
      onStart: () => {
        this.letterboxAlpha = 1.0;
        this.fadeAlpha = 0;
        ariaSprite.setAnimation(['victory'], 6, true);
        if (game.audio?.playLevelComplete) game.audio.playLevelComplete();
      },
    });
    const s1Layer = new CinematicLayer('aria_mid', 20);
    s1Layer.add(ariaSprite);
    scene1.addLayer(s1Layer);
    seq.addScene(scene1);

    // ----------------------------------------------------
    // PHASE 2: STORY & SANCTUARY / BATBOY FREED (2.2s)
    // ----------------------------------------------------
    const scene2 = new CinematicScene({
      name: 'OUTRO_2_RESCUE_LORE',
      duration: 2.2,
      onStart: () => {
        ariaSprite.setAnimation(['idle_0', 'idle_1', 'idle_2', 'idle_3'], 6, true);
        this.dialogue.show(lore.outroTitle, lore.outroLines);
        if (game.level?.batboy) {
          game.level.batboy.isRescued = true;
        }
        if (game.level?.spawnSparkles) {
          game.level.spawnSparkles(startX + 60, startY - 40, 14);
        }
      },
    });
    scene2.addAudioCue(0.1, 'shatter');
    const s2Layer = new CinematicLayer('aria_mid', 20);
    s2Layer.add(ariaSprite);
    scene2.addLayer(s2Layer);
    seq.addScene(scene2);

    // ----------------------------------------------------
    // PHASE 3: PORTAL MANIFESTATION (1.2s)
    // ----------------------------------------------------
    const scene3 = new CinematicScene({
      name: 'OUTRO_3_PORTAL_OPEN',
      duration: 1.2,
      onStart: () => {
        this.dialogue.hide();
        portal.setPhase(PORTAL_PHASES.OPENING);
      },
      cameraMotion: (cam, s, dt) => {
        const targetX = startX + 90;
        const targetY = startY - 110;
        cam.x += (targetX - cam.width / 2 - cam.x) * (0.06 * dt * 60);
        cam.y += (targetY - cam.height / 2 - cam.y) * (0.06 * dt * 60);
      },
    });
    scene3.addAudioCue(0.2, 'portal-open');

    const s3BackLayer = new CinematicLayer('portal_back', 10);
    s3BackLayer.add({ draw: (ctx, cx, cy) => portal.drawBack(ctx, cx, cy), update: (dt) => portal.update(dt) });
    const s3AriaLayer = new CinematicLayer('aria_mid', 20);
    s3AriaLayer.add(ariaSprite);
    const s3FrontLayer = new CinematicLayer('portal_front', 30);
    s3FrontLayer.add({ draw: (ctx, cx, cy) => portal.drawFront(ctx, cx, cy) });

    scene3.addLayer(s3BackLayer);
    scene3.addLayer(s3AriaLayer);
    scene3.addLayer(s3FrontLayer);
    seq.addScene(scene3);

    // ----------------------------------------------------
    // PHASE 4: ARIA AUTHORED WALK TOWARD PORTAL (2.0s)
    // ----------------------------------------------------
    const scene4 = new CinematicScene({
      name: 'OUTRO_4_ARIA_WALK',
      duration: 2.0,
      onStart: () => {
        portal.setPhase(PORTAL_PHASES.ACTIVE);
        ariaSprite.facing = 1;
        // Real 4-frame authored walking gait!
        ariaSprite.setAnimation(['walk_0', 'walk_1', 'walk_2', 'walk_3'], 8, true);
      },
      onUpdate: (dt, g, s) => {
        const progress = s.elapsed / s.duration;
        // Walk smoothly toward the portal threshold
        ariaSprite.x = lerp(startX, portalX - 6, progress);
        ariaSprite.y = startY;
      },
      cameraMotion: (cam, s, dt) => {
        const targetX = ariaSprite.x + 40;
        const targetY = ariaSprite.y - 110;
        cam.x += (targetX - cam.width / 2 - cam.x) * (0.08 * dt * 60);
        cam.y += (targetY - cam.height / 2 - cam.y) * (0.08 * dt * 60);
      },
    });

    const s4BackLayer = new CinematicLayer('portal_back', 10);
    s4BackLayer.add({ draw: (ctx, cx, cy) => portal.drawBack(ctx, cx, cy), update: (dt) => portal.update(dt) });
    const s4AriaLayer = new CinematicLayer('aria_mid', 20);
    s4AriaLayer.add(ariaSprite);
    const s4FrontLayer = new CinematicLayer('portal_front', 30);
    s4FrontLayer.add({ draw: (ctx, cx, cy) => portal.drawFront(ctx, cx, cy) });

    scene4.addLayer(s4BackLayer);
    scene4.addLayer(s4AriaLayer);
    scene4.addLayer(s4FrontLayer);
    seq.addScene(scene4);

    // ----------------------------------------------------
    // PHASE 5: PORTAL ENTRY & DEPTH OCCLUSION (1.0s)
    // ----------------------------------------------------
    const scene5 = new CinematicScene({
      name: 'OUTRO_5_PORTAL_ENTRY',
      duration: 1.0,
      onStart: () => {
        ariaSprite.x = portalX - 4;
        ariaSprite.setAnimation(['walk_0', 'walk_1', 'walk_2', 'walk_3'], 8, true);
      },
      onUpdate: (dt, g, s) => {
        const progress = s.elapsed / s.duration;
        ariaSprite.x = lerp(portalX - 4, portalX + 8, progress);
        // Dissolve into the event horizon
        ariaSprite.opacity = Math.max(0, 1.0 - progress * 1.5);
      },
    });
    scene5.addAudioCue(0.1, 'arrival');

    const s5BackLayer = new CinematicLayer('portal_back', 10);
    s5BackLayer.add({ draw: (ctx, cx, cy) => portal.drawBack(ctx, cx, cy), update: (dt) => portal.update(dt) });
    const s5AriaLayer = new CinematicLayer('aria_mid', 20);
    s5AriaLayer.add(ariaSprite);
    const s5FrontLayer = new CinematicLayer('portal_front', 30);
    s5FrontLayer.add({ draw: (ctx, cx, cy) => portal.drawFront(ctx, cx, cy) });

    scene5.addLayer(s5BackLayer);
    scene5.addLayer(s5AriaLayer);
    scene5.addLayer(s5FrontLayer);
    seq.addScene(scene5);

    // ----------------------------------------------------
    // PHASE 6: PORTAL CLOSE & FADE (1.0s)
    // ----------------------------------------------------
    const scene6 = new CinematicScene({
      name: 'OUTRO_6_SEAL_AND_FADE',
      duration: 1.0,
      onStart: () => {
        ariaSprite.visible = false;
        portal.setPhase(PORTAL_PHASES.CLOSING);
      },
      onUpdate: (dt, g, s) => {
        if (s.elapsed > 0.4) {
          this.fadeAlpha = Math.min(1.0, (s.elapsed - 0.4) / 0.5);
        }
      },
    });
    scene6.addAudioCue(0.1, 'portal-close');

    const s6BackLayer = new CinematicLayer('portal_back', 10);
    s6BackLayer.add({ draw: (ctx, cx, cy) => portal.drawBack(ctx, cx, cy), update: (dt) => portal.update(dt) });
    const s6FrontLayer = new CinematicLayer('portal_front', 30);
    s6FrontLayer.add({ draw: (ctx, cx, cy) => portal.drawFront(ctx, cx, cy) });

    scene6.addLayer(s6BackLayer);
    scene6.addLayer(s6FrontLayer);
    seq.addScene(scene6);

    // Outro completion hooks
    seq.onSequenceComplete = () => {
      this.completeOutro(game);
    };

    seq.onSequenceSkip = () => {
      this.completeOutro(game);
    };

    this.activeSequence = seq;
    seq.start(game);
  }

  completeOutro(game) {
    if (this.hasCompleted) return;
    this.hasCompleted = true;

    this.dialogue.hide();
    this.letterboxAlpha = 0;
    this.fadeAlpha = 0;
    this.activeSequence = null;

    game.player.visible = true;
    game.player.isVictorious = false;
    game.player.anim.play(ANIM_STATES.IDLE, true);
    game.camera.resetCinematic(game.player);

    // Advance to next world cleanly
    game.advanceToNextWorld();
  }

  skip(game) {
    if (this.activeSequence) {
      this.activeSequence.skip(game);
    } else if (game.state === GAME_STATES.WORLD_INTRO) {
      this.completeIntro(game);
    } else if (game.state === GAME_STATES.WORLD_OUTRO) {
      this.completeOutro(game);
    }
  }

  update(dt, input, game) {
    if (input?.justPressed('JUMP') || input?.justPressed('SHOOT') || input?.justPressed('START')) {
      this.skip(game);
      return;
    }

    if (this.activeSequence) {
      this.activeSequence.update(dt, input, game);
    }

    this.dialogue.update(dt);
  }

  draw(ctx, game) {
    const camX = game.camera ? game.camera.x : 0;
    const camY = game.camera ? game.camera.y : 0;

    // 1. Draw Active Sequence Layers (Portals, Sprites, Shimmer)
    if (this.activeSequence) {
      this.activeSequence.draw(ctx, camX, camY);
    }

    // 2. Draw Cinematic Letterbox Bars
    if (this.letterboxAlpha > 0) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, this.letterboxAlpha));
      ctx.fillStyle = '#090d16';
      // Top bar
      ctx.fillRect(0, 0, INTERNAL_WIDTH, this.letterboxHeight);
      // Bottom bar
      ctx.fillRect(0, INTERNAL_HEIGHT - this.letterboxHeight, INTERNAL_WIDTH, this.letterboxHeight);

      // Gold border trim
      ctx.fillStyle = P.HONEY_AMBER;
      ctx.fillRect(0, this.letterboxHeight - 1, INTERNAL_WIDTH, 1);
      ctx.fillRect(0, INTERNAL_HEIGHT - this.letterboxHeight, INTERNAL_WIDTH, 1);
      ctx.restore();
    }

    // 3. Draw Dialogue / Lore Box
    this.dialogue.draw(ctx);

    // 4. Draw Screen Fade
    if (this.fadeAlpha > 0) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, this.fadeAlpha));
      ctx.fillStyle = this.fadeColor;
      ctx.fillRect(0, 0, INTERNAL_WIDTH, INTERNAL_HEIGHT);
      ctx.restore();
    }
  }
}
