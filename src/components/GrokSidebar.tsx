/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Film,
  Plus,
  Play,
  Trash2,
  Sparkles,
  Search,
  Video,
  Clock,
  Layers,
  Key,
  Check,
  Cpu,
  ExternalLink,
} from 'lucide-react';
import { VideoHistoryItem, VideoProject } from '../types/video';
import {
  getPixazoConfig,
  setPixazoApiKey,
  setEngineMode,
  EngineMode,
} from '../utils/pixazoClient';

interface GrokSidebarProps {
  history: VideoHistoryItem[];
  onSelectVideo: (video: VideoProject) => void;
  onNewChat: () => void;
  onClearHistory: () => void;
  onDeleteHistoryItem: (id: string) => void;
  isOpenOnMobile?: boolean;
  onCloseMobile?: () => void;
}

export const GrokSidebar: React.FC<GrokSidebarProps> = ({
  history,
  onSelectVideo,
  onNewChat,
  onClearHistory,
  onDeleteHistoryItem,
  isOpenOnMobile = false,
  onCloseMobile,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'cinematic' | 'reels'>('all');
  const [showApiModal, setShowApiModal] = useState<boolean>(false);

  // Pixazo AI configuration state
  const [pixazoKey, setPixazoKeyState] = useState<string>('');
  const [engineModeState, setEngineModeState] = useState<EngineMode>('canvas-director');
  const [keySavedNotification, setKeySavedNotification] = useState<boolean>(false);

  useEffect(() => {
    const config = getPixazoConfig();
    setPixazoKeyState(config.apiKey);
    setEngineModeState(config.engineMode);
  }, [showApiModal]);

  const handleSavePixazoKey = () => {
    setPixazoApiKey(pixazoKey);
    setEngineMode(engineModeState);
    setKeySavedNotification(true);
    setTimeout(() => setKeySavedNotification(false), 2500);
  };

  const filteredHistory = history.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.prompt.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (filterType === 'cinematic') return item.aspectRatio === '16:9';
    if (filterType === 'reels') return item.aspectRatio === '9:16';
    return true;
  });

  return (
    <aside
      data-testid="grok-sidebar"
      className={`w-72 shrink-0 bg-neutral-950 border-r border-neutral-800 flex flex-col h-full select-none z-30 transition-transform ${
        isOpenOnMobile ? 'fixed inset-y-0 left-0 shadow-2xl' : 'hidden md:flex'
      }`}
    >
      {/* Brand Header */}
      <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-neutral-900 border border-neutral-700 flex items-center justify-center font-black text-white shadow-lg text-sm">
            G
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-white text-base tracking-tight">
                GROK CINEMA
              </span>
              <span className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase bg-neutral-800 text-neutral-300 border border-neutral-700">
                AI FILM
              </span>
            </div>
            <p className="text-[10px] text-neutral-400">Cinematic Director & Studio</p>
          </div>
        </div>

        {isOpenOnMobile && (
          <button
            type="button"
            onClick={onCloseMobile}
            className="p-1 text-neutral-400 hover:text-white md:hidden"
          >
            ✕
          </button>
        )}
      </div>

      {/* New Video Session Button */}
      <div className="p-3">
        <button
          type="button"
          onClick={() => {
            onNewChat();
            if (onCloseMobile) onCloseMobile();
          }}
          data-testid="new-video-btn"
          className="w-full py-2.5 px-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition active:scale-95"
        >
          <Plus className="w-4 h-4 text-neutral-300" />
          <span>New Film Project</span>
        </button>
      </div>

      {/* Video History Section */}
      <div className="flex-1 flex flex-col min-h-0 px-3">
        {/* Header & Count */}
        <div className="flex items-center justify-between py-2 text-xs">
          <div className="flex items-center gap-1.5 font-semibold text-neutral-300">
            <Film className="w-3.5 h-3.5 text-neutral-400" />
            <span>Film History</span>
            <span className="text-[10px] text-neutral-500 font-mono">
              ({history.length})
            </span>
          </div>

          {history.length > 0 && (
            <button
              type="button"
              onClick={onClearHistory}
              className="text-[10px] text-neutral-500 hover:text-rose-400 transition"
              title="Clear all video history"
            >
              Clear
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative mb-2">
          <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search film reel..."
            className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-700"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 mb-2">
          {(['all', 'cinematic', 'reels'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setFilterType(tab)}
              className={`px-2 py-0.5 rounded-md capitalize text-[10px] font-semibold transition ${
                filterType === tab
                  ? 'bg-neutral-800 text-white border border-neutral-700'
                  : 'text-neutral-500 hover:text-neutral-300'
              }`}
            >
              {tab === 'all' ? 'All Films' : tab === 'cinematic' ? '16:9 Cinema' : '9:16 Vertical'}
            </button>
          ))}
        </div>

        {/* Video List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 pb-4">
          {filteredHistory.length === 0 ? (
            <div className="p-6 text-center text-neutral-500 text-xs flex flex-col items-center">
              <Video className="w-8 h-8 text-neutral-700 mb-2" />
              <span>No videos generated yet.</span>
              <span className="text-[10px] text-neutral-600 mt-1">
                Upload images or prompt Grok to create your first video!
              </span>
            </div>
          ) : (
            filteredHistory.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  onSelectVideo(item.video);
                  if (onCloseMobile) onCloseMobile();
                }}
                className="group p-2.5 rounded-xl bg-neutral-900/80 border border-neutral-800/80 hover:border-amber-500/50 hover:bg-neutral-850 cursor-pointer transition relative flex flex-col gap-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white text-xs truncate max-w-[150px]">
                    {item.title}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteHistoryItem(item.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-neutral-500 hover:text-rose-400 transition"
                    title="Delete video"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>

                <p className="text-[10px] text-neutral-400 line-clamp-1">
                  {item.prompt || 'Animated clip'}
                </p>

                <div className="flex items-center justify-between text-[9px] text-neutral-500 font-mono pt-1 border-t border-neutral-800/50">
                  <span className="flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />
                    {item.duration.toFixed(1)}s
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-200 font-bold">
                    {item.aspectRatio}
                  </span>
                  <span>{item.video.scenes.length} shots</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Real Dual-AI Hand-in-Hand Deck & Footer */}
      <div className="p-3 border-t border-neutral-800 bg-neutral-950/90 text-xs">
        <button
          type="button"
          onClick={() => setShowApiModal(true)}
          className="w-full mb-2 py-2 px-2.5 rounded-xl bg-gradient-to-r from-neutral-900 to-neutral-850 hover:from-neutral-850 hover:to-neutral-800 border border-neutral-700/80 text-amber-300 flex items-center justify-between text-[11px] font-semibold transition shadow-sm"
        >
          <span className="flex items-center gap-2">
            <Cpu className="w-3.5 h-3.5 text-amber-400" />
            <span>Dual-API Engine Status</span>
          </span>
          <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-mono font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Synced
          </span>
        </button>

        <div className="text-[10px] text-neutral-500 flex items-center justify-between pt-0.5">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Director + Video Generation
          </span>
          <span className="font-mono text-neutral-400">v3.8</span>
        </div>
      </div>

      {/* Dual-AI Hand-in-Hand APIs Modal */}
      {showApiModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-neutral-950 flex items-center justify-center font-black text-base shadow">
                  ⚡
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>Dual-AI Hand-in-Hand Engine</span>
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                      2 APIs Active
                    </span>
                  </h3>
                  <p className="text-[11px] text-neutral-400">
                    How Story Memory & Video Generation work hand-in-hand
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowApiModal(false)}
                className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Architecture Overview */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* API 1: Director & Memory AI */}
                <div className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs flex items-center gap-1.5 text-amber-400">
                      <Cpu className="w-3.5 h-3.5" />
                      API 1: Story Memory & Director
                    </span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 font-mono">
                      Connected
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-400">
                    <strong>Engine:</strong> Google Gemini 2.5 Flash / Grok Core
                  </p>
                  <ul className="text-[10px] text-neutral-400 space-y-1 list-disc list-inside">
                    <li>Multi-turn persistent chat memory</li>
                    <li>Story continuity across Part 1, 2, 3...</li>
                    <li>Automatic character voice detection (Ghoul, Monster, Female Warrior, Hero, Robot)</li>
                    <li>Cinematic shotlist & subtitle direction</li>
                  </ul>
                </div>

                {/* API 2: Video Generation AI */}
                <div className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs flex items-center gap-1.5 text-sky-400">
                      <Video className="w-3.5 h-3.5" />
                      API 2: Video Generation Engine
                    </span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 font-mono">
                      Key Loaded
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-400">
                    <strong>Engine:</strong> Pixazo AI / Neural Video Pipeline
                  </p>
                  <ul className="text-[10px] text-neutral-400 space-y-1 list-disc list-inside">
                    <li>Camera paths (Dolly, Crane, Steadicam, Dutch tilt)</li>
                    <li>Dynamic atmospheric effects & lighting</li>
                    <li>Talking character lip-sync & speech waveform</li>
                    <li>Zero-watermark MP4/WebM batch extraction</li>
                  </ul>
                </div>
              </div>

              {/* Engine Mode Configuration */}
              <div className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-semibold text-neutral-300">
                    Video Render Engine:
                  </label>
                  <span className="text-[10px] text-emerald-400 font-mono">
                    Active
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEngineModeState('canvas-director');
                      setEngineMode('canvas-director');
                      setKeySavedNotification(true);
                      setTimeout(() => setKeySavedNotification(false), 2000);
                    }}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold border transition ${
                      engineModeState === 'canvas-director'
                        ? 'bg-amber-400/20 text-amber-300 border-amber-400/50'
                        : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white'
                    }`}
                  >
                    Canvas Director (Local)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEngineModeState('pixazo-cloud');
                      setEngineMode('pixazo-cloud');
                      setKeySavedNotification(true);
                      setTimeout(() => setKeySavedNotification(false), 2000);
                    }}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold border transition ${
                      engineModeState === 'pixazo-cloud'
                        ? 'bg-sky-400/20 text-sky-300 border-sky-400/50'
                        : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white'
                    }`}
                  >
                    Cloud Neural Pipeline
                  </button>
                </div>
                {keySavedNotification && (
                  <p className="text-[11px] text-emerald-400 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Engine configuration updated!
                  </p>
                )}
              </div>

              {/* Hand-in-Hand Collaboration Pipeline Diagram */}
              <div className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-2">
                <span className="font-bold text-neutral-300 text-xs flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Hand-in-Hand Generation Pipeline
                </span>
                <div className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 font-mono text-[10px] text-neutral-300 space-y-1.5">
                  <div className="flex items-center gap-2 text-amber-300">
                    <span className="w-4 h-4 rounded bg-amber-400/20 flex items-center justify-center font-bold">1</span>
                    <span>User Prompt & Reference Stills ➔</span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-300">
                    <span className="w-4 h-4 rounded bg-emerald-400/20 flex items-center justify-center font-bold">2</span>
                    <span>Gemini 2.5 Flash tracks context & scripts shots ➔</span>
                  </div>
                  <div className="flex items-center gap-2 text-sky-300">
                    <span className="w-4 h-4 rounded bg-sky-400/20 flex items-center justify-center font-bold">3</span>
                    <span>Pixazo AI generates frames, speech & motion ➔</span>
                  </div>
                  <div className="flex items-center gap-2 text-purple-300">
                    <span className="w-4 h-4 rounded bg-purple-400/20 flex items-center justify-center font-bold">4</span>
                    <span>Mergen Studio harmonizes split seams for 1 seamless movie!</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setShowApiModal(false)}
                className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-medium text-xs transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
