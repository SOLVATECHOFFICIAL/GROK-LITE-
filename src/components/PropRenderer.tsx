/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { PropItem } from '../types/animation';

interface PropRendererProps {
  prop: PropItem;
  currentTime: number;
  isSelected?: boolean;
  onSelect?: () => void;
}

export const PropRenderer: React.FC<PropRendererProps> = ({
  prop,
  currentTime,
  isSelected = false,
  onSelect,
}) => {
  const floatOffset = prop.floating
    ? Math.sin(currentTime * 3 + prop.x) * 6
    : 0;

  const renderPropVector = () => {
    switch (prop.type) {
      case 'star':
        return (
          <g transform={`rotate(${currentTime * 20}, 0, 0)`}>
            <polygon
              points="0,-24 7,-8 24,-8 11,3 16,20 0,10 -16,20 -11,3 -24,-8 -7,-8"
              fill="#fbbf24"
              stroke="#f59e0b"
              strokeWidth="2"
            />
            <polygon
              points="0,-16 4,-5 16,-5 7,2 10,14 0,7 -10,14 -7,2 -16,-5 -4,-5"
              fill="#fef08a"
            />
            <circle cx="0" cy="0" r="4" fill="#ffffff" />
          </g>
        );

      case 'crystal':
        return (
          <g>
            <polygon
              points="0,-28 14,-10 10,22 0,28 -10,22 -14,-10"
              fill="#38bdf8"
              stroke="#0284c7"
              strokeWidth="1.5"
            />
            <polygon points="0,-28 0,28 -10,22 -14,-10" fill="#0ea5e9" />
            <polygon points="0,-28 6,-10 0,28" fill="#bae6fd" />
            {/* Base mount */}
            <ellipse cx="0" cy="24" rx="14" ry="5" fill="#475569" />
          </g>
        );

      case 'tree':
        return (
          <g>
            {/* Trunk */}
            <rect x="-6" y="10" width="12" height="30" rx="3" fill="#78350f" />
            {/* Pine needles foliage layers */}
            <polygon points="0,-36 28,-10 -28,-10" fill="#14532d" />
            <polygon points="0,-24 24,4 -24,4" fill="#15803d" />
            <polygon points="0,-10 20,18 -20,18" fill="#16a34a" />
          </g>
        );

      case 'chest':
        return (
          <g>
            {/* Chest base */}
            <rect x="-22" y="-2" width="44" height="26" rx="4" fill="#854d0e" stroke="#451a03" strokeWidth="2" />
            <line x1="-22" y1="10" x2="22" y2="10" stroke="#facc15" strokeWidth="3" />
            <rect x="-22" y="-2" width="6" height="26" fill="#ca8a04" />
            <rect x="16" y="-2" width="6" height="26" fill="#ca8a04" />

            {/* Chest lid */}
            <path
              d="M-22,-2 Q0,-16 22,-2 Z"
              fill="#a16207"
              stroke="#451a03"
              strokeWidth="2"
            />
            {/* Lock */}
            <circle cx="0" cy="10" r="4" fill="#facc15" stroke="#713f12" strokeWidth="1" />
            <rect x="-1" y="9" width="2" height="3" fill="#451a03" />
          </g>
        );

      case 'campfire':
        return (
          <g>
            {/* Logs */}
            <line x1="-18" y1="16" x2="18" y2="10" stroke="#78350f" strokeWidth="6" strokeLinecap="round" />
            <line x1="-18" y1="10" x2="18" y2="16" stroke="#451a03" strokeWidth="6" strokeLinecap="round" />
            {/* Flame layers */}
            <path
              d={`M-14,12 Q-10,-12 0,${-22 + Math.sin(currentTime * 8) * 4} Q10,-12 14,12 Z`}
              fill="#ea580c"
            />
            <path
              d={`M-9,12 Q-6,-4 0,${-14 + Math.sin(currentTime * 10) * 3} Q6,-4 9,12 Z`}
              fill="#f59e0b"
            />
            <path
              d="M-4,12 Q-2,2 0,-6 Q2,2 4,12 Z"
              fill="#fef08a"
            />
          </g>
        );

      case 'potion':
        return (
          <g>
            {/* Bottle neck & cork */}
            <rect x="-4" y="-24" width="8" height="6" rx="1" fill="#b45309" />
            <rect x="-6" y="-18" width="12" height="8" rx="2" fill="#94a3b8" />
            {/* Flask body */}
            <circle cx="0" cy="6" r="18" fill="rgba(244, 63, 94, 0.85)" stroke="#fda4af" strokeWidth="2" />
            <circle cx="0" cy="8" r="14" fill="#e11d48" />
            {/* Bubbles */}
            <circle cx="-5" cy="4" r="2" fill="#ffffff" />
            <circle cx="4" cy="9" r="1.5" fill="#ffffff" />
          </g>
        );

      case 'moon':
        return (
          <g>
            <path
              d="M-4,-24 A24,24 0 1,0 20,16 A20,20 0 1,1 -4,-24 Z"
              fill="#fef08a"
              stroke="#fde047"
              strokeWidth="1.5"
            />
          </g>
        );

      case 'cloud':
        return (
          <g fill="#f8fafc" opacity="0.9">
            <circle cx="-16" cy="2" r="12" />
            <circle cx="0" cy="-6" r="16" />
            <circle cx="16" cy="2" r="12" />
            <rect x="-16" y="2" width="32" height="12" rx="4" />
          </g>
        );

      case 'flower':
        return (
          <g>
            <line x1="0" y1="6" x2="0" y2="28" stroke="#15803d" strokeWidth="4" />
            <ellipse cx="-8" cy="18" rx="6" ry="3" fill="#22c55e" transform="rotate(-20, -8, 18)" />
            <circle cx="-8" cy="-6" r="7" fill="#ec4899" />
            <circle cx="8" cy="-6" r="7" fill="#ec4899" />
            <circle cx="-8" cy="6" r="7" fill="#ec4899" />
            <circle cx="8" cy="6" r="7" fill="#ec4899" />
            <circle cx="0" cy="0" r="7" fill="#facc15" />
          </g>
        );

      case 'wand':
      default:
        return (
          <g transform="rotate(-35)">
            <line x1="0" y1="-26" x2="0" y2="26" stroke="#475569" strokeWidth="4" strokeLinecap="round" />
            <polygon points="0,-32 4,-26 10,-26 6,-22 8,-16 0,-20 -8,-16 -6,-22 -10,-26 -4,-26" fill="#facc15" />
            <circle cx="0" cy="-24" r="3" fill="#ffffff" />
          </g>
        );
    }
  };

  return (
    <div
      data-testid={`prop-${prop.id}`}
      onClick={(e) => {
        e.stopPropagation();
        if (onSelect) onSelect();
      }}
      className="absolute cursor-pointer select-none transition-transform duration-75 group"
      style={{
        left: `${prop.x}%`,
        top: `${prop.y + floatOffset}%`,
        transform: `translate(-50%, -50%) scale(${prop.scale}) rotate(${prop.rotation}deg)`,
        zIndex: isSelected ? 25 : 15,
      }}
    >
      {isSelected && (
        <div className="absolute -inset-4 border-2 border-dashed border-sky-400 rounded-xl pointer-events-none animate-pulse">
          <div className="absolute -top-3 -right-2 bg-sky-500 text-black text-[9px] font-bold px-1 py-0.2 rounded shadow">
            {prop.name}
          </div>
        </div>
      )}

      <svg
        width="80"
        height="80"
        viewBox="-40 -40 80 80"
        className="overflow-visible filter drop-shadow"
      >
        {renderPropVector()}
      </svg>
    </div>
  );
};
