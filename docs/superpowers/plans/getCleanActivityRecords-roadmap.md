# getCleanActivityRecords — Feature Roadmap

**Action:** `salesforce / getCleanActivityRecords`
**Purpose:** A cleaning layer over Salesforce activity data. The caller provides a SOQL WHERE clause; the action fetches, cleans (HTML stripping, quoted-reply truncation, signature removal), deduplicates into threads, and returns compact LLM-ready output — significantly reducing token usage compared to raw `getSalesforceRecordsByQuery` results.

---

## Architecture

### Object types

| Object | Created by | Key relationship fields | Notes |
|---|---|---|---|
| `Task` (TaskSubtype=Email, Status=Completed) | Groove email sync | `WhoId` (Contact/Lead), `WhatId` (Opportunity/Account/Case) | Auto-filtered in code — no need to include TaskSubtype/Status in WHERE |
| `EmailMessage` | Salesforce native Gmail/Outlook connector; Email to Case | `RelatedToId` (Opp/Account), `ParentId` (**Case ID only** — null for Enhanced Email / inbox sync) | `ParentId` is Case-only per Salesforce docs. "RelatedToId and ParentId should have the same value when ParentId is set." |

### Threading keys (EmailMessage)

| Source | Thread grouping key | Notes |
|---|---|---|
| Email to Case | `ParentId` (Case ID) | `ThreadIdentifier` is explicitly **not used** by On-Demand Email-to-Case (Salesforce docs) |
| Enhanced Email (Gmail/Outlook connector) | `ThreadIdentifier` | Set by Salesforce native inbox sync |
| Orphan / unknown | `Id` (single-message fallback) | Neither field populated |

### Design principles

