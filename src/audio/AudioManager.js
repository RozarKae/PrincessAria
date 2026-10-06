/**
 * AudioManager
 * High-definition procedural Web Audio API sound synthesizer and dynamic audio engine.
 * Provides original retro-modern sound effects and procedural background themes synthesized in code.
 * Zero external audio files required.
 * 
 * Features:
 * - Browser-safe AudioContext lifecycle (unlock on first user interaction, idempotent init, resume handling)
 * - Structured Master Audio Bus (Sources -> Category Gains [SFX/Music] -> Master Gain -> Destination)
 * - Master Volume control with localStorage persistence
 * - Reliable Mute toggle with state persistence and previous volume restoration
 * - Biome-aware procedural BGM with Title, Glade, Canopy, and Fortress chord voicings
 * - Full suite of synthesized game SFX: Jump, Land, Bounce, Dash, Attack, Collect, Hit, Stomp,
 *   Defeat, Checkpoint, Secret Discovery, Hurt, Death, Victory Fanfare, Crumble, Boss sounds, Menu SFX
 */

const STORAGE_KEY_VOLUME = 'aria_audio_master_volume';
const STORAGE_KEY_MUTED = 'aria_audio_muted';

function loadStoredVolume() {
  try {
    const val = localStorage.getItem(STORAGE_KEY_VOLUME);
    if (val !== null) {
      const num = parseFloat(val);
      if (!Number.isNaN(num) && num >= 0 && num <= 1) return num;
    }
  } catch (e) {}
  return 0.5; // Default comfortable listening volume
}

function loadStoredMuted() {
  try {
    const val = localStorage.getItem(STORAGE_KEY_MUTED);
    if (val !== null) {
      return val === 'true';
    }
  } catch (e) {}
  return false;
}

function saveStoredVolume(vol) {
  try {
    localStorage.setItem(STORAGE_KEY_VOLUME, String(vol));
  } catch (e) {}
}

function saveStoredMuted(muted) {
  try {
    localStorage.setItem(STORAGE_KEY_MUTED, String(muted));
  } catch (e) {}
}

export class AudioManager {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.sfxGain = null;
    this.musicGain = null;

    this.masterVolume = loadStoredVolume();
    this.isMuted = loadStoredMuted();

    // Music & Ambience dynamic procedural state
    this.bgmPlaying = false;
    this.bgmTimer = null;
    this.bgmStep = 0;
    this.stepIndex = 0;
    this.nextStepTime = 0;
    this.currentBiome = 'glade';
    this.currentScene = 'glade';
    this.targetScene = 'glade';
    this.currentIntensity = 0.2;
    this.targetIntensity = 0.2;
    this.specialMode = 'normal'; // 'normal' | 'secret' | 'cinematic' | 'climax'
    this.currentTempo = 112;
    this.targetTempo = 112;

    this.musicPadGain = null;
    this.musicBassGain = null;
    this.musicLeadGain = null;
    this.musicArpGain = null;
    this.musicDrumsGain = null;
    this.noiseBuffer = null;

