import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { access, cp, mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

import { getOptionalDependencyVersion } from './config';

export interface CreateProjectOptions {
  projectName: string;
  templateFolder: string;
  selectedDependencies: string[];
  shouldInstallDependencies: boolean;
  packageManager?: PackageManager;
}

export type PackageManager = 'npm' | 'yarn' | 'pnpm';

export interface InstallStep {
  command: PackageManager;
  args: string[];
}

/**
 * 检测当前执行上下文的包管理器。
 * 优先级：
 * 1) npm_config_user_agent
 * 2) npm_execpath
 * 3) 默认 npm
 */
export function detectPackageManager(
  userAgent = process.env.npm_config_user_agent,
  execPath = process.env.npm_execpath
): PackageManager {
  const normalizedUserAgent = userAgent?.toLowerCase() ?? '';
  // 优先解析 user agent，命中率最高。
  if (normalizedUserAgent.startsWith('pnpm/')) {
    return 'pnpm';
  }
  if (normalizedUserAgent.startsWith('yarn/')) {
    return 'yarn';
  }
  if (normalizedUserAgent.startsWith('npm/')) {
    return 'npm';
  }

  const normalizedExecPath = execPath?.toLowerCase() ?? '';
  // user agent 不可用时，回退到执行路径关键词判断。
  if (normalizedExecPath.includes('pnpm')) {
    return 'pnpm';
  }
  if (normalizedExecPath.includes('yarn')) {
    return 'yarn';
  }
  if (normalizedExecPath.includes('npm')) {
    return 'npm';
  }

  return 'npm';
}

/**
 * 将用户多选依赖写入 package.json，并使用固定版本号。
 */
export function applySelectedDependencies(
  packageJsonContent: string,
  selectedDependencies: string[]
): string {
  const pkg = JSON.parse(packageJsonContent) as {
    dependencies?: Record<string, string>;
  };

  if (!pkg.dependencies) {
    pkg.dependencies = {};
  }

  const uniqueDependencies = Array.from(new Set(selectedDependencies));
  for (const dependencyName of uniqueDependencies) {
    if (pkg.dependencies[dependencyName]) {
      continue;
    }

    const pinnedVersion = getOptionalDependencyVersion(dependencyName);
    if (!pinnedVersion) {
      throw new Error(`No pinned version configured for optional dependency: ${dependencyName}`);
    }

    pkg.dependencies[dependencyName] = pinnedVersion;
  }

  return `${JSON.stringify(pkg, null, 2)}\n`;
}

/**
 * 生成安装步骤：
 * - 选择“立即安装”时执行 install
 * - 选择“稍后安装”时不执行任何安装命令
 */
export function buildInstallPlan(
  packageManager: PackageManager,
  shouldInstallDependencies: boolean
): InstallStep[] {
  if (!shouldInstallDependencies) {
    return [];
  }

  return [{ command: packageManager, args: ['install'] }];
}

/** 创建项目：复制模板 -> 生成安装计划 -> 顺序执行安装命令。 */
export async function createProject(options: CreateProjectOptions): Promise<string> {
  const targetDir = path.resolve(process.cwd(), options.projectName);
  await ensureTargetDirectory(targetDir);

  const templateDir = resolveTemplatePath(options.templateFolder);
  await cp(templateDir, targetDir, { recursive: true });

  if (options.selectedDependencies.length > 0) {
    await patchPackageJson(targetDir, options.selectedDependencies);
  }

  const packageManager = options.packageManager ?? detectPackageManager();
  const installPlan = buildInstallPlan(packageManager, options.shouldInstallDependencies);
  // 顺序执行安装步骤，保证行为可预期。
  for (const step of installPlan) {
    await runCommand(step.command, step.args, targetDir);
  }

  return targetDir;
}

/**
 * 确保目标目录可安全写入：
 * - 不存在则创建
 * - 已存在但非目录或非空目录则拒绝
 */
async function ensureTargetDirectory(targetDir: string): Promise<void> {
  try {
    await access(targetDir);
  } catch {
    await mkdir(targetDir, { recursive: true });
    return;
  }

  const targetStats = await stat(targetDir);
  if (!targetStats.isDirectory()) {
    throw new Error(`Target path is not a directory: ${targetDir}`);
  }

  const files = await readdir(targetDir);
  if (files.length > 0) {
    throw new Error(`Target directory is not empty: ${targetDir}`);
  }
}

/**
 * 解析模板目录：
 * - 运行编译产物时优先 dist 相对路径
 * - 开发态时回退到源码相对路径
 */
function resolveTemplatePath(templateFolder: string): string {
  const runtimeTemplatePath = path.resolve(__dirname, '../../templates', templateFolder);
  const sourceTemplatePath = path.resolve(__dirname, '../templates', templateFolder);

  return existsSync(runtimeTemplatePath) ? runtimeTemplatePath : sourceTemplatePath;
}

/** 将可选依赖按固定版本写入目标项目 package.json。 */
async function patchPackageJson(targetDir: string, selectedDependencies: string[]): Promise<void> {
  const packageJsonPath = path.join(targetDir, 'package.json');
  const packageJsonContent = await readFile(packageJsonPath, 'utf8');
  const patchedContent = applySelectedDependencies(packageJsonContent, selectedDependencies);
  await writeFile(packageJsonPath, patchedContent, 'utf8');
}

/** 执行子进程命令并透传 stdio，失败时返回可读错误。 */
function runCommand(command: string, args: string[], cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: 'inherit',
      shell: process.platform === 'win32'
    });

    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`Command failed: ${command} ${args.join(' ')}`));
    });
  });
}
