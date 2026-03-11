import test from 'node:test';
import assert from 'node:assert/strict';

import { parseCliArgs } from '../src/cli-options';

test('parses short flags and positional target dir', () => {
  const parsed = parseCliArgs(['-h', '-i', '-t', 'react', 'my-app']);

  assert.equal(parsed.help, true);
  assert.equal(parsed.immediate, true);
  assert.equal(parsed.template, 'react');
  assert.equal(parsed.targetDir, 'my-app');
});

test('parses long flags including no-interactive and overwrite', () => {
  const parsed = parseCliArgs([
    '--template',
    'express',
    '--overwrite',
    '--no-interactive',
    'api-app'
  ]);

  assert.equal(parsed.template, 'express');
  assert.equal(parsed.overwrite, true);
  assert.equal(parsed.interactive, false);
  assert.equal(parsed.targetDir, 'api-app');
});

test('defaults booleans when not provided', () => {
  const parsed = parseCliArgs([]);

  assert.equal(parsed.help, false);
  assert.equal(parsed.overwrite, false);
  assert.equal(parsed.immediate, undefined);
  assert.equal(parsed.interactive, undefined);
});

test('throws on missing --template value', () => {
  assert.throws(() => parseCliArgs(['--template']), /requires a value/);
  assert.throws(() => parseCliArgs(['-t']), /requires a value/);
});
