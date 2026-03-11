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
}

/** 可选依赖映射，key 为依赖名。 */
export type OptionalDependencyMap = Record<string, OptionalDependencyConfig>;

/** 单个模板定义。 */
export interface TemplateDefinition {
  id: string;
  label: string;
  description: string;
  folder: string;
  color: DisplayColor;
  optionalDependencies?: OptionalDependencyMap;
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
}
