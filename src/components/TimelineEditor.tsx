/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  SkipBack,
  SkipForward,
  Plus,
  Trash2,
  Layers,
  Repeat,
  Sparkles,
  Volume2,
} from 'lucide-react';
import { CharacterPuppet, Keyframe, Scene } from '../types/animation';
import { clamp } from '../utils/animationEngine';

interface TimelineEditorProps {
  scene: Scene;
  currentTime: number;
  isPlaying: boolean;
  loop: boolean;
  onionSkinning: boolean;
  fps: 12 | 24;
  selectedEntityId: string | null;
  selectedEntityType: 'character' | 'prop' | 'scene' | null;
  onPlayToggle: () => void;
  onSeek: (time: number) => void;
  onLoopToggle: () => void;
  onOnionSkinToggle: () => void;
  onFpsToggle: () => void;
  onAddKeyframe: () => void;
  onDeleteKeyframe: (charId: string, keyframeId: string) => void;
  onSelectEntity: (
    id: string | null,
    type: 'character' | 'prop' | 'scene' | null
  ) => void;
}

export const TimelineEditor: React.FC<TimelineEditorProps> = ({
  scene,
  currentTime,
  isPlaying,
  loop,
  onionSkinning,
  fps,
  selectedEntityId,
  selectedEntityType,
  onPlayToggle,
  onSeek,
  onLoopToggle,
  onOnionSkinToggle,
  onFpsToggle,
  onAddKeyframe,
  onDeleteKeyframe,
  onSelectEntity,
}) => {
  const rulerRef = useRef<HTMLDivElement | null>(null);

  const duration = Math.max(1, scene.duration);
  const currentProgress = clamp(currentTime / duration, 0, 1);

  // Timecode formatting: MM:SS.ff
  const formatTimecode = (sec: number) => {
    const m = Math.floor(sec / 60)
      .toString()
      .padStart(2, '0');
    const s = Math.floor(sec % 60)
      .toString()
      .padStart(2, '0');
    const f = Math.floor((sec % 1) * fps)
      .toString()
      .padStart(2, '0');
    return `${m}:${s}.${f}`;
  };

  const handleRulerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!rulerRef.current) return;
    const rect = rulerRef.current.getBoundingClientRect();
    const ratio = clamp((e.clientX - rect.left) / rect.width, 0, 1);
    onSeek(ratio * duration);
  };

  const handleScrubPointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);

    const onPointerMove = (moveEvent: PointerEvent) => {
      if (!rulerRef.current) return;
      const rect = rulerRef.current.getBoundingClientRect();
      const ratio = clamp((moveEvent.clientX - rect.left) / rect.width, 0, 1);
      onSeek(ratio * duration);
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  // Step one frame backward or forward
  const stepFrame = (delta: number) => {
    const frameTime = 1 / fps;
    const newTime = clamp(currentTime + delta * frameTime, 0, duration);
    onSeek(newTime);
  };

  // Find if currently selected character has a keyframe at or near currentTime
  const selectedChar =
    selectedEntityType === 'character'
      ? scene.characters.find((c) => c.id === selectedEntityId)
      : null;

  const currentKeyframe = selectedChar?.keyframes.find(
    (kf) => Math.abs(kf.time * duration - currentTime) < 0.15
  );

  return (
    <div
      data-testid="timeline-editor"
      className="w-full bg-neutral-900/95 border-t border-neutral-800 flex flex-col select-none"
    >
      {/* Top Controls Toolbar */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2.5 bg-neutral-950/80 border-b border-neutral-800/80 gap-3">
        {/* Playback Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onSeek(0)}
            title="Rewind to start"
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => stepFrame(-1)}
            title="Step 1 Frame Back"
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
          >
            <SkipBack className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onPlayToggle}
            data-testid="play-pause-btn"
            title={isPlaying ? 'Pause' : 'Play'}
            className="flex items-center justify-center w-9 h-9 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold shadow-lg transition active:scale-95"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            )}
          </button>
          <button
            type="button"
            onClick={() => stepFrame(1)}
            title="Step 1 Frame Forward"
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          {/* Timecode display */}
          <div className="ml-3 px-3 py-1 rounded-lg bg-neutral-900 border border-neutral-800 font-mono text-xs text-amber-400 font-semibold tracking-wider">
            {formatTimecode(currentTime)}{' '}
            <span className="text-neutral-500 font-normal">
              / {formatTimecode(duration)}
            </span>
          </div>
        </div>

        {/* Keyframe & Animation Settings */}
        <div className="flex items-center gap-2">
          {/* Add Keyframe */}
          <button
            type="button"
            onClick={onAddKeyframe}
            disabled={!selectedChar}
            title={
              selectedChar
                ? `Add Keyframe for ${selectedChar.name}`
                : 'Select a character to add keyframe'
            }
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition ${
              selectedChar
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                : 'bg-neutral-800 text-neutral-500 cursor-not-allowed border border-transparent'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Keyframe</span>
          </button>

          {/* Delete Keyframe */}
          {currentKeyframe && selectedChar && (
            <button
              type="button"
              onClick={() => onDeleteKeyframe(selectedChar.id, currentKeyframe.id)}
              title="Delete keyframe at playhead"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-rose-400 bg-rose-950/40 border border-rose-800/50 hover:bg-rose-900/40 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Del KF</span>
            </button>
          )}

          <div className="h-4 w-px bg-neutral-800 mx-1" />

          {/* Onion Skinning Toggle */}
          <button
            type="button"
            onClick={onOnionSkinToggle}
            title="Toggle Onion Skinning (Ghost Frames)"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
              onionSkinning
                ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/50'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800 border border-transparent'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Onion Skin</span>
          </button>

          {/* Loop Toggle */}
          <button
            type="button"
            onClick={onLoopToggle}
            title="Toggle Loop Playback"
            className={`p-1.5 rounded-lg text-xs font-medium transition ${
              loop
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800 border border-transparent'
            }`}
          >
            <Repeat className="w-4 h-4" />
          </button>

          {/* FPS Toggle */}
          <button
            type="button"
            onClick={onFpsToggle}
            title="Toggle 12 FPS (classic hand-drawn) vs 24 FPS (smooth cinematic)"
            className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold text-neutral-300 bg-neutral-800 border border-neutral-700 hover:border-neutral-500 transition"
          >
            {fps} FPS
          </button>
        </div>
      </div>

      {/* Multi-Track Timeline Area */}
      <div className="flex w-full overflow-x-auto min-h-[160px] max-h-[220px]">
        {/* Track Headers (Left Column) */}
        <div className="w-44 shrink-0 bg-neutral-950 border-r border-neutral-800 z-10 flex flex-col">
          {/* Header row placeholder */}
          <div className="h-8 border-b border-neutral-800 px-3 flex items-center text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
            Tracks
          </div>

          {/* Scene / Environment Track */}
          <div
            onClick={() => onSelectEntity(null, 'scene')}
            className={`h-9 px-3 flex items-center justify-between text-xs border-b border-neutral-800/80 cursor-pointer transition ${
              selectedEntityType === 'scene'
                ? 'bg-amber-500/10 text-amber-300 font-semibold border-l-2 border-l-amber-500'
                : 'text-neutral-300 hover:bg-neutral-900'
            }`}
          >
            <span className="truncate">Scene & Weather</span>
            <Sparkles className="w-3 h-3 text-neutral-500" />
          </div>

          {/* Character Tracks */}
          {scene.characters.map((char) => (
            <div
              key={`trk-${char.id}`}
              onClick={() => onSelectEntity(char.id, 'character')}
              className={`h-9 px-3 flex items-center justify-between text-xs border-b border-neutral-800/80 cursor-pointer transition ${
                selectedEntityType === 'character' && selectedEntityId === char.id
                  ? 'bg-amber-500/15 text-amber-300 font-semibold border-l-2 border-l-amber-500'
                  : 'text-neutral-300 hover:bg-neutral-900'
              }`}
            >
              <span className="truncate">{char.name}</span>
              <span className="text-[10px] text-neutral-500 font-mono">
                {char.keyframes.length} KF
              </span>
            </div>
          ))}

          {/* Props Track */}
          <div
            className="h-9 px-3 flex items-center justify-between text-xs border-b border-neutral-800/80 text-neutral-400 bg-neutral-950/60"
          >
            <span className="truncate">Props ({scene.props.length})</span>
          </div>

          {/* Audio Track */}
          <div className="h-9 px-3 flex items-center justify-between text-xs text-neutral-400 bg-neutral-950/60">
            <span className="truncate">Audio & Narration</span>
            <Volume2 className="w-3 h-3 text-neutral-500" />
          </div>
        </div>

        {/* Tracks Content & Time Ruler (Right Area) */}
        <div
          ref={rulerRef}
          onClick={handleRulerClick}
          className="relative flex-1 bg-neutral-900/60 bg-timeline-grid flex flex-col min-w-[500px] cursor-pointer"
        >
          {/* Time Ruler Header */}
          <div className="h-8 border-b border-neutral-800 relative bg-neutral-950/90 flex items-center">
            {Array.from({ length: Math.ceil(duration) + 1 }).map((_, sec) => {
              const posPercent = (sec / duration) * 100;
              if (posPercent > 100) return null;
              return (
                <div
                  key={`sec-${sec}`}
                  className="absolute top-0 bottom-0 flex flex-col items-start border-l border-neutral-700 pl-1"
                  style={{ left: `${posPercent}%` }}
                >
                  <span className="text-[10px] font-mono text-neutral-400">
                    {sec}s
                  </span>
                </div>
              );
            })}
          </div>

          {/* Playhead Scrubber Needle (Spans entire height) */}
          <div
            onPointerDown={handleScrubPointerDown}
            className="absolute top-0 bottom-0 w-0.5 bg-amber-400 pointer-events-auto cursor-ew-resize z-30"
            style={{ left: `${currentProgress * 100}%` }}
          >
            {/* Scrubber Knob */}
            <div className="absolute -top-1 -left-2 w-4 h-4 bg-amber-400 text-black rounded-sm flex items-center justify-center shadow-md">
              <div className="w-1.5 h-1.5 bg-black rounded-full" />
            </div>
          </div>

          {/* Track 1: Scene & Weather Bar */}
          <div className="h-9 border-b border-neutral-800/60 relative flex items-center px-2">
            <div className="w-full h-4 rounded bg-indigo-950/70 border border-indigo-700/50 flex items-center px-2 text-[10px] text-indigo-300">
              {scene.background} • {scene.weatherEffect}
            </div>
          </div>

          {/* Character Keyframe Tracks */}
          {scene.characters.map((char) => (
            <div
              key={`track-row-${char.id}`}
              className={`h-9 border-b border-neutral-800/60 relative flex items-center ${
                selectedEntityId === char.id ? 'bg-amber-500/5' : ''
              }`}
            >
              {/* Keyframe Diamond Markers */}
              {char.keyframes.map((kf) => {
                const kfProgress = clamp(kf.time, 0, 1) * 100;
                const isNearPlayhead =
                  Math.abs(kf.time * duration - currentTime) < 0.15;

                return (
                  <div
                    key={kf.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectEntity(char.id, 'character');
                      onSeek(kf.time * duration);
                    }}
                    title={`Keyframe at ${(kf.time * duration).toFixed(2)}s (${kf.pose}, ${kf.emotion})`}
                    className={`absolute -translate-x-1/2 w-3.5 h-3.5 rotate-45 rounded-xs transition-all shadow-md cursor-pointer z-20 ${
                      isNearPlayhead
                        ? 'bg-amber-400 scale-125 ring-2 ring-white'
                        : 'bg-amber-500/80 hover:bg-amber-300'
                    }`}
                    style={{ left: `${kfProgress}%` }}
                  />
                );
              })}
            </div>
          ))}

          {/* Props Track Row */}
          <div className="h-9 border-b border-neutral-800/60 relative flex items-center px-2">
            <div className="w-full h-3 rounded-full bg-sky-950/60 border border-sky-800/40" />
          </div>

          {/* Audio Track Row */}
          <div className="h-9 relative flex items-center px-2">
            <div className="w-full h-4 rounded bg-emerald-950/60 border border-emerald-800/40 flex items-center px-2 text-[10px] text-emerald-300 truncate">
              Music: {scene.bgMusic} | Voice: {scene.narration ? 'Active' : 'Muted'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
