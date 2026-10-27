/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Sparkles,
  Tv,
  Download,
  Volume2,
  VolumeX,
  ChevronDown,
  Wand2,
  BookOpen,
} from 'lucide-react';
import { AnimationProject } from '../types/animation';
import { PRESET_STORIES } from '../utils/animationEngine';

interface StudioHeaderProps {
  project: AnimationProject;
  onUpdateTitle: (newTitle: string) => void;
  onOpenTheater: () => void;
  onOpenExport: () => void;
  onOpenAIGenerator: () => void;
  onLoadPreset: (index: number) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  mobilePanel?: 'stage' | 'library' | 'inspector';
  onSelectMobilePanel?: (panel: 'stage' | 'library' | 'inspector') => void;
}

export const StudioHeader: React.FC<StudioHeaderProps> = ({
  project,
  onUpdateTitle,
  onOpenTheater,
  onOpenExport,
  onOpenAIGenerator,
  onLoadPreset,
  isMuted,
  onToggleMute,
  mobilePanel = 'stage',
  onSelectMobilePanel,
}) => {
  const [showPresetMenu, setShowPresetMenu] = useState(false);

  return (
    <header className="h-14 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between px-4 z-30 select-none">
      {/* Brand & Project Info */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-300 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <span className="text-black font-extrabold text-sm tracking-tighter">
              TT
            </span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-white text-sm tracking-tight bg-gradient-to-r from-amber-200 via-amber-400 to-amber-100 bg-clip-text text-transparent">
                Tale Trove
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                STUDIO
              </span>
            </div>
          </div>
        </div>

        <div className="h-5 w-px bg-neutral-800 mx-1 hidden sm:block" />

        {/* Project Title Input */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={project.title}
            onChange={(e) => onUpdateTitle(e.target.value)}
            className="bg-transparent hover:bg-neutral-900 focus:bg-neutral-900 border border-transparent hover:border-neutral-800 focus:border-amber-500 rounded-lg px-2.5 py-1 text-sm font-semibold text-neutral-200 focus:text-white transition w-48 sm:w-64 truncate focus:outline-none"
            title="Click to rename story"
          />

          {/* Preset Selector Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowPresetMenu(!showPresetMenu)}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs text-neutral-300 transition"
              title="Load Preset Fairy Tale"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden md:inline">Presets</span>
              <ChevronDown className="w-3 h-3 text-neutral-400" />
            </button>

            {showPresetMenu && (
              <div className="absolute top-full left-0 mt-1.5 w-60 bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl p-1.5 z-50">
                <div className="px-2 py-1 text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
                  Preset Stories
                </div>
                {PRESET_STORIES.map((preset, idx) => (
                  <button
                    key={preset.title}
                    type="button"
                    onClick={() => {
                      onLoadPreset(idx);
                      setShowPresetMenu(false);
                    }}
                    className="w-full text-left p-2 rounded-lg hover:bg-neutral-800 text-xs text-neutral-200 hover:text-white transition flex flex-col"
                  >
                    <span className="font-medium">{preset.title}</span>
                    <span className="text-[10px] text-amber-400">
                      {preset.genre}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Action Buttons */}
      <div className="flex items-center gap-2">
        {/* Sound Toggle */}
        <button
          type="button"
          onClick={onToggleMute}
          className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-850 transition"
          title={isMuted ? 'Unmute Audio & Narration' : 'Mute Audio & Narration'}
        >
          {isMuted ? (
            <VolumeX className="w-4 h-4 text-neutral-500" />
          ) : (
            <Volume2 className="w-4 h-4 text-amber-400" />
          )}
        </button>

        {/* AI Storycraft Button */}
        <button
          type="button"
          onClick={onOpenAIGenerator}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600/30 to-indigo-600/30 hover:from-purple-600/50 hover:to-indigo-600/50 border border-purple-500/40 text-purple-200 hover:text-white text-xs font-semibold shadow-sm transition active:scale-95"
          title="Generate Full Animation with Gemini AI"
        >
          <Wand2 className="w-3.5 h-3.5 text-purple-400" />
          <span>AI Storycraft</span>
        </button>

        {/* Export Button */}
        <button
          type="button"
          onClick={onOpenExport}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 text-xs font-semibold shadow-sm transition active:scale-95"
          title="Export Project JSON or SVG Snapshot"
        >
          <Download className="w-3.5 h-3.5 text-neutral-400" />
          <span className="hidden sm:inline">Export</span>
        </button>

        {/* Mobile View Switcher */}
        <div className="flex md:hidden items-center bg-neutral-900 rounded-lg p-0.5 border border-neutral-800">
          <button
            type="button"
            onClick={() => onSelectMobilePanel?.('library')}
            className={`px-2 py-1 rounded text-[11px] font-semibold transition ${
              mobilePanel === 'library'
                ? 'bg-amber-500 text-black'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Library
          </button>
          <button
            type="button"
            onClick={() => onSelectMobilePanel?.('stage')}
            className={`px-2 py-1 rounded text-[11px] font-semibold transition ${
              mobilePanel === 'stage'
                ? 'bg-amber-500 text-black'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Stage
          </button>
          <button
            type="button"
            onClick={() => onSelectMobilePanel?.('inspector')}
            className={`px-2 py-1 rounded text-[11px] font-semibold transition ${
              mobilePanel === 'inspector'
                ? 'bg-amber-500 text-black'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Props
          </button>
        </div>

        {/* Theater / Fullscreen Mode */}
        <button
          type="button"
          onClick={onOpenTheater}
          data-testid="theater-mode-btn"
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black text-xs font-bold shadow-lg shadow-amber-500/25 transition active:scale-95"
          title="Play in Fullscreen Theater Mode"
        >
          <Tv className="w-4 h-4 fill-current" />
          <span className="hidden sm:inline">Theater</span>
        </button>
      </div>
    </header>
  );
};
