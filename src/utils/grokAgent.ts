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
  BiomeType,
} from '../types/video';
import { detectCharacterType } from './characterVoice';
import { detectBiome } from './videoRenderEngine';

export interface GrokGenerateRequest {
  prompt: string;
  images: string[];
  aspectRatio: AspectRatio;
  history?: ChatMessage[];
  parentVideo?: VideoProject;
  isContinuation?: boolean;
  onProgress?: (stage: 'analyzing' | 'scripting' | 'rendering' | 'ready', percent: number) => void;
}

/**
 * Checks if request has sufficient context to generate a video.
 * Never generates if there is no image, descriptive prompt (< 3 chars), or memory context.
 */
export function canTriggerGeneration(
  prompt: string,
  images: string[] = [],
  history: ChatMessage[] = [],
  parentVideo?: VideoProject,
  isContinuation?: boolean
): boolean {
  if (isContinuation || Boolean(parentVideo)) return true;
  if (images && images.length > 0) return true;

  const hasGenerateKeyword = /\bGENERATE\b/.test(prompt) || prompt.trim().startsWith('GENERATE');
  if (!hasGenerateKeyword) return false;

  // Extract clean text beyond the GENERATE keyword
  const cleanDescription = prompt
    .replace(/\bGENERATE\b:?/gi, '')
    .replace(/[^a-zA-Z0-9]/g, ' ')
    .trim();

  // If user provided at least 3 descriptive characters (e.g. "GENERATE a spaceship")
  if (cleanDescription.length >= 3) return true;

  // Check if conversation history already has previous video or uploaded images
  const hasHistoryContext = (history || []).some((m) => {
    if (m.generatedVideo) return true;
    if (m.uploadedImages && m.uploadedImages.length > 0) return true;
    return false;
  });

  return hasHistoryContext;
}

export function isGenerateCommand(
  prompt: string,
  images: string[] = [],
  history: ChatMessage[] = [],
  parentVideo?: VideoProject,
  isContinuation?: boolean
): boolean {
  return canTriggerGeneration(prompt, images, history, parentVideo, isContinuation);
}

/**
 * Generates dynamic, context-aware conversational director replies.
 * Uses chat history memory to remember previous videos, comment on uploaded stills,
 * and provide directing advice without repeating static canned phrases.
 */
