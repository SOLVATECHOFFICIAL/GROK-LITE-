/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  AspectRatio,
  BiomeType,
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


export function detectBiome(text: string): BiomeType {
  const lower = (text || '').toLowerCase();
  if (/\b(space|star|galaxy|nebula|orbit|planet|spaceship|cosmos|alien|astronaut|void)\b/.test(lower)) {
    return 'space';
  }
  if (/\b(desert|dune|sand|sahara|pyramid|arid|oasis|canyon|wasteland|mars)\b/.test(lower)) {
    return 'desert';
  }
  if (/\b(jungle|forest|dinosaur|nature|trees|canopy|rainforest|prehistoric|foliage|woods)\b/.test(lower)) {
    return 'jungle';
  }
  if (/\b(dungeon|castle|medieval|knight|gothic|throne|dragon|torch|crypt|stone|fortress)\b/.test(lower)) {
    return 'dungeon';
  }
  if (/\b(ocean|water|sea|underwater|submarine|coral|marine|deep|atlantis|wave)\b/.test(lower)) {
    return 'ocean';
  }
  if (/\b(noir|detective|monochrome|vintage|shadow|smoke|trenchcoat|1940|alleyway)\b/.test(lower)) {
    return 'noir';
  }
  if (/\b(car|chase|highway|race|speed|vehicle|drift|asphalt|pursuit|motorcycle)\b/.test(lower)) {
    return 'action';
  }
  if (/\b(apocalypse|ruin|fallout|destroyed|smoldering|wasteland|rubble|decay)\b/.test(lower)) {
    return 'apocalypse';
  }
  return 'cyberpunk';
}

/**
 * Renders animated atmospheric environment.
 * When isImageOverlay is true, NEVER covers the user's uploaded image with opaque shapes!
 * When isImageOverlay is false, renders the distinct procedural biome.
 */
