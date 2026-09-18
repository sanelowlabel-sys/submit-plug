/**
 * Playlist Plug Web Audio & Preview Synthesizer Engine
 * Provides fallback synth playback for music tracks and spotlight preview listeners
 */

class AudioEngine {
  private ctx: AudioContext | null = null;
  private currentAudio: HTMLAudioElement | null = null;
  private synthInterval: number | null = null;
  private isPlayingSynth = false;

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public playTrack(
    track: { title: string; genre: string; bpm?: number; previewUrl?: string },
    onTimeUpdate?: (current: number, duration: number) => void,
    onEnded?: () => void
  ) {
    this.stop();
    this.initContext();

    // Try HTMLAudioElement first if valid url provided
    if (track.previewUrl && track.previewUrl.startsWith('http') && !track.previewUrl.includes('placeholder')) {
      try {
        const audio = new Audio(track.previewUrl);
        audio.crossOrigin = 'anonymous';
        audio.volume = 0.8;
        this.currentAudio = audio;

        audio.ontimeupdate = () => {
          if (onTimeUpdate && audio.duration) {
            onTimeUpdate(audio.currentTime, Math.min(audio.duration, 30));
            if (audio.currentTime >= 30) {
              this.stop();
              if (onEnded) onEnded();
            }
          }
        };

        audio.onended = () => {
          this.stop();
          if (onEnded) onEnded();
        };

        audio.play().catch(() => {
          // If browser blocks audio load or network error, fallback to algorithmic synth
          this.playAlgorithmicSynth(track, onTimeUpdate, onEnded);
        });
        return;
      } catch {
        // Fallback
      }
    }

    this.playAlgorithmicSynth(track, onTimeUpdate, onEnded);
  }

  private playAlgorithmicSynth(
    track: { title: string; genre: string; bpm?: number },
    onTimeUpdate?: (current: number, duration: number) => void,
    onEnded?: () => void
  ) {
    this.initContext();
    if (!this.ctx) return;

    this.isPlayingSynth = true;
    let elapsed = 0;
    const duration = 30; // 30 sec preview standard
    const bpm = track.bpm || 124;
    const beatInterval = (60 / bpm) * 1000;

    // Harmonic scale frequencies
    const scales: Record<string, number[]> = {
      'Melodic Techno': [220, 261.63, 293.66, 329.63, 392.00, 440, 523.25],
      'Deep House': [196, 246.94, 293.66, 369.99, 440, 493.88],
      'Techno': [110, 130.81, 146.83, 164.81, 220],
      'Synthwave': [220, 277.18, 329.63, 440, 554.37, 659.25],
      'Indie Pop': [261.63, 329.63, 392.00, 523.25, 659.25],
      'Lo-Fi Chill': [174.61, 220, 261.63, 329.63, 392.00],
      'Afrobeats': [246.94, 293.66, 369.99, 440, 554.37]
    };

    const notes = scales[track.genre] || scales['Deep House'];
    let step = 0;

    this.synthInterval = window.setInterval(() => {
      if (!this.isPlayingSynth || !this.ctx) return;

      elapsed += (beatInterval / 2) / 1000;
      if (onTimeUpdate) {
        onTimeUpdate(Math.min(elapsed, duration), duration);
      }

      if (elapsed >= duration) {
        this.stop();
        if (onEnded) onEnded();
        return;
      }

      // Trigger beat sound
      try {
        const now = this.ctx.currentTime;
        
        // Kick Drum pulse on every 2 sub-beats (quarter note)
        if (step % 2 === 0) {
          const kickOsc = this.ctx.createOscillator();
          const kickGain = this.ctx.createGain();
          kickOsc.frequency.setValueAtTime(130, now);
          kickOsc.frequency.exponentialRampToValueAtTime(32, now + 0.09);
          kickGain.gain.setValueAtTime(0.35, now);
          kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

          kickOsc.connect(kickGain);
          kickGain.connect(this.ctx.destination);
          kickOsc.start(now);
          kickOsc.stop(now + 0.14);
        }

        // Bass/Melody note
        const noteIndex = (step * 3 + (step % 4)) % notes.length;
        const freq = notes[noteIndex];
        const melOsc = this.ctx.createOscillator();
        const melGain = this.ctx.createGain();

        melOsc.type = track.genre.includes('Synth') ? 'sawtooth' : 'triangle';
        melOsc.frequency.setValueAtTime(freq, now);

        melGain.gain.setValueAtTime(0.12, now);
        melGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);

        melOsc.connect(melGain);
        melGain.connect(this.ctx.destination);
        melOsc.start(now);
        melOsc.stop(now + 0.28);

        // Hi-hat sound on offbeats
        if (step % 2 === 1) {
          const hatOsc = this.ctx.createOscillator();
          const hatGain = this.ctx.createGain();
          hatOsc.type = 'square';
          hatOsc.frequency.setValueAtTime(8000, now);
          hatGain.gain.setValueAtTime(0.04, now);
          hatGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);

          hatOsc.connect(hatGain);
          hatGain.connect(this.ctx.destination);
          hatOsc.start(now);
          hatOsc.stop(now + 0.06);
        }
      } catch {
        // Safe catch
      }

      step++;
    }, beatInterval / 2);
  }

  public stop() {
    this.isPlayingSynth = false;
    if (this.synthInterval) {
      clearInterval(this.synthInterval);
      this.synthInterval = null;
    }
    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
      } catch {
        // Safe catch
      }
      this.currentAudio = null;
    }
  }

  public setVolume(volume: number) {
    if (this.currentAudio) {
      this.currentAudio.volume = Math.max(0, Math.min(1, volume));
    }
  }

  public seek(time: number) {
    if (this.currentAudio && !isNaN(this.currentAudio.duration)) {
      this.currentAudio.currentTime = Math.max(0, Math.min(this.currentAudio.duration, time));
    }
  }
}

export const globalAudioEngine = new AudioEngine();
