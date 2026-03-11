import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

type OutdatedInfo = {
  current: string;
  wanted: string;
  latest: string;
};

type PlannedUpdate = {
  name: string;
  section:
    | 'dependencies'
    | 'devDependencies'
    | 'peerDependencies'
    | 'optionalDependencies'
    | 'config';
  currentRange: string;
  latest: string;
  nextRange: string;
};

type ScriptModule = {
  buildUpdatedRange: (currentRange: string, latestVersion: string) => string;
  planUpdates: (
    packageJson: Record<string, unknown>,
    outdatedMap: Record<string, OutdatedInfo>
  ) => PlannedUpdate[];
  applyUpdates: (packageJsonPath: string, updates: PlannedUpdate[]) => Promise<void>;
  parseConfigDependencyRanges: (configContent: string) => Record<string, string>;
  planConfigUpdates: (
    configContent: string,
    outdatedMap: Record<string, OutdatedInfo>
  ) => PlannedUpdate[];
  applyConfigUpdates: (configPath: string, updates: PlannedUpdate[]) => Promise<void>;
};

const scriptPath = path.resolve(process.cwd(), 'scripts', 'check-deps-updates.js');
const {
  buildUpdatedRange,
  planUpdates,
  applyUpdates,
  parseConfigDependencyRanges,
  planConfigUpdates,
  applyConfigUpdates
} = require(scriptPath) as ScriptModule;

test('buildUpdatedRange keeps ^ and ~ prefix', () => {
  assert.equal(buildUpdatedRange('^1.2.3', '2.0.0'), '^2.0.0');
  assert.equal(buildUpdatedRange('~1.2.3', '2.0.0'), '~2.0.0');
  assert.equal(buildUpdatedRange('1.2.3', '2.0.0'), '2.0.0');
});

test('planUpdates resolves section and target range', () => {
  const packageJson = {
    dependencies: {
      axios: '^1.0.0'
    },
    devDependencies: {
      typescript: '~5.0.0'
    }
  };

  const updates = planUpdates(packageJson, {
    axios: { current: '1.0.0', wanted: '1.1.0', latest: '1.2.0' },
    typescript: { current: '5.0.0', wanted: '5.1.0', latest: '5.8.3' }
  });

  assert.deepEqual(updates, [
    {
      name: 'axios',
      section: 'dependencies',
      currentRange: '^1.0.0',
      latest: '1.2.0',
      nextRange: '^1.2.0'
    },
    {
      name: 'typescript',
      section: 'devDependencies',
      currentRange: '~5.0.0',
      latest: '5.8.3',
      nextRange: '~5.8.3'
    }
  ]);
});

test('planUpdates skips dependencies when range does not actually change', () => {
  const packageJson = {
    dependencies: {
      axios: '^1.13.6'
    }
  };

  const updates = planUpdates(packageJson, {
    axios: { current: '1.13.6', wanted: '1.13.6', latest: '1.13.6' }
  });

  assert.deepEqual(updates, []);
});

test('applyUpdates writes selected dependency ranges back to package.json', async () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'create-fz-stack-'));
  const packageJsonPath = path.join(tempDir, 'package.json');
  fs.writeFileSync(
    packageJsonPath,
    JSON.stringify(
      {
        name: 'demo',
        dependencies: {
          axios: '^1.0.0'
        },
        devDependencies: {
          typescript: '~5.0.0'
        }
      },
      null,
      2
    ),
    'utf8'
  );

  await applyUpdates(packageJsonPath, [
    {
      name: 'axios',
      section: 'dependencies',
      currentRange: '^1.0.0',
      latest: '1.2.0',
      nextRange: '^1.2.0'
    }
  ]);

  const updated = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')) as {
    dependencies: Record<string, string>;
    devDependencies: Record<string, string>;
  };

  assert.equal(updated.dependencies.axios, '^1.2.0');
  assert.equal(updated.devDependencies.typescript, '~5.0.0');
});

test('parseConfigDependencyRanges returns dependency version map from config block', () => {
  const content = `
const FRONTEND_OPTIONAL_DEPENDENCIES = {
  axios: { version: "^1.13.6", defaultSelected: true },
  "react-router": { version: "^7.13.1", defaultSelected: false },
  'es-toolkit': { version: "^1.45.1", defaultSelected: false }
} satisfies OptionalDependencyMap;
`;

  assert.deepEqual(parseConfigDependencyRanges(content), {
    axios: '^1.13.6',
    'react-router': '^7.13.1',
    'es-toolkit': '^1.45.1'
  });
});

test('planConfigUpdates generates updates for config dependency ranges', () => {
  const content = `
const FRONTEND_OPTIONAL_DEPENDENCIES = {
  axios: { version: "^1.13.6", defaultSelected: true },
  "react-router": { version: "^7.13.1", defaultSelected: false }
} satisfies OptionalDependencyMap;
`;

  const updates = planConfigUpdates(content, {
    axios: { current: '1.13.6', wanted: '1.13.6', latest: '1.14.0' },
    'react-router': { current: '7.13.1', wanted: '7.13.1', latest: '7.14.0' }
  });

  assert.deepEqual(updates, [
    {
      name: 'axios',
      section: 'config',
      currentRange: '^1.13.6',
      latest: '1.14.0',
      nextRange: '^1.14.0'
    },
    {
      name: 'react-router',
      section: 'config',
      currentRange: '^7.13.1',
      latest: '7.14.0',
      nextRange: '^7.14.0'
    }
  ]);
});

test('planConfigUpdates skips dependencies when range does not actually change', () => {
  const content = `
const FRONTEND_OPTIONAL_DEPENDENCIES = {
  axios: { version: "^1.13.6", defaultSelected: true }
} satisfies OptionalDependencyMap;
`;

  const updates = planConfigUpdates(content, {
    axios: { current: '1.13.6', wanted: '1.13.6', latest: '1.13.6' }
  });

  assert.deepEqual(updates, []);
});

test('applyConfigUpdates writes updated ranges to config file', async () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'create-fz-stack-config-'));
  const configPath = path.join(tempDir, 'config.ts');
  fs.writeFileSync(
    configPath,
    `
const FRONTEND_OPTIONAL_DEPENDENCIES = {
  axios: { version: "^1.13.6", defaultSelected: true },
  "react-router": { version: "^7.13.1", defaultSelected: false }
} satisfies OptionalDependencyMap;
`,
    'utf8'
  );

  await applyConfigUpdates(configPath, [
    {
      name: 'axios',
      section: 'config',
      currentRange: '^1.13.6',
      latest: '1.14.0',
      nextRange: '^1.14.0'
    }
  ]);

  const next = fs.readFileSync(configPath, 'utf8');
  assert.match(next, /axios:\s*\{\s*version:\s*"\^1\.14\.0"/);
  assert.match(next, /"react-router":\s*\{\s*version:\s*"\^7\.13\.1"/);
});
