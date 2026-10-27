/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type CharacterType =
  | 'ghoul'
  | 'monster'
  | 'female'
  | 'male'
  | 'robot'
  | 'narrator';

export interface VoiceProfile {
  characterType: CharacterType;
  label: string;
  pitch: number;
  rate: number;
  volume: number;
  description: string;
}

export const CHARACTER_PROFILES: Record<CharacterType, VoiceProfile> = {
  ghoul: {
    characterType: 'ghoul',
    label: 'Ghoul / Shadow Wraith',
    pitch: 0.52,
    rate: 0.82,
    volume: 1.0,
    description: 'Raspy, guttural, low-pitch whisper from the underworld',
  },
  monster: {
    characterType: 'monster',
    label: 'Beast / Monster',
    pitch: 0.42,
    rate: 0.78,
    volume: 1.0,
    description: 'Deep subterranean tremor and beastly vocal resonance',
  },
  female: {
    characterType: 'female',
    label: 'Female Protagonist / Warrior',
    pitch: 1.25,
    rate: 0.98,
    volume: 1.0,
    description: 'Crisp, resonant, assertive cinematic female voice',
  },
  male: {
    characterType: 'male',
    label: 'Male Warrior / Hero',
    pitch: 0.82,
    rate: 0.92,
    volume: 1.0,
    description: 'Deep heroic baritone with cinematic gravitas',
  },
  robot: {
    characterType: 'robot',
    label: 'Cyborg / Android AI',
    pitch: 1.05,
    rate: 1.02,
    volume: 1.0,
    description: 'Synthesized cybernetic vocal modulation',
  },
  narrator: {
    characterType: 'narrator',
    label: 'Epic Trailer Narrator',
    pitch: 0.72,
    rate: 0.88,
    volume: 1.0,
    description: 'Classic Hans Zimmer / blockbuster movie trailer narration',
  },
};

/**
 * Detects the character type from text prompt, dialogue, or character notes.
 */
export function detectCharacterType(text: string): CharacterType {
  const lower = text.toLowerCase();

  if (
    lower.includes('ghoul') ||
    lower.includes('zombie') ||
    lower.includes('undead') ||
    lower.includes('wraith') ||
    lower.includes('specter') ||
    lower.includes('ghost') ||
    lower.includes('vampire')
  ) {
    return 'ghoul';
  }

  if (
    lower.includes('monster') ||
    lower.includes('beast') ||
    lower.includes('demon') ||
    lower.includes('creature') ||
    lower.includes('ogre') ||
    lower.includes('dragon') ||
    lower.includes('titan') ||
    lower.includes('alien')
  ) {
    return 'monster';
  }

  if (
    lower.includes('female') ||
    lower.includes('woman') ||
    lower.includes('girl') ||
    lower.includes('heroine') ||
    lower.includes('warrior queen') ||
    lower.includes('she ') ||
    lower.includes('her ') ||
    lower.includes('valkyrie') ||
    lower.includes('priestess')
  ) {
    return 'female';
  }

  if (
    lower.includes('robot') ||
    lower.includes('cyborg') ||
    lower.includes('android') ||
    lower.includes('mech') ||
    lower.includes('synth') ||
    lower.includes('ai core')
  ) {
    return 'robot';
  }

  if (
    lower.includes('male') ||
    lower.includes('man') ||
    lower.includes('warrior') ||
    lower.includes('knight') ||
    lower.includes('he ') ||
    lower.includes('his ') ||
    lower.includes('soldier') ||
    lower.includes('commander')
  ) {
    return 'male';
  }

  return 'narrator';
}

