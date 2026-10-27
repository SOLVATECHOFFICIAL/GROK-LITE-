/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { detectCharacterType, CHARACTER_PROFILES } from './characterVoice';

test('detectCharacterType classifies ghouls and monsters correctly', () => {
  assert.equal(detectCharacterType('A frightening ghoul rises from the tomb'), 'ghoul');
  assert.equal(detectCharacterType('Ancient subterranean beast and dragon roar'), 'monster');
  assert.equal(detectCharacterType('Undead shadow wraith whispering in darkness'), 'ghoul');
});

test('detectCharacterType classifies female and male characters correctly', () => {
  assert.equal(detectCharacterType('Cyberpunk female warrior on neon rooftop'), 'female');
  assert.equal(detectCharacterType('A heroic male knight standing on the cliff'), 'male');
  assert.equal(detectCharacterType('An ancient cyborg AI core humming in space'), 'robot');
});

test('detectCharacterType falls back to narrator for general cinematic prompts', () => {
  assert.equal(detectCharacterType('Cinematic drone wide shot of mountain range'), 'narrator');
});

test('CHARACTER_PROFILES have distinct pitch values for characters', () => {
  assert.ok(CHARACTER_PROFILES.ghoul.pitch < 0.6, 'Ghoul voice must be low pitch');
  assert.ok(CHARACTER_PROFILES.monster.pitch < 0.5, 'Monster voice must be deep bass');
  assert.ok(CHARACTER_PROFILES.female.pitch > 1.1, 'Female voice must have higher pitch');
  assert.ok(CHARACTER_PROFILES.male.pitch < 0.9, 'Male warrior voice must be deep baritone');
});
