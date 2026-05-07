@AGENTS.md

## Fork context

This is a personal fork of [credal-ai/actions-sdk](https://github.com/Credal-ai/actions-sdk) maintained by matthewbetancourtBMX. Custom actions are added on top of the upstream codebase; try to keep additions isolated so upstream diffs stay clean.

## Custom actions in this fork

- **salesforce / cleanupEmailSyncNoise** _(in progress)_ — deletes or suppresses Activity/Task records created as noise artifacts by Salesforce email-sync integrations. See `docs/superpowers/specs/` for the design spec once written.

## Salesforce API notes

- All existing Salesforce actions use REST API v56.0 via `axiosClient` with `Authorization: Bearer <authToken>`.
- Auth params: `authToken` + `baseUrl` (e.g. `https://yourorg.my.salesforce.com`).
- Bulk deletes use the composite or bulk API endpoints — prefer the composite REST API (`/services/data/v56.0/composite/sobjects`) for batches up to 200 records to avoid governor limits.
- No Salesforce-specific SDK is installed; all calls go through `src/actions/util/axiosClient.ts`.

## Dependency notes

- `xlsx` is pinned to a SheetJS CDN tarball (`xlsx-0.20.3`) — do not change this entry.
- `papaparse` is available for CSV parsing if needed.
- Node ≥ 24 required; ESM throughout (use `.js` extensions on relative imports).
