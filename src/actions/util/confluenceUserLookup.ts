import { ApiError } from "./axiosClient.js";

/** True when the error is an HTTP 404 from the Confluence API, i.e. the looked-up entity simply does not exist. */
export function isNotFound(error: unknown): boolean {
  return error instanceof ApiError && error.status === 404;
}

/**
 * Turns an HTTP failure of a user lookup into an error that says what was being looked up, the status, Atlassian's own
 * message (e.g. `Unauthorized; scope does not match`) and how the caller can proceed. Without this the action only
 * reports "Request failed with status 401", which hides that the connection lacks a scope rather than the user being
 * unknown. Errors that are not HTTP responses (timeouts, programming errors) are passed through unchanged.
 */
export function describeUserLookupFailure(error: unknown, subject: string, hint: string): Error {
  if (!(error instanceof ApiError) || error.status === undefined) {
    return error instanceof Error ? error : new Error(String(error));
  }
  const detail = typeof error.data?.message === "string" ? `: ${error.data.message}` : "";
  return new Error(`Confluence user lookup for ${subject} failed with HTTP ${error.status}${detail}. ${hint}`);
}