export function renderCinematicEnvironment(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  characterType: CharacterType = 'narrator',
  biome: BiomeType = 'cyberpunk',
  isImageOverlay: boolean = false
) {
  ctx.save();

  // If rendering over an uploaded image, ONLY apply delicate cinematic air particles
  if (isImageOverlay) {
    const particleCount = 20;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    for (let i = 0; i < particleCount; i++) {
      const px = (i * 73 + t * 40) % w;
      const py = (i * 97 + Math.sin(t + i) * 20) % h;
      const pSize = (i % 3) + 1;
      ctx.beginPath();
      ctx.arc(px, py, pSize, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    return;
  }

  // --- Multi-Biome Procedural Environments ---

  if (biome === 'space') {
    // 1. Cosmic Void Sky
    const skyGrad = ctx.createRadialGradient(w * 0.5, h * 0.4, 40, w * 0.5, h * 0.5, w * 0.85);
    skyGrad.addColorStop(0, '#1e1b4b');
    skyGrad.addColorStop(0.4, '#0f0a2a');
    skyGrad.addColorStop(1, '#020108');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h);

    // 2. Cosmic Nebula Clouds (glowing purple/cyan)
    const nebGrad = ctx.createRadialGradient(w * 0.7, h * 0.35, 10, w * 0.7, h * 0.35, 320);
    nebGrad.addColorStop(0, 'rgba(168, 85, 247, 0.35)');
    nebGrad.addColorStop(0.5, 'rgba(56, 189, 248, 0.18)');
    nebGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = nebGrad;
    ctx.beginPath();
    ctx.ellipse(w * 0.7, h * 0.35, 380, 220, Math.sin(t * 0.2) * 0.3, 0, Math.PI * 2);
    ctx.fill();

    // 3. Twinkling Starfield
    const starCount = 80;
    for (let s = 0; s < starCount; s++) {
      const sx = (s * 83) % w;
      const sy = (s * 137) % h;
      const blink = Math.sin(t * 3 + s * 1.7) * 0.4 + 0.6;
      ctx.fillStyle = s % 4 === 0 ? `rgba(186, 230, 253, ${blink})` : `rgba(255, 255, 255, ${blink * 0.75})`;
      ctx.fillRect(sx, sy, s % 5 === 0 ? 2.5 : 1.5, s % 5 === 0 ? 2.5 : 1.5);
    }

    // 4. Distant Planet with Rings
    const planetX = w * 0.25;
    const planetY = h * 0.3;
    const planetGrad = ctx.createLinearGradient(planetX - 40, planetY - 40, planetX + 40, planetY + 40);
    planetGrad.addColorStop(0, '#f59e0b');
    planetGrad.addColorStop(1, '#78350f');
    ctx.fillStyle = planetGrad;
    ctx.beginPath();
    ctx.arc(planetX, planetY, 36, 0, Math.PI * 2);
    ctx.fill();

    // Planet ring
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.4)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(planetX, planetY, 65, 14, -0.4, 0, Math.PI * 2);
    ctx.stroke();
  } else if (biome === 'desert') {
    // 1. Warm Golden Hour / Blazing Dune Horizon
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
    skyGrad.addColorStop(0, '#fdba74');
    skyGrad.addColorStop(0.4, '#ea580c');
    skyGrad.addColorStop(0.7, '#7c2d12');
    skyGrad.addColorStop(1, '#451a03');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h);

    // 2. Blazing Sun
    const sunGrad = ctx.createRadialGradient(w * 0.65, h * 0.35, 10, w * 0.65, h * 0.35, 120);
    sunGrad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
    sunGrad.addColorStop(0.3, 'rgba(254, 240, 138, 0.6)');
    sunGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(w * 0.65, h * 0.35, 120, 0, Math.PI * 2);
    ctx.fill();

    // 3. Sand Dunes (3 parallax layers)
    const duneColors = ['#9a3412', '#7c2d12', '#431407'];
    duneColors.forEach((color, dIdx) => {
      const baseY = h * (0.6 + dIdx * 0.12);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(0, baseY);
      ctx.bezierCurveTo(w * 0.3, baseY - 50, w * 0.7, baseY + 40, w, baseY - 20);
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      ctx.fill();
    });

    // 4. Drifting Sand / Heat Shimmer
    ctx.strokeStyle = 'rgba(254, 215, 170, 0.25)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 30; i++) {
      const dx = (i * 59 + t * 200) % w;
      const dy = (i * 37 + Math.sin(t * 3 + i) * 15) % h;
      ctx.beginPath();
      ctx.moveTo(dx, dy);
      ctx.lineTo(dx + 18, dy - 2);
      ctx.stroke();
    }
  } else if (biome === 'jungle') {
    // 1. Deep Mist Emerald Canopy
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
    skyGrad.addColorStop(0, '#064e3b');
    skyGrad.addColorStop(0.5, '#022c22');
    skyGrad.addColorStop(1, '#021812');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h);

    // 2. Volumetric God-Rays piercing canopy
    const rayGrad = ctx.createLinearGradient(w * 0.3, 0, w * 0.6, h);
    rayGrad.addColorStop(0, 'rgba(167, 243, 208, 0.25)');
    rayGrad.addColorStop(0.7, 'rgba(52, 211, 153, 0.08)');
    rayGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = rayGrad;
    ctx.beginPath();
    ctx.moveTo(w * 0.2, 0);
    ctx.lineTo(w * 0.45, 0);
    ctx.lineTo(w * 0.75, h);
    ctx.lineTo(w * 0.4, h);
    ctx.closePath();
    ctx.fill();

    // 3. Ancient Canopy Tree Silhouettes
    ctx.fillStyle = '#01150f';
    for (let tr = 0; tr < 8; tr++) {
      const tx = tr * (w / 7);
      const th = (0.5 + Math.sin(tr * 2) * 0.2) * h;
      ctx.beginPath();
      ctx.ellipse(tx, h - th, 110, 80, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // 4. Bioluminescent Spores
    for (let s = 0; s < 25; s++) {
      const sx = (s * 47 + Math.sin(t + s) * 20) % w;
      const sy = (s * 89 - t * 30 + h) % h;
      ctx.fillStyle = 'rgba(52, 211, 153, 0.7)';
      ctx.shadowColor = '#34d399';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(sx, sy, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (biome === 'dungeon') {
    // 1. Dark Crypt / Stone Gothic Vault
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
    skyGrad.addColorStop(0, '#1c1917');
    skyGrad.addColorStop(0.6, '#0c0a09');
    skyGrad.addColorStop(1, '#050404');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h);

    // 2. Gothic Stone Arches
    ctx.fillStyle = '#0a0908';
    const archCount = 5;
    for (let a = 0; a < archCount; a++) {
      const ax = a * (w / 4);
      ctx.beginPath();
      ctx.moveTo(ax - 20, h);
      ctx.lineTo(ax - 20, h * 0.35);
      ctx.quadraticCurveTo(ax + 40, h * 0.2, ax + 100, h * 0.35);
      ctx.lineTo(ax + 100, h);
      ctx.closePath();
      ctx.fill();
    }

    // 3. Flickering Torchlight Flame & Glow
    const torchX = w * 0.8;
    const torchY = h * 0.55;
    const flicker = Math.sin(t * 15) * 6;
    const torchGrad = ctx.createRadialGradient(torchX, torchY, 5, torchX, torchY, 140 + flicker);
    torchGrad.addColorStop(0, 'rgba(251, 146, 60, 0.7)');
    torchGrad.addColorStop(0.5, 'rgba(245, 158, 11, 0.3)');
    torchGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = torchGrad;
    ctx.beginPath();
    ctx.arc(torchX, torchY, 140 + flicker, 0, Math.PI * 2);
    ctx.fill();

    // Rising Embers
    for (let e = 0; e < 20; e++) {
      const ex = torchX + Math.sin(t * 4 + e) * 25;
      const ey = torchY - ((e * 15 + t * 80) % 180);
      ctx.fillStyle = 'rgba(251, 191, 36, 0.8)';
      ctx.fillRect(ex, ey, 2, 2);
    }
  } else if (biome === 'ocean') {
    // 1. Underwater Turquoise Depths
    const oceanGrad = ctx.createLinearGradient(0, 0, 0, h);
    oceanGrad.addColorStop(0, '#0284c7');
    oceanGrad.addColorStop(0.4, '#0369a1');
    oceanGrad.addColorStop(1, '#082f49');
    ctx.fillStyle = oceanGrad;
    ctx.fillRect(0, 0, w, h);

    // 2. Shimmering Sunlight Caustics
    ctx.strokeStyle = 'rgba(224, 242, 254, 0.2)';
    ctx.lineWidth = 2;
    for (let c = 0; c < 12; c++) {
      const cx = (c * (w / 11) + Math.sin(t * 2 + c) * 30);
      ctx.beginPath();
      ctx.moveTo(cx, 0);
      ctx.quadraticCurveTo(cx + 40, h * 0.5, cx - 20, h);
      ctx.stroke();
    }

    // 3. Rising Air Bubbles
    for (let b = 0; b < 30; b++) {
      const bx = (b * 41 + Math.sin(t * 2 + b) * 15) % w;
      const by = (h - ((b * 53 + t * 90) % h));
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(bx, by, (b % 4) + 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  } else if (biome === 'noir') {
    // 1. Monochrome Grayscale Gradient
    const noirGrad = ctx.createLinearGradient(0, 0, 0, h);
    noirGrad.addColorStop(0, '#262626');
    noirGrad.addColorStop(0.6, '#0f0f0f');
    noirGrad.addColorStop(1, '#050505');
    ctx.fillStyle = noirGrad;
    ctx.fillRect(0, 0, w, h);

    // 2. Venetian Blind Shadows
    const slatCount = 14;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    for (let s = 0; s < slatCount; s++) {
      const slatY = s * (h / slatCount);
      ctx.fillRect(0, slatY, w, 16);
    }

    // 3. Rising Cigarette Smoke Ribbon
    ctx.strokeStyle = 'rgba(212, 212, 216, 0.25)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(w * 0.5, h * 0.9);
    for (let sm = 0; sm < 8; sm++) {
      const smY = h * 0.9 - sm * 45;
      const smX = w * 0.5 + Math.sin(t * 2 + sm * 0.8) * (20 + sm * 10);
      ctx.lineTo(smX, smY);
    }
    ctx.stroke();
  } else {
    // Standard Cyberpunk / High-Tech Neon Skyline
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
    if (characterType === 'ghoul') {
      skyGrad.addColorStop(0, '#0c0714');
      skyGrad.addColorStop(0.5, '#050209');
      skyGrad.addColorStop(1, '#020104');
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

    // City Buildings with illuminated neon signs
    const buildingCount = 10;
    const baseY = h * 0.75;
    ctx.fillStyle = 'rgba(2, 6, 14, 0.9)';
    for (let b = 0; b < buildingCount; b++) {
      const bw = w / (buildingCount * 0.9);
      const bx = b * (bw * 0.95);
      const bh = ((Math.sin(b * 3.7) * 0.5 + 0.5) * 0.35 + 0.15) * h;
      ctx.fillRect(bx, baseY - bh, bw, bh + h * 0.3);

      // Neon billboard glow
      if (b % 3 === 1) {
        ctx.fillStyle = b % 2 === 0 ? 'rgba(236, 72, 153, 0.5)' : 'rgba(56, 189, 248, 0.5)';
        ctx.fillRect(bx + 10, baseY - bh + 15, bw - 20, 18);
      }
    }

    // Rain Streaks
    const rainCount = 40;
    ctx.strokeStyle = 'rgba(186, 230, 253, 0.3)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (let i = 0; i < rainCount; i++) {
      const rx = (i * 47 + t * 450) % w;
      const ry = (i * 91 + t * 750) % h;
      ctx.moveTo(rx, ry);
      ctx.lineTo(rx - 8, ry + 24);
    }
    ctx.stroke();

    // Ground fog
    const fogY = h * 0.72;
    const fogGrad = ctx.createLinearGradient(0, fogY, 0, h);
    fogGrad.addColorStop(0, 'transparent');
    fogGrad.addColorStop(1, 'rgba(2, 6, 23, 0.85)');
    ctx.fillStyle = fogGrad;
    ctx.fillRect(0, fogY, w, h - fogY);
  }

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
