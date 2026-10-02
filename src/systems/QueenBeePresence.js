import { assetManager } from '../renderer/AssetManager.js';

/**
 * QUEEN BEE PRESENCE SYSTEM
 * Reusable Antagonist Presence & Cinematic Director.
 * Manages environmental storytelling events where the Evil Queen Bee looms
 * over the world without halting player gameplay for too long.
 * 
 * Features:
 * - Ambient disturbance (wind rush, fleeing insects, spores)
 * - Massive distant background silhouette
 * - Glowing compound ruby/amber eyes
 * - Batboy Captive Chrysalis Reveal
 * - Dynamic camera shake & audio triggers
 */
export class QueenBeePresence {
  constructor() {
    this.active = false;
    this.timer = 0;
    this.totalDuration = 5.2;

    // Entity Positions & Animations
    this.shadowX = 0;
    this.queenX = 0;
    this.queenY = 0;
    this.chrysalisX = 0;
    this.chrysalisY = 0;
    this.eyeAlpha = 0;
    this.chrysalisAlpha = 0;
    this.wingFlapPhase = 0;

    // Narrative flags
    this.batboyRevealed = false;
    this.buzzTriggered = false;
  }

  /**
   * Trigger the World 1-1 climax presence event.
   */
  triggerEvent(triggerX, triggerY, audio, camera) {
    if (this.active) return;
    this.active = true;
    this.timer = 0;
    this.shadowX = triggerX - 400;
    this.queenX = triggerX + 250;
    this.queenY = 120;
    this.chrysalisX = triggerX + 380;
    this.chrysalisY = 80;
    this.eyeAlpha = 0;
    this.chrysalisAlpha = 0;
    this.batboyRevealed = false;
    this.buzzTriggered = false;

    // 1. Initial screen rumble & appearance audio
    if (camera) camera.shake(14, 2.5);
    if (audio) {
      if (audio.playQueenBeeAppearance) audio.playQueenBeeAppearance();
      if (audio.playQueenBeeBuzz) audio.playQueenBeeBuzz();
    }
  }

  update(dt, player, camera, audio) {
    if (!this.active) return;
    this.timer += dt;
    this.wingFlapPhase += dt * 18;

    // 1. Shadow sweeps across the ground
    this.shadowX += 340 * dt;

    // 2. Queen Bee distant flight path
    this.queenX += 45 * dt;
    this.queenY = 120 + Math.sin(this.timer * 2) * 20;

    // 3. Batboy Chrysalis Reveal (around t = 1.2s to 3.8s)
    if (this.timer >= 1.2 && !this.batboyRevealed) {
      this.batboyRevealed = true;
      if (audio && audio.playBatboyReveal) {
        audio.playBatboyReveal();
      }
    }

    if (this.timer >= 1.0 && this.timer <= 3.8) {
      this.chrysalisAlpha = Math.min(1, this.chrysalisAlpha + dt * 2);
      this.eyeAlpha = Math.min(1, this.eyeAlpha + dt * 2.5);
    } else {
      this.chrysalisAlpha = Math.max(0, this.chrysalisAlpha - dt * 1.5);
      this.eyeAlpha = Math.max(0, this.eyeAlpha - dt * 1.8);
    }

    // 4. Climax Drone Buzz
    if (this.timer >= 2.5 && !this.buzzTriggered) {
      this.buzzTriggered = true;
      if (audio && audio.playQueenBeeBuzz) audio.playQueenBeeBuzz();
      if (camera) camera.shake(8, 1.2);
    }

    // 5. Complete event
    if (this.timer >= this.totalDuration) {
      this.active = false;
    }
  }

  /**
   * Draw distant Queen Bee silhouette, Batboy chrysalis, and sweeping shadow.
   */
  draw(ctx, camera) {
    if (!this.active) return;

    ctx.save();

    // 1. Draw Giant Sweeping Shadow in Foreground / Playable Area
    const shadowAlpha = Math.sin((this.timer / this.totalDuration) * Math.PI) * 0.45;
    ctx.fillStyle = `rgba(15, 23, 42, ${shadowAlpha})`;
    ctx.beginPath();
    ctx.ellipse(this.shadowX, 740, 360, 95, -0.05, 0, Math.PI * 2);
    ctx.fill();

    // 2. Draw Distant Queen Bee Monarch in Midground / Distant Canopy
    const queenImg = assetManager.getImage('worlds/honeywood/effects/queen_bee_monarch');
    const qW = 420;
    const qH = 336;
    const qAlpha = Math.sin((this.timer / this.totalDuration) * Math.PI) * 0.88;

    ctx.globalAlpha = qAlpha;
    if (queenImg && queenImg.complete) {
      ctx.drawImage(queenImg, this.queenX - qW / 2, this.queenY - qH / 2, qW, qH);
    } else {
      // Vector silhouette fallback
      ctx.fillStyle = '#0f0804';
      ctx.beginPath();
      ctx.ellipse(this.queenX, this.queenY, 140, 110, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. Glowing Ruby/Amber Compound Eyes
    if (this.eyeAlpha > 0) {
      ctx.globalAlpha = this.eyeAlpha * qAlpha;
      const eyeImg = assetManager.getImage('worlds/honeywood/effects/queen_bee_eyes');
      if (eyeImg && eyeImg.complete) {
        ctx.drawImage(eyeImg, this.queenX - 45, this.queenY - 30, 90, 48);
      } else {
        ctx.fillStyle = '#ef4444';
        ctx.shadowColor = '#fbbf24';
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.ellipse(this.queenX - 18, this.queenY - 14, 8, 12, 0, 0, Math.PI * 2);
        ctx.ellipse(this.queenX + 18, this.queenY - 14, 8, 12, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 4. BATBOY REVEAL: Suspended Amber Crystal Chrysalis
    if (this.chrysalisAlpha > 0) {
      ctx.globalAlpha = this.chrysalisAlpha;
      const chrysalisImg = assetManager.getImage('worlds/honeywood/effects/batboy_chrysalis');
      const cW = 160;
      const cH = 228;

      if (chrysalisImg && chrysalisImg.complete) {
        ctx.drawImage(chrysalisImg, this.chrysalisX - cW / 2, this.chrysalisY, cW, cH);
      } else {
        // Fallback faceted crystal
        ctx.fillStyle = 'rgba(251, 191, 36, 0.8)';
        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(this.chrysalisX, this.chrysalisY);
        ctx.lineTo(this.chrysalisX + 45, this.chrysalisY + 70);
        ctx.lineTo(this.chrysalisX, this.chrysalisY + 160);
        ctx.lineTo(this.chrysalisX - 45, this.chrysalisY + 70);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }

      // Story Banner Prompt: "BATBOY IS ALIVE!"
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 14;
      ctx.fillStyle = '#fef08a';
      ctx.font = 'bold 22px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('⚡ BATBOY IS ALIVE! ⚡', this.chrysalisX, this.chrysalisY + cH + 32);
    }

    ctx.restore();
  }
}