    this.unlocked = false;
    this.audioBlocked = false;
  }

  // ========================================================
  // LIFECYCLE & MASTER BUS INITIALIZATION
  // ========================================================

  init() {
    return this.ensureReady();
  }

  /**
   * Idempotent check/creation of the AudioContext and Master Audio Bus.
   * Never recreates an existing AudioContext.
   * Returns true if AudioContext is available, false if blocked or unsupported.
   */
  ensureReady() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return true;
    }

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) {
        if (!this.audioBlocked) {
          console.warn('[AudioManager] Web Audio API is not supported in this browser.');
          this.audioBlocked = true;
        }
        return false;
      }

      this.ctx = new AudioCtx();

      // Master output chain:
      // Sources -> Category Gains (SFX / Music) -> Master Gain -> AudioContext.destination
      this.masterGain = this.ctx.createGain();
      const effectiveVol = this.isMuted ? 0 : this.masterVolume;
      this.masterGain.gain.setValueAtTime(effectiveVol, this.ctx.currentTime);
      this.masterGain.gain.value = effectiveVol;
      this.masterGain.connect(this.ctx.destination);

      // SFX Category Gain (connects to Master)
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(0.85, this.ctx.currentTime);
      this.sfxGain.gain.value = 0.85;
      this.sfxGain.connect(this.masterGain);

      // Music Category Gain (connects to Master)
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
      this.musicGain.gain.value = 0.35;
      this.musicGain.connect(this.masterGain);

      // Dedicated Music Sub-Busses for Scene-Wise Dynamic Mix Elevation
      this.musicPadGain = this.ctx.createGain();
      this.musicPadGain.gain.setValueAtTime(0.28, this.ctx.currentTime);
      this.musicPadGain.gain.value = 0.28;
      this.musicPadGain.connect(this.musicGain);

      this.musicBassGain = this.ctx.createGain();
      this.musicBassGain.gain.setValueAtTime(0.30, this.ctx.currentTime);
      this.musicBassGain.gain.value = 0.30;
      this.musicBassGain.connect(this.musicGain);

      this.musicLeadGain = this.ctx.createGain();
      this.musicLeadGain.gain.setValueAtTime(0.24, this.ctx.currentTime);
      this.musicLeadGain.gain.value = 0.24;
      this.musicLeadGain.connect(this.musicGain);

      this.musicArpGain = this.ctx.createGain();
      this.musicArpGain.gain.setValueAtTime(0.18, this.ctx.currentTime);
      this.musicArpGain.gain.value = 0.18;
      this.musicArpGain.connect(this.musicGain);

      this.musicDrumsGain = this.ctx.createGain();
      this.musicDrumsGain.gain.setValueAtTime(0.0, this.ctx.currentTime); // Starts silent, elevates in combat / climax
      this.musicDrumsGain.gain.value = 0.0;
      this.musicDrumsGain.connect(this.musicGain);

      if (!this.noiseBuffer) {
        const bufferSize = this.ctx.sampleRate;
        this.noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = this.noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
      }

      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }

      this.audioBlocked = false;
      return true;
    } catch (err) {
      if (!this.audioBlocked) {
        console.warn('[AudioManager] Failed to initialize AudioContext:', err);
        this.audioBlocked = true;
      }
      return false;
    }
  }

  /**
   * Unlocks audio after a valid user gesture (click, tap, or keydown).
   * Resumes suspended AudioContext if needed.
   */
  unlock() {
    this.unlocked = true;
    const ready = this.ensureReady();
    if (ready && this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return ready;
  }

  isAvailable() {
    return !!(this.ctx && this.ctx.state === 'running');
  }

  // ========================================================
  // VOLUME & MUTE CONTROLS
  // ========================================================

  setMasterVolume(value) {
    const clamped = Math.max(0, Math.min(1, Number(value) || 0));
    this.masterVolume = clamped;
    saveStoredVolume(clamped);

    if (this.ctx && this.masterGain) {
      const target = this.isMuted ? 0 : this.masterVolume;
      this.masterGain.gain.setValueAtTime(target, this.ctx.currentTime);
      this.masterGain.gain.value = target;
    }
    return this.masterVolume;
  }

  getMasterVolume() {
    return this.masterVolume;
  }

  setMusicVolume(value) {
    const clamped = Math.max(0, Math.min(1, Number(value) || 0));
    if (this.ctx && this.musicGain) {
      this.musicGain.gain.setValueAtTime(clamped, this.ctx.currentTime);
      this.musicGain.gain.value = clamped;
    }
  }

  getMusicVolume() {
    return this.musicGain ? this.musicGain.gain.value : 0.35;
  }

  setSfxVolume(value) {
    const clamped = Math.max(0, Math.min(1, Number(value) || 0));
    if (this.ctx && this.sfxGain) {
      this.sfxGain.gain.setValueAtTime(clamped, this.ctx.currentTime);
      this.sfxGain.gain.value = clamped;
    }
  }

  getSfxVolume() {
    return this.sfxGain ? this.sfxGain.gain.value : 0.85;
  }

  toggleMute() {
    return this.setMuted(!this.isMuted);
  }

  setMuted(muted) {
    this.isMuted = Boolean(muted);
    saveStoredMuted(this.isMuted);

    if (this.ctx && this.masterGain) {
      const targetGain = this.isMuted ? 0 : this.masterVolume;
      this.masterGain.gain.setValueAtTime(targetGain, this.ctx.currentTime);
      this.masterGain.gain.value = targetGain;
    }
    return this.isMuted;
  }

  setBiome(biome) {
    if (this.currentBiome !== biome) {
      this.currentBiome = biome;
      console.log(`[AudioManager] Biome modulated to: ${biome}`);
    }
  }

  // ========================================================
  // 1. PLAYER JUMP SFX (Crisp energetic upward swoop)
  // ========================================================
  playJump() {
    if (!this.ensureReady() || this.isMuted) return;
    const now = this.ctx.currentTime;

    try {
      // Main melodic chirp
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.exponentialRampToValueAtTime(680, now + 0.12);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.15);

      // Harmonic sparkle overtone
      const oscHarm = this.ctx.createOscillator();
      const gainHarm = this.ctx.createGain();
      oscHarm.type = 'sine';
      oscHarm.frequency.setValueAtTime(520, now);
      oscHarm.frequency.exponentialRampToValueAtTime(1360, now + 0.1);

      gainHarm.gain.setValueAtTime(0.18, now);
      gainHarm.gain.exponentialRampToValueAtTime(0.005, now + 0.12);

      oscHarm.connect(gainHarm);
      gainHarm.connect(this.sfxGain);
      oscHarm.start(now);
      oscHarm.stop(now + 0.12);
    } catch (e) {}
  }

  // ========================================================
  // 1B. PLAYER DOUBLE JUMP SFX (Celestial starlight flutter)
  // ========================================================
  playDoubleJump() {
    if (!this.ensureReady() || this.isMuted) return;
    const now = this.ctx.currentTime;

    try {
      // 1. Ascending celestial flutter arpeggio (sweeping 380Hz -> 960Hz)
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(380, now);
      osc.frequency.exponentialRampToValueAtTime(960, now + 0.14);

      gain.gain.setValueAtTime(0.32, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.16);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.16);

      // 2. Twin fairy wing flutter overtone (760Hz -> 1920Hz)
      const oscWing = this.ctx.createOscillator();
      const gainWing = this.ctx.createGain();
      oscWing.type = 'sine';
      oscWing.frequency.setValueAtTime(760, now + 0.02);
      oscWing.frequency.exponentialRampToValueAtTime(1920, now + 0.15);

      gainWing.gain.setValueAtTime(0.22, now + 0.02);
      gainWing.gain.exponentialRampToValueAtTime(0.005, now + 0.16);

      oscWing.connect(gainWing);
      gainWing.connect(this.sfxGain);
      oscWing.start(now + 0.02);
      oscWing.stop(now + 0.16);

      // 3. Stardust chime sparkle (2640Hz high glint)
      const chime = this.ctx.createOscillator();
      const chimeGain = this.ctx.createGain();
      chime.type = 'sine';
      chime.frequency.setValueAtTime(2640, now + 0.04);
      chime.frequency.exponentialRampToValueAtTime(3520, now + 0.18);

      chimeGain.gain.setValueAtTime(0.18, now + 0.04);
      chimeGain.gain.exponentialRampToValueAtTime(0.002, now + 0.18);

      chime.connect(chimeGain);
      chimeGain.connect(this.sfxGain);
      chime.start(now + 0.04);
      chime.stop(now + 0.18);
    } catch (e) {}
  }

  // ========================================================
  // 2. PLAYER LAND SFX (Deep cushioned thud)
  // ========================================================
  playLand() {
    if (!this.ensureReady() || this.isMuted) return;
    const now = this.ctx.currentTime;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(38, now + 0.09);

      gain.gain.setValueAtTime(0.28, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.1);
    } catch (e) {}
  }

  // ========================================================
  // 2B. AMBER NECTAR RAFT BOUNCE SFX (Springy harmonic launch)
  // ========================================================
  playBounce() {
    if (!this.ensureReady() || this.isMuted) return;
    const now = this.ctx.currentTime;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(740, now + 0.16);

      gain.gain.setValueAtTime(0.38, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.22);

      // Warm sub overtone for gelatinous elasticity
      const sub = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      sub.type = 'sine';
      sub.frequency.setValueAtTime(110, now);
      sub.frequency.exponentialRampToValueAtTime(370, now + 0.12);

      subGain.gain.setValueAtTime(0.24, now);
      subGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

      sub.connect(subGain);
      subGain.connect(this.sfxGain);
      sub.start(now);
      sub.stop(now + 0.15);
    } catch (e) {}
  }

  // ========================================================
  // 3. HONEY-SILK ROYAL DASH SFX (Enchanted wind rush & soft sparkle)
  // ========================================================
  playDash() {
    if (!this.ensureReady() || this.isMuted) return;
    const now = this.ctx.currentTime;

    try {
      // Soft silk wind rush
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.18);

      // Warm bandpass filter
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(800, now);
      filter.frequency.exponentialRampToValueAtTime(320, now + 0.18);
      filter.Q.setValueAtTime(2.0, now);

      gain.gain.setValueAtTime(0.32, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.2);

      // Golden sparkle bell flourish
      const bellOsc = this.ctx.createOscillator();
      const bellGain = this.ctx.createGain();
      bellOsc.type = 'sine';
      bellOsc.frequency.setValueAtTime(1174.66, now); // D6
      bellOsc.frequency.exponentialRampToValueAtTime(1760, now + 0.15); // A6
      bellGain.gain.setValueAtTime(0.18, now);
      bellGain.gain.exponentialRampToValueAtTime(0.005, now + 0.16);

      bellOsc.connect(bellGain);
      bellGain.connect(this.sfxGain);
      bellOsc.start(now);
      bellOsc.stop(now + 0.16);
    } catch (e) {}
  }

  // ========================================================
  // 4. ROYAL STARDUST BURST SFX (Enchanted blade swish & starlight shimmer)
  // ========================================================
  playAttack() {
    if (!this.ensureReady() || this.isMuted) return;
    const now = this.ctx.currentTime;

    try {
      // Resonant silver blade swish
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(987.77, now); // B5
      osc.frequency.exponentialRampToValueAtTime(246.94, now + 0.14); // B3

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.15);

      // Starlight crystal chime overtone
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1567.98, now); // G6
      osc2.frequency.exponentialRampToValueAtTime(783.99, now + 0.18); // G5

      gain2.gain.setValueAtTime(0.22, now);
      gain2.gain.exponentialRampToValueAtTime(0.005, now + 0.18);

      osc2.connect(gain2);
      gain2.connect(this.sfxGain);
      osc2.start(now);
      osc2.stop(now + 0.18);
    } catch (e) {}
  }

  // Backward compatibility alias
  playEnemyAttack() {
    this.playAttack();
  }

  // ========================================================
  // 4B. ROYAL STARBEAM SFX (Radiant celestial beam & starlight shot)
  // ========================================================
  playStarshot() {
    if (!this.ensureReady() || this.isMuted) return;
    const now = this.ctx.currentTime;

    try {
      // 1. Initial launch pulse (punchy low-mid transient)
      const pulseOsc = this.ctx.createOscillator();
      const pulseGain = this.ctx.createGain();
      pulseOsc.type = 'triangle';
      pulseOsc.frequency.setValueAtTime(440, now);
      pulseOsc.frequency.exponentialRampToValueAtTime(160, now + 0.06);

      pulseGain.gain.setValueAtTime(0.28, now);
      pulseGain.gain.exponentialRampToValueAtTime(0.005, now + 0.07);

      pulseOsc.connect(pulseGain);
      pulseGain.connect(this.sfxGain);
      pulseOsc.start(now);
      pulseOsc.stop(now + 0.07);

      // 2. Rising celestial starlight beam sweep (D6 -> D7)
      const beamOsc = this.ctx.createOscillator();
      const beamGain = this.ctx.createGain();
      beamOsc.type = 'triangle';
      beamOsc.frequency.setValueAtTime(1174.66, now);
      beamOsc.frequency.exponentialRampToValueAtTime(2349.32, now + 0.12);

      beamGain.gain.setValueAtTime(0.32, now);
      beamGain.gain.exponentialRampToValueAtTime(0.01, now + 0.14);

      beamOsc.connect(beamGain);
      beamGain.connect(this.sfxGain);
      beamOsc.start(now);
      beamOsc.stop(now + 0.14);

      // 3. High crystal chime flourish (A7 sparkle)
      const chimeOsc = this.ctx.createOscillator();
      const chimeGain = this.ctx.createGain();
      chimeOsc.type = 'sine';
      chimeOsc.frequency.setValueAtTime(3520, now);
      chimeOsc.frequency.exponentialRampToValueAtTime(1760, now + 0.16);

      chimeGain.gain.setValueAtTime(0.18, now);
      chimeGain.gain.exponentialRampToValueAtTime(0.002, now + 0.16);

      chimeOsc.connect(chimeGain);
      chimeGain.connect(this.sfxGain);
      chimeOsc.start(now);
      chimeOsc.stop(now + 0.16);
    } catch (e) {}
  }

  // ========================================================
  // 4C. STARBEAM IMPACT SFX (Starlight burst & crystal shatter)
  // ========================================================
  playStarHit() {
    if (!this.ensureReady() || this.isMuted) return;
    const now = this.ctx.currentTime;

    try {
      // Impact thud
      const thudOsc = this.ctx.createOscillator();
      const thudGain = this.ctx.createGain();
      thudOsc.type = 'sine';
      thudOsc.frequency.setValueAtTime(240, now);
      thudOsc.frequency.exponentialRampToValueAtTime(65, now + 0.09);

      thudGain.gain.setValueAtTime(0.35, now);
      thudGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

      thudOsc.connect(thudGain);
      thudGain.connect(this.sfxGain);
      thudOsc.start(now);
      thudOsc.stop(now + 0.1);

      // Bright celestial dispersion chime
      const shatterOsc = this.ctx.createOscillator();
      const shatterGain = this.ctx.createGain();
      shatterOsc.type = 'triangle';
      shatterOsc.frequency.setValueAtTime(1760, now);
      shatterOsc.frequency.exponentialRampToValueAtTime(587.33, now + 0.15);

      shatterGain.gain.setValueAtTime(0.24, now);
      shatterGain.gain.exponentialRampToValueAtTime(0.005, now + 0.16);

      shatterOsc.connect(shatterGain);
      shatterGain.connect(this.sfxGain);
      shatterOsc.start(now);
      shatterOsc.stop(now + 0.16);
    } catch (e) {}
  }

  // ========================================================
  // 4D. SHIELD / ARMOR DEFLECTION SFX (Metallic ricochet clink)
  // ========================================================
  playDeflect() {
    if (!this.ensureReady() || this.isMuted) return;
    const now = this.ctx.currentTime;

    try {
      // High metallic chime clink (C7)
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'square';
      osc1.frequency.setValueAtTime(2093, now);
      osc1.frequency.exponentialRampToValueAtTime(1046.5, now + 0.08);

      gain1.gain.setValueAtTime(0.22, now);
      gain1.gain.exponentialRampToValueAtTime(0.005, now + 0.09);

      osc1.connect(gain1);
      gain1.connect(this.sfxGain);
      osc1.start(now);
      osc1.stop(now + 0.09);

      // Secondary overtone (G7 harmonic ricochet)
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(3135.96, now);
      osc2.frequency.exponentialRampToValueAtTime(1567.98, now + 0.1);

      gain2.gain.setValueAtTime(0.28, now);
      gain2.gain.exponentialRampToValueAtTime(0.002, now + 0.11);

      osc2.connect(gain2);
      gain2.connect(this.sfxGain);
      osc2.start(now);
      osc2.stop(now + 0.11);
    } catch (e) {}
  }

  // ========================================================
  // 5. COLLECT ROYAL ENERGY SHARD SFX (Ethereal crystal chime)
  // ========================================================
  playCollect() {
    if (!this.ensureReady() || this.isMuted) return;
    const now = this.ctx.currentTime;

    try {
      const notes = [1046.5, 1318.51, 1567.98, 2093.0]; // C6, E6, G6, C7 arpeggio
      notes.forEach((freq, i) => {
        const t = now + i * 0.04;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.24, t);
        gain.gain.exponentialRampToValueAtTime(0.005, t + 0.28);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.28);
      });
    } catch (e) {}
  }

  playCoin() {
    this.playCollect();
  }

  // ========================================================
  // 6. ENEMY HIT / BOUNCE STOMP SFX (Crunchy impact burst)
  // ========================================================
  playEnemyHit() {
    if (!this.ensureReady() || this.isMuted) return;
    const now = this.ctx.currentTime;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(60, now + 0.14);

      gain.gain.setValueAtTime(0.42, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.15);
    } catch (e) {}
  }

  playStomp() {
    this.playEnemyHit();
  }

  playHit() {
    this.playEnemyHit();
  }

  // ========================================================
  // 7. ENEMY DEFEATED SFX (Ascending triumphant synth burst)
  // ========================================================
  playEnemyDefeat() {
    if (!this.ensureReady() || this.isMuted) return;
    const now = this.ctx.currentTime;

    try {
      const chord = [440, 554.37, 659.25, 880];
      chord.forEach((f, i) => {
        const t = now + i * 0.035;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, t);
        osc.frequency.exponentialRampToValueAtTime(f * 1.6, t + 0.15);

        gain.gain.setValueAtTime(0.25, t);
        gain.gain.exponentialRampToValueAtTime(0.005, t + 0.18);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.18);
      });
    } catch (e) {}
  }

  // ========================================================
  // 8. SUNSTONE SHRINE ACTIVATION SFX (Resonant cathedral chime)
  // ========================================================
  playCheckpoint() {
    if (!this.ensureReady() || this.isMuted) return;
    const now = this.ctx.currentTime;

    try {
      const chord = [392, 587.33, 783.99, 1174.66]; // G4, D5, G5, D6
      chord.forEach((freq, idx) => {
        const t = now + idx * 0.06;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.05, t + 0.5);

        gain.gain.setValueAtTime(0.28, t);
        gain.gain.exponentialRampToValueAtTime(0.005, t + 0.6);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.6);
      });
    } catch (e) {}
  }

  // ========================================================
  // 8B. SECRET DISCOVERY SFX (Mystical ascending harmonic chimes)
  // ========================================================
  playSecretDiscovery() {
    if (!this.ensureReady() || this.isMuted) return;
    const now = this.ctx.currentTime;

    try {
      const notes = [587.33, 739.99, 880.00, 1174.66, 1479.98]; // D5, F#5, A5, D6, F#6
      notes.forEach((freq, i) => {
        const t = now + i * 0.055;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.005, t + 0.45);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.45);
      });
    } catch (e) {}
  }

  // ========================================================
  // 9. DAMAGE / HURT SFX (Heavy static glitch distortion)
  // ========================================================
  playDamage() {
    if (!this.ensureReady() || this.isMuted) return;
    const now = this.ctx.currentTime;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(280, now);
      osc.frequency.exponentialRampToValueAtTime(65, now + 0.28);

      gain.gain.setValueAtTime(0.45, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.3);
    } catch (e) {}
  }

  playHurt() {
    this.playDamage();
  }

  // ========================================================
  // 10. DEATH SFX (Descending mournful glitch chords)
  // ========================================================
  playDeath() {
    if (!this.ensureReady() || this.isMuted) return;
    const now = this.ctx.currentTime;

    try {
      const notes = [440, 370, 311.13, 220, 146.83];
      notes.forEach((freq, i) => {
        const t = now + i * 0.12;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.32, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.24);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.24);
      });
    } catch (e) {}
  }

  // ========================================================
  // 11. LEVEL COMPLETE / RESCUE FANFARE
  // ========================================================
  playLevelComplete() {
    if (!this.ensureReady() || this.isMuted) return;
    const now = this.ctx.currentTime;

    try {
      // Grand heroic brass fanfare (C major / G major cadence)
      const melody = [
        { f: 523.25, d: 0.14 }, // C5
        { f: 659.25, d: 0.14 }, // E5
        { f: 783.99, d: 0.14 }, // G5
        { f: 1046.5, d: 0.28 }, // C6
        { f: 880.00, d: 0.16 }, // A5
        { f: 1046.5, d: 0.65 }, // C6 hold
      ];

      let t = now;
      melody.forEach(note => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(note.f, t);

        gain.gain.setValueAtTime(0.35, t);
        gain.gain.exponentialRampToValueAtTime(0.005, t + note.d);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + note.d);
        t += note.d * 0.9;
      });
    } catch (e) {}
  }

  playVictory() {
    this.playLevelComplete();
  }

  // ========================================================
  // 12. UI & MENU SOUNDS
  // ========================================================
  playStart() {
    if (!this.ensureReady() || this.isMuted) return;
    const now = this.ctx.currentTime;

    try {
      const chord = [440, 554.37, 659.25, 880];
      chord.forEach((freq, i) => {
        const t = now + i * 0.06;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.28, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.35);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.35);
      });
    } catch (e) {}
  }

  playMenuHover() {
    if (!this.ensureReady() || this.isMuted) return;
    const now = this.ctx.currentTime;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(1174.66, now + 0.05);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.005, now + 0.06);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.06);
    } catch (e) {}
  }

  playMenuSelect() {
    if (!this.ensureReady() || this.isMuted) return;
    const now = this.ctx.currentTime;

    try {
      const chord = [523.25, 659.25, 783.99]; // C5, E5, G5
      chord.forEach((f, i) => {
        const t = now + i * 0.03;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, t);

        gain.gain.setValueAtTime(0.25, t);
        gain.gain.exponentialRampToValueAtTime(0.005, t + 0.15);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.15);
      });
    } catch (e) {}
  }

  // ========================================================
  // 13. ENEMY ALERT / THREAT WARNING SFX
  // ========================================================
  playEnemyAlert() {
    if (!this.ensureReady() || this.isMuted) return;
    const now = this.ctx.currentTime;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.1);
    } catch (e) {}
  }

  // ========================================================
  // 14. QUEEN BEE BOSS EVENTS
  // ========================================================
  playQueenBeeAppearance() {
    if (!this.ensureReady() || this.isMuted) return;
    const now = this.ctx.currentTime;

    try {
      const subOsc = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(60, now);
      subOsc.frequency.linearRampToValueAtTime(40, now + 2.5);

      subGain.gain.setValueAtTime(0.45, now);
      subGain.gain.exponentialRampToValueAtTime(0.01, now + 2.8);

      subOsc.connect(subGain);
      subGain.connect(this.sfxGain);
      subOsc.start(now);
      subOsc.stop(now + 2.8);
    } catch (e) {}
  }

  playQueenBeeBuzz() {
    if (!this.ensureReady() || this.isMuted) return;
    const now = this.ctx.currentTime;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(75, now);
      osc.frequency.linearRampToValueAtTime(58, now + 1.8);

      gain.gain.setValueAtTime(0.28, now);
      gain.gain.exponentialRampToValueAtTime(0.005, now + 2.0);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 2.0);
    } catch (e) {}
  }

  playBatboyReveal() {
    if (!this.ensureReady() || this.isMuted) return;
    const now = this.ctx.currentTime;

    try {
      const freqs = [329.63, 392.00, 493.88, 659.25, 987.77];
      freqs.forEach((freq, idx) => {
        const t = now + idx * 0.08;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.25, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 1.0);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 1.0);
      });
    } catch (e) {}
  }

  // ========================================================
  // CRUMBLE PLATFORM SFX (Granite fracture & stone shatter)
  // ========================================================
  playCrumble() {
    if (!this.ensureReady() || this.isMuted) return;
    const now = this.ctx.currentTime;

    try {
      // Low resonant stone crunch
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(110, now);
      osc.frequency.exponentialRampToValueAtTime(35, now + 0.28);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.005, now + 0.3);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.3);

      // High crumbling pebble clatter
      for (let i = 0; i < 3; i++) {
        const t = now + i * 0.06;
        const clatterOsc = this.ctx.createOscillator();
        const clatterGain = this.ctx.createGain();
        clatterOsc.type = 'triangle';
        clatterOsc.frequency.setValueAtTime(420 + Math.random() * 200, t);
        clatterOsc.frequency.exponentialRampToValueAtTime(120, t + 0.08);

        clatterGain.gain.setValueAtTime(0.18, t);
        clatterGain.gain.exponentialRampToValueAtTime(0.005, t + 0.08);

        clatterOsc.connect(clatterGain);
        clatterGain.connect(this.sfxGain);
        clatterOsc.start(t);
        clatterOsc.stop(t + 0.08);
      }
    } catch (e) {}
  }

  // ========================================================
  // HONEY GEYSER UPDRAFT SFX (Rushing wind & golden chimes)
  // ========================================================
  playGeyser() {
    if (!this.ensureReady() || this.isMuted) return;
    const now = this.ctx.currentTime;
    try {
      // Powerful rushing vertical wind whoosh
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(840, now + 0.35);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.005, now + 0.4);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.4);

      // Golden sparkle chime burst
      for (let i = 0; i < 3; i++) {
        const t = now + 0.05 + i * 0.08;
        const chime = this.ctx.createOscillator();
        const chimeGain = this.ctx.createGain();
        chime.type = 'triangle';
        chime.frequency.setValueAtTime(880 + i * 220, t);
        chime.frequency.exponentialRampToValueAtTime(1400 + i * 200, t + 0.12);

        chimeGain.gain.setValueAtTime(0.2, t);
        chimeGain.gain.exponentialRampToValueAtTime(0.005, t + 0.12);

        chime.connect(chimeGain);
        chimeGain.connect(this.sfxGain);
        chime.start(t);
        chime.stop(t + 0.12);
      }
    } catch (e) {}
  }

  // ========================================================
  // 15. DYNAMIC SCENE-ELEVATING PROCEDURAL MUSIC ENGINE
  // Multi-track Web Audio synthesis engine with scene-wise
  // chord progressions, dynamic tempo scaling, bassline drive,
  // lead motifs, sparkling arpeggios, and adaptive battle drums.
  // ========================================================

  setBiome(biome) {
    this.updateDynamicBGM(biome);
  }

  updateTempoForScene(scene) {
    if (typeof SCENE_THEMES !== 'undefined' && SCENE_THEMES[scene] && SCENE_THEMES[scene].tempo) {
      this.targetTempo = SCENE_THEMES[scene].tempo;
      return;
    }
    switch (scene) {
      case 'title':
        this.targetTempo = 104;
        break;
      case 'glade':
        this.targetTempo = 112;
        break;
      case 'canopy':
        this.targetTempo = 120;
        break;
      case 'fortress':
        this.targetTempo = 128;
        break;
      case 'spire':
        this.targetTempo = 136;
        break;
      case 'climax':
        this.targetTempo = 144;
        break;
      case 'forest':
        this.targetTempo = 114;
        break;
      case 'fungal':
        this.targetTempo = 122;
        break;
      case 'briar':
        this.targetTempo = 130;
        break;
      case 'forest_king':
        this.targetTempo = 142;
        break;
      case 'castle':
        this.targetTempo = 116;
        break;
      case 'portrait_hall':
        this.targetTempo = 124;
        break;
      case 'library':
        this.targetTempo = 132;
        break;
      case 'slam_a_lot':
        this.targetTempo = 146;
        break;
      case 'volcano':
      case 'volcano_caldera':
        this.targetTempo = 118;
        break;
      case 'lava_rapids':
        this.targetTempo = 128;
        break;
      case 'boiling_crater':
        this.targetTempo = 136;
        break;
      case 'honey_dragon':
        this.targetTempo = 148;
        break;
      default:
        this.targetTempo = 112;
    }
  }

  updateDynamicBGM(scene, intensity = 0.2, specialMode = 'normal') {
    if (scene) {
      this.targetScene = scene;
      this.currentScene = scene;
      this.currentBiome = scene;
      this.updateTempoForScene(scene);
    }
    this.targetIntensity = Math.max(0, Math.min(1, intensity));
    this.specialMode = specialMode;
  }

  startTitleMusic() {
    this.updateDynamicBGM('title', 0.1, 'normal');
    this.startProceduralMusic('title');
  }

  startProceduralMusic(initialBiome = 'glade') {
    if (initialBiome) {
      this.currentBiome = initialBiome;
      this.currentScene = initialBiome;
      this.targetScene = initialBiome;
    }
    if (!this.ensureReady()) return;
    if (this.bgmPlaying) return;

    this.bgmPlaying = true;
    this.stepIndex = 0;
    this.nextStepTime = this.ctx.currentTime + 0.05;

    this.updateTempoForScene(this.currentScene);
    this.currentTempo = this.targetTempo;

    if (this.bgmTimer) {
      clearInterval(this.bgmTimer);
    }

    // High-precision lookahead scheduler (25ms tick, 120ms lookahead buffer)
    this.bgmTimer = setInterval(() => {
      this.tickScheduler();
    }, 25);
  }

  tickScheduler() {
    if (!this.bgmPlaying || !this.ctx) {
      return;
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    // Smooth parameter interpolation (runs every tick so state stays responsive)
    this.currentIntensity += (this.targetIntensity - this.currentIntensity) * 0.25;
    this.currentTempo += (this.targetTempo - this.currentTempo) * 0.15;

    // Dynamically elevate sub-bus gains
    this.updateLayerGains();

    if (this.ctx.state !== 'running') {
      return;
    }

    const lookahead = 0.12; // 120ms lookahead
    while (this.nextStepTime < this.ctx.currentTime + lookahead) {
      if (!this.isMuted) {
        this.scheduleStep(this.stepIndex, this.nextStepTime);
      }
      const stepDuration = (60 / this.currentTempo) / 4; // 16th-note subdivision
      this.nextStepTime += stepDuration;

      // Bar downbeat or half-bar (steps 0 or 8): smooth harmonic scene modulation
      const subStep = this.stepIndex % 16;
      if ((subStep === 0 || subStep === 8) && this.targetScene !== this.currentScene) {
        this.currentScene = this.targetScene;
        this.currentBiome = this.currentScene;
        this.updateTempoForScene(this.currentScene);
      }

      this.stepIndex = (this.stepIndex + 1) % 64; // 4-bar loop (16 steps * 4 bars)
    }
  }

  updateLayerGains() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const rampTime = 0.06;

    let targetDrums = this.currentIntensity * 0.35;
    let targetPad = 0.28;
    let targetBass = 0.30;
    let targetLead = 0.24;
    let targetArp = 0.18 + this.currentIntensity * 0.12;

    if (this.specialMode === 'secret') {
      targetDrums = 0.0; // Drums silent in sacred sanctuary
      targetBass = 0.08;
      targetPad = 0.18;
      targetLead = 0.34; // Celestial music box takes center stage
      targetArp = 0.30;
    } else if (this.specialMode === 'cinematic') {
      targetDrums = Math.min(targetDrums, 0.14);
      targetPad = 0.40;  // Majestic brass/string swell
      targetArp = 0.35;  // Shimmering fanfare cascades
      targetLead = 0.28;
    } else if (this.specialMode === 'climax' || this.currentScene === 'climax') {
      targetDrums = 0.36; // Full driving battle pulse
      targetBass = 0.35;
      targetPad = 0.30;
      targetLead = 0.30;
      targetArp = 0.28;
    } else {
      if (this.currentIntensity < 0.28) {
        targetDrums = 0.0; // Peaceful exploration
      }
    }

    if (this.musicPadGain) {
      this.musicPadGain.gain.setTargetAtTime(targetPad, now, rampTime);
      this.musicPadGain.gain.value = targetPad;
    }
    if (this.musicBassGain) {
      this.musicBassGain.gain.setTargetAtTime(targetBass, now, rampTime);
      this.musicBassGain.gain.value = targetBass;
    }
    if (this.musicLeadGain) {
      this.musicLeadGain.gain.setTargetAtTime(targetLead, now, rampTime);
      this.musicLeadGain.gain.value = targetLead;
    }
    if (this.musicArpGain) {
      this.musicArpGain.gain.setTargetAtTime(targetArp, now, rampTime);
      this.musicArpGain.gain.value = targetArp;
    }
    if (this.musicDrumsGain) {
      this.musicDrumsGain.gain.setTargetAtTime(targetDrums, now, rampTime);
      this.musicDrumsGain.gain.value = targetDrums;
    }
  }

  scheduleStep(step, time) {
    const bar = Math.floor(step / 16);
    const subStep = step % 16;
    const stepDuration = (60 / this.currentTempo) / 4;

    const theme = SCENE_THEMES[this.currentScene] || SCENE_THEMES.glade;
    const chord = theme.chords[bar % theme.chords.length];

    // 1. HARMONY PADS (Sustained lush chord on bar downbeat)
    if (subStep === 0) {
      this.playSynthPadChord(chord, time, stepDuration * 15.6);
    }

    // 2. BASSLINE LAYER (Rhythmic driving pulse)
    const barBass = theme.bass[bar % theme.bass.length];
    const bassFreq = barBass ? barBass[subStep] : null;
    if (bassFreq) {
      this.playSynthBass(bassFreq, time, stepDuration * 1.8);
    }

    // 3. LEAD MELODY LAYER (Scene-specific thematic motif)
    let leadFreq = null;
    if (this.specialMode === 'secret') {
      leadFreq = SECRET_MELODY[subStep];
    } else {
      const barMelody = theme.melody[bar % theme.melody.length];
      leadFreq = barMelody ? barMelody[subStep] : null;
    }
    if (leadFreq) {
      this.playSynthLead(leadFreq, time, stepDuration * 2.2, this.specialMode === 'secret');
    }

    // 4. ARPEGGIO / SHIMMER LAYER (High register sparkle)
    const shouldArp = (this.specialMode === 'cinematic' || this.currentScene === 'spire' || this.currentScene === 'climax')
      ? (subStep % 2 === 0)
      : (subStep % 4 === 2);

    if (shouldArp && chord && chord.length > 0) {
      const noteIdx = Math.floor(subStep / 2) % chord.length;
      const arpFreq = chord[noteIdx] * 2; // Up one octave
      this.playSynthArp(arpFreq, time, stepDuration * 1.4);
    }

    // 5. PERCUSSION LAYER (Dynamic battle drums, scales with encounter threat)
    if ((this.currentIntensity >= 0.28 || this.currentScene === 'climax') && this.specialMode !== 'secret') {
      // Kick: Beats 1 & 3; or four-on-the-floor in high battle/climax
      const isFourOnFloor = this.currentIntensity > 0.72 || this.currentScene === 'climax';
      if (subStep === 0 || subStep === 8 || (isFourOnFloor && (subStep === 4 || subStep === 12))) {
        this.playSynthKick(time);
      }

      // Snare: Beats 2 & 4
      if (subStep === 4 || subStep === 12) {
        this.playSynthSnare(time);
      } else if (this.currentIntensity > 0.82 && subStep === 14) {
        // Ghost snare fill
        this.playSynthSnare(time);
      }

      // Hi-Hat: Off-beats or 16th grid
      if (this.currentIntensity > 0.65) {
        if (subStep % 2 === 0) this.playSynthHiHat(time, subStep % 4 === 2);
      } else {
        if (subStep % 4 === 2) this.playSynthHiHat(time, true);
      }
    }
  }

  // --- SYNTHESIZER VOICE ENGINES ---

  playSynthKick(time) {
    if (!this.ctx || !this.musicDrumsGain) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(145, time);
      osc.frequency.exponentialRampToValueAtTime(38, time + 0.08);

      gain.gain.setValueAtTime(0.75, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.09);

      osc.connect(gain);
      gain.connect(this.musicDrumsGain);
      osc.start(time);
      osc.stop(time + 0.10);
    } catch (e) {}
  }

  playSynthSnare(time) {
    if (!this.ctx || !this.musicDrumsGain || !this.noiseBuffer) return;
    try {
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(190, time);
      osc.frequency.exponentialRampToValueAtTime(75, time + 0.06);
      oscGain.gain.setValueAtTime(0.35, time);
      oscGain.gain.exponentialRampToValueAtTime(0.01, time + 0.06);
      osc.connect(oscGain);
      oscGain.connect(this.musicDrumsGain);
      osc.start(time);
      osc.stop(time + 0.07);

      const noise = this.ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1350, time);
      filter.Q.value = 1.2;
      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.48, time);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, time + 0.11);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.musicDrumsGain);
      noise.start(time);
      noise.stop(time + 0.12);
    } catch (e) {}
  }

  playSynthHiHat(time, isOpen = false) {
    if (!this.ctx || !this.musicDrumsGain || !this.noiseBuffer) return;
    try {
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(6800, time);
      const gain = this.ctx.createGain();
      const dur = isOpen ? 0.09 : 0.035;
      gain.gain.setValueAtTime(isOpen ? 0.28 : 0.18, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + dur);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicDrumsGain);
      noise.start(time);
      noise.stop(time + dur + 0.01);
    } catch (e) {}
  }

  playSynthPadChord(frequencies, time, duration) {
    if (!this.ctx || !this.musicPadGain || !frequencies) return;
    const voiceCount = frequencies.length;
    frequencies.forEach((freq) => {
      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, time);

        gain.gain.setValueAtTime(0.001, time);
        gain.gain.linearRampToValueAtTime(0.09 / Math.sqrt(voiceCount), time + 0.28);
        gain.gain.setValueAtTime(0.07 / Math.sqrt(voiceCount), time + duration - 0.35);
        gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

        osc.connect(gain);
        gain.connect(this.musicPadGain);
        osc.start(time);
        osc.stop(time + duration);
      } catch (e) {}
    });
  }

  playSynthBass(freq, time, duration) {
    if (!this.ctx || !this.musicBassGain || !freq) return;
    try {
      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, time);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(420, time);
      filter.frequency.exponentialRampToValueAtTime(140, time + duration);

      gain.gain.setValueAtTime(0.36, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicBassGain);
      osc.start(time);
      osc.stop(time + duration + 0.01);
    } catch (e) {}
  }

  playSynthLead(freq, time, duration, isSecret = false) {
    if (!this.ctx || !this.musicLeadGain || !freq) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      if (isSecret) {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, time);
        gain.gain.setValueAtTime(0.36, time);
        gain.gain.exponentialRampToValueAtTime(0.005, time + Math.min(duration, 0.42));
      } else {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, time);
        gain.gain.setValueAtTime(0.01, time);
        gain.gain.linearRampToValueAtTime(0.24, time + 0.03);
        gain.gain.setValueAtTime(0.19, time + duration * 0.7);
        gain.gain.exponentialRampToValueAtTime(0.005, time + duration);
      }

      osc.connect(gain);
      gain.connect(this.musicLeadGain);
      osc.start(time);
      osc.stop(time + duration + 0.02);
    } catch (e) {}
  }

  playSynthArp(freq, time, duration) {
    if (!this.ctx || !this.musicArpGain || !freq) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);

      gain.gain.setValueAtTime(0.25, time);
      gain.gain.exponentialRampToValueAtTime(0.005, time + Math.min(duration, 0.16));

      osc.connect(gain);
      gain.connect(this.musicArpGain);
      osc.start(time);
      osc.stop(time + duration + 0.01);
    } catch (e) {}
  }

  stopProceduralMusic() {
    this.bgmPlaying = false;
    if (this.bgmTimer) {
      clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
  }

  startAmbience() {
    this.startProceduralMusic();
  }

  stopAmbience() {
    this.stopProceduralMusic();
  }
}

