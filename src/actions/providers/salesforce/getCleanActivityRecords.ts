import type {
  AuthParamsType,
  salesforceGetCleanActivityRecordsFunction,
  salesforceGetCleanActivityRecordsOutputType,
  salesforceGetCleanActivityRecordsParamsType,
} from "../../autogen/types.js";
import { ApiError, axiosClient } from "../../util/axiosClient.js";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const DEFAULT_MAX_BODY_LENGTH = 500;
const MAX_EXCLUDE_IDS = 500;
// Salesforce IDs are 15 or 18 alphanumeric characters — used to validate excludeActivityIds before SOQL interpolation
const SF_ID_PATTERN = /^[a-zA-Z0-9]{15}$|^[a-zA-Z0-9]{18}$/;
const TASK_FIELD_API_NAME_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;
// Blocks statement terminators and comment sequences that could escape the WHERE clause wrapper
const SOQL_INJECTION_PATTERN = /;|--|\/\*|\*\//;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SfRecord = Record<string, any>;

function forEachSoqlCharacterOutsideString(
  value: string,
  callback: (character: string, index: number) => void | "stop",
): void {
  let inString = false;
  let escaped = false;

  for (let i = 0; i < value.length; i += 1) {
    const character = value[i];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (character === "\\") {
        escaped = true;
      } else if (character === "'" && value[i + 1] === "'") {
        i += 1;
      } else if (character === "'") {
        inString = false;
      }
      continue;
    }

    if (character === "'") {
      inString = true;
      continue;
    }

    if (callback(character, i) === "stop") return;
  }
}

function hasBalancedParentheses(value: string): boolean {
  let depth = 0;
  let balanced = true;

  forEachSoqlCharacterOutsideString(value, character => {
    if (character === "(") depth += 1;
    if (character === ")") depth -= 1;
    if (depth < 0) {
      balanced = false;
      return "stop";
    }
    return undefined;
  });

  return balanced && depth === 0;
}

function hasDisallowedSoqlSequenceOutsideString(value: string): boolean {
  let hasDisallowedSequence = false;

  forEachSoqlCharacterOutsideString(value, (_, index) => {
    if (SOQL_INJECTION_PATTERN.test(value.slice(index, index + 2))) {
      hasDisallowedSequence = true;
      return "stop";
    }
    return undefined;
  });

  return hasDisallowedSequence;
}

function normalizeLimit(limit: number | undefined): number {
  return Math.min(Math.max(1, Math.trunc(limit ?? DEFAULT_LIMIT)), MAX_LIMIT);
}

function cleanBody(text: string | null | undefined): string | null {
  if (!text) return null;
  let s = text;
  s = s.replace(/\r\n/g, "\n");
  s = s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&#?\w+;/g, "");
  s = s.replace(/<br\s*\/?>/gi, "\n");
  s = s.replace(/<\/(?:div|p|li|tr|h[1-6])>/gi, "\n");
  s = s.replace(/<([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})>/g, "[$1]");
  s = s.replace(/<[^>]+>/g, " ");
  s = s.replace(/^(From|To|CC|BCC|Date|Subject|Attachment|Body|Additional\s+To):.*\n/gim, "");
  const qm = s.match(/(?:^|\n)((?:>\s*)?On [\s\S]{0,250}?wrote:\s*(?:\n|$))/);
  if (qm && qm.index !== undefined) {
    const cut = qm.index + (qm[0].startsWith("\n") ? 1 : 0);
    s = s.slice(0, cut);
  }
  s = s.replace(/\n--\s*\n[\s\S]*$/, "");
  s = s.replace(/\n{3,}/g, "\n\n").trim();
  return s.length > 0 ? s : null;
}

// Strips HTML markup from a Task Description before direction detection, without the
// quote-chain truncation that cleanBody applies. Handles entity-encoded angle brackets
// produced by some Salesforce email-sync integrations (e.g., &lt;email@domain&gt;).
function normalizeEmailHeaderText(text: string | null | undefined): string | null {
  if (!text) return null;
  let s = text.replace(/\r\n/g, "\n");
  s = s.replace(/<br\s*\/?>/gi, "\n");
  s = s.replace(/<\/(?:div|p|li|tr|h[1-6])>/gi, "\n");
  s = s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&#?\w+;/g, "");
  s = s.replace(/<([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})>/g, "[$1]");
  s = s.replace(/<[^>]+>/g, " ");
  s = s.replace(/[ \t]+/g, " ");
  s = s.replace(/\n\s+/g, "\n").trim();
  return s.length > 0 ? s : null;
}