export function generateDynamicDirectorReply(
  prompt: string,
  images: string[] = [],
  history: ChatMessage[] = []
): string {
  const clean = (prompt || '').trim();
  const lower = clean.toLowerCase();

  // 1. Look up memory from previous messages
  const previousVideos = (history || [])
    .filter((m) => m.generatedVideo)
    .map((m) => m.generatedVideo as VideoProject);
  const lastVideo = previousVideos.length > 0 ? previousVideos[previousVideos.length - 1] : undefined;

  // If user typed GENERATE but has no context (no prompt description, no image, no memory)
  if (/\bGENERATE\b/i.test(prompt) && !canTriggerGeneration(prompt, images, history)) {
    return "I need a scene concept or reference still before I can direct and generate. Tell me what scene you want to produce (e.g., 'GENERATE: A cybernetic mercenary entering an abandoned hangar in the snow'), or upload your reference photos so I have a visual vision to craft!";
  }

  // If user uploaded an image and is asking about it
  if (images.length > 0 && (lower.includes('explain') || lower.includes('look') || lower.includes('image') || lower.includes('photo') || lower.includes('still') || lower.includes('picture') || lower.includes('what do you think'))) {
    return `Looking at your reference image (${images.length} frame${images.length > 1 ? 's' : ''} uploaded): The composition has strong focal depth and dramatic mood. I can stage this with a slow dolly-push or crane-pan, matching the lighting with anamorphic flares. Whenever you want to direct it into a full sequence, type "GENERATE" along with your scene action!`;
  }

  // Recall previous video / story continuity
  if (lastVideo && (lower.includes('last video') || lower.includes('previous') || lower.includes('what did we make') || lower.includes('remember') || lower.includes('continuity') || lower.includes('part 2'))) {
    return `In our last cut, we produced "${lastVideo.title}" (${lastVideo.scenes?.length || 0} shots, ${lastVideo.totalDuration}s duration) in ${lastVideo.aspectRatio} format. The story left off with "${lastVideo.scenes?.[lastVideo.scenes.length - 1]?.title || 'the climax'}". If you want to direct the continuation, type "GENERATE Part 2: [your next scene description]"!`;
  }

  // Greetings: dynamic, acknowledging project history
  if (lower.startsWith('hi') || lower.startsWith('hello') || lower.startsWith('hey') || lower.startsWith('wassup') || lower.startsWith("what's up")) {
    if (previousVideos.length > 0) {
      return `Wassup! Director Grok here. We've got ${previousVideos.length} project${previousVideos.length > 1 ? 's' : ''} in the reel, including "${lastVideo?.title}". What scene are we directing next? You can describe a new scene, upload reference stills, or type GENERATE when you're ready to shoot!`;
    }
    return `Wassup! I'm your AI Cinema Director Brain. I direct multi-shot films, choreograph camera motion (dolly, steadicam, crane, drone), and cast voice talent. You can brainstorm story concepts with me, upload character stills, or type "GENERATE: [scene description]" when you want to produce!`;
  }

  // Questions about how it works / who are you
  if (lower.includes('who are you') || lower.includes('what can you do') || lower.includes('help') || lower.includes('how does this work')) {
    return `I'm Grok Cinema, your autonomous movie director. Here's how to work with me:
1. Normal Chat: Brainstorm storylines, ask for cinematography advice, or upload reference stills.
2. Video Generation: Start your prompt with "GENERATE: [scene description]" (e.g. "GENERATE: Desert convoy ambushed at sunset") to produce multi-shot footage with camera motion, voice narration, and film score.
3. Stitching: In the Mergen Studio tab, arrange your clips on the timeline and merge them seamlessly!`;
  }

  // Story ideas / brainstorming request
  if (lower.includes('idea') || lower.includes('suggest') || lower.includes('pitch') || lower.includes('brainstorm') || lower.includes('what should i make')) {
    return `Here are 3 cinematic pitches you can direct right now:
1. "GENERATE: Cyberpunk stealth operative infiltrating a rain-slicked Tokyo neon rooftop" (Anamorphic prime, steady tracking shot)
2. "GENERATE: Deep space exploration pod discovering an ancient alien monolithic structure in an asteroid belt" (Slow cosmic drift, 24mm wide)
3. "GENERATE: Medieval knight searching a torchlit gothic crypt for an enchanted crown" (Low-angle hero shot, flickering embers)
Pick one, or describe your own twist!`;
  }

  // Cinematography questions
  if (lower.includes('camera') || lower.includes('lens') || lower.includes('lighting') || lower.includes('dolly') || lower.includes('aspect ratio')) {
    return `Cinematography recommendation: For epic blockbusters, 16:9 or 2.39:1 widescreen with a 35mm Anamorphic lens gives you rich horizontal flare and shallow depth of field. For mobile/social cinema, 9:16 vertical with tight prime close-ups creates immediate intimacy. Let me know what aesthetic you want for your next sequence!`;
  }

  // Default intelligent contextual response
  if (clean.length > 0) {
    return `Understood on "${clean}". From a director's standpoint, we can build dynamic tension here using alternating wide establishing shots and tight macro inserts. If you want to produce this scene right away, type "GENERATE: ${clean}", or upload reference stills to anchor the visual style!`;
  }

  return `I'm ready in the director's chair. Upload reference photos, brainstorm scene ideas, or type "GENERATE: [scene description]" to produce!`;
}

