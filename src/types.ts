export type CategoryId = 'frontend' | 'backend' | 'fullstack';

export type TemplateId = 'react' | 'express' | 'fullstack';

/** 单个模板定义。 */
export interface TemplateDefinition {
  id: TemplateId;
  label: string;
  description: string;
  folder: TemplateId;
}

/** 模板分类定义。 */
export interface CategoryDefinition {
  id: CategoryId;
  label: string;
  templates: TemplateDefinition[];
}

/** 可选依赖定义（用于多选展示与默认勾选）。 */
export interface OptionalDependencyDefinition {
  name: string;
  version: string;
  defaultSelected: boolean;
}
