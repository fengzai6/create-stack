import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';

type ScriptModule = {
  normalizeForwardedArgs: (rawArgs: string[]) => string[];
};

const scriptPath = path.resolve(process.cwd(), 'scripts', 'test-create.js');
const { normalizeForwardedArgs } = require(scriptPath) as ScriptModule;

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
