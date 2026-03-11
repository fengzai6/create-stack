#!/usr/bin/env node

import { access, readdir, rm } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import * as clack from '@clack/prompts';

import {
  getCategories,
  getOptionalDependenciesForTemplate,
  getTemplatesByCategory
} from './config';
import {
  createProject,
  detectPackageManager,
  type PackageManager
} from './create';
import { formatTargetDir, isTrulyEmptyDirectory, parseCliArgs } from './cli-options';
import type {
  DisplayColor,
  OptionalDependencyDefinition,
  TemplateDefinition,
} from './types';

const CANCELLED_MESSAGE = 'PROMPT_CANCELLED';
const BACK_TO_CATEGORY = '__back_to_category__' as const;
const DEFAULT_TARGET_DIR = 'my-project';

type TemplateSelectValue = string | typeof BACK_TO_CATEGORY;
type DirectoryStrategy = 'empty' | 'overwrite' | 'ignore';

/**
 * CLI 主流程：
 * 1) 解析参数
 * 2) 处理交互/非交互输入
 * 3) 处理目录冲突策略
 * 4) 创建项目并按需安装依赖
 */
async function main(): Promise<void> {
  try {
    const args = parseCliArgs(process.argv.slice(2));
    if (args.help) {
      console.log(getHelpMessage());
      return;
    }

    const interactive = args.interactive ?? process.stdin.isTTY;
    if (interactive) {
      clack.intro(colorize('cyan', 'create-fz-stack'));
    }

    const packageManager = detectPackageManager();

    const projectName = await resolveProjectName(args.targetDir, interactive);
    const directoryStrategy = await resolveDirectoryStrategy(
      projectName,
      args.overwrite,
      interactive
    );

    const templateId = await resolveTemplate(args.template, interactive);
    const optionalDependencies = getOptionalDependenciesForTemplate(templateId);
    const selectedDependencies = interactive
      ? await askOptionalDependencies(optionalDependencies)
      : optionalDependencies
          .filter((dependency) => dependency.defaultSelected)
          .map((dependency) => dependency.name);

    const shouldInstallDependencies =
      args.immediate ?? (interactive ? await askInstallChoice(packageManager) : false);

    logStep(`Scaffolding with template: ${templateId}`);
    const targetDir = await createProject({
      projectName,
      templateFolder: templateId,
      selectedDependencies,
      shouldInstallDependencies,
      allowNonEmptyTarget: directoryStrategy === 'ignore',
      packageManager
    });

    printSuccessMessage({
      projectName,
      targetDir,
      shouldInstallDependencies,
      packageManager
    });
  } catch (error) {
    if (error instanceof Error && error.message === CANCELLED_MESSAGE) {
      process.exit(1);
    }

    const message = error instanceof Error ? error.message : String(error);
    clack.log.error(`Failed to create project: ${message}`);
    process.exit(1);
  }
}

/**
 * 解析项目目录：
 * - 命令行传入则直接使用
 * - 交互模式下询问
 * - 非交互模式下使用默认目录
 */
async function resolveProjectName(
  argTargetDir: string | undefined,
  interactive: boolean
): Promise<string> {
  if (argTargetDir !== undefined) {
    if (argTargetDir.length === 0) {
      throw new Error('Invalid target directory');
    }
    return argTargetDir;
  }

  if (!interactive) {
    return DEFAULT_TARGET_DIR;
  }

  const result = await clack.text({
    message: 'Project name',
    defaultValue: DEFAULT_TARGET_DIR,
    placeholder: DEFAULT_TARGET_DIR,
    validate: (rawProjectName) => {
      // 直接回车时允许使用默认项目名。
      if (!rawProjectName || rawProjectName.trim().length === 0) {
        return undefined;
      }
      const projectName = formatTargetDir(rawProjectName ?? '');
      return projectName ? undefined : 'Invalid project name';
    }
  });

  const projectName = ensureNotCancel(result);
  const normalizedProjectName = formatTargetDir(projectName || DEFAULT_TARGET_DIR);
  if (!normalizedProjectName) {
    throw new Error('Invalid project name');
  }

  return normalizedProjectName;
}

/**
 * 处理目标目录冲突：
 * - 空目录：直接继续
 * - --overwrite：清空后继续
 * - 交互模式：提示三选项（取消/清空/忽略）
 * - 非交互模式：默认取消并提示使用 --overwrite
 */
