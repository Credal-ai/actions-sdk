# Design: `salesforceGetCleanActivityRecords`

**Date:** 2026-05-05
**Repo:** actions-sdk (fork of credal-ai/actions-sdk)
**Status:** Approved for implementation

---

## Problem

Salesforce activity records created by email-sync integrations (HubSpot, Groove, native inbox sync) embed the full raw email thread in `Description` (Task) or `TextBody` (EmailMessage). This includes HTML markup, email headers (From/To/CC/BCC), quoted reply chains, and signature blocks. An agent reading all Task or EmailMessage records for a contact or related record hits token limits before getting to useful content.

This action executes an agent-provided SOQL WHERE clause against one of the three activity object types and returns the text content cleaned of email noise.

---

## Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `authToken` | string | Yes | Salesforce Bearer token |
| `baseUrl` | string | Yes | Salesforce org base URL (e.g. `https://yourorg.my.salesforce.com`) |
| `objectType` | `'Task'` \| `'EmailMessage'` | Yes | Activity object to query |
| `whereClause` | string | Yes | SOQL WHERE clause (without the `WHERE` keyword). Agent is responsible for valid SOQL. |
| `limit` | number | No | Max records to return. Defaults to 50. |
| `returnActivityIds` | boolean | No | EmailMessage only — when true, the response includes an `activityIds` string (JSON array) of Task IDs that Salesforce auto-generated alongside each EmailMessage. Pass to a subsequent Task query as `excludeActivityIds`. |
| `excludeActivityIds` | string | No | Task only — JSON array string of Task IDs to exclude from results. Pass the `activityIds` string from a preceding EmailMessage query exactly as returned — no parsing required. |

---

## Execution

Queries via Salesforce REST API:

```
GET /services/data/v56.0/query?q=<SOQL>
Authorization: Bearer <authToken>
```

The action builds the SELECT list internally based on `objectType` — the agent only provides the WHERE clause.

### Recommended two-call pattern

EmailMessage is the richer, more structured object. Task is always created (including via BCC logging) but may duplicate content already captured as an EmailMessage. The recommended agent pattern:

1. **Call 1:** `objectType: 'EmailMessage'`, `returnActivityIds: true` → returns EmailMessage threads + `activityIds[]`
2. **Call 2:** `objectType: 'Task'`, `excludeActivityIds: <activityIds from call 1>` → returns only Task threads not already represented by an EmailMessage record

---

## Fields fetched per object type

**Task** — always scoped to `TaskSubtype = 'Email'` regardless of what the agent provides in `whereClause`. The action appends this automatically.
`Id, Subject, TaskSubtype, ActivityDate, Owner.Name, Owner.Email, WhoId, WhatId, Description`

**EmailMessage**
`Id, Subject, MessageDate, Incoming, FromAddress, ToAddress, CcAddress, TextBody, ThreadIdentifier, MessageIdentifier, RelatedToId`

---

## Content cleaning

Applied to `Description` (Task, Event) and `TextBody` (EmailMessage) before returning.

1. **Strip HTML** — remove all HTML tags; decode HTML entities. Preserve email addresses in `<addr>` format as `[addr]` before stripping.
2. **Strip email headers** — remove leading `From:`, `To:`, `CC:`, `BCC:`, `Date:`, `Subject:`, `Attachment:` lines at the top of the content
3. **Truncate at quoted reply** — remove everything from the first `On <anything> wrote:` line onward. Handles both single-line (Gmail) and two-line (Apple Mail) formats.
4. **Strip signature blocks** — remove everything after a standalone `--` separator line
5. **Collapse whitespace** — normalize multiple blank lines to a single blank line; trim leading/trailing whitespace

If cleaning produces an empty string, return `null` for the body field.

---

## Task deduplication

When `objectType = 'Task'`, records are deduplicated into email threads before returning. Raw Task records from email-sync create one record per send/receive event on the same thread — an agent reading them individually hits token limits and sees redundant context.

**Normalization:** Subject is normalized by stripping `Email:`, `>>`, `<<`, `[Inbox]`, `Re:`, `Fwd:`, `FW:` (case-insensitive, applied repeatedly) and trimming whitespace.

**Grouping:** Records are grouped by normalized subject + `WhoId` + `WhatId`.

**Per thread, the output includes:**
- All Task IDs in the thread (for audit — agent can reference any individual record back to the user)
- The most recent Task ID
- Cleaned description from the most recent Task only
- Count of messages in the thread
- Direction of the most recent message (`inbound` / `outbound` / `unknown`) resolved via the chain below

**Direction resolution** (evaluated in order, first match wins):
1. Subject contains `>>` → `outbound`
2. Subject contains `<<` or `[Inbox]` → `inbound`
3. Parse `From:` header from `Description` (before cleaning). Extract the email address. Compare against `Owner.Email`:
   - Matches → `outbound` (the Salesforce user sent it)
   - Present but does not match → `inbound` (an external party sent it)
