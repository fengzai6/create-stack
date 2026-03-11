#!/usr/bin/env node

import { access, readdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import prompts from 'prompts';

import {
  getCategories,
  getOptionalDependenciesForTemplate,
  getTemplatesByCategory
} from './config';
import { createProject, detectPackageManager, type PackageManager } from './create';
import type { CategoryId, OptionalDependencyDefinition, TemplateId } from './types';

const CANCELLED_MESSAGE = 'PROMPT_CANCELLED';
const BACK_TO_CATEGORY = '__back_to_category__' as const;
type TemplateSelectValue = TemplateId | typeof BACK_TO_CATEGORY;

/**
 * CLI 主流程：
 * 1) 采集用户输入
 * 2) 创建项目并安装依赖
 * 3) 输出下一步操作提示
 */
async function main(): Promise<void> {
  try {
    // 在流程开始时统一推断包管理器，后续创建与提示都复用同一结果。
    const packageManager = detectPackageManager();
    const projectName = await askProjectName();
    const templateId = await askTemplateWithCategoryBack();
    const optionalDependencies = getOptionalDependenciesForTemplate(templateId);
    const selectedDependencies = await askOptionalDependencies(optionalDependencies);
    const shouldInstallDependencies = await askInstallChoice(packageManager);

    const targetDir = await createProject({
      projectName,
      templateFolder: templateId,
      selectedDependencies,
      shouldInstallDependencies,
      packageManager
    });

    printSuccessMessage({
      projectName,
      targetDir,
      shouldInstallDependencies,
      packageManager
    });
  } catch (error) {
    // 用户主动取消属于正常中断，使用可读提示并返回非 0 退出码。
    if (error instanceof Error && error.message === CANCELLED_MESSAGE) {
      console.log('\nCancelled.');
      process.exit(1);
    }

    // 其余异常统一按失败处理，避免静默退出。
    const message = error instanceof Error ? error.message : String(error);
    console.error(`\nFailed to create project: ${message}`);
    process.exit(1);
  }
}

/** 询问项目名，并复用目录校验逻辑阻止覆盖非空目录。 */
async function askProjectName(): Promise<string> {
  const response = await prompts(
    {
      type: 'text',
      name: 'projectName',
      message: 'Project name',
      validate: validateProjectName
    },
    { onCancel: handleCancel }
  );

  return response.projectName as string;
}

/** 询问模板分类。 */
async function askCategory(): Promise<CategoryId> {
  const categories = getCategories();
  const response = await prompts(
    {
      type: 'select',
      name: 'categoryId',
      message: 'Select category',
      choices: categories.map((category) => ({
        title: category.id,
        value: category.id,
        description: category.label
      }))
    },
    { onCancel: handleCancel }
  );

  return response.categoryId as CategoryId;
}

/** 在选定分类后询问具体模板。 */
async function askTemplate(categoryId: CategoryId): Promise<TemplateSelectValue> {
  const templates = getTemplatesByCategory(categoryId);

  const response = await prompts(
    {
      type: 'select',
      name: 'templateId',
      message: 'Select template',
      choices: [
        ...templates.map((template) => ({
          title: template.id,
          value: template.id,
          description: template.description
        })),
        {
          title: '← Back to category',
          value: BACK_TO_CATEGORY,
          description: 'Choose category again'
        }
      ]
    },
    { onCancel: handleCancel }
  );

  return response.templateId as TemplateSelectValue;
}

/** 支持在模板选择步骤返回上一级分类选择。 */
async function askTemplateWithCategoryBack(): Promise<TemplateId> {
  while (true) {
    const categoryId = await askCategory();
    const templateSelection = await askTemplate(categoryId);
    if (templateSelection === BACK_TO_CATEGORY) {
      continue;
    }
    return templateSelection;
  }
}

/**
 * 询问可选依赖（支持多选）。
 * 若模板没有可选依赖，直接返回空数组并跳过该步骤。
 */
async function askOptionalDependencies(
  dependencies: OptionalDependencyDefinition[]
): Promise<string[]> {
  if (dependencies.length === 0) {
    return [];
  }

  const response = await prompts(
    {
      type: 'multiselect',
      name: 'selectedDependencies',
      message: 'Select optional dependencies',
      hint: '- Space to toggle. Enter to submit',
      choices: dependencies.map((dependency) => ({
        title: dependency.name,
        value: dependency.name,
        selected: dependency.defaultSelected
      }))
    },
    { onCancel: handleCancel }
  );

  return (response.selectedDependencies as string[]) ?? [];
}

/** 询问是否立即安装依赖。 */
async function askInstallChoice(packageManager: PackageManager): Promise<boolean> {
  const response = await prompts(
    {
      type: 'select',
      name: 'shouldInstallDependencies',
      message: `Install dependencies now with ${packageManager}?`,
      choices: [
        { title: 'Yes', value: true },
        { title: 'No', value: false }
      ],
      initial: 0
    },
    { onCancel: handleCancel }
  );

  return Boolean(response.shouldInstallDependencies);
}

/**
 * 校验项目名对应目录是否可用：
 * - 目录不存在：可用
 * - 目录存在但为空：可用
 * - 目录存在且非空：不可用
 */
async function validateProjectName(rawProjectName: string): Promise<true | string> {
  const projectName = rawProjectName.trim();
  if (!projectName) {
    return 'Project name is required';
  }

  const targetDir = path.resolve(process.cwd(), projectName);
  try {
    await access(targetDir);
  } catch {
    return true;
  }

  const entries = await readdir(targetDir);
  if (entries.length > 0) {
    return 'Target directory already exists and is not empty';
  }

  return true;
}

/** 将 prompts 的取消动作统一转换为可识别异常。 */
function handleCancel(): never {
  throw new Error(CANCELLED_MESSAGE);
}

/** 输出创建成功后的下一步操作提示。 */
function printSuccessMessage(input: {
  projectName: string;
  targetDir: string;
  shouldInstallDependencies: boolean;
  packageManager: PackageManager;
}): void {
  console.log('\nProject created successfully.');
  console.log(`Location: ${input.targetDir}`);

  console.log('\nNext steps:');
  console.log(`  cd ${input.projectName}`);
  if (!input.shouldInstallDependencies) {
    console.log(`  ${getInstallCommand(input.packageManager)}`);
  }
  console.log(`  ${getDevCommand(input.packageManager)}`);
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

void main();
