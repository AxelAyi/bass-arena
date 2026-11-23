export type EarInstrument = 'bass' | 'upright' | 'epiano';

export class EarTrainingPlayer {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private activeNodes: Set<AudioScheduledSourceNode> = new Set();
  private scheduledTimers: number[] = [];
  private playbackToken = 0;
  private volume = 0.72;

  private ensureContext(): AudioContext {
    if (!this.ctx || this.ctx.state === 'closed') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();

      // Gentle master EQ + limiter so bass pitches stay warm yet crystal-clear on all speakers
      const lowShelf = this.ctx.createBiquadFilter();
      lowShelf.type = 'lowshelf';
      lowShelf.frequency.value = 140;
      lowShelf.gain.value = 2.0;

      const presence = this.ctx.createBiquadFilter();
      presence.type = 'peaking';
      presence.frequency.value = 820;
      presence.Q.value = 0.9;
      presence.gain.value = 2.5;

      this.compressor = this.ctx.createDynamicsCompressor();
      this.compressor.threshold.value = -16;
      this.compressor.knee.value = 18;
      this.compressor.ratio.value = 3.5;
      this.compressor.attack.value = 0.005;
      this.compressor.release.value = 0.18;

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.volume;

      lowShelf.connect(presence);
      presence.connect(this.compressor);
      this.compressor.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);

