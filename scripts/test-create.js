const { spawn } = require('node:child_process');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
const testCreateDir = path.join(projectRoot, 'test-create');
const cliEntry = path.join(projectRoot, 'dist', 'src', 'cli.js');

const child = spawn(process.execPath, [cliEntry], {
  cwd: testCreateDir,
  stdio: 'inherit'
});

child.on('exit', (code) => {
  process.exit(code ?? 1);
});

child.on('error', (error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