function truncate(text: string | null, maxLength: number): string | null {
  if (!text) return null;
  if (text.length <= maxLength) return text;
  return maxLength > 0 ? text.slice(0, maxLength - 1) + "…" : null;
}

function normalizeSubject(subject: string): string {
  const prefix = /^(Email:\s*|Bounced:\s*|>>\s*|<<\s*|\[Inbox\]\s*-?\s*|Re:\s*|Fwd?:\s*|FW:\s*)/i;
  let s = subject;
  let prev = "";
  while (s !== prev) {
    prev = s;
    s = s.replace(prefix, "");
  }
  return s.trim();
}

function parseSalesforceTimestamp(value: unknown): number {
  if (typeof value !== "string" || value.length === 0) return Number.NEGATIVE_INFINITY;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? Number.NEGATIVE_INFINITY : parsed;
}

function compareTaskDateCandidates(a: SfRecord, b: SfRecord, taskDateTimeTieBreakerField?: string): number {
  const candidates = [
    taskDateTimeTieBreakerField,
    "ActivityDate",
    "CompletedDateTime",
    "LastModifiedDate",
    "CreatedDate",
  ].filter((field): field is string => typeof field === "string" && field.length > 0);

  for (const field of candidates) {
    const byField = parseSalesforceTimestamp(b[field]) - parseSalesforceTimestamp(a[field]);
    if (byField !== 0) return byField;
  }

  return 0;
}

function compareTaskEmailRecords(a: SfRecord, b: SfRecord, taskDateTimeTieBreakerField?: string): number {
  const byEmailTime = compareTaskDateCandidates(a, b, taskDateTimeTieBreakerField);
  if (byEmailTime !== 0) return byEmailTime;
  return String(b.Id ?? "").localeCompare(String(a.Id ?? ""));
}

function formatTaskEmailDate(record: SfRecord, taskDateTimeTieBreakerField?: string): string | null {
  const candidates = [
    taskDateTimeTieBreakerField ? record[taskDateTimeTieBreakerField] : undefined,
    record.ActivityDate,
    record.CompletedDateTime,
    record.LastModifiedDate,
    record.CreatedDate,
  ];
  return (candidates.find(value => typeof value === "string" && value.length > 0) as string | undefined) ?? null;
}

function detectTaskDirection(
  subject: string,
  description: string | null | undefined,
  ownerEmail: string | null | undefined,
): "inbound" | "outbound" | "unknown" {
  if (subject.includes(">>")) return "outbound";
  if (subject.includes("<<") || /\[inbox\]/i.test(subject)) return "inbound";
  if (description && ownerEmail) {
    const fromMatch =
      description.match(/^From:\s*.*?\[([^\]]+@[^\]]+)\]/im) ||
      description.match(/^From:\s*.*?<([^>]+)>/im) ||
      description.match(/^From:\s*(\S+@\S+)/im);
    if (fromMatch) {
      const fromEmail = fromMatch[1]
        .trim()
        .replace(/[>,;]+$/, "")
        .toLowerCase();
      return fromEmail === ownerEmail.toLowerCase() ? "outbound" : "inbound";
    }
    const toMatch = description.match(/^To:\s*(.+)/m);
    if (toMatch) {
      return toMatch[1].toLowerCase().includes(ownerEmail.toLowerCase()) ? "inbound" : "outbound";
    }
  }
  return "unknown";
}

function parseExcludeActivityIds(excludeActivityIds?: string): string[] {
  if (!excludeActivityIds) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(excludeActivityIds);
  } catch {
    throw new Error("excludeActivityIds must be a JSON array string");
  }

  if (!Array.isArray(parsed)) {
    throw new Error("excludeActivityIds must be a JSON array string");
  }

  const invalid = parsed.filter(id => typeof id !== "string" || !SF_ID_PATTERN.test(id));
  if (invalid.length > 0) {
    throw new Error(`excludeActivityIds contains invalid Salesforce IDs: ${invalid.join(", ")}`);
  }

  const unique = [...new Set(parsed as string[])];
  if (unique.length > MAX_EXCLUDE_IDS) {
    throw new Error(
      `excludeActivityIds contains ${unique.length} IDs, which exceeds the limit of ${MAX_EXCLUDE_IDS}. ` +
        "Use a narrower whereClause to reduce the EmailMessage result set before collecting activity IDs.",
    );
  }

  return unique;
}

