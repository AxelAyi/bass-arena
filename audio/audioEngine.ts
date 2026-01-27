import { detectPitchYIN, calculateRMS } from './yin';
import { frequencyToNote, NoteInfo } from './noteUtils';

export interface AudioStats {
  pitch: NoteInfo | null;
  rms: number;
  timestamp: number;
  activeDeviceLabel?: string;
  isOnset?: boolean;
}

export class AudioEngine {
  private static failureBufferCache: AudioBuffer | null = null;
  private audioContext: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private analyzer: ScriptProcessorNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private onProcess: (stats: AudioStats) => void;

  private bufferSize = 4096; 
  private lastRMS = 0;

  constructor(onProcess: (stats: AudioStats) => void) {
    this.onProcess = onProcess;
  }

  async start(deviceId?: string): Promise<AudioContext | null> {
    await this.stop();

    const constraints: MediaStreamConstraints = {
      audio: {
        deviceId: deviceId && deviceId !== 'default' && deviceId !== '' ? { exact: deviceId } : undefined,
        autoGainControl: false,
        noiseSuppression: false,
        echoCancellation: false
      }
    };

    try {
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 44100 });
      
      if (!this.audioContext) {
        throw new Error("AudioContext creation failed.");
      }

      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      // Input chain
      this.source = this.audioContext.createMediaStreamSource(this.stream);

      this.filter = this.audioContext.createBiquadFilter();
      this.filter.type = 'lowpass';
      this.filter.frequency.value = 350; 
      this.filter.Q.value = 0.8;

      this.analyzer = this.audioContext.createScriptProcessor(this.bufferSize, 1, 1);
      
      this.source.connect(this.filter);
      this.filter.connect(this.analyzer);
      this.analyzer.connect(this.audioContext.destination);

      // Output chain for synthesis
      this.compressor = this.audioContext.createDynamicsCompressor();
      this.compressor.threshold.setValueAtTime(-24, this.audioContext.currentTime);
      this.compressor.knee.setValueAtTime(30, this.audioContext.currentTime);
      this.compressor.ratio.setValueAtTime(8, this.audioContext.currentTime);
      this.compressor.attack.setValueAtTime(0.01, this.audioContext.currentTime);
      this.compressor.release.setValueAtTime(0.25, this.audioContext.currentTime);
      this.compressor.connect(this.audioContext.destination);

      const activeDeviceLabel = this.stream.getAudioTracks()[0]?.label;

      this.analyzer.onaudioprocess = (e) => {
        if (!this.audioContext || this.audioContext.state !== 'running') return;
        
        const inputData = e.inputBuffer.getChannelData(0);
        const rms = calculateRMS(inputData);
        
        const isOnset = rms > this.lastRMS * 1.5 && rms > 0.005;
        this.lastRMS = rms;

        const pitchFreq = detectPitchYIN(inputData, this.audioContext.sampleRate, 0.1);
        const pitch = pitchFreq ? frequencyToNote(pitchFreq) : null;
        
        this.onProcess({
          pitch,
          rms,
          timestamp: Date.now(),
          activeDeviceLabel,
          isOnset
        });
      };

      return this.audioContext;
    } catch (err: any) {
      console.error("AudioEngine Start Error:", err);
      await this.stop();
      throw new Error(err.message || "Could not access microphone.");
    }
  }

  /**
   * Refined synth generating a 'Classic Electric Bass' timbre.
   * Mixes fundamental weight with vintage string growl and plucky dynamics.
   */
  playBassNote(midi: number, time: number = 0) {
    if (!this.audioContext || !this.compressor) return;
    const ctx = this.audioContext;
    const startTime = time || ctx.currentTime;
    const freq = 440 * Math.pow(2, (midi - 69) / 12);

    // 1. Pure Fundamental (Sine) - Provides the solid "thump"
    const fundamental = ctx.createOscillator();
    fundamental.type = 'sine';
    fundamental.frequency.setValueAtTime(freq, startTime);

    // 2. Harmonic Growl (Filtered Sawtooth) - Mimics the string vibration texture
    const harmonics = ctx.createOscillator();
    harmonics.type = 'sawtooth';
    harmonics.frequency.setValueAtTime(freq, startTime);

    // 3. Vintage Warmth (Triangle) - Softens the sound and adds body
    const body = ctx.createOscillator();
    body.type = 'triangle';
    body.frequency.setValueAtTime(freq, startTime);

    // Filter Chain
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    // Dynamic Filter Envelope: Starts bright (pluck) and closes fast (string damping)
    filter.frequency.setValueAtTime(1000, startTime);
    filter.frequency.exponentialRampToValueAtTime(120, startTime + 0.6);
    filter.Q.setValueAtTime(2, startTime);
    filter.Q.linearRampToValueAtTime(1, startTime + 0.4);

    // Gain Nodes for mixing
    const masterGain = ctx.createGain();
    const harmGain = ctx.createGain();
    
    harmGain.gain.setValueAtTime(0.12, startTime); // Subtle growl
    harmGain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.8);

    // Amplitude Envelope
    masterGain.gain.setValueAtTime(0, startTime);
    masterGain.gain.linearRampToValueAtTime(0.7, startTime + 0.02); // Plucky attack
    masterGain.gain.exponentialRampToValueAtTime(0.001, startTime + 2.5); // Natural ring-out

    // Connections
    fundamental.connect(filter);
    body.connect(filter);
    
    harmonics.connect(harmGain);
    harmGain.connect(filter);
    
    filter.connect(masterGain);
    masterGain.connect(this.compressor);

    // Start/Stop
    fundamental.start(startTime);
    body.start(startTime);
    harmonics.start(startTime);

    fundamental.stop(startTime + 3);
    body.stop(startTime + 3);
    harmonics.stop(startTime + 1); // Kill harmonics early for that "vintage flatwounds" feel
  }

  async playSequence(sequence: number[], bpm: number = 80): Promise<void> {
    if (!this.audioContext) return;
    const stepS = 60 / bpm;
    sequence.forEach((midi, i) => {
      this.playBassNote(midi, this.audioContext!.currentTime + (i * stepS));
    });
    return new Promise(resolve => setTimeout(resolve, sequence.length * stepS * 1000 + 600));
  }

  async stop() {
    if (this.analyzer) {
      this.analyzer.disconnect();
      this.analyzer.onaudioprocess = null;
    }
    if (this.filter) this.filter.disconnect();
    if (this.compressor) this.compressor.disconnect();
    if (this.source) this.source.disconnect();
    
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    if (this.audioContext) {
      if (this.audioContext.state !== 'closed') {
        try {
          await this.audioContext.close();
        } catch (e) {}
      }
      this.audioContext = null;
    }
  }
}