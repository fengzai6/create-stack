const { spawn } = require('node:child_process');
const path = require('node:path');

function normalizeForwardedArgs(rawArgs) {
  return rawArgs[0] === '--' ? rawArgs.slice(1) : rawArgs;
}

function run() {
  const projectRoot = path.resolve(__dirname, '..');
  const testCreateDir = path.join(projectRoot, 'test-create');
  const cliEntry = path.join(projectRoot, 'dist', 'src', 'cli.js');
  const forwardedArgs = normalizeForwardedArgs(process.argv.slice(2));

  const child = spawn(process.execPath, [cliEntry, ...forwardedArgs], {
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
}

if (require.main === module) {
  run();
}

module.exports = {
  normalizeForwardedArgs
};
