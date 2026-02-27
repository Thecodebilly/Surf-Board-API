const assert = require('node:assert/strict');
const { containsProfanity } = require('./profanity');

const blocked = [
  'fuck',
  'f.u.c.k',
  'F@ggot',
  's h i t',
  'fuuuuuck',
  'shiiiit',
  'biiitch',
  'mother-fucker',
  'motherffffucker',
  'player69',
  '69',
  'B1TCH'
];

const allowed = ['classy surfer', 'passion', 'hello world', 'score_123'];

for (const sample of blocked) {
  assert.equal(containsProfanity(sample), true, `Expected to block: ${sample}`);
}

for (const sample of allowed) {
  assert.equal(containsProfanity(sample), false, `Expected to allow: ${sample}`);
}

console.log('profanity checks passed');
