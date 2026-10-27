/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import {
  Send,
  Upload,
  Sparkles,
  Layers,
  Wand2,
  Film,
  PlusCircle,
  Clock,
  Download,
  Loader2,
  Cpu,
  Info,
} from 'lucide-react';
import { AspectRatio, ChatMessage, VideoProject } from '../types/video';
import { GrokVideoPlayer } from './GrokVideoPlayer';
import { CreatingVideoCard } from './CreatingVideoCard';

interface GrokChatAreaProps {
  messages: ChatMessage[];
  onSendMessage: (
    prompt: string,
    images: string[],
    aspectRatio: AspectRatio
  ) => Promise<void>;
  isProcessing: boolean;
  isGeneratingVideo?: boolean;
  onOpenMobileSidebar?: () => void;
  onContinueScene?: (project: VideoProject) => void;
  onOpenMergen?: () => void;
  videoCountInChat?: number;
  conversationTitle?: string;
  onDownloadMp4?: () => void;
  isDownloadingMp4?: boolean;
  mp4Progress?: number;
  mp4Status?: string;
}

export const GrokChatArea: React.FC<GrokChatAreaProps> = ({
  messages,
  onSendMessage,
  isProcessing,
  isGeneratingVideo = false,
  onOpenMobileSidebar,
  onContinueScene,
  onOpenMergen,
  videoCountInChat = 0,
  conversationTitle = 'Cinematic Film Session',
  onDownloadMp4,
  isDownloadingMp4 = false,
  mp4Progress = 0,
  mp4Status = '',
}) => {
  const [inputText, setInputText] = useState('');
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [showTwoAiInfo, setShowTwoAiInfo] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  // Handle multi-image upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    fileList.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const result = uploadEvent.target?.result as string;
        if (result) {
          setUploadedImages((prev) => [...prev, result]);
        }
      };
      reader.readAsDataURL(file);
    });

    if (e.target) e.target.value = '';
  };

  const handleRemoveImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!inputText.trim() && uploadedImages.length === 0) || isProcessing) return;

    const promptToSend =
      inputText.trim() ||
      (uploadedImages.length > 0
        ? `GENERATE: Direct cinematic sequence from these ${uploadedImages.length} uploaded reference stills with camera motion, voice narration, and clean subtitles.`
        : 'Hello');

    const imagesToSend = [...uploadedImages];
    setInputText('');
    setUploadedImages([]);

    await onSendMessage(promptToSend, imagesToSend, aspectRatio);

    setTimeout(() => {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleQuickPrompt = (prompt: string, defaultAspect: AspectRatio = '16:9') => {
    setInputText(prompt);
    setAspectRatio(defaultAspect);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-neutral-900 text-neutral-100 select-none overflow-hidden min-w-0">
      {/* Top Header Bar */}
      <div className="h-14 border-b border-neutral-800 bg-neutral-950 px-3 sm:px-5 flex items-center justify-between shrink-0 min-w-0 gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <button
            type="button"
            onClick={onOpenMobileSidebar}
            className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5 md:hidden shrink-0"
          >
            <Film className="w-4 h-4 text-amber-400" />
            <span>Reel</span>
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xs sm:text-sm text-white tracking-tight truncate">
                {conversationTitle}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-800 text-amber-400 font-mono font-bold shrink-0">
                {videoCountInChat}/100 Videos
              </span>
            </div>
            <p className="text-[10px] text-neutral-400 truncate hidden sm:block">
              Host up to 100 videos in this session • MP4 download only
            </p>
          </div>
        </div>

        {/* Top Actions: ONE Download MP4 Button (Single & Batch) + Mergen + Info */}
        <div className="flex items-center gap-2 shrink-0">
          {/* JUST ONE DOWNLOAD BUTTON FOR BATCH AND NORMAL SINGLE IN CHAT (STRICTLY MP4) */}
          {videoCountInChat > 0 && onDownloadMp4 && (
            <button
              type="button"
              disabled={isDownloadingMp4}
              onClick={onDownloadMp4}
              className="py-1.5 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-neutral-950 font-bold text-xs flex items-center gap-1.5 transition active:scale-95 shadow-md"
              title={
                videoCountInChat === 1
                  ? 'Download movie strictly as MP4'
                  : `Download all ${videoCountInChat} videos as unified MP4 movie`
              }
            >
              {isDownloadingMp4 ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span className="hidden sm:inline">Exporting MP4 ({mp4Progress}%)...</span>
                  <span className="sm:hidden">{mp4Progress}%</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>
                    {videoCountInChat === 1
                      ? 'Download MP4'
                      : `Download MP4 (${videoCountInChat} Clips)`}
                  </span>
                </>
              )}
            </button>
          )}

          {onOpenMergen && (
            <button
              type="button"
              onClick={onOpenMergen}
              className="py-1.5 px-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-850 text-neutral-300 hover:text-white border border-neutral-800 font-semibold text-xs flex items-center gap-1.5 transition shadow-sm"
              title="Open Mergen Studio for seam customization"
            >
              <Film className="w-3.5 h-3.5 text-neutral-400" />
              <span className="hidden md:inline">Seam Studio</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowTwoAiInfo(!showTwoAiInfo)}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
            title="Session and video engine details"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* MP4 Download Active Banner */}
      {isDownloadingMp4 && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 flex items-center justify-between text-xs font-mono text-amber-300 shrink-0">
          <div className="flex items-center gap-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
            <span>{mp4Status || `Rendering MP4 (${mp4Progress}%)...`}</span>
          </div>
          <span className="font-bold">{mp4Progress}%</span>
        </div>
      )}

      {/* Two-AI Architecture Info Dropdown / Banner */}
      {showTwoAiInfo && (
        <div className="p-3 bg-neutral-950 border-b border-neutral-800 text-xs text-neutral-300 animate-fadeIn shrink-0">
          <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="font-bold text-white flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-amber-400" />
                <span>Grok Cinema Production Capabilities:</span>
              </div>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                • <strong>Up to 100 Videos per Chat:</strong> All generated clips are retained in this conversation.<br />
                • <strong>Auto Meaning-Based Titles:</strong> The chat is automatically titled from the conceptual meaning of your prompt.<br />
                • <strong>Strictly MP4:</strong> All downloads export as clean, high-definition .mp4 files.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowTwoAiInfo(false)}
              className="px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-white text-[11px] font-medium shrink-0"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* Chat Messages Feed */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-6 min-w-0">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto p-4">
            <div className="w-12 h-12 rounded-2xl bg-neutral-900 border border-neutral-700 text-white flex items-center justify-center font-black text-xl shadow-xl mb-3">
              G
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight mb-1">
              GROK CINEMA
            </h1>
            <p className="text-xs text-neutral-400 mb-6 max-w-sm">
              Generate up to <strong className="text-amber-400">100 videos</strong> in this single chat. Start with <strong className="text-white">GENERATE</strong> to direct a movie.
            </p>

            {/* Concise Starter Chips */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full text-left">
              <button
                type="button"
                onClick={() => handleQuickPrompt('GENERATE a 4-shot sci-fi sequence with anamorphic flares')}
                className="p-3 rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-xs font-semibold text-white transition flex items-center gap-2"
              >
                <Film className="w-4 h-4 text-amber-400 shrink-0" />
                <span>GENERATE Sci-Fi Sequence</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickPrompt('GENERATE cyberpunk warrior in neon rain')}
                className="p-3 rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-xs font-semibold text-white transition flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-sky-400 shrink-0" />
                <span>GENERATE Cyberpunk Warrior</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickPrompt('Wassup! What kind of scenes can we direct together?')}
                className="p-3 rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-xs font-semibold text-neutral-300 hover:text-white transition flex items-center gap-2"
              >
                <Wand2 className="w-4 h-4 text-purple-400 shrink-0" />
                <span>Chat with Cinema Director</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickPrompt('GENERATE 9:16 vertical phone reel', '9:16')}
                className="p-3 rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-xs font-semibold text-white transition flex items-center gap-2"
              >
                <Layers className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>GENERATE 9:16 Vertical Reel</span>
              </button>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`w-full flex ${
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {msg.role === 'user' ? (
                /* User Prompt and Uploaded Images on the Right */
                <div className="flex flex-col items-end max-w-xl space-y-2 min-w-0">
                  {/* Uploaded Images Gallery on the Right */}
                  {msg.uploadedImages && msg.uploadedImages.length > 0 && (
                    <div className="flex flex-wrap justify-end gap-1.5 p-1.5 rounded-2xl bg-neutral-950/80 border border-neutral-800">
                      {msg.uploadedImages.map((src, i) => (
                        <img
                          key={`msg-img-${i}`}
                          src={src}
                          alt="uploaded reference"
                          className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-xl border border-white/10 shadow"
                        />
                      ))}
                    </div>
                  )}

                  {/* Prompt Text Bubble on the Right */}
                  <div className="px-4 py-2.5 rounded-3xl rounded-tr-xs bg-neutral-800/90 border border-neutral-700/60 text-white text-xs sm:text-sm font-medium shadow-md leading-relaxed text-right break-words max-w-full">
                    {msg.content}
                  </div>
                </div>
              ) : (
                /* AI Reply (Concise Text + Clean Video Player) */
                <div className="flex flex-col items-start w-full max-w-3xl space-y-2 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-md bg-neutral-900 border border-neutral-700 text-white flex items-center justify-center font-bold text-[10px]">
                      G
                    </div>
                    <span className="font-bold text-xs text-white">Grok Cinema</span>
                  </div>

                  {msg.content && (
                    <div className="px-4 py-2 rounded-2xl rounded-tl-xs bg-neutral-950 border border-neutral-800 text-neutral-200 text-xs sm:text-sm font-medium shadow-md break-words max-w-full">
                      {msg.content}
                    </div>
                  )}

                  {msg.generatedVideo && (
                    <div className="w-full min-w-0">
                      <GrokVideoPlayer
                        project={msg.generatedVideo}
                        autoPlay={false}
                        onContinueScene={onContinueScene}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}

        {/* Video Generation Progress Card vs Normal Chat Thinking */}
        {isProcessing && (
          <div className="flex flex-col items-start w-full max-w-md animate-fadeIn">
            {isGeneratingVideo ? (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-5 h-5 rounded-md bg-neutral-900 border border-neutral-700 text-white flex items-center justify-center font-bold text-[10px]">
                    G
                  </div>
                  <span className="font-bold text-xs text-white">Grok Cinema</span>
                </div>
                <CreatingVideoCard stage="Rendering film" />
              </>
            ) : (
              <div className="flex items-center gap-2.5 px-4 py-3 bg-neutral-900 border border-neutral-800 rounded-2xl text-xs text-neutral-300">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span>Grok Cinema is thinking...</span>
              </div>
            )}
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Bottom Input Area */}
      <div className="p-3 sm:p-4 bg-neutral-950 border-t border-neutral-800 shrink-0 min-w-0">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-2">
          {/* Uploaded Images Preview Strip (NO 'clear' text anywhere!) */}
          {uploadedImages.length > 0 && (
            <div className="p-2 bg-neutral-900 rounded-xl border border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-2 overflow-x-auto py-1">
                <span className="text-[10px] font-mono text-neutral-300 font-bold px-2 py-0.5 rounded bg-neutral-800 shrink-0">
                  {uploadedImages.length} Stills
                </span>
                {uploadedImages.map((src, idx) => (
                  <div key={`thumb-${idx}`} className="relative shrink-0 group">
                    <img
                      src={src}
                      alt="upload thumbnail"
                      className="w-10 h-10 object-cover rounded-lg border border-neutral-700"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute -top-1 -right-1 w-4 h-4 bg-rose-600 rounded-full text-white flex items-center justify-center text-[9px] shadow"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setUploadedImages([])}
                className="text-[10px] text-neutral-400 hover:text-rose-400 font-medium px-2 shrink-0"
              >
                Remove all
              </button>
            </div>
          )}

          {/* Main Input Row */}
          <div className="flex items-end gap-2 bg-neutral-900 border border-neutral-800 rounded-2xl p-2 focus-within:border-neutral-600 transition shadow-lg">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-neutral-300 hover:text-white transition shrink-0"
              title="Upload reference stills"
            >
              <Upload className="w-5 h-5 text-neutral-300" />
            </button>

            <textarea
              rows={1}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder={
                uploadedImages.length > 0
                  ? `Type GENERATE with ${uploadedImages.length} stills attached (up to 100 videos in this chat)...`
                  : 'Chat with director, or type GENERATE: [scene prompt] (up to 100 videos in this chat)...'
              }
              className="flex-1 bg-transparent border-0 text-white text-xs sm:text-sm focus:outline-none resize-none py-2 px-1 max-h-32"
            />

            <button
              type="submit"
              disabled={isProcessing || (!inputText.trim() && uploadedImages.length === 0)}
              className="p-2.5 rounded-xl bg-white hover:bg-neutral-200 disabled:opacity-30 text-black font-bold transition active:scale-95 shrink-0 shadow-lg shadow-white/10"
              title="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