4. `unknown`

Step 3 handles integrations that do not use `>>` / `<<` subject prefixes. `Owner.Email` is used rather than `contact.email` because a Salesforce user may also exist as a Contact in the org, which would make `contact.email` an internal address and break the comparison.

**Contact resolution:** After fetching Tasks, a second query resolves all unique `WhoId` values to Contact name, email, and title. If a `WhoId` is a Lead rather than a Contact, the same fields are fetched from the Lead object.

---

## Output structure

```typescript
{
  objectType: 'Task' | 'EmailMessage';
  totalFetched: number;         // raw records returned from Salesforce
  totalThreads: number;         // number of deduplicated threads
  threads: TaskThread[] | EmailMessageThread[];
}
```

**TaskThread** (Task objectType)
```typescript
{
  normalizedSubject: string;
  threadSize: number;           // total Task records in this thread
  latestDate: string;           // activityDate of most recent Task
  direction: 'inbound' | 'outbound' | 'unknown';  // see direction resolution chain in spec
  owner: string | null;
  whoId: string | null;
  whatId: string | null;
  contact: {
    id: string;
    name: string;
    email: string | null;
    title: string | null;
  } | null;
  latestTaskId: string;         // ID of most recent Task — primary audit reference
  allTaskIds: string[];         // all Task IDs in this thread
  cleanedDescription: string | null;  // cleaned body of most recent Task only
}
```

**EmailMessageThread** (EmailMessage objectType)
```typescript
{
  threadIdentifier: string;     // native RFC email thread ID (Message-ID of thread root)
  normalizedSubject: string;    // subject stripped of Re:/Fwd:/FW: prefixes
  threadSize: number;           // total EmailMessage records in this thread
  latestDate: string;           // MessageDate of most recent record
  direction: 'inbound' | 'outbound';  // Incoming boolean of most recent record — no heuristics needed
  relatedToId: string | null;   // related Salesforce record (Case, Opportunity, etc.)
  fromAddress: string | null;   // FromAddress of most recent record
  toAddress: string | null;     // ToAddress of most recent record
  latestMessageId: string;      // EmailMessage record ID of most recent message — primary audit reference
  allMessageIds: string[];      // all EmailMessage record IDs in this thread
  messageIdentifiers: string[]; // RFC Message-ID values for all messages — for email header tracing
  cleanedBody: string | null;   // cleaned TextBody of most recent message only
}
```

---

## EmailMessage deduplication

When `objectType = 'EmailMessage'`, records are grouped into threads using the native `ThreadIdentifier` field before returning. Each EmailMessage record's `TextBody` contains the full quoted email chain (same problem as Task.Description), so the same cleaning pipeline applies and only the latest message's cleaned body is returned per thread.

**Grouping:** Records are grouped by `ThreadIdentifier`. Unlike Task, no subject normalization is needed — `ThreadIdentifier` is the RFC thread ID derived from `Message-ID` / `In-Reply-To` / `References` email headers and is authoritative.

**Direction:** Taken directly from the `Incoming` boolean of the most recent record. No subject prefix parsing or `From:` header comparison required.

---

## Implementation notes

- Auth pattern: `Authorization: Bearer <authToken>` via `axiosClient.ts` — matches all existing Salesforce actions
- REST endpoint: `GET /services/data/v56.0/query?q=<encoded SOQL>`
- `whereClause` is validated before execution: statement terminators (`;`) and comment sequences (`--`, `/*`, `*/`) are rejected with a descriptive error the agent can act on. This prevents those patterns from escaping the `WHERE (${whereClause}) AND ...` wrapper and accessing unintended records. Keywords like `AND`, `OR`, `IN`, `NOT IN`, `LIKE` are allowed; `SELECT`, `UNION`, and DML keywords are not valid in a SOQL WHERE clause and would produce a Salesforce API error if injected. Trust model: callers are AI agents operating in a trusted pipeline, not untrusted end users.
- `excludeActivityIds` values are validated against the Salesforce ID format (`/^[a-zA-Z0-9]{15,18}$/`) before SOQL interpolation; entries that do not match are silently dropped.
- `hasMore` detection uses a `LIMIT + 1` fetch: the action requests one extra record and checks whether it was returned. This avoids reliance on Salesforce query metadata (`done` / `nextRecordsUrl`), which behaves inconsistently when a `LIMIT` clause is present. Malformed SOQL that passes the injection check returns a Salesforce API error that is surfaced to the caller.
- Registered as `type: 'read'` in `actionMapper.ts`
- Schema defined in `schema.yaml`, types regenerated via `npm run generate:types`
- Implementation at `src/actions/providers/salesforce/getCleanActivityRecords.ts`
