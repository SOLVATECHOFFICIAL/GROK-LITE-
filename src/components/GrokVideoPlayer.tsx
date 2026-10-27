/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Download,
  Volume2,
  VolumeX,
  PlusCircle,
  Loader2,
  Clock,
  Smartphone,
  Monitor,
  Square,
  Mic,
} from 'lucide-react';
import { AspectRatio, VideoProject, VideoScene } from '../types/video';
import {
  computeMotionTransform,
  drawCinematicSubtitle,
  getCanvasDimensions,
  renderCanvasEffects,
  renderCinematicEnvironment,
  renderCinematicCharacter,
} from '../utils/videoRenderEngine';
import { videoAudio } from '../utils/videoAudio';
import { characterVoiceEngine, CHARACTER_PROFILES } from '../utils/characterVoice';
import {
  getSavedPlaybackTime,
  savePlaybackTime,
} from '../utils/pixazoClient';
import { exportToMp4 } from '../utils/mp4Export';

interface GrokVideoPlayerProps {
  project: VideoProject;
  autoPlay?: boolean;
  onClose?: () => void;
  onContinueScene?: (project: VideoProject) => void;
}

export const GrokVideoPlayer: React.FC<GrokVideoPlayerProps> = ({
  project,
  autoPlay = false,
  onContinueScene,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(autoPlay);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [resumedFromTime, setResumedFromTime] = useState<number | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [currentAspect, setCurrentAspect] = useState<AspectRatio>(
    project.aspectRatio || '16:9'
  );
  const [isExportingMp4, setIsExportingMp4] = useState<boolean>(false);
  const [recordingProgress, setRecordingProgress] = useState<number>(0);
  const [recordingStatus, setRecordingStatus] = useState<string>('');
  const [loadedImages, setLoadedImages] = useState<Map<string, HTMLImageElement>>(
    new Map()
  );
  const [showDownloadModal, setShowDownloadModal] = useState<boolean>(false);
  const [downloadTargetAspect, setDownloadTargetAspect] = useState<AspectRatio>('16:9');
  const [voiceTestActive, setVoiceTestActive] = useState<boolean>(false);
  const [isCharacterSpeaking, setIsCharacterSpeaking] = useState<boolean>(false);

  useEffect(() => {
    return characterVoiceEngine.subscribe((speaking) => {
      setIsCharacterSpeaking(speaking);
    });
  }, []);

  const totalDuration = Math.max(1, project.totalDuration);

  // Restore saved playback position
  useEffect(() => {
    const saved = getSavedPlaybackTime(project.id);
    if (saved > 0.5 && saved < totalDuration - 0.5) {
      setCurrentTime(saved);
      setResumedFromTime(saved);
    } else {
      setCurrentTime(0);
      setResumedFromTime(null);
    }
  }, [project.id, totalDuration]);

  // Persist playback position
  useEffect(() => {
    if (currentTime > 0) {
      savePlaybackTime(project.id, currentTime);
    }
  }, [currentTime, project.id]);

  // Pre-load scene images
  useEffect(() => {
    const map = new Map<string, HTMLImageElement>();
    project.scenes.forEach((scene) => {
      if (scene.imageSrc && !map.has(scene.imageSrc)) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          map.set(scene.imageSrc!, img);
          setLoadedImages(new Map(map));
        };
        img.src = scene.imageSrc;
      }
    });
  }, [project.scenes]);

  // Calculate active scene
  let accumulatedTime = 0;
  let activeSceneIndex = 0;
  let sceneLocalTime = 0;

  for (let i = 0; i < project.scenes.length; i++) {
    const s = project.scenes[i];
    if (
      currentTime >= accumulatedTime &&
      currentTime < accumulatedTime + s.duration
    ) {
      activeSceneIndex = i;
      sceneLocalTime = currentTime - accumulatedTime;
      break;
    }
    accumulatedTime += s.duration;
  }

  const activeScene: VideoScene =
    project.scenes[activeSceneIndex] || project.scenes[0];
  const sceneProgress = activeScene ? sceneLocalTime / activeScene.duration : 0;

  // Sound effects and character voice on scene transition
  const lastSceneIndexRef = useRef<number>(-1);
  useEffect(() => {
    if (!isPlaying) return;
    if (lastSceneIndexRef.current !== activeSceneIndex) {
      lastSceneIndexRef.current = activeSceneIndex;
      if (activeScene?.sfxAtStart && activeScene.sfxAtStart !== 'none' && !isMuted) {
        videoAudio.playSfx(activeScene.sfxAtStart);
      }
      if (activeScene?.narrationText && !isMuted) {
        characterVoiceEngine.speak(
          activeScene.narrationText,
          activeScene.characterType || project.characterType || 'narrator'
        );
      }
    }
  }, [activeSceneIndex, isPlaying, isMuted, activeScene, project.characterType]);

  // Background orchestral score
  useEffect(() => {
    if (isPlaying && !isMuted) {
      videoAudio.playMusic(project.musicGenre || 'cinematic-orchestra');
    } else {
      videoAudio.stopMusic();
      characterVoiceEngine.cancel();
    }
  }, [isPlaying, isMuted, project.musicGenre]);

  // Animation frame loop
  const animFrameRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number>(0);

  useEffect(() => {
    if (!isPlaying) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    lastTimestampRef.current = performance.now();

    const loop = (timestamp: number) => {
      const delta = (timestamp - lastTimestampRef.current) / 1000;
      lastTimestampRef.current = timestamp;

      setCurrentTime((prev) => {
        const next = prev + delta;
        if (next >= totalDuration) {
          setIsPlaying(false);
          return 0;
        }
        return next;
      });

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, totalDuration]);

  // Draw scene canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !activeScene) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = getCanvasDimensions(currentAspect);
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    ctx.save();
    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = activeScene.backgroundColor || '#020617';
    ctx.fillRect(0, 0, width, height);

    const charType = activeScene.characterType || project.characterType || 'narrator';
    const isSpeakingNow = isCharacterSpeaking || voiceTestActive;

    const img = activeScene.imageSrc ? loadedImages.get(activeScene.imageSrc) : undefined;
    if (img) {
      const transform = computeMotionTransform(activeScene.motionType, sceneProgress);
      ctx.save();
      ctx.translate(width / 2, height / 2);
      ctx.scale(transform.scale, transform.scale);
      ctx.rotate(transform.rotation);
      ctx.translate(transform.translateX, transform.translateY);

      const imgAspect = img.width / img.height;
      const canvasAspect = width / height;
      let drawW = width;
      let drawH = height;

      if (imgAspect > canvasAspect) {
        drawH = height;
        drawW = height * imgAspect;
      } else {
        drawW = width;
        drawH = width / imgAspect;
      }

      ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
      ctx.restore();

      // Atmospheric subtle particles over image without covering the image!
      renderCinematicEnvironment(ctx, width, height, currentTime, charType, activeScene.biome, true);
    } else {
      // Procedural cinematic atmosphere matching the prompt biome
      renderCinematicEnvironment(ctx, width, height, currentTime, charType, activeScene.biome, false);

      // Procedural talking character figure with breathing, blinking, and active speech waveform/mouth movement!
      renderCinematicCharacter(
        ctx,
        width,
        height,
        currentTime,
        charType,
        isSpeakingNow,
        activeScene.speakerName
      );
    }

    // Visual effects
    renderCanvasEffects(ctx, activeScene.effects, width, height, sceneProgress);

    // Subtitle & Speaker badge
    if (activeScene.cinematicSubtitle) {
      const displaySubtitle = activeScene.speakerName
        ? `[${activeScene.speakerName}]: "${activeScene.cinematicSubtitle}"`
        : activeScene.cinematicSubtitle;
      drawCinematicSubtitle(ctx, displaySubtitle, width / 2, height * 0.88, width * 0.85);
    }

    ctx.restore();
  }, [activeScene, sceneProgress, currentAspect, loadedImages]);

  // Test character voice
  const handleTestVoice = () => {
    setVoiceTestActive(true);
    const char = activeScene?.characterType || project.characterType || 'narrator';
    const text = activeScene?.narrationText || activeScene?.cinematicSubtitle || 'Testing character voice synthesis.';
    characterVoiceEngine.speak(text, char, () => {
      setVoiceTestActive(false);
    });
  };

  // Video Extraction Pipeline (Strictly MP4)
  const handleStartExtraction = async () => {
    setIsExportingMp4(true);
    setRecordingProgress(5);
    setRecordingStatus('Setting up MP4 video encoder...');

    try {
      setIsPlaying(false);
      await exportToMp4({
        project,
        aspectRatio: downloadTargetAspect,
        onProgress: (percent, status) => {
          setRecordingProgress(percent);
          setRecordingStatus(status);
        },
      });

      setRecordingProgress(100);
      setRecordingStatus('MP4 download complete!');
      setTimeout(() => {
        setIsExportingMp4(false);
        setShowDownloadModal(false);
        setRecordingProgress(0);
      }, 1500);
    } catch (err: any) {
      console.error('MP4 extraction error:', err);
      setRecordingStatus(err.message || 'Extraction error. Please try again.');
      setIsExportingMp4(false);
    }
  };

  const currentChar = activeScene?.characterType || project.characterType || 'narrator';
  const charProfile = CHARACTER_PROFILES[currentChar] || CHARACTER_PROFILES.narrator;

  return (
    <div
      data-testid="grok-video-player"
      className="w-full max-w-full min-w-0 bg-neutral-950 rounded-2xl border border-neutral-800 shadow-2xl overflow-hidden flex flex-col box-border"
    >
      {/* Header Bar */}
      <div className="p-3 bg-neutral-900/90 border-b border-neutral-800 flex items-center justify-between gap-2 min-w-0">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="w-6 h-6 rounded-md bg-amber-400 text-neutral-950 flex items-center justify-center font-black text-xs shrink-0">
            {project.partNumber ? `P${project.partNumber}` : '🎬'}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-xs sm:text-sm text-white truncate">
              {project.title}
            </h3>
            <p className="text-[10px] text-neutral-400 flex items-center gap-1.5 truncate">
              <span>{totalDuration.toFixed(1)}s</span>
              <span>•</span>
              <span>{project.scenes.length} shots</span>
              <span>•</span>
              <span className="text-amber-400 font-mono uppercase text-[9px]">
                {charProfile.label}
              </span>
            </p>
          </div>
        </div>

        {/* Top Right Controls: Preview Ratio & Voice Test */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Character Voice Test Button */}
          <button
            type="button"
            onClick={handleTestVoice}
            disabled={voiceTestActive}
            title="Listen to character voice synthesis"
            className="px-2 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-neutral-300 hover:text-white text-[10px] flex items-center gap-1 font-mono transition"
          >
            <Mic className="w-3 h-3 text-emerald-400" />
            <span className="hidden sm:inline">Voice Test</span>
          </button>

          {/* Preview Ratio Switcher */}
          <div className="flex items-center bg-neutral-800 rounded-lg p-0.5 text-[10px] font-mono">
            {(['16:9', '9:16', '1:1'] as AspectRatio[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setCurrentAspect(r)}
                className={`px-2 py-0.5 rounded transition ${
                  currentAspect === r
                    ? 'bg-white text-neutral-950 font-bold'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Video Viewport */}
      <div className="relative bg-black flex items-center justify-center overflow-hidden min-h-[240px] max-h-[520px]">
        <div
          className={`relative transition-all duration-300 flex items-center justify-center ${
            currentAspect === '9:16'
              ? 'aspect-[9/16] h-[360px] sm:h-[440px]'
              : currentAspect === '1:1'
              ? 'aspect-square h-[320px] sm:h-[380px]'
              : 'aspect-video w-full'
          }`}
        >
          <canvas
            ref={canvasRef}
            className="w-full h-full object-contain pointer-events-none"
          />

          {/* Resumed from last time pill */}
          {resumedFromTime !== null && !isPlaying && (
            <div className="absolute top-3 left-3 px-2 py-1 rounded-lg bg-black/80 backdrop-blur-md border border-amber-400/30 text-amber-300 text-[10px] flex items-center gap-1 shadow-md font-mono">
              <Clock className="w-3 h-3 text-amber-400" />
              <span>Resumed from {resumedFromTime.toFixed(1)}s</span>
            </div>
          )}

          {/* Shot & Character Voice Badge */}
          {activeScene && (
            <div className="absolute top-3 right-3 px-2 py-1 rounded-lg bg-black/80 backdrop-blur-md border border-white/10 text-white text-[10px] flex items-center gap-1.5 shadow-md font-mono">
              <span className="text-emerald-400 font-bold">
                {activeScene.characterType ? `${activeScene.characterType.toUpperCase()} VOICE` : 'NARRATOR'}
              </span>
              <span>•</span>
              <span className="text-neutral-300">{activeScene.title}</span>
            </div>
          )}

          {/* Big Center Play Button Overlay */}
          {!isPlaying && (
            <button
              type="button"
              onClick={() => setIsPlaying(true)}
              className="absolute inset-0 m-auto w-14 h-14 rounded-full bg-white/90 hover:bg-white text-neutral-950 flex items-center justify-center shadow-2xl transition transform hover:scale-110 active:scale-95"
            >
              <Play className="w-6 h-6 fill-current ml-1" />
            </button>
          )}
        </div>
      </div>

      {/* Scrubber Bar */}
      <div className="px-3 pt-2 bg-neutral-950 flex items-center gap-2">
        <span className="text-[10px] font-mono text-neutral-400 min-w-[34px]">
          {currentTime.toFixed(1)}s
        </span>
        <input
          type="range"
          min={0}
          max={totalDuration}
          step={0.1}
          value={currentTime}
          onChange={(e) => setCurrentTime(parseFloat(e.target.value))}
          className="flex-1 accent-white h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
        />
        <span className="text-[10px] font-mono text-neutral-400 min-w-[34px]">
          {totalDuration.toFixed(1)}s
        </span>
      </div>

      {/* Control Buttons & Continuation Action */}
      <div className="p-3 bg-neutral-950 flex items-center justify-between gap-2 border-t border-neutral-900">
        <div className="flex items-center gap-2">
          {/* Play / Pause */}
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-8 h-8 rounded-xl bg-white hover:bg-neutral-200 text-neutral-950 flex items-center justify-center font-bold transition active:scale-95"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-current" />
            ) : (
              <Play className="w-4 h-4 fill-current ml-0.5" />
            )}
          </button>

          {/* Restart */}
          <button
            type="button"
            onClick={() => {
              setCurrentTime(0);
              setIsPlaying(false);
            }}
            className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-900 transition"
            title="Restart playback"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Audio Mute / Unmute */}
          <button
            type="button"
            onClick={() => setIsMuted(!isMuted)}
            className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-900 transition"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-rose-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            )}
          </button>
        </div>

        {/* Continuation & Download Actions */}
        <div className="flex items-center gap-2">
          {/* + Continuation Button: Generates separate next video */}
          {onContinueScene && (
            <button
              type="button"
              onClick={() => onContinueScene(project)}
              className="py-1.5 px-3 rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-700 hover:border-neutral-500 text-white font-semibold text-xs flex items-center gap-1.5 transition active:scale-95 shadow-sm"
              title="Generate next sequential continuation video picking up from where this stops"
            >
              <PlusCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>+ Next Part</span>
            </button>
          )}

          {/* Download Extraction Button (MP4 Only) */}
          <button
            type="button"
            onClick={() => setShowDownloadModal(true)}
            className="py-1.5 px-3 rounded-xl bg-white hover:bg-neutral-200 text-neutral-950 font-bold text-xs flex items-center gap-1.5 transition active:scale-95 shadow-md"
            title="Download video strictly as MP4"
          >
            <Download className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Download MP4</span>
          </button>
        </div>
      </div>

      {/* Download Extraction Modal (Strictly MP4) */}
      {showDownloadModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-neutral-950 border border-neutral-800 rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Download className="w-4 h-4 text-amber-400" />
                <h4 className="font-bold text-sm text-white">Download MP4</h4>
              </div>
              <button
                type="button"
                onClick={() => setShowDownloadModal(false)}
                className="text-neutral-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-neutral-400">
              Select framing ratio for your movie. Strictly exports in pristine MP4 format with audio, effects, and subtitles.
            </p>

            {/* Ratio Selector Buttons */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setDownloadTargetAspect('16:9')}
                className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition ${
                  downloadTargetAspect === '16:9'
                    ? 'border-amber-400 bg-amber-500/10 text-white'
                    : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white'
                }`}
              >
                <Monitor className="w-5 h-5" />
                <span className="font-bold text-xs">16:9</span>
                <span className="text-[9px] text-neutral-500">Cinema / TV</span>
              </button>

              <button
                type="button"
                onClick={() => setDownloadTargetAspect('9:16')}
                className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition ${
                  downloadTargetAspect === '9:16'
                    ? 'border-amber-400 bg-amber-500/10 text-white'
                    : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white'
                }`}
              >
                <Smartphone className="w-5 h-5" />
                <span className="font-bold text-xs">9:16</span>
                <span className="text-[9px] text-neutral-500">Phone / Reels</span>
              </button>

              <button
                type="button"
                onClick={() => setDownloadTargetAspect('1:1')}
                className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition ${
                  downloadTargetAspect === '1:1'
                    ? 'border-amber-400 bg-amber-500/10 text-white'
                    : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white'
                }`}
              >
                <Square className="w-5 h-5" />
                <span className="font-bold text-xs">1:1</span>
                <span className="text-[9px] text-neutral-500">Square / Feed</span>
              </button>
            </div>

            {/* Start Extraction Progress / Action */}
            <div className="pt-2">
              <button
                type="button"
                disabled={isExportingMp4}
                onClick={handleStartExtraction}
                className="w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-neutral-950 font-extrabold text-xs flex items-center justify-center gap-2 transition active:scale-95 shadow"
              >
                {isExportingMp4 ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Extracting MP4 ({recordingProgress}%)...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 stroke-[2.5]" />
                    <span>Save MP4 to Device</span>
                  </>
                )}
              </button>
              {recordingStatus && (
                <p className="text-[10px] text-center text-amber-400 font-mono mt-2">
                  {recordingStatus}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
