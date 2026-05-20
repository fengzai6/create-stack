export const DisplayColor = {
  GREEN: "green",
  RED: "red",
  YELLOW: "yellow",
  CYAN: "cyan",
  BLUE: "blue",
  MAGENTA: "magenta",
  DIM: "dim",
} as const;
export type DisplayColor = (typeof DisplayColor)[keyof typeof DisplayColor];

/** 可选依赖的配置项。 */
export interface OptionalDependencyConfig {
  version: string;
  defaultSelected: boolean;
  description?: string;
}

/** 可选依赖映射，key 为依赖名。 */
export type OptionalDependencyMap = Record<string, OptionalDependencyConfig>;

/** Docker 文件配置。 */
export interface DockerFilesConfig {
  /** Dockerfile 文件名，字符串表示通用，对象表示按包管理器区分。 */
  dockerfile: string | Record<'npm' | 'yarn' | 'pnpm', string>;
  /** 配置文件列表，显式指定源文件名和目标文件名。 */
  configs?: { src: string; dest: string }[];
}

/** 单个模板定义。 */
export interface TemplateDefinition {
  id: string;
  label: string;
  description: string;
  folder: string;
  color: DisplayColor;
  optionalDependencies?: OptionalDependencyMap;
  dockerFiles?: DockerFilesConfig;
}

/** 模板分类定义。 */
export interface CategoryDefinition {
  id: string;
  label: string;
  color: DisplayColor;
  templates: TemplateDefinition[];
}

/** 可选依赖定义（用于多选展示与默认勾选）。 */
export interface OptionalDependencyDefinition {
  name: string;
  version: string;
  defaultSelected: boolean;
  description?: string;
}
