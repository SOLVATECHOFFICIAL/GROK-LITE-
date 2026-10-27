/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  AspectRatio,
  CharacterType,
  MergeTransitionType,
  MotionType,
  VisualEffect,
} from '../types/video';

export interface CameraTransform {
  scale: number;
  translateX: number;
  translateY: number;
  rotation: number;
}

/**
 * Computes smooth cinematic camera movements over scene time t [0, 1].
 */
export function computeMotionTransform(
  motionType: MotionType,
  t: number
): CameraTransform {
  const clampedT = Math.max(0, Math.min(1, t));

  switch (motionType) {
    case 'dolly-push':
    case 'slow-zoom-in':
      return {
        scale: 1.0 + clampedT * 0.22,
        translateX: 0,
        translateY: 0,
        rotation: 0,
      };

    case 'slow-zoom-out':
      return {
        scale: 1.25 - clampedT * 0.22,
        translateX: 0,
        translateY: 0,
        rotation: 0,
      };

    case 'crane-pan':
      return {
        scale: 1.1,
        translateX: (1 - clampedT * 2) * 30,
        translateY: (clampedT - 0.5) * 18,
        rotation: 0,
      };

    case 'drone-aerial':
      return {
        scale: 1.0 + clampedT * 0.2,
        translateX: (clampedT - 0.5) * 40,
        translateY: (clampedT - 0.5) * 30,
        rotation: (clampedT - 0.5) * 1.5,
      };

    case 'steadicam-track':
      return {
        scale: 1.08,
        translateX: Math.sin(clampedT * Math.PI) * 22,
        translateY: Math.cos(clampedT * Math.PI * 2) * 5,
        rotation: Math.sin(clampedT * Math.PI * 2) * 0.8,
      };

    case 'dutch-tilt':
      return {
        scale: 1.14,
        translateX: (clampedT - 0.5) * 20,
        translateY: 0,
        rotation: -3.0 + clampedT * 6.0,
      };

    case 'cinematic-drift':
    default:
      return {
        scale: 1.05 + clampedT * 0.14,
        translateX: (clampedT - 0.5) * 25,
        translateY: (0.5 - clampedT) * 12,
        rotation: (clampedT - 0.5) * 1.0,
      };
  }
}

/**
 * Returns resolution dimensions for standard aspect ratios.
 */
export function getCanvasDimensions(ratio: AspectRatio): {
  width: number;
  height: number;
} {
  switch (ratio) {
    case '9:16':
      return { width: 720, height: 1280 };
    case '1:1':
      return { width: 800, height: 800 };
    case '16:9':
    default:
      return { width: 1280, height: 720 };
  }
}

/**
 * Renders cinematic subtitles with clean typography and soft shadow.
 */
export function drawCinematicSubtitle(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number
) {
  if (!text || text.trim() === '') return;

  ctx.save();
  ctx.font = '600 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Subtitle backing pill for readability
  const metrics = ctx.measureText(text);
  const textWidth = Math.min(maxWidth, metrics.width + 40);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.72)';
  ctx.beginPath();
  ctx.roundRect(x - textWidth / 2, y - 20, textWidth, 40, 8);
  ctx.fill();

  // Text
  ctx.fillStyle = '#f8fafc';
  ctx.fillText(text, x, y, maxWidth);

  ctx.restore();
}

/**
 * Renders animated atmospheric environment (skyline, sweeping searchlights, rain streaks, volumetric fog).
 */
