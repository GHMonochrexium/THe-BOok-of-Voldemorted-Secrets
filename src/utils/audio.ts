import { AmbientTrack } from '../types';

// Web Audio API synthesizer for atmospheric Hogwarts sounds, quill FX, and Hedwig's Theme
class SoundManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private ambientGain: GainNode | null = null;
  private hedwigGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;

  // Ambient nodes
  private ambientOsc1: OscillatorNode | null = null;
  private ambientOsc2: OscillatorNode | null = null;
  private ambientNoiseSource: AudioBufferSourceNode | null = null;
  private isAmbientPlaying = false;
  private currentAmbientTrack: AmbientTrack = 'restricted-section';

  // Hedwig's Theme state
  private isHedwigsPlaying = false;
  private hedwigTimeoutId: any = null;
  private hedwigNoteIndex = 0;

  // Settings
  private enabled = true;
  private masterVolume = 0.7;
  private ambientVolume = 0.5;
  private hedwigsVolume = 0.6;
  private sfxVolume = 0.7;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();

        // Master gain
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.masterVolume, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);

        // Sub-gains
        this.ambientGain = this.ctx.createGain();
        this.ambientGain.gain.setValueAtTime(this.ambientVolume * 0.25, this.ctx.currentTime);
        this.ambientGain.connect(this.masterGain);

        this.hedwigGain = this.ctx.createGain();
        this.hedwigGain.gain.setValueAtTime(this.hedwigsVolume * 0.35, this.ctx.currentTime);
        this.hedwigGain.connect(this.masterGain);

        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.setValueAtTime(this.sfxVolume * 0.4, this.ctx.currentTime);
        this.sfxGain.connect(this.masterGain);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (!enabled) {
      this.stopAmbient();
      this.stopHedwigsTheme();
    }
  }

  public setMasterVolume(vol: number) {
    this.masterVolume = Math.max(0, Math.min(1, vol));
    this.initCtx();
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.enabled ? this.masterVolume : 0, this.ctx.currentTime, 0.05);
    }
  }

  public setAmbientVolume(vol: number) {
    this.ambientVolume = Math.max(0, Math.min(1, vol));
    this.initCtx();
    if (this.ambientGain && this.ctx) {
      this.ambientGain.gain.setTargetAtTime(this.ambientVolume * 0.25, this.ctx.currentTime, 0.05);
    }
  }

  public setHedwigsVolume(vol: number) {
    this.hedwigsVolume = Math.max(0, Math.min(1, vol));
    this.initCtx();
    if (this.hedwigGain && this.ctx) {
      this.hedwigGain.gain.setTargetAtTime(this.hedwigsVolume * 0.35, this.ctx.currentTime, 0.05);
    }
  }

  public setSfxVolume(vol: number) {
    this.sfxVolume = Math.max(0, Math.min(1, vol));
    this.initCtx();
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setTargetAtTime(this.sfxVolume * 0.4, this.ctx.currentTime, 0.05);
    }
  }

  public setAmbientTrack(track: AmbientTrack) {
    this.currentAmbientTrack = track;
    if (this.isAmbientPlaying) {
      this.stopAmbient();
      setTimeout(() => this.startAmbient(), 300);
    }
  }

  // --- AMBIENT SOUNDSCAPES ---
  public startAmbient() {
    if (!this.enabled || this.isAmbientPlaying) return;
    try {
      this.initCtx();
      if (!this.ctx || !this.ambientGain) return;

      if (this.currentAmbientTrack === 'astronomy-thunder') {
        // Rain and distant storm rumble
        const bufferSize = this.ctx.sampleRate * 2;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * 0.2;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        noise.loop = true;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(450, this.ctx.currentTime);

        noise.connect(filter);
        filter.connect(this.ambientGain);
        noise.start();
        this.ambientNoiseSource = noise;

        // Low thunder drone
        this.ambientOsc1 = this.ctx.createOscillator();
        this.ambientOsc1.type = 'triangle';
        this.ambientOsc1.frequency.setValueAtTime(48, this.ctx.currentTime);
        this.ambientOsc1.connect(this.ambientGain);
        this.ambientOsc1.start();

      } else if (this.currentAmbientTrack === 'chamber-whispers') {
        // Subterranean 40Hz resonant drone with hollow cavern tone
        this.ambientOsc1 = this.ctx.createOscillator();
        this.ambientOsc1.type = 'sine';
        this.ambientOsc1.frequency.setValueAtTime(43.65, this.ctx.currentTime); // F1

        this.ambientOsc2 = this.ctx.createOscillator();
        this.ambientOsc2.type = 'sine';
        this.ambientOsc2.frequency.setValueAtTime(65.41, this.ctx.currentTime); // C2

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(110, this.ctx.currentTime);
        filter.Q.setValueAtTime(5, this.ctx.currentTime);

        this.ambientOsc1.connect(filter);
        this.ambientOsc2.connect(filter);
        filter.connect(this.ambientGain);

        this.ambientOsc1.start();
        this.ambientOsc2.start();

      } else {
        // Restricted Library Section (Default: 55Hz A1 + 82.4Hz E2 mystique)
        this.ambientOsc1 = this.ctx.createOscillator();
        this.ambientOsc1.type = 'sine';
        this.ambientOsc1.frequency.setValueAtTime(55, this.ctx.currentTime);

        this.ambientOsc2 = this.ctx.createOscillator();
        this.ambientOsc2.type = 'triangle';
        this.ambientOsc2.frequency.setValueAtTime(82.4, this.ctx.currentTime);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(150, this.ctx.currentTime);

        this.ambientOsc1.connect(filter);
        this.ambientOsc2.connect(filter);
        filter.connect(this.ambientGain);

        this.ambientOsc1.start();
        this.ambientOsc2.start();
      }

      this.isAmbientPlaying = true;
    } catch (e) {
      console.warn('Ambient audio error:', e);
    }
  }

  public stopAmbient() {
    if (!this.isAmbientPlaying) return;
    try {
      this.ambientOsc1?.stop();
      this.ambientOsc2?.stop();
      this.ambientNoiseSource?.stop();
      this.ambientOsc1?.disconnect();
      this.ambientOsc2?.disconnect();
      this.ambientNoiseSource?.disconnect();
    } catch {
      // ignore
    } finally {
      this.ambientOsc1 = null;
      this.ambientOsc2 = null;
      this.ambientNoiseSource = null;
      this.isAmbientPlaying = false;
    }
  }

  // --- HEDWIG'S THEME (Harry Potter Celesta Music Synth) ---
  // Iconic celesta notes sequence (pitch in Hz, duration in beats)
  private HEDWIGS_NOTES: { freq: number; duration: number; rest?: number }[] = [
    // Phrase 1
    { freq: 493.88, duration: 0.5 }, // B4
    { freq: 659.25, duration: 0.75 }, // E5
    { freq: 783.99, duration: 0.25 }, // G5
    { freq: 739.99, duration: 0.5 }, // F#5
    { freq: 659.25, duration: 1.0 }, // E5
    { freq: 987.77, duration: 0.5 }, // B5
    { freq: 880.00, duration: 1.25 }, // A5
    { freq: 739.99, duration: 1.25 }, // F#5

    // Phrase 2
    { freq: 659.25, duration: 0.75 }, // E5
    { freq: 783.99, duration: 0.25 }, // G5
    { freq: 739.99, duration: 0.5 }, // F#5
    { freq: 622.25, duration: 1.0 }, // D#5
    { freq: 698.46, duration: 0.5 }, // F5
    { freq: 493.88, duration: 1.8, rest: 0.4 }, // B4

    // Phrase 3
    { freq: 493.88, duration: 0.5 }, // B4
    { freq: 659.25, duration: 0.75 }, // E5
    { freq: 783.99, duration: 0.25 }, // G5
    { freq: 739.99, duration: 0.5 }, // F#5
    { freq: 659.25, duration: 1.0 }, // E5
    { freq: 987.77, duration: 0.5 }, // B5
    { freq: 1174.66, duration: 0.9 }, // D6
    { freq: 1108.73, duration: 0.5 }, // C#6
    { freq: 1046.50, duration: 1.0 }, // C6

    // Phrase 4
    { freq: 830.61, duration: 0.5 }, // G#5
    { freq: 1046.50, duration: 0.75 }, // C6
    { freq: 987.77, duration: 0.25 }, // B5
    { freq: 932.33, duration: 0.5 }, // Bb5
    { freq: 466.16, duration: 1.0 }, // Bb4
    { freq: 783.99, duration: 0.5 }, // G5
    { freq: 659.25, duration: 2.2, rest: 1.2 }, // E5
  ];

  // Play a single crystalline Celesta bell chime
  private playCelestaNote(freq: number, durationSec: number) {
    if (!this.ctx || !this.hedwigGain) return;

    const now = this.ctx.currentTime;
    
    // Fundamental tone
    const osc1 = this.ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, now);

    // Overtone for bell-like brilliance (2.76x harmonic frequency)
    const osc2 = this.ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * 2.76, now);

    // Note amplitude envelope (sharp percussive hammer strike with lingering decay)
    const noteGain = this.ctx.createGain();
    noteGain.gain.setValueAtTime(0.0001, now);
    noteGain.gain.linearRampToValueAtTime(0.4, now + 0.015);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, now + Math.max(0.4, durationSec * 1.5));

    // Overtone gain
    const overtoneGain = this.ctx.createGain();
    overtoneGain.gain.setValueAtTime(0.12, now);
    overtoneGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);

    osc1.connect(noteGain);
    osc2.connect(overtoneGain);
    overtoneGain.connect(noteGain);
    noteGain.connect(this.hedwigGain);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + durationSec * 1.6);
    osc2.stop(now + 0.4);
  }

  public startHedwigsTheme() {
    if (this.isHedwigsPlaying) return;
    this.initCtx();
    if (!this.ctx) return;

    this.isHedwigsPlaying = true;
    this.hedwigNoteIndex = 0;
    this.scheduleNextHedwigNote();
  }

  public stopHedwigsTheme() {
    this.isHedwigsPlaying = false;
    if (this.hedwigTimeoutId) {
      clearTimeout(this.hedwigTimeoutId);
      this.hedwigTimeoutId = null;
    }
  }

  public toggleHedwigsTheme(): boolean {
    if (this.isHedwigsPlaying) {
      this.stopHedwigsTheme();
      return false;
    } else {
      this.startHedwigsTheme();
      return true;
    }
  }

  public isHedwigsThemePlaying(): boolean {
    return this.isHedwigsPlaying;
  }

  private scheduleNextHedwigNote() {
    if (!this.isHedwigsPlaying) return;

    const note = this.HEDWIGS_NOTES[this.hedwigNoteIndex];
    const tempoBeatSec = 0.72; // Mysterious allegro moderato timing
    const durationSec = note.duration * tempoBeatSec;

    this.playCelestaNote(note.freq, durationSec);

    const delayMs = (durationSec + (note.rest || 0) * tempoBeatSec) * 1000;

    this.hedwigNoteIndex = (this.hedwigNoteIndex + 1) % this.HEDWIGS_NOTES.length;

    this.hedwigTimeoutId = setTimeout(() => {
      this.scheduleNextHedwigNote();
    }, delayMs);
  }

  // --- SOUND EFFECTS ---
  public playQuillScratch() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx || !this.sfxGain) return;

      const bufferSize = this.ctx.sampleRate * 0.045;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.45));
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(2400 + Math.random() * 800, this.ctx.currentTime);
      filter.Q.setValueAtTime(3.8, this.ctx.currentTime);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.35, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.045);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      noise.start();
    } catch {
      // ignore
    }
  }

  public playPageTurn() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx || !this.sfxGain) return;

      const bufferSize = this.ctx.sampleRate * 0.22;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.sin((i / bufferSize) * Math.PI);
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, this.ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(250, this.ctx.currentTime + 0.2);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.22);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      noise.start();
    } catch {
      // ignore
    }
  }

  public playGhostWhisper() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx || !this.sfxGain) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(329.63, this.ctx.currentTime); // E4
      osc.frequency.exponentialRampToValueAtTime(246.94, this.ctx.currentTime + 1.2); // B3

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(750, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.001, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.45, this.ctx.currentTime + 0.25);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 2.2);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      osc.start();
      osc.stop(this.ctx.currentTime + 2.3);
    } catch {
      // ignore
    }
  }

  public playMagicChime() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx || !this.sfxGain) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(587.33, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.25);
    } catch {
      // ignore
    }
  }
}

export const soundManager = new SoundManager();
