/**
 * AudioManager
 * High-definition procedural Web Audio API sound synthesizer and dynamic audio engine.
 * Upgraded for Project Aria: Premium, mature medieval fantasy orchestral score and sound effects.
 * 
 * Features:
 * - Browser-safe AudioContext lifecycle (unlock on first user interaction, idempotent init, resume handling)
 * - Structured Master Audio Bus (Sources -> Category Gains [SFX/Music] -> Master Gain -> Destination)
 * - Master Volume control with localStorage persistence
 * - Reliable Mute toggle with state persistence and previous volume restoration
 * - Mature medieval fantasy sound palette:
 *     - Movement: subtle leather boot swishes, athletic leaps, stone/earth footsteps, kinetic springboard recoil
 *     - Combat: razor-sharp steel blade slashes, forged parries, deep heavy impacts, arcane incantations, armor crunches
 *     - Defeat & Death: crushing demise blows, dissolving dark essence groans, solemn cathedral death knell
 *     - Shrines & Portals: profound bronze sanctuary bell tolls, sacred choral swells, dimensional rune vortexes
 *     - Rewards: resonant antique gold doubloon clinks, heavy iron-bound oak chest creaks
 *     - Bosses & Titans: thunderous war horn blasts, seismic subterranean tremors, crushing kinetic swings, cinematic victory stings
 *     - UI: restrained steel sheath scrapes, heavy iron latch clicks
 * - Biome-aware procedural Medieval Orchestral Music Engine:
 *     - Timpani & Taiko war drums with leather mallet transients and room reverberation
 *     - Military field marching snares, forged steel anvil strikes, and chainmail percussion
 *     - Multi-oscillator bowed string ensembles with driving 16th-note spiccato ostinatos in combat
 *     - Dark monastic choir formant drones
 *     - French horn and battle trombone swells
 *     - Medieval plucked lute, antique shawm, and celestial harp melodies
 *     - Modal harmonic profiles across all 6 worlds + Title Screen (Dorian, Aeolian, Phrygian, Byzantine)
 * - Zero external audio files required. Zero performance regression.
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
    this.sceneThemes = SCENE_THEMES;
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

      // SFX Category Gain (connects to Master, ample headroom)
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(0.85, this.ctx.currentTime);
      this.sfxGain.gain.value = 0.85;
      this.sfxGain.connect(this.masterGain);

      // Music Category Gain (connects to Master, leaves headroom for punchy combat SFX)
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
      this.musicGain.gain.value = 0.35;
      this.musicGain.connect(this.masterGain);

      // Dedicated Music Sub-Busses for Scene-Wise Dynamic Mix Elevation
      this.musicPadGain = this.ctx.createGain();
      this.musicPadGain.gain.setValueAtTime(0.30, this.ctx.currentTime);
      this.musicPadGain.gain.value = 0.30;
      this.musicPadGain.connect(this.musicGain);

      this.musicBassGain = this.ctx.createGain();
      this.musicBassGain.gain.setValueAtTime(0.32, this.ctx.currentTime);
      this.musicBassGain.gain.value = 0.32;
      this.musicBassGain.connect(this.musicGain);

      this.musicLeadGain = this.ctx.createGain();
      this.musicLeadGain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      this.musicLeadGain.gain.value = 0.25;
      this.musicLeadGain.connect(this.musicGain);

      this.musicArpGain = this.ctx.createGain();
      this.musicArpGain.gain.setValueAtTime(0.20, this.ctx.currentTime);
      this.musicArpGain.gain.value = 0.20;
      this.musicArpGain.connect(this.musicGain);

      this.musicDrumsGain = this.ctx.createGain();
      this.musicDrumsGain.gain.setValueAtTime(0.08, this.ctx.currentTime); // Gentle heartbeat/ambient war drum baseline
      this.musicDrumsGain.gain.value = 0.08;
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
    this.updateDynamicBGM(biome);
  }

  // ========================================================
  // 1. PLAYER JUMP SFX (Subtle athletic leap & leather cloak snap)
  // Replaces cartoon upward chirp with mature medieval movement.
  // ========================================================
  playJump() {
    if (!this.ensureReady() || this.isMuted) return;
    const now = this.ctx.currentTime;

    try {
      // 1. Crisp athletic movement & cloak snap (filtered noise transient, 45ms)
      if (this.noiseBuffer) {
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.noiseBuffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1400, now);
        filter.Q.value = 1.2;

        const nGain = this.ctx.createGain();
        nGain.gain.setValueAtTime(0.001, now);
        nGain.gain.linearRampToValueAtTime(0.24, now + 0.005);
        nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

        noise.connect(filter);
        filter.connect(nGain);
        nGain.connect(this.sfxGain);
        noise.start(now);
        noise.stop(now + 0.055);
      }

      // 2. Subtle athletic launch body (low air displacement, 95Hz -> 55Hz, zero chirp)
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(95, now);
      osc.frequency.exponentialRampToValueAtTime(55, now + 0.06);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.26, now + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.005, now + 0.07);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.075);
    } catch (e) {}
  }

  // ========================================================
  // 1B. PLAYER DOUBLE JUMP SFX (Ancient mystical rune surge & vortex)
  // Replaces childish high chimes with deep occult updraft.
  // ========================================================
  playDoubleJump() {
    if (!this.ensureReady() || this.isMuted) return;
    const now = this.ctx.currentTime;

    try {
      // 1. Ancient mystical wind surge & arcane vortex
      if (this.noiseBuffer) {
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.noiseBuffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(450, now);
        filter.frequency.exponentialRampToValueAtTime(1250, now + 0.12);
        filter.Q.value = 1.8;

        const nGain = this.ctx.createGain();
        nGain.gain.setValueAtTime(0.001, now);
        nGain.gain.linearRampToValueAtTime(0.30, now + 0.012);
        nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

        noise.connect(filter);
        filter.connect(nGain);
        nGain.connect(this.sfxGain);
        noise.start(now);
        noise.stop(now + 0.16);
      }

      // 2. Deep ethereal rune chord (D3 146.8Hz + A3 220Hz resonant fifth)
      [146.83, 220.0].forEach((freq) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);
        osc.frequency.linearRampToValueAtTime(freq * 1.15, now + 0.12);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.20, now + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.002, now + 0.16);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.17);
      });
    } catch (e) {}
  }

  // ========================================================
  // 2. PLAYER LAND SFX (Weighty stone/earth boot impact)
  // Replaces light blip with solid medieval footfall impact.
  // ========================================================
  playLand() {
    if (!this.ensureReady() || this.isMuted) return;
    const now = this.ctx.currentTime;

    try {
      // 1. Solid stone/earth footfall impact thud
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(95, now);
      osc.frequency.exponentialRampToValueAtTime(36, now + 0.09);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.42, now + 0.004);
      gain.gain.exponentialRampToValueAtTime(0.005, now + 0.11);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.12);

      // 2. Leather boot and gravel/stone grit transient
      if (this.noiseBuffer) {
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.noiseBuffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(850, now);

        const nGain = this.ctx.createGain();
        nGain.gain.setValueAtTime(0.001, now);
        nGain.gain.linearRampToValueAtTime(0.32, now + 0.003);
        nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

        noise.connect(filter);
        filter.connect(nGain);
        nGain.connect(this.sfxGain);
        noise.start(now);
        noise.stop(now + 0.065);
      }
    } catch (e) {}
  }

  // ========================================================
  // 2B. BOUNCE SFX (Heavy kinetic tension springboard launch)
  // Replaces cartoon upward "boing" with resonant tension rebound.
  // ========================================================
  playBounce() {
    if (!this.ensureReady() || this.isMuted) return;
    const now = this.ctx.currentTime;

    try {
      // Heavy kinetic tension release (downward sweep, not cartoon upward boing)
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(62, now + 0.18);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.44, now + 0.006);
      gain.gain.exponentialRampToValueAtTime(0.005, now + 0.22);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.23);

      // Resonant timber / amber sub body
      const sub = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      sub.type = 'sine';
      sub.frequency.setValueAtTime(80, now);
      sub.frequency.exponentialRampToValueAtTime(38, now + 0.15);

      subGain.gain.setValueAtTime(0.001, now);
      subGain.gain.linearRampToValueAtTime(0.32, now + 0.005);
      subGain.gain.exponentialRampToValueAtTime(0.005, now + 0.16);

      sub.connect(subGain);
      subGain.connect(this.sfxGain);
      sub.start(now);
      sub.stop(now + 0.17);
    } catch (e) {}
  }

  // ========================================================
  // 3. DASH SFX (Aerodynamic blade-wind rush & cloak slash)
  // Replaces soft sparkle bell with fierce cutting wind whoosh.
  // ========================================================
  playDash() {
    if (!this.ensureReady() || this.isMuted) return;
    const now = this.ctx.currentTime;

    try {
      // Slicing aerodynamic wind rush
      if (this.noiseBuffer) {
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.noiseBuffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1600, now);
        filter.frequency.exponentialRampToValueAtTime(450, now + 0.16);
        filter.Q.value = 2.4;

        const nGain = this.ctx.createGain();
        nGain.gain.setValueAtTime(0.001, now);
        nGain.gain.linearRampToValueAtTime(0.46, now + 0.008);
        nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

        noise.connect(filter);
        filter.connect(nGain);
        nGain.connect(this.sfxGain);
        noise.start(now);
        noise.stop(now + 0.19);
      }

      // Low cutting whoosh transient
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.exponentialRampToValueAtTime(70, now + 0.15);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.36, now + 0.006);
      gain.gain.exponentialRampToValueAtTime(0.005, now + 0.16);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.17);
    } catch (e) {}
  }

  // ========================================================
  // 4. MELEE ATTACK SFX (Forged steel blade slash & air slice)
  // Replaces cute fairy chime with authentic cutting steel blade slash.
  // ========================================================
  playAttack() {
    if (!this.ensureReady() || this.isMuted) return;
    const now = this.ctx.currentTime;

    try {
      // 1. Razor-sharp cutting blade whoosh
      if (this.noiseBuffer) {
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.noiseBuffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(2600, now);
        filter.frequency.exponentialRampToValueAtTime(750, now + 0.12);
        filter.Q.value = 2.0;

        const nGain = this.ctx.createGain();
        nGain.gain.setValueAtTime(0.001, now);
        nGain.gain.linearRampToValueAtTime(0.48, now + 0.006);
        nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

        noise.connect(filter);
        filter.connect(nGain);
        nGain.connect(this.sfxGain);
        noise.start(now);
        noise.stop(now + 0.15);
      }

      // 2. High-tensile steel blade body
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.12);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.38, now + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.005, now + 0.13);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.14);

      // 3. High steel sing overtone (authentic forged sword swing)
      const ringOsc = this.ctx.createOscillator();
      const ringGain = this.ctx.createGain();
      ringOsc.type = 'sine';
      ringOsc.frequency.setValueAtTime(2100, now);
      ringOsc.frequency.exponentialRampToValueAtTime(1400, now + 0.14);

      ringGain.gain.setValueAtTime(0.001, now);
      ringGain.gain.linearRampToValueAtTime(0.18, now + 0.006);
      ringGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      ringOsc.connect(ringGain);
      ringGain.connect(this.sfxGain);
      ringOsc.start(now);
      ringOsc.stop(now + 0.16);
    } catch (e) {}
  }

  // Backward compatibility alias
  playEnemyAttack() {
    this.playAttack();
  }

  // ========================================================
  // 4B. HEAVY ATTACK SFX (Crushing warhammer / claymore cleave)
  // Deep impact and powerful low-frequency weight.
  // ========================================================
  playHeavyAttack() {
    if (!this.ensureReady() || this.isMuted) return;
    const now = this.ctx.currentTime;

    try {
      const sub = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      sub.type = 'sine';
      sub.frequency.setValueAtTime(110, now);
      sub.frequency.exponentialRampToValueAtTime(32, now + 0.22);
      subGain.gain.setValueAtTime(0.001, now);
      subGain.gain.linearRampToValueAtTime(0.60, now + 0.008);
      subGain.gain.exponentialRampToValueAtTime(0.005, now + 0.25);
      sub.connect(subGain);
      subGain.connect(this.sfxGain);
      sub.start(now);
      sub.stop(now + 0.26);

      this.playAttack();
    } catch (e) {}
  }

  // ========================================================
  // 4C. ARCANE STARSHOT SFX (Medieval occult bolt & incantation)
  // Replaces toy laser beep with arcane fire discharge.
  // ========================================================
  playStarshot() {
    if (!this.ensureReady() || this.isMuted) return;
    const now = this.ctx.currentTime;

    try {
      // 1. Low occult charge rumble
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(130, now);
      osc.frequency.exponentialRampToValueAtTime(320, now + 0.08);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.38, now + 0.006);
      gain.gain.exponentialRampToValueAtTime(0.005, now + 0.12);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.13);

      // 2. Crackling mystic discharge transient
      if (this.noiseBuffer) {
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.noiseBuffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1200, now);
        filter.Q.value = 1.8;

        const nGain = this.ctx.createGain();
        nGain.gain.setValueAtTime(0.001, now + 0.015);
        nGain.gain.linearRampToValueAtTime(0.36, now + 0.025);
        nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

        noise.connect(filter);
        filter.connect(nGain);
        nGain.connect(this.sfxGain);
        noise.start(now + 0.015);
        noise.stop(now + 0.16);
      }

      // 3. Piercing arcane core (D5 587Hz -> A5 880Hz, solid resonant beam)
      const core = this.ctx.createOscillator();
      const coreGain = this.ctx.createGain();
      core.type = 'sine';
      core.frequency.setValueAtTime(587.33, now);
      core.frequency.exponentialRampToValueAtTime(880, now + 0.14);

      coreGain.gain.setValueAtTime(0.001, now);
      coreGain.gain.linearRampToValueAtTime(0.30, now + 0.008);
      coreGain.gain.exponentialRampToValueAtTime(0.002, now + 0.16);

      core.connect(coreGain);
      coreGain.connect(this.sfxGain);
      core.start(now);
      core.stop(now + 0.17);
    } catch (e) {}
  }

  // ========================================================
  // 4D. ARCANE IMPACT SFX (Concussive spell blast & stone shatter)
  // Replaces chime dispersion with heavy crushing shockwave.
  // ========================================================
  playStarHit() {
    if (!this.ensureReady() || this.isMuted) return;
    const now = this.ctx.currentTime;

    try {
      // Concussive arcane explosion thud
      const sub = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      sub.type = 'sine';
      sub.frequency.setValueAtTime(140, now);
      sub.frequency.exponentialRampToValueAtTime(42, now + 0.14);

      subGain.gain.setValueAtTime(0.001, now);
      subGain.gain.linearRampToValueAtTime(0.50, now + 0.004);
      subGain.gain.exponentialRampToValueAtTime(0.005, now + 0.16);

      sub.connect(subGain);
      subGain.connect(this.sfxGain);
      sub.start(now);
      sub.stop(now + 0.17);

      // Arcane fracture crack
      if (this.noiseBuffer) {
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.noiseBuffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(850, now);
        filter.Q.value = 1.4;

        const nGain = this.ctx.createGain();
        nGain.gain.setValueAtTime(0.001, now);
        nGain.gain.linearRampToValueAtTime(0.36, now + 0.005);
        nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

        noise.connect(filter);
        filter.connect(nGain);
        nGain.connect(this.sfxGain);
        noise.start(now);
        noise.stop(now + 0.15);
      }
    } catch (e) {}
  }

  // ========================================================
  // 4E. SHIELD / PARRY DEFLECTION SFX (Steel-on-steel parry clang)
  // Replaces square wave beep with ringing forged blade harmonics.
  // ========================================================
  playDeflect() {
    if (!this.ensureReady() || this.isMuted) return;
    const now = this.ctx.currentTime;

    try {
      // 1. Initial high-velocity iron impact transient
      const transient = this.ctx.createOscillator();
      const tGain = this.ctx.createGain();
      transient.type = 'triangle';
      transient.frequency.setValueAtTime(1400, now);
      transient.frequency.exponentialRampToValueAtTime(280, now + 0.04);

      tGain.gain.setValueAtTime(0.001, now);
      tGain.gain.linearRampToValueAtTime(0.45, now + 0.002);
      tGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      transient.connect(tGain);
      tGain.connect(this.sfxGain);
      transient.start(now);
      transient.stop(now + 0.055);

      // 2. Ringing forged blade harmonics (authentic steel-on-steel ring)
      [2200, 3520].forEach((freq) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.24, now + 0.004);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.23);
      });
    } catch (e) {}
  }

  // ========================================================
  // 5. COLLECT REWARD SFX (Antique gold doubloon clink)
  // Replaces Mario-style high arpeggio with rich metallic gold coin chime.
  // ========================================================
  playCollect() {
    if (!this.ensureReady() || this.isMuted) return;
    const now = this.ctx.currentTime;

    try {
      // Satisfying antique gold coin clink (heavy metallic gold doubloon)
      const partials = [1975.53, 2793.83, 3729.31]; // B6, F7, Bb7
      partials.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.015);

        const amp = 0.22 / (idx + 1);
        gain.gain.setValueAtTime(0.001, now + idx * 0.015);
        gain.gain.linearRampToValueAtTime(amp, now + idx * 0.015 + 0.004);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.015 + 0.24);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now + idx * 0.015);
        osc.stop(now + idx * 0.015 + 0.25);
      });
    } catch (e) {}
  }

  playCoin() {
    this.playCollect();
  }

  // ========================================================
  // 5B. TREASURE CHEST OPEN SFX (Heavy oak & forged iron latch)
  // Heavy iron unlatching, stone lid sliding, and clinking gold.
  // ========================================================
  playTreasureOpen() {
    if (!this.ensureReady() || this.isMuted) return;
    const now = this.ctx.currentTime;

    try {
      // 1. Heavy iron latch unlatch clank
      const latch = this.ctx.createOscillator();
      const lGain = this.ctx.createGain();
      latch.type = 'triangle';
      latch.frequency.setValueAtTime(320, now);
      latch.frequency.exponentialRampToValueAtTime(80, now + 0.09);
      lGain.gain.setValueAtTime(0.001, now);
      lGain.gain.linearRampToValueAtTime(0.35, now + 0.004);
      lGain.gain.exponentialRampToValueAtTime(0.005, now + 0.10);
      latch.connect(lGain);
      lGain.connect(this.sfxGain);
      latch.start(now);
      latch.stop(now + 0.11);

      // 2. Oak lid scraping open (filtered lowpass noise friction)
      if (this.noiseBuffer) {
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.noiseBuffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(550, now + 0.05);

        const nGain = this.ctx.createGain();
        nGain.gain.setValueAtTime(0.001, now + 0.05);
        nGain.gain.linearRampToValueAtTime(0.28, now + 0.07);
        nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);

        noise.connect(filter);
        filter.connect(nGain);
        nGain.connect(this.sfxGain);
        noise.start(now + 0.05);
        noise.stop(now + 0.27);
      }

      // 3. Gold bullion clink
      this.playCollect();
    } catch (e) {}
  }

  // ========================================================
  // 6. ENEMY HIT / BOUNCE STOMP SFX (Visceral medieval combat blow)
  // Replaces 8-bit square chip buzz with blunt trauma impact & armor crunch.
  // ========================================================
  playEnemyHit() {
    if (!this.ensureReady() || this.isMuted) return;
    const now = this.ctx.currentTime;

    try {
      // 1. Heavy blunt trauma body thud (low-end punch)
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.12);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.55, now + 0.004);
      gain.gain.exponentialRampToValueAtTime(0.005, now + 0.14);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.15);

      // 2. Flesh & armor impact crunch (shaped lowpass noise crack)
      if (this.noiseBuffer) {
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.noiseBuffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(800, now);
        filter.Q.value = 1.4;

        const nGain = this.ctx.createGain();
        nGain.gain.setValueAtTime(0.001, now);
        nGain.gain.linearRampToValueAtTime(0.48, now + 0.003);
        nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

        noise.connect(filter);
        filter.connect(nGain);
        nGain.connect(this.sfxGain);
        noise.start(now);
        noise.stop(now + 0.075);
      }
    } catch (e) {}
  }

  playStomp() {
    this.playEnemyHit();
  }

  playHit() {
    this.playEnemyHit();
  }

  // ========================================================
  // 7. ENEMY DEFEATED SFX (Crushing vanquish & dark essence dispersal)
  // Replaces cartoon upward chord chirp with heavy demise impact & spirit groan.
  // ========================================================
  playEnemyDefeat() {
    if (!this.ensureReady() || this.isMuted) return;
    const now = this.ctx.currentTime;

    try {
      // 1. Heavy crushing demise blow (sub bass impact)
      const sub = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      sub.type = 'sine';
      sub.frequency.setValueAtTime(95, now);
      sub.frequency.exponentialRampToValueAtTime(35, now + 0.18);

      subGain.gain.setValueAtTime(0.001, now);
      subGain.gain.linearRampToValueAtTime(0.58, now + 0.006);
      subGain.gain.exponentialRampToValueAtTime(0.005, now + 0.22);

      sub.connect(subGain);
      subGain.connect(this.sfxGain);
      sub.start(now);
      sub.stop(now + 0.23);

      // 2. Dark dissipating spirit moan (descending resonant bandpass noise)
      if (this.noiseBuffer) {
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.noiseBuffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(550, now);
        filter.frequency.exponentialRampToValueAtTime(140, now + 0.35);
        filter.Q.value = 2.2;

        const nGain = this.ctx.createGain();
        nGain.gain.setValueAtTime(0.001, now + 0.02);
        nGain.gain.linearRampToValueAtTime(0.35, now + 0.04);
        nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

        noise.connect(filter);
        filter.connect(nGain);
        nGain.connect(this.sfxGain);
        noise.start(now + 0.02);
        noise.stop(now + 0.40);
      }
    } catch (e) {}
  }

  // ========================================================
  // 7B. BOSS DEFEATED STING (Cinematic Victory Fanfare & Cathedral Bell)
  // Short triumphant orchestral brass cadence with cathedral bell toll.
  // ========================================================
  playBossDefeat() {
    if (!this.ensureReady() || this.isMuted) return;
    const now = this.ctx.currentTime;

    try {
      // 1. Thunderous war drum cadence
      this.playSynthKick(now, true, 1.3);
      this.playSynthKick(now + 0.18, true, 1.1);
      this.playSynthKick(now + 0.36, true, 1.4);

      // 2. Grand heraldic brass fanfare (Noble D minor to D Major Picardy cadence)
      const brassChords = [
        { t: now + 0.4, notes: [293.66, 440.0, 587.33], dur: 0.28 }, // Dm triad
        { t: now + 0.75, notes: [329.63, 493.88, 659.25], dur: 0.28 }, // Em
        { t: now + 1.1, notes: [293.66, 369.99, 440.0, 587.33], dur: 1.2 }, // D Major Triumphant Picardy Third!
      ];

      brassChords.forEach(chord => {
        chord.notes.forEach(f => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          const filter = this.ctx.createBiquadFilter();

          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(f, chord.t);

          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(400, chord.t);
          filter.frequency.linearRampToValueAtTime(2200, chord.t + 0.08);
          filter.frequency.linearRampToValueAtTime(800, chord.t + chord.dur);
          filter.Q.value = 1.8;

          gain.gain.setValueAtTime(0.001, chord.t);
          gain.gain.linearRampToValueAtTime(0.24, chord.t + 0.04);
          gain.gain.exponentialRampToValueAtTime(0.001, chord.t + chord.dur);

          osc.connect(filter);
          filter.connect(gain);
          gain.connect(this.sfxGain);
          osc.start(chord.t);
          osc.stop(chord.t + chord.dur + 0.02);
        });
      });

      // 3. Resonant cathedral sanctuary bell ringing out at end
      const bellTime = now + 1.1;
      const bellOsc = this.ctx.createOscillator();
      const bellGain = this.ctx.createGain();
      bellOsc.type = 'sine';
      bellOsc.frequency.setValueAtTime(587.33, bellTime);
      bellGain.gain.setValueAtTime(0.001, bellTime);
      bellGain.gain.linearRampToValueAtTime(0.35, bellTime + 0.01);
      bellGain.gain.exponentialRampToValueAtTime(0.001, bellTime + 1.8);
      bellOsc.connect(bellGain);
      bellGain.connect(this.sfxGain);
      bellOsc.start(bellTime);
      bellOsc.stop(bellTime + 1.85);
    } catch (e) {}
  }

  playBossDefeatSting() {
    this.playBossDefeat();
  }

  // ========================================================
  // 8. SHRINE / CHECKPOINT ACTIVATION (Sacred Cathedral Bell Toll)
  // Replaces simple triad with profound bronze sanctuary bell toll & choral fifth.
  // ========================================================
  playCheckpoint() {
    if (!this.ensureReady() || this.isMuted) return;
    const now = this.ctx.currentTime;

    try {
      // 1. Profound bronze sanctuary bell toll (Low G3 196Hz with resonant inharmonics)
      const partials = [
        { f: 196.0, a: 0.40, d: 1.6 },
        { f: 392.0, a: 0.28, d: 1.2 },
        { f: 587.33, a: 0.22, d: 0.9 },
        { f: 783.99, a: 0.16, d: 0.7 },
      ];

      partials.forEach(p => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(p.f, now);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(p.a, now + 0.008);
        gain.gain.exponentialRampToValueAtTime(0.001, now + p.d);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + p.d + 0.02);
      });

      // 2. Ethereal sacred choir swell (G3 + D4 + G4 fifths with slow room decay)
      [196.0, 293.66, 392.0].forEach(f => {
        const osc = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, now + 0.05);

        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(f * 1.5, now + 0.05);
        filter.Q.value = 2.0;

        gain.gain.setValueAtTime(0.001, now + 0.05);
        gain.gain.linearRampToValueAtTime(0.20, now + 0.35);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now + 0.05);
        osc.stop(now + 1.25);
      });
    } catch (e) {}
  }

  // ========================================================
  // 8B. SECRET DISCOVERY SFX (Mysterious ancient modal discovery cue)
  // Replaces major twinkle with D Dorian / A minor harp arpeggio & French horn swell.
  // ========================================================
  playSecretDiscovery() {
    if (!this.ensureReady() || this.isMuted) return;
    const now = this.ctx.currentTime;

    try {
      // Plucked antique harp in D Dorian (D4, F4, A4, C5, D5)
      const notes = [293.66, 349.23, 440.0, 523.25, 587.33];
      notes.forEach((freq, idx) => {
        const t = now + idx * 0.06;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(0.26, t + 0.008);
        gain.gain.exponentialRampToValueAtTime(0.002, t + 0.55);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.56);
      });

      // Low French horn mysterious fifth swell (D3 + A3)
      [146.83, 220.0].forEach(f => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + 0.05);
        gain.gain.setValueAtTime(0.001, now + 0.05);
        gain.gain.linearRampToValueAtTime(0.22, now + 0.25);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now + 0.05);
        osc.stop(now + 0.82);
      });
    } catch (e) {}
  }

  playSecret() {
    this.playSecretDiscovery();
  }

  // ========================================================
  // 9. DAMAGE / HURT SFX (Visceral combat injury & armor breach blow)
  // Replaces sawtooth buzz with heavy blunt impact & armor breach friction.
  // ========================================================
  playDamage() {
    if (!this.ensureReady() || this.isMuted) return;
    const now = this.ctx.currentTime;

    try {
      // Concussive blunt body trauma thud
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(110, now);
      osc.frequency.exponentialRampToValueAtTime(32, now + 0.18);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.60, now + 0.006);
      gain.gain.exponentialRampToValueAtTime(0.005, now + 0.22);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.23);

      // Slicing armor/cloth breach tear
      if (this.noiseBuffer) {
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.noiseBuffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1100, now);
        filter.Q.value = 1.4;

        const nGain = this.ctx.createGain();
        nGain.gain.setValueAtTime(0.001, now);
        nGain.gain.linearRampToValueAtTime(0.45, now + 0.005);
        nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);

        noise.connect(filter);
        filter.connect(nGain);
        nGain.connect(this.sfxGain);
        noise.start(now);
        noise.stop(now + 0.12);
      }
    } catch (e) {}
  }

  playHurt() {
    this.playDamage();
  }

  playEnemyHurt() {
    this.playDamage();
  }

  // ========================================================
  // 10. DEATH SFX (Dark cinematic death knell & mournful cello slide)
  // Replaces 8-bit descending sad trombone with solemn cathedral death knell.
  // ========================================================
  playDeath() {
    if (!this.ensureReady() || this.isMuted) return;
    const now = this.ctx.currentTime;

    try {
      // 1. Ominous solemn death knell bell (Low A2 110Hz with dissonant partials)
      const bellPartials = [110.0, 220.0, 311.13, 440.0, 587.33];
      bellPartials.forEach((f, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.35 / (i + 1), now + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 1.85);
      });

      // 2. Descending mournful cello slide
      const cello = this.ctx.createOscillator();
      const cFilter = this.ctx.createBiquadFilter();
      const cGain = this.ctx.createGain();
      cello.type = 'sawtooth';
      cello.frequency.setValueAtTime(110.0, now + 0.1);
      cello.frequency.exponentialRampToValueAtTime(55.0, now + 1.2);

      cFilter.type = 'lowpass';
      cFilter.frequency.setValueAtTime(320, now + 0.1);

      cGain.gain.setValueAtTime(0.001, now + 0.1);
      cGain.gain.linearRampToValueAtTime(0.35, now + 0.35);
      cGain.gain.exponentialRampToValueAtTime(0.001, now + 1.4);

      cello.connect(cFilter);
      cFilter.connect(cGain);
      cGain.connect(this.sfxGain);
      cello.start(now + 0.1);
      cello.stop(now + 1.45);
    } catch (e) {}
  }

  // ========================================================
  // 11. LEVEL COMPLETE / RESCUE FANFARE (Grand Medieval Heraldic Fanfare)
  // Noble French horns, trumpets and war drums in modal harmony.
  // ========================================================
  playLevelComplete() {
    if (!this.ensureReady() || this.isMuted) return;
    const now = this.ctx.currentTime;

    try {
      const melody = [
        { f: 293.66, d: 0.18 }, // D4
        { f: 369.99, d: 0.18 }, // F#4
        { f: 440.00, d: 0.18 }, // A4
        { f: 587.33, d: 0.32 }, // D5
        { f: 493.88, d: 0.20 }, // B4
        { f: 587.33, d: 0.95 }, // D5 hold
      ];

      let t = now;
      melody.forEach(note => {
        const osc = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(note.f, t);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(350, t);
        filter.frequency.linearRampToValueAtTime(2000, t + 0.05);
        filter.frequency.linearRampToValueAtTime(850, t + note.d);

        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(0.35, t + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, t + note.d);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(t);
        osc.stop(t + note.d + 0.02);
        t += note.d * 0.85;
      });

      // Supporting war drum downbeat
      this.playSynthKick(now, true, 1.2);
    } catch (e) {}
  }

  playVictory() {
    this.playLevelComplete();
  }

  // ========================================================
  // 12. UI & MENU SOUNDS (Restrained steel & iron latch cues)
  // Replaces childish bleeps with tactile medieval UI cues.
  // ========================================================
  playStart() {
    if (!this.ensureReady() || this.isMuted) return;
    const now = this.ctx.currentTime;

    try {
      // Resonant medieval war horn / heraldic fanfare signal + bronze gong
      const gong = this.ctx.createOscillator();
      const gGain = this.ctx.createGain();
      gong.type = 'sine';
      gong.frequency.setValueAtTime(110, now);
      gGain.gain.setValueAtTime(0.001, now);
      gGain.linearRampToValueAtTime(0.45, now + 0.01);
      gGain.exponentialRampToValueAtTime(0.001, now + 0.8);
      gong.connect(gGain);
      gGain.connect(this.sfxGain);
      gong.start(now);
      gong.stop(now + 0.85);

      // Heraldic French horn fifth (D4 293.66Hz + A4 440Hz)
      [293.66, 440.0].forEach(f => {
        const osc = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(f, now + 0.04);
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(350, now + 0.04);
        filter.frequency.linearRampToValueAtTime(1800, now + 0.18);
        filter.Q.value = 1.6;
        gain.gain.setValueAtTime(0.001, now + 0.04);
        gain.linearRampToValueAtTime(0.32, now + 0.1);
        gain.exponentialRampToValueAtTime(0.001, now + 0.7);
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now + 0.04);
        osc.stop(now + 0.72);
      });
    } catch (e) {}
  }

  playMenuHover() {
    if (!this.ensureReady() || this.isMuted) return;
    const now = this.ctx.currentTime;

    try {
      // Subtle polished steel blade scrape / soft parchment cue
      if (this.noiseBuffer) {
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.noiseBuffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(2800, now);
        filter.Q.value = 2.8;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.14, now + 0.004);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);
        noise.start(now);
        noise.stop(now + 0.05);
      }
    } catch (e) {}
  }

  playHover() {
    this.playMenuHover();
  }

  playMenuSelect() {
    if (!this.ensureReady() || this.isMuted) return;
    const now = this.ctx.currentTime;

    try {
      // Heavy iron latch click / ancient stone seal lock
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.06);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.30, now + 0.004);
      gain.gain.exponentialRampToValueAtTime(0.005, now + 0.07);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.08);

      // Second crisp metallic catch
      const catchOsc = this.ctx.createOscillator();
      const cGain = this.ctx.createGain();
      catchOsc.type = 'sine';
      catchOsc.frequency.setValueAtTime(1480, now + 0.015);
      cGain.gain.setValueAtTime(0.001, now + 0.015);
      cGain.gain.linearRampToValueAtTime(0.18, now + 0.02);
      cGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
      catchOsc.connect(cGain);
      cGain.connect(this.sfxGain);
      catchOsc.start(now + 0.015);
      catchOsc.stop(now + 0.095);
    } catch (e) {}
  }

  playSelect() {
    this.playMenuSelect();
  }

  // ========================================================
  // 13. ENEMY ALERT / THREAT WARNING SFX (Sinister minor second clash)
  // Replaces cute upward beep with tense combat warning.
  // ========================================================
  playEnemyAlert() {
    if (!this.ensureReady() || this.isMuted) return;
    const now = this.ctx.currentTime;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.linearRampToValueAtTime(233.08, now + 0.1); // Bb minor second dissonance

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.32, now + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.005, now + 0.14);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.15);
    } catch (e) {}
  }

  // ========================================================
  // 14. BOSS EVENTS (Thunderous War Horns & Seismic Quakes)
  // ========================================================
  playQueenBeeAppearance() {
    if (!this.ensureReady() || this.isMuted) return;
    const now = this.ctx.currentTime;

    try {
      // Thunderous boss entrance: deep war horn blast + seismic subterranean quake
      const horn = this.ctx.createOscillator();
      const hFilter = this.ctx.createBiquadFilter();
      const hGain = this.ctx.createGain();
      horn.type = 'sawtooth';
      horn.frequency.setValueAtTime(73.42, now); // D2 low battle horn
      hFilter.type = 'lowpass';
      hFilter.frequency.setValueAtTime(200, now);
      hFilter.frequency.linearRampToValueAtTime(650, now + 0.4);
      hFilter.frequency.linearRampToValueAtTime(180, now + 2.2);

      hGain.gain.setValueAtTime(0.001, now);
      hGain.gain.linearRampToValueAtTime(0.48, now + 0.2);
      hGain.gain.exponentialRampToValueAtTime(0.005, now + 2.4);

      horn.connect(hFilter);
      hFilter.connect(hGain);
      hGain.connect(this.sfxGain);
      horn.start(now);
      horn.stop(now + 2.45);

      // Seismic subterranean sub tremor
      const sub = this.ctx.createOscillator();
      const sGain = this.ctx.createGain();
      sub.type = 'sine';
      sub.frequency.setValueAtTime(48, now);
      sub.frequency.linearRampToValueAtTime(32, now + 2.5);

      sGain.gain.setValueAtTime(0.001, now);
      sGain.gain.linearRampToValueAtTime(0.55, now + 0.1);
      sGain.gain.exponentialRampToValueAtTime(0.01, now + 2.6);

      sub.connect(sGain);
      sGain.connect(this.sfxGain);
      sub.start(now);
      sub.stop(now + 2.65);
    } catch (e) {}
  }

  playBossEntrance() {
    this.playQueenBeeAppearance();
  }

  playQueenBeeBuzz() {
    if (!this.ensureReady() || this.isMuted) return;
    const now = this.ctx.currentTime;

    try {
      // Menacing chitinous titan drone
      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(65, now);
      osc.frequency.linearRampToValueAtTime(52, now + 1.8);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(220, now);
      filter.Q.value = 2.5;

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.35, now + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.005, now + 1.9);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 1.95);
    } catch (e) {}
  }

  playQueenBeeAttack() {
    if (!this.ensureReady() || this.isMuted) return;
    const now = this.ctx.currentTime;

    try {
      // Threatening titan attack: crushing kinetic swing & seismic shockwave
      const swing = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      swing.type = 'triangle';
      swing.frequency.setValueAtTime(220, now);
      swing.frequency.exponentialRampToValueAtTime(45, now + 0.25);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.55, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.005, now + 0.28);

      swing.connect(gain);
      gain.connect(this.sfxGain);
      swing.start(now);
      swing.stop(now + 0.29);

      if (this.noiseBuffer) {
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.noiseBuffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(700, now);

        const nGain = this.ctx.createGain();
        nGain.gain.setValueAtTime(0.001, now);
        nGain.gain.linearRampToValueAtTime(0.40, now + 0.02);
        nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

        noise.connect(filter);
        filter.connect(nGain);
        nGain.connect(this.sfxGain);
        noise.start(now);
        noise.stop(now + 0.25);
      }
    } catch (e) {}
  }

  playBossAttack() {
    this.playQueenBeeAttack();
  }

  playBatboyReveal() {
    if (!this.ensureReady() || this.isMuted) return;
    const now = this.ctx.currentTime;

    try {
      // Ethereal rescue chord in D minor (D4, F4, A4, D5)
      const freqs = [293.66, 349.23, 440.0, 587.33];
      freqs.forEach((freq, idx) => {
        const t = now + idx * 0.08;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(0.28, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.9);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.92);
      });
    } catch (e) {}
  }

  // ========================================================
  // 15. WORLD MECHANICS & AMBIENCE
  // ========================================================
  playCrumble() {
    if (!this.ensureReady() || this.isMuted) return;
    const now = this.ctx.currentTime;

    try {
      // Heavy ancient granite fracture & stone boulder collapse
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(95, now);
      osc.frequency.exponentialRampToValueAtTime(32, now + 0.28);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.42, now + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.005, now + 0.32);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.33);

      if (this.noiseBuffer) {
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.noiseBuffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(600, now);

        const nGain = this.ctx.createGain();
        nGain.gain.setValueAtTime(0.001, now);
        nGain.gain.linearRampToValueAtTime(0.38, now + 0.02);
        nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        noise.connect(filter);
        filter.connect(nGain);
        nGain.connect(this.sfxGain);
        noise.start(now);
        noise.stop(now + 0.36);
      }
    } catch (e) {}
  }

  playExplosion() {
    if (!this.ensureReady() || this.isMuted) return;
    const now = this.ctx.currentTime;

    try {
      // Subterranean concussive blast & stone debris
      const sub = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      sub.type = 'sine';
      sub.frequency.setValueAtTime(75, now);
      sub.frequency.exponentialRampToValueAtTime(25, now + 0.6);

      subGain.gain.setValueAtTime(0.001, now);
      subGain.gain.linearRampToValueAtTime(0.65, now + 0.008);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

      sub.connect(subGain);
      subGain.connect(this.sfxGain);
      sub.start(now);
      sub.stop(now + 0.72);

      if (this.noiseBuffer) {
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.noiseBuffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(900, now);
        filter.frequency.exponentialRampToValueAtTime(150, now + 0.5);

        const nGain = this.ctx.createGain();
        nGain.gain.setValueAtTime(0.001, now);
        nGain.gain.linearRampToValueAtTime(0.55, now + 0.01);
        nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

        noise.connect(filter);
        filter.connect(nGain);
        nGain.connect(this.sfxGain);
        noise.start(now);
        noise.stop(now + 0.56);
      }
    } catch (e) {}
  }

  playGeyser() {
    if (!this.ensureReady() || this.isMuted) return;
    const now = this.ctx.currentTime;

    try {
      // Roaring high-pressure geothermal steam torrent
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(380, now + 0.35);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.40, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.005, now + 0.40);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.41);

      if (this.noiseBuffer) {
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.noiseBuffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1400, now);
        filter.Q.value = 1.4;

        const nGain = this.ctx.createGain();
        nGain.gain.setValueAtTime(0.001, now);
        nGain.gain.linearRampToValueAtTime(0.38, now + 0.02);
        nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

        noise.connect(filter);
        filter.connect(nGain);
        nGain.connect(this.sfxGain);
        noise.start(now);
        noise.stop(now + 0.39);
      }
    } catch (e) {}
  }

  // ========================================================
  // 15B. PORTAL GATE SFX (Deep magical resonance & shimmering rune vortex)
  // ========================================================
  playPortal() {
    if (!this.ensureReady() || this.isMuted) return;
    const now = this.ctx.currentTime;

    try {
      // 1. Low-frequency dimensional vortex rumble
      const sub = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      sub.type = 'sine';
      sub.frequency.setValueAtTime(55, now);
      sub.frequency.linearRampToValueAtTime(95, now + 0.25);
      sub.frequency.linearRampToValueAtTime(40, now + 0.6);

      subGain.gain.setValueAtTime(0.001, now);
      subGain.gain.linearRampToValueAtTime(0.52, now + 0.08);
      subGain.gain.exponentialRampToValueAtTime(0.002, now + 0.65);

      sub.connect(subGain);
      subGain.connect(this.sfxGain);
      sub.start(now);
      sub.stop(now + 0.66);

      // 2. Shimmering arcane energy warp
      if (this.noiseBuffer) {
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.noiseBuffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(600, now);
        filter.frequency.exponentialRampToValueAtTime(2400, now + 0.3);
        filter.Q.value = 3.5;

        const nGain = this.ctx.createGain();
        nGain.gain.setValueAtTime(0.001, now);
        nGain.gain.linearRampToValueAtTime(0.38, now + 0.12);
        nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

        noise.connect(filter);
        filter.connect(nGain);
        nGain.connect(this.sfxGain);
        noise.start(now);
        noise.stop(now + 0.56);
      }
    } catch (e) {}
  }

  // ========================================================
  // 16. DYNAMIC PROCEDURAL MEDIEVAL ORCHESTRAL MUSIC ENGINE
  // Multi-track Web Audio synthesis engine with scene-wise
  // modal chord voicings, dynamic tempo scaling, bowed double-bass drive,
  // medieval plucked motifs, driving spiccato string ostinatos,
  // dark monastic choir drones, and thunderous timpani/taiko war drums.
  // ========================================================

  updateTempoForScene(scene) {
    if (typeof SCENE_THEMES !== 'undefined' && SCENE_THEMES[scene] && SCENE_THEMES[scene].tempo) {
      this.targetTempo = SCENE_THEMES[scene].tempo;
      return;
    }
    switch (scene) {
      case 'title':
        this.targetTempo = 96;
        break;
      case 'glade':
        this.targetTempo = 112;
        break;
      case 'canopy':
        this.targetTempo = 118;
        break;
      case 'fortress':
        this.targetTempo = 126;
        break;
      case 'spire':
        this.targetTempo = 134;
        break;
      case 'climax':
        this.targetTempo = 144;
        break;
      case 'forest':
        this.targetTempo = 112;
        break;
      case 'fungal':
        this.targetTempo = 120;
        break;
      case 'briar':
        this.targetTempo = 128;
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
      case 'desert_dunes':
      case 'desert':
        this.targetTempo = 116;
        break;
      case 'cheese_canyon':
        this.targetTempo = 124;
        break;
      case 'mustard_rapids':
        this.targetTempo = 134;
        break;
      case 'sandwich_king':
        this.targetTempo = 146;
        break;
      case 'clockwork':
      case 'clockwork_gear':
        this.targetTempo = 116;
        break;
      case 'escapement_bridge':
        this.targetTempo = 124;
        break;
      case 'steam_conduit':
        this.targetTempo = 134;
        break;
      case 'time_tinker':
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
    this.updateDynamicBGM('title', 0.15, 'normal');
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
    this.bgmStep = 0;
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
      this.bgmStep = this.stepIndex; // Keep bgmStep in sync for telemetry & tests
    }
  }

  updateLayerGains() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const rampTime = 0.06;

    let targetDrums = this.currentIntensity * 0.42;
    let targetPad = 0.32;
    let targetBass = 0.34;
    let targetLead = 0.26;
    let targetArp = 0.20 + this.currentIntensity * 0.18;

    if (this.specialMode === 'secret') {
      targetDrums = 0.0; // Drums silent in sacred sanctuary
      targetBass = 0.10;
      targetPad = 0.22;
      targetLead = 0.38; // Celestial harp takes center stage
      targetArp = 0.32;
    } else if (this.specialMode === 'cinematic') {
      targetDrums = Math.min(targetDrums, 0.18);
      targetPad = 0.45;  // Majestic brass & strings swell
      targetArp = 0.35;  // Shimmering fanfare cascades
      targetLead = 0.32;
    } else if (this.specialMode === 'climax' || this.currentScene === 'climax') {
      targetDrums = 0.46; // Full driving battle pulse
      targetBass = 0.40;
      targetPad = 0.35;
      targetLead = 0.32;
      targetArp = 0.30;
    } else {
      if (this.currentIntensity < 0.25) {
        targetDrums = 0.08; // Subtle atmospheric heartbeat / distant war drum
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

    // 1. HARMONY PADS & MONASTIC CHOIR (Sustained lush strings & dark choral fifths)
    if (subStep === 0) {
      this.playSynthPadChord(chord, time, stepDuration * 15.6);
    }

    // 2. BASSLINE LAYER (Double bass and cello drive)
    const barBass = theme.bass[bar % theme.bass.length];
    const bassFreq = barBass ? barBass[subStep] : null;
    if (bassFreq) {
      this.playSynthBass(bassFreq, time, stepDuration * 1.8);
    }

    // 3. LEAD MELODY LAYER (Medieval modal lute / shawm / ancient harp / french horn)
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

    // 4. ARPEGGIO / SPICCATO STRINGS OSTINATO LAYER
    // In combat or climax: driving 16th-note spiccato ostinato!
    // In exploration: noble rhythmic harp/violin arpeggios on even subdivisions
    const isCombatOrClimax = this.currentIntensity > 0.45 || this.specialMode === 'climax' || this.currentScene === 'climax' || this.currentScene === 'slam_a_lot' || this.currentScene === 'honey_dragon' || this.currentScene === 'forest_king';
    const shouldArp = isCombatOrClimax
      ? (subStep % 2 === 0)
      : ((this.specialMode === 'cinematic') ? (subStep % 2 === 0) : (subStep % 4 === 2));

    if (shouldArp && chord && chord.length > 0) {
      const noteIdx = Math.floor(subStep / 2) % chord.length;
      const arpFreq = chord[noteIdx] * (isCombatOrClimax ? 1 : 2);
      this.playSynthArp(arpFreq, time, stepDuration * 1.3, isCombatOrClimax);
    }

    // 5. PERCUSSION LAYER: EPIC WAR DRUMS, FIELD SNARES & ANVIL STRIKES
    if (this.specialMode !== 'secret') {
      const isClimaxOrBoss = this.currentIntensity > 0.72 || this.currentScene === 'climax' || this.currentScene === 'slam_a_lot' || this.currentScene === 'honey_dragon' || this.currentScene === 'forest_king';

      // Heavy War Drum kick on beats 1 and 3 (subSteps 0 and 8); in high intensity: galloping march on 0, 3, 6, 8, 11, 14
      if (isClimaxOrBoss) {
        if (subStep === 0 || subStep === 3 || subStep === 6 || subStep === 8 || subStep === 11 || subStep === 12 || subStep === 14) {
          const isAccent = (subStep === 0 || subStep === 8);
          this.playSynthKick(time, isAccent);
        }
      } else if (this.currentIntensity >= 0.35) {
        if (subStep === 0 || subStep === 8 || (this.currentIntensity > 0.55 && (subStep === 6 || subStep === 14))) {
          this.playSynthKick(time, subStep === 0 || subStep === 8);
        }
      } else {
        // Subtle ambient low war drum heartbeat on downbeat
        if (subStep === 0) {
          this.playSynthKick(time, false, 0.4);
        }
      }

      // Military Field Snare / War Anvil
      if (this.currentIntensity >= 0.32 || isClimaxOrBoss) {
        // Beats 2 & 4 (subSteps 4 and 12)
        if (subStep === 4 || subStep === 12) {
          const isAnvil = isClimaxOrBoss && (subStep === 12);
          this.playSynthSnare(time, isAnvil);
        } else if (this.currentIntensity > 0.75 && (subStep === 14 || subStep === 15)) {
          // Galloping military snare roll
          this.playSynthSnare(time, false, 0.55);
        }
      }

      // Chainmail / Marching Frame Drum Percussion (Hi-Hat replacement)
      if (this.currentIntensity > 0.40) {
        if (subStep % 2 === 0) {
          this.playSynthHiHat(time, subStep % 4 === 2);
        }
      }
    }
  }

  // --- SYNTHESIZER VOICE ENGINES ---

  // Timpani & Taiko War Drum
  playSynthKick(time, isAccent = true, volScale = 1.0) {
    if (!this.ctx || !this.musicDrumsGain) return;
    try {
      const now = time;
      // 1. Resonant Timpani / Taiko Drum Body (Fundamental 95Hz -> 54Hz pitch sweep)
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      const startPitch = isAccent ? 105 : 88;
      const endPitch = isAccent ? 52 : 44;
      osc.frequency.setValueAtTime(startPitch, now);
      osc.frequency.exponentialRampToValueAtTime(endPitch, now + 0.18);

      const amp = (isAccent ? 0.85 : 0.6) * volScale;
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(amp, now + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.28);

      // Lowpass body warmth filter
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(isAccent ? 320 : 240, now);
      filter.Q.value = 1.8;

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicDrumsGain);
      osc.start(now);
      osc.stop(now + 0.29);

      // 2. Heavy leather mallet impact transient (shaped lowpass noise)
      if (this.noiseBuffer && isAccent) {
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.noiseBuffer;
        const nFilter = this.ctx.createBiquadFilter();
        nFilter.type = 'lowpass';
        nFilter.frequency.setValueAtTime(450, now);
        nFilter.Q.value = 1.2;

        const nGain = this.ctx.createGain();
        nGain.gain.setValueAtTime(0.001, now);
        nGain.gain.linearRampToValueAtTime(0.35 * volScale, now + 0.005);
        nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

        noise.connect(nFilter);
        nFilter.connect(nGain);
        nGain.connect(this.musicDrumsGain);
        noise.start(now);
        noise.stop(now + 0.05);
      }
    } catch (e) {}
  }

  // Field Snare & Forged Steel Anvil
  playSynthSnare(time, isAnvil = false, volScale = 1.0) {
    if (!this.ctx || !this.musicDrumsGain || !this.noiseBuffer) return;
    try {
      const now = time;
      if (isAnvil) {
        // Ringing forged steel anvil strike on climax / high-threat downbeats!
        const anvilOsc = this.ctx.createOscillator();
        const anvilGain = this.ctx.createGain();
        anvilOsc.type = 'square';
        anvilOsc.frequency.setValueAtTime(1760, now); // A6
        anvilGain.gain.setValueAtTime(0.001, now);
        anvilGain.gain.linearRampToValueAtTime(0.28 * volScale, now + 0.004);
        anvilGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

        const bellFilter = this.ctx.createBiquadFilter();
        bellFilter.type = 'bandpass';
        bellFilter.frequency.setValueAtTime(2640, now);
        bellFilter.Q.value = 3.5;

        anvilOsc.connect(bellFilter);
        bellFilter.connect(anvilGain);
        anvilGain.connect(this.musicDrumsGain);
        anvilOsc.start(now);
        anvilOsc.stop(now + 0.23);
      }

      // Wooden Field Drum Rim Crack
      const woodOsc = this.ctx.createOscillator();
      const woodGain = this.ctx.createGain();
      woodOsc.type = 'triangle';
      woodOsc.frequency.setValueAtTime(280, now);
      woodOsc.frequency.exponentialRampToValueAtTime(110, now + 0.06);
      woodGain.gain.setValueAtTime(0.001, now);
      woodGain.gain.linearRampToValueAtTime(0.42 * volScale, now + 0.005);
      woodGain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

      woodOsc.connect(woodGain);
      woodGain.connect(this.musicDrumsGain);
      woodOsc.start(now);
      woodOsc.stop(now + 0.09);

      // Rattling Field Snare Snares (multi-resonant bandpass noise)
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1850, now);
      filter.Q.value = 1.6;

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.001, now);
      noiseGain.gain.linearRampToValueAtTime(0.40 * volScale, now + 0.006);
      noiseGain.gain.exponentialRampToValueAtTime(0.005, now + 0.14);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.musicDrumsGain);
      noise.start(now);
      noise.stop(now + 0.15);
    } catch (e) {}
  }

  // Chainmail & Marching Tambour Percussion
  playSynthHiHat(time, isOpen = false) {
    if (!this.ctx || !this.musicDrumsGain || !this.noiseBuffer) return;
    try {
      const now = time;
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(5400, now);
      filter.Q.value = 2.0;

      const gain = this.ctx.createGain();
      const dur = isOpen ? 0.08 : 0.035;
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(isOpen ? 0.22 : 0.14, now + 0.004);
      gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicDrumsGain);
      noise.start(now);
      noise.stop(now + dur + 0.01);
    } catch (e) {}
  }

  // Bowed Orchestral Strings Pad & Dark Monastic Choir Drone
  playSynthPadChord(frequencies, time, duration) {
    if (!this.ctx || !this.musicPadGain || !frequencies) return;
    const now = time;
    const voiceCount = frequencies.length;
    frequencies.forEach((freq, i) => {
      try {
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(freq, now);
        osc1.detune.setValueAtTime(-6, now);

        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(freq, now);
        osc2.detune.setValueAtTime(6, now);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(850, now);
        filter.frequency.linearRampToValueAtTime(1400, now + duration * 0.4);
        filter.frequency.linearRampToValueAtTime(700, now + duration);
        filter.Q.value = 1.4;

        const voiceGain = 0.085 / Math.sqrt(voiceCount);
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(voiceGain, now + 0.35);
        gain.gain.setValueAtTime(voiceGain * 0.85, now + duration - 0.4);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicPadGain);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + duration + 0.02);
        osc2.stop(now + duration + 0.02);

        // Dark Monastic Choir overtone on chord root (index 0)
        if (i === 0 && freq < 300) {
          const choirOsc = this.ctx.createOscillator();
          const choirFilter = this.ctx.createBiquadFilter();
          const choirGain = this.ctx.createGain();

          choirOsc.type = 'sawtooth';
          choirOsc.frequency.setValueAtTime(freq, now);

          // Vocal vowel formant filter (~620Hz "Ooh / Aah")
          choirFilter.type = 'bandpass';
          choirFilter.frequency.setValueAtTime(620, now);
          choirFilter.Q.value = 2.8;

          choirGain.gain.setValueAtTime(0.001, now);
          choirGain.gain.linearRampToValueAtTime(0.045, now + 0.5);
          choirGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

          choirOsc.connect(choirFilter);
          choirFilter.connect(choirGain);
          choirGain.connect(this.musicPadGain);

          choirOsc.start(now);
          choirOsc.stop(now + duration + 0.02);
        }
      } catch (e) {}
    });
  }

  // Bowed Double-Bass & Cello Section
  playSynthBass(freq, time, duration) {
    if (!this.ctx || !this.musicBassGain || !freq) return;
    try {
      const now = time;
      const osc = this.ctx.createOscillator();
      const subOsc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);

      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(freq * 0.5, now);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, now);
      filter.frequency.exponentialRampToValueAtTime(160, now + duration);
      filter.Q.value = 2.2;

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.38, now + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

      osc.connect(filter);
      subOsc.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicBassGain);

      osc.start(now);
      subOsc.start(now);
      osc.stop(now + duration + 0.02);
      subOsc.stop(now + duration + 0.02);
    } catch (e) {}
  }

  // Medieval Lute / Ancient Wooden Shawm / Celestial Harp
  playSynthLead(freq, time, duration, isSecret = false) {
    if (!this.ctx || !this.musicLeadGain || !freq) return;
    try {
      const now = time;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      if (isSecret) {
        // Celestial Ancient Music Box / Antique Crystal Harp
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.34, now + 0.008);
        gain.gain.exponentialRampToValueAtTime(0.002, now + Math.min(duration, 0.45));

        osc.connect(gain);
        gain.connect(this.musicLeadGain);
        osc.start(now);
        osc.stop(now + Math.min(duration, 0.46));
      } else {
        // Plucked Medieval Lute / Ancient Wooden Shawm
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(freq * 1.8, now);
        filter.Q.value = 1.4;

        // Pluck envelope: sharp attack transient, warm acoustic body decay
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.28, now + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicLeadGain);
        osc.start(now);
        osc.stop(now + duration + 0.02);
      }
    } catch (e) {}
  }

  // Driving Spiccato Strings Ostinato / Plucked Harp Arpeggio
  playSynthArp(freq, time, duration, isCombat = false) {
    if (!this.ctx || !this.musicArpGain || !freq) return;
    try {
      const now = time;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      if (isCombat) {
        // Driving 16th-note Spiccato String Ostinato! (Crisp, aggressive bow bite)
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1600, now);
        filter.Q.value = 2.0;

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.26, now + 0.006);
        gain.gain.exponentialRampToValueAtTime(0.002, now + Math.min(duration, 0.12));

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicArpGain);
        osc.start(now);
        osc.stop(now + Math.min(duration, 0.13));
      } else {
        // Plucked harp / lute arpeggio cascade
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.22, now + 0.008);
        gain.gain.exponentialRampToValueAtTime(0.002, now + Math.min(duration, 0.18));

        osc.connect(gain);
        gain.connect(this.musicArpGain);
        osc.start(now);
        osc.stop(now + Math.min(duration, 0.19));
      }
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
// SCENE MUSIC DEFINITIONS & MEDIEVAL THEMATIC MODAL ARRANGEMENTS
// ========================================================

const NOTES = {
  C2: 65.41, Cs2: 69.30, D2: 73.42, Eb2: 77.78, E2: 82.41, F2: 87.31, Fs2: 92.50, G2: 98.00, Ab2: 103.83, A2: 110.00, Bb2: 116.54, B2: 123.47,
  C3: 130.81, Db3: 138.59, Cs3: 138.59, D3: 146.83, Eb3: 155.56, E3: 164.81, F3: 174.61, Fs3: 185.00, G3: 196.00, Ab3: 207.65, A3: 220.00, Bb3: 233.08, B3: 246.94,
  C4: 261.63, Db4: 277.18, Cs4: 277.18, D4: 293.66, Eb4: 311.13, E4: 329.63, F4: 349.23, Fs4: 369.99, G4: 392.00, Ab4: 415.30, A4: 440.00, Bb4: 466.16, B4: 493.88,
  C5: 523.25, Db5: 554.37, Cs5: 554.37, D5: 587.33, Eb5: 622.25, E5: 659.25, F5: 698.46, Fs5: 739.99, G5: 783.99, Ab5: 830.61, A5: 880.00, Bb5: 932.33, B5: 987.77,
  C6: 1046.50, Cs6: 1108.73, D6: 1174.66, Eb6: 1244.51, E6: 1318.51, F6: 1396.91, Fs6: 1479.98, G6: 1567.98, Ab6: 1661.22, A6: 1760.00, Bb6: 1864.66, B6: 1975.53, C7: 2093.00,
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
  // Title Screen: Noble Medieval Overture in D Dorian / G minor (96 BPM)
  // French Horn heraldry, rich cello bed, antique lute arpeggios
  title: {
    tempo: 96,
    chords: [
      [NOTES.D3, NOTES.A3, NOTES.D4, NOTES.F4],   // Dm (Noble quest anticipation)
      [NOTES.Bb2, NOTES.F3, NOTES.Bb3, NOTES.D4], // Bb (Ancient majesty)
      [NOTES.G2, NOTES.D3, NOTES.G3, NOTES.Bb3],  // Gm (Melancholy expanse)
      [NOTES.A2, NOTES.E3, NOTES.A3, NOTES.Cs4],  // A7 (Grand medieval resolution)
    ],
    bass: [
      makeBar([[0, NOTES.D2], [6, NOTES.A2], [8, NOTES.D3], [12, NOTES.C3]]),
      makeBar([[0, NOTES.Bb2], [6, NOTES.F2], [8, NOTES.Bb2], [12, NOTES.A2]]),
      makeBar([[0, NOTES.G2], [6, NOTES.D3], [8, NOTES.G3], [12, NOTES.F2]]),
      makeBar([[0, NOTES.A2], [6, NOTES.E3], [8, NOTES.A3], [12, NOTES.Cs3]]),
    ],
    melody: [
      makeBar([[0, NOTES.D4], [4, NOTES.F4], [8, NOTES.A4], [12, NOTES.D5]]),
      makeBar([[0, NOTES.F5], [4, NOTES.D5], [8, NOTES.Bb4], [12, NOTES.A4]]),
      makeBar([[0, NOTES.G4], [4, NOTES.Bb4], [8, NOTES.D5], [12, NOTES.C5]]),
      makeBar([[0, NOTES.Cs5], [4, NOTES.E5], [8, NOTES.A5], [12, NOTES.D5]]),
    ],
  },

  // Section 1: The Sunstone Glade (0-2400px): Noble E Dorian Exploration (112 BPM)
  glade: {
    tempo: 112,
    chords: [
      [NOTES.E3, NOTES.G3, NOTES.B3, NOTES.D4, NOTES.Fs4], // Em9 (E Dorian heroic nature)
      [NOTES.C3, NOTES.G3, NOTES.B3, NOTES.E4],           // Cmaj7 (Sunlight through forest)
      [NOTES.A2, NOTES.E3, NOTES.G3, NOTES.C4, NOTES.E4], // Am9 (Ancient ruins)
      [NOTES.B2, NOTES.Fs3, NOTES.A3, NOTES.Ds4],         // B7 (Noble resolution)
    ],
    bass: [
      makeBar([[0, NOTES.E2], [4, NOTES.B2], [8, NOTES.E3], [12, NOTES.D3], [14, NOTES.E2]]),
      makeBar([[0, NOTES.C3], [4, NOTES.G2], [8, NOTES.C3], [12, NOTES.B2], [14, NOTES.C3]]),
      makeBar([[0, NOTES.A2], [4, NOTES.E3], [8, NOTES.A3], [12, NOTES.G2], [14, NOTES.A2]]),
      makeBar([[0, NOTES.B2], [4, NOTES.Fs3], [8, NOTES.B3], [12, NOTES.A2], [14, NOTES.Ds3]]),
    ],
    melody: [
      makeBar([[0, NOTES.E4], [4, NOTES.G4], [8, NOTES.B4], [12, NOTES.D5]]),
      makeBar([[0, NOTES.C5], [4, NOTES.B4], [8, NOTES.G4], [12, NOTES.E4]]),
      makeBar([[0, NOTES.A4], [4, NOTES.C5], [8, NOTES.E5], [12, NOTES.G5]]),
      makeBar([[0, NOTES.Fs5], [4, NOTES.Ds5], [8, NOTES.B4], [12, NOTES.A4]]),
    ],
  },

  // Section 2: The Whispering Canopy & Amber Chasm (2400-5200px): Dark Enchanted Forest (118 BPM)
  canopy: {
    tempo: 118,
    chords: [
      [NOTES.Fs3, NOTES.A3, NOTES.Cs4, NOTES.E4], // F#m7
      [NOTES.D3, NOTES.A3, NOTES.Cs4, NOTES.Fs4], // Dmaj7
      [NOTES.B2, NOTES.Fs3, NOTES.A3, NOTES.D4],  // Bm7
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

  // Section 3: The Sunstone Aqueduct & Fortress (5200-8000px): Martial Siege March (126 BPM)
  fortress: {
    tempo: 126,
    chords: [
      [NOTES.D3, NOTES.A3, NOTES.D4, NOTES.F4],   // Dm (Martial siege)
      [NOTES.Bb2, NOTES.F3, NOTES.Bb3, NOTES.D4], // Bb (Fortress walls)
      [NOTES.F2, NOTES.C3, NOTES.F3, NOTES.A3],   // F (Ancient banners)
      [NOTES.A2, NOTES.E3, NOTES.A3, NOTES.Cs4],  // A7 (Clash of arms)
    ],
    bass: [
      makeBar([[0, NOTES.D2], [3, NOTES.D2], [6, NOTES.A2], [8, NOTES.D3], [11, NOTES.D2], [14, NOTES.F2]]),
      makeBar([[0, NOTES.Bb2], [3, NOTES.Bb2], [6, NOTES.F2], [8, NOTES.Bb3], [11, NOTES.Bb2], [14, NOTES.D3]]),
      makeBar([[0, NOTES.F2], [3, NOTES.F2], [6, NOTES.C3], [8, NOTES.F3], [11, NOTES.F2], [14, NOTES.A2]]),
      makeBar([[0, NOTES.A2], [3, NOTES.A2], [6, NOTES.E3], [8, NOTES.A3], [11, NOTES.A2], [14, NOTES.Cs3]]),
    ],
    melody: [
      makeBar([[0, NOTES.D5], [3, NOTES.F5], [6, NOTES.A5], [10, NOTES.D6], [14, NOTES.C6]]),
      makeBar([[0, NOTES.Bb5], [4, NOTES.D6], [8, NOTES.F6], [12, NOTES.E6]]),
      makeBar([[0, NOTES.C6], [4, NOTES.A5], [8, NOTES.F5], [12, NOTES.A5]]),
      makeBar([[0, NOTES.Cs6], [4, NOTES.E6], [8, NOTES.A6], [12, NOTES.G6]]),
    ],
  },

  // Section 4: The Sovereign Hive Spire (8000-10250px): High Spire Void & Heroic Drive (134 BPM)
  spire: {
    tempo: 134,
    chords: [
      [NOTES.C3, NOTES.G3, NOTES.Bb3, NOTES.Eb4], // Cm9
      [NOTES.Ab2, NOTES.Eb3, NOTES.G3, NOTES.C4],  // Abmaj7
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

  // Section 4 Climax: The Sovereign Throne & Climax Battle (144 BPM)
  // Driving orchestral battle cadence, taiko rolls, triumphant heraldry
  climax: {
    tempo: 144,
    chords: [
      [NOTES.C3, NOTES.Eb3, NOTES.G3, NOTES.C4],   // Cm (Thunderous confrontation)
      [NOTES.Ab2, NOTES.C3, NOTES.Eb3, NOTES.Ab3], // Ab (Desperate struggle)
      [NOTES.Bb2, NOTES.D3, NOTES.F3, NOTES.Bb3],  // Bb (Heroic defiance)
      [NOTES.C3, NOTES.E3, NOTES.G3, NOTES.C4],    // C Major (Grand Picardy Third Triumph!)
    ],
    bass: [
      makeBar([[0, NOTES.C2], [2, NOTES.C2], [4, NOTES.G2], [6, NOTES.C3], [8, NOTES.C2], [10, NOTES.Eb2], [12, NOTES.D2], [14, NOTES.C2]]),
      makeBar([[0, NOTES.Ab2], [2, NOTES.Ab2], [4, NOTES.Eb2], [6, NOTES.Ab3], [8, NOTES.Ab2], [10, NOTES.C3], [12, NOTES.Bb2], [14, NOTES.Ab2]]),
      makeBar([[0, NOTES.Bb2], [2, NOTES.Bb2], [4, NOTES.F2], [6, NOTES.Bb3], [8, NOTES.Bb2], [10, NOTES.D3], [12, NOTES.C3], [14, NOTES.Bb2]]),
      makeBar([[0, NOTES.C2], [2, NOTES.C2], [4, NOTES.E2], [6, NOTES.G2], [8, NOTES.C3], [10, NOTES.E3], [12, NOTES.G3], [14, NOTES.C4]]),
    ],
    melody: [
      makeBar([[0, NOTES.C5], [2, NOTES.Eb5], [4, NOTES.G5], [8, NOTES.C6], [12, NOTES.Bb5]]),
      makeBar([[0, NOTES.Ab5], [4, NOTES.C6], [8, NOTES.Eb6], [12, NOTES.D6]]),
      makeBar([[0, NOTES.Bb5], [4, NOTES.D6], [8, NOTES.F6], [12, NOTES.Eb6]]),
      makeBar([[0, NOTES.G5], [2, NOTES.C6], [4, NOTES.E6], [8, NOTES.G6], [12, NOTES.C7]]),
    ],
  },

  // ========================================================
  // WORLD 2: THE WHISPERING FOREST (Celtic Pagan Fantasy)
  // ========================================================
  forest: {
    tempo: 112,
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

  fungal: {
    tempo: 120,
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

  briar: {
    tempo: 128,
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

  forest_king: {
    tempo: 142,
    chords: [
      [NOTES.D3, NOTES.A3, NOTES.D4, NOTES.F4],   // Dm (Forest Titan awakening)
      [NOTES.Bb2, NOTES.F3, NOTES.Bb3, NOTES.D4], // Bb
      [NOTES.C3, NOTES.G3, NOTES.C4, NOTES.E4],   // C
      [NOTES.D3, NOTES.A3, NOTES.D4, NOTES.Fs4],  // D Major (Titan purified)
    ],
    bass: [
      makeBar([[0, NOTES.D2], [2, NOTES.D2], [4, NOTES.A2], [6, NOTES.D3], [8, NOTES.D2], [10, NOTES.D2], [12, NOTES.F2], [14, NOTES.E2]]),
      makeBar([[0, NOTES.Bb2], [2, NOTES.Bb2], [4, NOTES.F2], [6, NOTES.Bb3], [8, NOTES.Bb2], [10, NOTES.Bb2], [12, NOTES.A2], [14, NOTES.G2]]),
      makeBar([[0, NOTES.C2], [2, NOTES.C2], [4, NOTES.G2], [6, NOTES.C3], [8, NOTES.C2], [10, NOTES.C2], [12, NOTES.B2], [14, NOTES.Bb2]]),
      makeBar([[0, NOTES.D2], [2, NOTES.D2], [4, NOTES.Fs2], [6, NOTES.A2], [8, NOTES.D3], [10, NOTES.D3], [12, NOTES.A2], [14, NOTES.D3]]),
    ],
    melody: [
      makeBar([[0, NOTES.D5], [2, NOTES.F5], [4, NOTES.A5], [8, NOTES.D6], [12, NOTES.C6]]),
      makeBar([[0, NOTES.Bb5], [4, NOTES.D6], [8, NOTES.F6], [12, NOTES.E6]]),
      makeBar([[0, NOTES.C6], [4, NOTES.E6], [8, NOTES.G6], [12, NOTES.F6]]),
      makeBar([[0, NOTES.A5], [2, NOTES.D6], [4, NOTES.Fs6], [8, NOTES.A6], [12, NOTES.D7]]),
    ],
  },

  // ========================================================
  // WORLD 3: THE CASTLE OF A THOUSAND DOORS (Gothic Citadel)
  // ========================================================
  castle: {
    tempo: 116,
    chords: [
      [NOTES.C3, NOTES.G3, NOTES.C4, NOTES.Eb4], // Cm (Gothic grandeur)
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

  slam_a_lot: {
    tempo: 146,
    chords: [
      [NOTES.C3, NOTES.G3, NOTES.C4, NOTES.Eb4], // Cm (Heavy armor clashing)
      [NOTES.Ab2, NOTES.Eb3, NOTES.Ab3, NOTES.C4], // Ab
      [NOTES.Bb2, NOTES.F3, NOTES.Bb3, NOTES.D4], // Bb
      [NOTES.G2, NOTES.D3, NOTES.G3, NOTES.B3], // G major
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
  // WORLD 4: THE VOLCANO OF HOT HONEY (Primal Draconic Fury)
  // ========================================================
  volcano: {
    tempo: 118,
    chords: [
      [NOTES.E3, NOTES.B3, NOTES.E4, NOTES.G4], // Em
      [NOTES.C3, NOTES.G3, NOTES.C4, NOTES.E4], // C
      [NOTES.A2, NOTES.E3, NOTES.A3, NOTES.C4], // Am
      [NOTES.B2, NOTES.Fs3, NOTES.A3, NOTES.Ds4], // B7 (Phrygian tension)
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

  honey_dragon: {
    tempo: 148,
    chords: [
      [NOTES.D3, NOTES.A3, NOTES.D4, NOTES.F4],   // Dm (Draconic rage)
      [NOTES.F2, NOTES.C3, NOTES.F3, NOTES.A3],   // F
      [NOTES.C3, NOTES.G3, NOTES.C4, NOTES.E4],   // C
      [NOTES.D3, NOTES.A3, NOTES.D4, NOTES.Fs4],  // D Major (Wyrm subdued)
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

  // ========================================================
  // WORLD 5: THE DESERT OF ENDLESS SANDWICHES (Exotic Caravan)
  // ========================================================
  desert_dunes: {
    tempo: 116,
    chords: [
      [NOTES.G3, NOTES.B3, NOTES.D4, NOTES.G4],   // G Major
      [NOTES.E3, NOTES.B3, NOTES.E4, NOTES.G4],   // Em
      [NOTES.C3, NOTES.G3, NOTES.C4, NOTES.E4],   // C Major
      [NOTES.D3, NOTES.A3, NOTES.D4, NOTES.Fs4],  // D Major
    ],
    bass: [
      makeBar([[0, NOTES.G2], [3, NOTES.G2], [6, NOTES.D3], [8, NOTES.G2], [11, NOTES.B2], [14, NOTES.D3]]),
      makeBar([[0, NOTES.E2], [3, NOTES.E2], [6, NOTES.B2], [8, NOTES.E2], [11, NOTES.G2], [14, NOTES.B2]]),
      makeBar([[0, NOTES.C2], [3, NOTES.C2], [6, NOTES.G2], [8, NOTES.C3], [11, NOTES.E3], [14, NOTES.G2]]),
      makeBar([[0, NOTES.D2], [3, NOTES.D2], [6, NOTES.A2], [8, NOTES.D3], [11, NOTES.Fs3], [14, NOTES.A2]]),
    ],
    melody: [
      makeBar([[0, NOTES.G5], [3, NOTES.B5], [6, NOTES.D6], [10, NOTES.E6], [12, NOTES.D6], [14, NOTES.B5]]),
      makeBar([[0, NOTES.G5], [4, NOTES.E5], [8, NOTES.B5], [12, NOTES.G5]]),
      makeBar([[0, NOTES.C5], [3, NOTES.E5], [6, NOTES.G5], [10, NOTES.B5], [12, NOTES.C6]]),
      makeBar([[0, NOTES.D6], [4, NOTES.A5], [8, NOTES.Fs5], [12, NOTES.A5]]),
    ],
  },

  cheese_canyon: {
    tempo: 124,
    chords: [
      [NOTES.A3, NOTES.C4, NOTES.E4, NOTES.G4],   // Am7
      [NOTES.F3, NOTES.C4, NOTES.F4, NOTES.A4],   // F
      [NOTES.D3, NOTES.A3, NOTES.D4, NOTES.F4],   // Dm
      [NOTES.E3, NOTES.B3, NOTES.E4, NOTES.Gs4],  // E7
    ],
    bass: [
      makeBar([[0, NOTES.A2], [2, NOTES.A2], [4, NOTES.E3], [6, NOTES.A2], [8, NOTES.C3], [10, NOTES.B2], [12, NOTES.A2], [14, NOTES.E2]]),
      makeBar([[0, NOTES.F2], [2, NOTES.F2], [4, NOTES.C3], [6, NOTES.F2], [8, NOTES.A2], [10, NOTES.G2], [12, NOTES.F2], [14, NOTES.C2]]),
      makeBar([[0, NOTES.D2], [2, NOTES.D2], [4, NOTES.A2], [6, NOTES.D3], [8, NOTES.F2], [10, NOTES.E2], [12, NOTES.D2], [14, NOTES.A2]]),
      makeBar([[0, NOTES.E2], [2, NOTES.E2], [4, NOTES.B2], [6, NOTES.E3], [8, NOTES.Gs2], [10, NOTES.B2], [12, NOTES.E3], [14, NOTES.D3]]),
    ],
    melody: [
      makeBar([[0, NOTES.A5], [2, NOTES.C6], [6, NOTES.E6], [10, NOTES.A6], [14, NOTES.G6]]),
      makeBar([[0, NOTES.F6], [4, NOTES.E6], [8, NOTES.C6], [12, NOTES.A5]]),
      makeBar([[0, NOTES.D5], [3, NOTES.F5], [6, NOTES.A5], [10, NOTES.D6], [14, NOTES.C6]]),
      makeBar([[0, NOTES.B5], [4, NOTES.Gs5], [8, NOTES.E5], [12, NOTES.Gs5]]),
    ],
  },

  mustard_rapids: {
    tempo: 134,
    chords: [
      [NOTES.D3, NOTES.F3, NOTES.A3, NOTES.D4],   // Dm
      [NOTES.Bb2, NOTES.F3, NOTES.Bb3, NOTES.D4], // Bb
      [NOTES.G2, NOTES.D3, NOTES.G3, NOTES.Bb3], // Gm
      [NOTES.A2, NOTES.E3, NOTES.A3, NOTES.Cs4],  // A7
    ],
    bass: [
      makeBar([[0, NOTES.D2], [2, NOTES.D2], [4, NOTES.A2], [6, NOTES.D3], [8, NOTES.D2], [10, NOTES.F2], [12, NOTES.E2], [14, NOTES.D2]]),
      makeBar([[0, NOTES.Bb2], [2, NOTES.Bb2], [4, NOTES.F3], [6, NOTES.Bb2], [8, NOTES.D3], [10, NOTES.C3], [12, NOTES.Bb2], [14, NOTES.F2]]),
      makeBar([[0, NOTES.G2], [2, NOTES.G2], [4, NOTES.D3], [6, NOTES.G2], [8, NOTES.Bb2], [10, NOTES.A2], [12, NOTES.G2], [14, NOTES.D2]]),
      makeBar([[0, NOTES.A2], [2, NOTES.A2], [4, NOTES.E3], [6, NOTES.A2], [8, NOTES.Cs3], [10, NOTES.E3], [12, NOTES.A3], [14, NOTES.G2]]),
    ],
    melody: [
      makeBar([[0, NOTES.D5], [2, NOTES.F5], [6, NOTES.A5], [10, NOTES.D6], [14, NOTES.Cs6]]),
      makeBar([[0, NOTES.Bb5], [4, NOTES.A5], [8, NOTES.F5], [12, NOTES.D5]]),
      makeBar([[0, NOTES.G5], [3, NOTES.Bb5], [6, NOTES.D6], [10, NOTES.G6], [14, NOTES.F6]]),
      makeBar([[0, NOTES.E6], [4, NOTES.Cs6], [8, NOTES.A5], [12, NOTES.Cs6]]),
    ],
  },

  sandwich_king: {
    tempo: 146,
    chords: [
      [NOTES.C3, NOTES.G3, NOTES.C4, NOTES.Eb4],   // Cm
      [NOTES.Ab2, NOTES.Eb3, NOTES.Ab3, NOTES.C4], // Ab
      [NOTES.Bb2, NOTES.F3, NOTES.Bb3, NOTES.D4],  // Bb
      [NOTES.G2, NOTES.D3, NOTES.G3, NOTES.B3],    // G
    ],
    bass: [
      makeBar([[0, NOTES.C2], [2, NOTES.C2], [4, NOTES.G2], [6, NOTES.C3], [8, NOTES.C2], [10, NOTES.Eb2], [12, NOTES.D2], [14, NOTES.C2]]),
      makeBar([[0, NOTES.Ab2], [2, NOTES.Ab2], [4, NOTES.Eb3], [6, NOTES.Ab2], [8, NOTES.C3], [10, NOTES.Bb2], [12, NOTES.Ab2], [14, NOTES.Eb2]]),
      makeBar([[0, NOTES.Bb2], [2, NOTES.Bb2], [4, NOTES.F3], [6, NOTES.Bb2], [8, NOTES.D3], [10, NOTES.C3], [12, NOTES.Bb2], [14, NOTES.F2]]),
      makeBar([[0, NOTES.G2], [2, NOTES.G2], [4, NOTES.D3], [6, NOTES.G2], [8, NOTES.B2], [10, NOTES.D3], [12, NOTES.G3], [14, NOTES.F2]]),
    ],
    melody: [
      makeBar([[0, NOTES.C5], [2, NOTES.Eb5], [6, NOTES.G5], [10, NOTES.C6], [14, NOTES.D6]]),
      makeBar([[0, NOTES.Eb6], [4, NOTES.C6], [8, NOTES.Ab5], [12, NOTES.G5]]),
      makeBar([[0, NOTES.F5], [3, NOTES.Bb5], [6, NOTES.D6], [10, NOTES.F6], [14, NOTES.Eb6]]),
      makeBar([[0, NOTES.D6], [2, NOTES.B5], [4, NOTES.G5], [8, NOTES.B5], [12, NOTES.G6]]),
    ],
  },

  // ========================================================
  // WORLD 6: THE CLOCKWORK KINGDOM (Baroque Counterpoint)
  // ========================================================
  clockwork: {
    tempo: 116,
    chords: [
      [NOTES.D3, NOTES.F3, NOTES.A3, NOTES.D4],   // Dm (Ticking clockwork)
      [NOTES.F2, NOTES.C3, NOTES.F3, NOTES.A3],   // F Major
      [NOTES.C3, NOTES.G3, NOTES.C4, NOTES.E4],   // C Major
      [NOTES.A2, NOTES.E3, NOTES.A3, NOTES.Cs4],  // A7
    ],
    bass: [
      makeBar([[0, NOTES.D2], [2, NOTES.D3], [4, NOTES.A2], [6, NOTES.D3], [8, NOTES.D2], [10, NOTES.F2], [12, NOTES.E2], [14, NOTES.D2]]),
      makeBar([[0, NOTES.F2], [2, NOTES.F3], [4, NOTES.C3], [6, NOTES.F3], [8, NOTES.F2], [10, NOTES.A2], [12, NOTES.G2], [14, NOTES.F2]]),
      makeBar([[0, NOTES.C3], [2, NOTES.C4], [4, NOTES.G2], [6, NOTES.C3], [8, NOTES.C3], [10, NOTES.E3], [12, NOTES.D3], [14, NOTES.C3]]),
      makeBar([[0, NOTES.A2], [2, NOTES.A3], [4, NOTES.E3], [6, NOTES.A3], [8, NOTES.A2], [10, NOTES.Cs3], [12, NOTES.E3], [14, NOTES.A3]]),
    ],
    melody: [
      makeBar([[0, NOTES.D5], [2, NOTES.F5], [4, NOTES.A5], [8, NOTES.D6], [12, NOTES.Cs6], [14, NOTES.D6]]),
      makeBar([[0, NOTES.C6], [4, NOTES.A5], [8, NOTES.F5], [12, NOTES.A5]]),
      makeBar([[0, NOTES.G5], [4, NOTES.C6], [8, NOTES.E6], [12, NOTES.D6]]),
      makeBar([[0, NOTES.Cs6], [4, NOTES.E6], [8, NOTES.A6], [12, NOTES.G6]]),
    ],
  },

  escapement_bridge: {
    tempo: 124,
    chords: [
      [NOTES.G2, NOTES.D3, NOTES.G3, NOTES.Bb3], // Gm
      [NOTES.Bb2, NOTES.F3, NOTES.Bb3, NOTES.D4], // Bb
      [NOTES.Eb3, NOTES.Bb3, NOTES.Eb4, NOTES.G4], // Eb
      [NOTES.D3, NOTES.A3, NOTES.D4, NOTES.Fs4],  // D7
    ],
    bass: [
      makeBar([[0, NOTES.G2], [2, NOTES.G2], [4, NOTES.D3], [6, NOTES.G2], [8, NOTES.Bb2], [10, NOTES.A2], [12, NOTES.G2], [14, NOTES.D2]]),
      makeBar([[0, NOTES.Bb2], [2, NOTES.Bb2], [4, NOTES.F3], [6, NOTES.Bb2], [8, NOTES.D3], [10, NOTES.C3], [12, NOTES.Bb2], [14, NOTES.F2]]),
      makeBar([[0, NOTES.Eb2], [2, NOTES.Eb2], [4, NOTES.Bb2], [6, NOTES.Eb3], [8, NOTES.G2], [10, NOTES.F2], [12, NOTES.Eb2], [14, NOTES.Bb2]]),
      makeBar([[0, NOTES.D2], [2, NOTES.D2], [4, NOTES.A2], [6, NOTES.D3], [8, NOTES.Fs2], [10, NOTES.A2], [12, NOTES.D3], [14, NOTES.C3]]),
    ],
    melody: [
      makeBar([[0, NOTES.G5], [2, NOTES.Bb5], [6, NOTES.D6], [10, NOTES.G6], [14, NOTES.Fs6]]),
      makeBar([[0, NOTES.F6], [4, NOTES.D6], [8, NOTES.Bb5], [12, NOTES.D6]]),
      makeBar([[0, NOTES.Eb6], [4, NOTES.G6], [8, NOTES.Bb6], [12, NOTES.A6]]),
      makeBar([[0, NOTES.Fs6], [4, NOTES.A6], [8, NOTES.D7], [12, NOTES.C7]]),
    ],
  },

  steam_conduit: {
    tempo: 134,
    chords: [
      [NOTES.A2, NOTES.E3, NOTES.A3, NOTES.C4],  // Am
      [NOTES.F2, NOTES.C3, NOTES.F3, NOTES.A3],  // F
      [NOTES.D3, NOTES.A3, NOTES.D4, NOTES.F4],  // Dm
      [NOTES.E2, NOTES.B2, NOTES.E3, NOTES.Gs3], // E7
    ],
    bass: [
      makeBar([[0, NOTES.A2], [2, NOTES.A2], [4, NOTES.E3], [6, NOTES.A2], [8, NOTES.A2], [10, NOTES.C3], [12, NOTES.B2], [14, NOTES.A2]]),
      makeBar([[0, NOTES.F2], [2, NOTES.F2], [4, NOTES.C3], [6, NOTES.F2], [8, NOTES.F2], [10, NOTES.A2], [12, NOTES.G2], [14, NOTES.F2]]),
      makeBar([[0, NOTES.D2], [2, NOTES.D2], [4, NOTES.A2], [6, NOTES.D3], [8, NOTES.D2], [10, NOTES.F2], [12, NOTES.E2], [14, NOTES.D2]]),
      makeBar([[0, NOTES.E2], [2, NOTES.E2], [4, NOTES.B2], [6, NOTES.E3], [8, NOTES.E2], [10, NOTES.Gs2], [12, NOTES.B2], [14, NOTES.D3]]),
    ],
    melody: [
      makeBar([[0, NOTES.A5], [3, NOTES.C6], [6, NOTES.E6], [10, NOTES.A6], [14, NOTES.Gs6]]),
      makeBar([[0, NOTES.F6], [4, NOTES.A5], [8, NOTES.C6], [12, NOTES.F6]]),
      makeBar([[0, NOTES.D6], [3, NOTES.F6], [6, NOTES.A6], [10, NOTES.D7], [14, NOTES.C7]]),
      makeBar([[0, NOTES.B6], [4, NOTES.Gs6], [8, NOTES.E6], [12, NOTES.Gs6]]),
    ],
  },

  time_tinker: {
    tempo: 148,
    chords: [
      [NOTES.C3, NOTES.Eb3, NOTES.G3, NOTES.C4],   // Cm (Chrono Titan majesty)
      [NOTES.Ab2, NOTES.Eb3, NOTES.Ab3, NOTES.C4], // Ab
      [NOTES.F2, NOTES.C3, NOTES.F3, NOTES.Ab3],  // Fm
      [NOTES.G2, NOTES.D3, NOTES.G3, NOTES.B3],    // G (Chrono Overload resolution)
    ],
    bass: [
      makeBar([[0, NOTES.C2], [2, NOTES.C2], [4, NOTES.G2], [6, NOTES.C3], [8, NOTES.C2], [10, NOTES.Eb2], [12, NOTES.D2], [14, NOTES.C2]]),
      makeBar([[0, NOTES.Ab2], [2, NOTES.Ab2], [4, NOTES.Eb3], [6, NOTES.Ab2], [8, NOTES.C3], [10, NOTES.Bb2], [12, NOTES.Ab2], [14, NOTES.Eb2]]),
      makeBar([[0, NOTES.F2], [2, NOTES.F2], [4, NOTES.C3], [6, NOTES.F2], [8, NOTES.Ab2], [10, NOTES.G2], [12, NOTES.F2], [14, NOTES.C2]]),
      makeBar([[0, NOTES.G2], [2, NOTES.G2], [4, NOTES.D3], [6, NOTES.G2], [8, NOTES.B2], [10, NOTES.D3], [12, NOTES.G3], [14, NOTES.F2]]),
    ],
    melody: [
      makeBar([[0, NOTES.C5], [2, NOTES.Eb5], [6, NOTES.G5], [10, NOTES.C6], [14, NOTES.D6]]),
      makeBar([[0, NOTES.Eb6], [4, NOTES.C6], [8, NOTES.Ab5], [12, NOTES.G5]]),
      makeBar([[0, NOTES.F5], [3, NOTES.Bb5], [6, NOTES.D6], [10, NOTES.F6], [14, NOTES.Eb6]]),
      makeBar([[0, NOTES.D6], [2, NOTES.B5], [4, NOTES.G5], [8, NOTES.B5], [12, NOTES.G6]]),
    ],
  },
};

export { SCENE_THEMES };
