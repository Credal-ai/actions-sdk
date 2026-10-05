import type { AxiosRequestConfig } from "axios";
import { axiosClient } from "../../util/axiosClient.js";
import type { ConfluenceUserCandidate, ConfluenceUserLookups } from "../../util/confluenceStorageFormat.js";
import { describeUserLookupFailure, isNotFound } from "../../util/confluenceUserLookup.js";

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
/** Upper bound on members scanned when enumerating a group, to keep the action bounded on large sites. */
const MAX_GROUP_MEMBERS_SCANNED = 2000;

const USER_LOOKUP_FAILURE_HINT =
  'The token must be allowed to view users and groups; alternatively pass the user\'s mention, e.g. ri:userkey="…", as rowAnchor.';

/**
 * Builds the user lookups for a Confluence Data Center site.
 *
 * Data Center has no user-search API (CQL user fields and `/search/user` are Cloud-only), so a display name is
 * resolved by scanning the members of `groupName` (default `confluence-users`) and comparing display names,
 * case-insensitively, up to {@link MAX_GROUP_MEMBERS_SCANNED}. If the group is larger than that, a partial scan
 * cannot rule out a second user with the same name, so the lookup throws rather than returning a possibly incomplete
 * result; callers on such sites use `rowUsername` (an exact lookup that does not involve the group) or a `rowAnchor`.
 *
 * A username is resolved with `GET /user?username=`, which is exact: a 404 means no such user, any other failure is
 * reported with its status rather than being mistaken for "not found".
 */
export function createConfluenceDataCenterUserLookups(
  baseUrl: string,
  config: AxiosRequestConfig,
  groupName = "confluence-users",
): ConfluenceUserLookups {
  return {
    byDisplayName: async (displayName: string): Promise<ConfluenceUserCandidate[]> => {
      const wanted = normaliseName(displayName);
      const matches: ConfluenceUserCandidate[] = [];
      let start = 0;
      while (start < MAX_GROUP_MEMBERS_SCANNED) {
        const request: AxiosRequestConfig = { ...config, params: { start, limit: GROUP_MEMBER_PAGE_SIZE } };
        const page = await axiosClient
          .get(`${baseUrl}/group/${encodeURIComponent(groupName)}/member`, request)
          .catch((error: unknown) => {
            throw describeUserLookupFailure(
              error,
              `display name "${displayName}" (members of group "${groupName}")`,
              USER_LOOKUP_FAILURE_HINT,
            );
          });
        const results: unknown = page.data?.results;
        if (!Array.isArray(results)) return matches;
        matches.push(
          ...(results as DataCenterUser[]).map(toCandidate).filter(c => normaliseName(c.displayName) === wanted),
        );
        if (results.length < GROUP_MEMBER_PAGE_SIZE) return matches;
        start += GROUP_MEMBER_PAGE_SIZE;
      }
      throw new Error(
        `Group "${groupName}" has more than ${MAX_GROUP_MEMBERS_SCANNED} members, so "${displayName}" cannot be resolved unambiguously by display name (a partial scan could miss a second user with the same name). Confluence Data Center has no display-name search; use rowUsername with the user's exact username, or their mention (ri:userkey="…") as rowAnchor.`,
      );
    },
    byUsername: async (username: string): Promise<ConfluenceUserCandidate[]> => {
      const request: AxiosRequestConfig = { ...config, params: { username } };
      try {
        const response = await axiosClient.get(`${baseUrl}/user`, request);
        const candidate = toCandidate(response.data ?? {});
        return candidate.userKey || candidate.username ? [candidate] : [];
      } catch (error) {
        if (isNotFound(error)) return [];
        throw describeUserLookupFailure(error, `username "${username}"`, USER_LOOKUP_FAILURE_HINT);
      }
    },
  };
}
