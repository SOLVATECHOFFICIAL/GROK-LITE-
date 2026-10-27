/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BackgroundTheme } from '../types/animation';

interface BackgroundRendererProps {
  theme: BackgroundTheme;
  currentTime?: number;
}

export const BackgroundRenderer: React.FC<BackgroundRendererProps> = ({
  theme,
  currentTime = 0,
}) => {
  switch (theme) {
    case 'celestial-observatory':
      return (
        <div className="absolute inset-0 overflow-hidden bg-gradient-to-b from-indigo-950 via-slate-900 to-purple-950 select-none">
          {/* Constellation lines */}
          <svg className="absolute inset-0 w-full h-full opacity-35">
            <line x1="20%" y1="20%" x2="45%" y2="28%" stroke="#e0e7ff" strokeWidth="1" strokeDasharray="3 3" />
            <line x1="45%" y1="28%" x2="60%" y2="18%" stroke="#e0e7ff" strokeWidth="1" strokeDasharray="3 3" />
            <line x1="60%" y1="18%" x2="80%" y2="35%" stroke="#e0e7ff" strokeWidth="1" strokeDasharray="3 3" />
            <circle cx="20%" cy="20%" r="3" fill="#ffffff" />
            <circle cx="45%" cy="28%" r="4" fill="#a5b4fc" />
            <circle cx="60%" cy="18%" r="3" fill="#ffffff" />
            <circle cx="80%" cy="35%" r="5" fill="#fbcfe8" />
          </svg>

          {/* Glowing Nebula */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-1/3 left-1/3 w-64 h-64 bg-cyan-500/15 rounded-full blur-2xl pointer-events-none" />

          {/* Arch pillars on sides */}
          <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-slate-950/80 to-transparent border-r border-slate-700/30" />
          <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-slate-950/80 to-transparent border-l border-slate-700/30" />

          {/* Stone Balcony Floor */}
          <div className="absolute bottom-0 inset-x-0 h-28 bg-gradient-to-t from-slate-950 via-slate-900 to-slate-800/90 border-t-2 border-indigo-500/40">
            <div className="w-full h-full opacity-20 bg-[radial-gradient(#818cf8_1px,transparent_1px)] [background-size:16px_16px]" />
          </div>
        </div>
      );

    case 'cyberpunk-neon':
      return (
        <div className="absolute inset-0 overflow-hidden bg-gradient-to-b from-neutral-950 via-purple-950/60 to-black select-none">
          {/* Cyber grid skyline */}
          <div className="absolute top-12 inset-x-0 h-48 flex justify-around items-end opacity-25 px-8">
            <div className="w-16 h-36 bg-cyan-900/40 border border-cyan-500/40" />
            <div className="w-24 h-48 bg-fuchsia-900/40 border border-fuchsia-500/40" />
            <div className="w-20 h-40 bg-purple-900/40 border border-purple-500/40" />
            <div className="w-28 h-44 bg-cyan-900/40 border border-cyan-500/40" />
          </div>

          {/* Neon sign banner */}
          <div className="absolute top-6 left-1/2 -translate-x-1/2 px-4 py-1 rounded bg-black/60 border border-pink-500/70 shadow-[0_0_15px_rgba(236,72,153,0.5)]">
            <span className="text-[11px] font-mono tracking-widest text-pink-400 font-bold uppercase">
              TALE TROVE STUDIO // 24 FPS
            </span>
          </div>

          {/* Wet Ground Reflections */}
          <div className="absolute bottom-0 inset-x-0 h-28 bg-gradient-to-t from-black via-neutral-950 to-neutral-900 border-t border-cyan-500/50">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-pink-500 via-cyan-400 to-purple-500 blur-sm" />
            <div className="w-full h-full opacity-30 bg-timeline-grid" />
          </div>
        </div>
      );

    case 'cozy-cottage':
      return (
        <div className="absolute inset-0 overflow-hidden bg-gradient-to-b from-amber-950/80 via-amber-900/40 to-amber-950 select-none">
          {/* Ceiling Wood Beams */}
          <div className="absolute top-0 inset-x-0 h-8 flex justify-between px-4">
            <div className="w-6 h-12 bg-amber-950/90 shadow-lg" />
            <div className="w-6 h-12 bg-amber-950/90 shadow-lg" />
            <div className="w-6 h-12 bg-amber-950/90 shadow-lg" />
          </div>

          {/* Window showing night stars */}
          <div className="absolute top-10 right-14 w-28 h-36 rounded-t-full bg-indigo-950 border-4 border-amber-900 shadow-inner overflow-hidden">
            <div className="absolute top-4 left-4 w-6 h-6 rounded-full bg-amber-200/90 blur-xs" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-full h-0.5 bg-amber-900" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-full w-0.5 bg-amber-900" />
            </div>
          </div>

          {/* Warm Hearth Glow */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-80 h-40 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

          {/* Wooden Floor Planks */}
          <div className="absolute bottom-0 inset-x-0 h-28 bg-gradient-to-t from-amber-950 via-amber-900/90 to-amber-800/80 border-t-2 border-amber-700/60">
            <div className="w-full h-full flex flex-col justify-around opacity-30">
              <div className="w-full h-px bg-amber-950" />
              <div className="w-full h-px bg-amber-950" />
              <div className="w-full h-px bg-amber-950" />
            </div>
          </div>
        </div>
      );

    case 'dragon-peak':
      return (
        <div className="absolute inset-0 overflow-hidden bg-gradient-to-b from-orange-950 via-rose-950/70 to-neutral-950 select-none">
          {/* Jagged Mountain Silhouettes */}
          <svg className="absolute bottom-24 inset-x-0 w-full h-48 opacity-60" preserveAspectRatio="none" viewBox="0 0 100 100">
            <polygon points="0,100 15,35 30,70 50,20 70,60 85,30 100,100" fill="#4c0519" />
          </svg>
          <svg className="absolute bottom-20 inset-x-0 w-full h-40 opacity-80" preserveAspectRatio="none" viewBox="0 0 100 100">
            <polygon points="0,100 25,45 45,80 65,35 85,75 100,100" fill="#1c1917" />
          </svg>

          {/* Summit Rocky Ground */}
          <div className="absolute bottom-0 inset-x-0 h-28 bg-gradient-to-t from-stone-950 via-stone-900 to-stone-800 border-t-2 border-rose-900/60" />
        </div>
      );

    case 'deep-ocean':
      return (
        <div className="absolute inset-0 overflow-hidden bg-gradient-to-b from-sky-950 via-teal-950/70 to-slate-950 select-none">
          {/* Aquatic Sun Rays */}
          <div className="absolute -top-10 inset-x-0 h-64 flex justify-around opacity-20 pointer-events-none">
            <div className="w-12 h-96 bg-gradient-to-b from-cyan-300 to-transparent rotate-12 blur-md" />
            <div className="w-16 h-96 bg-gradient-to-b from-cyan-300 to-transparent -rotate-6 blur-lg" />
            <div className="w-10 h-96 bg-gradient-to-b from-cyan-300 to-transparent rotate-6 blur-md" />
          </div>

          {/* Distant Coral Silhouettes */}
          <div className="absolute bottom-24 inset-x-0 h-20 flex justify-between px-6 opacity-40">
            <div className="w-14 h-16 rounded-t-full bg-teal-900/80" />
            <div className="w-20 h-24 rounded-t-full bg-teal-800/60" />
            <div className="w-16 h-20 rounded-t-full bg-teal-900/80" />
          </div>

          {/* Ocean Sand Floor */}
          <div className="absolute bottom-0 inset-x-0 h-28 bg-gradient-to-t from-cyan-950 via-teal-950 to-teal-900/80 border-t-2 border-teal-500/40">
            <div className="w-full h-full opacity-20 bg-[radial-gradient(#2dd4bf_1px,transparent_1px)] [background-size:12px_12px]" />
          </div>
        </div>
      );

    case 'twilight-forest':
    default:
      return (
        <div className="absolute inset-0 overflow-hidden bg-gradient-to-b from-slate-950 via-indigo-950/90 to-emerald-950 select-none">
          {/* Luminous Moon & Glow */}
          <div className="absolute top-8 right-16 w-16 h-16 rounded-full bg-amber-100 shadow-[0_0_40px_rgba(254,240,138,0.45)]">
            <div className="absolute top-2 right-2 w-14 h-14 rounded-full bg-indigo-950/40" />
          </div>

          {/* Distant Mountain Ridges */}
          <svg className="absolute bottom-24 inset-x-0 w-full h-44 opacity-30" preserveAspectRatio="none" viewBox="0 0 100 100">
            <polygon points="0,100 20,40 40,70 60,30 80,65 100,100" fill="#1e1b4b" />
          </svg>

          {/* Pine Tree Silhouette Layers */}
          <div className="absolute bottom-20 inset-x-0 h-28 flex justify-around opacity-40">
            <div className="w-8 h-24 bg-emerald-950 [clip-path:polygon(50%_0%,0%_100%,100%_100%)]" />
            <div className="w-12 h-32 bg-emerald-950 [clip-path:polygon(50%_0%,0%_100%,100%_100%)]" />
            <div className="w-10 h-28 bg-emerald-950 [clip-path:polygon(50%_0%,0%_100%,100%_100%)]" />
            <div className="w-14 h-36 bg-emerald-950 [clip-path:polygon(50%_0%,0%_100%,100%_100%)]" />
            <div className="w-8 h-20 bg-emerald-950 [clip-path:polygon(50%_0%,0%_100%,100%_100%)]" />
          </div>

          {/* Grassy Woodland Floor */}
          <div className="absolute bottom-0 inset-x-0 h-28 bg-gradient-to-t from-emerald-950 via-teal-950 to-emerald-900/90 border-t-2 border-emerald-500/40">
            <div className="w-full h-full opacity-25 bg-[radial-gradient(#34d399_1px,transparent_1px)] [background-size:14px_14px]" />
          </div>
        </div>
      );
  }
};