      // Keep entry point on lowShelf by attaching it to masterGain via a ref property
      (this as any)._inputNode = lowShelf;
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    return this.ctx;
  }

  private getInputNode(): AudioNode {
    this.ensureContext();
    return (this as any)._inputNode as AudioNode;
  }

  private midiToFreq(midi: number): number {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  private trackNode(node: AudioScheduledSourceNode) {
    this.activeNodes.add(node);
    node.onended = () => {
      this.activeNodes.delete(node);
    };
  }

  private createNoiseBurst(ctx: AudioContext, durationSec: number): AudioBufferSourceNode {
    const length = Math.max(1, Math.floor(ctx.sampleRate * durationSec));
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      // Exponentially decaying pluck transient
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (length * 0.25));
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    return src;
  }

  private scheduleNote(
    midi: number,
    startTime: number,
    durationSec: number,
    instrument: EarInstrument
  ) {
    const ctx = this.ensureContext();
    const dest = this.getInputNode();
    const safeDur = Math.max(0.14, durationSec);
    const release = Math.min(0.065, safeDur * 0.22);
    const gateEnd = startTime + Math.max(0.08, safeDur - release * 0.5);

    if (instrument === 'bass') {
      // Warm Fingered Electric Bass: fundamental + clear 2nd/3rd harmonics + subtle finger pluck
      const freq = this.midiToFreq(midi);

      const subOsc = ctx.createOscillator();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(freq, startTime);

      const bodyOsc = ctx.createOscillator();
      bodyOsc.type = 'triangle';
      bodyOsc.frequency.setValueAtTime(freq, startTime);

      // Second harmonic layer keeps low E1/F1/G1 pitches unmistakable on laptop/phone speakers
      const harm2Osc = ctx.createOscillator();
      harm2Osc.type = 'sine';
      harm2Osc.frequency.setValueAtTime(freq * 2, startTime);

      const growlOsc = ctx.createOscillator();
      growlOsc.type = 'sawtooth';
      growlOsc.frequency.setValueAtTime(freq, startTime);

      const subGain = ctx.createGain();
      subGain.gain.value = 0.52;

      const bodyGain = ctx.createGain();
      bodyGain.gain.value = 0.42;

      const harm2Gain = ctx.createGain();
      harm2Gain.gain.setValueAtTime(0.32, startTime);
      harm2Gain.gain.exponentialRampToValueAtTime(0.14, startTime + Math.min(0.45, safeDur));

      const growlGain = ctx.createGain();
      growlGain.gain.setValueAtTime(0.22, startTime);
      growlGain.gain.exponentialRampToValueAtTime(0.04, startTime + Math.min(0.35, safeDur));

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.Q.value = 1.4;
      // Bright plucked attack that settles to a warm, articulate midrange
      const peakCutoff = Math.min(2600, Math.max(1100, freq * 14));
      const sustainCutoff = Math.min(950, Math.max(420, freq * 4.5));
      filter.frequency.setValueAtTime(peakCutoff, startTime);
      filter.frequency.exponentialRampToValueAtTime(sustainCutoff, startTime + Math.min(0.28, safeDur * 0.65));

      const env = ctx.createGain();
      env.gain.setValueAtTime(0.0001, startTime);
      env.gain.linearRampToValueAtTime(0.85, startTime + 0.01);
      env.gain.exponentialRampToValueAtTime(0.55, startTime + Math.min(0.18, safeDur * 0.45));
      env.gain.setValueAtTime(0.45, gateEnd);
      env.gain.exponentialRampToValueAtTime(0.0008, gateEnd + release);

      // Subtle finger-on-string pluck transient
      const pluck = this.createNoiseBurst(ctx, 0.022);
      const pluckFilter = ctx.createBiquadFilter();
      pluckFilter.type = 'bandpass';
      pluckFilter.frequency.value = 1600;
      pluckFilter.Q.value = 1.2;
      const pluckGain = ctx.createGain();
      pluckGain.gain.setValueAtTime(0.16, startTime);
      pluckGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.022);

      pluck.connect(pluckFilter);
      pluckFilter.connect(pluckGain);
      pluckGain.connect(dest);

      subOsc.connect(subGain);
      bodyOsc.connect(bodyGain);
      harm2Osc.connect(harm2Gain);
      growlOsc.connect(growlGain);

      subGain.connect(filter);
      bodyGain.connect(filter);
      harm2Gain.connect(filter);
      growlGain.connect(filter);
      filter.connect(env);
      env.connect(dest);

      [subOsc, bodyOsc, harm2Osc, growlOsc, pluck].forEach((n) => this.trackNode(n));

      const stopAt = gateEnd + release + 0.02;
      subOsc.start(startTime);
      bodyOsc.start(startTime);
      harm2Osc.start(startTime);
      growlOsc.start(startTime);
      pluck.start(startTime);

      subOsc.stop(stopAt);
      bodyOsc.stop(stopAt);
      harm2Osc.stop(stopAt);
      growlOsc.stop(stopAt);
      pluck.stop(startTime + 0.025);
      return;
    }

    if (instrument === 'upright') {
      // Acoustic Upright Bass: warm wooden body + faster natural decay + acoustic thump
      const freq = this.midiToFreq(midi);

      const mainOsc = ctx.createOscillator();
      mainOsc.type = 'triangle';
      mainOsc.frequency.setValueAtTime(freq * 1.006, startTime);
      mainOsc.frequency.exponentialRampToValueAtTime(freq, startTime + 0.035); // subtle string pitch settle

      const subOsc = ctx.createOscillator();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(freq, startTime);

      const harmOsc = ctx.createOscillator();
      harmOsc.type = 'sine';
      harmOsc.frequency.setValueAtTime(freq * 2, startTime);

      const woodRes = ctx.createBiquadFilter();
      woodRes.type = 'peaking';
      woodRes.frequency.value = 340;
      woodRes.Q.value = 1.6;
      woodRes.gain.value = 5.0;

      const lpf = ctx.createBiquadFilter();
      lpf.type = 'lowpass';
      lpf.frequency.setValueAtTime(1400, startTime);
      lpf.frequency.exponentialRampToValueAtTime(380, startTime + Math.min(0.22, safeDur * 0.6));

      const mainGain = ctx.createGain();
      mainGain.gain.value = 0.55;
      const subGain = ctx.createGain();
      subGain.gain.value = 0.45;
      const harmGain = ctx.createGain();
      harmGain.gain.setValueAtTime(0.28, startTime);
      harmGain.gain.exponentialRampToValueAtTime(0.03, startTime + Math.min(0.25, safeDur));

      const env = ctx.createGain();
      env.gain.setValueAtTime(0.0001, startTime);
      env.gain.linearRampToValueAtTime(0.92, startTime + 0.014);
      env.gain.exponentialRampToValueAtTime(0.32, startTime + Math.min(0.32, safeDur * 0.7));
      env.gain.exponentialRampToValueAtTime(0.0008, gateEnd + release + 0.04);

      const thump = this.createNoiseBurst(ctx, 0.028);
      const thumpFilter = ctx.createBiquadFilter();
      thumpFilter.type = 'bandpass';
      thumpFilter.frequency.value = 520;
      thumpFilter.Q.value = 1.0;
      const thumpGain = ctx.createGain();
      thumpGain.gain.setValueAtTime(0.22, startTime);
      thumpGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.028);

      thump.connect(thumpFilter);
      thumpFilter.connect(thumpGain);
      thumpGain.connect(dest);

      mainOsc.connect(mainGain);
      subOsc.connect(subGain);
      harmOsc.connect(harmGain);

      mainGain.connect(woodRes);
      subGain.connect(woodRes);
      harmGain.connect(woodRes);
      woodRes.connect(lpf);
      lpf.connect(env);
      env.connect(dest);

      [mainOsc, subOsc, harmOsc, thump].forEach((n) => this.trackNode(n));

      const stopAt = gateEnd + release + 0.06;
      mainOsc.start(startTime);
      subOsc.start(startTime);
      harmOsc.start(startTime);
      thump.start(startTime);

      mainOsc.stop(stopAt);
      subOsc.stop(stopAt);
      harmOsc.stop(stopAt);
      thump.stop(startTime + 0.03);
      return;
    }

    // Electric Piano (Warm Rhodes-style) — lifts ultra-low notes +1 octave for effortless clarity on small speakers
    const effectiveMidi = midi < 36 ? midi + 12 : midi;
    const freq = this.midiToFreq(effectiveMidi);

    const bodyOsc = ctx.createOscillator();
    bodyOsc.type = 'sine';
    bodyOsc.frequency.setValueAtTime(freq, startTime);

    const warmOsc = ctx.createOscillator();
    warmOsc.type = 'triangle';
    warmOsc.frequency.setValueAtTime(freq * 2, startTime);

    const tineOsc = ctx.createOscillator();
    tineOsc.type = 'sine';
    tineOsc.frequency.setValueAtTime(freq * 4, startTime);

    const warmGain = ctx.createGain();
    warmGain.gain.setValueAtTime(0.24, startTime);
    warmGain.gain.exponentialRampToValueAtTime(0.06, startTime + Math.min(0.45, safeDur));

    const tineGain = ctx.createGain();
    tineGain.gain.setValueAtTime(0.14, startTime);
    tineGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.14);

    const lpf = ctx.createBiquadFilter();
    lpf.type = 'lowpass';
    lpf.frequency.value = 2400;

    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, startTime);
    env.gain.linearRampToValueAtTime(0.68, startTime + 0.008);
    env.gain.exponentialRampToValueAtTime(0.38, startTime + Math.min(0.25, safeDur * 0.6));
    env.gain.setValueAtTime(0.32, gateEnd);
    env.gain.exponentialRampToValueAtTime(0.0008, gateEnd + release + 0.05);

    bodyOsc.connect(lpf);
    warmOsc.connect(warmGain);
    warmGain.connect(lpf);
    tineOsc.connect(tineGain);
    tineGain.connect(lpf);
    lpf.connect(env);
    env.connect(dest);

    [bodyOsc, warmOsc, tineOsc].forEach((n) => this.trackNode(n));

    const stopAt = gateEnd + release + 0.08;
    bodyOsc.start(startTime);
    warmOsc.start(startTime);
    tineOsc.start(startTime);

    bodyOsc.stop(stopAt);
    warmOsc.stop(stopAt);
    tineOsc.stop(stopAt);
  }

  public stop() {
    this.playbackToken += 1;
    this.scheduledTimers.forEach((id) => window.clearTimeout(id));
    this.scheduledTimers = [];
    this.activeNodes.forEach((node) => {
      try {
        node.stop();
        node.disconnect();
      } catch {
        // Ignore already stopped nodes
      }
    });
    this.activeNodes.clear();
  }

  public async playSingleNote(midi: number, instrument: EarInstrument, durationSec = 0.9): Promise<boolean> {
    this.stop();
    const token = this.playbackToken;
    const ctx = this.ensureContext();
    const start = ctx.currentTime + 0.03;
    this.scheduleNote(midi, start, durationSec, instrument);

    return new Promise((resolve) => {
      const id = window.setTimeout(() => {
        resolve(this.playbackToken === token);
      }, Math.round((durationSec + 0.14) * 1000));
      this.scheduledTimers.push(id);
    });
  }

  public async playMelody(
    sequence: number[],
    durations: number[] | undefined,
    speed: 0.75 | 1 | 1.25,
    instrument: EarInstrument,
    onNoteStart?: (index: number) => void
  ): Promise<boolean> {
    this.stop();
    if (sequence.length === 0) return true;

    const token = this.playbackToken;
    const ctx = this.ensureContext();
    const baseBpm = 94 * speed;
    const beatSec = 60 / baseBpm;

    let cursorSec = ctx.currentTime + 0.08;
    const startRef = ctx.currentTime;

    sequence.forEach((midi, idx) => {
      const rawBeats = durations && durations[idx] !== undefined ? durations[idx] : 1;
      // Clamp extreme note values so fast 16ths remain audible and long holds don't stall
      const clampedBeats = Math.max(0.32, Math.min(2.0, rawBeats));
      const slotSec = clampedBeats * beatSec;
      // Leave a slight breathing gap between repeated pitches so repeated notes articulate clearly
      const nextSame = idx < sequence.length - 1 && sequence[idx + 1] === midi;
      const noteDur = nextSame ? slotSec * 0.78 : slotSec * 0.94;

      this.scheduleNote(midi, cursorSec, noteDur, instrument);

      if (onNoteStart) {
        const delayMs = Math.max(0, Math.round((cursorSec - startRef) * 1000));
        const timerId = window.setTimeout(() => {
          if (this.playbackToken === token) {
            onNoteStart(idx);
          }
        }, delayMs);
        this.scheduledTimers.push(timerId);
      }

      cursorSec += slotSec;
    });

    const totalMs = Math.max(250, Math.round((cursorSec - startRef + 0.22) * 1000));
    return new Promise((resolve) => {
      const endId = window.setTimeout(() => {
        resolve(this.playbackToken === token);
      }, totalMs);
      this.scheduledTimers.push(endId);
    });
  }

  public playSuccessChord(rootMidi: number) {
    const ctx = this.ensureContext();
    const now = ctx.currentTime + 0.03;
    let base = rootMidi;
    while (base < 55) base += 12;
    while (base > 67) base -= 12;

    const chord = [base, base + 4, base + 7, base + 12];
    chord.forEach((m, i) => {
      this.scheduleNote(m, now + i * 0.055, 0.65, 'epiano');
    });
  }

  public dispose() {
    this.stop();
    if (this.ctx && this.ctx.state !== 'closed') {
      try {
        this.ctx.close();
      } catch {
        // Ignore close error
      }
    }
    this.ctx = null;
    this.masterGain = null;
    this.compressor = null;
  }
}
