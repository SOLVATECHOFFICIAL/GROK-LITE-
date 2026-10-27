/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import { WeatherEffect } from '../types/animation';

interface WeatherOverlayProps {
  effect: WeatherEffect;
  currentTime: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  phase: number;
}

export const WeatherOverlay: React.FC<WeatherOverlayProps> = ({
  effect,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);

  useEffect(() => {
    if (effect === 'none') {
      particlesRef.current = [];
      return;
    }

    const count = effect === 'rain' ? 80 : 35;
    const colors = {
      fireflies: ['#fef08a', '#86efac', '#fde047'],
      stardust: ['#ffffff', '#c084fc', '#93c5fd', '#fbcfe8'],
      leaves: ['#f97316', '#ea580c', '#eab308', '#c2410c'],
      rain: ['#93c5fd', '#60a5fa'],
      bubbles: ['#a5f3fc', '#67e8f9', '#bae6fd'],
    };

    const currentColors = colors[effect as keyof typeof colors] || ['#ffffff'];

    particlesRef.current = Array.from({ length: count }, () => ({
      x: Math.random() * 800,
      y: Math.random() * 450,
      vx: effect === 'rain' ? -1 : (Math.random() - 0.5) * 0.8,
      vy:
        effect === 'rain'
          ? 6 + Math.random() * 4
          : effect === 'bubbles'
          ? -(0.6 + Math.random() * 0.8)
          : effect === 'leaves'
          ? 0.8 + Math.random() * 0.6
          : (Math.random() - 0.5) * 0.5,
      size:
        effect === 'rain'
          ? 2
          : effect === 'bubbles'
          ? 3 + Math.random() * 4
          : 2 + Math.random() * 3,
      color: currentColors[Math.floor(Math.random() * currentColors.length)],
      alpha: 0.3 + Math.random() * 0.7,
      phase: Math.random() * Math.PI * 2,
    }));
  }, [effect]);

  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas || effect === 'none') return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const particles = particlesRef.current;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.phase += 0.05;

        // Wrap around boundaries
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.save();
        if (effect === 'fireflies') {
          const glow = Math.sin(p.phase) * 0.4 + 0.6;
          ctx.globalAlpha = p.alpha * glow;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();

          ctx.globalAlpha = p.alpha * glow * 0.3;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
          ctx.fill();
        } else if (effect === 'rain') {
          ctx.globalAlpha = p.alpha;
          ctx.strokeStyle = p.color;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - 2, p.y + 10);
          ctx.stroke();
        } else if (effect === 'leaves') {
          ctx.globalAlpha = p.alpha;
          ctx.fillStyle = p.color;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.phase);
          ctx.beginPath();
          ctx.ellipse(0, 0, p.size * 1.5, p.size * 0.8, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        } else if (effect === 'bubbles') {
          ctx.globalAlpha = p.alpha;
          ctx.strokeStyle = p.color;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.stroke();
          // Small highlight
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(p.x - p.size * 0.3, p.y - p.size * 0.3, 1, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Stardust
          const twinkle = Math.sin(p.phase) * 0.5 + 0.5;
          ctx.globalAlpha = p.alpha * twinkle;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [effect]);

  if (effect === 'none') return null;

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={450}
      className="absolute inset-0 w-full h-full pointer-events-none z-25"
    />
  );
};
