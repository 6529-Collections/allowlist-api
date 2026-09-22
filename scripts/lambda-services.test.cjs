const assert = require('node:assert/strict');
const { test } = require('node:test');
const { selectFunctions } = require('./lambda-services.cjs');

const functions = [
  { name: 'allowlist-token-pool-downloader' },
  { name: 'allowlist-worker' },
  { name: 'allowlist-api' },
];

test('default deployment retains worker-before-API order', () => {
  assert.deepEqual(selectFunctions(functions), functions);
});

for (const lambda of functions) {
  test(`selects only ${lambda.name}`, () => {
    assert.deepEqual(selectFunctions(functions, lambda.name), [lambda]);
  });
}

test('an invalid selector never falls back to deploying every function', () => {
  for (const service of ['', 'all', 'allowlist-typo']) {
    assert.throws(() => selectFunctions(functions, service), /Unknown Lambda service/);
  }
});
