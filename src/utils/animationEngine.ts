/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  AnimationProject,
  CharacterPuppet,
  CharacterType,
  EmotionType,
  Keyframe,
  PoseType,
  PropItem,
  Scene,
} from '../types/animation';

export function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export interface InterpolatedCharacterState {
  x: number;
  y: number;
  scale: number;
  rotation: number;
  flipX: boolean;
  emotion: EmotionType;
  pose: PoseType;
}

/**
 * Computes interpolated transformation and state for a character at a normalized time [0, 1].
 */
export function interpolateCharacterAtTime(
  char: CharacterPuppet,
  normalizedTime: number
): InterpolatedCharacterState {
  const t = clamp(normalizedTime, 0, 1);

  if (!char.keyframes || char.keyframes.length === 0) {
    return {
      x: char.x,
      y: char.y,
      scale: char.scale,
      rotation: char.rotation,
      flipX: char.flipX,
      emotion: char.emotion,
      pose: char.pose,
    };
  }

  // Sort keyframes by time
  const sorted = [...char.keyframes].sort((a, b) => a.time - b.time);

  // If time is before first keyframe
  if (t <= sorted[0].time) {
    const first = sorted[0];
    return {
      x: first.x,
      y: first.y,
      scale: first.scale,
      rotation: first.rotation,
      flipX: first.flipX,
      emotion: first.emotion,
      pose: first.pose,
    };
  }

  // If time is after last keyframe
  if (t >= sorted[sorted.length - 1].time) {
    const last = sorted[sorted.length - 1];
    return {
      x: last.x,
      y: last.y,
      scale: last.scale,
      rotation: last.rotation,
      flipX: last.flipX,
      emotion: last.emotion,
      pose: last.pose,
    };
  }

  // Find surrounding keyframes
  let prev = sorted[0];
  let next = sorted[sorted.length - 1];

  for (let i = 0; i < sorted.length - 1; i++) {
    if (sorted[i].time <= t && sorted[i + 1].time >= t) {
      prev = sorted[i];
      next = sorted[i + 1];
      break;
    }
  }

  const segmentDuration = next.time - prev.time;
  const localT = segmentDuration <= 0 ? 0 : (t - prev.time) / segmentDuration;
  const eased = easeInOutCubic(localT);

  return {
    x: lerp(prev.x, next.x, eased),
    y: lerp(prev.y, next.y, eased),
    scale: lerp(prev.scale, next.scale, eased),
    rotation: lerp(prev.rotation, next.rotation, eased),
    flipX: localT >= 0.5 ? next.flipX : prev.flipX,
    emotion: localT >= 0.5 ? next.emotion : prev.emotion,
    pose: localT >= 0.5 ? next.pose : prev.pose,
  };
}

/**
 * Calculates dynamic procedural motion offsets (walk bounce, breathing bob, limb wiggle)
 */
export function calculatePoseOffset(
  pose: PoseType,
  timeSeconds: number,
  isMoving: boolean
): {
  bodyOffsetY: number;
  bodyRotation: number;
  limbAngle: number;
  breathingScale: number;
} {
  const speedMultiplier = isMoving ? 1.8 : 1.0;
  const cycle = timeSeconds * 4 * speedMultiplier;

  switch (pose) {
    case 'walking':
      return {
        bodyOffsetY: -Math.abs(Math.sin(cycle * 2)) * 6,
        bodyRotation: Math.sin(cycle) * 3,
        limbAngle: Math.sin(cycle) * 25,
        breathingScale: 1,
      };
    case 'jumping':
      return {
        bodyOffsetY: -12 + Math.sin(timeSeconds * 5) * 4,
        bodyRotation: Math.sin(timeSeconds * 4) * 5,
        limbAngle: 20,
        breathingScale: 1.05,
      };
    case 'cheering':
      return {
        bodyOffsetY: -Math.abs(Math.sin(timeSeconds * 8)) * 8,
        bodyRotation: Math.sin(timeSeconds * 6) * 4,
        limbAngle: 45 + Math.sin(timeSeconds * 10) * 15,
        breathingScale: 1.04,
      };
    case 'casting':
      return {
        bodyOffsetY: Math.sin(timeSeconds * 3) * 3,
        bodyRotation: Math.sin(timeSeconds * 2) * 2,
        limbAngle: 30 + Math.sin(timeSeconds * 6) * 10,
        breathingScale: 1 + Math.sin(timeSeconds * 5) * 0.03,
      };
    case 'bowing':
      return {
        bodyOffsetY: 4,
        bodyRotation: 12,
        limbAngle: -10,
        breathingScale: 0.98,
      };
    case 'idle':
    default:
      return {
        bodyOffsetY: Math.sin(timeSeconds * 2) * 2,
        bodyRotation: Math.sin(timeSeconds * 1.5) * 1,
        limbAngle: Math.sin(timeSeconds * 2) * 3,
        breathingScale: 1 + Math.sin(timeSeconds * 2.5) * 0.015,
      };
  }
}

