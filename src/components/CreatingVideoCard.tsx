/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';

interface CreatingVideoCardProps {
  stage?: string;
  targetPercent?: number;
}

export const CreatingVideoCard: React.FC<CreatingVideoCardProps> = ({
  stage = 'Rendering movie',
  targetPercent,
}) => {
  const [percent, setPercent] = useState<number>(18);
  const [subStatus, setSubStatus] = useState<string>('Scripting scene...');

  useEffect(() => {
    const timer = setInterval(() => {
      setPercent((prev) => {
        if (targetPercent !== undefined) {
          if (prev < targetPercent) return prev + 1;
          return targetPercent;
        }
        if (prev < 40) {
          setSubStatus('Scripting camera shots...');
          return prev + 3;
        } else if (prev < 75) {
          setSubStatus('Synthesizing character voice & audio...');
          return prev + 2;
        } else if (prev < 95) {
          setSubStatus('Rendering visual frames...');
          return prev + 1;
        } else {
          setSubStatus('Finalizing film clip...');
          return Math.min(99, prev + 1);
        }
      });
    }, 180);

    return () => clearInterval(timer);
  }, [targetPercent]);

  // Dot matrix grid: 7 rows by 12 cols
  const rows = 6;
  const cols = 12;

  return (
    <div className="w-full max-w-sm sm:max-w-md rounded-2xl bg-neutral-900 border border-neutral-800 p-4 shadow-xl flex flex-col justify-between select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-white tracking-tight flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          {stage}
        </span>
        <span className="text-[10px] font-mono text-amber-400 font-bold">
          {percent}%
        </span>
      </div>

      {/* Animated Dot Matrix Grid */}
      <div className="py-4 flex flex-col items-center justify-center gap-2">
        {Array.from({ length: rows }).map((_, rIdx) => (
          <div key={`row-${rIdx}`} className="flex items-center gap-3">
            {Array.from({ length: cols }).map((_, cIdx) => {
              const isAccent = (rIdx * cols + cIdx + Math.floor(percent / 7)) % 6 === 0;
              return (
                <span
                  key={`dot-${rIdx}-${cIdx}`}
                  className={`w-1 h-1 rounded-full transition-all duration-300 ${
                    isAccent
                      ? 'bg-amber-400 scale-125 opacity-90'
                      : 'bg-neutral-700/50 opacity-40'
                  }`}
                />
              );
            })}
          </div>
        ))}
      </div>

      {/* Bottom Status */}
      <div className="flex items-center justify-between pt-2 border-t border-neutral-800/80 text-[10px] text-neutral-400 font-mono">
        <span>{subStatus}</span>
        <span className="text-emerald-400">Zero Watermark</span>
      </div>
    </div>
  );
};
