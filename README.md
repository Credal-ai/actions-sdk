![Credal Logo](assets/credal-logo.svg)

## Credal.ai's Open Source Actions Framework

Easily add custom actions for your Credal Copilots. Read more about Credal's Agent platform [here](https://www.credal.ai/products/ai-agent-platform).

## Adding or updating actions

We strongly encourage you to develop actions that rely on oauth based credentials. This is to ensure we respect the permissions of the underlying systems the actions library interacts with. In some situations, oauth is not a valid option and so API keys are a good fallback.

1. Add or update the action in `src/actions/schema.yaml`
2. Run `npm run generate:types` to generate the new types
3. Run `npm run prettier-format` to format the new files
4. Create a new provider function in `src/actions/providers/<provider>/<action>.ts` (eg. `src/actions/providers/math/add.ts`) which exports a function using the generated types
5. If adding a new action or provider, update `src/actions/actionMapper.ts`.
6. In `package.json` and `package-lock.json` (which must be updated in two places), bump the version number.
7. Run `npm publish --access public` to publish the new version to npm. (Need to be logged in via `npm login`)


## Writing good action parameter descriptoins

When adding new actions to the SDK, follow these guidelines to ensure agents can use them effectively:

### 1. Write Parameter Descriptions from the Agent's Perspective

Parameter descriptions should be specific and unambiguous for an LLM agent that will be reading them to understand how to call the action.

- **Avoid pronouns like "it"** — explicitly name the entity (e.g., "the ticket", "the project", "the message")
- **Be specific about ownership/relationships** — say "the owner's username" instead of just "owner"
- **Include context about what the action does** — e.g., clarify that `sendDmFromBot` sends a message *on behalf of the Credal bot*

### 2. Specify Formatting Requirements for Content Inputs

For parameters that accept blob/rich content, explicitly state the expected format:
- "HTML-formatted content"
- "Markdown-formatted text"
- "Plain text only"

### 3. Use Consistent Parameter Names Within a Provider

For any given provider, use the exact same parameter name across all actions that reference the same concept. For example, if one action uses `projectId`, all other actions for that provider should also use `projectId` (not `project_id` or `projectID`). This enables our frontend to dedupe parameters when setting recommend-preset params.

### 4. Indicate When Parameters Must Be User-Provided

If a parameter value should come from the user rather than being inferred (e.g., sheet name in Google Sheets, channel name in Slack), say so explicitly in the description. Otherwise the LLM may hallucinate default values like `Sheet1`.


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
npm run test tests/math/testRunMathAction.ts
```
## Secret Scanning (TruffleHog)

We run TruffleHog on every pull request that actually changes at least one file.

- Empty / metadata-only PRs are automatically skipped to avoid noisy false alarms.
- Any real change is scanned if a secret-like credential is detected the job fails fast (so we can fix it before merging).

The workflow lives at `.github/workflows/trufflehog.yml` and is intentionally minimal: skip empty PRs, scan everything else and fail on hits.
