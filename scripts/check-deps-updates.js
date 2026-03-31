const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const readline = require('node:readline/promises');
const process = require('node:process');

const DEPENDENCY_SECTIONS = [
  'dependencies',
  'devDependencies',
  'peerDependencies',
  'optionalDependencies'
];

const CONFIG_RELATIVE_PATH = path.join('src', 'config.ts');
const CONFIG_BLOCK_START = 'const FRONTEND_OPTIONAL_DEPENDENCIES = {';
const CONFIG_BLOCK_END = '} satisfies OptionalDependencyMap;';

function escapeRegExp(input) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function isIdentifier(input) {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(input);
}

function buildUpdatedRange(currentRange, latestVersion) {
  if (typeof currentRange !== 'string' || currentRange.length === 0) {
    return latestVersion;
  }

  if (currentRange.startsWith('^')) {
    return `^${latestVersion}`;
  }

  if (currentRange.startsWith('~')) {
    return `~${latestVersion}`;
  }

  return latestVersion;
}

function planUpdates(packageJson, outdatedMap) {
  const updates = [];

  for (const [dependencyName, info] of Object.entries(outdatedMap)) {
    if (!info || typeof info !== 'object') {
      continue;
    }

    const latestVersion = info.latest;
    if (typeof latestVersion !== 'string' || latestVersion.length === 0) {
      continue;
    }

    for (const section of DEPENDENCY_SECTIONS) {
      const sectionDeps = packageJson[section];
      if (!sectionDeps || typeof sectionDeps !== 'object') {
        continue;
      }

      const currentRange = sectionDeps[dependencyName];
      if (typeof currentRange !== 'string') {
        continue;
      }

      const nextRange = buildUpdatedRange(currentRange, latestVersion);
      // 过滤无实际变更的结果（例如 latest 与当前范围等价）。
      if (nextRange === currentRange) {
        break;
      }

      updates.push({
        name: dependencyName,
        section,
        currentRange,
        latest: latestVersion,
        nextRange
      });
      break;
    }
  }

  return updates;
}

