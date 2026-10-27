/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type CharacterType =
  | 'fox'
  | 'knight'
  | 'owl'
  | 'robot'
  | 'wizard'
  | 'pixie'
  | 'cat'
  | 'frog';

export type EmotionType =
  | 'happy'
  | 'curious'
  | 'surprised'
  | 'dramatic'
  | 'talking'
  | 'sleepy';

export type PoseType =
  | 'idle'
  | 'walking'
  | 'jumping'
  | 'casting'
  | 'cheering'
  | 'bowing';

export type PropType =
  | 'star'
  | 'tree'
  | 'crystal'
  | 'chest'
  | 'campfire'
  | 'potion'
  | 'wand'
  | 'moon'
  | 'cloud'
  | 'flower';

export type BackgroundTheme =
  | 'twilight-forest'
  | 'celestial-observatory'
  | 'cyberpunk-neon'
  | 'cozy-cottage'
  | 'dragon-peak'
  | 'deep-ocean';

export type WeatherEffect =
  | 'none'
  | 'fireflies'
  | 'stardust'
  | 'leaves'
  | 'rain'
  | 'bubbles';

export type BgMusicMood =
  | 'fable'
  | 'adventure'
  | 'lullaby'
  | 'mystery'
  | 'none';

export interface Keyframe {
  id: string;
  time: number; // 0 to 1 relative to scene duration
  x: number; // 0 to 100 percentage
  y: number; // 0 to 100 percentage
  scale: number; // 0.5 to 2
  rotation: number; // degrees -180 to 180
  flipX: boolean;
  emotion: EmotionType;
  pose: PoseType;
}

export interface CharacterPuppet {
  id: string;
  name: string;
  type: CharacterType;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  flipX: boolean;
  emotion: EmotionType;
  pose: PoseType;
  color?: string;
  accessory?: string;
  speechText?: string;
  keyframes: Keyframe[];
}

export interface PropItem {
  id: string;
  type: PropType;
  name: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  floating?: boolean;
}

export interface Scene {
  id: string;
  title: string;
  duration: number; // in seconds
  background: BackgroundTheme;
  weatherEffect: WeatherEffect;
  characters: CharacterPuppet[];
  props: PropItem[];
  narration: string;
  bgMusic: BgMusicMood;
}

export interface AnimationProject {
  id: string;
  title: string;
  description: string;
  fps: 12 | 24;
  scenes: Scene[];
  activeSceneId: string;
}

export interface TimelineState {
  currentTime: number;
  isPlaying: boolean;
  loop: boolean;
  onionSkinning: boolean;
  fps: 12 | 24;
  selectedEntityId: string | null;
  selectedEntityType: 'character' | 'prop' | 'scene' | null;
}
