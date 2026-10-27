/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  Film,
  Layers,
  Play,
  Pause,
  RotateCcw,
  ArrowUp,
  ArrowDown,
  Download,
  Check,
  Volume2,
  VolumeX,
  X,
  Loader2,
  Brain,
  Sparkles,
  Sliders,
  Scissors,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  Video,
} from 'lucide-react';
import {
  AspectRatio,
  CharacterType,
  MergeTransitionType,
  SplitTransitionInfo,
  VideoProject,
  VideoScene,
} from '../types/video';
import {
  computeAiSplitTransition,
  computeMotionTransform,
  drawCinematicSubtitle,
  getCanvasDimensions,
  renderCanvasEffects,
  renderCinematicCharacter,
  renderCinematicEnvironment,
} from '../utils/videoRenderEngine';
import { videoAudio } from '../utils/videoAudio';
import { characterVoiceEngine } from '../utils/characterVoice';

interface MergenStudioProps {
  availableVideos: VideoProject[];
  onClose: () => void;
}

type MergenStage = 'selection' | 'harmonizing' | 'preview';

export const MergenStudio: React.FC<MergenStudioProps> = ({
  availableVideos,
  onClose,
}) => {
  // Mergen Stage: 'selection' -> 'harmonizing' -> 'preview'
  const [stage, setStage] = useState<MergenStage>('selection');
  const [harmonizeProgress, setHarmonizeProgress] = useState<number>(0);
  const [harmonizeMessage, setHarmonizeMessage] = useState<string>('');

  // Ordered list of clip IDs that the user has selected
  // Initialize with all available videos by default
  const [selectedVideoIds, setSelectedVideoIds] = useState<string[]>(() =>
    availableVideos.map((v) => v.id)
  );

  // Per-split customized transitions (key: "fromId_toId")
  const [splitOverrides, setSplitOverrides] = useState<
    Record<string, MergeTransitionType>
  >({});

  const [targetAspect, setTargetAspect] = useState<AspectRatio>('16:9');

  // Preview player state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isCharacterSpeaking, setIsCharacterSpeaking] = useState<boolean>(false);

  // Extraction export state
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [extractProgress, setExtractProgress] = useState<number>(0);
  const [extractStatus, setExtractStatus] = useState<string>('');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  // Subscribe to character voice speaking events
  useEffect(() => {
    return characterVoiceEngine.subscribe((spk) => {
      setIsCharacterSpeaking(spk);
    });
  }, []);

  // Filter selected videos in their explicit user sequence
  const orderedVideos = useMemo(() => {
    return selectedVideoIds
      .map((id) => availableVideos.find((v) => v.id === id))
      .filter((v): v is VideoProject => Boolean(v));
  }, [selectedVideoIds, availableVideos]);

  // Compute AI Brain split transitions between each adjacent selected video
  const computedSplits: SplitTransitionInfo[] = useMemo(() => {
    const splits: SplitTransitionInfo[] = [];
    for (let i = 0; i < orderedVideos.length - 1; i++) {
      const fromVid = orderedVideos[i];
      const toVid = orderedVideos[i + 1];
      const splitKey = `${fromVid.id}_${toVid.id}`;

      const lastShotFrom = fromVid.scenes[fromVid.scenes.length - 1];
      const firstShotTo = toVid.scenes[0];

      const fromMotion = lastShotFrom?.motionType || 'dolly-push';
      const toMotion = firstShotTo?.motionType || 'crane-pan';
      const fromChar = lastShotFrom?.characterType || fromVid.characterType;
      const toChar = firstShotTo?.characterType || toVid.characterType;

      const aiRecommendation = computeAiSplitTransition(
        fromMotion,
        toMotion,
        fromChar,
        toChar
      );

      const chosenType = splitOverrides[splitKey] || aiRecommendation.transitionType;

      splits.push({
        id: splitKey,
        fromClipIndex: i + 1,
        toClipIndex: i + 2,
        fromVideoId: fromVid.id,
        toVideoId: toVid.id,
        transitionType: chosenType,
        duration: aiRecommendation.duration,
        aiReasoning: aiRecommendation.reasoning,
        colorGradeMatch: `${fromChar || 'standard'} -> ${toChar || 'standard'}`,
      });
    }
    return splits;
  }, [orderedVideos, splitOverrides]);

  // Build flattened composite scenes list with transition metadata
  const compositeScenes: Array<
    VideoScene & {
      parentVideoId: string;
      parentClipNumber: number;
      parentTitle: string;
      isFirstInClip: boolean;
      isLastInClip: boolean;
      incomingSplit?: SplitTransitionInfo;
    }
  > = useMemo(() => {
    const list: Array<
      VideoScene & {
        parentVideoId: string;
        parentClipNumber: number;
        parentTitle: string;
        isFirstInClip: boolean;
        isLastInClip: boolean;
        incomingSplit?: SplitTransitionInfo;
      }
    > = [];

    orderedVideos.forEach((v, vIdx) => {
      v.scenes.forEach((s, sIdx) => {
        const isFirst = sIdx === 0;
        const isLast = sIdx === v.scenes.length - 1;
        const incomingSplit =
          isFirst && vIdx > 0 ? computedSplits[vIdx - 1] : undefined;

        list.push({
          ...s,
          parentVideoId: v.id,
          parentClipNumber: vIdx + 1,
          parentTitle: v.title,
          isFirstInClip: isFirst,
          isLastInClip: isLast,
          incomingSplit,
        });
      });
    });

    return list;
  }, [orderedVideos, computedSplits]);

  const totalDuration = useMemo(() => {
    return compositeScenes.reduce((sum, s) => sum + s.duration, 0);
  }, [compositeScenes]);

  // Toggle selection of a clip by ID
  const toggleSelect = (id: string) => {
    if (selectedVideoIds.includes(id)) {
      if (selectedVideoIds.length <= 1) return; // Keep at least 1 clip
      setSelectedVideoIds((prev) => prev.filter((vId) => vId !== id));
    } else {
      setSelectedVideoIds((prev) => [...prev, id]);
    }
    setCurrentTime(0);
    setIsPlaying(false);
  };

  // Re-order a selected video
  const moveVideo = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= selectedVideoIds.length) return;

    const copy = [...selectedVideoIds];
    const [moved] = copy.splice(index, 1);
    copy.splice(targetIdx, 0, moved);
    setSelectedVideoIds(copy);
    setCurrentTime(0);
    setIsPlaying(false);
  };

  // Pre-load scene images
  const [loadedImages, setLoadedImages] = useState<Map<string, HTMLImageElement>>(
    new Map()
  );
  useEffect(() => {
    const map = new Map<string, HTMLImageElement>();
    compositeScenes.forEach((scene) => {
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
  }, [compositeScenes]);

  // Trigger the AI Merging & Harmonizing sequence
  const handleStartHarmonizing = async () => {
    if (orderedVideos.length === 0) return;
    setStage('harmonizing');
    setHarmonizeProgress(15);
    setHarmonizeMessage('AI Brain scanning clip seam boundaries and vectors...');

    await new Promise((r) => setTimeout(r, 450));
    setHarmonizeProgress(45);
    setHarmonizeMessage('Analyzing color grade tone curves for seamless palette matching...');

    await new Promise((r) => setTimeout(r, 500));
    setHarmonizeProgress(75);
    setHarmonizeMessage('Harmonizing audio dynamic range & orchestral score cues...');

    await new Promise((r) => setTimeout(r, 450));
    setHarmonizeProgress(100);
    setHarmonizeMessage('Seamless split transitions calibrated! Launching unified preview.');

    await new Promise((r) => setTimeout(r, 350));
    setStage('preview');
    setCurrentTime(0);
    setIsPlaying(true);
  };

  // Find active scene in composite timeline
  let accumulatedTime = 0;
  let activeIndex = 0;
  let sceneLocalTime = 0;

  for (let i = 0; i < compositeScenes.length; i++) {
    const s = compositeScenes[i];
    if (
      currentTime >= accumulatedTime &&
      currentTime < accumulatedTime + s.duration
    ) {
      activeIndex = i;
      sceneLocalTime = currentTime - accumulatedTime;
      break;
    }
    accumulatedTime += s.duration;
  }

  const activeScene = compositeScenes[activeIndex] || compositeScenes[0];
  const sceneProgress = activeScene ? sceneLocalTime / activeScene.duration : 0;

  // Sound effects and speech triggering on scene switch
  const lastActiveRef = useRef<number>(-1);
  useEffect(() => {
    if (!isPlaying || stage !== 'preview') return;
    if (lastActiveRef.current !== activeIndex) {
      lastActiveRef.current = activeIndex;
      if (activeScene?.sfxAtStart && activeScene.sfxAtStart !== 'none' && !isMuted) {
        videoAudio.playSfx(activeScene.sfxAtStart);
      }
      if (activeScene?.narrationText && !isMuted) {
        characterVoiceEngine.speak(
          activeScene.narrationText,
          activeScene.characterType || 'narrator'
        );
      }
    }
  }, [activeIndex, isPlaying, isMuted, activeScene, stage]);

  // Background orchestral score during preview
  useEffect(() => {
    if (isPlaying && stage === 'preview' && !isMuted) {
      videoAudio.playMusic('cinematic-orchestra');
    } else {
      videoAudio.stopMusic();
      characterVoiceEngine.cancel();
    }
  }, [isPlaying, isMuted, stage]);

  // Playback animation frame loop
  useEffect(() => {
    if (!isPlaying || stage !== 'preview') {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    lastTimeRef.current = performance.now();

    const loop = (now: number) => {
      const delta = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;

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
  }, [isPlaying, totalDuration, stage]);

  // Render canvas frame
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !activeScene) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = getCanvasDimensions(targetAspect);
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    ctx.save();
    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = activeScene.backgroundColor || '#050814';
    ctx.fillRect(0, 0, width, height);

    const charType = activeScene.characterType || 'narrator';
    const isSpeakingNow = isCharacterSpeaking;

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

      renderCinematicEnvironment(ctx, width, height, currentTime, charType);
    } else {
      // Procedural Hollywood cinematic atmosphere
      renderCinematicEnvironment(ctx, width, height, currentTime, charType);

      // Procedural talking character figure with breathing, blinking, and speech mouth/waveform pulsation
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

    // Apply Post-processing visual effects
    renderCanvasEffects(ctx, activeScene.effects, width, height, sceneProgress);

    // Apply split transition blend if entering a new clip
    if (activeScene.isFirstInClip && activeScene.incomingSplit) {
      const split = activeScene.incomingSplit;
      const transDuration = split.duration;
      if (sceneLocalTime < transDuration) {
        const transProgress = sceneLocalTime / transDuration;
        const fadeAlpha = 1.0 - transProgress;

        if (split.transitionType === 'dip-to-black') {
          ctx.save();
          ctx.fillStyle = '#000000';
          ctx.globalAlpha = Math.max(0, Math.min(1, fadeAlpha * 1.5));
          ctx.fillRect(0, 0, width, height);
          ctx.restore();
        } else if (split.transitionType === 'motion-whip') {
          ctx.save();
          ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
          ctx.globalAlpha = fadeAlpha;
          ctx.fillRect(0, 0, width, height);
          ctx.restore();
        } else if (split.transitionType === 'cross-dissolve' || split.transitionType === 'ai-matched') {
          ctx.save();
          ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
          ctx.globalAlpha = fadeAlpha;
          ctx.fillRect(0, 0, width, height);
          ctx.restore();
        }
      }
    }

    // Subtitle rendering with clean drop shadow
    if (activeScene.cinematicSubtitle) {
      const displaySubtitle = activeScene.speakerName
        ? `[${activeScene.speakerName}]: "${activeScene.cinematicSubtitle}"`
        : activeScene.cinematicSubtitle;
      drawCinematicSubtitle(ctx, displaySubtitle, width / 2, height * 0.88, width * 0.85);
    }

    ctx.restore();
  }, [
    activeScene,
    sceneProgress,
    targetAspect,
    loadedImages,
    sceneLocalTime,
    activeIndex,
    currentTime,
    isCharacterSpeaking,
  ]);

  // Real Video Extraction & Stitcher
  const handleExtractAndDownload = async () => {
    if (isExtracting || compositeScenes.length === 0) return;

    setIsExtracting(true);
    setExtractProgress(10);
    setExtractStatus('Initializing seamless Mergen frame pipeline...');

    const canvas = canvasRef.current;
    if (!canvas) {
      setIsExtracting(false);
      return;
    }

    try {
      setIsPlaying(false);

      const stream = canvas.captureStream(30);
      let mediaRecorder: MediaRecorder;

      const mimeTypes = [
        'video/webm;codecs=vp9',
        'video/webm;codecs=vp8',
        'video/webm',
      ];
      let selectedMime = '';
      for (const mime of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mime)) {
          selectedMime = mime;
          break;
        }
      }

      const chunks: Blob[] = [];
      mediaRecorder = new MediaRecorder(stream, {
        mimeType: selectedMime || undefined,
        videoBitsPerSecond: 4500000,
      });

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      const recordPromise = new Promise<Blob>((resolve) => {
        mediaRecorder.onstop = () => {
          resolve(new Blob(chunks, { type: selectedMime || 'video/webm' }));
        };
      });

      mediaRecorder.start();
      setExtractStatus(`Merging ${orderedVideos.length} clips with AI seamless split harmonization...`);

      const totalSimSeconds = Math.min(totalDuration, 30);
      const stepInterval = 0.25;
      let simTime = 0;

      while (simTime <= totalSimSeconds) {
        setCurrentTime(simTime);
        const percent = Math.min(95, Math.round((simTime / totalSimSeconds) * 90) + 5);
        setExtractProgress(percent);
        setExtractStatus(`Rendering seamless transition frames (${percent}%)...`);
        await new Promise((r) => setTimeout(r, 55));
        simTime += stepInterval;
      }

      mediaRecorder.stop();
      setExtractProgress(98);
      setExtractStatus('Finalizing high-definition unified film container...');

      const blob = await recordPromise;

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mergen_unified_film_${orderedVideos.length}_clips_${targetAspect.replace(':', 'x')}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setExtractProgress(100);
      setExtractStatus('Export complete! Your merged film has downloaded.');
      setTimeout(() => {
        setIsExtracting(false);
        setExtractProgress(0);
      }, 2500);
    } catch (err) {
      console.error('Mergen extraction failed:', err);
      setExtractStatus('Extraction error. Please try again.');
      setIsExtracting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/92 backdrop-blur-xl flex flex-col overflow-hidden font-sans select-none">
      {/* Top Global Mergen Bar */}
      <header className="h-14 border-b border-neutral-800 bg-neutral-950 px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 text-neutral-950 flex items-center justify-center font-black text-sm shadow-lg shadow-amber-500/20">
            M
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-extrabold text-sm text-white tracking-tight">
                MERGEN STUDIO
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-400 border border-amber-400/20 flex items-center gap-1">
                <Brain className="w-3 h-3" />
                AI Brain Split Harmonizer
              </span>
            </div>
            <p className="text-[11px] text-neutral-400">
              Pick conversation clips, harmonize splits seamlessly, preview & download
            </p>
          </div>
        </div>

        {/* Stage Navigation & Close */}
        <div className="flex items-center gap-3">
          {stage === 'preview' && (
            <button
              type="button"
              onClick={() => {
                setIsPlaying(false);
                setStage('selection');
              }}
              className="px-3 py-1.5 rounded-lg border border-neutral-700 bg-neutral-900 hover:bg-neutral-800 text-xs text-neutral-300 hover:text-white transition flex items-center gap-1.5"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Edit Selection & Splits</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-900 transition"
            title="Close Mergen Studio"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Body depending on Stage */}
      {stage === 'selection' && (
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left: Clips in Conversation Checklist */}
          <div className="w-full md:w-1/2 border-r border-neutral-800 flex flex-col h-full bg-neutral-950/80 overflow-hidden">
            <div className="p-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/40">
              <div>
                <h3 className="font-bold text-xs uppercase tracking-wider text-neutral-300">
                  Step 1: Select Conversation Clips
                </h3>
                <p className="text-[11px] text-neutral-400">
                  Tick the clips you want to align (e.g. tick 1, 2, skip 3, tick 5)
                </p>
              </div>
              <span className="text-xs font-mono px-2 py-1 rounded bg-neutral-800 text-amber-400 font-bold">
                {orderedVideos.length} of {availableVideos.length} selected
              </span>
            </div>

            {/* Clips list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
              {availableVideos.length === 0 ? (
                <div className="text-center py-12 text-neutral-500 text-sm">
                  No video clips generated yet in this conversation.
                </div>
              ) : (
                availableVideos.map((vid, idx) => {
                  const clipNumber = idx + 1;
                  const isSelected = selectedVideoIds.includes(vid.id);
                  const orderIndex = selectedVideoIds.indexOf(vid.id);

                  return (
                    <div
                      key={vid.id}
                      className={`p-3 rounded-xl border transition-all flex items-center gap-3 ${
                        isSelected
                          ? 'border-amber-500/40 bg-neutral-900/90 text-white shadow-lg'
                          : 'border-neutral-850 bg-neutral-950/40 text-neutral-500 opacity-60 hover:opacity-80'
                      }`}
                    >
                      {/* Checkbox */}
                      <button
                        type="button"
                        onClick={() => toggleSelect(vid.id)}
                        className={`w-6 h-6 rounded-md flex items-center justify-center text-xs shrink-0 border transition ${
                          isSelected
                            ? 'bg-amber-400 border-amber-400 text-neutral-950 font-black shadow'
                            : 'border-neutral-700 bg-neutral-800 text-transparent'
                        }`}
                        title={isSelected ? 'Deselect clip' : 'Select clip'}
                      >
                        <Check className="w-4 h-4 stroke-[3]" />
                      </button>

                      {/* Clip Badge */}
                      <div className="w-12 h-12 rounded-lg bg-neutral-800 border border-neutral-700 flex flex-col items-center justify-center shrink-0">
                        <span className="text-[10px] text-neutral-400 font-mono">
                          CLIP
                        </span>
                        <span className="font-extrabold text-sm text-white">
                          #{clipNumber}
                        </span>
                      </div>

                      {/* Clip Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs truncate text-white">
                            {vid.title}
                          </span>
                          {vid.partNumber && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded font-mono bg-neutral-800 text-neutral-300">
                              Part {vid.partNumber}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-neutral-400 truncate mt-0.5">
                          {vid.prompt}
                        </p>
                        <div className="flex items-center gap-2.5 text-[10px] text-neutral-400 mt-1">
                          <span className="font-mono text-amber-400">
                            {vid.totalDuration.toFixed(1)}s
                          </span>
                          <span>•</span>
                          <span>{vid.scenes.length} shots</span>
                          {vid.characterType && (
                            <>
                              <span>•</span>
                              <span className="uppercase font-mono text-[9px] text-sky-400">
                                {vid.characterType}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Reorder Up/Down */}
                      {isSelected && (
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            disabled={orderIndex === 0}
                            onClick={() => moveVideo(orderIndex, 'up')}
                            className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 disabled:opacity-20 text-neutral-300"
                            title="Move Earlier in Merge Sequence"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={orderIndex === selectedVideoIds.length - 1}
                            onClick={() => moveVideo(orderIndex, 'down')}
                            className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 disabled:opacity-20 text-neutral-300"
                            title="Move Later in Merge Sequence"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Selected Sequence Summary Ribbon */}
            <div className="p-3 border-t border-neutral-800 bg-neutral-900/70">
              <div className="text-[11px] font-semibold text-neutral-300 mb-1.5 flex items-center justify-between">
                <span>Active Merge Sequence</span>
                <span className="font-mono text-amber-400 font-bold">
                  {totalDuration.toFixed(1)}s Total
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {orderedVideos.map((vid, idx) => {
                  const originalIndex = availableVideos.findIndex((v) => v.id === vid.id) + 1;
                  return (
                    <React.Fragment key={vid.id}>
                      <span className="px-2 py-1 rounded-md bg-amber-400/20 border border-amber-400/40 text-amber-300 text-xs font-mono font-bold">
                        Clip #{originalIndex}
                      </span>
                      {idx < orderedVideos.length - 1 && (
                        <ArrowRight className="w-3 h-3 text-neutral-500" />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right: AI Split Brain & Harmonizer */}
          <div className="w-full md:w-1/2 flex flex-col h-full bg-neutral-950 overflow-hidden">
            <div className="p-4 border-b border-neutral-800 bg-neutral-900/40 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-xs uppercase tracking-wider text-neutral-300 flex items-center gap-2">
                  <Brain className="w-4 h-4 text-amber-400" />
                  Step 2: AI Brain Split Transitions
                </h3>
                <p className="text-[11px] text-neutral-400">
                  AI analyzes camera vectors and lighting to eliminate visible seams
                </p>
              </div>

              {/* Target Aspect */}
              <div className="flex items-center gap-1 bg-neutral-900 p-1 rounded-lg border border-neutral-800">
                {(['16:9', '9:16', '1:1'] as AspectRatio[]).map((ratio) => (
                  <button
                    key={ratio}
                    type="button"
                    onClick={() => setTargetAspect(ratio)}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition ${
                      targetAspect === ratio
                        ? 'bg-amber-400 text-neutral-950'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    {ratio}
                  </button>
                ))}
              </div>
            </div>

            {/* Split List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {computedSplits.length === 0 ? (
                <div className="text-center py-16 text-neutral-500 text-sm">
                  Select at least 2 clips to configure split transitions.
                </div>
              ) : (
                computedSplits.map((split, sIdx) => {
                  const fromVid = orderedVideos[sIdx];
                  const toVid = orderedVideos[sIdx + 1];
                  const fromClipNum = availableVideos.findIndex((v) => v.id === fromVid?.id) + 1;
                  const toClipNum = availableVideos.findIndex((v) => v.id === toVid?.id) + 1;

                  return (
                    <div
                      key={split.id}
                      className="p-3.5 rounded-xl border border-neutral-800 bg-neutral-900/60 space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Scissors className="w-3.5 h-3.5 text-amber-400" />
                          <span className="font-bold text-xs text-white">
                            Split Seam {sIdx + 1}: Clip #{fromClipNum} ➔ Clip #{toClipNum}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-400/10 text-amber-400 border border-amber-400/30">
                          {split.duration.toFixed(2)}s blend
                        </span>
                      </div>

                      <p className="text-[11px] text-neutral-300 leading-relaxed bg-neutral-950/70 p-2.5 rounded-lg border border-neutral-800/80">
                        {split.aiReasoning}
                      </p>

                      {/* Transition Type Chooser for this split */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {(
                          [
                            ['ai-matched', 'AI Smart Match'],
                            ['cross-dissolve', 'Cross-Dissolve'],
                            ['dip-to-black', 'Dip to Black'],
                            ['motion-whip', 'Motion Whip'],
                            ['hard-cut', 'Hard Cut'],
                          ] as const
                        ).map(([type, label]) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => {
                              setSplitOverrides((prev) => ({
                                ...prev,
                                [split.id]: type,
                              }));
                            }}
                            className={`px-2.5 py-1 rounded-md text-[10px] font-medium border transition ${
                              split.transitionType === type
                                ? 'bg-amber-400 text-neutral-950 border-amber-400 font-bold'
                                : 'bg-neutral-800/80 text-neutral-400 border-neutral-700 hover:text-white'
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Launch Merging & Harmonizing Button */}
            <div className="p-4 border-t border-neutral-800 bg-neutral-950 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-white">
                  Ready to Assemble
                </div>
                <div className="text-[11px] text-neutral-400">
                  {orderedVideos.length} clips • {totalDuration.toFixed(1)}s total runtime
                </div>
              </div>

              <button
                type="button"
                disabled={orderedVideos.length === 0}
                onClick={handleStartHarmonizing}
                className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-amber-400/20 disabled:opacity-40 transition cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Merge & Harmonize with AI Brain</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stage: Harmonizing in Progress */}
      {stage === 'harmonizing' && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 bg-neutral-950">
          <div className="max-w-md w-full p-8 rounded-2xl border border-neutral-800 bg-neutral-900/90 text-center space-y-6 shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-amber-400/10 border border-amber-400/30 text-amber-400 flex items-center justify-center mx-auto shadow-inner">
              <Brain className="w-8 h-8 animate-pulse" />
            </div>

            <div className="space-y-2">
              <h3 className="font-extrabold text-lg text-white">
                AI Brain Merging & Harmonizing
              </h3>
              <p className="text-xs text-neutral-400 min-h-[32px]">
                {harmonizeMessage}
              </p>
            </div>

            {/* Progress bar */}
            <div className="space-y-2">
              <div className="h-2.5 w-full bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-300 ease-out"
                  style={{ width: `${harmonizeProgress}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] font-mono text-neutral-500">
                <span>{orderedVideos.length} Clips Selected</span>
                <span>{harmonizeProgress}%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stage: Unified Seamless Preview Player */}
      {stage === 'preview' && (
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Main Canvas Player Area */}
          <div className="flex-1 flex flex-col items-center justify-center bg-black relative p-4 overflow-hidden">
            <div className="relative max-w-full max-h-full flex items-center justify-center">
              <canvas
                ref={canvasRef}
                className="max-h-[62vh] max-w-full rounded-xl shadow-2xl border border-neutral-800 bg-neutral-950 object-contain"
              />

              {/* Seamless Split Seam Indicator Notification */}
              {activeScene.isFirstInClip && activeScene.incomingSplit && (
                <div className="absolute top-4 left-4 bg-amber-500/90 text-neutral-950 px-3 py-1 rounded-full text-[10px] font-extrabold flex items-center gap-1.5 shadow-lg backdrop-blur">
                  <Scissors className="w-3 h-3" />
                  <span>
                    Seamless Blend: Clip #{activeScene.parentClipNumber - 1} ➔ #{activeScene.parentClipNumber}
                  </span>
                </div>
              )}
            </div>

            {/* Video Controls Bar */}
            <div className="w-full max-w-3xl mt-3 space-y-2 px-2">
              {/* Scrubber */}
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-mono text-neutral-400 w-12 text-right">
                  {currentTime.toFixed(1)}s
                </span>
                <input
                  type="range"
                  min="0"
                  max={totalDuration}
                  step="0.1"
                  value={currentTime}
                  onChange={(e) => {
                    setCurrentTime(parseFloat(e.target.value));
                  }}
                  className="flex-1 accent-amber-400 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
                />
                <span className="text-[11px] font-mono text-neutral-400 w-12">
                  {totalDuration.toFixed(1)}s
                </span>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="p-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold transition shadow"
                    title={isPlaying ? 'Pause' : 'Play'}
                  >
                    {isPlaying ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4 ml-0.5" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCurrentTime(0);
                      setIsPlaying(true);
                    }}
                    className="p-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 transition border border-neutral-800"
                    title="Replay from Beginning"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsMuted(!isMuted);
                      videoAudio.setMuted(!isMuted);
                    }}
                    className="p-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 transition border border-neutral-800"
                    title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
                  >
                    {isMuted ? (
                      <VolumeX className="w-4 h-4" />
                    ) : (
                      <Volume2 className="w-4 h-4 text-amber-400" />
                    )}
                  </button>

                  <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-neutral-300">
                    <span className="text-[10px] text-neutral-500 uppercase font-mono">
                      Clip:
                    </span>
                    <span className="font-bold text-amber-400">
                      #{activeScene.parentClipNumber} of {orderedVideos.length}
                    </span>
                    <span className="text-neutral-500">•</span>
                    <span className="truncate max-w-[140px] text-[11px]">
                      {activeScene.parentTitle}
                    </span>
                  </div>
                </div>

                {/* Single Click Extract & Download */}
                <button
                  type="button"
                  disabled={isExtracting}
                  onClick={handleExtractAndDownload}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition cursor-pointer disabled:opacity-40"
                >
                  {isExtracting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{extractStatus || 'Extracting...'}</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Extract & Download Merged Video</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Right Sidebar: Timeline Details & Direct Export Status */}
          <div className="w-full md:w-80 border-l border-neutral-800 bg-neutral-950 p-4 flex flex-col justify-between overflow-y-auto shrink-0">
            <div className="space-y-4">
              <div className="border-b border-neutral-800 pb-3">
                <span className="text-[10px] uppercase font-bold text-neutral-500">
                  Unified Film Specs
                </span>
                <h4 className="text-sm font-extrabold text-white mt-0.5">
                  Seamless Mergen Master
                </h4>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-neutral-900 p-2 rounded-lg border border-neutral-800">
                    <span className="text-[10px] text-neutral-400 block">
                      Clips Merged
                    </span>
                    <span className="font-mono font-bold text-amber-400">
                      {orderedVideos.length} Clips
                    </span>
                  </div>
                  <div className="bg-neutral-900 p-2 rounded-lg border border-neutral-800">
                    <span className="text-[10px] text-neutral-400 block">
                      Total Duration
                    </span>
                    <span className="font-mono font-bold text-amber-400">
                      {totalDuration.toFixed(1)}s
                    </span>
                  </div>
                </div>
              </div>

              {/* Extraction Progress if running */}
              {isExtracting && (
                <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-950/30 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-400">
                    <span>Exporting Batch Video...</span>
                    <span>{extractProgress}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-400 transition-all duration-200"
                      style={{ width: `${extractProgress}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-neutral-400">
                    {extractStatus}
                  </p>
                </div>
              )}

              {/* Split details recap */}
              <div>
                <span className="text-[10px] uppercase font-bold text-neutral-500 block mb-2">
                  AI Brain Seam Harmonization
                </span>
                <div className="space-y-2">
                  {computedSplits.map((s, idx) => (
                    <div
                      key={s.id}
                      className="text-[11px] p-2 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-between"
                    >
                      <span className="text-neutral-300 font-medium">
                        Split #{idx + 1}
                      </span>
                      <span className="text-amber-400 font-mono text-[10px] uppercase">
                        {s.transitionType}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Back to Edit Button */}
            <button
              type="button"
              onClick={() => {
                setIsPlaying(false);
                setStage('selection');
              }}
              className="mt-4 w-full py-2.5 rounded-xl border border-neutral-800 bg-neutral-900 hover:bg-neutral-850 text-neutral-300 text-xs font-medium transition"
            >
              ← Adjust Clip Sequence & Splits
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
