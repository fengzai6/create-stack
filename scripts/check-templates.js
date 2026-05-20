import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEMPLATE_ROOT = path.resolve(__dirname, '..', 'templates');
const YARN_COMMAND = process.platform === 'win32' ? 'yarn.cmd' : 'yarn';

export function getTemplateDirs() {
  return fs
    .readdirSync(TEMPLATE_ROOT, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((dirName) => {
      const packageJsonPath = path.join(TEMPLATE_ROOT, dirName, 'package.json');
      return fs.existsSync(packageJsonPath);
    })
    .sort();
}

export function getCheckCommands() {
  return [['install'], ['lint'], ['build']];
}

export function resolveTemplateDirs(selectedTemplateDirs) {
  const allTemplateDirs = getTemplateDirs();

  if (selectedTemplateDirs.length === 0) {
    return allTemplateDirs;
  }

  const invalidTemplateDirs = selectedTemplateDirs.filter(
    (templateDir) => !allTemplateDirs.includes(templateDir)
  );

  if (invalidTemplateDirs.length > 0) {
    console.error(`Unknown templates: ${invalidTemplateDirs.join(', ')}`);
    process.exit(1);
  }

  return selectedTemplateDirs;
}

export function runTemplateCommand(templateDir, commandArgs) {
  const cwd = path.join(TEMPLATE_ROOT, templateDir);
  const result = spawnSync(YARN_COMMAND, commandArgs, {
    cwd,
    stdio: 'inherit'
  });

  if (result.error) {
    throw result.error;
  }

  if (typeof result.status === 'number' && result.status !== 0) {
    process.exit(result.status);
  }

  if (result.status === null) {
    process.exit(1);
  }
}

function run() {
  const templateDirs = resolveTemplateDirs(process.argv.slice(2));
  const checkCommands = getCheckCommands();

  if (templateDirs.length === 0) {
    console.error('No template package.json files found.');
    process.exit(1);
  }

  for (const templateDir of templateDirs) {
    console.log(`\n[template] ${templateDir}`);

    const templatePath = path.join(TEMPLATE_ROOT, templateDir);
    const lockPath = path.join(templatePath, 'yarn.lock');
    const hadLock = fs.existsSync(lockPath);

    if (!hadLock) {
      fs.writeFileSync(lockPath, '');
    }

    for (const commandArgs of checkCommands) {
      console.log(`[run] yarn ${commandArgs.join(' ')}`);
      runTemplateCommand(templateDir, commandArgs);
    }

    if (!hadLock) {
      fs.unlinkSync(lockPath);
    }
  }
}

const isMainModule = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMainModule) {
  run();
}
