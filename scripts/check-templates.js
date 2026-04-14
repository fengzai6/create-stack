const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const TEMPLATE_ROOT = path.resolve(__dirname, '..', 'templates');
const YARN_COMMAND = process.platform === 'win32' ? 'yarn.cmd' : 'yarn';

function getTemplateDirs() {
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

function getCheckCommands() {
  const installArgs = process.env.CI ? ['install', '--frozen-lockfile'] : ['install'];

  return [installArgs, ['lint'], ['build']];
}

function resolveTemplateDirs(selectedTemplateDirs) {
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

function runTemplateCommand(templateDir, commandArgs) {
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

    for (const commandArgs of checkCommands) {
      console.log(`[run] yarn ${commandArgs.join(' ')}`);
      runTemplateCommand(templateDir, commandArgs);
    }
  }
}

if (require.main === module) {
  run();
}

module.exports = {
  getTemplateDirs,
  getCheckCommands,
  resolveTemplateDirs,
  runTemplateCommand
};
