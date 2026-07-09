import type {
  AuthParamsType,
  microsoftSearchSharepointFunction,
  microsoftSearchSharepointOutputType,
  microsoftSearchSharepointParamsType,
} from "../../autogen/types.js";
import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants.js";
import { ApiError, axiosClient } from "../../util/axiosClient.js";
import type { SharepointDriveItem } from "./utils.js";
import { MICROSOFT_GRAPH_API_URL, MISSING_SITES_SCOPE, resolveItemFromUrl } from "./utils.js";

const DEFAULT_LIMIT = 25;
const SEARCH_PAGE_SIZE = 100;

type SharepointFile = NonNullable<microsoftSearchSharepointOutputType["files"]>[number];

function mapDriveItem(item: SharepointDriveItem, snippet?: string): SharepointFile {
  return {
    itemId: item.id ?? "",
    driveId: item.parentReference?.driveId,
    name: item.name ?? "",
    mimeType: item.file?.mimeType,
    webUrl: item.webUrl,
    snippet,
    lastModified: item.lastModifiedDateTime,
  };
}

function dedupeByItemIdKeepFirst(files: SharepointFile[]): SharepointFile[] {
  const seen = new Set<string>();
  return files.filter(file => {
    if (seen.has(file.itemId)) return false;
    seen.add(file.itemId);
    return true;
  });
}

function isSiteScopeError(error: unknown): boolean {
  return error instanceof ApiError && (error.status === 401 || error.status === 403);
}

/** Tenant-wide POST /search/query — requires Sites.Read.All. */
async function searchWithSearchApi(
  query: string,
  scopeUrl: string | undefined,
  limit: number,
  headers: Record<string, string>,
): Promise<microsoftSearchSharepointOutputType> {
  const queryString = scopeUrl ? `${query} path:"${scopeUrl}"` : query;
  const files: SharepointFile[] = [];
  let truncated = false;
  let from = 0;
  let moreResultsAvailable = false;

  do {
    const response = await axiosClient.post(
      `${MICROSOFT_GRAPH_API_URL}/search/query`,
      {
        requests: [
          {
            entityTypes: ["driveItem"],
            query: { queryString },
            from,
            size: SEARCH_PAGE_SIZE,
          },
        ],
      },
      { headers },
    );
    const container = response.data?.value?.[0]?.hitsContainers?.[0];
    const hits: { resource?: SharepointDriveItem; summary?: string }[] = container?.hits ?? [];
    moreResultsAvailable = Boolean(container?.moreResultsAvailable);
    if (hits.length === 0) break;

    for (const hit of hits) {
      if (files.length >= limit) {
        truncated = true;
        break;
      }
      files.push(mapDriveItem(hit.resource ?? {}, hit.summary));
    }
    from += hits.length;
  } while (!truncated && moreResultsAvailable && files.length < limit);

  if (files.length >= limit && moreResultsAvailable) {
    truncated = true;
  }

  return { success: true, files: dedupeByItemIdKeepFirst(files), truncated };
}

/** Per-drive fallback GET /drives/{driveId}/root/search — works with Files.Read.All alone. */
async function searchSingleDrive(
  driveId: string,
  query: string,
  limit: number,
  headers: Record<string, string>,
): Promise<microsoftSearchSharepointOutputType> {
  const escapedQuery = encodeURIComponent(query.replace(/'/g, "''"));
  const files: SharepointFile[] = [];
  let truncated = false;
  let nextUrl: string | undefined =
    `${MICROSOFT_GRAPH_API_URL}/drives/${driveId}/root/search(q='${escapedQuery}')?$top=${SEARCH_PAGE_SIZE}`;

  while (!truncated && nextUrl) {
    const response: { data: { value?: SharepointDriveItem[]; "@odata.nextLink"?: string } } = await axiosClient.get(
      nextUrl,
      { headers },
    );
    const items = response.data.value ?? [];
    for (const item of items) {
      if (files.length >= limit) {
        truncated = true;
        break;
      }
      files.push(mapDriveItem(item));
    }
    nextUrl = response.data["@odata.nextLink"];
  }

  if (files.length >= limit && nextUrl) {
    truncated = true;
  }

  return { success: true, files: dedupeByItemIdKeepFirst(files), truncated };
}

const searchSharepoint: microsoftSearchSharepointFunction = async ({
  params,
  authParams,
}: {
  params: microsoftSearchSharepointParamsType;
  authParams: AuthParamsType;
}): Promise<microsoftSearchSharepointOutputType> => {
  if (!authParams.authToken) {
    return { success: false, error: MISSING_AUTH_TOKEN };
  }

  const { query, scopeUrl, driveId } = params;
  const limit = params.limit && params.limit > 0 ? params.limit : DEFAULT_LIMIT;
  const headers = { Authorization: `Bearer ${authParams.authToken}` };

  try {
    // An explicit driveId restricts the search to that drive and needs no site scopes
    if (driveId) {
      return await searchSingleDrive(driveId, query, limit, headers);
    }

    try {
      return await searchWithSearchApi(query, scopeUrl, limit, headers);
    } catch (error) {
      if (!isSiteScopeError(error)) {
        throw error;
      }
      // No site scopes: fall back to a drive-scoped search when the scopeUrl resolves to a drive
      if (scopeUrl) {
        const resolved = await resolveItemFromUrl(authParams.authToken, scopeUrl);
        if (resolved.itemType === "file" || resolved.itemType === "folder") {
          return await searchSingleDrive(resolved.driveId, query, limit, headers);
        }
      }
      return { success: false, error: MISSING_SITES_SCOPE };
    }
  } catch (error) {
    console.error("Error searching SharePoint", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

export default searchSharepoint;
