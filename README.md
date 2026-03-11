# create-fz-stack

一个基于 TypeScript 的 CLI，用于从内置模板快速创建项目。

## 安装

```bash
yarn global add create-fz-stack
```

## 使用

```bash
create-fz-stack
```

或直接一次性执行：

```bash
yarn create fz-stack
```

命令格式：

```bash
create-fz-stack [directory] [options]
```

参数说明：

- `-h, --help`：显示帮助信息
- `-t, --template <name>`：指定模板（当前支持 `react-tailwind`、`react-tailwind-antd`、`react-router-tailwind`、`react-router-tailwind-antd`）
- `--overwrite`：当目标目录非空时，删除原有文件后继续
- `-i, --immediate`：创建完成后立即安装依赖
- `--interactive`：强制开启交互模式
- `--no-interactive`：强制关闭交互模式

当前内置模板：

- `react-tailwind`
- `react-tailwind-antd`
- `react-router-tailwind`
- `react-router-tailwind-antd`

## 模板指南

如果你要新增或维护模板，按下面流程即可：

1. 在 `templates/` 下新增模板目录（例如 `templates/my-template`）。
2. 准备模板文件（如 `package.json`、`src/`、`index.html` 等）。
3. 在 [`src/config.ts`](/Users/nacho/Documents/GitHub/AMyGitHub/create-stack/src/config.ts) 的 `CATEGORY_CATALOG` 中注册模板：
   - `id`：CLI 识别用的模板标识（建议与目录名一致）
   - `label`：交互列表展示名
   - `description`：交互提示文案
   - `folder`：模板目录名
   - `color`：展示颜色
4. 如果模板支持“可选依赖多选”，在模板项里配置 `optionalDependencies`（可复用并 `omit` 公共依赖集合）。
5. 运行 `yarn test` 验证 CLI 与配置逻辑。

注意事项：

- 模板内 `package.json` 的 `name` 会在创建项目时自动替换为用户输入的项目名。
- 发布包时会排除 `templates/**/yarn.lock`，避免 lock 文件进入 npm 包。

交互流程：

1. 输入项目名（默认 `my-project`）
2. 选择分类（当前为 `frontend`）
3. 选择模板（支持 `← Back to category` 返回上一步）
4. 当模板配置了可选依赖时，进行多选
5. 默认勾选依赖：`antd`、`axios`、`zustand`（仅在对应模板中生效）
6. 可选依赖使用固定版本写入 `package.json`
7. 选择是否立刻安装依赖（自动识别包管理器，如 `npm` / `yarn` / `pnpm`）

当目标目录非空时，交互模式会提供以下选项：

- 取消操作
- 删除已有文件并继续
- 忽略已有文件并继续

## 本地开发

```bash
yarn install
yarn build
yarn test
yarn test-create
yarn test-create -h
yarn check-deps-updates
node dist/src/cli.js
```

## 依赖更新检查

执行以下命令可检查根项目与 `templates/*/package.json` 的依赖更新：

```bash
yarn check-deps-updates
```

脚本会检查以下位置：

- 根目录 `package.json`
- `templates/*/package.json`
- `src/config.ts` 中 `FRONTEND_OPTIONAL_DEPENDENCIES` 的 `version`

当检测到可更新依赖时，会先汇总展示，再一次性询问是否全部写回（`y/N`）。

## 发布检查清单

1. 更新 `package.json` 中的版本号
2. 执行 `yarn test`
3. 发布到 npm：

```bash
npm publish --access public
```
