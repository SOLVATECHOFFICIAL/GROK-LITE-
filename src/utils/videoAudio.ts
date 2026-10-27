/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CharacterType, MusicGenre } from '../types/video';
import { characterVoiceEngine } from './characterVoice';

class VideoAudioEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private currentGenre: MusicGenre | null = null;
  private scoreInterval: number | null = null;
  private masterGain: GainNode | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.85, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.ctx && this.masterGain) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : 0.85, this.ctx.currentTime);
    }
    if (muted) {
      this.stopMusic();
      this.stopSpeech();
    }
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public playSfx(
    type: 'cinematic-boom' | 'whoosh' | 'sub-drop' | 'shutter' | 'none'
  ) {
    if (this.isMuted || type === 'none') return;
    const ctx = this.getContext();
    if (!ctx || !this.masterGain) return;

    const now = ctx.currentTime;

    switch (type) {
      case 'cinematic-boom': {
        // Deep cinematic impact braam (sub-bass + resonant low-pass)
        const subOsc = ctx.createOscillator();
        const subGain = ctx.createGain();
        subOsc.type = 'sine';
        subOsc.frequency.setValueAtTime(85, now);
        subOsc.frequency.exponentialRampToValueAtTime(26, now + 1.4);
        subGain.gain.setValueAtTime(0.45, now);
        subGain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);
        subOsc.connect(subGain);
        subGain.connect(this.masterGain);
        subOsc.start(now);
        subOsc.stop(now + 1.85);

        // Mid-punch impact
        const midOsc = ctx.createOscillator();
        const midFilter = ctx.createBiquadFilter();
        const midGain = ctx.createGain();
        midOsc.type = 'triangle';
        midOsc.frequency.setValueAtTime(140, now);
        midOsc.frequency.exponentialRampToValueAtTime(45, now + 0.6);
        midFilter.type = 'lowpass';
        midFilter.frequency.setValueAtTime(350, now);
        midGain.gain.setValueAtTime(0.3, now);
        midGain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
        midOsc.connect(midFilter);
        midFilter.connect(midGain);
        midGain.connect(this.masterGain);
        midOsc.start(now);
        midOsc.stop(now + 0.95);
        break;
      }

      case 'sub-drop': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(75, now);
        osc.frequency.exponentialRampToValueAtTime(22, now + 1.6);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.7);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 1.75);
        break;
      }

      case 'whoosh': {
        const osc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(95, now);

        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(180, now);
        filter.frequency.exponentialRampToValueAtTime(1600, now + 0.22);
        filter.frequency.exponentialRampToValueAtTime(100, now + 0.55);

        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.58);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.6);
        break;
      }

      case 'shutter':
      default: {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(380, now);
        osc.frequency.exponentialRampToValueAtTime(70, now + 0.06);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.09);
        break;
      }
    }
  }

  /**
   * Generates a lush Hollywood cinematic orchestral score with brass/string pads and sub-bass
   * Replaces repetitive piano chime with sweeping cinematic textures.
   */
  public playMusic(genre: MusicGenre) {
    if (this.isMuted || genre === 'none') {
      this.stopMusic();
      return;
    }
    if (this.currentGenre === genre && this.scoreInterval !== null) {
      return;
    }

    this.stopMusic();
    this.currentGenre = genre;
    const ctx = this.getContext();
    if (!ctx || !this.masterGain) return;

    let step = 0;

    // Cinematic chord voicings (Dm(add9), Bbmaj7, Fmaj7/A, Csus4)
    const orchestralVoicings = [
      { bass: 73.42, pad: [146.83, 220.0, 293.66, 370.0] }, // D1 / D2 / A2 / D3 / F#3
      { bass: 58.27, pad: [116.54, 174.61, 233.08, 349.23] }, // Bb0 / Bb1 / F2 / Bb2 / F3
      { bass: 55.0, pad: [110.0, 164.81, 220.0, 329.63] }, // A0 / A1 / E2 / A2 / E3
      { bass: 65.41, pad: [130.81, 196.0, 261.63, 392.0] }, // C1 / C2 / G2 / C3 / G3
    ];

    const playCinematicLayer = () => {
      if (this.isMuted || !this.ctx || !this.masterGain) return;
      const now = this.ctx.currentTime;
      const chord = orchestralVoicings[step % orchestralVoicings.length];

      // 1. Cinematic Sub Bass Swell
      const sub = this.ctx.createOscillator();
      const subFilter = this.ctx.createBiquadFilter();
      const subGain = this.ctx.createGain();

      sub.type = 'triangle';
      sub.frequency.setValueAtTime(chord.bass, now);

      subFilter.type = 'lowpass';
      subFilter.frequency.setValueAtTime(140, now);

      subGain.gain.setValueAtTime(0.001, now);
      subGain.gain.linearRampToValueAtTime(0.12, now + 0.8);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 3.8);

      sub.connect(subFilter);
      subFilter.connect(subGain);
      subGain.connect(this.masterGain);

      sub.start(now);
      sub.stop(now + 3.9);

      // 2. Cinematic Brass / String Pad Layers
      chord.pad.forEach((freq, idx) => {
        if (!this.ctx || !this.masterGain) return;
        const osc = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();

        // Slight detune for analog cinematic warmth
        const detuneOffset = (idx % 2 === 0 ? 1 : -1) * 3;
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now);
        osc.detune.setValueAtTime(detuneOffset, now);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(450 + idx * 80, now);
        filter.Q.setValueAtTime(1.5, now);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.022, now + 1.2);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 3.8);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + 3.9);
      });

      // 3. Subtle Sub-Pulse Arpeggiation for tension
      const pulseOsc = this.ctx.createOscillator();
      const pulseGain = this.ctx.createGain();
      pulseOsc.type = 'sine';
      pulseOsc.frequency.setValueAtTime(chord.bass * 2, now);
      pulseGain.gain.setValueAtTime(0.001, now);
      pulseGain.gain.linearRampToValueAtTime(0.04, now + 0.1);
      pulseGain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

      pulseOsc.connect(pulseGain);
      pulseGain.connect(this.masterGain);
      pulseOsc.start(now);
      pulseOsc.stop(now + 1.3);

      step++;
    };

    playCinematicLayer();
    this.scoreInterval = window.setInterval(playCinematicLayer, 3600);
  }

  public stopMusic() {
    if (this.scoreInterval !== null) {
      clearInterval(this.scoreInterval);
      this.scoreInterval = null;
    }
    this.currentGenre = null;
  }

  public speakNarration(
    text: string,
    character: CharacterType = 'narrator',
    onEnd?: () => void
  ) {
    if (this.isMuted) {
      if (onEnd) onEnd();
      return;
    }
    characterVoiceEngine.speak(text, character, onEnd);
  }

  public stopSpeech() {
    characterVoiceEngine.cancel();
  }
}

export const videoAudio = new VideoAudioEngine();
