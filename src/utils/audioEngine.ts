/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BgMusicMood } from '../types/animation';

class StudioAudioEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private currentMusicMood: BgMusicMood | null = null;
  private musicInterval: number | null = null;
  private activeVoices: OscillatorNode[] = [];

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted) {
      this.stopMusic();
      this.stopNarration();
    }
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public playSfx(
    type: 'sparkle' | 'jump' | 'pop' | 'fanfare' | 'swoosh' | 'click' | 'step'
  ) {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    switch (type) {
      case 'sparkle': {
        const freqs = [587.33, 880, 1174.66, 1760, 2349.32];
        freqs.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.05);

          gain.gain.setValueAtTime(0, now + idx * 0.05);
          gain.gain.linearRampToValueAtTime(0.12, now + idx * 0.05 + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.35);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.05);
          osc.stop(now + idx * 0.05 + 0.4);
        });
        break;
      }

      case 'jump': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(580, now + 0.18);

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.22);
        break;
      }

      case 'pop': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(120, now + 0.08);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.09);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.1);
        break;
      }

      case 'fanfare': {
        const notes = [440, 554.37, 659.25, 880];
        notes.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(freq, now + i * 0.12);

          const duration = i === notes.length - 1 ? 0.6 : 0.18;
          gain.gain.setValueAtTime(0.1, now + i * 0.12);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + duration);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + i * 0.12);
          osc.stop(now + i * 0.12 + duration + 0.05);
        });
        break;
      }

      case 'swoosh': {
        // Filtered noise swoosh
        const osc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, now);

        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(300, now);
        filter.frequency.exponentialRampToValueAtTime(1800, now + 0.12);
        filter.frequency.exponentialRampToValueAtTime(200, now + 0.28);
        filter.Q.value = 3;

        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.32);
        break;
      }

      case 'step': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(140 + Math.random() * 30, now);
        osc.frequency.exponentialRampToValueAtTime(60, now + 0.06);

        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.08);
        break;
      }

      case 'click':
      default: {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.04);
        break;
      }
    }
  }

  public playMusic(mood: BgMusicMood) {
    if (this.isMuted || mood === 'none') {
      this.stopMusic();
      return;
    }
    if (this.currentMusicMood === mood && this.musicInterval !== null) {
      return;
    }

    this.stopMusic();
    this.currentMusicMood = mood;
    const ctx = this.getContext();
    if (!ctx) return;

    let step = 0;
    // Scale progressions based on mood
    const scales: Record<string, number[][]> = {
      fable: [
        [261.63, 329.63, 392.0, 523.25], // C major
        [220.0, 261.63, 329.63, 440.0], // A minor
        [174.61, 220.0, 261.63, 349.23], // F major
        [196.0, 246.94, 293.66, 392.0], // G major
      ],
      adventure: [
        [220.0, 277.18, 329.63, 440.0], // A maj
        [164.81, 207.65, 246.94, 329.63], // E maj
        [185.0, 220.0, 277.18, 370.0], // F# min
        [146.83, 185.0, 220.0, 293.66], // D maj
      ],
      mystery: [
        [220.0, 261.63, 329.63, 440.0], // Am
        [246.94, 293.66, 370.0, 493.88], // Bm
        [261.63, 329.63, 392.0, 523.25], // C
        [207.65, 261.63, 311.13, 415.3], // G#dim
      ],
      lullaby: [
        [329.63, 392.0, 493.88, 587.33], // Em
        [293.66, 369.99, 440.0, 587.33], // D
        [261.63, 329.63, 392.0, 523.25], // C
        [246.94, 329.63, 392.0, 493.88], // Bm
      ],
    };

    const currentScale = scales[mood] || scales.fable;

    const playChordStep = () => {
      if (this.isMuted || !this.ctx) return;
      const now = this.ctx.currentTime;
      const chordIndex = Math.floor(step / 4) % currentScale.length;
      const chord = currentScale[chordIndex];
      const note = chord[step % chord.length];

      // Bass pad
      if (step % 4 === 0) {
        const bassOsc = this.ctx.createOscillator();
        const bassGain = this.ctx.createGain();
        bassOsc.type = 'triangle';
        bassOsc.frequency.setValueAtTime(chord[0] / 2, now);
        bassGain.gain.setValueAtTime(0.06, now);
        bassGain.gain.exponentialRampToValueAtTime(0.01, now + 1.8);
        bassOsc.connect(bassGain);
        bassGain.connect(this.ctx.destination);
        bassOsc.start(now);
        bassOsc.stop(now + 1.9);
      }

      // Arpeggio note
      const arpOsc = this.ctx.createOscillator();
      const arpGain = this.ctx.createGain();
      arpOsc.type = mood === 'adventure' ? 'sawtooth' : 'sine';
      arpOsc.frequency.setValueAtTime(note, now);

      arpGain.gain.setValueAtTime(0.04, now);
      arpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      arpOsc.connect(arpGain);
      arpGain.connect(this.ctx.destination);
      arpOsc.start(now);
      arpOsc.stop(now + 0.48);

      step++;
    };

    playChordStep();
    this.musicInterval = window.setInterval(playChordStep, 450);
  }

  public stopMusic() {
    if (this.musicInterval !== null) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
    this.currentMusicMood = null;
    this.activeVoices.forEach((v) => {
      try {
        v.stop();
      } catch {
        // voice already stopped
      }
    });
    this.activeVoices = [];
  }

  public speakNarration(text: string, onEnd?: () => void) {
    if (this.isMuted || typeof window === 'undefined') {
      if (onEnd) onEnd();
      return;
    }
    if (!('speechSynthesis' in window)) {
      if (onEnd) onEnd();
      return;
    }

    window.speechSynthesis.cancel();
    if (!text || text.trim() === '') {
      if (onEnd) onEnd();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.05;

    // Pick an expressive or friendly voice if available
    const voices = window.speechSynthesis.getVoices();
    const friendlyVoice = voices.find(
      (v) =>
        v.lang.startsWith('en') &&
        (v.name.includes('Natural') ||
          v.name.includes('Google') ||
          v.name.includes('Samantha') ||
          v.name.includes('Daniel'))
    );
    if (friendlyVoice) {
      utterance.voice = friendlyVoice;
    }

    utterance.onend = () => {
      if (onEnd) onEnd();
    };
    utterance.onerror = () => {
      if (onEnd) onEnd();
    };

    window.speechSynthesis.speak(utterance);
  }

  public stopNarration() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }
}

export const studioAudio = new StudioAudioEngine();
