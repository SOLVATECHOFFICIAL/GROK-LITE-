/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  AspectRatio,
  ChatMessage,
  CharacterType,
  MotionType,
  ShotDirection,
  VideoProject,
  VideoScene,
  VisualEffect,
} from '../types/video';
import { detectCharacterType } from './characterVoice';

export interface GrokGenerateRequest {
  prompt: string;
  images: string[];
  aspectRatio: AspectRatio;
  history?: ChatMessage[];
  parentVideo?: VideoProject;
  isContinuation?: boolean;
  onProgress?: (stage: 'analyzing' | 'scripting' | 'rendering' | 'ready', percent: number) => void;
}

export async function processGrokRequest(
  request: GrokGenerateRequest
): Promise<{ replyText: string; video?: VideoProject }> {
  const { prompt, images, aspectRatio, history = [], parentVideo, isContinuation, onProgress } = request;

  if (onProgress) onProgress('analyzing', 20);

  const detectedCharacter = detectCharacterType(prompt);

  const isVideoGenerationRequest =
    images.length > 0 ||
    isContinuation ||
    prompt.toLowerCase().includes('video') ||
    prompt.toLowerCase().includes('film') ||
    prompt.toLowerCase().includes('movie') ||
    prompt.toLowerCase().includes('scene') ||
    prompt.toLowerCase().includes('cinema') ||
    prompt.toLowerCase().includes('animate') ||
    prompt.toLowerCase().includes('shot') ||
    prompt.toLowerCase().includes('clip') ||
    prompt.toLowerCase().includes('part') ||
    prompt.toLowerCase().includes('continue');

  // Attempt server-side Gemini 2.5 Flash Director API
  try {
    if (onProgress) onProgress('scripting', 45);
    const apiRes = await fetch('/api/grok/direct', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        images,
        aspectRatio,
        history,
        parentVideo,
      }),
    });

    if (apiRes.ok) {
      const parsed = await apiRes.json();
      if (parsed.isVideo && parsed.scenes?.length > 0) {
        if (onProgress) onProgress('rendering', 85);
        const project = buildFilmProjectFromPlan(
          parsed.filmTitle || prompt.slice(0, 30),
          prompt,
          aspectRatio,
          parsed.scenes,
          images,
          parsed.characterType || detectedCharacter,
          parentVideo
        );
        if (onProgress) onProgress('ready', 100);
        return {
          replyText:
            parsed.reply ||
            `Generated ${project.scenes.length} cinematic shots for "${project.title}".`,
          video: project,
        };
      } else if (parsed.reply) {
        return {
          replyText: parsed.reply,
        };
      }
    }
  } catch (err) {
    console.warn('Server Gemini call fallback, switching to local cinematic director:', err);
  }

  // Resilient Local Cinematic Film Generator
  if (onProgress) onProgress('scripting', 60);

  if (isVideoGenerationRequest) {
    if (onProgress) onProgress('rendering', 85);
    const video = generateDeterministicFilmProject(
      prompt,
      images,
      aspectRatio,
      detectedCharacter,
      parentVideo
    );
    if (onProgress) onProgress('ready', 100);

    const reply = parentVideo
      ? `Part ${video.partNumber}: Generated ${video.scenes.length} continuation shots picking up from ${parentVideo.totalDuration.toFixed(1)}s.`
      : images.length > 0
      ? `Sequenced ${video.scenes.length} cinematic shots from your ${images.length} reference stills.`
      : `Generated ${video.scenes.length} cinematic shots: "${video.title}"`;

    return { replyText: reply, video };
  }

  return {
    replyText: `Ready. Upload reference stills or describe a scene to direct. Character voice profiles: Ghoul, Monster, Female Warrior, Male Hero, Cyborg.`,
  };
}

function buildFilmProjectFromPlan(
  title: string,
  prompt: string,
  aspectRatio: AspectRatio,
  scenesPlan: Array<{
    title?: string;
    shotType?: ShotDirection['shotType'];
    duration?: number;
    motionType?: MotionType;
    effects?: VisualEffect[];
    lighting?: string;
    lensDescription?: string;
    subtitle?: string;
    speakerName?: string;
    characterType?: CharacterType;
    sfx?: VideoScene['sfxAtStart'];
  }>,
  images: string[],
  characterType: CharacterType,
  parentVideo?: VideoProject
): VideoProject {
  const nextPartNumber = parentVideo ? (parentVideo.partNumber || 1) + 1 : 1;
  const projectId = `film_${Date.now().toString(36)}`;

  const scenes: VideoScene[] = scenesPlan.map((s, idx) => {
    const assignedImage = images.length > 0 ? images[idx % images.length] : undefined;
    const shotCharType = s.characterType || characterType;

    return {
      id: `shot_${nextPartNumber}_${idx + 1}`,
      title: s.title || `Shot ${idx + 1}`,
      duration: s.duration || 4,
      imageSrc: assignedImage,
      backgroundColor: idx % 2 === 0 ? '#0b0f19' : '#020617',
      characterType: shotCharType,
      speakerName: s.speakerName || getCharacterLabel(shotCharType),
      shotDirection: {
        shotType: s.shotType || (idx === 0 ? 'Wide Establishing' : 'Medium Track'),
        lighting: s.lighting || 'Natural cinematic chiaroscuro',
        lensDescription: s.lensDescription || '35mm anamorphic prime',
      },
      motionType: s.motionType || 'dolly-push',
      effects: s.effects || ['film-grain', 'cinematic-bars'],
      cinematicSubtitle: s.subtitle || '',
      narrationText: s.subtitle || '',
      sfxAtStart: s.sfx || (idx === 0 ? 'cinematic-boom' : 'whoosh'),
    };
  });

  const totalDuration = scenes.reduce((sum, s) => sum + s.duration, 0);

  return {
    id: projectId,
    title: parentVideo ? `${parentVideo.title}: Part ${nextPartNumber}` : title,
    prompt,
    aspectRatio,
    totalDuration,
    musicGenre: 'cinematic-orchestra',
    scenes,
    createdAt: Date.now(),
    partNumber: nextPartNumber,
    parentVideoId: parentVideo?.id,
    characterType,
  };
}

