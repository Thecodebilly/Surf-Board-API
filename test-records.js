const assert = require('node:assert/strict');
const { validateRecord } = require('./records');

assert.deepEqual(validateRecord({ name: '  Sara ', score: 701 }), { name: 'Sara', score: 701 });
assert.deepEqual(validateRecord({ name: 'Ann', score: 0 }), { name: 'Ann', score: 0 });
assert.deepEqual(validateRecord({ name: 'x'.repeat(5000), score: 5 }), { name: 'x'.repeat(20), score: 5 });

const rejected = [
  undefined,
  null,
  {},
  { name: '', score: 1 },
  { name: '   ', score: 1 },
  { name: 42, score: 1 },
  { name: 'Flo', score: 12.5 },
  { name: 'Neg', score: -5 },
  { name: 'Big', score: 2147483648 },
  { name: 'Str', score: '100' },
  { name: 'Nan', score: NaN },
  { name: 'fuck', score: 10 }
];

for (const body of rejected) {
  assert.ok(validateRecord(body).error, `Expected to reject: ${JSON.stringify(body)}`);
}

console.log('record checks passed');
