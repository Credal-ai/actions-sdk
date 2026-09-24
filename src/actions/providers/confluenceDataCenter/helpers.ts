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
  return { displayName: str(user.displayName), anchorIds: [str(user.userKey), str(user.username)] };
}

/** Page size of `/group/{name}/member`; Data Center caps it at 200. */
const GROUP_MEMBER_PAGE_SIZE = 200;
/** Upper bound on members scanned when falling back to group enumeration, to keep the action bounded on large sites. */
const MAX_GROUP_MEMBERS_SCANNED = 2000;

/**
 * Builds a lookup that resolves a Data Center user by display name.
 *
 * Data Center has no user-search API (CQL user fields and `/search/user` are Cloud-only), so this first tries an
 * exact `/user?username=` lookup (covers callers that pass a username), then scans the members of `groupName`
 * (default `confluence-users`) comparing display names case-insensitively, up to {@link MAX_GROUP_MEMBERS_SCANNED}.
 */
export function createConfluenceDataCenterUserLookup(
  baseUrl: string,
  config: AxiosRequestConfig,
  groupName = "confluence-users",
): ConfluenceUserLookup {
  return async (displayName: string): Promise<ConfluenceUserCandidate[]> => {
    try {
      const byUsername = await axiosClient.get(`${baseUrl}/user`, { ...config, params: { username: displayName } });
      const candidate = toCandidate(byUsername.data ?? {});
      if (candidate.anchorIds.some(Boolean)) return [candidate];
    } catch {
      // Not a username; fall through to the display-name scan.
    }

    const wanted = displayName.replace(/\s+/g, " ").trim().toLowerCase();
    const matches: ConfluenceUserCandidate[] = [];
    let start = 0;
    while (start < MAX_GROUP_MEMBERS_SCANNED) {
      const page = await axiosClient.get(`${baseUrl}/group/${encodeURIComponent(groupName)}/member`, {
        ...config,
        params: { start, limit: GROUP_MEMBER_PAGE_SIZE },
      });
      const results: unknown = page.data?.results;
      if (!Array.isArray(results) || results.length === 0) break;
      for (const user of results as DataCenterUser[]) {
        const candidate = toCandidate(user);
        if ((candidate.displayName ?? "").replace(/\s+/g, " ").trim().toLowerCase() === wanted) matches.push(candidate);
      }
      if (results.length < GROUP_MEMBER_PAGE_SIZE) break;
      start += GROUP_MEMBER_PAGE_SIZE;
    }
    if (matches.length === 0 && start >= MAX_GROUP_MEMBERS_SCANNED) {
      throw new Error(
        `No user named "${displayName}" found among the first ${MAX_GROUP_MEMBERS_SCANNED} members of group "${groupName}". Confluence Data Center has no display-name search; provide the user's key as rowAnchor (or their exact username as rowDisplayName) instead.`,
      );
    }
    return matches;
  };
}