export async function processGrokRequest(
  request: GrokGenerateRequest
): Promise<{ replyText: string; video?: VideoProject }> {
  const { prompt, images, aspectRatio, history = [], parentVideo, isContinuation, onProgress } = request;

  if (onProgress) onProgress('analyzing', 20);

  const detectedCharacter = detectCharacterType(prompt);
  const isVideoGenerationRequest = canTriggerGeneration(prompt, images, history, parentVideo, isContinuation);

  // Attempt server-side Gemini 3.8 Flash Director API
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
      if (parsed.isVideo && parsed.scenes?.length > 0 && isVideoGenerationRequest) {
        if (onProgress) onProgress('rendering', 85);
        const project = buildFilmProjectFromPlan(
          parsed.filmTitle || prompt.replace(/^GENERATE:?\s*/i, '').slice(0, 30) || 'Cinematic Cut',
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

  // Resilient Local Generator when video was requested with sufficient context
  if (isVideoGenerationRequest) {
    if (onProgress) onProgress('scripting', 60);
    if (onProgress) onProgress('rendering', 85);
    const cleanPrompt = prompt.replace(/^GENERATE:?\s*/i, '').trim();
    const video = generateDeterministicFilmProject(
      cleanPrompt || 'Cinematic Film',
      images,
      aspectRatio,
      detectedCharacter,
      parentVideo
    );
    if (onProgress) onProgress('ready', 100);

    const reply = parentVideo
      ? `Part ${video.partNumber}: Generated ${video.scenes.length} continuation shots.`
      : `Generated ${video.scenes.length} cinematic shots for "${video.title}".`;

    return { replyText: reply, video };
  }

  // Conversational reply with full memory and smart feedback
  return {
    replyText: generateDynamicDirectorReply(prompt, images, history),
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
    biome?: BiomeType;
  }>,
  images: string[],
  characterType: CharacterType,
  parentVideo?: VideoProject
): VideoProject {
  const nextPartNumber = parentVideo ? (parentVideo.partNumber || 1) + 1 : 1;
  const projectId = `film_${Date.now().toString(36)}`;
  const defaultBiome = detectBiome(prompt);

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
      biome: s.biome || defaultBiome,
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
  const biome = detectBiome(prompt);

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

  // Tailor lighting per biome
  const getBiomeLighting = (idx: number, b: BiomeType) => {
    switch (b) {
      case 'space':
        return idx === 0 ? 'Starlight rim glow with violet nebula wash' : 'Solar reflection on spacecraft hull';
      case 'desert':
        return idx === 0 ? 'Blazing golden-hour backlight with heat shimmer' : 'Terracotta dune shadow gradient';
      case 'jungle':
        return idx === 0 ? 'Emerald god-rays piercing dense canopy' : 'Dappled foliage shadows with bioluminescent accents';
      case 'dungeon':
        return idx === 0 ? 'Flickering torchlight against ancient damp stone' : 'Low-angle amber brazier glow';
      case 'ocean':
        return idx === 0 ? 'Deep oceanic aqua caustics reflecting from above' : 'Bioluminescent deep sea plankton radiance';
      case 'noir':
        return idx === 0 ? 'Venetian blind chiaroscuro shadow slants' : 'Tungsten spotlight in heavy darkness';
      case 'action':
        return idx === 0 ? 'High-speed motion blur and lens flare' : 'Asphalt headlight illumination';
      case 'apocalypse':
        return idx === 0 ? 'Smoldering haze and fallout particulate glow' : 'Rubble silhouette against burnt sky';
      case 'cyberpunk':
      default:
        return idx === 0 ? 'Neon cyan & magenta street illumination' : 'Sodium vapor backlighting with wet asphalt bounce';
    }
  };

  const getBiomeLens = (idx: number, b: BiomeType) => {
    if (b === 'space') return idx === 0 ? '24mm Ultra-Wide Anamorphic T1.5' : '85mm Cosmic Prime';
    if (b === 'ocean') return idx === 0 ? '16mm Fish-Eye Caustic T2.0' : '50mm Macro Prime';
    if (b === 'noir') return idx === 0 ? '35mm Vintage Monochrome Prime' : '50mm High-Contrast T1.4';
    return idx === 0 ? '24mm Ultra-Wide T/1.5' : '50mm Anamorphic Prime';
  };

  const scenes: VideoScene[] = Array.from({ length: sceneCount }, (_, idx) => {
    const assignedImage = images.length > 0 ? images[idx % images.length] : undefined;
    const shotSubtitle = parentVideo
      ? continuationSubtitles[idx % continuationSubtitles.length]
      : idx === 0
      ? prompt.slice(0, 60)
      : `Scene development: ${prompt.slice(0, 35)}...`;

    return {
      id: `shot_${nextPartNumber}_${idx + 1}`,
      title: `Shot ${idx + 1}: ${shotTypes[(idx + nextPartNumber) % shotTypes.length]} (${biome.toUpperCase()})`,
      duration: 4.0,
      imageSrc: assignedImage,
      backgroundColor: idx % 2 === 0 ? '#0b0f19' : '#030712',
      characterType,
      speakerName: charLabel,
      shotDirection: {
        shotType: shotTypes[(idx + nextPartNumber) % shotTypes.length],
        lighting: getBiomeLighting(idx, biome),
        lensDescription: getBiomeLens(idx, biome),
      },
      motionType: motions[(idx + nextPartNumber) % motions.length],
      effects: fxCombos[idx % fxCombos.length],
      cinematicSubtitle: shotSubtitle,
      narrationText: shotSubtitle,
      sfxAtStart: idx === 0 ? 'cinematic-boom' : 'whoosh',
      biome,
    };
  });

  const totalDuration = scenes.reduce((sum, s) => sum + s.duration, 0);
  const baseTitle = parentVideo
    ? `${parentVideo.title.replace(/: Part \d+$/, '')}: Part ${nextPartNumber}`
    : prompt
    ? prompt.slice(0, 32)
    : `${biome.charAt(0).toUpperCase() + biome.slice(1)} Sequence`;

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