// ========================================================
// SCENE MUSIC DEFINITIONS & THEMATIC ARRANGEMENTS
// ========================================================

const NOTES = {
  F2: 87.31, G2: 98.00, Ab2: 103.83, A2: 110.00, Bb2: 116.54, B2: 123.47,
  C3: 130.81, Db3: 138.59, D3: 146.83, Eb3: 155.56, E3: 164.81, F3: 174.61, Fs3: 185.00, G3: 196.00, Ab3: 207.65, A3: 220.00, Bb3: 233.08, B3: 246.94,
  C4: 261.63, Db4: 277.18, D4: 293.66, Eb4: 311.13, E4: 329.63, F4: 349.23, Fs4: 369.99, G4: 392.00, Ab4: 415.30, A4: 440.00, Bb4: 466.16, B4: 493.88,
  C5: 523.25, Db5: 554.37, D5: 587.33, Eb5: 622.25, E5: 659.25, F5: 698.46, Fs5: 739.99, G5: 783.99, Ab5: 830.61, A5: 880.00, Bb5: 932.33, B5: 987.77,
  C6: 1046.50, D6: 1174.66, E6: 1318.51, F6: 1396.91, G6: 1567.98, Ab6: 1661.22, Bb6: 1864.66, B6: 1975.53, C7: 2093.00,
};