async function resolveDirectoryStrategy(
  targetDir: string,
  overwriteByArg: boolean,
  interactive: boolean
): Promise<DirectoryStrategy> {
  const entries = await readTargetDirEntries(targetDir);
  if (!entries || isTrulyEmptyDirectory(entries)) {
    return 'empty';
  }

  if (overwriteByArg) {
    await emptyDir(targetDir);
    logStep(`Removed existing files in ${targetDir}`);
    return 'overwrite';
  }

  if (!interactive) {
    throw new Error(`Target directory "${targetDir}" is not empty. Use --overwrite to continue.`);
  }

  const result = await clack.select({
    message:
      (targetDir === '.' ? 'Current directory' : `Target directory "${targetDir}"`) +
      ' is not empty. How do you want to proceed?',
    options: [
      { label: 'Cancel operation', value: 'no' },
      { label: 'Remove existing files and continue', value: 'yes' },
      { label: 'Ignore existing files and continue', value: 'ignore' }
    ],
    initialValue: 'no'
  });

  const overwriteMode = ensureNotCancel(result) as 'no' | 'yes' | 'ignore';
  if (overwriteMode === 'no') {
    cancelOperation();
  }

  if (overwriteMode === 'yes') {
    await emptyDir(targetDir);
    logStep(`Removed existing files in ${targetDir}`);
    return 'overwrite';
  }

  return 'ignore';
}

/** 读取目录项；目录不存在时返回 null。 */
async function readTargetDirEntries(targetDir: string): Promise<string[] | null> {
  try {
    await access(targetDir);
  } catch {
    return null;
  }

  return readdir(targetDir);
}

/** 清空目录（保留 .git）。 */
async function emptyDir(targetDir: string): Promise<void> {
  const entries = await readdir(targetDir);
  for (const entry of entries) {
    if (entry === '.git') {
      continue;
    }
    await rm(path.resolve(targetDir, entry), { recursive: true, force: true });
  }
}

/**
 * 解析模板：
 * - 传了合法 --template 就直接用
 * - 传了非法模板：交互模式回退到选择；非交互直接报错
 * - 未传模板：交互选择；非交互默认 react
 */
async function resolveTemplate(
  argTemplate: string | undefined,
  interactive: boolean
): Promise<string> {
  const templates = getAllTemplates();
  if (templates.length === 0) {
    throw new Error('No templates configured');
  }
  const templateIds = templates.map((template) => template.id);

  if (argTemplate) {
    if (templateIds.includes(argTemplate)) {
      return argTemplate;
    }

    if (!interactive) {
      throw new Error(`Invalid template: ${argTemplate}. Available: ${templateIds.join(', ')}`);
    }

    logWarn(`"${argTemplate}" is not a valid template. Please choose from list.`);
  }

  if (!interactive) {
    return templates[0].id;
  }

  return askTemplateWithCategoryBack();
}

/** 获取全部可用模板定义（用于参数校验与 help 文案）。 */
function getAllTemplates(): TemplateDefinition[] {
  const templates = getCategories().flatMap((category) => category.templates);
  const seen = new Set<string>();
  const uniqueTemplates: TemplateDefinition[] = [];

  for (const template of templates) {
    if (seen.has(template.id)) {
      continue;
    }
    seen.add(template.id);
    uniqueTemplates.push(template);
  }

  return uniqueTemplates;
}

/** 询问模板分类（仅展示 label，无 description）。 */
async function askCategory(): Promise<string> {
  const categories = getCategories();
  const result = await clack.select({
    message: 'Select category',
    options: categories.map((category) => ({
      label: colorize(category.color, category.label),
      value: category.id
    }))
  });

  return ensureNotCancel(result) as string;
}

/** 在选定分类后询问具体模板。 */
async function askTemplate(categoryId: string): Promise<TemplateSelectValue> {
  const templates = getTemplatesByCategory(categoryId);

  const result = await clack.select({
    message: 'Select template',
    options: [
      ...templates.map((template) => ({
        label: colorize(template.color, template.label),
        value: template.id,
        hint: template.description
      })),
      {
        label: '← Back to category',
        value: BACK_TO_CATEGORY,
        hint: 'Choose category again'
      }
    ]
  });

  return ensureNotCancel(result) as TemplateSelectValue;
}

