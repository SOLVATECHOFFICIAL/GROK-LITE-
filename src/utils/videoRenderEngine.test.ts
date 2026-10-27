/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeMotionTransform,
  getCanvasDimensions,
  computeAiSplitTransition,
} from './videoRenderEngine.ts';
import { extendVideoProject } from './pixazoClient.ts';
import { VideoProject } from '../types/video.ts';

test('computeMotionTransform dolly-push increases camera scale', () => {
  const start = computeMotionTransform('dolly-push', 0);
  const end = computeMotionTransform('dolly-push', 1);

  assert.equal(start.scale, 1.0);
  assert.ok(end.scale > start.scale, 'Dolly-push should smoothly scale camera');
  assert.equal(start.rotation, 0);
});

test('computeMotionTransform crane-pan shifts camera pan', () => {
  const start = computeMotionTransform('crane-pan', 0);
  const end = computeMotionTransform('crane-pan', 1);

  assert.ok(start.translateX !== end.translateX, 'Crane pan should move camera X axis');
});

test('computeMotionTransform dutch-tilt produces subtle cinematic angle', () => {
  const tilt = computeMotionTransform('dutch-tilt', 0.5);
  assert.ok(typeof tilt.rotation === 'number');
  assert.ok(Math.abs(tilt.rotation) < 5, 'Dutch tilt should stay within tasteful cinematic range');
});

test('getCanvasDimensions returns correct aspect ratio bounds', () => {
  const dims169 = getCanvasDimensions('16:9');
  assert.equal(dims169.width, 1280);
  assert.equal(dims169.height, 720);

  const dims916 = getCanvasDimensions('9:16');
  assert.equal(dims916.width, 720);
  assert.equal(dims916.height, 1280);

  const dims11 = getCanvasDimensions('1:1');
  assert.equal(dims11.width, 800);
  assert.equal(dims11.height, 800);
});

test('extendVideoProject appends next scene and lengthens video duration', () => {
  const sampleProject: VideoProject = {
    id: 'test_vid',
    title: 'Test Film',
    prompt: 'A cyberpunk thriller',
    aspectRatio: '16:9',
    totalDuration: 8.0,
    musicGenre: 'cinematic-orchestra',
    createdAt: Date.now(),
    scenes: [
      {
        id: 'scene_1',
        title: 'Shot 1',
        duration: 4.0,
        motionType: 'dolly-push',
        effects: ['film-grain'],
        cinematicSubtitle: 'The beginning',
      },
      {
        id: 'scene_2',
        title: 'Shot 2',
        duration: 4.0,
        motionType: 'crane-pan',
        effects: ['cinematic-bars'],
        cinematicSubtitle: 'The revelation',
      },
    ],
  };

  const extended = extendVideoProject(sampleProject, 'Continuation line');

  assert.equal(extended.scenes.length, 3, 'Extended video should have 3 scenes');
  assert.ok(extended.totalDuration > sampleProject.totalDuration, 'Total duration should increase');
  assert.equal(extended.scenes[2].cinematicSubtitle, 'Continuation line');
});

test('computeAiSplitTransition calculates intelligent seamless transitions', () => {
  const matchSplit = computeAiSplitTransition('dolly-push', 'crane-pan', 'female', 'female');
  assert.equal(matchSplit.transitionType, 'ai-matched');
  assert.ok(matchSplit.reasoning.includes('AI Smart Match'));

  const whipSplit = computeAiSplitTransition('steadicam-track', 'dolly-push', 'male', 'male');
  assert.equal(whipSplit.transitionType, 'motion-whip');

  const charChangeSplit = computeAiSplitTransition('crane-pan', 'dolly-push', 'ghoul', 'female');
  assert.equal(charChangeSplit.transitionType, 'dip-to-black');

  const defaultSplit = computeAiSplitTransition('cinematic-drift', 'cinematic-drift');
  assert.equal(defaultSplit.transitionType, 'cross-dissolve');
});