/**
 * Creates a unique ID
 */
export function createId(prefix = 'id'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
}

/**
 * Returns default puppet definition for character type
 */
export function createDefaultCharacter(
  type: CharacterType,
  x = 35,
  y = 65,
  name?: string
): CharacterPuppet {
  const names: Record<CharacterType, string> = {
    fox: 'Rusty the Fable Fox',
    knight: 'Sir Sterling',
    owl: 'Archimedes the Wise',
    robot: 'Geary Unit-7',
    wizard: 'Merlinia Starweaver',
    pixie: 'Luma Whisperwing',
    cat: 'Barnaby the Sleuth',
    frog: 'Prince Tad',
  };

  const initialKeyframes: Keyframe[] = [
    {
      id: createId('kf'),
      time: 0,
      x,
      y,
      scale: 1,
      rotation: 0,
      flipX: false,
      emotion: 'curious',
      pose: 'idle',
    },
    {
      id: createId('kf'),
      time: 1,
      x: x + 15,
      y,
      scale: 1,
      rotation: 0,
      flipX: false,
      emotion: 'happy',
      pose: 'walking',
    },
  ];

  return {
    id: createId('char'),
    name: name || names[type],
    type,
    x,
    y,
    scale: 1,
    rotation: 0,
    flipX: false,
    emotion: 'curious',
    pose: 'idle',
    keyframes: initialKeyframes,
  };
}

/**
 * Returns default prop definition
 */
export function createDefaultProp(
  type: PropItem['type'],
  x = 50,
  y = 70,
  name?: string
): PropItem {
  const names: Record<PropItem['type'], string> = {
    star: 'Starlit Shard',
    tree: 'Ancient Whispering Pine',
    crystal: 'Arcane Mana Crystal',
    chest: 'Treasure of Trove',
    campfire: 'Crackling Campfire',
    potion: 'Elixir of Dreams',
    wand: 'Starlight Scepter',
    moon: 'Crescent Moon',
    cloud: 'Dream Mist Cloud',
    flower: 'Glow Blossom',
  };

  return {
    id: createId('prop'),
    type,
    name: name || names[type],
    x,
    y,
    scale: 1,
    rotation: 0,
    floating: type === 'star' || type === 'moon' || type === 'cloud',
  };
}

/**
 * Generates initial starter project: "The Fox and the Wandering Star"
 */
