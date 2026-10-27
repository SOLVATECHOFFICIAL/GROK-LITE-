/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CharacterPuppet } from '../types/animation';
import {
  calculatePoseOffset,
  interpolateCharacterAtTime,
} from '../utils/animationEngine';

interface PuppetRendererProps {
  character: CharacterPuppet;
  currentTime: number;
  duration: number;
  isSelected?: boolean;
  isOnionSkin?: boolean;
  opacity?: number;
  onSelect?: () => void;
  isDragging?: boolean;
}

export const PuppetRenderer: React.FC<PuppetRendererProps> = ({
  character,
  currentTime,
  duration,
  isSelected = false,
  isOnionSkin = false,
  opacity = 1,
  onSelect,
}) => {
  const normalizedTime = duration > 0 ? currentTime / duration : 0;
  const interp = interpolateCharacterAtTime(character, normalizedTime);

  // Procedural offsets for lively breathing, bouncing, or walk loops
  const isMoving = character.keyframes.length > 1;
  const poseOffset = calculatePoseOffset(interp.pose, currentTime, isMoving);

  const posX = interp.x;
  const posY = interp.y + (poseOffset.bodyOffsetY / 10);
  const totalRotation = interp.rotation + poseOffset.bodyRotation;
  const totalScale = interp.scale * poseOffset.breathingScale;

  // Render SVG Character Puppet according to type
  const renderVectorBody = () => {
    switch (character.type) {
      case 'fox':
        return (
          <g>
            {/* Swishing Tail */}
            <path
              d="M-20,15 C-45,25 -50,-5 -35,-20 C-30,-25 -20,-15 -25,-5 Z"
              fill="#ea580c"
              transform={`rotate(${Math.sin(currentTime * 4) * 15}, -20, 15)`}
            />
            <path
              d="M-40,-12 C-45,-18 -42,-22 -35,-20 C-32,-18 -36,-10 -40,-12 Z"
              fill="#f8fafc"
              transform={`rotate(${Math.sin(currentTime * 4) * 15}, -20, 15)`}
            />

            {/* Back Legs */}
            <ellipse cx="-12" cy="38" rx="8" ry="12" fill="#c2410c" />
            <ellipse cx="12" cy="38" rx="8" ry="12" fill="#c2410c" />

            {/* Body */}
            <ellipse cx="0" cy="18" rx="22" ry="26" fill="#ea580c" />
            {/* White Chest */}
            <path
              d="M-10,6 C-14,20 -10,32 0,38 C10,32 14,20 10,6 C6,16 -6,16 -10,6 Z"
              fill="#f8fafc"
            />

            {/* Head */}
            <g transform="translate(0, -12)">
              {/* Ears */}
              <polygon points="-18,-15 -26,-42 -6,-28" fill="#c2410c" />
              <polygon points="-16,-18 -22,-36 -8,-26" fill="#f8fafc" />
              <polygon points="18,-15 26,-42 6,-28" fill="#c2410c" />
              <polygon points="16,-18 22,-36 8,-26" fill="#f8fafc" />

              {/* Head Base */}
              <ellipse cx="0" cy="-6" rx="22" ry="18" fill="#ea580c" />
              <path
                d="M-22,-4 C-20,8 -12,16 0,18 C12,16 20,8 22,-4 C16,4 4,6 0,6 C-4,6 -16,4 -22,-4 Z"
                fill="#f8fafc"
              />

              {/* Eyes */}
              {interp.emotion === 'sleepy' ? (
                <>
                  <path d="M-12,-8 Q-8,-4 -4,-8" stroke="#1c1917" strokeWidth="2.5" fill="none" />
                  <path d="M4,-8 Q8,-4 12,-8" stroke="#1c1917" strokeWidth="2.5" fill="none" />
                </>
              ) : interp.emotion === 'surprised' ? (
                <>
                  <circle cx="-8" cy="-8" r="4.5" fill="#1c1917" />
                  <circle cx="-9" cy="-9" r="1.5" fill="#ffffff" />
                  <circle cx="8" cy="-8" r="4.5" fill="#1c1917" />
                  <circle cx="7" cy="-9" r="1.5" fill="#ffffff" />
                </>
              ) : (
                <>
                  <ellipse cx="-8" cy="-7" rx="3" ry="4" fill="#1c1917" />
                  <circle cx="-9" cy="-8" r="1.2" fill="#ffffff" />
                  <ellipse cx="8" cy="-7" rx="3" ry="4" fill="#1c1917" />
                  <circle cx="7" cy="-8" r="1.2" fill="#ffffff" />
                </>
              )}

              {/* Snout & Nose */}
              <ellipse cx="0" cy="0" rx="6" ry="4" fill="#f8fafc" />
              <polygon points="-3,-1 3,-1 0,3" fill="#1c1917" />

              {/* Mouth */}
              {interp.emotion === 'happy' || interp.emotion === 'talking' ? (
                <path
                  d="M-4,5 Q0,9 4,5"
                  stroke="#1c1917"
                  strokeWidth="2"
                  fill={interp.emotion === 'talking' ? '#991b1b' : 'none'}
                />
              ) : interp.emotion === 'dramatic' ? (
                <ellipse cx="0" cy="6" rx="3" ry="4" fill="#991b1b" />
              ) : (
                <line x1="-3" y1="5" x2="3" y2="5" stroke="#1c1917" strokeWidth="2" />
              )}
            </g>

            {/* Front Paws / Animated Limbs */}
            <ellipse
              cx="-10"
              cy="34"
              rx="5"
              ry="10"
              fill="#c2410c"
              transform={`rotate(${poseOffset.limbAngle}, -10, 30)`}
            />
            <ellipse
              cx="10"
              cy="34"
              rx="5"
              ry="10"
              fill="#c2410c"
              transform={`rotate(${-poseOffset.limbAngle}, 10, 30)`}
            />
          </g>
        );

      case 'owl':
        return (
          <g>
            {/* Owl Body */}
            <ellipse cx="0" cy="12" rx="24" ry="28" fill="#78350f" />
            {/* Feathers */}
            <ellipse cx="0" cy="18" rx="16" ry="18" fill="#b45309" />
            <path
              d="M-8,14 Q0,10 8,14 M-6,22 Q0,18 6,22 M-4,28 Q0,25 4,28"
              stroke="#fef3c7"
              strokeWidth="2"
              fill="none"
            />

            {/* Wings */}
            <path
              d="M-22,0 C-36,12 -34,36 -20,40 C-22,30 -18,15 -18,4 Z"
              fill="#451a03"
              transform={`rotate(${poseOffset.limbAngle * 0.8}, -20, 10)`}
            />
            <path
              d="M22,0 C36,12 34,36 20,40 C22,30 18,15 18,4 Z"
              fill="#451a03"
              transform={`rotate(${-poseOffset.limbAngle * 0.8}, 20, 10)`}
            />

            {/* Owl Head */}
            <g transform="translate(0, -14)">
              {/* Feather Horns / Tufts */}
              <polygon points="-16,-12 -24,-32 -8,-20" fill="#451a03" />
              <polygon points="16,-12 24,-32 8,-20" fill="#451a03" />

              <circle cx="0" cy="-6" r="22" fill="#78350f" />
              {/* Eye Circles */}
              <circle cx="-9" cy="-6" r="9" fill="#fef08a" />
              <circle cx="9" cy="-6" r="9" fill="#fef08a" />
              <circle cx="-9" cy="-6" r="5" fill="#1c1917" />
              <circle cx="9" cy="-6" r="5" fill="#1c1917" />
              <circle cx="-10.5" cy="-8" r="1.5" fill="#ffffff" />
              <circle cx="7.5" cy="-8" r="1.5" fill="#ffffff" />

              {/* Beak */}
              <polygon points="-4,-2 4,-2 0,6" fill="#f59e0b" />
            </g>

            {/* Talons */}
            <rect x="-12" y="38" width="6" height="6" rx="2" fill="#f59e0b" />
            <rect x="6" y="38" width="6" height="6" rx="2" fill="#f59e0b" />
          </g>
        );

      case 'robot':
        return (
          <g>
            {/* Robot Head */}
            <g transform="translate(0, -22)">
              {/* Antenna */}
              <line x1="0" y1="-16" x2="0" y2="-28" stroke="#94a3b8" strokeWidth="3" />
              <circle cx="0" cy="-28" r="5" fill="#38bdf8" />

              <rect x="-18" y="-16" width="36" height="26" rx="5" fill="#475569" stroke="#334155" strokeWidth="2" />
              {/* Visor Screen */}
              <rect x="-13" y="-12" width="26" height="12" rx="3" fill="#0f172a" />
              {interp.emotion === 'surprised' ? (
                <circle cx="0" cy="-6" r="4" fill="#38bdf8" />
              ) : (
                <>
                  <circle cx="-6" cy="-6" r="3" fill="#38bdf8" />
                  <circle cx="6" cy="-6" r="3" fill="#38bdf8" />
                </>
              )}
              {/* Bolt ears */}
              <rect x="-22" y="-9" width="4" height="8" rx="1" fill="#94a3b8" />
              <rect x="18" y="-9" width="4" height="8" rx="1" fill="#94a3b8" />
            </g>

            {/* Robot Body */}
            <rect x="-20" y="-8" width="40" height="38" rx="6" fill="#64748b" stroke="#334155" strokeWidth="2" />
            {/* Meter / Dial */}
            <rect x="-12" y="-2" width="24" height="14" rx="2" fill="#1e293b" />
            <line x1="-12" y1="5" x2="12" y2="5" stroke="#22c55e" strokeWidth="1.5" strokeDasharray="3 2" />
            <circle cx="-5" cy="20" r="3" fill="#ef4444" />
            <circle cx="5" cy="20" r="3" fill="#eab308" />

            {/* Metallic Arms */}
            <g transform={`rotate(${poseOffset.limbAngle}, -20, -2)`}>
              <rect x="-30" y="-3" width="10" height="20" rx="3" fill="#94a3b8" />
              <circle cx="-25" cy="18" r="4" fill="#64748b" />
            </g>
            <g transform={`rotate(${-poseOffset.limbAngle}, 20, -2)`}>
              <rect x="20" y="-3" width="10" height="20" rx="3" fill="#94a3b8" />
              <circle cx="25" cy="18" r="4" fill="#64748b" />
            </g>

            {/* Legs */}
            <rect x="-14" y="30" width="10" height="16" rx="2" fill="#475569" />
            <rect x="4" y="30" width="10" height="16" rx="2" fill="#475569" />
            <rect x="-16" y="44" width="14" height="6" rx="2" fill="#334155" />
            <rect x="2" y="44" width="14" height="6" rx="2" fill="#334155" />
          </g>
        );

      case 'wizard':
        return (
          <g>
            {/* Robe */}
            <polygon points="-24,45 24,45 12,0 -12,0" fill="#581c87" />
            <polygon points="-8,45 8,45 4,0 -4,0" fill="#7e22ce" />

            {/* Wand / Staff in hand */}
            <g transform={`rotate(${poseOffset.limbAngle * 0.5}, 20, 10)`}>
              <line x1="16" y1="20" x2="28" y2="-25" stroke="#d97706" strokeWidth="3" />
              <polygon points="28,-32 30,-26 36,-26 31,-22 33,-16 28,-20 23,-16 25,-22 20,-26 26,-26" fill="#facc15" />
              <circle cx="28" cy="-24" r="3" fill="#ffffff" />
            </g>

            {/* Head & Beard */}
            <g transform="translate(0, -12)">
              <circle cx="0" cy="0" r="14" fill="#fed7aa" />
              {/* Beard */}
              <path
                d="M-12,2 C-14,24 -2,32 0,34 C2,32 14,24 12,2 Z"
                fill="#f1f5f9"
              />
              {/* Eyes */}
              <circle cx="-5" cy="-2" r="2.5" fill="#1e1b4b" />
              <circle cx="5" cy="-2" r="2.5" fill="#1e1b4b" />

              {/* Wizard Hat */}
              <ellipse cx="0" cy="-10" rx="24" ry="6" fill="#4c1d95" />
              <polygon points="-16,-10 16,-10 4,-44" fill="#581c87" />
              {/* Hat Star */}
              <polygon points="2,-30 4,-26 9,-26 5,-23 7,-18 2,-21 -3,-18 -1,-23 -5,-26 0,-26" fill="#facc15" />
            </g>
          </g>
        );

      case 'knight':
        return (
          <g>
            {/* Knight Cape */}
            <path
              d="M-16,0 C-26,20 -28,45 -14,48 C-8,45 -10,20 -10,0 Z"
              fill="#dc2626"
              transform={`rotate(${poseOffset.limbAngle * 0.4}, -14, 0)`}
            />

            {/* Armor Body */}
            <rect x="-18" y="-5" width="36" height="36" rx="4" fill="#94a3b8" stroke="#475569" strokeWidth="2" />
            {/* Crest on chest */}
            <polygon points="0,5 6,10 4,18 0,22 -4,18 -6,10" fill="#eab308" />

            {/* Helmet Head */}
            <g transform="translate(0, -22)">
              {/* Plume */}
              <path
                d="M-4,-20 C-6,-34 10,-32 14,-22 C12,-18 6,-16 0,-18 Z"
                fill="#dc2626"
              />
              <circle cx="0" cy="-6" r="16" fill="#64748b" stroke="#334155" strokeWidth="2" />
              {/* Visor Slit */}
              <rect x="-10" y="-7" width="20" height="4" rx="2" fill="#0f172a" />
              <circle cx="-3" cy="-5" r="1.5" fill="#38bdf8" />
              <circle cx="3" cy="-5" r="1.5" fill="#38bdf8" />
            </g>

            {/* Shield */}
            <g transform="translate(-18, 12)">
              <path
                d="M-8,-14 L8,-14 L8,4 C8,14 0,20 0,20 C0,20 -8,14 -8,4 Z"
                fill="#2563eb"
                stroke="#f8fafc"
                strokeWidth="1.5"
              />
              <line x1="-8" y1="-5" x2="8" y2="-5" stroke="#f8fafc" strokeWidth="1.5" />
              <line x1="0" y1="-14" x2="0" y2="20" stroke="#f8fafc" strokeWidth="1.5" />
            </g>

            {/* Legs */}
            <rect x="-12" y="31" width="8" height="15" rx="2" fill="#64748b" />
            <rect x="4" y="31" width="8" height="15" rx="2" fill="#64748b" />
          </g>
        );

      case 'pixie':
        return (
          <g>
            {/* Glowing Fairy Wings */}
            <path
              d="M-8,-6 C-35,-26 -30,10 -10,4 Z"
              fill="rgba(192, 132, 252, 0.75)"
              transform={`rotate(${Math.sin(currentTime * 12) * 20}, -8, 0)`}
            />
            <path
              d="M8,-6 C35,-26 30,10 10,4 Z"
              fill="rgba(192, 132, 252, 0.75)"
              transform={`rotate(${-Math.sin(currentTime * 12) * 20}, 8, 0)`}
            />

            {/* Dress */}
            <polygon points="-12,36 12,36 6,4 -6,4" fill="#a855f7" />

            {/* Head */}
            <g transform="translate(0, -10)">
              <circle cx="0" cy="0" r="11" fill="#fed7aa" />
              {/* Lavender Hair */}
              <circle cx="0" cy="-6" r="11" fill="#c084fc" />
              <ellipse cx="-8" cy="-2" rx="4" ry="7" fill="#c084fc" />
              <ellipse cx="8" cy="-2" rx="4" ry="7" fill="#c084fc" />

              {/* Eyes */}
              <circle cx="-4" cy="0" r="2" fill="#581c87" />
              <circle cx="4" cy="0" r="2" fill="#581c87" />
              <circle cx="-4.5" cy="-0.5" r="0.7" fill="#ffffff" />
              <circle cx="3.5" cy="-0.5" r="0.7" fill="#ffffff" />

              {/* Blush */}
              <circle cx="-7" cy="4" r="2.5" fill="rgba(244, 114, 182, 0.6)" />
              <circle cx="7" cy="4" r="2.5" fill="rgba(244, 114, 182, 0.6)" />
            </g>
          </g>
        );

      case 'cat':
        return (
          <g>
            {/* Tail */}
            <path
              d="M-16,20 C-35,25 -35,5 -22,-2"
              stroke="#ca8a04"
              strokeWidth="5"
              fill="none"
              strokeLinecap="round"
              transform={`rotate(${Math.sin(currentTime * 3) * 15}, -16, 20)`}
            />
            {/* Body */}
            <ellipse cx="0" cy="16" rx="18" ry="22" fill="#eab308" />
            <ellipse cx="0" cy="18" rx="10" ry="14" fill="#fef08a" />

            {/* Head */}
            <g transform="translate(0, -12)">
              {/* Ears */}
              <polygon points="-14,-10 -20,-28 -6,-16" fill="#ca8a04" />
              <polygon points="-12,-12 -16,-22 -7,-15" fill="#fbcfe8" />
              <polygon points="14,-10 20,-28 6,-16" fill="#ca8a04" />
              <polygon points="12,-12 16,-22 7,-15" fill="#fbcfe8" />

              <ellipse cx="0" cy="-4" rx="18" ry="14" fill="#eab308" />

              {/* Whiskers */}
              <line x1="-10" y1="0" x2="-26" y2="-4" stroke="#713f12" strokeWidth="1.5" />
              <line x1="-10" y1="3" x2="-26" y2="4" stroke="#713f12" strokeWidth="1.5" />
              <line x1="10" y1="0" x2="26" y2="-4" stroke="#713f12" strokeWidth="1.5" />
              <line x1="10" y1="3" x2="26" y2="4" stroke="#713f12" strokeWidth="1.5" />

              {/* Eyes */}
              <ellipse cx="-7" cy="-5" rx="3.5" ry="4.5" fill="#15803d" />
              <ellipse cx="-7" cy="-5" rx="1" ry="3.5" fill="#052e16" />
              <ellipse cx="7" cy="-5" rx="3.5" ry="4.5" fill="#15803d" />
              <ellipse cx="7" cy="-5" rx="1" ry="3.5" fill="#052e16" />

              {/* Nose & Mouth */}
              <polygon points="-2,1 2,1 0,3" fill="#f43f5e" />
              <path d="M-3,5 Q0,7 3,5" stroke="#713f12" strokeWidth="1.5" fill="none" />
            </g>

            {/* Paws */}
            <ellipse cx="-9" cy="34" rx="5" ry="8" fill="#ca8a04" />
            <ellipse cx="9" cy="34" rx="5" ry="8" fill="#ca8a04" />
          </g>
        );

      case 'frog':
      default:
        return (
          <g>
            {/* Frog Body */}
            <ellipse cx="0" cy="18" rx="22" ry="20" fill="#22c55e" />
            <ellipse cx="0" cy="20" rx="14" ry="14" fill="#bbf7d0" />

            {/* Back Folded Legs */}
            <ellipse cx="-20" cy="26" rx="8" ry="14" fill="#16a34a" />
            <ellipse cx="20" cy="26" rx="8" ry="14" fill="#16a34a" />

            {/* Head */}
            <g transform="translate(0, -6)">
              {/* Crown */}
              <polygon points="-8,-20 -4,-14 0,-24 4,-14 8,-20 8,-10 -8,-10" fill="#facc15" stroke="#ca8a04" strokeWidth="1" />

              {/* Eye mounds */}
              <circle cx="-11" cy="-10" r="8" fill="#22c55e" />
              <circle cx="11" cy="-10" r="8" fill="#22c55e" />

              <ellipse cx="0" cy="-2" rx="20" ry="12" fill="#22c55e" />

              {/* Eyes */}
              <circle cx="-11" cy="-10" r="5" fill="#fef08a" />
              <ellipse cx="-11" cy="-10" rx="1.5" ry="4" fill="#14532d" />
              <circle cx="11" cy="-10" r="5" fill="#fef08a" />
              <ellipse cx="11" cy="-10" rx="1.5" ry="4" fill="#14532d" />

              {/* Wide Smile */}
              <path d="M-10,3 Q0,10 10,3" stroke="#14532d" strokeWidth="2" fill="none" />
            </g>

            {/* Front feet */}
            <ellipse cx="-8" cy="36" rx="4" ry="4" fill="#16a34a" />
            <ellipse cx="8" cy="36" rx="4" ry="4" fill="#16a34a" />
          </g>
        );
    }
  };

  return (
    <div
      data-testid={`puppet-${character.id}`}
      onClick={(e) => {
        e.stopPropagation();
        if (onSelect) onSelect();
      }}
      className={`absolute cursor-grab active:cursor-grabbing select-none transition-transform duration-75 group ${
        isOnionSkin ? 'pointer-events-none' : ''
      }`}
      style={{
        left: `${posX}%`,
        top: `${posY}%`,
        transform: `translate(-50%, -50%) scale(${interp.flipX ? -totalScale : totalScale}, ${totalScale}) rotate(${totalRotation}deg)`,
        opacity: isOnionSkin ? 0.35 : opacity,
        zIndex: isSelected ? 30 : 20,
      }}
    >
      {/* Selection Ring */}
      {isSelected && !isOnionSkin && (
        <div
          className="absolute -inset-6 border-2 border-dashed border-amber-400 rounded-2xl pointer-events-none animate-pulse"
          style={{ transform: interp.flipX ? 'scaleX(-1)' : 'none' }}
        >
          <div className="absolute -top-3 -right-3 bg-amber-500 text-black text-[10px] font-bold px-1.5 py-0.5 rounded shadow">
            {character.name.split(' ')[0]}
          </div>
        </div>
      )}

      {/* Speech Bubble with boundary clamping */}
      {character.speechText && !isOnionSkin && (
        <div
          className={`absolute bottom-full mb-3 bg-white/95 text-neutral-900 text-xs font-semibold px-3 py-1.5 rounded-xl shadow-xl border border-neutral-200 pointer-events-none max-w-[220px] text-center leading-snug z-40 ${
            posX < 25
              ? 'left-0'
              : posX > 75
              ? 'right-0'
              : 'left-1/2 -translate-x-1/2'
          }`}
          style={{
            transform: interp.flipX
              ? posX < 25
                ? 'scaleX(-1)'
                : posX > 75
                ? 'scaleX(-1)'
                : 'translateX(50%) scaleX(-1)'
              : posX < 25
              ? 'none'
              : posX > 75
              ? 'none'
              : 'translateX(-50%)',
          }}
        >
          {character.speechText}
          <div
            className={`absolute top-full border-4 border-transparent border-t-white/95 ${
              posX < 25 ? 'left-6' : posX > 75 ? 'right-6' : 'left-1/2 -translate-x-1/2'
            }`}
          />
        </div>
      )}

      {/* SVG Canvas for Puppet */}
      <svg
        width="110"
        height="110"
        viewBox="-55 -55 110 110"
        className="overflow-visible filter drop-shadow-md"
      >
        {renderVectorBody()}
      </svg>
    </div>
  );
};
