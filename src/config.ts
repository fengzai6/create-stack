import {
  DisplayColor,
  type CategoryDefinition,
  type OptionalDependencyDefinition,
  type OptionalDependencyMap,
  type TemplateDefinition,
} from "./types";
import { omit } from "./utils";

// 前端类模板可选依赖配置（含默认勾选策略），以依赖名为 key 便于按模板裁剪。
const FRONTEND_OPTIONAL_DEPENDENCIES = {
  axios: {
    version: "^1.14.0",
    defaultSelected: true,
    description: "基于 Promise 的 HTTP 请求库",
  },
  ahooks: {
    version: "^3.9.7",
    defaultSelected: true,
    description: "生产级 React Hooks 工具库",
  },
  zustand: {
    version: "^5.0.12",
    defaultSelected: true,
    description: "轻量级状态管理",
  },
  dayjs: {
    version: "^1.11.20",
    defaultSelected: true,
    description: "轻量日期时间处理库",
  },
  "es-toolkit": {
    version: "^1.45.1",
    defaultSelected: true,
    description: "现代 JavaScript 工具函数库",
  },
  antd: {
    version: "^6.3.5",
    defaultSelected: false,
    description: "Ant Design 组件库",
  },
  "@ant-design/icons": {
    version: "^6.1.1",
    defaultSelected: false,
    description: "Ant Design 图标库",
  },
  "react-router": {
    version: "^7.13.2",
    defaultSelected: false,
    description: "React 声明式路由",
  },
  "@chenglou/pretext": {
    version: "^0.0.3",
    defaultSelected: false,
    description: "文本预处理库",
  },
} satisfies OptionalDependencyMap;

// 分类 -> 模板 的静态目录配置，CLI 根据此配置渲染交互选项。
const CATEGORY_CATALOG: CategoryDefinition[] = [
  {
    id: "frontend",
    label: "Frontend",
    color: DisplayColor.CYAN,
    templates: [
      {
        id: "react-router-tailwind-antd",
        label: "React Router + Tailwind + Antd",
        description: "React Router + Tailwind + Antd starter",
        folder: "react-router-tailwind-antd",
        color: DisplayColor.YELLOW,
        optionalDependencies: omit(FRONTEND_OPTIONAL_DEPENDENCIES, [
          "antd",
          "@ant-design/icons",
          "react-router",
        ] as const),
      },
      {
        id: "react-router-tailwind",
        label: "React Router + Tailwind",
        description: "React Router + Tailwind starter",
        folder: "react-router-tailwind",
        color: DisplayColor.YELLOW,
        optionalDependencies: omit(FRONTEND_OPTIONAL_DEPENDENCIES, [
          "react-router",
        ] as const),
      },
      {
        id: "react-tailwind-antd",
        label: "React + Tailwind + Antd",
        description: "React + Tailwind + Antd starter",
        folder: "react-tailwind-antd",
        color: DisplayColor.BLUE,
        optionalDependencies: omit(FRONTEND_OPTIONAL_DEPENDENCIES, [
          "antd",
          "@ant-design/icons",
        ] as const),
      },
      {
        id: "react-tailwind",
        label: "React + Tailwind",
        description: "React + Tailwind starter",
        folder: "react-tailwind",
        color: DisplayColor.BLUE,
        optionalDependencies: FRONTEND_OPTIONAL_DEPENDENCIES,
      },
    ],
  },
];

const OPTIONAL_DEPENDENCY_VERSION_MAP: Record<string, string> =
  CATEGORY_CATALOG.flatMap((category) => category.templates).reduce<
    Record<string, string>
  >((accumulator, template) => {
    const optionalDependencies = template.optionalDependencies ?? {};
    for (const [name, dependencyConfig] of Object.entries(
      optionalDependencies
    )) {
      accumulator[name] = dependencyConfig.version;
    }
    return accumulator;
  }, {});

/** 获取所有模板分类，用于第一步分类选择。 */
export function getCategories(): CategoryDefinition[] {
  return CATEGORY_CATALOG;
}

/** 根据分类获取该分类下模板列表。 */
export function getTemplatesByCategory(
  categoryId: string
): TemplateDefinition[] {
  return (
    CATEGORY_CATALOG.find((category) => category.id === categoryId)
      ?.templates ?? []
  );
}

/** 根据模板获取可选依赖列表（含默认勾选信息）。 */
export function getOptionalDependenciesForTemplate(
  templateId: string
): OptionalDependencyDefinition[] {
  const template = CATEGORY_CATALOG.flatMap(
    (category) => category.templates
  ).find((candidate) => candidate.id === templateId);
  if (!template?.optionalDependencies) {
    return [];
  }

  return Object.entries(template.optionalDependencies).map(
    ([name, dependencyConfig]) => ({
      name,
      version: dependencyConfig.version,
      defaultSelected: dependencyConfig.defaultSelected,
      description: dependencyConfig.description,
    })
  );
}

/** 根据依赖名获取固定版本号。 */
export function getOptionalDependencyVersion(
  dependencyName: string
): string | undefined {
  return OPTIONAL_DEPENDENCY_VERSION_MAP[dependencyName];
}
