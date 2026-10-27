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
  stage = 'Creating video',
  targetPercent,
}) => {
  const [percent, setPercent] = useState<number>(12);

  // Smoothly increment progress percent to match user screenshot
  useEffect(() => {
    const timer = setInterval(() => {
      setPercent((prev) => {
        if (targetPercent !== undefined) {
          if (prev < targetPercent) return prev + 1;
          return prev;
        }
        if (prev >= 96) return 96;
        const jump = Math.floor(Math.random() * 4) + 1;
        return Math.min(96, prev + jump);
      });
    }, 180);

    return () => clearInterval(timer);
  }, [targetPercent]);

  // Dot matrix grid: 8 rows by 14 cols
  const rows = 7;
  const cols = 12;

  return (
    <div className="w-full max-w-sm sm:max-w-md rounded-3xl bg-neutral-900/90 border border-neutral-800 p-5 shadow-2xl flex flex-col justify-between select-none relative overflow-hidden backdrop-blur-md transition-all">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-neutral-300 tracking-tight">
          {stage}...
        </span>
      </div>

      {/* Animated Dot Matrix Grid inspired by screenshot */}
      <div className="py-6 flex flex-col items-center justify-center gap-2.5">
        {Array.from({ length: rows }).map((_, rIdx) => (
          <div key={`row-${rIdx}`} className="flex items-center gap-3 sm:gap-3.5">
            {Array.from({ length: cols }).map((_, cIdx) => {
              // Diagonal wave pattern
              const wave = (rIdx + cIdx) % 6;
              const isAccent = (rIdx * cols + cIdx + Math.floor(percent / 8)) % 7 === 0;
              return (
                <span
                  key={`dot-${rIdx}-${cIdx}`}
                  className={`w-1 h-1 rounded-full transition-all duration-500 ${
                    isAccent
                      ? 'bg-neutral-300 scale-125 opacity-90'
                      : 'bg-neutral-600/50 opacity-40'
                  }`}
                  style={{
                    animation: `pulse 2.4s ease-in-out infinite`,
                    animationDelay: `${wave * 120}ms`,
                  }}
                />
              );
            })}
          </div>
        ))}
      </div>

      {/* Bottom Percentage Badge matching screenshot */}
      <div className="flex items-center justify-between pt-2">
        <span className="text-[11px] text-neutral-500 font-mono">
          Zero-watermark render
        </span>
        <div className="px-3 py-1 rounded-full bg-neutral-100 text-neutral-950 font-bold text-xs shadow-sm">
          {percent}%
        </div>
      </div>
    </div>
  );
};
