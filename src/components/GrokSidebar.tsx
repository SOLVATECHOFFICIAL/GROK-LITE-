/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Film,
  Plus,
  Play,
  Sparkles,
  Search,
  Video,
  Clock,
  Layers,
  Cpu,
  MessageSquare,
  Check,
} from 'lucide-react';
import { ChatConversation, VideoProject } from '../types/video';
import {
  getPixazoConfig,
  setPixazoApiKey,
  setEngineMode,
  EngineMode,
} from '../utils/pixazoClient';

interface GrokSidebarProps {
  conversations: ChatConversation[];
  activeConversationId: string;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  isOpenOnMobile?: boolean;
  onCloseMobile?: () => void;
  activeChatVideos: VideoProject[];
  onSelectVideo: (video: VideoProject) => void;
}

export const GrokSidebar: React.FC<GrokSidebarProps> = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewChat,
  isOpenOnMobile = false,
  onCloseMobile,
  activeChatVideos,
  onSelectVideo,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'chats' | 'videos'>('chats');
  const [showApiModal, setShowApiModal] = useState<boolean>(false);

  // Engine configuration state
  const [pixazoKey, setPixazoKeyState] = useState<string>('');
  const [engineModeState, setEngineModeState] = useState<EngineMode>('canvas-director');
  const [keySavedNotification, setKeySavedNotification] = useState<boolean>(false);

  useEffect(() => {
    const config = getPixazoConfig();
    setPixazoKeyState(config.apiKey);
    setEngineModeState(config.engineMode);
  }, [showApiModal]);

  const filteredConversations = conversations.filter((c) => {
    return (
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.messages.some((m) => m.content.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  const filteredVideos = activeChatVideos.filter((v) => {
    return (
      v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.prompt.toLowerCase().includes(searchQuery.toLowerCase())
    );
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

      {/* New Film Project Button (Preserves all existing chats) */}
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
          <Plus className="w-4 h-4 text-amber-400" />
          <span>New Film Project</span>
        </button>
      </div>

      {/* Navigation Switcher: Conversations vs Reel Videos */}
      <div className="px-3 mb-2">
        <div className="grid grid-cols-2 gap-1 p-1 bg-neutral-900/90 rounded-xl border border-neutral-800 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('chats')}
            className={`py-1.5 px-2 rounded-lg font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'chats'
                ? 'bg-neutral-800 text-white shadow'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
            <span>Chats ({conversations.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('videos')}
            className={`py-1.5 px-2 rounded-lg font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'videos'
                ? 'bg-neutral-800 text-white shadow'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Film className="w-3.5 h-3.5 text-sky-400" />
            <span>Reel ({activeChatVideos.length}/100)</span>
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="px-3 mb-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={activeTab === 'chats' ? 'Search conversations...' : 'Search reel clips...'}
            className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-700"
          />
        </div>
      </div>

      {/* Main List Area */}
      <div className="flex-1 flex flex-col min-h-0 px-3 overflow-y-auto space-y-2 pb-4">
        {activeTab === 'chats' ? (
          /* CONVERSATIONS LIST (Never deleted, grab any conversation) */
          filteredConversations.length === 0 ? (
            <div className="p-6 text-center text-neutral-500 text-xs flex flex-col items-center">
              <MessageSquare className="w-8 h-8 text-neutral-700 mb-2" />
              <span>No conversations match.</span>
            </div>
          ) : (
            filteredConversations.map((c) => {
              const isActive = c.id === activeConversationId;
              const videoCount = c.messages.filter((m) => Boolean(m.generatedVideo)).length;

              return (
                <div
                  key={c.id}
                  onClick={() => {
                    onSelectConversation(c.id);
                    if (onCloseMobile) onCloseMobile();
                  }}
                  className={`group p-2.5 rounded-xl border transition cursor-pointer flex flex-col gap-1.5 ${
                    isActive
                      ? 'bg-neutral-900 border-amber-500/60 ring-1 ring-amber-500/20'
                      : 'bg-neutral-900/60 border-neutral-850 hover:bg-neutral-850 hover:border-neutral-750'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-bold text-white text-xs truncate max-w-[170px]">
                      {c.title}
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold bg-neutral-800 text-amber-400 shrink-0">
                      {videoCount}/100
                    </span>
                  </div>

                  <p className="text-[10px] text-neutral-400 line-clamp-1">
                    {c.messages[c.messages.length - 1]?.content || 'Empty session'}
                  </p>

                  <div className="flex items-center justify-between text-[9px] text-neutral-500 font-mono pt-1 border-t border-neutral-800/40">
                    <span className="flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      {new Date(c.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span>{c.messages.length} messages</span>
                  </div>
                </div>
              );
            })
          )
        ) : (
          /* REEL VIDEOS IN ACTIVE CHAT (Up to 100 videos) */
          filteredVideos.length === 0 ? (
            <div className="p-6 text-center text-neutral-500 text-xs flex flex-col items-center">
              <Video className="w-8 h-8 text-neutral-700 mb-2" />
              <span>No videos generated yet.</span>
              <span className="text-[10px] text-neutral-600 mt-1">
                Type GENERATE in chat to produce up to 100 videos in this session!
              </span>
            </div>
          ) : (
            filteredVideos.map((vid, idx) => (
              <div
                key={vid.id}
                onClick={() => {
                  onSelectVideo(vid);
                  if (onCloseMobile) onCloseMobile();
                }}
                className="group p-2.5 rounded-xl bg-neutral-900/80 border border-neutral-800/80 hover:border-amber-500/50 hover:bg-neutral-850 cursor-pointer transition flex flex-col gap-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white text-xs truncate max-w-[170px]">
                    #{idx + 1} {vid.title}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-200 font-bold font-mono">
                    {vid.aspectRatio}
                  </span>
                </div>

                <p className="text-[10px] text-neutral-400 line-clamp-1">
                  {vid.prompt}
                </p>

                <div className="flex items-center justify-between text-[9px] text-neutral-500 font-mono pt-1 border-t border-neutral-800/50">
                  <span className="flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />
                    {vid.totalDuration.toFixed(1)}s
                  </span>
                  <span>{vid.scenes.length} shots</span>
                </div>
              </div>
            ))
          )
        )}
      </div>

      {/* Engine Status & Footer */}
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
            100 Videos / Chat
          </span>
          <span className="font-mono text-neutral-400">MP4 Cinema</span>
        </div>
      </div>

      {/* Engine Status Modal */}
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
                      MP4 Export Ready
                    </span>
                  </h3>
                  <p className="text-[11px] text-neutral-400">
                    Host up to 100 videos in a single chat with MP4 downloads
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

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-1.5">
                <span className="font-bold text-neutral-300 text-xs flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Chat & MP4 Architecture
                </span>
                <p className="text-neutral-400 text-[11px] leading-relaxed">
                  • <strong>100 Videos per Chat:</strong> Continue storylines, produce sequels, and build comprehensive reels in a single session.<br />
                  • <strong>Meaning-Based Chat Naming:</strong> Conversations are automatically titled by the semantic essence of the opening concept.<br />
                  • <strong>Strictly MP4 Downloads:</strong> All footage exports in pristine .mp4 container format.
                </p>
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
