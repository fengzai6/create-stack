import type {
  CategoryDefinition,
  CategoryId,
  OptionalDependencyDefinition,
  TemplateDefinition,
  TemplateId
} from './types';

// 前端类模板可选依赖配置（含默认勾选策略）。
const FRONTEND_OPTIONAL_DEPENDENCIES: OptionalDependencyDefinition[] = [
  { name: 'antd', version: '^6.3.2', defaultSelected: true },
  { name: '@ant-design/icons', version: '^6.1.0', defaultSelected: false },
  { name: 'axios', version: '^1.13.6', defaultSelected: true },
  { name: 'ahooks', version: '^3.9.6', defaultSelected: false },
  { name: 'zustand', version: '^5.0.11', defaultSelected: true },
  { name: 'react-router', version: '^7.13.1', defaultSelected: false },
  { name: 'dayjs', version: '^1.11.19', defaultSelected: false },
  { name: 'es-toolkit', version: '^1.45.1', defaultSelected: false }
];

// 分类 -> 模板 的静态目录配置，CLI 根据此配置渲染交互选项。
const CATEGORY_CATALOG: CategoryDefinition[] = [
  {
    id: 'frontend',
    label: 'Frontend',
    templates: [
      {
        id: 'react',
        label: 'React',
        description: 'React app template',
        folder: 'react'
      }
    ]
  },
  {
    id: 'backend',
    label: 'Backend',
    templates: [
      {
        id: 'express',
        label: 'Express',
        description: 'Express API template',
        folder: 'express'
      }
    ]
  },
  {
    id: 'fullstack',
    label: 'Fullstack',
    templates: [
      {
        id: 'fullstack',
        label: 'Fullstack',
        description: 'Fullstack template',
        folder: 'fullstack'
      }
    ]
  }
];

// 模板 -> 可选依赖 的静态映射；没有可选依赖时使用空数组。
const TEMPLATE_OPTIONAL_DEPENDENCY_MAP: Record<TemplateId, OptionalDependencyDefinition[]> = {
  react: FRONTEND_OPTIONAL_DEPENDENCIES,
  express: [],
  fullstack: FRONTEND_OPTIONAL_DEPENDENCIES
};

const OPTIONAL_DEPENDENCY_VERSION_MAP: Record<string, string> = FRONTEND_OPTIONAL_DEPENDENCIES
  .reduce<Record<string, string>>((accumulator, dependency) => {
    accumulator[dependency.name] = dependency.version;
    return accumulator;
  }, {});

export const CATEGORY_IDS: CategoryId[] = ['frontend', 'backend', 'fullstack'];

/** 获取所有模板分类，用于第一步分类选择。 */
export function getCategories(): CategoryDefinition[] {
  return CATEGORY_CATALOG;
}

/** 根据分类获取该分类下模板列表。 */
export function getTemplatesByCategory(categoryId: CategoryId): TemplateDefinition[] {
  return CATEGORY_CATALOG.find((category) => category.id === categoryId)?.templates ?? [];
}

/** 根据模板获取可选依赖列表（含默认勾选信息）。 */
export function getOptionalDependenciesForTemplate(
  templateId: TemplateId
): OptionalDependencyDefinition[] {
  return TEMPLATE_OPTIONAL_DEPENDENCY_MAP[templateId] ?? [];
}

/** 根据依赖名获取固定版本号。 */
export function getOptionalDependencyVersion(dependencyName: string): string | undefined {
  return OPTIONAL_DEPENDENCY_VERSION_MAP[dependencyName];
}