export function getDefaultProject(): AnimationProject {
  const scene1Chars: CharacterPuppet[] = [
    {
      id: 'char_fox_1',
      name: 'Rusty the Fox',
      type: 'fox',
      x: 25,
      y: 68,
      scale: 1.1,
      rotation: 0,
      flipX: false,
      emotion: 'curious',
      pose: 'walking',
      speechText: 'Look at that constellation dancing!',
      keyframes: [
        {
          id: 'kf_fox_1a',
          time: 0,
          x: 15,
          y: 70,
          scale: 1.1,
          rotation: 0,
          flipX: false,
          emotion: 'curious',
          pose: 'walking',
        },
        {
          id: 'kf_fox_1b',
          time: 0.5,
          x: 32,
          y: 67,
          scale: 1.1,
          rotation: 0,
          flipX: false,
          emotion: 'surprised',
          pose: 'idle',
        },
        {
          id: 'kf_fox_1c',
          time: 1.0,
          x: 40,
          y: 67,
          scale: 1.1,
          rotation: 0,
          flipX: false,
          emotion: 'happy',
          pose: 'cheering',
        },
      ],
    },
    {
      id: 'char_owl_1',
      name: 'Archimedes',
      type: 'owl',
      x: 75,
      y: 42,
      scale: 1,
      rotation: 0,
      flipX: true,
      emotion: 'talking',
      pose: 'idle',
      speechText: 'The ancient prophecies foretold this starlight...',
      keyframes: [
        {
          id: 'kf_owl_1a',
          time: 0,
          x: 75,
          y: 40,
          scale: 1,
          rotation: 0,
          flipX: true,
          emotion: 'talking',
          pose: 'idle',
        },
        {
          id: 'kf_owl_1b',
          time: 0.6,
          x: 75,
          y: 42,
          scale: 1,
          rotation: -4,
          flipX: true,
          emotion: 'dramatic',
          pose: 'casting',
        },
        {
          id: 'kf_owl_1c',
          time: 1.0,
          x: 72,
          y: 40,
          scale: 1.05,
          rotation: 2,
          flipX: true,
          emotion: 'happy',
          pose: 'idle',
        },
      ],
    },
  ];

  const scene1Props: PropItem[] = [
    {
      id: 'prop_tree_1',
      type: 'tree',
      name: 'Great Forest Oak',
      x: 82,
      y: 65,
      scale: 1.3,
      rotation: 0,
    },
    {
      id: 'prop_star_1',
      type: 'star',
      name: 'Wandering Comet',
      x: 52,
      y: 20,
      scale: 1.2,
      rotation: 15,
      floating: true,
    },
    {
      id: 'prop_campfire_1',
      type: 'campfire',
      name: 'Hearth Flame',
      x: 50,
      y: 74,
      scale: 0.9,
      rotation: 0,
    },
  ];

  const scene2Chars: CharacterPuppet[] = [
    {
      id: 'char_wizard_2',
      name: 'Merlinia',
      type: 'wizard',
      x: 28,
      y: 65,
      scale: 1.15,
      rotation: 0,
      flipX: false,
      emotion: 'dramatic',
      pose: 'casting',
      speechText: 'Align the celestial prism to guide the star!',
      keyframes: [
        {
          id: 'kf_wiz_2a',
          time: 0,
          x: 22,
          y: 65,
          scale: 1.15,
          rotation: 0,
          flipX: false,
          emotion: 'talking',
          pose: 'idle',
        },
        {
          id: 'kf_wiz_2b',
          time: 0.5,
          x: 28,
          y: 64,
          scale: 1.15,
          rotation: -5,
          flipX: false,
          emotion: 'dramatic',
          pose: 'casting',
        },
        {
          id: 'kf_wiz_2c',
          time: 1.0,
          x: 35,
          y: 65,
          scale: 1.15,
          rotation: 0,
          flipX: false,
          emotion: 'happy',
          pose: 'cheering',
        },
      ],
    },
    {
      id: 'char_pixie_2',
      name: 'Luma',
      type: 'pixie',
      x: 65,
      y: 40,
      scale: 0.85,
      rotation: 0,
      flipX: true,
      emotion: 'happy',
      pose: 'jumping',
      speechText: 'The crystal is glowing! It shines brighter than ever!',
      keyframes: [
        {
          id: 'kf_pix_2a',
          time: 0,
          x: 60,
          y: 45,
          scale: 0.85,
          rotation: 0,
          flipX: true,
          emotion: 'happy',
          pose: 'jumping',
        },
        {
          id: 'kf_pix_2b',
          time: 0.5,
          x: 70,
          y: 35,
          scale: 0.9,
          rotation: 10,
          flipX: false,
          emotion: 'surprised',
          pose: 'cheering',
        },
        {
          id: 'kf_pix_2c',
          time: 1.0,
          x: 65,
          y: 40,
          scale: 0.85,
          rotation: -5,
          flipX: true,
          emotion: 'happy',
          pose: 'idle',
        },
      ],
    },
  ];

  const scene2Props: PropItem[] = [
    {
      id: 'prop_crystal_2',
      type: 'crystal',
      name: 'Starlight Keystone',
      x: 50,
      y: 68,
      scale: 1.25,
      rotation: 0,
      floating: true,
    },
    {
      id: 'prop_moon_2',
      type: 'moon',
      name: 'Celestial Orb',
      x: 78,
      y: 18,
      scale: 1.4,
      rotation: 0,
      floating: true,
    },
  ];

  const scene3Chars: CharacterPuppet[] = [
    {
      id: 'char_robot_3',
      name: 'Geary Unit-7',
      type: 'robot',
      x: 35,
      y: 67,
      scale: 1.1,
      rotation: 0,
      flipX: false,
      emotion: 'happy',
      pose: 'cheering',
      speechText: 'MISSION SUCCESS: The Tale Trove is illuminated!',
      keyframes: [
        {
          id: 'kf_rob_3a',
          time: 0,
          x: 30,
          y: 68,
          scale: 1.1,
          rotation: 0,
          flipX: false,
          emotion: 'curious',
          pose: 'walking',
        },
        {
          id: 'kf_rob_3b',
          time: 0.6,
          x: 42,
          y: 66,
          scale: 1.15,
          rotation: 0,
          flipX: false,
          emotion: 'happy',
          pose: 'cheering',
        },
      ],
    },
    {
      id: 'char_fox_3',
      name: 'Rusty the Fox',
      type: 'fox',
      x: 65,
      y: 67,
      scale: 1.1,
      rotation: 0,
      flipX: true,
      emotion: 'happy',
      pose: 'jumping',
      speechText: 'And our adventure has only just begun!',
      keyframes: [
        {
          id: 'kf_fox_3a',
          time: 0,
          x: 70,
          y: 67,
          scale: 1.1,
          rotation: 0,
          flipX: true,
          emotion: 'happy',
          pose: 'jumping',
        },
        {
          id: 'kf_fox_3b',
          time: 1.0,
          x: 60,
          y: 67,
          scale: 1.1,
          rotation: 0,
          flipX: true,
          emotion: 'happy',
          pose: 'cheering',
        },
      ],
    },
  ];

  const scene3Props: PropItem[] = [
    {
      id: 'prop_chest_3',
      type: 'chest',
      name: 'The Golden Trove Chest',
      x: 50,
      y: 72,
      scale: 1.2,
      rotation: 0,
    },
    {
      id: 'prop_star_3',
      type: 'star',
      name: 'Shining Beacon',
      x: 50,
      y: 35,
      scale: 1.5,
      rotation: 45,
      floating: true,
    },
  ];

  const scenes: Scene[] = [
    {
      id: 'scene_1',
      title: 'Scene 1: The Whispering Woods',
      duration: 6,
      background: 'twilight-forest',
      weatherEffect: 'fireflies',
      characters: scene1Chars,
      props: scene1Props,
      narration:
        'In the heart of the twilight woods, Rusty the Fox noticed a wandering star descending toward the earth.',
      bgMusic: 'fable',
    },
    {
      id: 'scene_2',
      title: 'Scene 2: The Celestial Observatory',
      duration: 5,
      background: 'celestial-observatory',
      weatherEffect: 'stardust',
      characters: scene2Chars,
      props: scene2Props,
      narration:
        'High atop the ancient spire, Merlinia summoned the starlight crystals to guide the beacon.',
      bgMusic: 'mystery',
    },
    {
      id: 'scene_3',
      title: 'Scene 3: The Golden Trove',
      duration: 5,
      background: 'cozy-cottage',
      weatherEffect: 'fireflies',
      characters: scene3Chars,
      props: scene3Props,
      narration:
        'Together at last, the companions discovered the secret of the Tale Trove: wonder was made to be shared.',
      bgMusic: 'adventure',
    },
  ];

  return {
    id: 'proj_talestore_1',
    title: 'The Fox and the Wandering Star',
    description:
      'A whimsical fairy tale animation crafted in the Tale Trove Animation Studio.',
    fps: 24,
    scenes,
    activeSceneId: 'scene_1',
  };
}

