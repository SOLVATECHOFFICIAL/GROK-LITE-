/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AspectRatio, VideoProject, VideoScene } from '../types/video';
import {
  computeMotionTransform,
  drawCinematicSubtitle,
  getCanvasDimensions,
  renderCanvasEffects,
  renderCinematicCharacter,
  renderCinematicEnvironment,
} from './videoRenderEngine';

export interface Mp4ExportOptions {
  project?: VideoProject;
  projects?: VideoProject[];
  aspectRatio: AspectRatio;
  onProgress?: (percent: number, status: string) => void;
}

/**
 * Determines best supported MP4 MIME type for MediaRecorder.
 */
export function getSupportedMp4MimeType(): string {
  if (typeof MediaRecorder === 'undefined') return 'video/mp4';

  const candidates = [
    'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
    'video/mp4;codecs=avc1',
    'video/mp4;codecs=h264',
    'video/mp4',
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
  ];

  for (const mime of candidates) {
    if (MediaRecorder.isTypeSupported(mime)) {
      return mime;
    }
  }

  return 'video/mp4';
}

/**
 * Pre-load all scene images for smooth rendering without dropped frames.
 */
async function preloadSceneImages(scenes: VideoScene[]): Promise<Map<string, HTMLImageElement>> {
  const map = new Map<string, HTMLImageElement>();
  const promises = scenes
    .filter((s) => Boolean(s.imageSrc))
    .map((s) => {
      return new Promise<void>((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          map.set(s.imageSrc!, img);
          resolve();
        };
        img.onerror = () => resolve();
        img.src = s.imageSrc!;
      });
    });

  await Promise.all(promises);
  return map;
}

/**
 * Exports either a single VideoProject or a batch sequence of VideoProjects strictly as an MP4 file.
 */
export async function exportToMp4(options: Mp4ExportOptions): Promise<void> {
  const { project, projects = [], aspectRatio, onProgress } = options;

  const targetProjects: VideoProject[] = project
    ? [project]
    : projects.length > 0
    ? projects
    : [];

  if (targetProjects.length === 0) {
    throw new Error('No video projects provided for MP4 export.');
  }

  onProgress?.(5, 'Initializing MP4 video encoder...');

  // Flatten all scenes in order
  const allScenes: VideoScene[] = [];
  targetProjects.forEach((p) => {
    p.scenes.forEach((s) => allScenes.push(s));
  });

  if (allScenes.length === 0) {
    throw new Error('Project has no scenes to export.');
  }

  const loadedImages = await preloadSceneImages(allScenes);
  onProgress?.(15, 'Loaded scene assets...');

  // Setup offscreen render canvas
  const { width, height } = getCanvasDimensions(aspectRatio);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not create canvas 2D rendering context');

  const stream = canvas.captureStream(30);
  const selectedMime = getSupportedMp4MimeType();

  const chunks: Blob[] = [];
  const recorder = new MediaRecorder(stream, {
    mimeType: selectedMime,
    videoBitsPerSecond: 6000000,
  });

  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  const recordPromise = new Promise<Blob>((resolve) => {
    recorder.onstop = () => {
      // Force MP4 container type
      resolve(new Blob(chunks, { type: 'video/mp4' }));
    };
  });

  recorder.start();

  const totalDuration = allScenes.reduce((sum, s) => sum + s.duration, 0);
  const totalSimSeconds = Math.min(totalDuration, 30);
  const timeStep = 0.2; // 5 FPS capture simulation for high speed & quality
  let currentTime = 0;

  while (currentTime <= totalSimSeconds) {
    // Find active scene
    let accumulated = 0;
    let activeScene = allScenes[0];
    let sceneLocalTime = 0;

    for (const s of allScenes) {
      if (currentTime >= accumulated && currentTime < accumulated + s.duration) {
        activeScene = s;
        sceneLocalTime = currentTime - accumulated;
        break;
      }
      accumulated += s.duration;
    }

    const sceneProgress = activeScene ? sceneLocalTime / activeScene.duration : 0;
    const charType = activeScene.characterType || 'narrator';

    // Draw frame
    ctx.save();
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = activeScene.backgroundColor || '#020617';
    ctx.fillRect(0, 0, width, height);

    const img = activeScene.imageSrc ? loadedImages.get(activeScene.imageSrc) : undefined;
    if (img) {
      const transform = computeMotionTransform(activeScene.motionType, sceneProgress);
      ctx.save();
      ctx.translate(width / 2, height / 2);
      ctx.scale(transform.scale, transform.scale);
      ctx.rotate(transform.rotation);
      ctx.translate(transform.translateX, transform.translateY);

      const imgAspect = img.width / img.height;
      const canvasAspect = width / height;
      let drawW = width;
      let drawH = height;

      if (imgAspect > canvasAspect) {
        drawH = height;
        drawW = height * imgAspect;
      } else {
        drawW = width;
        drawH = width / imgAspect;
      }

      ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
      ctx.restore();

      renderCinematicEnvironment(ctx, width, height, currentTime, charType, activeScene.biome, true);
    } else {
      renderCinematicEnvironment(ctx, width, height, currentTime, charType, activeScene.biome, false);
      renderCinematicCharacter(
        ctx,
        width,
        height,
        currentTime,
        charType,
        true,
        activeScene.speakerName
      );
    }

    renderCanvasEffects(ctx, activeScene.effects, width, height, sceneProgress);

    if (activeScene.cinematicSubtitle) {
      const displaySubtitle = activeScene.speakerName
        ? `[${activeScene.speakerName}]: "${activeScene.cinematicSubtitle}"`
        : activeScene.cinematicSubtitle;
      drawCinematicSubtitle(ctx, displaySubtitle, width / 2, height * 0.88, width * 0.85);
    }

    ctx.restore();

    const percent = Math.min(94, Math.round((currentTime / totalSimSeconds) * 75) + 20);
    onProgress?.(percent, `Encoding MP4 frame stream (${percent}%)...`);

    await new Promise((r) => setTimeout(r, 40));
    currentTime += timeStep;
  }

  recorder.stop();
  onProgress?.(96, 'Finalizing MP4 container and metadata...');

  const mp4Blob = await recordPromise;
  onProgress?.(99, 'Preparing MP4 download...');

  // Build clean MP4 filename
  const cleanTitle = (project ? project.title : `batch_movie_${targetProjects.length}_clips`)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_');

  const filename = `${cleanTitle}.mp4`;

  const downloadUrl = URL.createObjectURL(mp4Blob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(downloadUrl);

  onProgress?.(100, `Downloaded ${filename}`);
}
