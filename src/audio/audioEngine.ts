
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

  private bufferSize = 4096;

  constructor(onProcess: (stats: AudioStats) => void) {
    this.onProcess = onProcess;
  }

  async start(deviceId?: string) {
    if (this.audioContext) await this.stop();

    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    const constraints: MediaStreamConstraints = {
      audio: deviceId && deviceId !== 'default' ? { deviceId: { exact: deviceId } } : true,
    };

    try {
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.source = this.audioContext.createMediaStreamSource(this.stream);

      // Low pass filter to help isolate fundamental frequencies of the bass
      this.filter = this.audioContext.createBiquadFilter();
      this.filter.type = 'lowpass';
      this.filter.frequency.value = 800;

      this.analyzer = this.audioContext.createScriptProcessor(this.bufferSize, 1, 1);
      
      this.source.connect(this.filter);
      this.filter.connect(this.analyzer);
      this.analyzer.connect(this.audioContext.destination);

      const activeDeviceLabel = this.stream.getAudioTracks()[0]?.label;

      this.analyzer.onaudioprocess = (e) => {
        if (!this.audioContext) return;
        const inputData = e.inputBuffer.getChannelData(0);
        const rms = calculateRMS(inputData);
        const pitchFreq = detectPitchYIN(inputData, this.audioContext.sampleRate);
        
        const pitch = pitchFreq ? frequencyToNote(pitchFreq) : null;
        
        this.onProcess({
          pitch,
          rms,
          timestamp: Date.now(),
          activeDeviceLabel
        });
      };
    } catch (err) {
      console.error("Failed to start audio engine:", err);
      throw err;
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
    }
    if (this.audioContext) {
      await this.audioContext.close();
    }
    this.audioContext = null;
  }
}
