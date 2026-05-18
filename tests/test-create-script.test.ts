import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';

const scriptPath = path.resolve(process.cwd(), 'scripts', 'test-create.js');
const scriptModule = await import(scriptPath);
const { normalizeForwardedArgs } = scriptModule as typeof import('../scripts/test-create.js');

test('normalizes forwarded args by removing leading --', () => {
  assert.deepEqual(normalizeForwardedArgs(['--', '-h']), ['-h']);
  assert.deepEqual(normalizeForwardedArgs(['--', '--template', 'react-tailwind']), [
    '--template',
    'react-tailwind'
  ]);
});

test('keeps args unchanged when there is no leading --', () => {
  assert.deepEqual(normalizeForwardedArgs(['-h']), ['-h']);
  assert.deepEqual(normalizeForwardedArgs(['--help']), ['--help']);
  assert.deepEqual(normalizeForwardedArgs([]), []);
});