/**
 * Preloaded fable projects
 */
export const PRESET_STORIES = [
  {
    title: 'The Fox and the Wandering Star',
    genre: 'Fantasy Fable',
    description: 'A magical woodland adventure featuring Rusty the Fox and Archimedes the Owl.',
    generator: getDefaultProject,
  },
  {
    title: "The Clockwork Knight's Quest",
    genre: 'Steampunk',
    description: 'Sir Sterling and Geary Unit-7 restore electricity to the neon dragon towers.',
    generator: () => {
      const proj = getDefaultProject();
      proj.id = 'proj_steampunk';
      proj.title = "The Clockwork Knight's Quest";
      proj.scenes[0].title = 'Scene 1: Neon Foundry';
      proj.scenes[0].background = 'cyberpunk-neon';
      proj.scenes[0].weatherEffect = 'stardust';
      proj.scenes[0].bgMusic = 'adventure';
      proj.scenes[0].narration = 'Inside the neon foundry, the clockwork knight geared up for an epic rescue.';
      proj.scenes[0].characters = [
        createDefaultCharacter('knight', 30, 68, 'Sir Sterling'),
        createDefaultCharacter('robot', 65, 68, 'Geary Unit-7'),
      ];
      return proj;
    },
  },
  {
    title: 'The Coral Kingdom Lullaby',
    genre: 'Undersea Whimsy',
    description: 'A soothing aquatic journey with Prince Tad and the bioluminescent pearl.',
    generator: () => {
      const proj = getDefaultProject();
      proj.id = 'proj_coral';
      proj.title = 'The Coral Kingdom Lullaby';
      proj.scenes[0].title = 'Scene 1: The Sunken Palace';
      proj.scenes[0].background = 'deep-ocean';
      proj.scenes[0].weatherEffect = 'bubbles';
      proj.scenes[0].bgMusic = 'lullaby';
      proj.scenes[0].narration = 'Beneath the calm tides, gentle bubbles carried songs across the coral reef.';
      proj.scenes[0].characters = [
        createDefaultCharacter('frog', 35, 65, 'Prince Tad'),
        createDefaultCharacter('pixie', 60, 45, 'Marina the Pixie'),
      ];
      return proj;
    },
  },
];
