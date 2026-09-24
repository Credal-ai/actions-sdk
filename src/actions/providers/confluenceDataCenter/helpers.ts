import type { AxiosRequestConfig } from "axios";
import { axiosClient } from "../../util/axiosClient.js";
import type { ConfluenceUserCandidate, ConfluenceUserLookup } from "../../util/confluenceStorageFormat.js";

export function getConfluenceApi(authParams: { baseUrl?: string; authToken?: string }): {
  baseUrl: string;
  config: AxiosRequestConfig;
} {
  const { baseUrl, authToken } = authParams;

  if (!authToken) {
    throw new Error("Auth Token is required");
  }

  if (!baseUrl) {
    throw new Error("Base URL is required for Confluence Data Center");
  }

  const trimmedUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;

  return {
    baseUrl: `${trimmedUrl}/rest/api`,
    config: {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
    },
  };
}

type DataCenterUser = { username?: unknown; userKey?: unknown; displayName?: unknown };

function toCandidate(user: DataCenterUser): ConfluenceUserCandidate {
  const str = (value: unknown) => (typeof value === "string" ? value : undefined);
  return { displayName: str(user.displayName), userKey: str(user.userKey), username: str(user.username) };
}

function normaliseName(value: string | undefined): string {
  return (value ?? "").replace(/\s+/g, " ").trim().toLowerCase();
}

/** Page size of `/group/{name}/member`; Data Center caps it at 200. */
const GROUP_MEMBER_PAGE_SIZE = 200;
/** Upper bound on members scanned when falling back to group enumeration, to keep the action bounded on large sites. */
const MAX_GROUP_MEMBERS_SCANNED = 2000;

/**
 * Builds a lookup that resolves a Data Center user by display name.
 *
 * Data Center has no user-search API (CQL user fields and `/search/user` are Cloud-only), so the members of
 * `groupName` (default `confluence-users`) are scanned and compared by display name, case-insensitively, up to
 * {@link MAX_GROUP_MEMBERS_SCANNED}. In addition, `/user?username=` is consulted so that a caller can pass an exact
 * username; that candidate is returned alongside the display-name matches and the shared selection logic only falls
 * back to it when no display name matched, so a username that happens to collide with someone else's display name
 * cannot hijack the row.
 *
 * If the group is larger than the scan cap, a partial scan cannot rule out a second user with the same display
 * name, so the lookup throws unless the username lookup produced the only candidate the caller could have meant.
 */
export function createConfluenceDataCenterUserLookup(
  baseUrl: string,
  config: AxiosRequestConfig,
  groupName = "confluence-users",
): ConfluenceUserLookup {
  return async (displayName: string): Promise<ConfluenceUserCandidate[]> => {
    let byUsername: ConfluenceUserCandidate | undefined;
    try {
      const response = await axiosClient.get(`${baseUrl}/user`, { ...config, params: { username: displayName } });
      const candidate = toCandidate(response.data ?? {});
      if (candidate.userKey || candidate.username) byUsername = candidate;
    } catch {
      // Not a username.
    }

    const wanted = normaliseName(displayName);
    const matches: ConfluenceUserCandidate[] = [];
    let scannedEverything = false;
    let start = 0;
    while (start < MAX_GROUP_MEMBERS_SCANNED) {
      const page = await axiosClient.get(`${baseUrl}/group/${encodeURIComponent(groupName)}/member`, {
        ...config,
        params: { start, limit: GROUP_MEMBER_PAGE_SIZE },
      });
      const results: unknown = page.data?.results;
      if (!Array.isArray(results) || results.length < GROUP_MEMBER_PAGE_SIZE) {
        scannedEverything = true;
        if (Array.isArray(results))
          matches.push(...results.map(toCandidate).filter(c => normaliseName(c.displayName) === wanted));
        break;
      }
      matches.push(
        ...(results as DataCenterUser[]).map(toCandidate).filter(c => normaliseName(c.displayName) === wanted),
      );
      start += GROUP_MEMBER_PAGE_SIZE;
    }

    if (!scannedEverything && (matches.length > 0 || !byUsername)) {
      throw new Error(
        `Group "${groupName}" has more than ${MAX_GROUP_MEMBERS_SCANNED} members, so "${displayName}" cannot be resolved unambiguously by display name. Confluence Data Center has no display-name search; provide the user's key as rowAnchor, or their exact username as rowDisplayName.`,
      );
    }

    const isDuplicate = (candidate: ConfluenceUserCandidate) =>
      matches.some(
        m => (m.userKey && m.userKey === candidate.userKey) || (m.username && m.username === candidate.username),
      );
    return byUsername && !isDuplicate(byUsername) ? [...matches, byUsername] : matches;
  };
}
