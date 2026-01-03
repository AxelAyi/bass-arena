
import { MetronomeSound } from '../state/store';

export class MetronomeEngine {
  private audioContext: AudioContext | null = null;
  private nextNoteTime: number = 0;
  private timerID: number | null = null;
  private lookahead: number = 25.0; // ms
  private scheduleAheadTime: number = 0.1; // s
  private currentBeat: number = 0;
  
  // Settings
  private bpm: number = 100;
  private beatsPerMeasure: number = 4;
  private sound: MetronomeSound = 'tick';
  private volume: number = 0.5;

  constructor() {}

  start(ctx: AudioContext, bpm: number, beatsPerMeasure: number, sound: MetronomeSound, volume: number) {
    this.audioContext = ctx;
    this.bpm = bpm;
    this.beatsPerMeasure = beatsPerMeasure;
    this.sound = sound;
    this.volume = volume;

    this.currentBeat = 0;
    this.nextNoteTime = this.audioContext.currentTime;
    this.scheduler();
  }

  stop() {
    if (this.timerID !== null) {
      clearTimeout(this.timerID);
      this.timerID = null;
    }
  }

  updateSettings(bpm: number, beatsPerMeasure: number, sound: MetronomeSound, volume: number) {
    this.bpm = bpm;
    this.beatsPerMeasure = beatsPerMeasure;
    this.sound = sound;
    this.volume = volume;
  }

  private scheduler() {
    if (!this.audioContext) return;
    
    while (this.nextNoteTime < this.audioContext.currentTime + this.scheduleAheadTime) {
      this.scheduleNote(this.currentBeat, this.nextNoteTime);
      this.nextNote();
    }
    this.timerID = window.setTimeout(() => this.scheduler(), this.lookahead);
  }

  private nextNote() {
    const secondsPerBeat = 60.0 / this.bpm;
    this.nextNoteTime += secondsPerBeat;
    this.currentBeat = (this.currentBeat + 1) % this.beatsPerMeasure;
  }

  private scheduleNote(beatNumber: number, time: number) {
    if (!this.audioContext) return;

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    osc.connect(gain);
    gain.connect(this.audioContext.destination);

    const isFirstBeat = beatNumber === 0;
    
    switch (this.sound) {
      case 'beep':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(isFirstBeat ? 880 : 440, time);
        gain.gain.setValueAtTime(this.volume, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
        osc.start(time);
        osc.stop(time + 0.1);
        break;
      case 'tick':
        osc.type = 'square';
        osc.frequency.setValueAtTime(isFirstBeat ? 1500 : 1000, time);
        gain.gain.setValueAtTime(this.volume * 0.5, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.02);
        osc.start(time);
        osc.stop(time + 0.02);
        break;
      case 'wood':
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(isFirstBeat ? 600 : 400, time);
        gain.gain.setValueAtTime(this.volume, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
        
        // Add a secondary pop for woodblock feel
        const osc2 = this.audioContext.createOscillator();
        const gain2 = this.audioContext.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(isFirstBeat ? 1200 : 800, time);
        osc2.connect(gain2);
        gain2.connect(this.audioContext.destination);
        gain2.gain.setValueAtTime(this.volume * 0.3, time);
        gain2.gain.exponentialRampToValueAtTime(0.001, time + 0.02);
        osc2.start(time);
        osc2.stop(time + 0.02);

        osc.start(time);
        osc.stop(time + 0.05);
        break;
    }
  }
}
