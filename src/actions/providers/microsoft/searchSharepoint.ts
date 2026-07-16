import type {
  AuthParamsType,
  microsoftSearchSharepointFunction,
  microsoftSearchSharepointOutputType,
  microsoftSearchSharepointParamsType,
} from "../../autogen/types.js";
import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants.js";
import { axiosClient } from "../../util/axiosClient.js";
import { MICROSOFT_GRAPH_API_URL } from "./utils.js";
import type { SharepointDriveItem } from "./sharepointUtils.js";
import { MISSING_SITES_SCOPE_MESSAGE, isSiteScopeError, resolveItemFromUrl } from "./sharepointUtils.js";

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

/** POST /search/query, optionally KQL path-scoped — requires Sites.Read.All. */
async function searchWithSearchApi(
  query: string,
  pathScope: string | undefined,
  limit: number,
  headers: Record<string, string>,
): Promise<microsoftSearchSharepointOutputType> {
  const queryString = pathScope ? `${query} path:"${pathScope}"` : query;
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

    // Truncation is detected in two places because each sees a case the other can't:
    // here, stopping mid-page with unconsumed hits in hand (moreResultsAvailable can be
    // false then — it only signals more pages on the server, not leftovers in this page);
    for (const hit of hits) {
      if (files.length >= limit) {
        truncated = true;
        break;
      }
      files.push(mapDriveItem(hit.resource ?? {}, hit.summary));
    }
    from += hits.length;
  } while (!truncated && moreResultsAvailable && files.length < limit);

  // and here, the limit exactly consumed the page (no hit was encountered past the
  // limit, so the in-loop check never fired) while the server still has more pages.
  if (files.length >= limit && moreResultsAvailable) {
    truncated = true;
  }

  return { success: true, files: dedupeByItemIdKeepFirst(files), truncated };
}

/** Item-scoped GET /drives/{driveId}/items/{itemId}/search — works with Files.Read.All alone. */
async function searchWithinFolder(
  driveId: string,
  itemId: string,
  query: string,
  limit: number,
  headers: Record<string, string>,
): Promise<microsoftSearchSharepointOutputType> {
  const escapedQuery = encodeURIComponent(query.replace(/'/g, "''"));
  const base =
    itemId === "root"
      ? `${MICROSOFT_GRAPH_API_URL}/drives/${driveId}/root`
      : `${MICROSOFT_GRAPH_API_URL}/drives/${driveId}/items/${itemId}`;
  const files: SharepointFile[] = [];
  let truncated = false;
  let nextUrl: string | undefined = `${base}/search(q='${escapedQuery}')?$top=${SEARCH_PAGE_SIZE}`;

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

  const { query, scopeUrl } = params;
  if (params.limit != null && (!Number.isFinite(params.limit) || params.limit <= 0)) {
    return { success: false, error: "limit must be a positive number" };
  }
  const limit = params.limit ?? DEFAULT_LIMIT;
  const headers = { Authorization: `Bearer ${authParams.authToken}` };

  try {
    if (!scopeUrl) {
      try {
        return await searchWithSearchApi(query, undefined, limit, headers);
      } catch (error) {
        if (isSiteScopeError(error)) {
          return { success: false, error: MISSING_SITES_SCOPE_MESSAGE };
        }
        throw error;
      }
    }

    // Resolving the scopeUrl decides the search mode: folders and library roots use an
    // item-scoped drive search (Files.Read.All alone), sites use the path-filtered Search API
    const resolved = await resolveItemFromUrl(authParams.authToken, scopeUrl);
    if (resolved.itemType === "folder") {
      return await searchWithinFolder(resolved.driveId, resolved.itemId, query, limit, headers);
    }
    if (resolved.itemType === "site") {
      try {
        return await searchWithSearchApi(query, resolved.webUrl ?? scopeUrl, limit, headers);
      } catch (error) {
        if (isSiteScopeError(error)) {
          return { success: false, error: MISSING_SITES_SCOPE_MESSAGE };
        }
        throw error;
      }
    }
    return {
      success: false,
      error: `scopeUrl points to a ${resolved.itemType === "page" ? "site page" : "file"} — provide a folder, document library, or site URL`,
    };
  } catch (error) {
    console.error("Error searching SharePoint", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

export default searchSharepoint;