// whereClause is provided by an AI agent and is NOT treated as untrusted end-user input. This guard
// blocks comment sequences and statement terminators that could break the WHERE clause wrapping and
// allow unintended record access. Hallucinated or malformed SOQL that passes this check returns a
// Salesforce API error surfaced to the caller.
function validateWhereClause(whereClause: string): void {
  if (hasDisallowedSoqlSequenceOutsideString(whereClause)) {
    throw new Error(
      "whereClause contains disallowed patterns (; -- /* */). Provide a plain SOQL filter expression without statement terminators or comment sequences. " +
        "Example: \"WhatId = '001Qp000003abcDEF' AND ActivityDate >= 2024-01-01\"",
    );
  }
  if (!hasBalancedParentheses(whereClause)) {
    throw new Error(
      "whereClause contains unbalanced parentheses. Provide a balanced SOQL filter expression that cannot escape appended safety filters. " +
        "Example: \"(WhatId = '001Qp000003abcDEF' OR WhoId = '003Qp000003abcDEF') AND ActivityDate >= 2024-01-01\"",
    );
  }
}

// maxPages caps pagination for queries without a LIMIT clause (e.g. activity ID collection).
// Queries with a LIMIT clause never produce more than one page, so the default Infinity is safe for them.
async function soqlQuery(
  baseUrl: string,
  authToken: string,
  soql: string,
  maxPages = Infinity,
  useQueryAll = false,
): Promise<SfRecord[]> {
  const endpoint = useQueryAll ? "queryAll" : "query";
  let url: string | null = `${baseUrl}/services/data/v56.0/${endpoint}?q=${encodeURIComponent(soql)}`;
  const records: unknown[] = [];
  let pages = 0;

  while (url && pages < maxPages) {
    const response: { data: { records?: unknown[]; done?: boolean; nextRecordsUrl?: string } } = await axiosClient.get(
      url,
      { headers: { Authorization: `Bearer ${authToken}` } },
    );
    records.push(...(response.data.records ?? []));
    url =
      response.data.done === false && typeof response.data.nextRecordsUrl === "string"
        ? `${baseUrl}${response.data.nextRecordsUrl}`
        : null;
    pages++;
  }

  return records as SfRecord[];
}

