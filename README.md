![Credal Logo](assets/credal-logo.svg)

## Credal.ai's Open Source Actions Framework

Easily add custom actions for your Credal Copilots. Read more about Credal's Agent platform [here](https://www.credal.ai/products/ai-agent-platform).

## Adding or updating actions

We strongly encourage you to develop actions that rely on oauth based credentials. This is to ensure we respect the permissions of the underlying systems the actions library interacts with. In some situations, oauth is not a valid option and so API keys are a good fallback.

1. Add or update the action in `src/actions/schema.yaml`
2. Run `npm run generate:types` to generate the new types
3. Run `npm run prettier-format` to format the new files
4. Create a new provider function in `src/actions/providers/<provider>/<action>.ts` (eg. `src/actions/providers/math/add.ts`) which exports a function using the generated types
5. If adding a new action or provider, update `src/actions/actionMapper.ts` and `src/actions/groups.ts`.
6. In `package.json` and `package-lock.json` (which must be updated in two places), bump the version number.
7. Run `npm publish --access public` to publish the new version to npm. (Need to be logged in via `npm login`)

## Usage

Invoking an action:

```ts
import { runAction } from "@credal/actions";

const result = await runAction(
  "listConversations",
  "slack",
  { authToken: "xoxb-..." },
  {}
);
```

## Running a basic test for `runAction`

```
npm run test tests/testRunMathAction.ts
```

## Secret Scanning (TruffleHog)

We run TruffleHog on every pull request that actually changes at least one file.

- Empty / metadata-only PRs are automatically skipped to avoid noisy false alarms.
- Any real change is scanned if a secret-like credential is detected the job fails fast (so we can fix it before merging).

The workflow lives at `.github/workflows/trufflehog.yml` and is intentionally minimal: skip empty PRs, scan everything else and fail on hits.
