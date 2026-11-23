import { ModeChordStep, MODE_DEFINITIONS } from '../data/modesProgram';

export interface BackingBeatEvent {
  chordIndex: number;
  barInChord: number;
  beatInBar: number;
}

export class ModeBackingEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private highpass: BiquadFilterNode | null = null;
  private lowpass: BiquadFilterNode | null = null;
  private timerId: number | null = null;
  private auditionTimerId: number | null = null;
  private activeOscillators: Set<OscillatorNode> = new Set();
  private isPlaying = false;
  private volume = 0.35;
  private bpm = 92;
  private progression: ModeChordStep[] = [];
  private onBeat?: (event: BackingBeatEvent) => void;

  private currentChordIdx = 0;
  private currentBarInChord = 0;
  private currentBeatInBar = 0;
  private nextNoteTime = 0;

  private ensureContext(): AudioContext {
    if (!this.ctx || this.ctx.state === 'closed') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.highpass = this.ctx.createBiquadFilter();
      this.highpass.type = 'highpass';
      this.highpass.frequency.value = 320; // Stay above low-end bass fundamental tracking

      this.lowpass = this.ctx.createBiquadFilter();
      this.lowpass.type = 'lowpass';
      this.lowpass.frequency.value = 1800; // Warm Rhodes-like tone

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.volume;

      this.highpass.connect(this.lowpass);
      this.lowpass.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    return this.ctx;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.04);
    }
  }

  public setBpm(bpm: number) {
    this.bpm = Math.max(55, Math.min(160, bpm));
  }

  private midiToFreq(midi: number): number {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  private getMidRegisterRoot(bassRootMidi: number): number {
    let root = bassRootMidi;
    while (root < 57) root += 12; // A3 (220Hz) and up
    while (root > 68) root -= 12;
    return root;
  }

  private trackOscillator(osc: OscillatorNode) {
    this.activeOscillators.add(osc);
    osc.onended = () => {
      this.activeOscillators.delete(osc);
    };
  }

  private stopAllSoundNow() {
    this.activeOscillators.forEach((osc) => {
      try {
        osc.stop();
        osc.disconnect();
      } catch {
        // Ignore already stopped oscillators
      }
    });
    this.activeOscillators.clear();
  }

  private playChordVoicing(step: ModeChordStep, startTime: number, durationSec: number) {
    if (!this.ctx || !this.highpass) return;
    const mode = MODE_DEFINITIONS[step.modeId];
    const baseRoot = this.getMidRegisterRoot(step.rootMidi);
    const voicing = mode.padVoicing.map((offset) => baseRoot + offset);

    voicing.forEach((midi, idx) => {
      if (!this.ctx || !this.highpass) return;
      const osc = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const noteGain = this.ctx.createGain();

      const freq = this.midiToFreq(midi);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(freq * 2, startTime);

      const overtoneGain = this.ctx.createGain();
      overtoneGain.gain.setValueAtTime(0.14, startTime);
      overtoneGain.gain.exponentialRampToValueAtTime(0.01, startTime + Math.min(0.8, durationSec));

      const amp = idx === 0 ? 0.2 : 0.15;
      noteGain.gain.setValueAtTime(0.0001, startTime);
      noteGain.gain.linearRampToValueAtTime(amp, startTime + 0.035);
      noteGain.gain.exponentialRampToValueAtTime(amp * 0.55, startTime + Math.min(0.6, durationSec * 0.6));
      noteGain.gain.exponentialRampToValueAtTime(0.0008, startTime + durationSec);

      osc.connect(noteGain);
      osc2.connect(overtoneGain);
      overtoneGain.connect(noteGain);
      noteGain.connect(this.highpass);

      this.trackOscillator(osc);
      this.trackOscillator(osc2);

      osc.start(startTime);
      osc2.start(startTime);
      osc.stop(startTime + durationSec + 0.05);
      osc2.stop(startTime + durationSec + 0.05);
    });
  }

  private playSoftPulse(startTime: number, isDownbeat: boolean) {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(isDownbeat ? 980 : 680, startTime);
    osc.frequency.exponentialRampToValueAtTime(isDownbeat ? 420 : 320, startTime + 0.03);

    gain.gain.setValueAtTime(isDownbeat ? 0.12 : 0.06, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.045);

    osc.connect(gain);
    gain.connect(this.masterGain);

    this.trackOscillator(osc);
    osc.start(startTime);
    osc.stop(startTime + 0.05);
  }

  private scheduleLoop() {
    if (!this.isPlaying || !this.ctx || this.progression.length === 0) return;

    const lookaheadSec = 0.12;
    const beatDuration = 60 / this.bpm;

    while (this.nextNoteTime < this.ctx.currentTime + lookaheadSec) {
      const step = this.progression[this.currentChordIdx];
      const scheduledChordIdx = this.currentChordIdx;
      const scheduledBar = this.currentBarInChord;
      const scheduledBeat = this.currentBeatInBar;

      // Play warm chord stab on beat 1 (sustained) and light comping pulse on beat 3
      if (scheduledBeat === 0) {
        this.playChordVoicing(step, this.nextNoteTime, beatDuration * 2.2);
      } else if (scheduledBeat === 2) {
        this.playChordVoicing(step, this.nextNoteTime, beatDuration * 1.85);
      }

      this.playSoftPulse(this.nextNoteTime, scheduledBeat === 0);

      const delayMs = Math.max(0, (this.nextNoteTime - this.ctx.currentTime) * 1000);
      if (this.onBeat) {
        const cb = this.onBeat;
        window.setTimeout(() => {
          if (this.isPlaying) {
            cb({
              chordIndex: scheduledChordIdx,
              barInChord: scheduledBar,
              beatInBar: scheduledBeat,
            });
          }
        }, delayMs);
      }

      // Advance beat/bar/chord
      this.nextNoteTime += beatDuration;
      this.currentBeatInBar += 1;
      if (this.currentBeatInBar >= 4) {
        this.currentBeatInBar = 0;
        this.currentBarInChord += 1;
        if (this.currentBarInChord >= step.bars) {
          this.currentBarInChord = 0;
          this.currentChordIdx = (this.currentChordIdx + 1) % this.progression.length;
        }
      }
    }
  }

  public start(
    progression: ModeChordStep[],
    bpm: number,
    onBeat?: (event: BackingBeatEvent) => void
  ) {
    this.stop();
    if (!progression.length) return;

    const ctx = this.ensureContext();
    this.progression = progression;
    this.bpm = bpm;
    this.onBeat = onBeat;
    this.currentChordIdx = 0;
    this.currentBarInChord = 0;
    this.currentBeatInBar = 0;
    this.isPlaying = true;
    this.nextNoteTime = ctx.currentTime + 0.05;

    this.scheduleLoop();
    this.timerId = window.setInterval(() => this.scheduleLoop(), 40);
  }

  public stopAudition() {
    if (this.auditionTimerId !== null) {
      clearTimeout(this.auditionTimerId);
      this.auditionTimerId = null;
    }
    if (!this.isPlaying) {
      this.stopAllSoundNow();
    }
  }

  public stop() {
    this.isPlaying = false;
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    if (this.auditionTimerId !== null) {
      clearTimeout(this.auditionTimerId);
      this.auditionTimerId = null;
    }
    this.stopAllSoundNow();
  }

  public auditionStep(step: ModeChordStep, onComplete?: () => void) {
    this.stop();
    const ctx = this.ensureContext();
    const mode = MODE_DEFINITIONS[step.modeId];
    const now = ctx.currentTime + 0.04;

    // Play the chord pad first
    this.playChordVoicing(step, now, 2.8);

    // Then arpeggiate the mode scale softly above the pad so the ear hears the color note clearly
    const baseRoot = this.getMidRegisterRoot(step.rootMidi);
    const scaleMidis = [...mode.intervals, 12].map((i) => baseRoot + i);

    scaleMidis.forEach((midi, idx) => {
      if (!this.highpass) return;
      const t = now + 0.35 + idx * 0.24;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const isColor = (midi - baseRoot) % 12 === mode.colorInterval;

      osc.type = isColor ? 'sawtooth' : 'triangle';
      osc.frequency.setValueAtTime(this.midiToFreq(midi), t);

      const peak = isColor ? 0.22 : 0.15;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.linearRampToValueAtTime(peak, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + (isColor ? 0.55 : 0.32));

      osc.connect(gain);
      gain.connect(this.highpass);
      this.trackOscillator(osc);
      osc.start(t);
      osc.stop(t + 0.6);
    });

    const totalDurationMs = Math.round((0.35 + scaleMidis.length * 0.24 + 0.55) * 1000);
    this.auditionTimerId = window.setTimeout(() => {
      this.auditionTimerId = null;
      onComplete?.();
    }, totalDurationMs);
  }

  public dispose() {
    this.stop();
    if (this.ctx && this.ctx.state !== 'closed') {
      try {
        this.ctx.close();
      } catch {
        // Ignore close errors
      }
    }
    this.ctx = null;
    this.masterGain = null;
    this.highpass = null;
    this.lowpass = null;
  }
}
