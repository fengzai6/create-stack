# Create Stack Design

## Goal
初始化一个可发布到 npm 的 TypeScript CLI 包 `@fengzai/create-stack`，通过交互创建项目并从包内模板复制。

## Key Decisions
- 使用 `yarn`，非 monorepo。
- CLI 源码使用 TypeScript，发布后执行 `dist/cli.js`。
- 模板来源仅为包内 `templates/*`。
- 交互流程：输入项目名 -> 选分类 -> 选模板 -> 可选依赖多选（按模板） -> 是否立即安装依赖。
- 模板分类展示英文：`frontend` / `backend` / `fullstack`。
- 候选依赖使用硬编码映射，不做模板元数据文件。

## CLI Flow
1. 输入项目名并校验。
2. 选择分类。
3. 选择该分类下模板。
4. 若模板存在候选依赖，展示多选。
5. 询问是否执行 `yarn install`。
6. 复制模板并写入依赖。
7. 打印后续命令或直接安装。

## Packaging
- `package.json` 的 `bin` 直接指向 `dist/cli.js`。
- `files` 发布 `dist` + `templates` + `README.md`。
- `prepack` 中执行 `yarn build`。
