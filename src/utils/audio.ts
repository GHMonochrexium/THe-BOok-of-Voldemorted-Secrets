import { AmbientTrack, HarryPotterTrack, MusicInstrumentStyle } from '../types';

export interface MusicTrackInfo {
  id: HarryPotterTrack;
  title: string;
  composer: string;
  description: string;
  signature: string;
}

export const HARRY_POTTER_TRACKS: Record<HarryPotterTrack, MusicTrackInfo> = {
  'hedwigs-theme': {
    id: 'hedwigs-theme',
    title: "Hedwig's Theme",
    composer: "John Williams",
    description: "The iconic celesta melody that whisks you away to Hogwarts Castle.",
    signature: "Mysterious • Celesta & Strings • 3/8 Allegro"
  },
  'leaving-hogwarts': {
    id: 'leaving-hogwarts',
    title: "Leaving Hogwarts",
    composer: "John Williams",
    description: "The nostalgic, heartwarming hymn of friendship and castle memories.",
    signature: "Heartwarming • Harp & Horns • Expressivo"
  },
  'chamber-of-secrets': {
    id: 'chamber-of-secrets',
    title: "Chamber of Secrets",
    composer: "John Williams",
    description: "Dark, whispering subterranean waltz echoed through ancient pipes.",
    signature: "Shadowy • Low Bells & Serpent Tone • Grave"
  }
};

interface MusicalNote {
  freq: number;
  duration: number; // beats
  rest?: number; // beats
  chord?: number[]; // harmonic backing frequencies
}

