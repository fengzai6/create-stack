import test from 'node:test';
import assert from 'node:assert/strict';

import { omit } from '../src/utils';

test('omit removes specified keys and keeps the rest', () => {
  const source = {
    antd: { version: '^6.3.2', defaultSelected: true },
    axios: { version: '^1.13.6', defaultSelected: true },
    zustand: { version: '^5.0.11', defaultSelected: true }
  };

  const result = omit(source, ['antd']);

  assert.deepEqual(result, {
    axios: { version: '^1.13.6', defaultSelected: true },
    zustand: { version: '^5.0.11', defaultSelected: true }
  });
  assert.deepEqual(Object.keys(result).sort(), ['axios', 'zustand']);
});
