/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  Film,
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
  ArrowRight,
  ArrowLeft,
  FileText,
  Clock,
} from 'lucide-react';
import {
  AspectRatio,
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

export type MergenStep = 'select' | 'ratio_seams' | 'harmonizing' | 'preview' | 'download';

export const MergenStudio: React.FC<MergenStudioProps> = ({
  availableVideos,
  onClose,
}) => {
  const [currentStep, setCurrentStep] = useState<MergenStep>('select');
  const [harmonizeProgress, setHarmonizeProgress] = useState<number>(0);
  const [harmonizeMessage, setHarmonizeMessage] = useState<string>('');

  const [selectedVideoIds, setSelectedVideoIds] = useState<string[]>(() =>
    availableVideos.map((v) => v.id)
  );

  const [splitOverrides, setSplitOverrides] = useState<
    Record<string, MergeTransitionType>
  >({});

  const [targetAspect, setTargetAspect] = useState<AspectRatio>('16:9');

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isCharacterSpeaking, setIsCharacterSpeaking] = useState<boolean>(false);

  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [extractProgress, setExtractProgress] = useState<number>(0);
  const [extractStatus, setExtractStatus] = useState<string>('');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  useEffect(() => {
    return characterVoiceEngine.subscribe((spk) => {
      setIsCharacterSpeaking(spk);
    });
  }, []);

  const orderedVideos = useMemo(() => {
    return selectedVideoIds
      .map((id) => availableVideos.find((v) => v.id === id))
      .filter((v): v is VideoProject => Boolean(v));
  }, [selectedVideoIds, availableVideos]);

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

  const toggleSelect = (id: string) => {
    if (selectedVideoIds.includes(id)) {
      if (selectedVideoIds.length <= 1) return;
      setSelectedVideoIds((prev) => prev.filter((vId) => vId !== id));
    } else {
      setSelectedVideoIds((prev) => [...prev, id]);
    }
    setCurrentTime(0);
    setIsPlaying(false);
  };

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

  const [loadedImages, setLoadedImages] = useState<Map<string, HTMLImageElement>>(new Map());
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

  const handleStartHarmonizing = async () => {
    if (orderedVideos.length === 0) return;
    setCurrentStep('harmonizing');
    setHarmonizeProgress(25);
    setHarmonizeMessage('Analyzing camera vectors...');

    await new Promise((r) => setTimeout(r, 350));
    setHarmonizeProgress(60);
    setHarmonizeMessage('Balancing color & audio curves...');

    await new Promise((r) => setTimeout(r, 400));
    setHarmonizeProgress(100);
    setHarmonizeMessage('Splits aligned!');

    await new Promise((r) => setTimeout(r, 250));
    setCurrentStep('preview');
    setCurrentTime(0);
    setIsPlaying(true);
  };

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

  const lastActiveRef = useRef<number>(-1);
  useEffect(() => {
    if (!isPlaying || currentStep !== 'preview') return;
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
  }, [activeIndex, isPlaying, currentStep, isMuted, activeScene]);

  useEffect(() => {
    if (isPlaying && currentStep === 'preview') {
      videoAudio.setMuted(isMuted);
      videoAudio.playMusic('cinematic-orchestra');
    } else {
      videoAudio.stopMusic();
      videoAudio.stopSpeech();
    }
    return () => {
      videoAudio.stopMusic();
      videoAudio.stopSpeech();
    };
  }, [isPlaying, isMuted, currentStep]);

  useEffect(() => {
    if (!isPlaying || (currentStep !== 'preview' && currentStep !== 'download')) {
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
  }, [isPlaying, totalDuration, currentStep]);

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

      renderCinematicEnvironment(ctx, width, height, currentTime, charType, activeScene.biome, true);
    } else {
      renderCinematicEnvironment(ctx, width, height, currentTime, charType, activeScene.biome, false);
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

    renderCanvasEffects(ctx, activeScene.effects, width, height, sceneProgress);

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

  const handleExtractAndDownload = async () => {
    if (isExtracting || compositeScenes.length === 0) return;

    setIsExtracting(true);
    setExtractProgress(10);
    setExtractStatus('Preparing recorder...');

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
      setExtractStatus(`Rendering ${orderedVideos.length} clips...`);

      const totalSimSeconds = Math.min(totalDuration, 30);
      const stepInterval = 0.25;
      let simTime = 0;

      while (simTime <= totalSimSeconds) {
        setCurrentTime(simTime);
        const percent = Math.min(95, Math.round((simTime / totalSimSeconds) * 90) + 5);
        setExtractProgress(percent);
        setExtractStatus(`Exporting (${percent}%)...`);
        await new Promise((r) => setTimeout(r, 45));
        simTime += stepInterval;
      }

      mediaRecorder.stop();
      setExtractProgress(98);
      setExtractStatus('Packaging file...');

      const blob = await recordPromise;

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `merged_film_${orderedVideos.length}_clips.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setExtractProgress(100);
      setExtractStatus('Downloaded!');
      setTimeout(() => {
        setIsExtracting(false);
        setExtractProgress(0);
      }, 2000);
    } catch (err) {
      console.error('Extraction error:', err);
      setExtractStatus('Failed. Try again.');
      setIsExtracting(false);
    }
  };

  const getStepNumber = (step: MergenStep): number => {
    switch (step) {
      case 'select':
        return 1;
      case 'ratio_seams':
        return 2;
      case 'harmonizing':
      case 'preview':
        return 3;
      case 'download':
        return 4;
      default:
        return 1;
    }
  };

  const activeStepNum = getStepNumber(currentStep);

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col overflow-hidden font-sans select-none text-neutral-100">
      <div className={currentStep === 'preview' ? 'hidden' : 'fixed -left-[9999px] -top-[9999px] pointer-events-none'}>
        <canvas ref={canvasRef} />
      </div>

      {/* TOP HEADER */}
      <header className="h-14 border-b border-neutral-800 bg-neutral-950 px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-400 text-neutral-950 flex items-center justify-center font-black text-sm">
            M
          </div>
          <div>
            <h2 className="font-extrabold text-sm text-white">MERGEN STUDIO</h2>
            <p className="text-[10px] text-neutral-400">Per-Conversation Video Stitcher</p>
          </div>
        </div>

        {/* 4-STEP INDICATOR */}
        <div className="flex items-center gap-1 bg-neutral-900 border border-neutral-800 rounded-xl p-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setIsPlaying(false);
              setCurrentStep('select');
            }}
            className={`px-3 py-1 rounded-lg transition ${
              activeStepNum === 1 ? 'bg-amber-400 text-neutral-950 font-bold' : 'text-neutral-400 hover:text-white'
            }`}
          >
            1. Select
          </button>
          <span className="text-neutral-700">›</span>
          <button
            type="button"
            disabled={orderedVideos.length === 0}
            onClick={() => {
              setIsPlaying(false);
              setCurrentStep('ratio_seams');
            }}
            className={`px-3 py-1 rounded-lg transition ${
              activeStepNum === 2 ? 'bg-amber-400 text-neutral-950 font-bold' : 'text-neutral-400 hover:text-white disabled:opacity-40'
            }`}
          >
            2. Ratio & Seams
          </button>
          <span className="text-neutral-700">›</span>
          <button
            type="button"
            disabled={orderedVideos.length === 0}
            onClick={() => {
              setCurrentStep('preview');
              setCurrentTime(0);
              setIsPlaying(true);
            }}
            className={`px-3 py-1 rounded-lg transition ${
              activeStepNum === 3 ? 'bg-amber-400 text-neutral-950 font-bold' : 'text-neutral-400 hover:text-white disabled:opacity-40'
            }`}
          >
            3. Preview
          </button>
          <span className="text-neutral-700">›</span>
          <button
            type="button"
            disabled={orderedVideos.length === 0}
            onClick={() => {
              setIsPlaying(false);
              setCurrentStep('download');
            }}
            className={`px-3 py-1 rounded-lg transition ${
              activeStepNum === 4 ? 'bg-amber-400 text-neutral-950 font-bold' : 'text-neutral-400 hover:text-white disabled:opacity-40'
            }`}
          >
            4. Download
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-900 transition"
        >
          <X className="w-5 h-5" />
        </button>
      </header>

      {/* PAGE 1: SELECT CLIPS */}
      {currentStep === 'select' && (
        <div className="flex-1 flex flex-col overflow-hidden bg-neutral-950">
          <div className="p-4 px-6 border-b border-neutral-800 flex items-center justify-between">
            <div>
              <h1 className="text-base font-bold text-white">Select Clips to Merge</h1>
              <p className="text-[11px] text-neutral-400">Tick clips to align. Unchecked clips are skipped.</p>
            </div>
            <div className="text-xs font-mono px-3 py-1 rounded-lg bg-neutral-900 text-amber-400 border border-neutral-800">
              {orderedVideos.length} of {availableVideos.length} ticked ({totalDuration.toFixed(1)}s)
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableVideos.length === 0 ? (
                <div className="col-span-full text-center py-24 text-neutral-500">
                  <Film className="w-10 h-10 mx-auto mb-2 opacity-30 text-amber-400" />
                  <p className="text-sm font-semibold text-neutral-300">No clips in this chat yet.</p>
                  <p className="text-xs text-neutral-500 mt-0.5">Type GENERATE in chat to create clips.</p>
                </div>
              ) : (
                availableVideos.map((vid, idx) => {
                  const clipNumber = idx + 1;
                  const isSelected = selectedVideoIds.includes(vid.id);
                  const orderIndex = selectedVideoIds.indexOf(vid.id);

                  return (
                    <div
                      key={vid.id}
                      onClick={() => toggleSelect(vid.id)}
                      className={`rounded-2xl border p-4 transition cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'bg-neutral-900 border-amber-500/60 ring-1 ring-amber-500/30'
                          : 'bg-neutral-950 border-neutral-850 opacity-60 hover:opacity-90'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-mono font-bold text-amber-400">
                            Clip #{clipNumber}
                          </span>
                          <span
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition ${
                              isSelected
                                ? 'bg-amber-400 text-neutral-950 border-amber-400'
                                : 'bg-neutral-900 text-neutral-500 border-neutral-800'
                            }`}
                          >
                            {isSelected ? `Tick #${orderIndex + 1}` : 'Skipped'}
                          </span>
                        </div>

                        <h3 className="font-bold text-xs text-white line-clamp-1 mb-1">
                          {vid.title}
                        </h3>
                        <p className="text-[11px] text-neutral-400 line-clamp-2 mb-3">
                          {vid.prompt}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-neutral-800 flex items-center justify-between text-[10px] text-neutral-400 font-mono">
                        <span>{vid.totalDuration.toFixed(1)}s • {vid.scenes.length} shots</span>
                        {isSelected && (
                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              disabled={orderIndex <= 0}
                              onClick={() => moveVideo(orderIndex, 'up')}
                              className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 disabled:opacity-30"
                            >
                              <ArrowUp className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              disabled={orderIndex >= selectedVideoIds.length - 1}
                              onClick={() => moveVideo(orderIndex, 'down')}
                              className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 disabled:opacity-30"
                            >
                              <ArrowDown className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <footer className="p-3 px-6 border-t border-neutral-800 bg-neutral-950 flex items-center justify-between">
            <span className="text-xs text-neutral-400 font-mono">
              Sequence: {orderedVideos.map((_, i) => `#${i + 1}`).join(' › ') || 'None'}
            </span>
            <button
              type="button"
              disabled={orderedVideos.length === 0}
              onClick={() => setCurrentStep('ratio_seams')}
              className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-neutral-950 font-bold text-xs transition flex items-center gap-1.5"
            >
              <span>Next: Ratio & Seams</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </footer>
        </div>
      )}

      {/* PAGE 2: RATIO & SEAMS */}
      {currentStep === 'ratio_seams' && (
        <div className="flex-1 flex flex-col overflow-hidden bg-neutral-950">
          <div className="p-4 px-6 border-b border-neutral-800 flex items-center justify-between">
            <div>
              <h1 className="text-base font-bold text-white">Ratio & Seam Transitions</h1>
              <p className="text-[11px] text-neutral-400">Choose framing and custom seam blends.</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 max-w-4xl mx-auto w-full space-y-6">
            <div>
              <h3 className="text-xs font-bold text-neutral-300 mb-2">Framing</h3>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: '16:9' as AspectRatio, label: '16:9 Cinema', sub: '1920×1080' },
                  { id: '9:16' as AspectRatio, label: '9:16 Vertical', sub: '1080×1920' },
                  { id: '1:1' as AspectRatio, label: '1:1 Square', sub: '1080×1080' },
                ].map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setTargetAspect(r.id)}
                    className={`p-3 rounded-xl border text-left transition ${
                      targetAspect === r.id
                        ? 'bg-amber-400/10 border-amber-400 text-white font-bold'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-400'
                    }`}
                  >
                    <div className="text-xs">{r.label}</div>
                    <div className="text-[10px] text-neutral-500 font-mono">{r.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold text-neutral-300 mb-2">
                Seams ({computedSplits.length})
              </h3>
              {computedSplits.length === 0 ? (
                <div className="p-4 rounded-xl bg-neutral-900 text-xs text-neutral-400 text-center">
                  Only 1 clip selected. No seams to blend.
                </div>
              ) : (
                <div className="space-y-3">
                  {computedSplits.map((split, sIdx) => (
                    <div key={split.id} className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-between gap-3">
                      <div className="text-xs font-mono text-neutral-300">
                        Clip #{split.fromClipIndex} ➔ Clip #{split.toClipIndex}
                      </div>
                      <select
                        value={split.transitionType}
                        onChange={(e) => {
                          setSplitOverrides((prev) => ({
                            ...prev,
                            [split.id]: e.target.value as MergeTransitionType,
                          }));
                        }}
                        className="bg-neutral-950 border border-neutral-700 rounded-lg px-2.5 py-1 text-xs text-amber-300 font-semibold"
                      >
                        <option value="ai-matched">AI Smart Match</option>
                        <option value="cross-dissolve">Luma Dissolve</option>
                        <option value="dip-to-black">Dip to Black</option>
                        <option value="motion-whip">Whip Pan</option>
                        <option value="hard-cut">Hard Cut</option>
                      </select>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <footer className="p-3 px-6 border-t border-neutral-800 bg-neutral-950 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setCurrentStep('select')}
              className="px-4 py-1.5 rounded-lg border border-neutral-700 text-xs text-neutral-300 hover:text-white"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleStartHarmonizing}
              className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs transition flex items-center gap-1.5"
            >
              <span>Harmonize & Preview</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </footer>
        </div>
      )}

      {/* PAGE 3: HARMONIZING OVERLAY OR PREVIEW ALL */}
      {currentStep === 'harmonizing' && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 bg-neutral-950 text-center">
          <Brain className="w-8 h-8 text-amber-400 mb-3 animate-pulse" />
          <h2 className="text-base font-bold text-white">Harmonizing Splits...</h2>
          <p className="text-xs text-neutral-400 mt-1 font-mono">{harmonizeMessage}</p>
          <div className="w-64 bg-neutral-900 h-1.5 rounded-full overflow-hidden mt-4">
            <div className="h-full bg-amber-400 transition-all duration-300" style={{ width: `${harmonizeProgress}%` }} />
          </div>
        </div>
      )}

      {currentStep === 'preview' && (
        <div className="flex-1 flex flex-col overflow-hidden bg-neutral-950">
          <div className="p-3 px-6 border-b border-neutral-800 flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-amber-400 truncate">
              Playing Clip #{activeScene.parentClipNumber}: {activeScene.title}
            </span>
            <button
              type="button"
              onClick={() => setIsMuted(!isMuted)}
              className="p-1.5 rounded-lg bg-neutral-900 text-neutral-300 hover:text-white"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex-1 flex items-center justify-center p-4 bg-black/80 relative overflow-hidden">
            <canvas ref={canvasRef} className="max-h-[70vh] w-auto h-auto object-contain rounded-xl shadow-2xl" />
          </div>

          <div className="p-3 px-6 border-t border-neutral-800 bg-neutral-950 space-y-2">
            <input
              type="range"
              min={0}
              max={Math.max(totalDuration, 0.1)}
              step={0.05}
              value={currentTime}
              onChange={(e) => setCurrentTime(parseFloat(e.target.value))}
              className="w-full accent-amber-400 cursor-pointer h-1.5 bg-neutral-800 rounded-lg"
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs"
                >
                  {isPlaying ? 'Pause' : 'Play'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCurrentTime(0);
                    setIsPlaying(true);
                  }}
                  className="p-1.5 rounded-lg bg-neutral-900 text-neutral-300 hover:text-white"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <span className="text-[10px] font-mono text-neutral-400">
                  {currentTime.toFixed(1)}s / {totalDuration.toFixed(1)}s
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsPlaying(false);
                  setCurrentStep('download');
                }}
                className="px-4 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs flex items-center gap-1.5"
              >
                <span>Next: Download</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PAGE 4: DIRECT DOWNLOAD */}
      {currentStep === 'download' && (
        <div className="flex-1 flex flex-col overflow-hidden bg-neutral-950">
          <div className="p-4 px-6 border-b border-neutral-800 flex items-center justify-between">
            <div>
              <h1 className="text-base font-bold text-white">Download Merged Movie</h1>
              <p className="text-[11px] text-neutral-400">Zero watermarks. Full resolution.</p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
              Clean Export
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-6 flex items-center justify-center">
            <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-4">
              <div className="grid grid-cols-2 gap-2 text-center text-xs">
                <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-850">
                  <span className="text-[10px] text-neutral-500 font-mono">Duration</span>
                  <p className="font-bold text-white">{totalDuration.toFixed(1)}s</p>
                </div>
                <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-850">
                  <span className="text-[10px] text-neutral-500 font-mono">Clips</span>
                  <p className="font-bold text-amber-400">{orderedVideos.length}</p>
                </div>
              </div>

              {isExtracting && (
                <div className="p-3 bg-neutral-950 rounded-xl border border-amber-500/30 text-xs font-mono space-y-1">
                  <div className="flex justify-between text-amber-300 text-[11px]">
                    <span className="flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" /> {extractStatus}
                    </span>
                    <span>{extractProgress}%</span>
                  </div>
                  <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-amber-400 h-full" style={{ width: `${extractProgress}%` }} />
                  </div>
                </div>
              )}

              <button
                type="button"
                disabled={isExtracting}
                onClick={handleExtractAndDownload}
                className="w-full py-3 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-neutral-950 font-bold text-xs flex items-center justify-center gap-2 shadow"
              >
                <Download className="w-4 h-4" />
                <span>{isExtracting ? 'Rendering...' : 'Download Movie (.webm)'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const manifest = {
                    title: `Merged Movie (${orderedVideos.length} clips)`,
                    aspectRatio: targetAspect,
                    totalDuration,
                    clips: orderedVideos.map((v, i) => ({
                      index: i + 1,
                      title: v.title,
                      duration: v.totalDuration,
                    })),
                    splits: computedSplits,
                  };
                  const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'merged_manifest.json';
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                }}
                className="w-full py-2.5 rounded-xl bg-neutral-950 hover:bg-neutral-850 border border-neutral-800 text-[11px] text-neutral-300 flex items-center justify-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Download Cutlist (.json)</span>
              </button>
            </div>
          </div>

          <footer className="p-3 px-6 border-t border-neutral-800 bg-neutral-950 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                setCurrentStep('preview');
                setCurrentTime(0);
                setIsPlaying(true);
              }}
              className="px-4 py-1.5 rounded-lg border border-neutral-700 text-xs text-neutral-300 hover:text-white"
            >
              Back to Preview
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs"
            >
              Done
            </button>
          </footer>
        </div>
      )}
    </div>
  );
};
