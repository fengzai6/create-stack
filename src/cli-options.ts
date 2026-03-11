export interface ParsedCliArgs {
  template?: string;
  help: boolean;
  overwrite: boolean;
  immediate?: boolean;
  interactive?: boolean;
  targetDir?: string;
}

/**
 * 解析命令行参数。
 * 支持：
 * - `-h` / `--help`
 * - `-t` / `--template <name>`
 * - `--overwrite`
 * - `-i` / `--immediate`
 * - `--interactive` / `--no-interactive`
 */
export function parseCliArgs(argv: string[]): ParsedCliArgs {
  const parsed: ParsedCliArgs = {
    help: false,
    overwrite: false
  };

  const positionals: string[] = [];
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token) {
      continue;
    }

    if (token === '-h' || token === '--help') {
      parsed.help = true;
      continue;
    }

    if (token === '--overwrite') {
      parsed.overwrite = true;
      continue;
    }

    if (token === '-i' || token === '--immediate') {
      parsed.immediate = true;
      continue;
    }

    if (token === '--interactive') {
      parsed.interactive = true;
      continue;
    }

    if (token === '--no-interactive') {
      parsed.interactive = false;
      continue;
    }

    if (token === '-t' || token === '--template') {
      const value = argv[index + 1];
      if (!value || value.startsWith('-')) {
        throw new Error(`${token} requires a value`);
      }
      parsed.template = value;
      index += 1;
      continue;
    }

    if (token.startsWith('-t') && token.length > 2) {
      parsed.template = token.slice(2);
      continue;
    }

    if (token.startsWith('--template=')) {
      parsed.template = token.slice('--template='.length);
      continue;
    }

    if (token.startsWith('-')) {
      throw new Error(`Unknown option: ${token}`);
    }

    positionals.push(token);
  }

  if (positionals.length > 0) {
    parsed.targetDir = formatTargetDir(positionals[0]);
  }

  return parsed;
}

/** 清理目标目录名称中的非法字符，并去掉末尾斜杠。 */
export function formatTargetDir(targetDir: string): string {
  return targetDir
    .trim()
    .replace(/[<>:"\\|?*]/g, '')
    .replace(/\/+$/g, '');
}

/** 当目录为空或仅包含 .git 时视为可用空目录。 */
export function isTrulyEmptyDirectory(entries: string[]): boolean {
  return entries.length === 0 || (entries.length === 1 && entries[0] === '.git');
}
