import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { existsSync, mkdtempSync, readFileSync } from 'node:fs';

import {
  applySelectedDependencies,
  buildInstallPlan,
  createProject,
  detectPackageManager
} from '../src/create';
import { getOptionalDependencyVersion } from '../src/config';

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
  assert.equal(parsed.dependencies?.antd, getOptionalDependencyVersion('antd'));
  assert.equal(parsed.dependencies?.axios, getOptionalDependencyVersion('axios'));
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
  assert.equal(parsed.dependencies?.zustand, getOptionalDependencyVersion('zustand'));
});

test('syncs package name when project name is provided', () => {
  const packageJson = JSON.stringify(
    {
      name: 'react-app',
      version: '1.0.0'
    },
    null,
    2
  );

  const updatedJson = applySelectedDependencies(packageJson, [], 'my-project');
  const parsed = JSON.parse(updatedJson) as { name?: string };

  assert.equal(parsed.name, 'my-project');
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

test('restores _gitignore to .gitignore after project creation', async () => {
  const currentWorkingDirectory = process.cwd();
  const tempDirectory = mkdtempSync(path.join(os.tmpdir(), 'create-stack-test-'));

  process.chdir(tempDirectory);

  try {
    const projectDirectory = await createProject({
      projectName: 'demo-app',
      templateFolder: 'react-tailwind',
      selectedDependencies: [],
      shouldInstallDependencies: false,
      packageManager: 'npm'
    });

    assert.equal(existsSync(path.join(projectDirectory, '.gitignore')), true);
    assert.equal(existsSync(path.join(projectDirectory, '_gitignore')), false);
  } finally {
    process.chdir(currentWorkingDirectory);
  }
});

test('publishes only runtime dist output and uses _gitignore placeholders in templates', () => {
  const packageJsonPath = path.resolve(__dirname, '../../package.json');
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as {
    files?: string[];
  };

  assert.deepEqual(packageJson.files, ['dist/src', 'templates', 'README.md']);

  const templateDirectories = [
    'react-router-tailwind',
    'react-router-tailwind-antd',
    'react-tailwind',
    'react-tailwind-antd'
  ];

  for (const templateDirectory of templateDirectories) {
    const templatePath = path.resolve(__dirname, `../../templates/${templateDirectory}`);

    assert.equal(existsSync(path.join(templatePath, '_gitignore')), true);
    assert.equal(existsSync(path.join(templatePath, 'dot-gitignore')), false);
  }
});