export function renderCinematicEnvironment(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  characterType: CharacterType = 'narrator'
) {
  ctx.save();

  // Dynamic sky gradient based on character
  const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
  if (characterType === 'ghoul') {
    skyGrad.addColorStop(0, '#0c0714');
    skyGrad.addColorStop(0.5, '#050209');
    skyGrad.addColorStop(1, '#020104');
  } else if (characterType === 'monster') {
    skyGrad.addColorStop(0, '#160806');
    skyGrad.addColorStop(0.5, '#0a0302');
    skyGrad.addColorStop(1, '#040101');
  } else if (characterType === 'female') {
    skyGrad.addColorStop(0, '#071626');
    skyGrad.addColorStop(0.5, '#030b14');
    skyGrad.addColorStop(1, '#010408');
  } else {
    skyGrad.addColorStop(0, '#090d16');
    skyGrad.addColorStop(0.5, '#03060d');
    skyGrad.addColorStop(1, '#010206');
  }
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, w, h);

  // Distant City Skyline Silhouettes with parallax
  const buildingCount = 12;
  const baseY = h * 0.75;
  ctx.fillStyle = 'rgba(2, 6, 14, 0.9)';
  for (let b = 0; b < buildingCount; b++) {
    const bw = w / (buildingCount * 0.9);
    const bx = b * (bw * 0.95);
    const bh = ((Math.sin(b * 3.7) * 0.5 + 0.5) * 0.35 + 0.15) * h;
    ctx.fillRect(bx, baseY - bh, bw, bh + h * 0.3);

    // Glowing windows
    const windowCols = 4;
    const windowRows = 8;
    for (let r = 0; r < windowRows; r++) {
      for (let c = 0; c < windowCols; c++) {
        if ((b + r + c) % 3 === 0) {
          ctx.fillStyle =
            (b + r) % 2 === 0
              ? 'rgba(56, 189, 248, 0.45)'
              : 'rgba(251, 191, 36, 0.35)';
          ctx.fillRect(
            bx + 8 + c * (bw / 5),
            baseY - bh + 12 + r * 14,
            4,
            6
          );
        }
      }
    }
  }

  // Sweeping Searchlight
  const beamAngle = Math.sin(t * 1.5) * 0.4;
  const beamX = w * 0.75;
  ctx.save();
  ctx.translate(beamX, baseY);
  ctx.rotate(beamAngle - 0.4);
  const beamGrad = ctx.createLinearGradient(0, 0, 0, -h * 0.85);
  beamGrad.addColorStop(0, 'rgba(56, 189, 248, 0.25)');
  beamGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = beamGrad;
  ctx.beginPath();
  ctx.moveTo(-15, 0);
  ctx.lineTo(-80, -h * 0.85);
  ctx.lineTo(80, -h * 0.85);
  ctx.lineTo(15, 0);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Dynamic Rain Streaks with parallax
  const rainCount = 45;
  ctx.strokeStyle = 'rgba(186, 230, 253, 0.35)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (let i = 0; i < rainCount; i++) {
    const rx = ((i * 47 + t * 450) % w);
    const ry = (((i * 91 + t * 750) % h));
    ctx.moveTo(rx, ry);
    ctx.lineTo(rx - 8, ry + 24);
  }
  ctx.stroke();

  // Volumetric rolling ground fog
  const fogY = h * 0.72;
  const fogGrad = ctx.createLinearGradient(0, fogY, 0, h);
  fogGrad.addColorStop(0, 'transparent');
  fogGrad.addColorStop(0.5, 'rgba(15, 23, 42, 0.55)');
  fogGrad.addColorStop(1, 'rgba(2, 6, 23, 0.9)');
  ctx.fillStyle = fogGrad;
  ctx.fillRect(0, fogY, w, h - fogY);

  ctx.restore();
}

/**
 * Renders an expressive, animated cinematic character figure with breathing, eye blink,
 * and dynamic audio speech waveform / mouth pulsation!
 */
