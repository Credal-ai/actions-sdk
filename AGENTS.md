# AGENTS.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

`@credal/actions` — an open-source TypeScript SDK that lets AI agents call actions across 30+ external services (Slack, Jira, Salesforce, Google Workspace, etc.) via a unified interface. Published to npm as an ESM library.

## Commands

```bash
npm run build              # tsc → dist/
npm run lint               # eslint 'src/**/*.{js,ts}'
npm run prettier-check     # check formatting
npm run prettier-format    # fix formatting
npm run generate:types     # regenerate autogen/ from schema.yaml
npm run jest-test          # run all jest tests
npx jest path/to/test      # run a single test file
```

CI runs lint, prettier-check, and build (no test step in CI).

## Architecture

### Code generation pipeline

`src/actions/schema.yaml` is the single source of truth for all actions. Running `npm run generate:types` parses it and produces two large generated files:

- `src/actions/autogen/types.ts` — Zod schemas, TypeScript types, and function signatures for every action
- `src/actions/autogen/templates.ts` — ActionTemplate metadata exports

**Never edit autogen/ files by hand.** Edit `schema.yaml` and regenerate.

### Action execution flow

```
runAction(name, provider, auth, params)     src/app.ts
  → invokeAction()                          src/actions/invoke.ts  (Zod validation)
    → ActionMapper[provider][name].fn()     src/actions/actionMapper.ts (registry)
      → provider implementation             src/actions/providers/<provider>/<action>.ts
```

### Adding an action

1. Define it in `src/actions/schema.yaml` (parameters, output, scopes, tags)
2. `npm run generate:types`
3. Implement in `src/actions/providers/<provider>/<action>.ts` — import generated types, export default an async function matching the generated function type
4. Register in `src/actions/actionMapper.ts` — import the function and wire it up with its schemas and action type (`read` or `write`)

### Key conventions

- **Type imports are enforced:** ESLint rule `@typescript-eslint/consistent-type-imports` requires `import type` for type-only imports
- **ESM throughout:** the project uses `"type": "module"`. Relative imports in source use `.js` extensions (resolved by TypeScript's bundler module resolution)
- **No `@/` paths in `src/index.ts`:** this breaks declaration file generation
- **autogen/ is ignored by ESLint** since it's generated code
- **Node >= 24** is required (see `engines` in package.json)
- Prettier: 120 char width, 2-space indent, trailing commas, no parens on single arrow params

### Shared utilities

- `src/actions/util/axiosClient.ts` — HTTP client with retry logic and custom `ApiError`
- `src/actions/providers/<provider>/utils/` — provider-specific helpers (e.g., Google OAuth token refresh)
