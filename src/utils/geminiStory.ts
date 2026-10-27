/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  AnimationProject,
  BackgroundTheme,
  CharacterType,
  EmotionType,
  PoseType,
  Scene,
} from '../types/animation';
import {
  createDefaultCharacter,
  createDefaultProp,
  createId,
} from './animationEngine';

export interface StoryPromptOptions {
  prompt: string;
  genre: 'Fable' | 'Sci-Fi' | 'Adventure' | 'Undersea' | 'Bedtime';
}

export async function generateStoryWithGemini(
  options: StoryPromptOptions
): Promise<AnimationProject> {
  try {
    const res = await fetch('/api/story/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options),
    });

    if (res.ok) {
      const parsed = await res.json();
      if (parsed?.scenes?.length) {
        return convertRawGeminiToProject(parsed);
      }
    }
  } catch (err) {
    console.warn('Gemini generation fallback to local generator:', err);
  }

  // Resilient fallback generator if network or API key is absent
  return generateFallbackStory(options);
}

interface RawGeminiOutput {
  title: string;
  description: string;
  scenes: Array<{
    title: string;
    duration: number;
    background: BackgroundTheme;
    weatherEffect: Scene['weatherEffect'];
    narration: string;
    bgMusic: Scene['bgMusic'];
    characters: Array<{
      name: string;
      type: CharacterType;
      startX: number;
      endX: number;
      y: number;
      emotion: EmotionType;
      pose: PoseType;
      speech?: string;
    }>;
    props: Array<Scene['props'][0]['type']>;
  }>;
}

function convertRawGeminiToProject(raw: RawGeminiOutput): AnimationProject {
  const projectId = createId('proj_ai');
  const scenes: Scene[] = raw.scenes.map((s, sIdx) => {
    const sceneId = `scene_${sIdx + 1}`;
    const chars = s.characters.map((c, cIdx) => {
      const char = createDefaultCharacter(
        c.type || 'fox',
        c.startX || 25 + cIdx * 30,
        c.y || 68,
        c.name
      );
      char.emotion = c.emotion || 'happy';
      char.pose = c.pose || 'idle';
      char.speechText = c.speech || '';
      char.keyframes = [
        {
          id: createId('kf'),
          time: 0,
          x: c.startX || 20,
          y: c.y || 68,
          scale: 1,
          rotation: 0,
          flipX: false,
          emotion: c.emotion || 'curious',
          pose: 'idle',
        },
        {
          id: createId('kf'),
          time: 0.5,
          x: ((c.startX || 20) + (c.endX || 45)) / 2,
          y: (c.y || 68) - 4,
          scale: 1.05,
          rotation: 3,
          flipX: false,
          emotion: c.emotion || 'happy',
          pose: c.pose || 'walking',
        },
        {
          id: createId('kf'),
          time: 1,
          x: c.endX || 45,
          y: c.y || 68,
          scale: 1,
          rotation: 0,
          flipX: false,
          emotion: c.emotion || 'cheering' ? 'happy' : 'curious',
          pose: c.pose || 'cheering',
        },
      ];
      return char;
    });

    const props = (s.props || ['star']).slice(0, 3).map((pType, pIdx) => {
      return createDefaultProp(pType, 40 + pIdx * 25, 68);
    });

    return {
      id: sceneId,
      title: s.title || `Scene ${sIdx + 1}`,
      duration: s.duration || 5,
      background: s.background || 'twilight-forest',
      weatherEffect: s.weatherEffect || 'fireflies',
      narration: s.narration || '',
      bgMusic: s.bgMusic || 'fable',
      characters: chars,
      props,
    };
  });

  return {
    id: projectId,
    title: raw.title || 'A Tale Trove Original',
    description: raw.description || 'Generated with AI storytelling.',
    fps: 24,
    scenes,
    activeSceneId: scenes[0]?.id || 'scene_1',
  };
}

function generateFallbackStory(options: StoryPromptOptions): AnimationProject {
  const p = options.prompt.toLowerCase();

  let bg1: BackgroundTheme = 'twilight-forest';
  let bg2: BackgroundTheme = 'celestial-observatory';
  let char1: CharacterType = 'fox';
  let char2: CharacterType = 'owl';
  let title = options.prompt || 'The Legendary Tale Trove Journey';

  if (p.includes('robot') || p.includes('sci-fi') || options.genre === 'Sci-Fi') {
    bg1 = 'cyberpunk-neon';
    bg2 = 'celestial-observatory';
    char1 = 'robot';
    char2 = 'knight';
    title = 'The Neon Automaton & The Starlight Engine';
  } else if (p.includes('ocean') || p.includes('sea') || options.genre === 'Undersea') {
    bg1 = 'deep-ocean';
    bg2 = 'deep-ocean';
    char1 = 'frog';
    char2 = 'pixie';
    title = 'The Song of the Whispering Coral';
  } else if (p.includes('dragon') || p.includes('peak')) {
    bg1 = 'dragon-peak';
    bg2 = 'cozy-cottage';
    char1 = 'knight';
    char2 = 'wizard';
    title = 'The Quest for Dragoncrest Peak';
  }

  const c1 = createDefaultCharacter(char1, 25, 68);
  c1.speechText = 'Let us begin our great expedition!';
  const c2 = createDefaultCharacter(char2, 70, 68);
  c2.flipX = true;
  c2.speechText = 'The stars guide our path forward.';

  const s1: Scene = {
    id: 'scene_ai_1',
    title: 'Scene 1: The Call to Adventure',
    duration: 5,
    background: bg1,
    weatherEffect: bg1 === 'deep-ocean' ? 'bubbles' : 'stardust',
    characters: [c1, c2],
    props: [createDefaultProp('crystal', 48, 70)],
    narration: `Our adventure begins with ${c1.name} setting out on a whimsical quest.`,
    bgMusic: 'adventure',
  };

  const c1Next = { ...c1, id: createId('char') };
  c1Next.pose = 'cheering';
  c1Next.emotion = 'happy';
  c1Next.speechText = 'We solved the riddle of the ancient constellation!';

  const s2: Scene = {
    id: 'scene_ai_2',
    title: 'Scene 2: Wonder at the Summit',
    duration: 5,
    background: bg2,
    weatherEffect: 'fireflies',
    characters: [c1Next],
    props: [createDefaultProp('chest', 50, 72), createDefaultProp('star', 50, 30)],
    narration:
      'Reaching their destination, a glowing treasure chest appeared, glowing with golden light.',
    bgMusic: 'fable',
  };

  return {
    id: createId('proj'),
    title,
    description: `An animated story inspired by "${options.prompt}".`,
    fps: 24,
    scenes: [s1, s2],
    activeSceneId: 'scene_ai_1',
  };
}