/** 支持在模板选择步骤返回上一级分类选择。 */
async function askTemplateWithCategoryBack(): Promise<string> {
  while (true) {
    const categoryId = await askCategory();
    const templateSelection = await askTemplate(categoryId);
    if (templateSelection === BACK_TO_CATEGORY) {
      continue;
    }
    return templateSelection;
  }
}

/** 询问可选依赖（支持多选）。无可选依赖则跳过。 */
async function askOptionalDependencies(
  dependencies: OptionalDependencyDefinition[]
): Promise<string[]> {
  if (dependencies.length === 0) {
    return [];
  }

  const result = await clack.multiselect({
    message: 'Select optional dependencies (Space to toggle, Enter to submit)',
    options: dependencies.map((dependency) => ({
      label: `${dependency.name} (${dependency.version})`,
      value: dependency.name,
      hint: dependency.defaultSelected ? 'default selected' : undefined
    })),
    initialValues: dependencies
      .filter((dependency) => dependency.defaultSelected)
      .map((dependency) => dependency.name),
    required: false
  });

  return ensureNotCancel(result) as string[];
}

/** 询问是否立即安装依赖。 */
async function askInstallChoice(packageManager: PackageManager): Promise<boolean> {
  const result = await clack.confirm({
    message: `Install dependencies now with ${packageManager}?`,
    initialValue: false
  });

  return ensureNotCancel(result) as boolean;
}

/** 将 prompts 取消动作统一转换为可识别异常。 */
function cancelOperation(): never {
  clack.cancel('Operation cancelled.');
  throw new Error(CANCELLED_MESSAGE);
}

/** 统一处理 clack 的取消返回值。 */
function ensureNotCancel<T>(result: T | symbol): T {
  if (clack.isCancel(result)) {
    cancelOperation();
  }

  return result as T;
}

/** 输出创建成功后的下一步操作提示。 */
function printSuccessMessage(input: {
  projectName: string;
  targetDir: string;
  shouldInstallDependencies: boolean;
  packageManager: PackageManager;
}): void {
  const lines: string[] = [];
  lines.push(`Location: ${input.targetDir}`);
  lines.push('');
  lines.push('Next steps:');
  lines.push(`  cd ${input.projectName}`);
  if (!input.shouldInstallDependencies) {
    lines.push(`  ${getInstallCommand(input.packageManager)}`);
  }
  lines.push(`  ${getDevCommand(input.packageManager)}`);

  clack.outro(lines.join('\n'));
}

/** 根据包管理器返回安装依赖命令。 */
function getInstallCommand(packageManager: PackageManager): string {
  if (packageManager === 'npm') {
    return 'npm install';
  }

  return `${packageManager} install`;
}

/** 根据包管理器返回启动开发服务命令。 */
function getDevCommand(packageManager: PackageManager): string {
  if (packageManager === 'npm') {
    return 'npm run dev';
  }

  return `${packageManager} dev`;
}

/** 构造 help 文案。 */
function getHelpMessage(): string {
  const templates = getAllTemplates()
    .map((template) => `  - ${colorize(template.color, template.id)}`)
    .join('\n');

  return [
    'Usage: create-fz-stack [OPTION]... [DIRECTORY]',
    '',
    'Options:',
    '  -h, --help                     show this help message',
    '  -t, --template <name>          use a specific template',
    '  --overwrite                    remove existing files if target directory is not empty',
    '  -i, --immediate                install dependencies immediately',
    '  --interactive                  force interactive mode',
    '  --no-interactive               force non-interactive mode',
    '',
    'Available templates:',
    templates
  ].join('\n');
}

/** 打印步骤日志。 */
function logStep(message: string): void {
  clack.log.step(message);
}

/** 打印警告日志。 */
function logWarn(message: string): void {
  clack.log.warn(message);
}

/** 终端彩色输出（非 TTY 时自动降级为纯文本）。 */
function colorize(color: DisplayColor, text: string): string {
  if (!process.stdout.isTTY) {
    return text;
  }

  const ansiCodeMap: Record<DisplayColor, number> = {
    green: 32,
    red: 31,
    yellow: 33,
    cyan: 36,
    blue: 34,
    magenta: 35,
    dim: 2
  };

  return `\u001b[${ansiCodeMap[color]}m${text}\u001b[0m`;
}

void main();
