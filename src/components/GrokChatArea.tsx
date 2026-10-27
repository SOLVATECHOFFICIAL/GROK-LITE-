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
  Sliders,
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
  onOpenMobileSidebar?: () => void;
  onContinueScene?: (project: VideoProject) => void;
  onOpenMergen?: () => void;
  videoCountInChat?: number;
}

export const GrokChatArea: React.FC<GrokChatAreaProps> = ({
  messages,
  onSendMessage,
  isProcessing,
  onOpenMobileSidebar,
  onContinueScene,
  onOpenMergen,
  videoCountInChat = 0,
}) => {
  const [inputText, setInputText] = useState('');
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [showTwoAiInfo, setShowTwoAiInfo] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  // Handle multi-image upload (unlimited reference frames)
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
        ? `Direct cinematic movie from these ${uploadedImages.length} uploaded reference images with camera movements, character voices, and clean subtitles.`
        : 'Generate cinematic movie sequence.');

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
      <div className="h-12 border-b border-neutral-800 bg-neutral-950 px-3 sm:px-5 flex items-center justify-between shrink-0 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={onOpenMobileSidebar}
            className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5 md:hidden"
          >
            <Film className="w-4 h-4 text-amber-400" />
            <span>Reel</span>
          </button>
          <span className="font-extrabold text-xs sm:text-sm text-white tracking-tight truncate">
            GROK CINEMA
          </span>
          <span className="hidden sm:inline text-[9px] px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 font-mono">
            Dual-AI Director & Video Engine
          </span>
        </div>

        {/* Top Actions: Mergen Studio + Two-AI Architecture info */}
        <div className="flex items-center gap-2 shrink-0">
          {onOpenMergen && (
            <button
              type="button"
              onClick={onOpenMergen}
              className={`py-1.5 px-3 rounded-xl font-bold text-xs flex items-center gap-1.5 transition active:scale-95 shadow-md ${
                videoCountInChat >= 1
                  ? 'bg-amber-400 hover:bg-amber-300 text-neutral-950'
                  : 'bg-neutral-900 hover:bg-neutral-850 text-neutral-400 border border-neutral-800'
              }`}
              title="Open Mergen Studio to join all clips in this conversation into 1 single seamless video"
            >
              <Film className="w-3.5 h-3.5" />
              <span>Mergen {videoCountInChat > 0 ? `(${videoCountInChat} clips)` : 'Studio'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowTwoAiInfo(!showTwoAiInfo)}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
            title="How the 2 APIs work together (Director AI + Video AI)"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Two-AI Architecture Info Dropdown / Banner */}
      {showTwoAiInfo && (
        <div className="p-3 bg-neutral-950 border-b border-neutral-800 text-xs text-neutral-300 animate-fadeIn shrink-0">
          <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="font-bold text-white flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-amber-400" />
                <span>2-AI Hand-in-Hand Architecture:</span>
              </div>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                <strong>1. Director & Memory AI (Gemini 2.5 Flash):</strong> Remembers your full storyline, character voices (ghoul, monster, female warrior, male hero), and reference stills across turns.<br />
                <strong>2. Video Visual Engine (Pixazo AI / Canvas Pipeline):</strong> Generates the visual frame movement, camera paths, anamorphic flares, and extracts real MP4/WebM video without watermarks.
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
          <div className="h-full flex flex-col items-center justify-center text-center max-w-xl mx-auto p-4">
            <div className="w-14 h-14 rounded-2xl bg-neutral-900 border border-neutral-700 text-white flex items-center justify-center font-black text-2xl shadow-2xl mb-4">
              G
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-2">
              GROK CINEMA
            </h1>
            <p className="text-xs sm:text-sm text-neutral-400 mb-6 leading-relaxed">
              AI Film Production Studio. Direct cinematic scenes, orchestrate shot lists,
              upload reference stills, and generate real downloadable movies with clean subtitles, character voice acting, and zero watermarks.
            </p>

            {/* Quick Starter Chips */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full">
              <button
                type="button"
                onClick={() =>
                  handleQuickPrompt(
                    'Direct a 4-shot cinematic sci-fi sequence with wide establishing drone shots, anamorphic flares, and orchestral sub-bass',
                    '16:9'
                  )
                }
                className="p-3 rounded-xl bg-neutral-950/80 hover:bg-neutral-850 border border-neutral-800 hover:border-neutral-600 text-left transition group"
              >
                <div className="flex items-center gap-2 font-semibold text-white text-xs mb-1">
                  <Film className="w-4 h-4 text-neutral-300 group-hover:text-white" />
                  <span>Cinematic Sci-Fi Sequence</span>
                </div>
                <p className="text-[11px] text-neutral-400">
                  Wide drone establishing, anamorphic flares, and orchestral sub-bass.
                </p>
              </button>

              <button
                type="button"
                onClick={() =>
                  handleQuickPrompt(
                    'Cyberpunk female warrior standing on a neon-lit futuristic rooftop in Tokyo during heavy rain, holographic billboards reflecting in puddles, cinematic slow motion.',
                    '16:9'
                  )
                }
                className="p-3 rounded-xl bg-neutral-950/80 hover:bg-neutral-850 border border-neutral-800 hover:border-neutral-600 text-left transition group"
              >
                <div className="flex items-center gap-2 font-semibold text-white text-xs mb-1">
                  <Sparkles className="w-4 h-4 text-neutral-300 group-hover:text-white" />
                  <span>Cyberpunk Female Warrior</span>
                </div>
                <p className="text-[11px] text-neutral-400">
                  Neon rain, reflective puddles, and female protagonist voice acting.
                </p>
              </button>

              <button
                type="button"
                onClick={() =>
                  handleQuickPrompt(
                    'Ancient crypt where a shadow ghoul awakens from sarcophagus, low-angle creeping camera, green mist, raspy ghoul whispers.',
                    '16:9'
                  )
                }
                className="p-3 rounded-xl bg-neutral-950/80 hover:bg-neutral-850 border border-neutral-800 hover:border-neutral-600 text-left transition group"
              >
                <div className="flex items-center gap-2 font-semibold text-white text-xs mb-1">
                  <Wand2 className="w-4 h-4 text-neutral-300 group-hover:text-white" />
                  <span>Ghoul Awakening in Crypt</span>
                </div>
                <p className="text-[11px] text-neutral-400">
                  Subterranean mist, creeping lens, and raspy ghoul voice acting.
                </p>
              </button>

              <button
                type="button"
                onClick={() =>
                  handleQuickPrompt(
                    'Create a 9:16 vertical cinematic reel with steadicam tracking shots, moody lighting, and shallow depth of field',
                    '9:16'
                  )
                }
                className="p-3 rounded-xl bg-neutral-950/80 hover:bg-neutral-850 border border-neutral-800 hover:border-neutral-600 text-left transition group"
              >
                <div className="flex items-center gap-2 font-semibold text-white text-xs mb-1">
                  <Layers className="w-4 h-4 text-neutral-300 group-hover:text-white" />
                  <span>Vertical Phone Reel (9:16)</span>
                </div>
                <p className="text-[11px] text-neutral-400">
                  Steadicam tracking, shallow depth of field, and phone vertical format.
                </p>
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

                  {/* Concise Reply Text - No Too Much Text */}
                  {msg.content && (
                    <div className="px-4 py-2 rounded-2xl rounded-tl-xs bg-neutral-950 border border-neutral-800 text-neutral-200 text-xs sm:text-sm font-medium shadow-md break-words max-w-full">
                      {msg.content}
                    </div>
                  )}

                  {/* Embedded Video Player */}
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

        {/* Video Generation Progress Card matching user's ChatGPT/Grok screenshot */}
        {isProcessing && (
          <div className="flex flex-col items-start w-full max-w-md animate-fadeIn">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-5 h-5 rounded-md bg-neutral-900 border border-neutral-700 text-white flex items-center justify-center font-bold text-[10px]">
                G
              </div>
              <span className="font-bold text-xs text-white">Grok Cinema</span>
            </div>
            <CreatingVideoCard stage="Creating video" />
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Bottom Input Area */}
      <div className="p-3 sm:p-4 bg-neutral-950 border-t border-neutral-800 shrink-0 min-w-0">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-2">
          {/* Uploaded Images Preview Strip */}
          {uploadedImages.length > 0 && (
            <div className="p-2.5 bg-neutral-900 rounded-xl border border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-2 overflow-x-auto py-1">
                <span className="text-[10px] font-mono text-neutral-300 font-bold px-2 py-0.5 rounded bg-neutral-800 shrink-0">
                  {uploadedImages.length} Stills Attached
                </span>
                {uploadedImages.map((src, idx) => (
                  <div key={`thumb-${idx}`} className="relative shrink-0 group">
                    <img
                      src={src}
                      alt="upload thumbnail"
                      className="w-12 h-12 object-cover rounded-lg border border-neutral-700"
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
                Clear All
              </button>
            </div>
          )}

          {/* Main Input Row */}
          <div className="flex items-end gap-2 bg-neutral-900 border border-neutral-800 rounded-2xl p-2 focus-within:border-neutral-600 transition shadow-lg">
            {/* Hidden File Picker */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />

            {/* Upload Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-neutral-300 hover:text-white transition shrink-0"
              title="Upload reference stills or storyboard frames (unlimited)"
            >
              <Upload className="w-5 h-5 text-neutral-300" />
            </button>

            {/* Prompt Textarea */}
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
                  ? `Direct film scene with ${uploadedImages.length} reference stills (e.g. "Anamorphic dolly shot, dusk...")`
                  : 'Ask Grok Cinema or prompt: "Opening shot of neon rain-slicked boulevard, 35mm anamorphic, dolly push..."'
              }
              className="flex-1 bg-transparent border-0 text-white text-xs sm:text-sm focus:outline-none resize-none py-2 px-1 max-h-32"
            />

            {/* Send Button */}
            <button
              type="submit"
              disabled={isProcessing || (!inputText.trim() && uploadedImages.length === 0)}
              className="p-2.5 rounded-xl bg-white hover:bg-neutral-200 disabled:opacity-30 text-black font-bold transition active:scale-95 shrink-0 shadow-lg shadow-white/10"
              title="Generate Video / Direct Scene"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