async function handleTask(
  baseUrl: string,
  authToken: string,
  whereClause: string,
  limit: number,
  maxBodyLength: number,
  excludeActivityIds?: string,
  taskDateTimeTieBreakerField?: string,
): Promise<salesforceGetCleanActivityRecordsOutputType> {
  validateWhereClause(whereClause);
  const exclusionIds = parseExcludeActivityIds(excludeActivityIds);
  const exclusion = exclusionIds.length > 0 ? ` AND Id NOT IN (${exclusionIds.map(id => `'${id}'`).join(",")})` : "";
  const selectFields = [
    "Id",
    "Subject",
    "TaskSubtype",
    "ActivityDate",
    taskDateTimeTieBreakerField,
    "CompletedDateTime",
    "CreatedDate",
    "LastModifiedDate",
    "Owner.Name",
    "Owner.Email",
    "WhoId",
    "WhatId",
    "Description",
  ].filter((field): field is string => typeof field === "string" && field.length > 0);
  const orderByFields = [
    taskDateTimeTieBreakerField ? `${taskDateTimeTieBreakerField} DESC NULLS LAST` : undefined,
    "ActivityDate DESC NULLS LAST",
    "CompletedDateTime DESC NULLS LAST",
  ].filter((field): field is string => typeof field === "string" && field.length > 0);
  // Task email processing is optimized for Groove-style synced email Tasks:
  // Groove writes direction markers into Subject (>>, <<, Bounced: >>) and can expose a true Date/Time
  // sent field such as groove_email_sent_at__c. Agents should pass that field through
  // taskDateTimeTieBreakerField when available; otherwise the portable fallback is ActivityDate with
  // CompletedDateTime as a sync-time tie-breaker.
  // Fetch limit+1 to determine whether additional records exist without relying on Salesforce pagination metadata
  const soql = `SELECT ${selectFields.join(", ")} FROM Task WHERE ${formatActivityWhereClause(whereClause)} AND TaskSubtype = 'Email' AND Status = 'Completed' AND IsDeleted = false${exclusion} ORDER BY ${orderByFields.join(", ")} LIMIT ${limit + 1}`;
  const rawRecords = (await soqlQuery(baseUrl, authToken, soql, Infinity, true)) as SfRecord[];
  const hasMore = rawRecords.length > limit;
  const records = hasMore ? rawRecords.slice(0, limit) : rawRecords;

  // Group by normalizedSubject + WhoId + WhatId
  const threadMap = new Map<string, SfRecord[]>();
  for (const r of records) {
    const normalizedSubject = normalizeSubject(r.Subject ?? "");
    const whoId = r.WhoId ?? "";
    const whatId = r.WhatId ?? "";
    const key = normalizedSubject || whoId || whatId ? `${normalizedSubject}||${whoId}||${whatId}` : String(r.Id);
    const group = threadMap.get(key) ?? [];
    group.push(r);
    threadMap.set(key, group);
  }

  // Resolve WhoId → Contact, then Lead as fallback
  const whoIds = [...new Set(records.map(r => r.WhoId).filter(Boolean) as string[])];
  const contactMap = new Map<string, { id: string; name: string; email: string | null; title: string | null }>();
  if (whoIds.length > 0) {
    const idList = whoIds.map(id => `'${id}'`).join(",");
    const contactSoql = `SELECT Id, Name, Email, Title FROM Contact WHERE Id IN (${idList})`;
    const contacts = (await soqlQuery(baseUrl, authToken, contactSoql)) as SfRecord[];
    for (const c of contacts) {
      contactMap.set(c.Id, { id: c.Id, name: c.Name, email: c.Email ?? null, title: c.Title ?? null });
    }
    const unresolvedIds = whoIds.filter(id => !contactMap.has(id));
    if (unresolvedIds.length > 0) {
      const leadIdList = unresolvedIds.map(id => `'${id}'`).join(",");
      const leadSoql = `SELECT Id, Name, Email, Title FROM Lead WHERE Id IN (${leadIdList})`;
      const leads = (await soqlQuery(baseUrl, authToken, leadSoql)) as SfRecord[];
      for (const l of leads) {
        contactMap.set(l.Id, { id: l.Id, name: l.Name, email: l.Email ?? null, title: l.Title ?? null });
      }
    }
  }

  const threads = [];
  for (const [, group] of threadMap) {
    group.sort((a, b) => compareTaskEmailRecords(a, b, taskDateTimeTieBreakerField));
    const latest = group[0];
    const ownerEmail: string | null = latest.Owner?.Email ?? null;
    threads.push({
      normalizedSubject: normalizeSubject(latest.Subject ?? ""),
      threadSize: group.length,
      latestDate: formatTaskEmailDate(latest, taskDateTimeTieBreakerField),
      activityDate: latest.ActivityDate ?? null,
      direction: detectTaskDirection(latest.Subject ?? "", normalizeEmailHeaderText(latest.Description), ownerEmail),
      owner: latest.Owner?.Name ?? null,
      whoId: latest.WhoId ?? null,
      whatId: latest.WhatId ?? null,
      contact: latest.WhoId ? (contactMap.get(latest.WhoId) ?? null) : null,
      latestTaskId: latest.Id,
      allTaskIds: group.map(r => r.Id as string),
      cleanedDescription: truncate(cleanBody(latest.Description), maxBodyLength),
    });
  }

  threads.sort((a, b) => parseSalesforceTimestamp(b.latestDate) - parseSalesforceTimestamp(a.latestDate));

  return {
    success: true,
    objectType: "Task",
    totalFetched: records.length,
    totalThreads: threads.length,
    threads,
    ...(hasMore && {
      hasMore: true,
      hasMoreMessage: `Result set was capped at ${limit} records (${threads.length} threads shown). There may be additional Task activity not included in this response. Narrow your WHERE clause or increase the limit parameter to retrieve more.`,
    }),
  };
}