function generateDeterministicFilmProject(
  prompt: string,
  images: string[],
  aspectRatio: AspectRatio,
  characterType: CharacterType,
  parentVideo?: VideoProject
): VideoProject {
  const nextPartNumber = parentVideo ? (parentVideo.partNumber || 1) + 1 : 1;

  const motions: MotionType[] = [
    'dolly-push',
    'crane-pan',
    'steadicam-track',
    'drone-aerial',
    'cinematic-drift',
    'slow-zoom-in',
  ];

  const fxCombos: VisualEffect[][] = [
    ['film-grain', 'cinematic-bars', 'anamorphic-flare'],
    ['film-grain', 'teal-orange', 'cinematic-bars'],
    ['film-grain', 'cinematic-fog', 'cinematic-bars'],
    ['film-grain', 'golden-hour', 'cinematic-bars'],
  ];

  const shotTypes: ShotDirection['shotType'][] = [
    'Wide Establishing',
    'Medium Track',
    'Close-Up',
    'Low-Angle Hero',
    'Aerial Drone',
  ];

  const sceneCount = images.length > 0 ? Math.max(images.length, 3) : 3;
  const charLabel = getCharacterLabel(characterType);

  const continuationSubtitles = [
    `The telemetry confirms the target breach. Moving into position.`,
    `No retreat now. The perimeter has collapsed into shadow.`,
    `Eyes forward. The pulse resonates through the lower vaults.`,
    `Final descent. Every protocol has been overwritten.`,
  ];

  const scenes: VideoScene[] = Array.from({ length: sceneCount }, (_, idx) => {
    const assignedImage = images.length > 0 ? images[idx % images.length] : undefined;
    const shotSubtitle = parentVideo
      ? continuationSubtitles[idx % continuationSubtitles.length]
      : idx === 0
      ? prompt.slice(0, 60)
      : `Scene development: ${prompt.slice(0, 35)}...`;

    return {
      id: `shot_${nextPartNumber}_${idx + 1}`,
      title: `Shot ${idx + 1}: ${shotTypes[(idx + nextPartNumber) % shotTypes.length]}`,
      duration: 4.0,
      imageSrc: assignedImage,
      backgroundColor: idx % 2 === 0 ? '#0b0f19' : '#030712',
      characterType,
      speakerName: charLabel,
      shotDirection: {
        shotType: shotTypes[(idx + nextPartNumber) % shotTypes.length],
        lighting: idx === 0 ? 'Atmospheric twilight backlight' : 'High-contrast edge lighting',
        lensDescription: idx === 0 ? '24mm Ultra-Wide T/1.5' : '50mm Anamorphic Prime',
      },
      motionType: motions[(idx + nextPartNumber) % motions.length],
      effects: fxCombos[idx % fxCombos.length],
      cinematicSubtitle: shotSubtitle,
      narrationText: shotSubtitle,
      sfxAtStart: idx === 0 ? 'cinematic-boom' : 'whoosh',
    };
  });

  const totalDuration = scenes.reduce((sum, s) => sum + s.duration, 0);
  const baseTitle = parentVideo
    ? `${parentVideo.title.replace(/: Part \d+$/, '')}: Part ${nextPartNumber}`
    : prompt
    ? prompt.slice(0, 32)
    : 'Untitled Cinema Project';

  return {
    id: `film_${Date.now()}`,
    title: baseTitle,
    prompt,
    aspectRatio,
    totalDuration,
    musicGenre: 'cinematic-orchestra',
    scenes,
    createdAt: Date.now(),
    partNumber: nextPartNumber,
    parentVideoId: parentVideo?.id,
    characterType,
  };
}

function getCharacterLabel(type: CharacterType): string {
  switch (type) {
    case 'ghoul':
      return 'Ghoul Shadow Wraith';
    case 'monster':
      return 'Underworld Beast';
    case 'female':
      return 'Female Warrior';
    case 'male':
      return 'Male Commander';
    case 'robot':
      return 'Synthetic AI Core';
    case 'narrator':
    default:
      return 'Director Narrator';
  }
}
