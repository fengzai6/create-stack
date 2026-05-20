# Agents 指南

## 发布前检查

当用户要求进行发布前检查时，按以下流程执行：

### 1. 运行测试、TypeScript 编译

```bash
npm test
```

确保所有测试通过、无类型错误。

### 2. 检查模板构建

```bash
npm run check-templates
```

确保所有模板能正常安装、lint 和 build。

### 3. 检查版本号

```bash
npm view create-fz-stack version
```

对比当前 `package.json` 中的版本号与 npm 最新版本，确认是否需要更新（遵循 semver 规范）。

### 4. 打包与文件检查

```bash
# 运行构建
npm run build

# 检查构建产物目录
ls -la dist/

# 查看实际会发布的文件和包大小
npm pack --dry-run
```

确保构建产物是最新的，发布文件列表正确没有遗漏或者多余，包大小合理。

### 5. 确认发布

向用户汇报检查结果，确认是否执行 `npm publish`。
