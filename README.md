# @fengzai/create-stack

A TypeScript CLI for bootstrapping projects from built-in templates.

## Install

```bash
yarn global add @fengzai/create-stack
```

## Usage

```bash
create-stack
```

Interactive flow:

1. Input project name
2. Select category (`frontend`, `backend`, `fullstack`)
3. Select template (supports `← Back to category`)
4. Multi-select optional dependencies when available
5. Default selected: `antd`, `axios`, `zustand` (for configured templates)
6. Optional dependencies are written with pinned versions
7. Choose `Yes` / `No` for immediate install with detected package manager (`npm` / `yarn` / `pnpm`)

## Local Development

```bash
yarn install
yarn build
yarn test
yarn test-create
node dist/src/cli.js
```

## Publish Checklist

1. Update version in `package.json`
2. Run `yarn test`
3. Publish to npm:

```bash
npm publish --access public
```