async function applyUpdates(packageJsonPath, updates) {
  const content = await fs.promises.readFile(packageJsonPath, 'utf8');
  const packageJson = JSON.parse(content);

  for (const update of updates) {
    if (!packageJson[update.section]) {
      continue;
    }
    packageJson[update.section][update.name] = update.nextRange;
  }

  await fs.promises.writeFile(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`, 'utf8');
}

function getOutdatedMap(packageDir) {
  const result = spawnSync('npm', ['outdated', '--json'], {
    cwd: packageDir,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  });

  // npm outdated: 0 表示无更新，1 表示有更新。
  if (result.status !== 0 && result.status !== 1) {
    const stderr = result.stderr?.trim();
    throw new Error(stderr || `Failed to run npm outdated in ${packageDir}`);
  }

  const stdout = result.stdout?.trim();
  if (!stdout) {
    return {};
  }

  return JSON.parse(stdout);
}

function getConfigBlockRange(configContent) {
  const start = configContent.indexOf(CONFIG_BLOCK_START);
  if (start < 0) {
    return null;
  }

  const blockStart = configContent.indexOf('{', start);
  if (blockStart < 0) {
    return null;
  }

  const blockEnd = configContent.indexOf(CONFIG_BLOCK_END, blockStart);
  if (blockEnd < 0) {
    return null;
  }

  return {
    start: blockStart + 1,
    end: blockEnd
  };
}

function parseConfigDependencyRanges(configContent) {
  const blockRange = getConfigBlockRange(configContent);
  if (!blockRange) {
    return {};
  }

  const block = configContent.slice(blockRange.start, blockRange.end);
  const result = {};
  const dependencyPattern =
    /(?:^|\n)\s*(?:"([^"]+)"|'([^']+)'|([A-Za-z_$][A-Za-z0-9_$]*))\s*:\s*\{\s*version:\s*["']([^"']+)["']/g;

  let match = dependencyPattern.exec(block);
  while (match) {
    const name = match[1] || match[2] || match[3];
    const range = match[4];
    if (name && range) {
      result[name] = range;
    }
    match = dependencyPattern.exec(block);
  }

  return result;
}

function planConfigUpdates(configContent, outdatedMap) {
  const ranges = parseConfigDependencyRanges(configContent);
  const updates = [];

  for (const [dependencyName, currentRange] of Object.entries(ranges)) {
    const info = outdatedMap[dependencyName];
    if (!info || typeof info !== 'object') {
      continue;
    }

    const latestVersion = info.latest;
    if (typeof latestVersion !== 'string' || latestVersion.length === 0) {
      continue;
    }

    const nextRange = buildUpdatedRange(currentRange, latestVersion);
    // 过滤无实际变更的结果（例如 latest 与当前范围等价）。
    if (nextRange === currentRange) {
      continue;
    }

    updates.push({
      name: dependencyName,
      section: 'config',
      currentRange,
      latest: latestVersion,
      nextRange
    });
  }

  return updates;
}

function getOutdatedMapForRanges(dependencyRanges) {
  if (Object.keys(dependencyRanges).length === 0) {
    return {};
  }

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'create-fz-stack-check-'));
  const tempPackageJsonPath = path.join(tempDir, 'package.json');
  fs.writeFileSync(
    tempPackageJsonPath,
    `${JSON.stringify(
      {
        name: 'create-fz-stack-deps-check',
        private: true,
        dependencies: dependencyRanges
      },
      null,
      2
    )}\n`,
    'utf8'
  );

  try {
    return getOutdatedMap(tempDir);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

async function applyConfigUpdates(configPath, updates) {
  const content = await fs.promises.readFile(configPath, 'utf8');
  const blockRange = getConfigBlockRange(content);
  if (!blockRange || updates.length === 0) {
    return;
  }

  let block = content.slice(blockRange.start, blockRange.end);

  for (const update of updates) {
    const escapedName = escapeRegExp(update.name);
    const keyAlternatives = [
      `"${escapedName}"`,
      `'${escapedName}'`
    ];
    if (isIdentifier(update.name)) {
      keyAlternatives.push(escapedName);
    }

    const matcher = new RegExp(
      `((?:^|\\n)\\s*(?:${keyAlternatives.join('|')})\\s*:\\s*\\{\\s*version:\\s*["'])([^"']+)(["'])`
    );

    block = block.replace(matcher, `$1${update.nextRange}$3`);
  }

  const nextContent = `${content.slice(0, blockRange.start)}${block}${content.slice(blockRange.end)}`;
  await fs.promises.writeFile(configPath, nextContent, 'utf8');
}

function findPackageJsonPaths(rootDir) {
  const packageJsonPaths = [path.join(rootDir, 'package.json')];
  const templatesDir = path.join(rootDir, 'templates');

  if (!fs.existsSync(templatesDir)) {
    return packageJsonPaths;
  }

  const templateEntries = fs.readdirSync(templatesDir, { withFileTypes: true });
  for (const entry of templateEntries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const templatePackageJsonPath = path.join(templatesDir, entry.name, 'package.json');
    if (fs.existsSync(templatePackageJsonPath)) {
      packageJsonPaths.push(templatePackageJsonPath);
    }
  }

  return packageJsonPaths;
}

async function checkConfigTarget(rootDir) {
  const configPath = path.join(rootDir, CONFIG_RELATIVE_PATH);
  if (!fs.existsSync(configPath)) return null;

  console.log(`Checking ${CONFIG_RELATIVE_PATH}...`);
  const configContent = await fs.promises.readFile(configPath, 'utf8');
  const configRanges = parseConfigDependencyRanges(configContent);
  const outdatedMap = getOutdatedMapForRanges(configRanges);
  const updates = planConfigUpdates(configContent, outdatedMap);

  if (updates.length > 0) {
    console.log(`- ${CONFIG_RELATIVE_PATH}: found ${updates.length} update(s)`);
    return { kind: 'config', absolutePath: configPath, relativePath: CONFIG_RELATIVE_PATH, updates };
  }

  console.log(`- ${CONFIG_RELATIVE_PATH}: no updates`);
  return null;
}

async function collectUpdateTargets(rootDir, configOnly = false) {
  const targets = [];

  if (configOnly) {
    const target = await checkConfigTarget(rootDir);
    if (target) targets.push(target);
    return targets;
  }

  const packageJsonPaths = findPackageJsonPaths(rootDir);

  for (const packageJsonPath of packageJsonPaths) {
    const packageDir = path.dirname(packageJsonPath);
    const relativePath = path.relative(rootDir, packageJsonPath) || 'package.json';
    console.log(`Checking ${relativePath}...`);

    const packageJson = JSON.parse(await fs.promises.readFile(packageJsonPath, 'utf8'));
    const outdatedMap = getOutdatedMap(packageDir);
    const updates = planUpdates(packageJson, outdatedMap);
    if (updates.length === 0) {
      console.log(`- ${relativePath}: no updates`);
      continue;
    }

    console.log(`- ${relativePath}: found ${updates.length} update(s)`);
    targets.push({
      kind: 'package-json',
      absolutePath: packageJsonPath,
      relativePath,
      updates
    });
  }

  const configTarget = await checkConfigTarget(rootDir);
  if (configTarget) targets.push(configTarget);

  return targets;
}

function printUpdateSummary(targets) {
  for (const target of targets) {
    console.log(`\n[${target.relativePath}] ${target.updates.length} update(s):`);
    for (const update of target.updates) {
      console.log(`- ${update.name}: ${update.currentRange} -> ${update.nextRange} (latest ${update.latest})`);
    }
  }
}

async function confirmApplyAll(rl, totalUpdateCount, fileCount) {
  const answer = (
    await rl.question(`\nApply all ${totalUpdateCount} updates across ${fileCount} file(s)? (y/N): `)
  )
    .trim()
    .toLowerCase();

  return answer === 'y' || answer === 'yes';
}

async function run() {
  const rootDir = process.cwd();
  const configOnly = process.argv.includes('--config-only');
  console.log('Checking dependency updates...');
  const targets = await collectUpdateTargets(rootDir, configOnly);

  if (targets.length === 0) {
    console.log('No dependency updates found.');
    return;
  }

  const totalUpdateCount = targets.reduce((sum, target) => sum + target.updates.length, 0);
  printUpdateSummary(targets);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const shouldApply = await confirmApplyAll(rl, totalUpdateCount, targets.length);
  rl.close();

  if (!shouldApply) {
    console.log('Skip updates.');
    return;
  }

  console.log('\nApplying updates...');
  for (const target of targets) {
    if (target.kind === 'package-json') {
      await applyUpdates(target.absolutePath, target.updates);
    } else {
      await applyConfigUpdates(target.absolutePath, target.updates);
    }

    console.log(`Updated ${target.relativePath}`);
  }

  console.log(`Done. Updated ${targets.length} file(s), ${totalUpdateCount} dependency range(s).`);
}

if (require.main === module) {
  run().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}

module.exports = {
  buildUpdatedRange,
  planUpdates,
  applyUpdates,
  parseConfigDependencyRanges,
  planConfigUpdates,
  applyConfigUpdates,
  findPackageJsonPaths,
  collectUpdateTargets
};