function containsSemiJoinSubquery(whereClause: string): boolean {
  let found = false;
  forEachSoqlCharacterOutsideString(whereClause, (char, index) => {
    // Only check at positions that are the start of a word (preceded by non-word char or start of string)
    if (/\w/.test(char) && (index === 0 || !/\w/.test(whereClause[index - 1]))) {
      if (/^(?:NOT\s+)?IN\s*\(\s*SELECT\b/i.test(whereClause.slice(index))) {
        found = true;
        return "stop";
      }
    }
    return undefined;
  });
  return found;
}

function findMatchingParen(value: string, openIndex: number): number | null {
  let depth = 0;
  let match: number | null = null;

  forEachSoqlCharacterOutsideString(value, (character, index) => {
    if (index < openIndex) return undefined;
    if (character === "(") depth += 1;
    if (character === ")") {
      depth -= 1;
      if (depth === 0) {
        match = index;
        return "stop";
      }
    }
    return undefined;
  });

  return match;
}

function findParenthesizedRanges(value: string): Array<{ start: number; end: number }> {
  const stack: number[] = [];
  const ranges: Array<{ start: number; end: number }> = [];

  forEachSoqlCharacterOutsideString(value, (character, index) => {
    if (character === "(") stack.push(index);
    if (character === ")") {
      const start = stack.pop();
      if (start !== undefined) ranges.push({ start, end: index });
    }
    return undefined;
  });

  return ranges;
}

function stripEnclosingParentheses(value: string): string {
  let trimmed = value.trim();
  let changed = true;

  while (changed && trimmed.startsWith("(") && trimmed.endsWith(")")) {
    changed = false;
    const match = findMatchingParen(trimmed, 0);
    if (match === trimmed.length - 1) {
      trimmed = trimmed.slice(1, -1).trim();
      changed = true;
    }
  }

  return trimmed;
}

function hasTopLevelOr(value: string): boolean {
  let depth = 0;
  let found = false;
  const normalized = stripEnclosingParentheses(value);

  forEachSoqlCharacterOutsideString(normalized, (character, index) => {
    if (character === "(") {
      depth += 1;
      return undefined;
    }
    if (character === ")") {
      depth -= 1;
      return undefined;
    }
    if (depth === 0 && /^OR\b/i.test(normalized.slice(index)) && (index === 0 || !/\w/.test(normalized[index - 1]))) {
      found = true;
      return "stop";
    }
    return undefined;
  });

  return found;
}

function isCompleteSemiJoinExpression(expression: string): boolean {
  const trimmed = expression.trim();
  const match = /^[A-Za-z_][\w.]*\s+(?:NOT\s+)?IN\s*\(/i.exec(trimmed);
  if (!match) return false;

  const openParenIndex = match[0].lastIndexOf("(");
  return findMatchingParen(trimmed, openParenIndex) === trimmed.length - 1;
}

function unwrapParenthesizedSemiJoins(whereClause: string): string {
  let normalized = whereClause;
  let changed = true;

  while (changed) {
    changed = false;
    const ranges = findParenthesizedRanges(normalized).sort((a, b) => b.start - a.start);

    for (const { start, end } of ranges) {
      const inner = normalized.slice(start + 1, end);
      if (!isCompleteSemiJoinExpression(inner)) continue;

      normalized = normalized.slice(0, start) + inner.trim() + normalized.slice(end + 1);
      changed = true;
      break;
    }
  }

  return normalized;
}

function formatActivityWhereClause(whereClause: string): string {
  if (!containsSemiJoinSubquery(whereClause)) {
    return `(${whereClause})`;
  }
  if (hasTopLevelOr(whereClause)) {
    throw new Error(
      "whereClause contains a semi-join subquery combined with OR, which Salesforce SOQL does not support. Split the query into multiple calls or rewrite the filter without OR.",
    );
  }
  const unwrapped = unwrapParenthesizedSemiJoins(whereClause);
  // Salesforce rejects outer parens around a bare lone semi-join, e.g. (WhoId IN (SELECT ...)).
  // But a compound expression such as (WhoId IN (SELECT ...) AND ...) is valid and must be
  // wrapped so that appended AND filters apply to the entire caller-provided expression.
  return isCompleteSemiJoinExpression(unwrapped) ? unwrapped : `(${unwrapped})`;
}

function buildEmailMessageQuery(whereClause: string, limit: number): string {
  return `SELECT Id, Subject, MessageDate, Incoming, IsBounced, Status, HasAttachment, FromName, FromAddress, ToAddress, CcAddress, TextBody, ThreadIdentifier, MessageIdentifier, ReplyToEmailMessageId, RelatedToId, ParentId, ActivityId FROM EmailMessage WHERE ${formatActivityWhereClause(whereClause)} AND IsDeleted = false AND Status != '5' ORDER BY MessageDate DESC NULLS LAST LIMIT ${limit + 1}`;
}

async function handleEmailMessage(
  baseUrl: string,
  authToken: string,
  whereClause: string,
  limit: number,
  maxBodyLength: number,
  returnActivityIds?: boolean,
): Promise<salesforceGetCleanActivityRecordsOutputType> {
  validateWhereClause(whereClause);
  // Fetch limit+1 to determine whether additional records exist without relying on Salesforce pagination metadata
  const soql = buildEmailMessageQuery(whereClause, limit);
  const rawRecords = (await soqlQuery(baseUrl, authToken, soql, Infinity, true)) as SfRecord[];
  const hasMore = rawRecords.length > limit;
  const records = hasMore ? rawRecords.slice(0, limit) : rawRecords;

  const threadMap = new Map<string, SfRecord[]>();
  for (const r of records) {
    // Email to Case: ParentId is the Case ID — the definitive thread container (ThreadIdentifier is not
    // set for On-Demand Email-to-Case per Salesforce docs). Enhanced Email / inbox sync: ThreadIdentifier.
    const key = r.ParentId ?? r.ThreadIdentifier ?? r.Id;
    const group = threadMap.get(key) ?? [];
    group.push(r);
    threadMap.set(key, group);
  }

  // Resolve people via EmailMessageRelation → Contact, then Lead as fallback
  const allMessageIds = records.map(r => r.Id as string).filter(Boolean);
  const personMap = new Map<string, { id: string; name: string; email: string | null; title: string | null }>();
  const messagePersonMap = new Map<string, string[]>();

  if (allMessageIds.length > 0) {
    const messageIdList = allMessageIds.map(id => `'${id}'`).join(",");
    const relationSoql = `SELECT EmailMessageId, RelationId, RelationObjectType FROM EmailMessageRelation WHERE EmailMessageId IN (${messageIdList}) AND RelationObjectType IN ('Contact', 'Lead')`;
    const relations = (await soqlQuery(baseUrl, authToken, relationSoql)) as SfRecord[];

    const relationIdSet = new Set<string>();
    for (const rel of relations) {
      if (!rel.EmailMessageId || !rel.RelationId) continue;
      const existing = messagePersonMap.get(rel.EmailMessageId) ?? [];
      existing.push(rel.RelationId);
      messagePersonMap.set(rel.EmailMessageId, existing);
      relationIdSet.add(rel.RelationId);
    }
    const relationIds = [...relationIdSet];

    if (relationIds.length > 0) {
      const idList = relationIds.map(id => `'${id}'`).join(",");
      const contacts = (await soqlQuery(
        baseUrl,
        authToken,
        `SELECT Id, Name, Email, Title FROM Contact WHERE Id IN (${idList})`,
      )) as SfRecord[];
      for (const c of contacts) {
        personMap.set(c.Id, { id: c.Id, name: c.Name, email: c.Email ?? null, title: c.Title ?? null });
      }
      const unresolvedIds = relationIds.filter(id => !personMap.has(id));
      if (unresolvedIds.length > 0) {
        const leadIdList = unresolvedIds.map(id => `'${id}'`).join(",");
        const leads = (await soqlQuery(
          baseUrl,
          authToken,
          `SELECT Id, Name, Email, Title FROM Lead WHERE Id IN (${leadIdList})`,
        )) as SfRecord[];
        for (const l of leads) {
          personMap.set(l.Id, { id: l.Id, name: l.Name, email: l.Email ?? null, title: l.Title ?? null });
        }
      }
    }
  }

  const threads = [];
  for (const [threadIdentifier, group] of threadMap) {
    group.sort((a, b) => parseSalesforceTimestamp(b.MessageDate) - parseSalesforceTimestamp(a.MessageDate));
    const latest = group[0];
    const threadPersonIds = new Set<string>();
    for (const msg of group) {
      for (const pid of messagePersonMap.get(msg.Id) ?? []) {
        threadPersonIds.add(pid);
      }
    }
    const people = [...threadPersonIds].map(id => personMap.get(id)).filter(Boolean);
    threads.push({
      threadIdentifier,
      normalizedSubject: normalizeSubject(latest.Subject ?? ""),
      threadSize: group.length,
      latestDate: latest.MessageDate ?? null,
      direction: latest.Incoming === true ? "inbound" : "outbound",
      bounced: group.some(r => r.IsBounced === true),
      hasAttachment: group.some(r => r.HasAttachment === true),
      status: latest.Status ?? null,
      relatedToId: latest.RelatedToId ?? null,
      parentId: latest.ParentId ?? null,
      fromName: latest.FromName ?? null,
      fromAddress: latest.FromAddress ?? null,
      toAddress: latest.ToAddress ?? null,
      ccAddress: latest.CcAddress ?? null,
      people,
      latestMessageId: latest.Id,
      allMessageIds: group.map(r => r.Id as string),
      messageIdentifiers: group.map(r => r.MessageIdentifier as string).filter(Boolean),
      replyToEmailMessageId: latest.ReplyToEmailMessageId ?? null,
      cleanedBody: truncate(cleanBody(latest.TextBody), maxBodyLength),
    });
  }

  threads.sort((a, b) => parseSalesforceTimestamp(b.latestDate) - parseSalesforceTimestamp(a.latestDate));

  const result: salesforceGetCleanActivityRecordsOutputType = {
    success: true,
    objectType: "EmailMessage",
    totalFetched: records.length,
    totalThreads: threads.length,
    threads,
    ...(hasMore && {
      hasMore: true,
      hasMoreMessage: `Result set was capped at ${limit} records (${threads.length} threads shown). There may be additional EmailMessage activity not included in this response. Narrow your WHERE clause or increase the limit parameter to retrieve more.`,
    }),
  };

  if (returnActivityIds) {
    result.activityIds = JSON.stringify([
      ...new Set(
        records.map(record => record.ActivityId).filter((id): id is string => typeof id === "string" && id.length > 0),
      ),
    ]);
  }

  return result;
}

const getCleanActivityRecords: salesforceGetCleanActivityRecordsFunction = async ({
  params,
  authParams,
}: {
  params: salesforceGetCleanActivityRecordsParamsType;
  authParams: AuthParamsType;
}): Promise<salesforceGetCleanActivityRecordsOutputType> => {
  const { authToken, baseUrl } = authParams;
  const {
    objectType,
    whereClause,
    limit,
    maxBodyLength,
    returnActivityIds,
    excludeActivityIds,
    taskDateTimeTieBreakerField,
  } = params;

  if (!authToken || !baseUrl) {
    return { success: false, error: "authToken and baseUrl are required for Salesforce API" };
  }

  if (objectType === "EmailMessage" && excludeActivityIds) {
    // Allow an empty JSON array "[]" since it has no effect; reject any non-empty exclusion list
    let parsedExclude: unknown;
    try {
      parsedExclude = JSON.parse(excludeActivityIds);
    } catch {
      parsedExclude = null;
    }
    if (!Array.isArray(parsedExclude) || parsedExclude.length > 0) {
      return { success: false, error: "excludeActivityIds is only supported when objectType is Task" };
    }
  }

  if (objectType === "EmailMessage" && taskDateTimeTieBreakerField) {
    return { success: false, error: "taskDateTimeTieBreakerField is only supported when objectType is Task" };
  }

  if (objectType === "Task" && returnActivityIds) {
    return { success: false, error: "returnActivityIds is only supported when objectType is EmailMessage" };
  }

  const effectiveLimit = normalizeLimit(limit);
  const effectiveMaxBodyLength = Math.max(0, maxBodyLength ?? DEFAULT_MAX_BODY_LENGTH);

  if (taskDateTimeTieBreakerField && !TASK_FIELD_API_NAME_PATTERN.test(taskDateTimeTieBreakerField)) {
    return { success: false, error: "taskDateTimeTieBreakerField must be a valid Task field API name" };
  }

  try {
    if (objectType === "Task") {
      return await handleTask(
        baseUrl,
        authToken,
        whereClause,
        effectiveLimit,
        effectiveMaxBodyLength,
        excludeActivityIds,
        taskDateTimeTieBreakerField,
      );
    }
    return await handleEmailMessage(
      baseUrl,
      authToken,
      whereClause,
      effectiveLimit,
      effectiveMaxBodyLength,
      returnActivityIds,
    );
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof ApiError
          ? Array.isArray(error.data) && error.data.length > 0 && typeof error.data[0]?.message === "string"
            ? error.data[0].message
            : error.message
          : error instanceof Error
            ? error.message
            : "An unknown error occurred",
    };
  }
};

export {
  buildEmailMessageQuery,
  cleanBody,
  compareTaskEmailRecords,
  detectTaskDirection,
  normalizeEmailHeaderText,
  normalizeLimit,
  normalizeSubject,
  parseExcludeActivityIds,
  soqlQuery,
  truncate,
  validateWhereClause,
};

export default getCleanActivityRecords;
