// Cinematic Audio Engine using Web Audio API and Speech Synthesis

class CinematicAudioEngine {
  private ctx: AudioContext | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private dialogueGain: GainNode | null = null;
  private activeMusicOscillators: OscillatorNode[] = [];
  private isMuted: boolean = false;
  private isPlayingMusic: boolean = false;

  constructor() {
    // AudioContext will be initialized on first user gesture
  }

  private initContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtxClass();

      // Master Gains
      this.musicGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();
      this.dialogueGain = this.ctx.createGain();

      this.musicGain.gain.setValueAtTime(0.4, this.ctx.currentTime);
      this.sfxGain.gain.setValueAtTime(0.5, this.ctx.currentTime);
      this.dialogueGain.gain.setValueAtTime(0.9, this.ctx.currentTime);

      this.musicGain.connect(this.ctx.destination);
      this.sfxGain.connect(this.ctx.destination);
      this.dialogueGain.connect(this.ctx.destination);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    return this.ctx;
  }

  public setVolumes(dialogue: number, sfx: number, music: number) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    if (this.dialogueGain) this.dialogueGain.gain.setTargetAtTime(dialogue, now, 0.05);
    if (this.sfxGain) this.sfxGain.gain.setTargetAtTime(sfx, now, 0.05);
    if (this.musicGain) this.musicGain.gain.setTargetAtTime(music, now, 0.05);
  }

  public stopAll() {
    this.stopMusic();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  public stopMusic() {
    this.activeMusicOscillators.forEach((osc) => {
      try {
        osc.stop();
        osc.disconnect();
      } catch {
        // Ignore already stopped
      }
    });
    this.activeMusicOscillators = [];
    this.isPlayingMusic = false;
  }

  // Play cinematic music chord progression based on intensity
  public playSceneMusic(intensity: number = 6, mood: string = 'Cinematic theme') {
    const ctx = this.initContext();
    this.stopMusic();

    if (this.isMuted) return;

    this.isPlayingMusic = true;
    const now = ctx.currentTime;

    // Root chord frequencies (Cinematic D Minor / A Minor moods)
    let rootFreq = 73.42; // D2 deep cinema drone
    if (mood.toLowerCase().includes('hope') || mood.toLowerCase().includes('dawn')) {
      rootFreq = 65.41; // C2 Major warmth
    } else if (mood.toLowerCase().includes('action') || mood.toLowerCase().includes('chase')) {
      rootFreq = 82.41; // E2 driving tension
    }

    const chordOffsets = [1, 1.2, 1.5, 2.0]; // Minor triad with octave

    chordOffsets.forEach((ratio, i) => {
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = i === 0 ? 'sawtooth' : 'triangle';
      osc.frequency.setValueAtTime(rootFreq * ratio, now);

      // Filter modulation for slow organic cinematic breathing
      filter.type = 'lowpass';
      const cutoff = 250 + intensity * 70;
      filter.frequency.setValueAtTime(cutoff, now);

      // Subtle LFO modulation
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.setValueAtTime(0.2 + i * 0.05, now);
      lfoGain.gain.setValueAtTime(80, now);
      lfo.connect(filter.frequency);
      lfo.start(now);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.12 / chordOffsets.length, now + 1.8);

      osc.connect(filter);
      filter.connect(gain);
      if (this.musicGain) {
        gain.connect(this.musicGain);
      }

      osc.start(now);
      this.activeMusicOscillators.push(osc);
      this.activeMusicOscillators.push(lfo);
    });

    // If high intensity, add subtle driving pulse
    if (intensity >= 7) {
      this.schedulePulse(now, rootFreq);
    }
  }

  private schedulePulse(startTime: number, rootFreq: number) {
    if (!this.ctx) return;
    const pulseOsc = this.ctx.createOscillator();
    const pulseGain = this.ctx.createGain();
    pulseOsc.type = 'sine';
    pulseOsc.frequency.setValueAtTime(rootFreq * 0.5, startTime);

    pulseGain.gain.setValueAtTime(0, startTime);
    for (let t = 0; t < 20; t += 0.5) {
      pulseGain.gain.setValueAtTime(0.18, startTime + t);
      pulseGain.gain.exponentialRampToValueAtTime(0.001, startTime + t + 0.35);
    }

    pulseOsc.connect(pulseGain);
    if (this.musicGain) pulseGain.connect(this.musicGain);
    pulseOsc.start(startTime);
    this.activeMusicOscillators.push(pulseOsc);
  }

  // Play Foley sound effects
  public playFoley(type: string) {
    const ctx = this.initContext();
    if (this.isMuted) return;

    const now = ctx.currentTime;
    const lower = type.toLowerCase();

    if (lower.includes('rain') || lower.includes('water')) {
      this.createNoiseBurst(ctx, now, 1.2, 800, 'bandpass', 0.25);
    } else if (lower.includes('footstep')) {
      this.createImpact(ctx, now, 90, 0.15, 0.3);
    } else if (lower.includes('door') || lower.includes('metal')) {
      this.createResonantClank(ctx, now, 320, 0.4);
    } else if (lower.includes('siren') || lower.includes('wind')) {
      this.createNoiseBurst(ctx, now, 2.0, 450, 'lowpass', 0.2);
    } else if (lower.includes('engine') || lower.includes('car')) {
      this.createEngineHum(ctx, now, 60, 1.5);
    } else {
      // General dramatic impact / whoosh
      this.createImpact(ctx, now, 65, 0.6, 0.4);
    }
  }

  private createImpact(ctx: AudioContext, time: number, startFreq: number, duration: number, vol: number) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.setValueAtTime(startFreq, time);
    osc.frequency.exponentialRampToValueAtTime(25, time + duration);

    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(gain);
    if (this.sfxGain) gain.connect(this.sfxGain);

    osc.start(time);
    osc.stop(time + duration);
  }

  private createResonantClank(ctx: AudioContext, time: number, freq: number, duration: number) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, time);

    gain.gain.setValueAtTime(0.3, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(gain);
    if (this.sfxGain) gain.connect(this.sfxGain);
    osc.start(time);
    osc.stop(time + duration);
  }

  private createEngineHum(ctx: AudioContext, time: number, freq: number, duration: number) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(140, time);

    gain.gain.setValueAtTime(0.2, time);
    gain.gain.linearRampToValueAtTime(0.001, time + duration);

    osc.connect(filter);
    filter.connect(gain);
    if (this.sfxGain) gain.connect(this.sfxGain);

    osc.start(time);
    osc.stop(time + duration);
  }

  private createNoiseBurst(ctx: AudioContext, time: number, duration: number, freq: number, type: BiquadFilterType, vol: number) {
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.setValueAtTime(freq, time);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vol, time);
    gain.gain.linearRampToValueAtTime(0.001, time + duration);

    whiteNoise.connect(filter);
    filter.connect(gain);
    if (this.sfxGain) gain.connect(this.sfxGain);

    whiteNoise.start(time);
    whiteNoise.stop(time + duration);
  }

  // Speak character line using Web Speech Synthesis
  public speakLine(
    text: string,
    speaker: string,
    voiceStyle?: string,
    onEnd?: () => void
  ): Promise<void> {
    return new Promise((resolve) => {
      if (!('speechSynthesis' in window) || this.isMuted) {
        if (onEnd) onEnd();
        resolve();
        return;
      }

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);

      const voices = window.speechSynthesis.getVoices();
      // Pick matching voice
      const lowerSpeaker = speaker.toLowerCase();
      const isFemale = lowerSpeaker.includes('amara') || lowerSpeaker.includes('elena') || lowerSpeaker.includes('female') || lowerSpeaker.includes('woman') || lowerSpeaker.includes('sarah');

      let selectedVoice = voices.find((v) => (isFemale ? v.name.includes('Female') || v.name.includes('Zira') || v.name.includes('Samantha') : v.name.includes('Male') || v.name.includes('David') || v.name.includes('Daniel')));

      if (!selectedVoice && voices.length > 0) {
        selectedVoice = voices[0];
      }

      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }

      // Voice pitch and cadence
      if (isFemale) {
        utterance.pitch = 1.15;
        utterance.rate = 1.0;
      } else if (lowerSpeaker.includes('narrator')) {
        utterance.pitch = 0.85;
        utterance.rate = 0.95;
      } else {
        utterance.pitch = 0.95;
        utterance.rate = 1.0;
      }

      // Slightly duck background music during line
      if (this.musicGain && this.ctx) {
        const now = this.ctx.currentTime;
        this.musicGain.gain.setValueAtTime(0.18, now);
      }

      utterance.onend = () => {
        // Restore music volume
        if (this.musicGain && this.ctx) {
          const now = this.ctx.currentTime;
          this.musicGain.gain.setTargetAtTime(0.4, now, 0.4);
        }
        if (onEnd) onEnd();
        resolve();
      };

      utterance.onerror = () => {
        if (onEnd) onEnd();
        resolve();
      };

      window.speechSynthesis.speak(utterance);
    });
  }
}

export const audioEngine = new CinematicAudioEngine();