export class SoundManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private ambientGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private reverbNode: DelayNode | null = null;
  private reverbFeedback: GainNode | null = null;

  // Active pad oscillator chords for orchestral warmth
  private activeChords: OscillatorNode[] = [];
  private chordGain: GainNode | null = null;

  // Ambient nodes
  private ambientOsc1: OscillatorNode | null = null;
  private ambientOsc2: OscillatorNode | null = null;
  private ambientNoiseSource: AudioBufferSourceNode | null = null;
  private isAmbientPlaying = false;
  private currentAmbientTrack: AmbientTrack = 'restricted-section';

  // Music state
  private isMusicPlaying = false;
  private musicTimeoutId: any = null;
  private currentTrackIndex = 0;
  private currentNoteIndex = 0;
  private currentTrackId: HarryPotterTrack = 'hedwigs-theme';
  private instrumentStyle: MusicInstrumentStyle = 'celesta-strings';
  private currentNoteFreq = 0;

  // Settings
  private enabled = true;
  private masterVolume = 0.75;
  private ambientVolume = 0.45;
  private musicVolume = 0.7;
  private sfxVolume = 0.7;

  // Listeners for UI state syncing
  private listeners: Set<() => void> = new Set();

  constructor() {
    // Attempt lazy audio unlock on first user gesture
    if (typeof window !== 'undefined') {
      const unlockHandler = () => {
        this.unlockAudio();
        window.removeEventListener('click', unlockHandler);
        window.removeEventListener('keydown', unlockHandler);
        window.removeEventListener('touchstart', unlockHandler);
      };
      window.addEventListener('click', unlockHandler, { once: true });
      window.addEventListener('keydown', unlockHandler, { once: true });
      window.addEventListener('touchstart', unlockHandler, { once: true });
    }
  }

  public subscribe(callback: () => void) {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notify() {
    this.listeners.forEach((cb) => {
      try {
        cb();
      } catch (e) {
        console.error('SoundManager listener error:', e);
      }
    });
  }

  public unlockAudio() {
    try {
      this.initCtx();
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    } catch (e) {
      // ignore
    }
  }

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();

        // Master gain
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.enabled ? this.masterVolume : 0, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);

        // Sub-gains
        this.ambientGain = this.ctx.createGain();
        this.ambientGain.gain.setValueAtTime(this.ambientVolume * 0.35, this.ctx.currentTime);
        this.ambientGain.connect(this.masterGain);

        this.musicGain = this.ctx.createGain();
        this.musicGain.gain.setValueAtTime(this.musicVolume * 0.75, this.ctx.currentTime);
        this.musicGain.connect(this.masterGain);

        this.chordGain = this.ctx.createGain();
        this.chordGain.gain.setValueAtTime(this.musicVolume * 0.28, this.ctx.currentTime);
        this.chordGain.connect(this.masterGain);

        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.setValueAtTime(this.sfxVolume * 0.6, this.ctx.currentTime);
        this.sfxGain.connect(this.masterGain);

        // Hogwarts Great Hall Reverb / Echo simulation
        try {
          const delay = this.ctx.createDelay(1.0);
          delay.delayTime.setValueAtTime(0.24, this.ctx.currentTime);

          const feedback = this.ctx.createGain();
          feedback.gain.setValueAtTime(0.35, this.ctx.currentTime);

          const filter = this.ctx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(2600, this.ctx.currentTime);

          this.musicGain.connect(delay);
          delay.connect(filter);
          filter.connect(feedback);
          feedback.connect(delay);
          feedback.connect(this.masterGain);

          this.reverbNode = delay;
          this.reverbFeedback = feedback;
        } catch (e) {
          // fallback gracefully without reverb
        }
      }
    }

    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // --- SETTINGS CONTROLS ---
  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (!enabled) {
      this.stopAmbient();
      this.stopMusic();
    }
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(enabled ? this.masterVolume : 0, this.ctx.currentTime, 0.05);
    }
    this.notify();
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public setMasterVolume(vol: number) {
    this.masterVolume = Math.max(0, Math.min(1, vol));
    this.initCtx();
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.enabled ? this.masterVolume : 0, this.ctx.currentTime, 0.05);
    }
    this.notify();
  }

  public getMasterVolume(): number {
    return this.masterVolume;
  }

  public setAmbientVolume(vol: number) {
    this.ambientVolume = Math.max(0, Math.min(1, vol));
    this.initCtx();
    if (this.ambientGain && this.ctx) {
      this.ambientGain.gain.setTargetAtTime(this.ambientVolume * 0.35, this.ctx.currentTime, 0.05);
    }
    this.notify();
  }

  public getAmbientVolume(): number {
    return this.ambientVolume;
  }

  public setMusicVolume(vol: number) {
    this.musicVolume = Math.max(0, Math.min(1, vol));
    this.initCtx();
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setTargetAtTime(this.musicVolume * 0.75, this.ctx.currentTime, 0.05);
    }
    if (this.chordGain && this.ctx) {
      this.chordGain.gain.setTargetAtTime(this.musicVolume * 0.28, this.ctx.currentTime, 0.05);
    }
    this.notify();
  }

  public getMusicVolume(): number {
    return this.musicVolume;
  }

  // Backward compatibility alias
  public setHedwigsVolume(vol: number) {
    this.setMusicVolume(vol);
  }

  public setSfxVolume(vol: number) {
    this.sfxVolume = Math.max(0, Math.min(1, vol));
    this.initCtx();
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setTargetAtTime(this.sfxVolume * 0.6, this.ctx.currentTime, 0.05);
    }
    this.notify();
  }

  public setInstrumentStyle(style: MusicInstrumentStyle) {
    this.instrumentStyle = style;
    this.notify();
  }

  public getInstrumentStyle(): MusicInstrumentStyle {
    return this.instrumentStyle;
  }

  // --- HARRY POTTER TRACKS SCORE DATA ---
  // Track 1: Hedwig's Theme (Complete classic John Williams composition)
  private readonly HEDWIGS_NOTES: MusicalNote[] = [
    // Phrase 1 (The Iconic Celesta entrance)
    { freq: 493.88, duration: 0.5, chord: [82.41, 164.81, 196.00] }, // B4 (Em chord)
    { freq: 659.25, duration: 0.75 }, // E5
    { freq: 783.99, duration: 0.25 }, // G5
    { freq: 739.99, duration: 0.5 }, // F#5
    { freq: 659.25, duration: 1.0 }, // E5
    { freq: 987.77, duration: 0.5 }, // B5
    { freq: 880.00, duration: 1.25, chord: [110.00, 164.81, 220.00, 261.63] }, // A5 (Am chord)
    { freq: 739.99, duration: 1.25, chord: [123.47, 185.00, 246.94] }, // F#5 (B7)

    // Phrase 2
    { freq: 659.25, duration: 0.75, chord: [82.41, 164.81, 196.00] }, // E5 (Em)
    { freq: 783.99, duration: 0.25 }, // G5
    { freq: 739.99, duration: 0.5 }, // F#5
    { freq: 622.25, duration: 1.0, chord: [123.47, 155.56, 185.00] }, // D#5 (B7/D#)
    { freq: 698.46, duration: 0.5 }, // F5
    { freq: 493.88, duration: 1.8, rest: 0.4, chord: [123.47, 164.81, 246.94] }, // B4

    // Phrase 3 (Ascending octave flourish)
    { freq: 493.88, duration: 0.5, chord: [82.41, 164.81, 196.00] }, // B4
    { freq: 659.25, duration: 0.75 }, // E5
    { freq: 783.99, duration: 0.25 }, // G5
    { freq: 739.99, duration: 0.5 }, // F#5
    { freq: 659.25, duration: 1.0 }, // E5
    { freq: 987.77, duration: 0.5 }, // B5
    { freq: 1174.66, duration: 0.9, chord: [130.81, 196.00, 261.63, 329.63] }, // D6 (Cmaj7)
    { freq: 1108.73, duration: 0.5 }, // C#6
    { freq: 1046.50, duration: 1.0, chord: [110.00, 164.81, 220.00] }, // C6 (Am)

    // Phrase 4 (Chromatic descent into mystery)
    { freq: 830.61, duration: 0.5, chord: [103.83, 155.56, 207.65] }, // G#5
    { freq: 1046.50, duration: 0.75 }, // C6
    { freq: 987.77, duration: 0.25 }, // B5
    { freq: 932.33, duration: 0.5 }, // Bb5
    { freq: 466.16, duration: 0.9, chord: [116.54, 174.61, 233.08] }, // Bb4
    { freq: 783.99, duration: 0.5 }, // G5
    { freq: 659.25, duration: 2.2, rest: 0.6, chord: [82.41, 164.81, 196.00] }, // E5

    // Phrase 5 (Waltz variation)
    { freq: 783.99, duration: 0.45, chord: [82.41, 164.81, 196.00] }, // G5
    { freq: 987.77, duration: 0.85 }, // B5
    { freq: 783.99, duration: 0.45 }, // G5
    { freq: 987.77, duration: 0.85 }, // B5
    { freq: 783.99, duration: 0.45, chord: [130.81, 196.00, 261.63] }, // G5 (C)
    { freq: 1046.50, duration: 0.85 }, // C6
    { freq: 987.77, duration: 0.45 }, // B5
    { freq: 932.33, duration: 0.85, chord: [116.54, 185.00, 233.08] }, // Bb5
    { freq: 739.99, duration: 0.45 }, // F#5
    { freq: 783.99, duration: 0.7 }, // G5
    { freq: 987.77, duration: 0.25 }, // B5
    { freq: 932.33, duration: 0.45 }, // Bb5
    { freq: 466.16, duration: 0.85, chord: [123.47, 185.00, 246.94] }, // Bb4
    { freq: 493.88, duration: 0.45 }, // B4
    { freq: 987.77, duration: 1.8, rest: 0.5, chord: [82.41, 123.47, 164.81] }, // B5

    // Phrase 6 (Grand Climax & Resolution)
    { freq: 783.99, duration: 0.45, chord: [82.41, 164.81, 196.00] }, // G5
    { freq: 987.77, duration: 0.85 }, // B5
    { freq: 783.99, duration: 0.45 }, // G5
    { freq: 987.77, duration: 0.85 }, // B5
    { freq: 783.99, duration: 0.45, chord: [130.81, 196.00, 261.63] }, // G5 (Cmaj7)
    { freq: 1174.66, duration: 0.85 }, // D6
    { freq: 1108.73, duration: 0.45 }, // C#6
    { freq: 1046.50, duration: 0.9, chord: [110.00, 164.81, 220.00] }, // C6
    { freq: 830.61, duration: 0.45, chord: [103.83, 155.56, 207.65] }, // G#5
    { freq: 1046.50, duration: 0.7 }, // C6
    { freq: 987.77, duration: 0.25 }, // B5
    { freq: 932.33, duration: 0.45 }, // Bb5
    { freq: 466.16, duration: 0.85 }, // Bb4
    { freq: 783.99, duration: 0.45 }, // G5
    { freq: 659.25, duration: 2.8, rest: 1.2, chord: [82.41, 164.81, 196.00, 329.63] }, // E5
  ];

  // Track 2: Leaving Hogwarts (Emotional and heartwarming Hogwarts farewell)
  private readonly LEAVING_HOGWARTS_NOTES: MusicalNote[] = [
    { freq: 392.00, duration: 0.7, chord: [98.00, 196.00, 246.94, 293.66] }, // G4 (G major)
    { freq: 493.88, duration: 0.7 }, // B4
    { freq: 587.33, duration: 1.2 }, // D5
    { freq: 659.25, duration: 0.6 }, // E5
    { freq: 587.33, duration: 1.0 }, // D5
    { freq: 493.88, duration: 0.7, chord: [110.00, 164.81, 220.00] }, // B4 (Am/G)
    { freq: 440.00, duration: 0.7 }, // A4
    { freq: 392.00, duration: 1.4, chord: [98.00, 146.83, 196.00] }, // G4
    { freq: 440.00, duration: 0.6 }, // A4
    { freq: 493.88, duration: 1.0 }, // B4
    { freq: 392.00, duration: 2.0, rest: 0.4, chord: [98.00, 196.00, 293.66] }, // G4

    // Section 2 (Ascending into castle grandeur)
    { freq: 392.00, duration: 0.6, chord: [130.81, 196.00, 261.63] }, // G4 (C)
    { freq: 493.88, duration: 0.6 }, // B4
    { freq: 587.33, duration: 0.8 }, // D5
    { freq: 783.99, duration: 1.2, chord: [98.00, 196.00, 392.00] }, // G5 (G)
    { freq: 739.99, duration: 0.6 }, // F#5
    { freq: 659.25, duration: 0.8, chord: [82.41, 164.81, 246.94] }, // E5 (Em)
    { freq: 587.33, duration: 1.0 }, // D5
    { freq: 493.88, duration: 0.6 }, // B4
    { freq: 523.25, duration: 0.8, chord: [110.00, 164.81, 220.00] }, // C5 (Am)
    { freq: 493.88, duration: 0.6 }, // B4
    { freq: 440.00, duration: 0.8 }, // A4
    { freq: 392.00, duration: 2.6, rest: 1.0, chord: [98.00, 146.83, 196.00, 293.66] }, // G4
  ];

  // Track 3: Chamber of Secrets (Shadowy Dark Arts theme)
  private readonly CHAMBER_OF_SECRETS_NOTES: MusicalNote[] = [
    { freq: 293.66, duration: 0.7, chord: [73.42, 146.83, 174.61] }, // D4 (Dm)
    { freq: 349.23, duration: 0.7 }, // F4
    { freq: 415.30, duration: 1.0 }, // G#4 (Mysterious tritone)
    { freq: 440.00, duration: 1.2, chord: [73.42, 110.00, 146.83] }, // A4
    { freq: 349.23, duration: 0.7 }, // F4
    { freq: 293.66, duration: 1.2 }, // D4
    { freq: 277.18, duration: 1.0, chord: [69.30, 138.59, 164.81] }, // C#4 (A7/C#)
    { freq: 293.66, duration: 2.2, rest: 0.5, chord: [73.42, 146.83, 220.00] }, // D4

    { freq: 349.23, duration: 0.7, chord: [87.31, 130.81, 174.61] }, // F4
    { freq: 415.30, duration: 0.7 }, // G#4
    { freq: 493.88, duration: 1.0 }, // B4
    { freq: 523.25, duration: 1.2, chord: [103.83, 130.81, 207.65] }, // C5
    { freq: 415.30, duration: 0.7 }, // G#4
    { freq: 349.23, duration: 1.0 }, // F4
    { freq: 329.63, duration: 0.8, chord: [82.41, 123.47, 164.81] }, // E4
    { freq: 349.23, duration: 2.2, rest: 0.5, chord: [87.31, 130.81, 174.61] }, // F4

    { freq: 293.66, duration: 0.6, chord: [73.42, 146.83] }, // D4
    { freq: 329.63, duration: 0.6 }, // E4
    { freq: 349.23, duration: 0.6 }, // F4
    { freq: 415.30, duration: 0.8 }, // G#4
    { freq: 440.00, duration: 1.0, chord: [73.42, 146.83, 220.00] }, // A4
    { freq: 587.33, duration: 1.2 }, // D5
    { freq: 554.37, duration: 0.8, chord: [69.30, 138.59, 220.00] }, // C#5
    { freq: 587.33, duration: 3.0, rest: 1.2, chord: [73.42, 110.00, 146.83, 220.00] }, // D5
  ];

  private getScoreForTrack(track: HarryPotterTrack): MusicalNote[] {
    switch (track) {
      case 'leaving-hogwarts':
        return this.LEAVING_HOGWARTS_NOTES;
      case 'chamber-of-secrets':
        return this.CHAMBER_OF_SECRETS_NOTES;
      case 'hedwigs-theme':
      default:
        return this.HEDWIGS_NOTES;
    }
  }

  // Play a single note with acoustic physics (Celesta / Music Box / Harp)
  private playInstrumentNote(freq: number, durationSec: number) {
    if (!this.ctx || !this.musicGain) return;
    const now = this.ctx.currentTime;
    this.currentNoteFreq = freq;

    if (this.instrumentStyle === 'music-box') {
      // Antique mechanical music box: clean high-harmonic ringing with light tick
      const osc1 = this.ctx.createOscillator();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(freq, now);

      const osc2 = this.ctx.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(freq * 3.0, now);

      const noteGain = this.ctx.createGain();
      noteGain.gain.setValueAtTime(0.0001, now);
      noteGain.gain.linearRampToValueAtTime(0.65, now + 0.004);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, now + Math.max(0.5, durationSec * 1.8));

      const overtoneGain = this.ctx.createGain();
      overtoneGain.gain.setValueAtTime(0.18, now);
      overtoneGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);

      osc1.connect(noteGain);
      osc2.connect(overtoneGain);
      overtoneGain.connect(noteGain);
      noteGain.connect(this.musicGain);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + durationSec * 1.9);
      osc2.stop(now + 0.3);

    } else if (this.instrumentStyle === 'harp-bells') {
      // Warm harp plucked string + crystalline bells
      const osc1 = this.ctx.createOscillator();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(freq, now);

      const osc2 = this.ctx.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(freq * 2.0, now);

      const noteGain = this.ctx.createGain();
      noteGain.gain.setValueAtTime(0.0001, now);
      noteGain.gain.linearRampToValueAtTime(0.7, now + 0.012);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, now + Math.max(0.6, durationSec * 2.0));

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(3200, now);
      filter.frequency.exponentialRampToValueAtTime(800, now + durationSec);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(noteGain);
      noteGain.connect(this.musicGain);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + durationSec * 2.1);
      osc2.stop(now + durationSec * 2.1);

    } else {
      // Default: 'celesta-strings' (The iconic Hedwig Celesta)
      // Fundamental pure tone
      const osc1 = this.ctx.createOscillator();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(freq, now);

      // Overtone 1: 2.756x (celesta steel chime ratio)
      const osc2 = this.ctx.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(freq * 2.756, now);

      // Overtone 2: 5.4x (crystalline glockenspiel sparkle)
      const osc3 = this.ctx.createOscillator();
      osc3.type = 'sine';
      osc3.frequency.setValueAtTime(freq * 5.4, now);

      const noteGain = this.ctx.createGain();
      noteGain.gain.setValueAtTime(0.0001, now);
      noteGain.gain.linearRampToValueAtTime(0.72, now + 0.008);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, now + Math.max(0.5, durationSec * 1.8));

      const overtoneGain = this.ctx.createGain();
      overtoneGain.gain.setValueAtTime(0.24, now);
      overtoneGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);

      const sparkleGain = this.ctx.createGain();
      sparkleGain.gain.setValueAtTime(0.08, now);
      sparkleGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

      osc1.connect(noteGain);
      osc2.connect(overtoneGain);
      overtoneGain.connect(noteGain);
      osc3.connect(sparkleGain);
      sparkleGain.connect(noteGain);

      noteGain.connect(this.musicGain);

      osc1.start(now);
      osc2.start(now);
      osc3.start(now);

      const stopTime = now + durationSec * 1.9;
      osc1.stop(stopTime);
      osc2.stop(now + 0.45);
      osc3.stop(now + 0.22);
    }
  }

  // Play backing orchestral chord swell for true John Williams atmosphere
  private playChordBacking(chordFreqs: number[], durationSec: number) {
    if (!this.ctx || !this.chordGain || this.instrumentStyle === 'music-box') return;

    // Fade out previous chords
    this.stopActiveChords();

    const now = this.ctx.currentTime;
    const chordNodes: OscillatorNode[] = [];

    chordFreqs.forEach((freq) => {
      if (!this.ctx || !this.chordGain) return;
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      // Slight detune for warm orchestral unison chorus
      osc.detune.setValueAtTime((Math.random() * 6 - 3), now);

      const singleGain = this.ctx.createGain();
      singleGain.gain.setValueAtTime(0.0001, now);
      singleGain.gain.linearRampToValueAtTime(0.22 / chordFreqs.length, now + 0.2);
      singleGain.gain.exponentialRampToValueAtTime(0.0001, now + Math.max(1.5, durationSec * 1.5));

      osc.connect(singleGain);
      singleGain.connect(this.chordGain);

      osc.start(now);
      osc.stop(now + durationSec * 1.6);
      chordNodes.push(osc);
    });

    this.activeChords = chordNodes;
  }

  private stopActiveChords() {
    this.activeChords.forEach((osc) => {
      try {
        osc.stop();
        osc.disconnect();
      } catch (e) {
        // ignore
      }
    });
    this.activeChords = [];
  }

  // --- MUSIC PLAYBACK SCHEDULER ---
  public startMusic(track?: HarryPotterTrack) {
    if (track) {
      this.currentTrackId = track;
      this.currentNoteIndex = 0;
    }
    this.unlockAudio();
    this.initCtx();
    if (!this.ctx) return;

    if (this.isMusicPlaying) {
      if (track && track !== this.currentTrackId) {
        this.stopMusic();
      } else {
        return;
      }
    }

    this.isMusicPlaying = true;
    this.scheduleNextMusicNote();
    this.notify();
  }

  public stopMusic() {
    this.isMusicPlaying = false;
    if (this.musicTimeoutId) {
      clearTimeout(this.musicTimeoutId);
      this.musicTimeoutId = null;
    }
    this.stopActiveChords();
    this.currentNoteFreq = 0;
    this.notify();
  }

  public toggleMusic(track?: HarryPotterTrack): boolean {
    if (this.isMusicPlaying) {
      this.stopMusic();
      return false;
    } else {
      this.startMusic(track || this.currentTrackId);
      return true;
    }
  }

  // Backward compatibility alias
  public startHedwigsTheme() {
    this.startMusic('hedwigs-theme');
  }

  public stopHedwigsTheme() {
    this.stopMusic();
  }

  public toggleHedwigsTheme(): boolean {
    return this.toggleMusic('hedwigs-theme');
  }

  public isHedwigsThemePlaying(): boolean {
    return this.isMusicPlaying;
  }

  public isMusicActive(): boolean {
    return this.isMusicPlaying;
  }

  public getCurrentTrack(): HarryPotterTrack {
    return this.currentTrackId;
  }

  public setTrack(track: HarryPotterTrack) {
    const wasPlaying = this.isMusicPlaying;
    this.stopMusic();
    this.currentTrackId = track;
    this.currentNoteIndex = 0;
    if (wasPlaying) {
      this.startMusic(track);
    } else {
      this.notify();
    }
  }

  public nextTrack() {
    const trackKeys: HarryPotterTrack[] = ['hedwigs-theme', 'leaving-hogwarts', 'chamber-of-secrets'];
    const currentIndex = trackKeys.indexOf(this.currentTrackId);
    const next = trackKeys[(currentIndex + 1) % trackKeys.length];
    this.setTrack(next);
  }

  public prevTrack() {
    const trackKeys: HarryPotterTrack[] = ['hedwigs-theme', 'leaving-hogwarts', 'chamber-of-secrets'];
    const currentIndex = trackKeys.indexOf(this.currentTrackId);
    const prev = trackKeys[(currentIndex - 1 + trackKeys.length) % trackKeys.length];
    this.setTrack(prev);
  }

  public getCurrentNoteFreq(): number {
    return this.currentNoteFreq;
  }

  private scheduleNextMusicNote() {
    if (!this.isMusicPlaying) return;

    const score = this.getScoreForTrack(this.currentTrackId);
    const note = score[this.currentNoteIndex];
    
    // Tempo adjustment by track
    let tempoBeatSec = 0.74; // Hedwig's 3/8 moderate allegro
    if (this.currentTrackId === 'leaving-hogwarts') {
      tempoBeatSec = 0.85; // Warm, steady, emotional
    } else if (this.currentTrackId === 'chamber-of-secrets') {
      tempoBeatSec = 0.78; // Mysterious
    }

    const durationSec = note.duration * tempoBeatSec;

    // Trigger note
    this.playInstrumentNote(note.freq, durationSec);

    // If note has chord backing, swell strings
    if (note.chord && note.chord.length > 0) {
      this.playChordBacking(note.chord, durationSec);
    }

    const delayMs = (durationSec + (note.rest || 0) * tempoBeatSec) * 1000;

    this.currentNoteIndex = (this.currentNoteIndex + 1) % score.length;

    this.musicTimeoutId = setTimeout(() => {
      this.scheduleNextMusicNote();
    }, delayMs);
  }

  // --- AMBIENT SOUNDSCAPES ---
  public setAmbientTrack(track: AmbientTrack) {
    this.currentAmbientTrack = track;
    if (this.isAmbientPlaying) {
      this.stopAmbient();
      setTimeout(() => this.startAmbient(), 300);
    }
  }

  public getAmbientTrack(): AmbientTrack {
    return this.currentAmbientTrack;
  }

  public isAmbientActive(): boolean {
    return this.isAmbientPlaying;
  }

  public startAmbient() {
    if (!this.enabled || this.isAmbientPlaying) return;
    try {
      this.initCtx();
      if (!this.ctx || !this.ambientGain) return;

      if (this.currentAmbientTrack === 'astronomy-thunder') {
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

        this.ambientOsc1 = this.ctx.createOscillator();
        this.ambientOsc1.type = 'triangle';
        this.ambientOsc1.frequency.setValueAtTime(48, this.ctx.currentTime);
        this.ambientOsc1.connect(this.ambientGain);
        this.ambientOsc1.start();

      } else if (this.currentAmbientTrack === 'chamber-whispers') {
        this.ambientOsc1 = this.ctx.createOscillator();
        this.ambientOsc1.type = 'sine';
        this.ambientOsc1.frequency.setValueAtTime(43.65, this.ctx.currentTime);

        this.ambientOsc2 = this.ctx.createOscillator();
        this.ambientOsc2.type = 'sine';
        this.ambientOsc2.frequency.setValueAtTime(65.41, this.ctx.currentTime);

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
      this.notify();
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
      this.notify();
    }
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

      gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
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
