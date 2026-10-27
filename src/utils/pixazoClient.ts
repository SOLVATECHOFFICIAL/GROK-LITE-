/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AspectRatio, MotionType, VideoProject, VideoScene, VisualEffect } from '../types/video';

const DEFAULT_PIXAZO_KEY = '49b9a073feca45da9c566b2ee74df0b2';
const STORAGE_KEY = 'grok_pixazo_api_key';
const STORAGE_ENGINE_MODE = 'grok_video_engine_mode';

export type EngineMode = 'canvas-director' | 'pixazo-cloud';

export interface PixazoConfig {
  apiKey: string;
  engineMode: EngineMode;
}

export function getPixazoConfig(): PixazoConfig {
  const apiKey =
    (typeof window !== 'undefined' && localStorage.getItem(STORAGE_KEY)) ||
    DEFAULT_PIXAZO_KEY;
  const engineMode =
    ((typeof window !== 'undefined' &&
      localStorage.getItem(STORAGE_ENGINE_MODE)) as EngineMode) ||
    'canvas-director';

  return { apiKey, engineMode };
}

export function setPixazoApiKey(key: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, key.trim());
  }
}

export function setEngineMode(mode: EngineMode): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_ENGINE_MODE, mode);
  }
}

/**
 * Creates an extension scene continuing the story from where the video left off.
 * This extends the length of the video and allows the story to continue seamlessly.
 */
export function extendVideoProject(
  project: VideoProject,
  continuationNotes?: string
): VideoProject {
  const nextSceneIndex = project.scenes.length + 1;
  const lastScene = project.scenes[project.scenes.length - 1];

  // Pick complementary motion type that continues the camera movement
  const nextMotion: MotionType =
    lastScene?.motionType === 'dolly-push'
      ? 'crane-pan'
      : lastScene?.motionType === 'crane-pan'
      ? 'dutch-tilt'
      : lastScene?.motionType === 'dutch-tilt'
      ? 'steadicam-track'
      : 'dolly-push';

  const nextEffects: VisualEffect[] = lastScene?.effects?.length
    ? [...lastScene.effects]
    : ['film-grain', 'cinematic-bars'];

  // Craft a continuation subtitle
  const continuationSubtitles = [
    `The signal strengthens across the perimeter. Point of no return.`,
    `Tracing the source beyond the grid. The transmission holds.`,
    `Shadows shift as the telemetry locks onto target coordinates.`,
    `Advancing further down the corridor. No turning back now.`,
  ];
  const nextSubtitle =
    continuationNotes ||
    continuationSubtitles[nextSceneIndex % continuationSubtitles.length];

  const newScene: VideoScene = {
    id: `shot_ext_${nextSceneIndex}_${Date.now()}`,
    title: `Shot ${nextSceneIndex}: Continuation`,
    duration: 4.5,
    imageSrc: lastScene?.imageSrc,
    backgroundColor:
      nextSceneIndex % 2 === 0 ? '#0a0e1c' : '#030712',
    shotDirection: {
      shotType:
        lastScene?.shotDirection?.shotType === 'Wide Establishing'
          ? 'Medium Track'
          : 'Close-Up',
      lighting: 'Atmospheric rim lighting with volumetric shadows',
      lensDescription: '50mm Anamorphic Prime T1.3',
    },
    motionType: nextMotion,
    effects: nextEffects,
    cinematicSubtitle: nextSubtitle,
    sfxAtStart: 'whoosh',
  };

  const updatedScenes = [...project.scenes, newScene];
  const updatedDuration = updatedScenes.reduce((acc, s) => acc + s.duration, 0);

  return {
    ...project,
    totalDuration: updatedDuration,
    scenes: updatedScenes,
  };
}

/**
 * Persists and retrieves the last paused playback timestamp per video
 * so the user can continue where they stopped last time.
 */
export function getSavedPlaybackTime(videoId: string): number {
  if (typeof window === 'undefined') return 0;
  const val = localStorage.getItem(`grok_cinema_playback_${videoId}`);
  if (!val) return 0;
  const num = parseFloat(val);
  return Number.isFinite(num) && num > 0 ? num : 0;
}

export function savePlaybackTime(videoId: string, time: number): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`grok_cinema_playback_${videoId}`, time.toFixed(2));
}