// Celestial Music Box line for Secret Sanctums (16-step grid)
const SECRET_MELODY = [
  NOTES.C6, null, NOTES.E6, null, NOTES.G6, null, NOTES.B6, null,
  NOTES.C7, null, NOTES.G6, null, NOTES.E6, null, NOTES.C6, null,
];

// Helper to construct a 16-step bar from step/note mapping
function makeBar(entries) {
  const bar = new Array(16).fill(null);
  entries.forEach(([step, note]) => {
    bar[step] = note;
  });
  return bar;
}

const SCENE_THEMES = {
  // Title Screen: Pastoral, ethereal, fairytale anticipation (104 BPM)
  title: {
    tempo: 104,
    chords: [
      [NOTES.G3, NOTES.B3, NOTES.D4, NOTES.G4],
      [NOTES.E3, NOTES.G3, NOTES.B3, NOTES.E4],
      [NOTES.C3, NOTES.E3, NOTES.G3, NOTES.C4],
      [NOTES.D3, NOTES.A3, NOTES.D4, NOTES.Fs4],
    ],
    bass: [
      makeBar([[0, NOTES.G2], [6, NOTES.D3], [8, NOTES.G3], [12, NOTES.Fs3]]),
      makeBar([[0, NOTES.E2], [6, NOTES.B2], [8, NOTES.E3], [12, NOTES.D3]]),
      makeBar([[0, NOTES.C3], [6, NOTES.G2], [8, NOTES.C3], [12, NOTES.E3]]),
      makeBar([[0, NOTES.D3], [6, NOTES.A2], [8, NOTES.D3], [12, NOTES.C3]]),
    ],
    melody: [
      makeBar([[0, NOTES.G4], [4, NOTES.B4], [8, NOTES.D5], [12, NOTES.G5]]),
      makeBar([[0, NOTES.E5], [4, NOTES.D5], [8, NOTES.B4], [12, NOTES.G4]]),
      makeBar([[0, NOTES.C5], [4, NOTES.E5], [8, NOTES.G5], [12, NOTES.E5]]),
      makeBar([[0, NOTES.D5], [4, NOTES.Fs5], [8, NOTES.A5], [12, NOTES.G5]]),
    ],
  },

  // Section 1: The Sunstone Glade (0-2400px): Adventure Morning Dawn (112 BPM)
  glade: {
    tempo: 112,
    chords: [
      [NOTES.E3, NOTES.G3, NOTES.B3, NOTES.D4, NOTES.Fs4], // Em9
      [NOTES.C3, NOTES.E3, NOTES.G3, NOTES.B3, NOTES.D4], // Cmaj9
      [NOTES.G2, NOTES.B3, NOTES.D4, NOTES.G4, NOTES.B4], // G
      [NOTES.D3, NOTES.A3, NOTES.D4, NOTES.G4, NOTES.A4], // Dsus4
    ],
    bass: [
      makeBar([[0, NOTES.E2], [6, NOTES.B2], [8, NOTES.E3], [12, NOTES.D3]]),
      makeBar([[0, NOTES.C3], [6, NOTES.G2], [8, NOTES.C3], [12, NOTES.E3]]),
      makeBar([[0, NOTES.G2], [6, NOTES.D3], [8, NOTES.G3], [12, NOTES.Fs3]]),
      makeBar([[0, NOTES.D3], [6, NOTES.A2], [8, NOTES.D3], [12, NOTES.C3]]),
    ],
    melody: [
      makeBar([[0, NOTES.E4], [4, NOTES.G4], [8, NOTES.B4], [12, NOTES.D5]]),
      makeBar([[0, NOTES.C5], [4, NOTES.B4], [8, NOTES.G4], [12, NOTES.E4]]),
      makeBar([[0, NOTES.D4], [4, NOTES.G4], [8, NOTES.B4], [12, NOTES.D5]]),
      makeBar([[0, NOTES.A4], [4, NOTES.D5], [8, NOTES.Fs5], [12, NOTES.E5]]),
    ],
  },

  // Section 2: The Whispering Canopy & Amber Chasm (2400-5200px): Mystical Lydian Amber (120 BPM)
  canopy: {
    tempo: 120,
    chords: [
      [NOTES.Fs3, NOTES.A3, NOTES.Cs4, NOTES.E4], // F#m9
      [NOTES.D3, NOTES.A3, NOTES.Cs4, NOTES.Gs4], // Dmaj7#11
      [NOTES.B2, NOTES.Fs3, NOTES.A3, NOTES.D4],  // Bm9
      [NOTES.Cs3, NOTES.Gs3, NOTES.B3, NOTES.E4], // C#m7
    ],
    bass: [
      makeBar([[0, NOTES.Fs2], [4, NOTES.Cs3], [8, NOTES.Fs3], [14, NOTES.E3]]),
      makeBar([[0, NOTES.D3], [4, NOTES.A2], [8, NOTES.D3], [14, NOTES.Fs3]]),
      makeBar([[0, NOTES.B2], [4, NOTES.Fs2], [8, NOTES.B2], [14, NOTES.D3]]),
      makeBar([[0, NOTES.Cs3], [4, NOTES.Gs2], [8, NOTES.Cs3], [14, NOTES.B2]]),
    ],
    melody: [
      makeBar([[2, NOTES.Fs4], [6, NOTES.A4], [10, NOTES.Cs5], [14, NOTES.E5]]),
      makeBar([[2, NOTES.D5], [6, NOTES.Cs5], [10, NOTES.Gs4], [14, NOTES.A4]]),
      makeBar([[2, NOTES.B4], [6, NOTES.D5], [10, NOTES.Fs5], [14, NOTES.D5]]),
      makeBar([[2, NOTES.Cs5], [6, NOTES.E5], [10, NOTES.B4], [14, NOTES.Gs4]]),
    ],
  },

  // Section 3: The Sunstone Aqueduct & Fortress (5200-8000px): Martial Grandeur & Ruin (128 BPM)
  fortress: {
    tempo: 128,
    chords: [
      [NOTES.F3, NOTES.A3, NOTES.C4, NOTES.B4], // Fmaj7#11
      [NOTES.D3, NOTES.F3, NOTES.A3, NOTES.C4], // Dm9
      [NOTES.A2, NOTES.E3, NOTES.G3, NOTES.C4], // Am9
      [NOTES.E3, NOTES.G3, NOTES.B3, NOTES.D4], // Em7
    ],
    bass: [
      makeBar([[0, NOTES.F2], [2, NOTES.F2], [4, NOTES.C3], [6, NOTES.F3], [8, NOTES.F2], [10, NOTES.F2], [12, NOTES.E3], [14, NOTES.G3]]),
      makeBar([[0, NOTES.D3], [2, NOTES.D3], [4, NOTES.A2], [6, NOTES.D3], [8, NOTES.D3], [10, NOTES.D3], [12, NOTES.C3], [14, NOTES.E3]]),
      makeBar([[0, NOTES.A2], [2, NOTES.A2], [4, NOTES.E3], [6, NOTES.A3], [8, NOTES.A2], [10, NOTES.A2], [12, NOTES.G2], [14, NOTES.B2]]),
      makeBar([[0, NOTES.E3], [2, NOTES.E3], [4, NOTES.B2], [6, NOTES.E3], [8, NOTES.E3], [10, NOTES.E3], [12, NOTES.D3], [14, NOTES.Fs3]]),
    ],
    melody: [
      makeBar([[0, NOTES.A4], [4, NOTES.C5], [8, NOTES.E5], [12, NOTES.D5]]),
      makeBar([[0, NOTES.F5], [4, NOTES.D5], [8, NOTES.A4], [12, NOTES.C5]]),
      makeBar([[0, NOTES.E5], [4, NOTES.C5], [8, NOTES.A4], [12, NOTES.B4]]),
      makeBar([[0, NOTES.G4], [4, NOTES.B4], [8, NOTES.E5], [12, NOTES.Fs5]]),
    ],
  },

  // Section 4: The Sovereign Hive Spire (8000-10250px): High Spire Void & Heroic Drive (136 BPM)
  spire: {
    tempo: 136,
    chords: [
      [NOTES.C3, NOTES.G3, NOTES.Bb3, NOTES.Eb4], // Cm9
      [NOTES.Ab2, NOTES.Eb3, NOTES.G3, NOTES.C4],  // Abmaj7#11
      [NOTES.F2, NOTES.C3, NOTES.Eb3, NOTES.Ab3],  // Fm9
      [NOTES.G2, NOTES.D3, NOTES.F3, NOTES.B3],    // G7
    ],
    bass: [
      makeBar([[0, NOTES.C3], [3, NOTES.G2], [6, NOTES.C3], [10, NOTES.Eb3], [14, NOTES.D3]]),
      makeBar([[0, NOTES.Ab2], [3, NOTES.Eb3], [6, NOTES.Ab3], [10, NOTES.G3], [14, NOTES.F3]]),
      makeBar([[0, NOTES.F2], [3, NOTES.C3], [6, NOTES.F3], [10, NOTES.Ab3], [14, NOTES.G3]]),
      makeBar([[0, NOTES.G2], [3, NOTES.D3], [6, NOTES.G3], [10, NOTES.B3], [14, NOTES.D4]]),
    ],
    melody: [
      makeBar([[0, NOTES.C5], [3, NOTES.D5], [6, NOTES.Eb5], [10, NOTES.G5], [13, NOTES.F5]]),
      makeBar([[0, NOTES.Eb5], [4, NOTES.C5], [8, NOTES.Ab4], [12, NOTES.C5]]),
      makeBar([[0, NOTES.F5], [3, NOTES.G5], [6, NOTES.Ab5], [10, NOTES.C6], [13, NOTES.Bb5]]),
      makeBar([[0, NOTES.G5], [4, NOTES.F5], [8, NOTES.D5], [12, NOTES.B4]]),
    ],
  },

  // Section 4 Climax: The Sovereign Throne & Batboy Sanctuary (10250-10800px): Ultimate Heroic Crescendo (144 BPM)
  climax: {
    tempo: 144,
    chords: [
      [NOTES.C3, NOTES.Eb3, NOTES.G3, NOTES.C4],   // Cm
      [NOTES.Ab2, NOTES.C3, NOTES.Eb3, NOTES.Ab3], // Ab
      [NOTES.Bb2, NOTES.D3, NOTES.F3, NOTES.Bb3], // Bb
      [NOTES.C3, NOTES.E3, NOTES.G3, NOTES.C4],   // C Major Triumphant!
    ],
    bass: [
      makeBar([[0, NOTES.C3], [2, NOTES.C3], [4, NOTES.C3], [6, NOTES.G3], [8, NOTES.C3], [10, NOTES.C3], [12, NOTES.Eb3], [14, NOTES.D3]]),
      makeBar([[0, NOTES.Ab2], [2, NOTES.Ab2], [4, NOTES.Ab2], [6, NOTES.Eb3], [8, NOTES.Ab3], [10, NOTES.Ab3], [12, NOTES.G3], [14, NOTES.F3]]),
      makeBar([[0, NOTES.Bb2], [2, NOTES.Bb2], [4, NOTES.Bb2], [6, NOTES.F3], [8, NOTES.Bb3], [10, NOTES.Bb3], [12, NOTES.A3], [14, NOTES.Ab3]]),
      makeBar([[0, NOTES.C3], [2, NOTES.C3], [4, NOTES.E3], [6, NOTES.G3], [8, NOTES.C4], [10, NOTES.C4], [12, NOTES.G3], [14, NOTES.C4]]),
    ],
    melody: [
      makeBar([[0, NOTES.C5], [2, NOTES.Eb5], [4, NOTES.G5], [8, NOTES.C6], [12, NOTES.Bb5]]),
      makeBar([[0, NOTES.Ab5], [4, NOTES.C6], [8, NOTES.Eb6], [12, NOTES.D6]]),
      makeBar([[0, NOTES.Bb5], [4, NOTES.D6], [8, NOTES.F6], [12, NOTES.Eb6]]),
      makeBar([[0, NOTES.G5], [2, NOTES.C6], [4, NOTES.E6], [8, NOTES.G6], [12, NOTES.C7]]),
    ],
  },

  // ========================================================
  // WORLD 2: THE WHISPERING FOREST THEMES
  // ========================================================

  // Section 1: The Whispering Perimeter & Spore Glades (114 BPM)
  forest: {
    tempo: 114,
    chords: [
      [NOTES.A2, NOTES.E3, NOTES.G3, NOTES.C4, NOTES.E4], // Am9
      [NOTES.F2, NOTES.C3, NOTES.A3, NOTES.C4, NOTES.E4], // Fmaj7
      [NOTES.C3, NOTES.G3, NOTES.B3, NOTES.D4, NOTES.G4], // Cmaj9
      [NOTES.G2, NOTES.D3, NOTES.B3, NOTES.D4, NOTES.A4], // Gsus2
    ],
    bass: [
      makeBar([[0, NOTES.A2], [4, NOTES.E3], [8, NOTES.A3], [14, NOTES.G3]]),
      makeBar([[0, NOTES.F2], [4, NOTES.C3], [8, NOTES.F3], [14, NOTES.A3]]),
      makeBar([[0, NOTES.C3], [4, NOTES.G2], [8, NOTES.C3], [14, NOTES.B2]]),
      makeBar([[0, NOTES.G2], [4, NOTES.D3], [8, NOTES.G3], [14, NOTES.Fs3]]),
    ],
    melody: [
      makeBar([[0, NOTES.E5], [4, NOTES.C5], [8, NOTES.B4], [12, NOTES.A4]]),
      makeBar([[0, NOTES.A4], [4, NOTES.C5], [8, NOTES.E5], [12, NOTES.G5]]),
      makeBar([[0, NOTES.D5], [4, NOTES.B4], [8, NOTES.G4], [12, NOTES.E4]]),
      makeBar([[0, NOTES.G4], [4, NOTES.A4], [8, NOTES.B4], [12, NOTES.D5]]),
    ],
  },

  // Section 2: The Bioluminescent Fungal Hollows (122 BPM)
  fungal: {
    tempo: 122,
    chords: [
      [NOTES.D3, NOTES.A3, NOTES.C4, NOTES.F4], // Dm7
      [NOTES.Bb2, NOTES.F3, NOTES.A3, NOTES.D4], // Bbmaj7
      [NOTES.G2, NOTES.D3, NOTES.Bb3, NOTES.D4], // Gm
      [NOTES.A2, NOTES.E3, NOTES.G3, NOTES.Cs4], // A7
    ],
    bass: [
      makeBar([[0, NOTES.D3], [3, NOTES.A2], [6, NOTES.D3], [10, NOTES.F3], [14, NOTES.E3]]),
      makeBar([[0, NOTES.Bb2], [3, NOTES.F2], [6, NOTES.Bb2], [10, NOTES.D3], [14, NOTES.C3]]),
      makeBar([[0, NOTES.G2], [3, NOTES.D3], [6, NOTES.G3], [10, NOTES.Bb2], [14, NOTES.A2]]),
      makeBar([[0, NOTES.A2], [3, NOTES.E3], [6, NOTES.A3], [10, NOTES.Cs3], [14, NOTES.E3]]),
    ],
    melody: [
      makeBar([[2, NOTES.F5], [6, NOTES.D5], [10, NOTES.A4], [14, NOTES.C5]]),
      makeBar([[2, NOTES.D5], [6, NOTES.Bb4], [10, NOTES.F4], [14, NOTES.A4]]),
      makeBar([[2, NOTES.Bb4], [6, NOTES.G4], [10, NOTES.D5], [14, NOTES.F5]]),
      makeBar([[2, NOTES.Cs5], [6, NOTES.E5], [10, NOTES.G5], [14, NOTES.A5]]),
    ],
  },

  // Section 3: The Briar Thicket & Shadow Canopy (130 BPM)
  briar: {
    tempo: 130,
    chords: [
      [NOTES.E3, NOTES.B3, NOTES.D4, NOTES.G4], // Em7
      [NOTES.C3, NOTES.G3, NOTES.B3, NOTES.E4], // Cmaj7
      [NOTES.A2, NOTES.E3, NOTES.G3, NOTES.C4], // Am7
      [NOTES.B2, NOTES.Fs3, NOTES.A3, NOTES.Ds4], // B7
    ],
    bass: [
      makeBar([[0, NOTES.E2], [2, NOTES.E2], [4, NOTES.B2], [6, NOTES.E3], [8, NOTES.E2], [10, NOTES.E2], [12, NOTES.D3], [14, NOTES.G3]]),
      makeBar([[0, NOTES.C3], [2, NOTES.C3], [4, NOTES.G2], [6, NOTES.C3], [8, NOTES.C3], [10, NOTES.C3], [12, NOTES.B2], [14, NOTES.D3]]),
      makeBar([[0, NOTES.A2], [2, NOTES.A2], [4, NOTES.E3], [6, NOTES.A3], [8, NOTES.A2], [10, NOTES.A2], [12, NOTES.G2], [14, NOTES.B2]]),
      makeBar([[0, NOTES.B2], [2, NOTES.B2], [4, NOTES.Fs2], [6, NOTES.B2], [8, NOTES.B2], [10, NOTES.B2], [12, NOTES.A2], [14, NOTES.Ds3]]),
    ],
    melody: [
      makeBar([[0, NOTES.B4], [4, NOTES.E5], [8, NOTES.G5], [12, NOTES.Fs5]]),
      makeBar([[0, NOTES.E5], [4, NOTES.G5], [8, NOTES.B5], [12, NOTES.A5]]),
      makeBar([[0, NOTES.C5], [4, NOTES.E5], [8, NOTES.A5], [12, NOTES.G5]]),
      makeBar([[0, NOTES.Fs5], [4, NOTES.Ds5], [8, NOTES.B4], [12, NOTES.A4]]),
    ],
  },

  // Section 4 Climax: The Forest King Titan Encounter (142 BPM)
  forest_king: {
    tempo: 142,
    chords: [
      [NOTES.D3, NOTES.A3, NOTES.D4, NOTES.F4],   // Dm
      [NOTES.Bb2, NOTES.F3, NOTES.Bb3, NOTES.D4], // Bb
      [NOTES.C3, NOTES.G3, NOTES.C4, NOTES.E4],   // C
      [NOTES.D3, NOTES.A3, NOTES.D4, NOTES.Fs4],  // D Major (Triumphant Awakening!)
    ],
    bass: [
      makeBar([[0, NOTES.D3], [2, NOTES.D3], [4, NOTES.D3], [6, NOTES.A3], [8, NOTES.D3], [10, NOTES.D3], [12, NOTES.F3], [14, NOTES.E3]]),
      makeBar([[0, NOTES.Bb2], [2, NOTES.Bb2], [4, NOTES.Bb2], [6, NOTES.F3], [8, NOTES.Bb3], [10, NOTES.Bb3], [12, NOTES.A3], [14, NOTES.G3]]),
      makeBar([[0, NOTES.C3], [2, NOTES.C3], [4, NOTES.C3], [6, NOTES.G3], [8, NOTES.C4], [10, NOTES.C4], [12, NOTES.B3], [14, NOTES.Bb3]]),
      makeBar([[0, NOTES.D3], [2, NOTES.D3], [4, NOTES.Fs3], [6, NOTES.A3], [8, NOTES.D4], [10, NOTES.D4], [12, NOTES.A3], [14, NOTES.D4]]),
    ],
    melody: [
      makeBar([[0, NOTES.D5], [2, NOTES.F5], [4, NOTES.A5], [8, NOTES.D6], [12, NOTES.C6]]),
      makeBar([[0, NOTES.Bb5], [4, NOTES.D6], [8, NOTES.F6], [12, NOTES.E6]]),
      makeBar([[0, NOTES.C6], [4, NOTES.E6], [8, NOTES.G6], [12, NOTES.F6]]),
      makeBar([[0, NOTES.A5], [2, NOTES.D6], [4, NOTES.Fs6], [8, NOTES.A6], [12, NOTES.D7]]),
    ],
  },

  // ========================================================
  // WORLD 3: THE CASTLE OF A THOUSAND DOORS THEMES
  // ========================================================

  // Section 1: The Grand Colonnade & Clocktower (116 BPM)
  castle: {
    tempo: 116,
    chords: [
      [NOTES.C3, NOTES.G3, NOTES.C4, NOTES.Eb4], // Cm
      [NOTES.Ab2, NOTES.Eb3, NOTES.Ab3, NOTES.C4], // Ab
      [NOTES.F2, NOTES.C3, NOTES.F3, NOTES.Ab3], // Fm
      [NOTES.G2, NOTES.D3, NOTES.G3, NOTES.B3], // G major (Gothic cadence)
    ],
    bass: [
      makeBar([[0, NOTES.C3], [4, NOTES.G2], [8, NOTES.C3], [14, NOTES.Eb3]]),
      makeBar([[0, NOTES.Ab2], [4, NOTES.Eb3], [8, NOTES.Ab3], [14, NOTES.C3]]),
      makeBar([[0, NOTES.F2], [4, NOTES.C3], [8, NOTES.F3], [14, NOTES.Ab2]]),
      makeBar([[0, NOTES.G2], [4, NOTES.D3], [8, NOTES.G3], [14, NOTES.B2]]),
    ],
    melody: [
      makeBar([[0, NOTES.C5], [4, NOTES.Eb5], [8, NOTES.G5], [12, NOTES.C6]]),
      makeBar([[0, NOTES.Ab5], [4, NOTES.C6], [8, NOTES.Eb6], [12, NOTES.D6]]),
      makeBar([[0, NOTES.F5], [4, NOTES.Ab5], [8, NOTES.C6], [12, NOTES.B5]]),
      makeBar([[0, NOTES.G5], [4, NOTES.B5], [8, NOTES.D6], [12, NOTES.G6]]),
    ],
  },

  // Section 2: Hall of Whispering Portraits & Secret Vaults (124 BPM)
  portrait_hall: {
    tempo: 124,
    chords: [
      [NOTES.A2, NOTES.E3, NOTES.A3, NOTES.C4], // Am
      [NOTES.F2, NOTES.C3, NOTES.F3, NOTES.A3], // F
      [NOTES.D3, NOTES.A3, NOTES.D4, NOTES.F4], // Dm
      [NOTES.E2, NOTES.B2, NOTES.E3, NOTES.Gs3], // E major (Mystery)
    ],
    bass: [
      makeBar([[0, NOTES.A2], [3, NOTES.E3], [6, NOTES.A3], [10, NOTES.C3], [14, NOTES.B2]]),
      makeBar([[0, NOTES.F2], [3, NOTES.C3], [6, NOTES.F3], [10, NOTES.A2], [14, NOTES.G2]]),
      makeBar([[0, NOTES.D3], [3, NOTES.A2], [6, NOTES.D3], [10, NOTES.F2], [14, NOTES.E2]]),
      makeBar([[0, NOTES.E2], [3, NOTES.B2], [6, NOTES.E3], [10, NOTES.Gs2], [14, NOTES.B2]]),
    ],
    melody: [
      makeBar([[2, NOTES.C5], [6, NOTES.E5], [10, NOTES.A5], [14, NOTES.B5]]),
      makeBar([[2, NOTES.A4], [6, NOTES.C5], [10, NOTES.F5], [14, NOTES.E5]]),
      makeBar([[2, NOTES.F4], [6, NOTES.A4], [10, NOTES.D5], [14, NOTES.C5]]),
      makeBar([[2, NOTES.Gs4], [6, NOTES.B4], [10, NOTES.E5], [14, NOTES.Gs5]]),
    ],
  },

  // Section 3: The Arcane Archives & High Battlements (132 BPM)
  library: {
    tempo: 132,
    chords: [
      [NOTES.D3, NOTES.A3, NOTES.C4, NOTES.F4], // Dm7
      [NOTES.Bb2, NOTES.F3, NOTES.Bb3, NOTES.D4], // Bb
      [NOTES.G2, NOTES.D3, NOTES.G3, NOTES.Bb3], // Gm
      [NOTES.A2, NOTES.E3, NOTES.A3, NOTES.Cs4], // A7
    ],
    bass: [
      makeBar([[0, NOTES.D3], [2, NOTES.D3], [4, NOTES.A2], [6, NOTES.D3], [8, NOTES.D3], [10, NOTES.F3], [12, NOTES.E3], [14, NOTES.D3]]),
      makeBar([[0, NOTES.Bb2], [2, NOTES.Bb2], [4, NOTES.F2], [6, NOTES.Bb2], [8, NOTES.Bb2], [10, NOTES.D3], [12, NOTES.C3], [14, NOTES.Bb2]]),
      makeBar([[0, NOTES.G2], [2, NOTES.G2], [4, NOTES.D3], [6, NOTES.G2], [8, NOTES.G2], [10, NOTES.Bb2], [12, NOTES.A2], [14, NOTES.G2]]),
      makeBar([[0, NOTES.A2], [2, NOTES.A2], [4, NOTES.E3], [6, NOTES.A2], [8, NOTES.A2], [10, NOTES.Cs3], [12, NOTES.E3], [14, NOTES.A3]]),
    ],
    melody: [
      makeBar([[0, NOTES.F5], [4, NOTES.D5], [8, NOTES.A5], [12, NOTES.C6]]),
      makeBar([[0, NOTES.D5], [4, NOTES.Bb4], [8, NOTES.F5], [12, NOTES.A5]]),
      makeBar([[0, NOTES.Bb4], [4, NOTES.G4], [8, NOTES.D5], [12, NOTES.F5]]),
      makeBar([[0, NOTES.Cs5], [4, NOTES.E5], [8, NOTES.A5], [12, NOTES.Cs6]]),
    ],
  },

  // Section 4 Boss Climax: Sir Slam-A-Lot Titan Duel (146 BPM)
  slam_a_lot: {
    tempo: 146,
    chords: [
      [NOTES.C3, NOTES.G3, NOTES.C4, NOTES.Eb4], // Cm (Thunderous heavy power)
      [NOTES.Ab2, NOTES.Eb3, NOTES.Ab3, NOTES.C4], // Ab
      [NOTES.Bb2, NOTES.F3, NOTES.Bb3, NOTES.D4], // Bb
      [NOTES.G2, NOTES.D3, NOTES.G3, NOTES.B3], // G major (Tense standoff)
    ],
    bass: [
      makeBar([[0, NOTES.C2], [2, NOTES.C2], [4, NOTES.C3], [6, NOTES.G2], [8, NOTES.C2], [10, NOTES.C2], [12, NOTES.Eb2], [14, NOTES.D2]]),
      makeBar([[0, NOTES.Ab2], [2, NOTES.Ab2], [4, NOTES.Ab3], [6, NOTES.Eb2], [8, NOTES.Ab2], [10, NOTES.Ab2], [12, NOTES.C3], [14, NOTES.Bb2]]),
      makeBar([[0, NOTES.Bb2], [2, NOTES.Bb2], [4, NOTES.Bb3], [6, NOTES.F2], [8, NOTES.Bb2], [10, NOTES.Bb2], [12, NOTES.D3], [14, NOTES.C3]]),
      makeBar([[0, NOTES.G2], [2, NOTES.G2], [4, NOTES.G3], [6, NOTES.D2], [8, NOTES.G2], [10, NOTES.G2], [12, NOTES.B2], [14, NOTES.D3]]),
    ],
    melody: [
      makeBar([[0, NOTES.C5], [2, NOTES.Eb5], [4, NOTES.G5], [8, NOTES.C6], [12, NOTES.D6]]),
      makeBar([[0, NOTES.Eb6], [4, NOTES.C6], [8, NOTES.Ab5], [12, NOTES.G5]]),
      makeBar([[0, NOTES.F5], [4, NOTES.Bb5], [8, NOTES.D6], [12, NOTES.F6]]),
      makeBar([[0, NOTES.G6], [2, NOTES.D6], [4, NOTES.B5], [8, NOTES.G5], [12, NOTES.B5]]),
    ],
  },

  // ========================================================
  // WORLD 4: THE VOLCANO OF HOT HONEY THEMES
  // ========================================================

  // Section 1: Ash Caldera & Molten Falls (118 BPM)
  volcano: {
    tempo: 118,
    chords: [
      [NOTES.E3, NOTES.B3, NOTES.E4, NOTES.G4], // Em
      [NOTES.C3, NOTES.G3, NOTES.C4, NOTES.E4], // C
      [NOTES.A2, NOTES.E3, NOTES.A3, NOTES.C4], // Am
      [NOTES.B2, NOTES.Fs3, NOTES.A3, NOTES.Ds4], // B7 (Volcanic tension)
    ],
    bass: [
      makeBar([[0, NOTES.E2], [4, NOTES.B2], [8, NOTES.E3], [14, NOTES.G2]]),
      makeBar([[0, NOTES.C3], [4, NOTES.G2], [8, NOTES.C3], [14, NOTES.E3]]),
      makeBar([[0, NOTES.A2], [4, NOTES.E3], [8, NOTES.A3], [14, NOTES.C3]]),
      makeBar([[0, NOTES.B2], [4, NOTES.Fs3], [8, NOTES.B3], [14, NOTES.Ds3]]),
    ],
    melody: [
      makeBar([[0, NOTES.E5], [4, NOTES.G5], [8, NOTES.B5], [12, NOTES.A5]]),
      makeBar([[0, NOTES.G5], [4, NOTES.E5], [8, NOTES.C5], [12, NOTES.D5]]),
      makeBar([[0, NOTES.E5], [4, NOTES.A5], [8, NOTES.C6], [12, NOTES.B5]]),
      makeBar([[0, NOTES.Ds5], [4, NOTES.Fs5], [8, NOTES.A5], [12, NOTES.B5]]),
    ],
  },

  // Section 2: Obsidian Caverns & Lava Rapids (128 BPM)
  lava_rapids: {
    tempo: 128,
    chords: [
      [NOTES.D3, NOTES.A3, NOTES.C4, NOTES.F4], // Dm7
      [NOTES.Bb2, NOTES.F3, NOTES.Bb3, NOTES.D4], // Bb
      [NOTES.G2, NOTES.D3, NOTES.G3, NOTES.Bb3], // Gm
      [NOTES.A2, NOTES.E3, NOTES.A3, NOTES.Cs4], // A7
    ],
    bass: [
      makeBar([[0, NOTES.D3], [3, NOTES.A2], [6, NOTES.D3], [10, NOTES.F3], [14, NOTES.E3]]),
      makeBar([[0, NOTES.Bb2], [3, NOTES.F2], [6, NOTES.Bb2], [10, NOTES.D3], [14, NOTES.C3]]),
      makeBar([[0, NOTES.G2], [3, NOTES.D3], [6, NOTES.G3], [10, NOTES.Bb2], [14, NOTES.A2]]),
      makeBar([[0, NOTES.A2], [3, NOTES.E3], [6, NOTES.A3], [10, NOTES.Cs3], [14, NOTES.E3]]),
    ],
    melody: [
      makeBar([[0, NOTES.F5], [4, NOTES.D5], [8, NOTES.A5], [12, NOTES.G5]]),
      makeBar([[0, NOTES.D5], [4, NOTES.F5], [8, NOTES.Bb5], [12, NOTES.A5]]),
      makeBar([[0, NOTES.G5], [4, NOTES.Bb5], [8, NOTES.D6], [12, NOTES.C6]]),
      makeBar([[0, NOTES.Cs6], [4, NOTES.E6], [8, NOTES.A6], [12, NOTES.G6]]),
    ],
  },

  // Section 3: Geyser Fields & Boiling Crater (136 BPM)
  boiling_crater: {
    tempo: 136,
    chords: [
      [NOTES.C3, NOTES.G3, NOTES.C4, NOTES.Eb4], // Cm
      [NOTES.Ab2, NOTES.Eb3, NOTES.Ab3, NOTES.C4], // Ab
      [NOTES.F2, NOTES.C3, NOTES.F3, NOTES.Ab3], // Fm
      [NOTES.G2, NOTES.D3, NOTES.G3, NOTES.B3], // G major
    ],
    bass: [
      makeBar([[0, NOTES.C3], [2, NOTES.C3], [4, NOTES.G2], [6, NOTES.C3], [8, NOTES.C3], [10, NOTES.Eb3], [12, NOTES.D3], [14, NOTES.C3]]),
      makeBar([[0, NOTES.Ab2], [2, NOTES.Ab2], [4, NOTES.Eb3], [6, NOTES.Ab2], [8, NOTES.Ab2], [10, NOTES.C3], [12, NOTES.Bb2], [14, NOTES.Ab2]]),
      makeBar([[0, NOTES.F2], [2, NOTES.F2], [4, NOTES.C3], [6, NOTES.F2], [8, NOTES.F2], [10, NOTES.Ab2], [12, NOTES.G2], [14, NOTES.F2]]),
      makeBar([[0, NOTES.G2], [2, NOTES.G2], [4, NOTES.D3], [6, NOTES.G2], [8, NOTES.G2], [10, NOTES.B2], [12, NOTES.D3], [14, NOTES.G3]]),
    ],
    melody: [
      makeBar([[0, NOTES.C5], [3, NOTES.Eb5], [6, NOTES.G5], [10, NOTES.C6], [14, NOTES.D6]]),
      makeBar([[0, NOTES.Eb6], [4, NOTES.C6], [8, NOTES.Ab5], [12, NOTES.G5]]),
      makeBar([[0, NOTES.F5], [3, NOTES.Ab5], [6, NOTES.C6], [10, NOTES.F6], [14, NOTES.Eb6]]),
      makeBar([[0, NOTES.D6], [4, NOTES.B5], [8, NOTES.G5], [12, NOTES.B5]]),
    ],
  },

  // Section 4 Boss Climax: The Honey Dragon (Ignis the Wyrm) (148 BPM)
  honey_dragon: {
    tempo: 148,
    chords: [
      [NOTES.D3, NOTES.A3, NOTES.D4, NOTES.F4],   // Dm (Dragon fury)
      [NOTES.F2, NOTES.C3, NOTES.F3, NOTES.A3],   // F
      [NOTES.C3, NOTES.G3, NOTES.C4, NOTES.E4],   // C
      [NOTES.D3, NOTES.A3, NOTES.D4, NOTES.Fs4],  // D Major (Epic draconic triumph!)
    ],
    bass: [
      makeBar([[0, NOTES.D2], [2, NOTES.D2], [4, NOTES.D3], [6, NOTES.A2], [8, NOTES.D2], [10, NOTES.D2], [12, NOTES.F2], [14, NOTES.E2]]),
      makeBar([[0, NOTES.F2], [2, NOTES.F2], [4, NOTES.F3], [6, NOTES.C3], [8, NOTES.F2], [10, NOTES.F2], [12, NOTES.A2], [14, NOTES.G2]]),
      makeBar([[0, NOTES.C3], [2, NOTES.C3], [4, NOTES.C4], [6, NOTES.G2], [8, NOTES.C3], [10, NOTES.C3], [12, NOTES.E3], [14, NOTES.D3]]),
      makeBar([[0, NOTES.D3], [2, NOTES.D3], [4, NOTES.Fs3], [6, NOTES.A3], [8, NOTES.D4], [10, NOTES.D4], [12, NOTES.A3], [14, NOTES.D4]]),
    ],
    melody: [
      makeBar([[0, NOTES.D5], [2, NOTES.F5], [4, NOTES.A5], [8, NOTES.D6], [12, NOTES.C6]]),
      makeBar([[0, NOTES.A5], [4, NOTES.C6], [8, NOTES.F6], [12, NOTES.E6]]),
      makeBar([[0, NOTES.G5], [4, NOTES.C6], [8, NOTES.E6], [12, NOTES.D6]]),
      makeBar([[0, NOTES.A5], [2, NOTES.D6], [4, NOTES.Fs6], [8, NOTES.A6], [12, NOTES.D7]]),
    ],
  },
};
