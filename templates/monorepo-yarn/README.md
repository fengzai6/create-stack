# monorepo-yarn

基于 Yarn Workspaces 的 monorepo 最小骨架。

## 结构

```text
.
├── apps/          # 应用（apps/*）
├── packages/      # 共享包（packages/*）
├── package.json
├── tsconfig.json  # 根 base tsconfig，供子包 extends
└── .yarnrc.yml
```

## 快速开始

```bash
yarn install
```

当前模板不内置示例 app/package。新增 workspace 后，根脚本会通过 `yarn workspaces foreach` 聚合执行。

### 新增 package 示例

```bash
mkdir -p packages/shared
```

`packages/shared/package.json`:

```json
{
  "name": "@repo/shared",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "clean": "rm -rf dist"
  }
}
```

`packages/shared/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"]
}
```

### 根脚本

| 命令 | 说明 |
| --- | --- |
| `yarn build` | 按拓扑顺序构建所有 workspace |
| `yarn dev` | 并行启动各 workspace 的 `dev` |
| `yarn lint` | 并行执行各 workspace 的 `lint` |
| `yarn clean` | 并行执行各 workspace 的 `clean` |
| `yarn format` | Prettier 格式化 |

## 说明

- `packageManager` 固定为 Yarn 4（Corepack）
- `.yarnrc.yml` 使用 `node-modules` linker，并启用 `npmMinimalAgeGate`
- 根 `tsconfig.json` 作为 base 配置；应用/包按需 `extends` 并补充 `jsx`、`lib`、`outDir` 等选项
