/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import { CharacterPuppet, PropItem, Scene } from '../types/animation';
import { BackgroundRenderer } from './BackgroundRenderer';
import { PuppetRenderer } from './PuppetRenderer';
import { PropRenderer } from './PropRenderer';
import { WeatherOverlay } from './WeatherOverlay';
import { clamp } from '../utils/animationEngine';

interface StageCanvasProps {
  scene: Scene;
  currentTime: number;
  selectedEntityId: string | null;
  selectedEntityType: 'character' | 'prop' | 'scene' | null;
  onionSkinning: boolean;
  isPlaying: boolean;
  onSelectEntity: (
    id: string | null,
    type: 'character' | 'prop' | 'scene' | null
  ) => void;
  onUpdateCharacterPosition: (
    charId: string,
    x: number,
    y: number
  ) => void;
  onUpdatePropPosition: (
    propId: string,
    x: number,
    y: number
  ) => void;
  onStageClick?: () => void;
}

export const StageCanvas: React.FC<StageCanvasProps> = ({
  scene,
  currentTime,
  selectedEntityId,
  selectedEntityType,
  onionSkinning,
  isPlaying,
  onSelectEntity,
  onUpdateCharacterPosition,
  onUpdatePropPosition,
}) => {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [draggingEntity, setDraggingEntity] = useState<{
    id: string;
    type: 'character' | 'prop';
  } | null>(null);

  const handlePointerDown = (
    e: React.PointerEvent,
    id: string,
    type: 'character' | 'prop'
  ) => {
    if (isPlaying) return;
    e.stopPropagation();
    onSelectEntity(id, type);
    setDraggingEntity({ id, type });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingEntity || !stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    const x = clamp(((e.clientX - rect.left) / rect.width) * 100, 5, 95);
    const y = clamp(((e.clientY - rect.top) / rect.height) * 100, 10, 90);

    if (draggingEntity.type === 'character') {
      onUpdateCharacterPosition(draggingEntity.id, Math.round(x), Math.round(y));
    } else {
      onUpdatePropPosition(draggingEntity.id, Math.round(x), Math.round(y));
    }
  };

  const handlePointerUp = () => {
    setDraggingEntity(null);
  };

  // Find active speech if any character is talking at this timestamp
  const activeSpeakingCharacter = scene.characters.find(
    (c) => c.speechText && c.speechText.trim() !== ''
  );

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center p-2 sm:p-4 select-none">
      {/* 16:9 Aspect Ratio Frame Container */}
      <div
        ref={stageRef}
        id="tale-stage-viewport"
        data-testid="stage-viewport"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onClick={() => onSelectEntity(null, 'scene')}
        className="relative w-full max-w-5xl aspect-video bg-neutral-900 rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10"
      >
        {/* Animated Background */}
        <BackgroundRenderer theme={scene.background} currentTime={currentTime} />

        {/* Weather / Atmospheric Particle Layer */}
        <WeatherOverlay effect={scene.weatherEffect} currentTime={currentTime} />

        {/* Onion Skinning Ghosts (if enabled and paused) */}
        {onionSkinning && !isPlaying && (
          <>
            {scene.characters.map((char) => {
              const prevTime = Math.max(0, currentTime - 0.5);
              const nextTime = Math.min(scene.duration, currentTime + 0.5);
              return (
                <React.Fragment key={`onion-${char.id}`}>
                  {prevTime !== currentTime && (
                    <PuppetRenderer
                      character={char}
                      currentTime={prevTime}
                      duration={scene.duration}
                      isOnionSkin
                      opacity={0.25}
                    />
                  )}
                  {nextTime !== currentTime && (
                    <PuppetRenderer
                      character={char}
                      currentTime={nextTime}
                      duration={scene.duration}
                      isOnionSkin
                      opacity={0.35}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </>
        )}

        {/* Props Layer */}
        {scene.props.map((prop) => (
          <div
            key={prop.id}
            onPointerDown={(e) => handlePointerDown(e, prop.id, 'prop')}
          >
            <PropRenderer
              prop={prop}
              currentTime={currentTime}
              isSelected={
                selectedEntityType === 'prop' && selectedEntityId === prop.id
              }
              onSelect={() => onSelectEntity(prop.id, 'prop')}
            />
          </div>
        ))}

        {/* Characters Layer */}
        {scene.characters.map((char) => (
          <div
            key={char.id}
            onPointerDown={(e) => handlePointerDown(e, char.id, 'character')}
          >
            <PuppetRenderer
              character={char}
              currentTime={currentTime}
              duration={scene.duration}
              isSelected={
                selectedEntityType === 'character' &&
                selectedEntityId === char.id
              }
              onSelect={() => onSelectEntity(char.id, 'character')}
            />
          </div>
        ))}

        {/* Stage Watermark / Branding */}
        <div className="absolute top-3 left-4 flex items-center gap-2 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 pointer-events-none z-30">
          <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          <span className="text-[11px] font-bold tracking-wider uppercase text-amber-200">
            Tale Trove
          </span>
          <span className="text-[10px] text-white/50 font-mono">
            {scene.title.split(':')[0]}
          </span>
        </div>

        {/* Cinematic Narration Subtitles */}
        {scene.narration && (
          <div className="absolute bottom-4 inset-x-8 text-center pointer-events-none z-35">
            <div className="inline-block max-w-2xl px-4 py-2 rounded-xl bg-black/75 backdrop-blur-md border border-white/10 text-white text-xs sm:text-sm font-medium tracking-wide shadow-2xl">
              <span className="text-amber-400 font-bold mr-1.5">Narrator:</span>
              <span>{scene.narration}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
