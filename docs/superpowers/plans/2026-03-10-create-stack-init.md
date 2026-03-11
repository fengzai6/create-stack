# Create Stack Initialization Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 初始化 `@fengzai/create-stack` 的 TypeScript CLI 项目，支持模板交互选择与可选依赖安装。

**Architecture:** 将交互层与文件操作层分离。`cli.ts` 负责用户交互，`create.ts` 负责复制模板与写入依赖，`config.ts` 维护模板分类及候选依赖映射。

**Tech Stack:** Node.js, TypeScript, prompts, yarn

---

### Task 1: Scaffold base project files

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `README.md`

- [ ] **Step 1: Add package scripts and publish config**
- [ ] **Step 2: Add TypeScript compiler config**
- [ ] **Step 3: Add README usage documentation**

### Task 2: TDD for core logic

**Files:**
- Create: `tests/config.test.ts`
- Create: `tests/create.test.ts`
- Create/Modify: `src/config.ts`
- Create/Modify: `src/create.ts`

- [ ] **Step 1: Write failing tests for category/template lookup and dependency merge**
- [ ] **Step 2: Run tests and verify they fail**
- [ ] **Step 3: Implement minimal logic**
- [ ] **Step 4: Run tests and verify pass**

### Task 3: Build CLI and templates

**Files:**
- Create: `src/cli.ts`
- Create: `src/config.ts`
- Create: `src/create.ts`
- Create: `src/types.ts`
- Create: `templates/react/*`
- Create: `templates/express/*`
- Create: `templates/fullstack/*`

- [ ] **Step 1: Implement interactive prompt flow**
- [ ] **Step 2: Implement template copy + dependency install flow**
- [ ] **Step 3: Add starter templates and verify build output**

### Task 4: Verification

**Files:**
- Verify: build and tests

- [ ] **Step 1: Run `yarn build`**
- [ ] **Step 2: Run `yarn test`**
- [ ] **Step 3: Record results and remaining caveats**
