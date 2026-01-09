import { detectPitchYIN, calculateRMS } from './yin';
import { frequencyToNote, NoteInfo } from './noteUtils';

export interface AudioStats {
  pitch: NoteInfo | null;
  rms: number;
  timestamp: number;
  activeDeviceLabel?: string;
}

export class AudioEngine {
  private static failureBufferCache: AudioBuffer | null = null;
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

  private async loadFailureSound() {
    if (!this.audioContext || AudioEngine.failureBufferCache) return;
    
    try {
      const response = await fetch('failure.mp3');
      if (!response.ok) throw new Error('Sound file not found');
      const arrayBuffer = await response.arrayBuffer();
      // Use the instance audioContext to decode
      AudioEngine.failureBufferCache = await this.audioContext.decodeAudioData(arrayBuffer);
    } catch (err) {
      console.warn("AudioEngine: failure.mp3 could not be loaded.", err);
    }
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

      this.filter = this.audioContext.createBiquadFilter();
      this.filter.type = 'lowpass';
      this.filter.frequency.value = 350; 
      this.filter.Q.value = 0.8;

      this.analyzer = this.audioContext.createScriptProcessor(this.bufferSize, 1, 1);
      
      this.source.connect(this.filter);
      this.filter.connect(this.analyzer);
      this.analyzer.connect(this.audioContext.destination);

      const activeDeviceLabel = this.stream.getAudioTracks()[0]?.label;

      this.analyzer.onaudioprocess = (e) => {
        if (!this.audioContext || this.audioContext.state !== 'running') return;
        
        const inputData = e.inputBuffer.getChannelData(0);
        const rms = calculateRMS(inputData);
        const pitchFreq = detectPitchYIN(inputData, this.audioContext.sampleRate, 0.1);
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
    if (!this.audioContext || !AudioEngine.failureBufferCache || this.audioContext.state === 'closed') {
      return;
    }

    const source = this.audioContext.createBufferSource();
    source.buffer = AudioEngine.failureBufferCache;
    
    const gainNode = this.audioContext.createGain();
    gainNode.gain.setValueAtTime(0.5, this.audioContext.currentTime);
    
    source.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    source.start(0);
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
    // DO NOT clear AudioEngine.failureBufferCache here so it persists
  }
}