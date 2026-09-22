import { z } from "zod";
import type { AuthParamsType } from "../../autogen/types.js";
import { axiosClient } from "../../util/axiosClient.js";
import { getJiraApiConfig } from "./utils.js";

export const JIRA_READ_PAGE_LIMIT = 100;
const MAX_DETAILS_BYTES = 2_000_000;

const issueIdentitySchema = z.object({
  id: z.string().min(1),
  key: z.string().min(1),
  fields: z.record(z.unknown()),
});

/** Identify the installation from the same credentials that execute the read. */
export function getJiraReadConfig(authParams: AuthParamsType) {
  const config = getJiraApiConfig(authParams);
  const sourceUrl = config.isDataCenter
    ? config.browseUrl.replace(/\/+$/, "")
    : `https://api.atlassian.com/ex/jira/${encodeURIComponent(authParams.cloudId!)}`;
  const parsed = new URL(sourceUrl);

  if (parsed.protocol !== "https:" || parsed.username || parsed.password || parsed.search || parsed.hash) {
    throw new Error("Jira reads require an HTTPS installation URL without credentials, query or fragment");
  }

  return {
    ...config,
    sourceUrl,
    apiUrl: `${sourceUrl}/rest/api/${config.isDataCenter ? "2" : "3"}`,
  };
}

/** Keep individual reads bounded and prevent credential forwarding through redirects. */
export function jiraReadRequestConfig(authToken: string, signal?: AbortSignal) {
  return {
    headers: { Authorization: `Bearer ${authToken}`, Accept: "application/json" },
    timeout: 30_000,
    maxRedirects: 0,
    maxContentLength: MAX_DETAILS_BYTES,
    signal,
  };
}

export function validateJiraSearchParameters(params: { limit?: number; includeFullDetails?: boolean }) {
  const limit = z.coerce
    .number()
    .int()
    .positive()
    .max(Number.MAX_SAFE_INTEGER)
    .parse(params.limit ?? JIRA_READ_PAGE_LIMIT);

  if (params.includeFullDetails && (params.limit === undefined || limit !== 1)) {
    throw new Error("includeFullDetails requires an explicit limit of 1");
  }

  return limit;
}

/** Jira warnings may mean a query was only partially evaluated. Treat these as failed reads. */
export function assertJiraReadResponse(value: unknown): asserts value is Record<string, unknown> {
  const response = z.record(z.unknown()).parse(value);

  for (const key of ["error", "errors", "errorMessages", "warningMessages", "warnings"]) {
    const message = response[key];
    const isEmpty = message === undefined || message === null || message === "" || message === false;
    const isEmptyCollection = typeof message === "object" && message !== null && Object.keys(message).length === 0;

    if (!isEmpty && !isEmptyCollection) {
      throw new Error("Jira returned an error or warning; the read may be incomplete");
    }
  }
}

export function validateJiraSearchIssues(issues: unknown, maxResults: number) {
  z.array(issueIdentitySchema).max(maxResults).parse(issues);
}

/** Validate offset pagination before a caller can mistake a partial page for completion. */
export function getJiraNextOffset(args: { startAt: number; total: number; expectedStartAt: number; count: number }) {
  const { startAt, total, expectedStartAt, count } = args;
  const offsetSchema = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
  offsetSchema.parse(startAt);
  offsetSchema.parse(total);

  if (startAt !== expectedStartAt || startAt > total || count > total - startAt) {
    throw new Error("Jira returned inconsistent pagination offsets");
  }

  const nextStartAt = startAt + count;

  if (count === 0 && nextStartAt < total) {
    throw new Error("Jira returned an empty page before the reported total");
  }

  return { nextStartAt, isLast: nextStartAt === total };
}

/** Fetch full current fields and all comments, retaining Data Center text and Cloud ADF. */
export async function getJiraIssueFullDetails(args: {
  apiUrl: string;
  authToken: string;
  issueId: string;
  signal?: AbortSignal;
}) {
  const { apiUrl, authToken, issueId, signal } = args;
  const resource = `${apiUrl}/issue/${encodeURIComponent(issueId)}`;
  const requestConfig = jiraReadRequestConfig(authToken, signal);
  signal?.throwIfAborted();
  const issueResponse = await axiosClient.get<unknown>(`${resource}?fields=*all`, requestConfig);
  signal?.throwIfAborted();
  assertJiraReadResponse(issueResponse.data);
  const issue = issueIdentitySchema.parse(issueResponse.data);

  if (issue.id !== issueId) {
    throw new Error("Jira returned a different issue identity");
  }

  const details = { ...issue, comments: [] as unknown[], fetchedAt: new Date().toISOString() };
  let startAt = 0;

  for (let pageNumber = 0; pageNumber < JIRA_READ_PAGE_LIMIT; pageNumber++) {
    signal?.throwIfAborted();
    const response = await axiosClient.get<unknown>(
      `${resource}/comment?startAt=${startAt}&maxResults=${JIRA_READ_PAGE_LIMIT}`,
      requestConfig,
    );
    signal?.throwIfAborted();
    assertJiraReadResponse(response.data);
    const page = z
      .object({ startAt: z.number(), total: z.number(), comments: z.array(z.unknown()).max(JIRA_READ_PAGE_LIMIT) })
      .parse(response.data);
    const next = getJiraNextOffset({ ...page, expectedStartAt: startAt, count: page.comments.length });
    details.comments.push(...page.comments);

    if (Buffer.byteLength(JSON.stringify(details), "utf8") > MAX_DETAILS_BYTES) {
      throw new Error("Jira issue details exceed the 2 MB input budget");
    }

    if (next.isLast) {
      details.fetchedAt = new Date().toISOString();
      return details;
    }

    startAt = next.nextStartAt;
  }

  throw new Error("Jira comments exceeded 100 pages before completion");
}
