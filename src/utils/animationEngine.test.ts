/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  clamp,
  lerp,
  easeInOutCubic,
  interpolateCharacterAtTime,
  calculatePoseOffset,
  createDefaultCharacter,
  getDefaultProject,
} from './animationEngine.ts';

test('clamp restricts numbers within bounds', () => {
  assert.equal(clamp(15, 0, 10), 10);
  assert.equal(clamp(-5, 0, 10), 0);
  assert.equal(clamp(4, 0, 10), 4);
});

test('lerp calculates linear interpolation properly', () => {
  assert.equal(lerp(0, 100, 0.5), 50);
  assert.equal(lerp(10, 20, 0), 10);
  assert.equal(lerp(10, 20, 1), 20);
});

test('easeInOutCubic starts and ends at 0 and 1', () => {
  assert.equal(easeInOutCubic(0), 0);
  assert.equal(easeInOutCubic(1), 1);
  assert.equal(easeInOutCubic(0.5), 0.5);
});

test('interpolateCharacterAtTime interpolates coordinates across keyframes', () => {
  const char = createDefaultCharacter('fox', 20, 60);
  char.keyframes = [
    {
      id: 'k1',
      time: 0,
      x: 10,
      y: 50,
      scale: 1,
      rotation: 0,
      flipX: false,
      emotion: 'curious',
      pose: 'idle',
    },
    {
      id: 'k2',
      time: 1,
      x: 30,
      y: 50,
      scale: 2,
      rotation: 10,
      flipX: false,
      emotion: 'happy',
      pose: 'walking',
    },
  ];

  // At start
  const stateStart = interpolateCharacterAtTime(char, 0);
  assert.equal(stateStart.x, 10);
  assert.equal(stateStart.scale, 1);
  assert.equal(stateStart.emotion, 'curious');

  // At mid
  const stateMid = interpolateCharacterAtTime(char, 0.5);
  assert.equal(stateMid.x, 20);
  assert.equal(stateMid.scale, 1.5);
  assert.equal(stateMid.emotion, 'happy');

  // At end
  const stateEnd = interpolateCharacterAtTime(char, 1);
  assert.equal(stateEnd.x, 30);
  assert.equal(stateEnd.scale, 2);
  assert.equal(stateEnd.pose, 'walking');
});

test('calculatePoseOffset produces non-zero procedural motion', () => {
  const walkOffset = calculatePoseOffset('walking', 0.5, true);
  assert.ok(typeof walkOffset.bodyOffsetY === 'number');
  assert.ok(typeof walkOffset.limbAngle === 'number');

  const jumpOffset = calculatePoseOffset('jumping', 0.2, false);
  assert.ok(jumpOffset.bodyOffsetY < 0, 'Jumping should offset upward (negative Y)');
});

test('getDefaultProject generates valid scenes with characters and props', () => {
  const proj = getDefaultProject();
  assert.ok(proj.scenes.length >= 3, 'Must have at least 3 scenes');
  assert.ok(proj.title.includes('Fox'));
  const firstScene = proj.scenes[0];
  assert.ok(firstScene.characters.length > 0, 'First scene must have characters');
  assert.ok(firstScene.props.length > 0, 'First scene must have props');
  assert.equal(firstScene.background, 'twilight-forest');
});
