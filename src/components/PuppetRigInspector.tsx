/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Sparkles,
  Smile,
  Move,
  MessageSquare,
  Clock,
  Music,
  Trash2,
  FlipHorizontal,
  CloudSun,
} from 'lucide-react';
import {
  BackgroundTheme,
  CharacterPuppet,
  CharacterType,
  EmotionType,
  PoseType,
  PropItem,
  Scene,
  WeatherEffect,
  BgMusicMood,
} from '../types/animation';

interface PuppetRigInspectorProps {
  scene: Scene;
  selectedEntityId: string | null;
  selectedEntityType: 'character' | 'prop' | 'scene' | null;
  onUpdateCharacter: (charId: string, updates: Partial<CharacterPuppet>) => void;
  onDeleteCharacter: (charId: string) => void;
  onUpdateProp: (propId: string, updates: Partial<PropItem>) => void;
  onDeleteProp: (propId: string) => void;
  onUpdateScene: (updates: Partial<Scene>) => void;
}

export const PuppetRigInspector: React.FC<PuppetRigInspectorProps> = ({
  scene,
  selectedEntityId,
  selectedEntityType,
  onUpdateCharacter,
  onDeleteCharacter,
  onUpdateProp,
  onDeleteProp,
  onUpdateScene,
}) => {
  const selectedChar =
    selectedEntityType === 'character'
      ? scene.characters.find((c) => c.id === selectedEntityId)
      : null;

  const selectedProp =
    selectedEntityType === 'prop'
      ? scene.props.find((p) => p.id === selectedEntityId)
      : null;

  // Character Inspector
  if (selectedChar) {
    const emotions: { type: EmotionType; label: string; icon: string }[] = [
      { type: 'happy', label: 'Happy', icon: '😊' },
      { type: 'curious', label: 'Curious', icon: '🧐' },
      { type: 'surprised', label: 'Surprised', icon: '😲' },
      { type: 'dramatic', label: 'Dramatic', icon: '🎭' },
      { type: 'talking', label: 'Talking', icon: '💬' },
      { type: 'sleepy', label: 'Sleepy', icon: '😴' },
    ];

    const poses: { type: PoseType; label: string }[] = [
      { type: 'idle', label: 'Idle' },
      { type: 'walking', label: 'Walk' },
      { type: 'jumping', label: 'Jump' },
      { type: 'casting', label: 'Cast Magic' },
      { type: 'cheering', label: 'Cheer' },
      { type: 'bowing', label: 'Bow' },
    ];

    const types: CharacterType[] = [
      'fox',
      'knight',
      'owl',
      'robot',
      'wizard',
      'pixie',
      'cat',
      'frog',
    ];

    return (
      <div
        data-testid="puppet-inspector"
        className="w-80 shrink-0 bg-neutral-900 border-l border-neutral-800 flex flex-col h-full overflow-y-auto p-4 text-xs select-none"
      >
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              ★
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm">Puppet Rig</h3>
              <p className="text-[11px] text-neutral-400">Character Properties</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onDeleteCharacter(selectedChar.id)}
            title="Remove character from scene"
            className="p-1.5 text-neutral-400 hover:text-rose-400 rounded-lg hover:bg-neutral-800 transition"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Name input */}
        <div className="mb-4">
          <label className="block text-neutral-400 mb-1 font-medium">Name</label>
          <input
            type="text"
            value={selectedChar.name}
            onChange={(e) =>
              onUpdateCharacter(selectedChar.id, { name: e.target.value })
            }
            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-amber-500 text-xs"
          />
        </div>

        {/* Character Puppet Archetype */}
        <div className="mb-4">
          <label className="block text-neutral-400 mb-1 font-medium">
            Puppet Archetype
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {types.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => onUpdateCharacter(selectedChar.id, { type: t })}
                className={`py-1.5 px-2 rounded-lg capitalize font-medium text-center transition ${
                  selectedChar.type === t
                    ? 'bg-amber-500 text-black font-bold'
                    : 'bg-neutral-950 text-neutral-300 hover:bg-neutral-800'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Emotion Pills */}
        <div className="mb-4">
          <label className="block text-neutral-400 mb-1 font-medium flex items-center gap-1.5">
            <Smile className="w-3.5 h-3.5 text-amber-400" />
            <span>Expression / Emotion</span>
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {emotions.map((emo) => (
              <button
                key={emo.type}
                type="button"
                onClick={() =>
                  onUpdateCharacter(selectedChar.id, { emotion: emo.type })
                }
                className={`flex items-center gap-1 py-1.5 px-2 rounded-lg font-medium transition ${
                  selectedChar.emotion === emo.type
                    ? 'bg-amber-500 text-black font-semibold'
                    : 'bg-neutral-950 text-neutral-300 hover:bg-neutral-800'
                }`}
              >
                <span>{emo.icon}</span>
                <span className="truncate">{emo.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Pose / Animation Cycle */}
        <div className="mb-4">
          <label className="block text-neutral-400 mb-1 font-medium flex items-center gap-1.5">
            <Move className="w-3.5 h-3.5 text-amber-400" />
            <span>Pose & Action</span>
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {poses.map((p) => (
              <button
                key={p.type}
                type="button"
                onClick={() =>
                  onUpdateCharacter(selectedChar.id, { pose: p.type })
                }
                className={`py-1.5 px-2 rounded-lg font-medium text-center transition ${
                  selectedChar.pose === p.type
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'bg-neutral-950 text-neutral-300 hover:bg-neutral-800'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Speech Bubble Dialogue */}
        <div className="mb-4">
          <label className="block text-neutral-400 mb-1 font-medium flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
            <span>Dialogue Speech Bubble</span>
          </label>
          <textarea
            rows={2}
            value={selectedChar.speechText || ''}
            onChange={(e) =>
              onUpdateCharacter(selectedChar.id, { speechText: e.target.value })
            }
            placeholder="Type character line..."
            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-white focus:outline-none focus:border-amber-500 text-xs resize-none"
          />
        </div>

        {/* Transformation Sliders */}
        <div className="space-y-3 pt-2 border-t border-neutral-800/80">
          <div className="flex items-center justify-between">
            <span className="text-neutral-400">Scale</span>
            <div className="flex items-center gap-2 w-32">
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.05"
                value={selectedChar.scale}
                onChange={(e) =>
                  onUpdateCharacter(selectedChar.id, {
                    scale: parseFloat(e.target.value),
                  })
                }
                className="w-full accent-amber-500"
              />
              <span className="w-8 font-mono text-[10px] text-right">
                {selectedChar.scale.toFixed(1)}x
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-neutral-400">Rotation</span>
            <div className="flex items-center gap-2 w-32">
              <input
                type="range"
                min="-180"
                max="180"
                step="5"
                value={selectedChar.rotation}
                onChange={(e) =>
                  onUpdateCharacter(selectedChar.id, {
                    rotation: parseInt(e.target.value, 10),
                  })
                }
                className="w-full accent-amber-500"
              />
              <span className="w-8 font-mono text-[10px] text-right">
                {selectedChar.rotation}°
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-neutral-400">Flip Facing</span>
            <button
              type="button"
              onClick={() =>
                onUpdateCharacter(selectedChar.id, {
                  flipX: !selectedChar.flipX,
                })
              }
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition ${
                selectedChar.flipX
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-neutral-950 text-neutral-400 border-neutral-800'
              }`}
            >
              <FlipHorizontal className="w-3.5 h-3.5" />
              <span>{selectedChar.flipX ? 'Flipped Left' : 'Facing Right'}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Prop Inspector
  if (selectedProp) {
    return (
      <div
        data-testid="prop-inspector"
        className="w-80 shrink-0 bg-neutral-900 border-l border-neutral-800 flex flex-col h-full overflow-y-auto p-4 text-xs select-none"
      >
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold">
              ✦
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm">Prop Item</h3>
              <p className="text-[11px] text-neutral-400">{selectedProp.name}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onDeleteProp(selectedProp.id)}
            title="Delete prop"
            className="p-1.5 text-neutral-400 hover:text-rose-400 rounded-lg hover:bg-neutral-800 transition"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        <div className="mb-4">
          <label className="block text-neutral-400 mb-1 font-medium">Name</label>
          <input
            type="text"
            value={selectedProp.name}
            onChange={(e) =>
              onUpdateProp(selectedProp.id, { name: e.target.value })
            }
            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-sky-500 text-xs"
          />
        </div>

        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-neutral-400">Scale</span>
            <div className="flex items-center gap-2 w-32">
              <input
                type="range"
                min="0.5"
                max="2.5"
                step="0.05"
                value={selectedProp.scale}
                onChange={(e) =>
                  onUpdateProp(selectedProp.id, {
                    scale: parseFloat(e.target.value),
                  })
                }
                className="w-full accent-sky-500"
              />
              <span className="w-8 font-mono text-[10px] text-right">
                {selectedProp.scale.toFixed(1)}x
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-neutral-400">Floating Physics</span>
            <input
              type="checkbox"
              checked={!!selectedProp.floating}
              onChange={(e) =>
                onUpdateProp(selectedProp.id, { floating: e.target.checked })
              }
              className="accent-sky-500 w-4 h-4 rounded"
            />
          </div>
        </div>
      </div>
    );
  }

  // Scene / Background Inspector (Default when nothing else is selected)
  const bgThemes: { id: BackgroundTheme; label: string; desc: string }[] = [
    {
      id: 'twilight-forest',
      label: 'Twilight Forest',
      desc: 'Moonlit pine groves & fireflies',
    },
    {
      id: 'celestial-observatory',
      label: 'Observatory',
      desc: 'Cosmic star nebula & spires',
    },
    {
      id: 'cyberpunk-neon',
      label: 'Cyber Neon',
      desc: 'Glowing cityscape & wet reflections',
    },
    {
      id: 'cozy-cottage',
      label: 'Cozy Cottage',
      desc: 'Warm fireplace & timber beams',
    },
    {
      id: 'dragon-peak',
      label: 'Dragon Peak',
      desc: 'Jagged crags & volcanic dusk',
    },
    {
      id: 'deep-ocean',
      label: 'Deep Coral',
      desc: 'Aquatic sunbeams & bubbles',
    },
  ];

  const weatherEffects: WeatherEffect[] = [
    'none',
    'fireflies',
    'stardust',
    'leaves',
    'rain',
    'bubbles',
  ];

  const musicMoods: BgMusicMood[] = [
    'fable',
    'adventure',
    'lullaby',
    'mystery',
    'none',
  ];

  return (
    <div
      data-testid="scene-inspector"
      className="w-80 shrink-0 bg-neutral-900 border-l border-neutral-800 flex flex-col h-full overflow-y-auto p-4 text-xs select-none"
    >
      <div className="pb-3 border-b border-neutral-800 mb-4 flex items-center gap-2">
        <div className="w-6 h-6 rounded-md bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
          🎬
        </div>
        <div>
          <h3 className="font-semibold text-white text-sm">Scene Settings</h3>
          <p className="text-[11px] text-neutral-400">Atmosphere & Narration</p>
        </div>
      </div>

      {/* Scene Title */}
      <div className="mb-4">
        <label className="block text-neutral-400 mb-1 font-medium">
          Scene Title
        </label>
        <input
          type="text"
          value={scene.title}
          onChange={(e) => onUpdateScene({ title: e.target.value })}
          className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-amber-500 text-xs"
        />
      </div>

      {/* Duration */}
      <div className="mb-4">
        <label className="block text-neutral-400 mb-1 font-medium flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <span>Scene Duration</span>
        </label>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min="3"
            max="15"
            step="1"
            value={scene.duration}
            onChange={(e) =>
              onUpdateScene({ duration: parseInt(e.target.value, 10) })
            }
            className="flex-1 accent-amber-500"
          />
          <span className="font-mono text-white text-xs font-semibold">
            {scene.duration}s
          </span>
        </div>
      </div>

      {/* Background Theme Selector */}
      <div className="mb-4">
        <label className="block text-neutral-400 mb-1.5 font-medium flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Background Environment</span>
        </label>
        <div className="space-y-1.5">
          {bgThemes.map((bg) => (
            <button
              key={bg.id}
              type="button"
              onClick={() => onUpdateScene({ background: bg.id })}
              className={`w-full text-left p-2 rounded-lg border transition ${
                scene.background === bg.id
                  ? 'bg-amber-500/10 border-amber-500/60 text-white'
                  : 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:border-neutral-700'
              }`}
            >
              <div className="font-semibold text-xs">{bg.label}</div>
              <div className="text-[10px] text-neutral-400">{bg.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Weather Particle FX */}
      <div className="mb-4">
        <label className="block text-neutral-400 mb-1.5 font-medium flex items-center gap-1.5">
          <CloudSun className="w-3.5 h-3.5 text-amber-400" />
          <span>Weather FX Overlay</span>
        </label>
        <div className="grid grid-cols-3 gap-1.5">
          {weatherEffects.map((we) => (
            <button
              key={we}
              type="button"
              onClick={() => onUpdateScene({ weatherEffect: we })}
              className={`py-1.5 px-2 rounded-lg capitalize font-medium text-center transition ${
                scene.weatherEffect === we
                  ? 'bg-amber-500 text-black font-semibold'
                  : 'bg-neutral-950 text-neutral-300 hover:bg-neutral-800'
              }`}
            >
              {we}
            </button>
          ))}
        </div>
      </div>

      {/* Background Music Mood */}
      <div className="mb-4">
        <label className="block text-neutral-400 mb-1.5 font-medium flex items-center gap-1.5">
          <Music className="w-3.5 h-3.5 text-amber-400" />
          <span>Ambient Music Mood</span>
        </label>
        <div className="grid grid-cols-3 gap-1.5">
          {musicMoods.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => onUpdateScene({ bgMusic: m })}
              className={`py-1.5 px-2 rounded-lg capitalize font-medium text-center transition ${
                scene.bgMusic === m
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'bg-neutral-950 text-neutral-300 hover:bg-neutral-800'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Narration Voiceover Script */}
      <div className="mb-2">
        <label className="block text-neutral-400 mb-1 font-medium">
          Voiceover Narration Script
        </label>
        <textarea
          rows={3}
          value={scene.narration}
          onChange={(e) => onUpdateScene({ narration: e.target.value })}
          placeholder="Enter narration for this scene..."
          className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-500 text-xs resize-none"
        />
        <p className="text-[10px] text-neutral-500 mt-1">
          Narrated automatically during playback using speech synthesis.
        </p>
      </div>
    </div>
  );
};
