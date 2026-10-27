/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  SkipBack,
  X,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { AnimationProject } from '../types/animation';
import { BackgroundRenderer } from './BackgroundRenderer';
import { WeatherOverlay } from './WeatherOverlay';
import { PuppetRenderer } from './PuppetRenderer';
import { PropRenderer } from './PropRenderer';
import { studioAudio } from '../utils/audioEngine';

interface TheaterModalProps {
  project: AnimationProject;
  isOpen: boolean;
  onClose: () => void;
}

export const TheaterModal: React.FC<TheaterModalProps> = ({
  project,
  isOpen,
  onClose,
}) => {
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [sceneTime, setSceneTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const activeScene = project.scenes[currentSceneIndex] || project.scenes[0];

  // Start scene narration & audio when entering a scene
  useEffect(() => {
    if (!isOpen || !activeScene) return;

    if (!isMuted) {
      studioAudio.playMusic(activeScene.bgMusic);
      studioAudio.speakNarration(activeScene.narration);
    }

    return () => {
      studioAudio.stopNarration();
    };
  }, [isOpen, currentSceneIndex, isMuted, activeScene]);

  // Main playback loop
  useEffect(() => {
    if (!isOpen || !isPlaying || !activeScene) return;

    let animId: number;
    let lastTime = performance.now();

    const loop = (now: number) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      setSceneTime((prev) => {
        const nextTime = prev + dt;
        if (nextTime >= activeScene.duration) {
          // Move to next scene if available
          if (currentSceneIndex < project.scenes.length - 1) {
            setCurrentSceneIndex((idx) => idx + 1);
            return 0;
          } else {
            // Story finished: loop or pause
            setIsPlaying(false);
            return activeScene.duration;
          }
        }
        return nextTime;
      });

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isOpen, isPlaying, currentSceneIndex, activeScene, project.scenes.length]);

  if (!isOpen || !activeScene) return null;

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    studioAudio.setMuted(nextMuted);
    if (!nextMuted && activeScene) {
      studioAudio.playMusic(activeScene.bgMusic);
    }
  };

  const handleNextScene = () => {
    if (currentSceneIndex < project.scenes.length - 1) {
      setCurrentSceneIndex((i) => i + 1);
      setSceneTime(0);
      setIsPlaying(true);
    }
  };

  const handlePrevScene = () => {
    if (currentSceneIndex > 0) {
      setCurrentSceneIndex((i) => i - 1);
      setSceneTime(0);
      setIsPlaying(true);
    }
  };

  const handleReplay = () => {
    setSceneTime(0);
    setIsPlaying(true);
    if (!isMuted) {
      studioAudio.speakNarration(activeScene.narration);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <div
      data-testid="theater-modal"
      className="fixed inset-0 z-50 bg-black flex flex-col justify-between select-none animate-in fade-in duration-300"
    >
      {/* Top Overlay Bar */}
      <div className="absolute top-0 inset-x-0 h-20 bg-gradient-to-b from-black/90 via-black/50 to-transparent flex items-center justify-between px-6 z-40 pointer-events-auto">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500 text-black flex items-center justify-center font-bold text-sm shadow">
            ★
          </div>
          <div>
            <h2 className="text-white font-bold text-base tracking-wide drop-shadow">
              {project.title}
            </h2>
            <span className="text-xs text-amber-400/90 font-medium">
              {activeScene.title} (Scene {currentSceneIndex + 1} of{' '}
              {project.scenes.length})
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleMute}
            className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? (
              <VolumeX className="w-5 h-5" />
            ) : (
              <Volume2 className="w-5 h-5 text-amber-400" />
            )}
          </button>
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? (
              <Minimize2 className="w-5 h-5" />
            ) : (
              <Maximize2 className="w-5 h-5" />
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              studioAudio.stopMusic();
              studioAudio.stopNarration();
              onClose();
            }}
            data-testid="close-theater-btn"
            className="p-2.5 rounded-full bg-white/15 hover:bg-rose-600 text-white backdrop-blur-md transition ml-2"
            title="Exit Theater"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Center 16:9 Cinema Viewport */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="relative w-full max-w-6xl aspect-video rounded-xl overflow-hidden shadow-[0_0_60px_rgba(0,0,0,0.9)] ring-1 ring-white/10">
          <BackgroundRenderer
            theme={activeScene.background}
            currentTime={sceneTime}
          />
          <WeatherOverlay
            effect={activeScene.weatherEffect}
            currentTime={sceneTime}
          />

          {/* Render Props */}
          {activeScene.props.map((prop) => (
            <PropRenderer
              key={prop.id}
              prop={prop}
              currentTime={sceneTime}
            />
          ))}

          {/* Render Puppets */}
          {activeScene.characters.map((char) => (
            <PuppetRenderer
              key={char.id}
              character={char}
              currentTime={sceneTime}
              duration={activeScene.duration}
            />
          ))}

          {/* Theater Subtitle Banner */}
          {activeScene.narration && (
            <div className="absolute bottom-6 inset-x-8 text-center pointer-events-none z-35 animate-in slide-in-from-bottom-2">
              <div className="inline-block max-w-3xl px-6 py-3 rounded-2xl bg-black/85 backdrop-blur-md border border-white/15 text-white text-sm sm:text-base font-medium tracking-wide shadow-2xl">
                <span className="text-amber-400 font-bold mr-2">Narrator:</span>
                <span>{activeScene.narration}</span>
              </div>
            </div>
          )}

          {/* Progress bar along the very bottom edge of viewport */}
          <div className="absolute bottom-0 inset-x-0 h-1.5 bg-black/50 z-40">
            <div
              className="h-full bg-amber-400 transition-all duration-100 ease-linear"
              style={{
                width: `${(sceneTime / activeScene.duration) * 100}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Bottom Floating Control Dock */}
      <div className="relative h-24 bg-gradient-to-t from-black/95 via-black/60 to-transparent flex flex-col items-center justify-center pb-4 z-40">
        <div className="flex items-center gap-3 px-6 py-2 rounded-2xl bg-neutral-900/80 backdrop-blur-md border border-white/10 shadow-2xl">
          <button
            type="button"
            onClick={handlePrevScene}
            disabled={currentSceneIndex === 0}
            className="p-2 text-white/70 hover:text-white disabled:opacity-30 transition"
            title="Previous Scene"
          >
            <SkipBack className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={handleReplay}
            className="p-2 text-white/70 hover:text-white transition"
            title="Replay Scene"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-12 h-12 rounded-xl bg-amber-500 hover:bg-amber-400 text-black flex items-center justify-center font-bold shadow-lg transition active:scale-95"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 fill-current" />
            ) : (
              <Play className="w-6 h-6 fill-current ml-0.5" />
            )}
          </button>

          <button
            type="button"
            onClick={handleNextScene}
            disabled={currentSceneIndex >= project.scenes.length - 1}
            className="p-2 text-white/70 hover:text-white disabled:opacity-30 transition"
            title="Next Scene"
          >
            <SkipForward className="w-5 h-5" />
          </button>

          <div className="h-6 w-px bg-white/20 mx-2" />

          {/* Scene selector pills */}
          <div className="flex items-center gap-1.5">
            {project.scenes.map((s, idx) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setCurrentSceneIndex(idx);
                  setSceneTime(0);
                  setIsPlaying(true);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                  currentSceneIndex === idx
                    ? 'bg-amber-500 text-black shadow'
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                Scene {idx + 1}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
