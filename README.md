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
node dist/src/cli.js
```

## 发布检查清单

1. 更新 `package.json` 中的版本号
2. 执行 `yarn test`
3. 发布到 npm：

```bash
npm publish --access public
```
