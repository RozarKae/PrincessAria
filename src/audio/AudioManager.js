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

    // Music & Ambience loop state
    this.bgmPlaying = false;
    this.bgmTimer = null;
    this.bgmStep = 0;
    this.currentBiome = 'glade';

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
  // 15. DYNAMIC PROCEDURAL ROYAL FANTASY BACKGROUND MUSIC (BGM)
  // Generates a lush, pastoral, ambient chord loop
  // ========================================================

  startTitleMusic() {
    this.setBiome('title');
    this.startProceduralMusic('title');
  }

  startProceduralMusic(initialBiome) {
    if (initialBiome) {
      this.currentBiome = initialBiome;
    }
    if (!this.ensureReady()) return;
    if (this.bgmPlaying) return;

    this.bgmPlaying = true;
    this.bgmStep = 0;

    // Title Screen Theme (Gentle pastoral awakening in G major / C major)
    const titleChords = [
      [196.00, 246.94, 293.66, 392.00], // G3, B3, D4, G4 (Pastoral G)
      [164.81, 196.00, 246.94, 329.63], // E3, G3, B3, E4 (Em7)
      [130.81, 164.81, 196.00, 261.63], // C3, E3, G3, C4 (C major)
      [146.83, 220.00, 293.66, 370.00], // D3, A3, D4, F#4 (Dsus / D)
    ];

    // Section 1: The Sunstone Glade (Pastoral Royal Dawn: Em9 -> Cmaj7 -> G -> Dsus4)
    const gladeChords = [
      [164.81, 196.00, 246.94, 293.66], // E3, G3, B3, D4
      [130.81, 164.81, 196.00, 246.94], // C3, E3, G3, B3
      [196.00, 246.94, 293.66, 392.00], // G3, B3, D4, G4
      [146.83, 220.00, 293.66, 440.00], // D3, A3, D4, A4
    ];

    // Section 2: Whispering Canopy (Mystical Lydian/Dorian Canopy: F#m9 -> Dmaj7#11 -> Bm9 -> C#m7)
    const canopyChords = [
      [185.00, 220.00, 277.18, 329.63], // F#3, A3, C#4, E4
      [146.83, 220.00, 277.18, 370.00], // D3, A3, C#4, F#4
      [123.47, 185.00, 220.00, 293.66], // B2, F#3, A3, D4
      [138.59, 207.65, 246.94, 329.63], // C#3, G#3, B3, E4
    ];

    // Section 3: The Sunstone Aqueduct & Crumbling Fortress (Royal Elegiac: Fmaj7#11 -> Dm9 -> Am9 -> Em7)
    const fortressChords = [
      [174.61, 220.00, 261.63, 329.63], // F3, A3, C4, E4
      [146.83, 174.61, 220.00, 261.63], // D3, F3, A3, C4
      [110.00, 164.81, 196.00, 246.94], // A2, E3, G3, B3
      [164.81, 196.00, 246.94, 293.66], // E3, G3, B3, D4
    ];

    const playBgmStep = () => {
      if (!this.bgmPlaying || !this.ctx) {
        return;
      }

      if (this.isMuted || this.ctx.state !== 'running') {
        // Keep timer alive silently while muted or suspended without synthesizing oscillators
        this.bgmTimer = setTimeout(playBgmStep, 1800);
        return;
      }

      const now = this.ctx.currentTime;
      let chords = gladeChords;
      if (this.currentBiome === 'title') {
        chords = titleChords;
      } else if (this.currentBiome === 'fortress') {
        chords = fortressChords;
      } else if (this.currentBiome === 'canopy') {
        chords = canopyChords;
      }

      const chord = chords[this.bgmStep % chords.length];
      this.bgmStep++;

      // Warm pad synth voices
      chord.forEach((freq) => {
        try {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now);

          gain.gain.setValueAtTime(0.01, now);
          gain.gain.linearRampToValueAtTime(0.07, now + 0.3);
          gain.gain.exponentialRampToValueAtTime(0.005, now + 1.7);

          osc.connect(gain);
          gain.connect(this.musicGain);
          osc.start(now);
          osc.stop(now + 1.75);
        } catch (e) {}
      });

      // Warm sub-bass foundation
      try {
        const bassOsc = this.ctx.createOscillator();
        const bassGain = this.ctx.createGain();
        bassOsc.type = 'sine';
        bassOsc.frequency.setValueAtTime(chord[0] / 2, now);
        bassGain.gain.setValueAtTime(0.12, now);
        bassGain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);

        bassOsc.connect(bassGain);
        bassGain.connect(this.musicGain);
        bassOsc.start(now);
        bassOsc.stop(now + 0.85);
      } catch (e) {}

      this.bgmTimer = setTimeout(playBgmStep, 1750);
    };

    playBgmStep();
  }

  stopProceduralMusic() {
    this.bgmPlaying = false;
    if (this.bgmTimer) {
      clearTimeout(this.bgmTimer);
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