class CharacterVoiceEngine {
  private audioCtx: AudioContext | null = null;
  private cachedVoices: SpeechSynthesisVoice[] = [];
  private isSpeakingState: boolean = false;
  private listeners: Set<(speaking: boolean) => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.populateVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        this.populateVoices();
      };
    }
  }

  public subscribe(cb: (speaking: boolean) => void): () => void {
    this.listeners.add(cb);
    cb(this.isSpeakingState);
    return () => {
      this.listeners.delete(cb);
    };
  }

  public getIsSpeaking(): boolean {
    return this.isSpeakingState;
  }

  private setSpeaking(val: boolean) {
    this.isSpeakingState = val;
    this.listeners.forEach((cb) => {
      try {
        cb(val);
      } catch {
        // ignore subscriber errors
      }
    });
  }

  private populateVoices(): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      this.cachedVoices = window.speechSynthesis.getVoices();
    } catch {
      this.cachedVoices = [];
    }
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (AudioCtx) {
        this.audioCtx = new AudioCtx();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  private pickVoice(character: CharacterType): SpeechSynthesisVoice | null {
    if (this.cachedVoices.length === 0) {
      this.populateVoices();
    }
    if (this.cachedVoices.length === 0) return null;

    const englishVoices = this.cachedVoices.filter(
      (v) => v.lang.startsWith('en') || v.lang.startsWith('en-US')
    );
    const pool = englishVoices.length > 0 ? englishVoices : this.cachedVoices;

    if (character === 'female') {
      const femaleVoice = pool.find(
        (v) =>
          v.name.toLowerCase().includes('female') ||
          v.name.toLowerCase().includes('samantha') ||
          v.name.toLowerCase().includes('victoria') ||
          v.name.toLowerCase().includes('zira') ||
          v.name.toLowerCase().includes('karen') ||
          v.name.toLowerCase().includes('moira')
      );
      if (femaleVoice) return femaleVoice;
    }

    if (character === 'male' || character === 'ghoul' || character === 'monster') {
      const maleVoice = pool.find(
        (v) =>
          v.name.toLowerCase().includes('male') ||
          v.name.toLowerCase().includes('daniel') ||
          v.name.toLowerCase().includes('david') ||
          v.name.toLowerCase().includes('george') ||
          v.name.toLowerCase().includes('alex') ||
          v.name.toLowerCase().includes('fred')
      );
      if (maleVoice) return maleVoice;
    }

    return pool[0] || null;
  }

  public speak(
    text: string,
    character: CharacterType = 'narrator',
    onEnd?: () => void
  ): void {
    if (!text || text.trim() === '') {
      if (onEnd) onEnd();
      return;
    }

    this.setSpeaking(true);
    const profile = CHARACTER_PROFILES[character] || CHARACTER_PROFILES.narrator;

    let ended = false;
    const finish = () => {
      if (!ended) {
        ended = true;
        this.setSpeaking(false);
        if (onEnd) onEnd();
      }
    };

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.pitch = profile.pitch;
        utterance.rate = profile.rate;
        utterance.volume = profile.volume;

        const voice = this.pickVoice(character);
        if (voice) {
          utterance.voice = voice;
        }

        utterance.onend = finish;
        utterance.onerror = (e) => {
          console.warn('SpeechSynthesis error, using audio vocalization fallback:', e);
          this.playFormantVocalization(character, text.length);
          finish();
        };

        const maxDuration = Math.max(2500, text.length * 85);
        setTimeout(() => {
          if (!ended) finish();
        }, maxDuration);

        window.speechSynthesis.speak(utterance);
        return;
      } catch (err) {
        console.warn('SpeechSynthesis failed:', err);
      }
    }

    this.playFormantVocalization(character, text.length);
    setTimeout(finish, Math.min(3000, Math.max(1200, text.length * 55)));
  }

  public playFormantVocalization(character: CharacterType, length: number): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const profile = CHARACTER_PROFILES[character] || CHARACTER_PROFILES.narrator;
    const now = ctx.currentTime;
    const duration = Math.min(2.5, Math.max(0.8, length * 0.05));

    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    const baseFreq = profile.pitch * 180;
    osc.type = character === 'ghoul' || character === 'monster' ? 'sawtooth' : 'sine';
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.85, now + duration);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(character === 'monster' ? 320 : 650, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.12, now + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration);
  }

  public cancel(): void {
    this.setSpeaking(false);
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    }
  }
}

export const characterVoiceEngine = new CharacterVoiceEngine();
