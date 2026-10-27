/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Users,
  Sparkles,
  Film,
  Package,
  Wand2,
  Plus,
  Copy,
  Trash2,
  BookOpen,
  Loader2,
} from 'lucide-react';
import {
  CharacterType,
  PropType,
  Scene,
} from '../types/animation';
import { PRESET_STORIES } from '../utils/animationEngine';

interface LibrarySidebarProps {
  scenes: Scene[];
  activeSceneId: string;
  onSelectScene: (sceneId: string) => void;
  onAddScene: () => void;
  onDuplicateScene: (sceneId: string) => void;
  onDeleteScene: (sceneId: string) => void;
  onAddCharacter: (type: CharacterType) => void;
  onAddProp: (type: PropType) => void;
  onLoadPreset: (index: number) => void;
  onGenerateWithAI: (prompt: string, genre: 'Fable' | 'Sci-Fi' | 'Adventure' | 'Undersea' | 'Bedtime') => Promise<void>;
  isGeneratingAI: boolean;
}

export const LibrarySidebar: React.FC<LibrarySidebarProps> = ({
  scenes,
  activeSceneId,
  onSelectScene,
  onAddScene,
  onDuplicateScene,
  onDeleteScene,
  onAddCharacter,
  onAddProp,
  onLoadPreset,
  onGenerateWithAI,
  isGeneratingAI,
}) => {
  const [activeTab, setActiveTab] = useState<'scenes' | 'puppets' | 'props' | 'ai' | 'presets'>('scenes');
  const [aiPrompt, setAiPrompt] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<'Fable' | 'Sci-Fi' | 'Adventure' | 'Undersea' | 'Bedtime'>('Fable');

  const puppetCards: { type: CharacterType; name: string; desc: string; icon: string }[] = [
    { type: 'fox', name: 'Rusty the Fox', desc: 'Curious woodland hero', icon: '🦊' },
    { type: 'knight', name: 'Sir Sterling', desc: 'Brave armored defender', icon: '🛡️' },
    { type: 'owl', name: 'Archimedes', desc: 'Wise feathered scholar', icon: '🦉' },
    { type: 'robot', name: 'Geary Unit-7', desc: 'Clockwork retro automaton', icon: '🤖' },
    { type: 'wizard', name: 'Merlinia', desc: 'Starweaver mage', icon: '🧙' },
    { type: 'pixie', name: 'Luma Whisper', desc: 'Winged fairy sprite', icon: '🧚' },
    { type: 'cat', name: 'Barnaby', desc: 'Dapper detective cat', icon: '🐱' },
    { type: 'frog', name: 'Prince Tad', desc: 'Crowned royal amphibian', icon: '🐸' },
  ];

  const propCards: { type: PropType; name: string; icon: string }[] = [
    { type: 'star', name: 'Starlit Shard', icon: '⭐' },
    { type: 'crystal', name: 'Arcane Crystal', icon: '💎' },
    { type: 'tree', name: 'Forest Oak', icon: '🌲' },
    { type: 'chest', name: 'Trove Chest', icon: '📦' },
    { type: 'campfire', name: 'Campfire', icon: '🔥' },
    { type: 'potion', name: 'Dream Potion', icon: '🧪' },
    { type: 'wand', name: 'Magic Wand', icon: '🪄' },
    { type: 'moon', name: 'Crescent Moon', icon: '🌙' },
    { type: 'cloud', name: 'Mist Cloud', icon: '☁️' },
    { type: 'flower', name: 'Glow Blossom', icon: '🌸' },
  ];

  const handleAiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim() || isGeneratingAI) return;
    await onGenerateWithAI(aiPrompt, selectedGenre);
    setAiPrompt('');
  };

  return (
    <div
      data-testid="library-sidebar"
      className="w-72 shrink-0 bg-neutral-900 border-r border-neutral-800 flex flex-col h-full text-xs select-none"
    >
      {/* Navigation Tabs */}
      <div className="flex border-b border-neutral-800 bg-neutral-950/80 p-1 gap-1">
        <button
          type="button"
          onClick={() => setActiveTab('scenes')}
          className={`flex-1 py-1.5 px-2 rounded-lg font-medium flex items-center justify-center gap-1.5 transition ${
            activeTab === 'scenes'
              ? 'bg-amber-500 text-black font-semibold shadow'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
          }`}
          title="Scenes Storyboard"
        >
          <Film className="w-3.5 h-3.5" />
          <span>Scenes</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('puppets')}
          className={`flex-1 py-1.5 px-2 rounded-lg font-medium flex items-center justify-center gap-1.5 transition ${
            activeTab === 'puppets'
              ? 'bg-amber-500 text-black font-semibold shadow'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
          }`}
          title="Character Puppets"
        >
          <Users className="w-3.5 h-3.5" />
          <span>Puppets</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('props')}
          className={`flex-1 py-1.5 px-2 rounded-lg font-medium flex items-center justify-center gap-1.5 transition ${
            activeTab === 'props'
              ? 'bg-amber-500 text-black font-semibold shadow'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
          }`}
          title="Stage Props"
        >
          <Package className="w-3.5 h-3.5" />
          <span>Props</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ai')}
          className={`py-1.5 px-2 rounded-lg font-medium flex items-center justify-center gap-1 transition ${
            activeTab === 'ai'
              ? 'bg-purple-600 text-white font-semibold shadow'
              : 'text-purple-400 hover:text-purple-300 hover:bg-purple-950/40'
          }`}
          title="AI Story Generator"
        >
          <Wand2 className="w-3.5 h-3.5" />
          <span>AI</span>
        </button>
      </div>

      {/* Tab Contents */}
      <div className="flex-1 overflow-y-auto p-3">
        {/* TAB 1: Scenes Storyboard */}
        {activeTab === 'scenes' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1">
              <span className="text-neutral-400 font-semibold tracking-wider uppercase text-[10px]">
                Storyboard ({scenes.length})
              </span>
              <button
                type="button"
                onClick={onAddScene}
                className="flex items-center gap-1 px-2 py-1 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 font-medium transition"
              >
                <Plus className="w-3 h-3" />
                <span>Add Scene</span>
              </button>
            </div>

            <div className="space-y-2">
              {scenes.map((scene, idx) => {
                const isActive = scene.id === activeSceneId;
                return (
                  <div
                    key={scene.id}
                    onClick={() => onSelectScene(scene.id)}
                    className={`p-2.5 rounded-xl border cursor-pointer transition relative group ${
                      isActive
                        ? 'bg-amber-500/10 border-amber-500/60 shadow-md ring-1 ring-amber-500/30'
                        : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-white truncate max-w-[140px]">
                        {scene.title}
                      </span>
                      <span className="font-mono text-[10px] text-amber-400">
                        {scene.duration}s
                      </span>
                    </div>

                    <p className="text-[10px] text-neutral-400 line-clamp-1 mb-2">
                      {scene.narration || 'No narration entered'}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-neutral-500 pt-1 border-t border-neutral-800/80">
                      <span>
                        {scene.characters.length} characters • {scene.props.length} props
                      </span>

                      {/* Scene quick actions */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDuplicateScene(scene.id);
                          }}
                          title="Duplicate Scene"
                          className="p-1 hover:text-white"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                        {scenes.length > 1 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteScene(scene.id);
                            }}
                            title="Delete Scene"
                            className="p-1 hover:text-rose-400"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: Character Puppets */}
        {activeTab === 'puppets' && (
          <div className="space-y-3">
            <div className="pb-1">
              <span className="text-neutral-400 font-semibold tracking-wider uppercase text-[10px]">
                Click puppet to add to scene
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {puppetCards.map((p) => (
                <button
                  key={p.type}
                  type="button"
                  onClick={() => onAddCharacter(p.type)}
                  className="flex flex-col items-center text-center p-3 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-amber-500/50 hover:bg-neutral-800/60 transition group active:scale-95"
                >
                  <span className="text-3xl mb-1.5 group-hover:scale-110 transition transform">
                    {p.icon}
                  </span>
                  <span className="font-semibold text-white text-xs truncate w-full">
                    {p.name.split(' ')[0]}
                  </span>
                  <span className="text-[10px] text-neutral-400 truncate w-full">
                    {p.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: Stage Props */}
        {activeTab === 'props' && (
          <div className="space-y-3">
            <div className="pb-1">
              <span className="text-neutral-400 font-semibold tracking-wider uppercase text-[10px]">
                Click prop to place on stage
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {propCards.map((prop) => (
                <button
                  key={prop.type}
                  type="button"
                  onClick={() => onAddProp(prop.type)}
                  className="flex flex-col items-center text-center p-3 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-sky-500/50 hover:bg-neutral-800/60 transition group active:scale-95"
                >
                  <span className="text-2xl mb-1.5 group-hover:scale-110 transition transform">
                    {prop.icon}
                  </span>
                  <span className="font-medium text-white text-xs truncate w-full">
                    {prop.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: AI Storycraft Generator */}
        {activeTab === 'ai' && (
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-950/60 to-indigo-950/60 border border-purple-800/40">
              <div className="flex items-center gap-2 mb-1.5">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <h4 className="font-bold text-white text-xs">AI Story Director</h4>
              </div>
              <p className="text-[10px] text-purple-200/80 leading-relaxed">
                Describe a tale and Tale Trove AI will script, design, and animate
                complete scenes with dialogue, music, and keyframes!
              </p>
            </div>

            <form onSubmit={handleAiSubmit} className="space-y-3">
              <div>
                <label className="block text-neutral-400 mb-1 font-medium">
                  Story Idea / Prompt
                </label>
                <textarea
                  rows={3}
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="e.g. A robotic gardener who discovers a singing crystal in an ancient greenhouse..."
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-purple-500 text-xs resize-none"
                />
              </div>

              <div>
                <label className="block text-neutral-400 mb-1.5 font-medium">
                  Genre Style
                </label>
                <div className="grid grid-cols-3 gap-1">
                  {(['Fable', 'Sci-Fi', 'Adventure', 'Undersea', 'Bedtime'] as const).map(
                    (g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setSelectedGenre(g)}
                        className={`py-1 rounded text-[11px] font-medium transition ${
                          selectedGenre === g
                            ? 'bg-purple-600 text-white font-semibold'
                            : 'bg-neutral-950 text-neutral-400 hover:bg-neutral-800'
                        }`}
                      >
                        {g}
                      </button>
                    )
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={isGeneratingAI || !aiPrompt.trim()}
                className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white font-semibold flex items-center justify-center gap-2 shadow-lg transition active:scale-95"
              >
                {isGeneratingAI ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Storycrafting...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" />
                    <span>Generate Animation</span>
                  </>
                )}
              </button>
            </form>

            {/* Quick Inspiration Prompts */}
            <div className="pt-2 border-t border-neutral-800">
              <span className="text-[10px] text-neutral-500 font-semibold uppercase tracking-wider block mb-2">
                Quick Prompts
              </span>
              <div className="space-y-1.5">
                {[
                  'The Fox who dreamed of catching a falling star',
                  'A Clockwork Knight looking for a lost melody',
                  'The deep sea frog prince in the bioluminescent trench',
                ].map((idea) => (
                  <button
                    key={idea}
                    type="button"
                    onClick={() => setAiPrompt(idea)}
                    className="w-full text-left p-2 rounded-lg bg-neutral-950 hover:bg-neutral-800/80 border border-neutral-800/80 text-[11px] text-neutral-300 transition"
                  >
                    "{idea}"
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: Presets (Accessible from bottom bar or tab) */}
        {activeTab === 'presets' && (
          <div className="space-y-3">
            <div className="pb-1">
              <span className="text-neutral-400 font-semibold tracking-wider uppercase text-[10px]">
                Preloaded Tale Trove Projects
              </span>
            </div>

            <div className="space-y-2">
              {PRESET_STORIES.map((preset, idx) => (
                <button
                  key={preset.title}
                  type="button"
                  onClick={() => onLoadPreset(idx)}
                  className="w-full text-left p-3 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-amber-500/50 hover:bg-neutral-800/60 transition group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-white text-xs group-hover:text-amber-400 transition">
                      {preset.title}
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
                      {preset.genre}
                    </span>
                  </div>
                  <p className="text-[10px] text-neutral-400">
                    {preset.description}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Preset stories quick link in footer */}
      <div className="p-2 border-t border-neutral-800 bg-neutral-950/60">
        <button
          type="button"
          onClick={() => setActiveTab('presets')}
          className="w-full py-1.5 px-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 flex items-center justify-center gap-1.5 transition text-[11px] font-medium"
        >
          <BookOpen className="w-3.5 h-3.5 text-amber-400" />
          <span>Browse Fable Presets</span>
        </button>
      </div>
    </div>
  );
};
