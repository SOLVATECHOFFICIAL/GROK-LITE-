/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type AspectRatio = '16:9' | '9:16' | '1:1';

export type MotionType =
  | 'dolly-push'
  | 'crane-pan'
  | 'drone-aerial'
  | 'steadicam-track'
  | 'dutch-tilt'
  | 'slow-zoom-in'
  | 'slow-zoom-out'
  | 'cinematic-drift';

export type VisualEffect =
  | 'none'
  | 'film-grain'
  | 'anamorphic-flare'
  | 'cinematic-fog'
  | 'teal-orange'
  | 'noir-contrast'
  | 'cinematic-bars'
  | 'golden-hour';

export type MusicGenre =
  | 'cinematic-orchestra'
  | 'synth-ambient'
  | 'deep-sub-hit'
  | 'atmospheric-drone'
  | 'action-percussion'
  | 'none';

export type CharacterType =
  | 'ghoul'
  | 'monster'
  | 'female'
  | 'male'
  | 'robot'
  | 'narrator';

export type MergeTransitionType =
  | 'ai-matched'
  | 'cross-dissolve'
  | 'dip-to-black'
  | 'motion-whip'
  | 'hard-cut';

export interface SplitTransitionInfo {
  id: string;
  fromClipIndex: number;
  toClipIndex: number;
  fromVideoId: string;
  toVideoId: string;
  transitionType: MergeTransitionType;
  duration: number; // in seconds (e.g. 0.6)
  aiReasoning: string;
  colorGradeMatch: string;
}

export interface ShotDirection {
  shotType: 'Wide Establishing' | 'Medium Track' | 'Close-Up' | 'Low-Angle Hero' | 'Aerial Drone';
  lighting: string;
  lensDescription: string;
}

export interface VideoScene {
  id: string;
  title: string;
  duration: number; // in seconds
  imageSrc?: string;
  backgroundColor?: string;
  shotDirection?: ShotDirection;
  motionType: MotionType;
  effects: VisualEffect[];
  narrationText?: string;
  cinematicSubtitle?: string;
  characterType?: CharacterType;
  speakerName?: string;
  sfxAtStart?: 'cinematic-boom' | 'whoosh' | 'sub-drop' | 'shutter' | 'none';
}

export interface VideoProject {
  id: string;
  title: string;
  prompt: string;
  aspectRatio: AspectRatio;
  totalDuration: number;
  musicGenre: MusicGenre;
  directorTreatment?: string;
  scenes: VideoScene[];
  createdAt: number;
  thumbnailUrl?: string;
  partNumber?: number;
  parentVideoId?: string;
  characterType?: CharacterType;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  uploadedImages?: string[];
  generatedVideo?: VideoProject;
  isGeneratingVideo?: boolean;
}

export interface VideoHistoryItem {
  id: string;
  title: string;
  prompt: string;
  thumbnail: string;
  duration: number;
  aspectRatio: AspectRatio;
  createdAt: number;
  video: VideoProject;
  partNumber?: number;
}