1. **No hardcoded vendor fields** — custom fields (e.g. Groove's `DaScoopComposer` namespace) are exposed via customer-configurable parameters following the `taskDateTimeTieBreakerField` pattern.
2. **WHERE clause is caller-owned** — SELECT fields are fixed; FROM is Task or EmailMessage only. Caller writes any valid SOQL WHERE clause.
3. **Two-pass deduplication** — when both Groove and Salesforce native connector are active on the same mailbox, run EmailMessage first with `returnActivityIds=true`, then Task with `excludeActivityIds` to avoid surfacing the same email twice.
4. **SOQL injection guards** — `SOQL_INJECTION_PATTERN`, `hasBalancedParentheses`, `formatActivityWhereClause` validate and wrap WHERE clauses before interpolation to prevent injection and Salesforce API errors from operator precedence issues.
5. **Thread markers preserved in subject** — `normalizeSubject` does not strip `[ thread::Xxxx:: ]` tokens that some orgs (e.g. Groove) embed in the Subject line for case threading. These tokens are org-level artifacts, not noise: some orgs place the case thread identifier in the subject rather than the body, and stripping them would silently discard org-meaningful metadata. LLM consumers can handle them as-is.

### Key files

| File | Purpose |
|---|---|
| `src/actions/providers/salesforce/getCleanActivityRecords.ts` | Main implementation |
| `src/actions/schema.yaml` | Source of truth — edit here, then `npm run generate:types` |
| `src/actions/autogen/types.ts` | Generated — do not edit by hand |
| `src/actions/autogen/templates.ts` | Generated — do not edit by hand |
| `src/actions/providers/salesforce/getCleanActivityRecords.test.ts` | Jest unit tests (45 tests) |
| `tests/salesforce/testGetCleanActivityRecords.ts` | Integration test — two-pass dedup smoke test |
| `tests/salesforce/testBuildingEmailMessages.ts` | Integration test — Email-to-Case thread grouping |
| `tests/salesforce/utils.ts` | JWT auth helper for integration tests |

### Auth pattern

All Salesforce actions use `authToken` + `baseUrl` via `axiosClient`. Integration tests use the JWT flow from `tests/salesforce/utils.ts` (`authenticateWithJWT()` → `{ accessToken, instanceUrl }` → map to `{ authToken, baseUrl }`). Requires env vars: `SALESFORCE_PRIVATE_KEY_BASE64`, `SALESFORCE_CONSUMER_KEY`, `SALESFORCE_USERNAME`.

---

## Status

### Completed

| Item | Commit | Notes |
|---|---|---|
| Core action — Task + EmailMessage query, thread grouping, body cleaning | `8e4ced7` | Initial implementation |
| `taskDateTimeTieBreakerField` — customer-configurable DateTime field for same-day Task ordering | `e3bafae` | Pattern for all future custom field params |
| `queryAll` semantics + `IsDeleted = false` filter | `b461680` | Surfaces archived records; required for historical analysis |
| EmailMessageRelation people resolution (Contact + Lead fallback) | `b461680` | Enriches thread output with participant metadata |
| Bounced-thread semantics — any message in thread marks thread bounced | `ec2e3ec` | Fixed O(n²) loop; IsBounced is thread-level, not message-level |
| Security hardening — SOQL injection guard, balanced-parens check, field name validation | `5fc035c` | `SOQL_INJECTION_PATTERN`, `TASK_FIELD_API_NAME_PATTERN` |
| Compound semi-join wrapping — prevents OR-precedence bypass | `2d52f9c` | `formatActivityWhereClause` wraps compound clauses; leaves bare lone semi-joins unwrapped (Salesforce rejects outer parens there) |
| `cleanBody` — strip `> On ... wrote:` quoted replies (Groove/DealHub style) | `266adc6` | Regex updated: `(?:>\s*)?` prefix handles `> On...wrote:` format |
| `excludeActivityIds` — Task query excludes EmailMessage-linked Task IDs | part of core | Enables two-pass dedup |
| `returnActivityIds` — collect all ActivityIds for EmailMessage WHERE clause | part of core | Paginates up to `MAX_ACTIVITY_ID_PAGES` to avoid governor limits |
| `ParentId` on EmailMessage thread output | `48d8a50` | Case ID for Email-to-Case; null for Enhanced Email (ParentId is Case-only per docs) |
| Email-to-Case thread grouping by `ParentId` | `cfa7def` | `ThreadIdentifier` is not used by On-Demand Email-to-Case; fixed grouping key: `ParentId ?? ThreadIdentifier ?? Id` |
| Draft filter (`AND Status != '5'`) | `cfa7def` | Excludes Draft EmailMessages from results |
| Additional EmailMessage fields in output | `cfa7def` | `Status`, `HasAttachment`, `FromName`, `ReplyToEmailMessageId` added to SELECT and thread output |
| Integration tests added; auth migrated to JWT | `2820d58` | `testGetCleanActivityRecords.ts` (two-pass dedup) and `testBuildingEmailMessages.ts` (Email-to-Case) both use `authenticateWithJWT` |

---

## Pending

### 1. Custom fields framework for Groove threading metadata

**Status:** Research pending — user auditing their org's DaScoopComposer fields.

**Background:** Groove's email sync stays on the `Task` object (backwards compatibility). Threading metadata is stored in custom fields under the `DaScoopComposer` managed package namespace:

| Field | Purpose |
|---|---|
| `DaScoopComposer__vCal_UID__c` | This email's RFC 2822 Message-ID |
| `DaScoopComposer__vCal_IID__c` | In-Reply-To header (parent message ID) |
| (others TBD) | Send timestamp, replied flag, etc. |

These field API names are org-specific — the namespace prefix (`DaScoopComposer`) may differ or be absent in some orgs. **Cannot hardcode vendor field names.**

**Proposed approach:** Follow the `taskDateTimeTieBreakerField` pattern — expose semantic named parameters that customers set to their org's actual field API names:

```
taskMessageIdField      → e.g. "DaScoopComposer__vCal_UID__c"
taskInReplyToField      → e.g. "DaScoopComposer__vCal_IID__c"
```

Action dynamically adds these to the Task SELECT and surfaces them in thread output (or uses them for threading if both are provided).

**Pending:** User org research to confirm field names, data types, and whether `vCal_IID__c` can reliably replace Salesforce's Subject-based thread grouping.

---

### 2. `RelationType` in people resolution (EmailMessageRelation)

**Status:** Low priority, clear implementation path.

Currently all `EmailMessageRelation` rows are fetched without `RelationType`, so the `people` array on each thread does not distinguish the sender (`FromAddress`) from recipients (`ToAddress`, `CcAddress`, `BccAddress`). Adding `RelationType` to the SELECT and including it in each person entry would let LLMs understand the communication structure.

---

## Pre-PR gates

**Target:** PR from `matthewbetancourtBMX/actions-sdk` branch `credal/salesforce-get-clean-activity-records` → `credal-ai/actions-sdk` `main`

Before opening:

- [x] **Auth migration** — `testGetCleanActivityRecords.ts` and `testBuildingEmailMessages.ts` both migrated to JWT flow (`authenticateWithJWT` from `tests/salesforce/utils.ts`).
- [x] **Email to Case `ParentId` surface** — `ParentId` in SELECT and thread output.
- [x] **Email to Case thread grouping fix** — grouping key uses `ParentId ?? ThreadIdentifier ?? Id`.
- [x] **Draft filter** — `AND Status != '5'` in EmailMessage query.
- [x] **Full CI check** — build, lint, prettier, jest all pass.
- [ ] **Custom fields scope decision** — confirm whether to include `taskMessageIdField`/`taskInReplyToField` (Groove threading) in this PR or defer to a follow-up. Pending user org field audit (DaScoopComposer namespace). Default: defer.

---

## Open questions for Credal

> **Platform truncation order:** We observed platform-level payload truncation at ~63,877 characters when testing `getSalesforceRecordsByQuery`. This action is specifically designed to prevent that — it cleans and truncates before returning. Two questions:
>
> 1. Does truncation apply to action *outputs* only, after the function fully completes? We make 3–4 sequential Salesforce API calls internally and need all of them to complete before returning.
> 2. Is 63,877 characters the fixed truncation threshold, or is it configurable per action?
