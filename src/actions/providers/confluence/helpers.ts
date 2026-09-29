import type { AxiosRequestConfig } from "axios";
import { axiosClient } from "../../util/axiosClient.js";
import type { ConfluenceUserCandidate, ConfluenceUserLookup } from "../../util/confluenceStorageFormat.js";

/**
 * Resolves the Atlassian Cloud ID for the site the action should operate on.
 *
 * The authentication context selects the site via `authParams.cloudId`; that must win, because a single OAuth token
 * can grant access to several sites and the order of `accessible-resources` is not meaningful. The lookup is only a
 * fallback for callers that do not supply a Cloud ID.
 */
export async function resolveConfluenceCloudId(authParams: { cloudId?: string; authToken: string }): Promise<string> {
  if (authParams.cloudId) return authParams.cloudId;

  const cloudDetails = await axiosClient.get("https://api.atlassian.com/oauth/token/accessible-resources", {
    headers: { Authorization: `Bearer ${authParams.authToken}` },
  });
  const resources: unknown = cloudDetails.data;
  const first = Array.isArray(resources) ? (resources[0] as { id?: unknown } | undefined) : undefined;
  if (typeof first?.id !== "string" || first.id === "") {
    throw new Error(
      "Could not determine the Confluence Cloud site: no cloudId was provided and the token has no accessible resources.",
    );
  }
  return first.id;
}

export function getConfluenceRequestConfig(baseUrl: string, authToken: string): AxiosRequestConfig {
  return {
    baseURL: baseUrl,
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${authToken}`,
    },
  };
}

/** Escapes a value for use inside a double-quoted CQL string literal. */
export function escapeCqlString(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

/** Page size for the user search; the endpoint caps `limit` at this value. */
const USER_SEARCH_PAGE_SIZE = 50;
/** Upper bound on users fetched for one name; past this the name is too generic to resolve safely. */
const MAX_USER_SEARCH_RESULTS = 200;

/**
 * Builds a lookup that searches Confluence Cloud users by full name via the v1 user-search endpoint.
 * `/wiki/rest/api/search/user` is the only endpoint that still accepts `user.fullname`; the generic `/search` does not.
 *
 * The search is paged until exhausted so that the caller sees every candidate: a truncated list could hide a second
 * user with the same display name. If more than {@link MAX_USER_SEARCH_RESULTS} users match, the lookup throws instead.
 */
export function createConfluenceCloudUserLookup(cloudId: string, authToken: string): ConfluenceUserLookup {
  const config = getConfluenceRequestConfig(
    `https://api.atlassian.com/ex/confluence/${cloudId}/wiki/rest/api`,
    authToken,
  );
  return async (displayName: string): Promise<ConfluenceUserCandidate[]> => {
    const cql = `user.fullname ~ "${escapeCqlString(displayName)}"`;
    const candidates: ConfluenceUserCandidate[] = [];
    let start = 0;
    while (start < MAX_USER_SEARCH_RESULTS) {
      const response = await axiosClient.get("/search/user", {
        ...config,
        params: { cql, start, limit: USER_SEARCH_PAGE_SIZE },
      });
      const results: unknown = response.data?.results;
      if (!Array.isArray(results)) break;
      for (const result of results) {
        const user = (result as { user?: Record<string, unknown> }).user;
        if (!user) continue;
        const str = (key: string) => (typeof user[key] === "string" ? (user[key] as string) : undefined);
        candidates.push({
          displayName: str("displayName") ?? str("publicName"),
          accountId: str("accountId"),
          userKey: str("userKey"),
          username: str("username"),
        });
      }
      if (results.length < USER_SEARCH_PAGE_SIZE) return candidates;
      start += USER_SEARCH_PAGE_SIZE;
    }
    if (start >= MAX_USER_SEARCH_RESULTS) {
      throw new Error(
        `Display name "${displayName}" matches more than ${MAX_USER_SEARCH_RESULTS} Confluence users; provide the full name or the account ID as rowAnchor instead.`,
      );
    }
    return candidates;
  };
}
