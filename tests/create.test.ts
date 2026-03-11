import test from 'node:test';
import assert from 'node:assert/strict';

import { applySelectedDependencies, buildInstallPlan, detectPackageManager } from '../src/create';

test('builds install step when user chooses immediate install', () => {
  const plan = buildInstallPlan('yarn', true);
  assert.deepEqual(plan, [{ command: 'yarn', args: ['install'] }]);
});

test('skips install step when user chooses not to install now', () => {
  const plan = buildInstallPlan('pnpm', false);
  assert.deepEqual(plan, []);
});

test('adds selected optional dependencies with pinned versions', () => {
  const packageJson = JSON.stringify(
    {
      name: 'demo-app',
      version: '1.0.0',
      dependencies: {
        react: '^19.0.0'
      }
    },
    null,
    2
  );

  const updatedJson = applySelectedDependencies(packageJson, ['antd', 'axios']);
  const parsed = JSON.parse(updatedJson) as { dependencies?: Record<string, string> };

  assert.equal(parsed.dependencies?.react, '^19.0.0');
  assert.equal(parsed.dependencies?.antd, '^6.3.2');
  assert.equal(parsed.dependencies?.axios, '^1.13.6');
});

test('does not override existing dependency versions', () => {
  const packageJson = JSON.stringify(
    {
      name: 'demo-app',
      dependencies: {
        axios: '^1.8.0'
      }
    },
    null,
    2
  );

  const updatedJson = applySelectedDependencies(packageJson, ['axios', 'zustand']);
  const parsed = JSON.parse(updatedJson) as { dependencies?: Record<string, string> };

  assert.equal(parsed.dependencies?.axios, '^1.8.0');
  assert.equal(parsed.dependencies?.zustand, '^5.0.11');
});

test('detects package manager from npm_config_user_agent', () => {
  assert.equal(detectPackageManager('pnpm/10.0.0 npm/? node/?'), 'pnpm');
  assert.equal(detectPackageManager('yarn/1.22.22 npm/? node/?'), 'yarn');
  assert.equal(detectPackageManager('npm/10.9.0 node/v22.0.0 darwin x64'), 'npm');
});

test('falls back to npm_execpath and defaults to npm', () => {
  assert.equal(detectPackageManager('', '/opt/homebrew/bin/pnpm'), 'pnpm');
  assert.equal(detectPackageManager('', '/usr/local/bin/yarn'), 'yarn');
  assert.equal(detectPackageManager('', '/usr/local/lib/node_modules/npm/bin/npm-cli.js'), 'npm');
  assert.equal(detectPackageManager('', ''), 'npm');
});