export function renderCinematicCharacter(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  characterType: CharacterType = 'narrator',
  isSpeaking: boolean = false,
  speakerName?: string
) {
  ctx.save();

  // Character positioning
  const charCenterX = w * 0.5;
  const charBaseY = h * 0.88;

  // Breathing offset (subtle sinusoidal vertical lift)
  const breathOffset = Math.sin(t * 3.0) * 4;

  // Eye blink calculation (blinks for 0.15s every 3.5s)
  const blinkCycle = (t * 1.8) % 3.5;
  const isBlinking = blinkCycle < 0.16;

  // Speech mouth / waveform pulse
  const speechFrequency = Math.sin(t * 22) * 0.5 + 0.5;
  const mouthOpen = isSpeaking ? 6 + speechFrequency * 8 : 2;

  // Color accents per character
  let glowColor = 'rgba(56, 189, 248, 0.8)';
  let accentColor = '#38bdf8';
  let bodyColor = '#0f172a';

  if (characterType === 'female') {
    glowColor = 'rgba(56, 189, 248, 0.85)';
    accentColor = '#38bdf8'; // Cyan cyberpunk warrior
  } else if (characterType === 'male') {
    glowColor = 'rgba(245, 158, 11, 0.85)';
    accentColor = '#f59e0b'; // Amber tactical commander
  } else if (characterType === 'ghoul') {
    glowColor = 'rgba(168, 85, 247, 0.85)';
    accentColor = '#c084fc'; // Violet wraith aura
  } else if (characterType === 'monster') {
    glowColor = 'rgba(239, 68, 68, 0.85)';
    accentColor = '#ef4444'; // Crimson beast fire
  } else if (characterType === 'robot') {
    glowColor = 'rgba(16, 185, 129, 0.85)';
    accentColor = '#34d399'; // Emerald cybernetic core
  }

  // 1. Backlight / Rim Glow behind character
  const rimGrad = ctx.createRadialGradient(
    charCenterX,
    charBaseY - 140 + breathOffset,
    20,
    charCenterX,
    charBaseY - 140 + breathOffset,
    180
  );
  rimGrad.addColorStop(0, glowColor);
  rimGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = rimGrad;
  ctx.beginPath();
  ctx.arc(charCenterX, charBaseY - 140 + breathOffset, 180, 0, Math.PI * 2);
  ctx.fill();

  // 2. Torso / Armor Silhouette
  ctx.fillStyle = bodyColor;
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 2.5;

  ctx.beginPath();
  // Shoulders and chest
  ctx.moveTo(charCenterX - 85, charBaseY);
  ctx.lineTo(charCenterX - 75, charBaseY - 95 + breathOffset);
  ctx.lineTo(charCenterX - 40, charBaseY - 125 + breathOffset);
  ctx.lineTo(charCenterX + 40, charBaseY - 125 + breathOffset);
  ctx.lineTo(charCenterX + 75, charBaseY - 95 + breathOffset);
  ctx.lineTo(charCenterX + 85, charBaseY);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 3. Cybernetic Collar / Armor Detail
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.moveTo(charCenterX - 35, charBaseY - 125 + breathOffset);
  ctx.lineTo(charCenterX - 18, charBaseY - 150 + breathOffset);
  ctx.lineTo(charCenterX + 18, charBaseY - 150 + breathOffset);
  ctx.lineTo(charCenterX + 35, charBaseY - 125 + breathOffset);
  ctx.closePath();
  ctx.fill();

  // 4. Head Silhouette
  const headY = charBaseY - 175 + breathOffset;
  ctx.fillStyle = '#090d16';
  ctx.beginPath();
  ctx.ellipse(charCenterX, headY, 32, 42, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Special head silhouettes: Monster horns or Ghoul cowl
  if (characterType === 'monster') {
    ctx.fillStyle = '#450a0a';
    // Horn left
    ctx.beginPath();
    ctx.moveTo(charCenterX - 28, headY - 20);
    ctx.quadraticCurveTo(charCenterX - 60, headY - 60, charCenterX - 45, headY - 80);
    ctx.quadraticCurveTo(charCenterX - 20, headY - 45, charCenterX - 15, headY - 25);
    ctx.fill();
    // Horn right
    ctx.beginPath();
    ctx.moveTo(charCenterX + 28, headY - 20);
    ctx.quadraticCurveTo(charCenterX + 60, headY - 60, charCenterX + 45, headY - 80);
    ctx.quadraticCurveTo(charCenterX + 20, headY - 45, charCenterX + 15, headY - 25);
    ctx.fill();
  }

  // 5. Glowing Eyes / Tactical Visor
  ctx.fillStyle = accentColor;
  ctx.shadowColor = accentColor;
  ctx.shadowBlur = 12;

  if (!isBlinking) {
    if (characterType === 'female' || characterType === 'robot') {
      // Sleek horizontal cyber visor streak
      ctx.fillRect(charCenterX - 22, headY - 8, 44, 5);
    } else {
      // Dual glowing eyes
      ctx.beginPath();
      ctx.ellipse(charCenterX - 12, headY - 6, 6, 4, 0, 0, Math.PI * 2);
      ctx.ellipse(charCenterX + 12, headY - 6, 6, 4, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    // Blinking eye slit
    ctx.fillRect(charCenterX - 18, headY - 6, 12, 1.5);
    ctx.fillRect(charCenterX + 6, headY - 6, 12, 1.5);
  }

  // 6. ANIMATED TALKING MOUTH & VOCAL WAVEFORM!
  // Visible proof that the character is truly speaking
  const mouthY = headY + 16;
  ctx.fillStyle = isSpeaking ? '#ffffff' : '#475569';
  ctx.beginPath();
  ctx.ellipse(
    charCenterX,
    mouthY,
    isSpeaking ? 7 : 4,
    mouthOpen,
    0,
    0,
    Math.PI * 2
  );
  ctx.fill();

  if (isSpeaking) {
    // Audio Waveform radiating from speaking character
    const waveCount = 5;
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 2;
    for (let wIdx = 1; wIdx <= waveCount; wIdx++) {
      const ringRadius = 38 + wIdx * 18 + (t * 30) % 20;
      const ringAlpha = Math.max(0, 1 - wIdx / waveCount);
      ctx.strokeStyle = `rgba(56, 189, 248, ${ringAlpha * 0.55})`;
      ctx.beginPath();
      ctx.arc(charCenterX, mouthY, ringRadius, -0.65, 0.65);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(charCenterX, mouthY, ringRadius, Math.PI - 0.65, Math.PI + 0.65);
      ctx.stroke();
    }

    // Audio Frequency Bars below character
    const barWidth = 4;
    const barSpacing = 3;
    const totalBars = 9;
    const startX = charCenterX - (totalBars * (barWidth + barSpacing)) / 2;
    ctx.fillStyle = accentColor;
    for (let b = 0; b < totalBars; b++) {
      const barH = 5 + Math.sin(t * 18 + b * 1.2) * 12;
      ctx.fillRect(startX + b * (barWidth + barSpacing), mouthY + 28, barWidth, barH);
    }
  }

  ctx.restore();
}

/**
 * Renders cinematic post-processing visual effects and film grading on canvas.
 */
export function renderCanvasEffects(
  ctx: CanvasRenderingContext2D,
  effects: VisualEffect[],
  w: number,
  h: number,
  t: number
) {
  for (const fx of effects) {
    if (fx === 'anamorphic-flare') {
      ctx.save();
      const flareY = h * 0.48;
      const flareGrad = ctx.createLinearGradient(0, flareY, w, flareY);
      flareGrad.addColorStop(0, 'transparent');
      flareGrad.addColorStop(0.35, 'rgba(56, 189, 248, 0.15)');
      flareGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.7)');
      flareGrad.addColorStop(0.65, 'rgba(56, 189, 248, 0.15)');
      flareGrad.addColorStop(1, 'transparent');

      ctx.fillStyle = flareGrad;
      ctx.fillRect(0, flareY - 3, w, 6);

      const coreGrad = ctx.createRadialGradient(w * 0.5, flareY, 0, w * 0.5, flareY, 80);
      coreGrad.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
      coreGrad.addColorStop(0.5, 'rgba(56, 189, 248, 0.2)');
      coreGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(w * 0.5, flareY, 80, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (fx === 'film-grain') {
      ctx.save();
      const grainCount = 350;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
      for (let i = 0; i < grainCount; i++) {
        const gx = ((Math.sin(i * 137.5 + t * 50) * 0.5 + 0.5) * w);
        const gy = ((Math.cos(i * 92.3 + t * 50) * 0.5 + 0.5) * h);
        ctx.fillRect(gx, gy, 1.5, 1.5);
      }
      ctx.restore();
    } else if (fx === 'cinematic-fog') {
      ctx.save();
      const fogGrad = ctx.createLinearGradient(0, h * 0.6, 0, h);
      fogGrad.addColorStop(0, 'transparent');
      fogGrad.addColorStop(1, 'rgba(15, 23, 42, 0.45)');
      ctx.fillStyle = fogGrad;
      ctx.fillRect(0, h * 0.6, w, h * 0.4);
      ctx.restore();
    } else if (fx === 'teal-orange') {
      ctx.save();
      ctx.globalCompositeOperation = 'overlay';
      const toGrad = ctx.createLinearGradient(0, 0, w, h);
      toGrad.addColorStop(0, 'rgba(249, 115, 22, 0.14)');
      toGrad.addColorStop(1, 'rgba(6, 182, 212, 0.16)');
      ctx.fillStyle = toGrad;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    } else if (fx === 'golden-hour') {
      ctx.save();
      ctx.globalCompositeOperation = 'soft-light';
      ctx.fillStyle = 'rgba(251, 191, 36, 0.25)';
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    } else if (fx === 'cinematic-bars') {
      ctx.save();
      ctx.fillStyle = '#000000';
      const barHeight = h * 0.11;
      ctx.fillRect(0, 0, w, barHeight);
      ctx.fillRect(0, h - barHeight, w, barHeight);
      ctx.restore();
    }
  }
}

/**
 * Computes AI smart transitions between two adjacent video clips for seamless Mergen assembly.
 */
export function computeAiSplitTransition(
  fromMotion: MotionType,
  toMotion: MotionType,
  fromChar?: CharacterType,
  toChar?: CharacterType
): { transitionType: MergeTransitionType; duration: number; reasoning: string } {
  // Motion match cut
  if (fromMotion === 'dolly-push' && toMotion === 'crane-pan') {
    return {
      transitionType: 'ai-matched',
      duration: 0.6,
      reasoning: 'AI Smart Match: Luma-keyed dissolve harmonizes push-in motion vector with crane descent.',
    };
  }

  // Action whip-pan continuation
  if (fromMotion === 'steadicam-track' || toMotion === 'steadicam-track') {
    return {
      transitionType: 'motion-whip',
      duration: 0.35,
      reasoning: 'AI Velocity Match: High-speed lateral whip cut carries camera kinetic momentum.',
    };
  }

  // Dramatic narrative scene change
  if (fromChar !== toChar && fromChar && toChar) {
    return {
      transitionType: 'dip-to-black',
      duration: 0.5,
      reasoning: `AI Pacing Dip: Dramatic 0.5s fade to black bridges perspective shift from ${fromChar} to ${toChar}.`,
    };
  }

  // Standard smooth cross-dissolve
  return {
    transitionType: 'cross-dissolve',
    duration: 0.55,
    reasoning: 'AI Harmonized Blend: Optical cross-dissolve aligns lighting levels and color curves seamlessly.',
  };
}
