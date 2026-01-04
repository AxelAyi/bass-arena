import { detectPitchYIN, calculateRMS } from './yin';
import { frequencyToNote, NoteInfo } from './noteUtils';

export interface AudioStats {
  pitch: NoteInfo | null;
  rms: number;
  timestamp: number;
  activeDeviceLabel?: string;
}

export class AudioEngine {
  private audioContext: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private analyzer: ScriptProcessorNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private onProcess: (stats: AudioStats) => void;

  // Reduced from 4096 to 2048 to cut latency in half (~46ms @ 44.1kHz)
  // 2048 is still enough for low bass frequencies down to ~22Hz.
  private bufferSize = 2048; 

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
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      if (!this.audioContext) {
        throw new Error("AudioContext creation failed.");
      }

      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      this.source = this.audioContext.createMediaStreamSource(this.stream);

      // Tightened lowpass to focus on bass fundamentals
      this.filter = this.audioContext.createBiquadFilter();
      this.filter.type = 'lowpass';
      this.filter.frequency.value = 600; 
      this.filter.Q.value = 1;

      this.analyzer = this.audioContext.createScriptProcessor(this.bufferSize, 1, 1);
      
      this.source.connect(this.filter);
      this.filter.connect(this.analyzer);
      this.analyzer.connect(this.audioContext.destination);

      const activeDeviceLabel = this.stream.getAudioTracks()[0]?.label;

      this.analyzer.onaudioprocess = (e) => {
        if (!this.audioContext || this.audioContext.state !== 'running') return;
        
        const inputData = e.inputBuffer.getChannelData(0);
        const rms = calculateRMS(inputData);
        
        // Use a slightly more aggressive threshold for faster candidate rejection
        const pitchFreq = detectPitchYIN(inputData, this.audioContext.sampleRate, 0.12);
        const pitch = pitchFreq ? frequencyToNote(pitchFreq) : null;
        
        this.onProcess({
          pitch,
          rms,
          timestamp: Date.now(),
          activeDeviceLabel
        });
      };

      return this.audioContext;
    } catch (err: any) {
      console.error("AudioEngine Start Error:", err);
      if (deviceId && err.name === 'OverconstrainedError') {
          return this.start();
      }
      await this.stop();
      throw new Error(err.message || "Could not access microphone.");
    }
  }

  playFailureSound() {
    if (!this.audioContext || this.audioContext.state === 'closed') return;

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(110, this.audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, this.audioContext.currentTime + 0.4);

    gain.gain.setValueAtTime(0.08, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.4);

    osc.connect(gain);
    gain.connect(this.audioContext.destination);

    osc.start();
    osc.stop(this.audioContext.currentTime + 0.4);
  }

  async stop() {
    if (this.analyzer) {
      this.analyzer.disconnect();
      this.analyzer.onaudioprocess = null;
    }
    if (this.filter) this.filter.disconnect();
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