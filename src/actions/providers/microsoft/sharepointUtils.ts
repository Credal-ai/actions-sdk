import { ApiError, axiosClient } from "../../util/axiosClient.js";
import { MICROSOFT_GRAPH_API_URL } from "./utils.js";

export const MISSING_SITES_SCOPE_MESSAGE =
  "Missing Sites.Read.All: this token only permits file/folder access. Site, page, and site-wide search operations require re-authentication with sites scopes.";

/**
 * Encodes a URL into a Microsoft Graph share token usable with the /shares endpoint:
 * "u!" + unpadded base64url of the URL.
 */
export function encodeShareUrl(url: string): string {
  const base64 = Buffer.from(url, "utf-8").toString("base64");
  return "u!" + base64.replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
}

export type SharepointDriveItem = {
  id?: string;
  name?: string;
  webUrl?: string;
  size?: number;
  lastModifiedDateTime?: string;
  file?: { mimeType?: string };
  folder?: { childCount?: number };
  parentReference?: { driveId?: string; siteId?: string };
};

export type ResolvedSharepointItem =
  | {
      itemType: "file" | "folder";
      driveId: string;
      itemId: string;
      siteId?: string;
      name?: string;
      webUrl?: string;
      mimeType?: string;
      sizeBytes?: number;
    }
  | { itemType: "site"; siteId: string; name?: string; webUrl?: string }
  | { itemType: "page"; siteId: string; pageId?: string; name?: string; webUrl?: string };

export function isSiteScopeError(error: unknown): boolean {
  return error instanceof ApiError && (error.status === 401 || error.status === 403);
}

/** GET /sites/{hostname}:{serverRelativePath} — requires Sites.Read.All. */
async function getSiteByPath(
  hostname: string,
  serverRelativePath: string,
  headers: Record<string, string>,
): Promise<{ id: string; displayName?: string; webUrl?: string }> {
  const path = serverRelativePath.replace(/\/+$/, "");
  // An empty path means the tenant's root site, which Graph addresses without the :path suffix
  const requestUrl = path
    ? `${MICROSOFT_GRAPH_API_URL}/sites/${hostname}:${path}`
    : `${MICROSOFT_GRAPH_API_URL}/sites/${hostname}`;
  try {
    const response = await axiosClient.get(requestUrl, { headers });
    return response.data;
  } catch (error) {
    // Capability is detected by attempting the call: a 401/403 here means the token lacks site scopes
    if (isSiteScopeError(error)) {
      throw new Error(MISSING_SITES_SCOPE_MESSAGE, { cause: error });
    }
    throw error;
  }
}

type SitePageSummary = { id?: string; name?: string; title?: string; webUrl?: string };

/** Finds a site page's ID by its file name (e.g. "Home.aspx") — requires Sites.Read.All. */
async function findSitePageByName(
  siteId: string,
  pageName: string,
  headers: Record<string, string>,
): Promise<SitePageSummary | undefined> {
  const pagesUrl = `${MICROSOFT_GRAPH_API_URL}/sites/${siteId}/pages/microsoft.graph.sitePage`;
  try {
    // Try a server-side filter first to avoid enumerating every page in the site.
    // Caveat: the docs list $filter as supported, but Graph is known to silently
    // ignore name filters on this endpoint, so treat the response defensively.
    const escapedName = pageName.replace(/'/g, "''");
    const filtered: { data: { value?: SitePageSummary[]; "@odata.nextLink"?: string } } = await axiosClient.get(
      `${pagesUrl}?$filter=${encodeURIComponent(`name eq '${escapedName}'`)}`,
      { headers },
    );
    const match = (filtered.data.value ?? []).find(page => page.name?.toLowerCase() === pageName.toLowerCase());
    if (match != null) return match;
    // No match and no further pages: whether the filter was honored (empty result) or
    // ignored (we saw the complete unfiltered set), the page isn't there.
    if (filtered.data["@odata.nextLink"] == null) return undefined;
    // No match but more pages exist — the filter was likely ignored (a known Graph gap
    // for sitePage name filtering); fall through to full enumeration.
  } catch (error) {
    if (isSiteScopeError(error)) {
      throw new Error(MISSING_SITES_SCOPE_MESSAGE, { cause: error });
    }
    // Some tenants reject $filter on this endpoint outright — fall back to enumeration
    if (!(error instanceof ApiError && error.status === 400)) {
      throw error;
    }
  }

  let nextUrl: string | undefined = `${pagesUrl}?$top=100`;
  try {
    while (nextUrl) {
      const response: { data: { value?: SitePageSummary[]; "@odata.nextLink"?: string } } = await axiosClient.get(
        nextUrl,
        { headers },
      );
      const pages = response.data.value ?? [];
      const match = pages.find(page => page.name?.toLowerCase() === pageName.toLowerCase());
      if (match != null) return match;
      nextUrl = response.data["@odata.nextLink"];
    }
  } catch (error) {
    if (isSiteScopeError(error)) {
      throw new Error(MISSING_SITES_SCOPE_MESSAGE, { cause: error });
    }
    throw error;
  }
  return undefined;
}

/**
 * Resolves any pasted SharePoint/OneDrive URL (file, folder, Office web-viewer link, bare site,
 * subsite, root site, site page, OneDrive share link) to Graph identifiers.
 *
 * Resolution order: SitePages URLs go to the Pages API; everything else probes /shares first
 * (files/folders, cheap, Files.Read.All only), then falls back to site resolution on any 4xx —
 * URL shape cannot distinguish a subsite from a folder path, so probing is the only correct
 * strategy. Throws Error(MISSING_SITES_SCOPE_MESSAGE) when a site-level call fails with 401/403;
 * when both probes fail, throws a combined error naming both statuses.
 */
export async function resolveItemFromUrl(authToken: string, url: string): Promise<ResolvedSharepointItem> {
  const headers = { Authorization: `Bearer ${authToken}` };
  const parsed = new URL(url);

  // Site pages: https://{tenant}.sharepoint.com/sites/{site}/SitePages/{page}.aspx
  const sitePageMatch = parsed.pathname.match(/^(.*)\/SitePages\/([^/]+\.aspx)$/i);
  if (sitePageMatch) {
    const [, sitePath, pageFileName] = sitePageMatch;
    const pageName = decodeURIComponent(pageFileName);
    const site = await getSiteByPath(parsed.hostname, sitePath, headers);
    const page = await findSitePageByName(site.id, pageName, headers);
    return {
      itemType: "page",
      siteId: site.id,
      pageId: page?.id,
      name: page?.title ?? page?.name ?? pageName,
      webUrl: page?.webUrl ?? url,
    };
  }

  // The /shares resolver handles files, folders, Doc.aspx web-viewer links, OneDrive personal
  // and 1drv.ms share links with Files.Read.All alone
  let shareError: ApiError | undefined;
  try {
    const response = await axiosClient.get(`${MICROSOFT_GRAPH_API_URL}/shares/${encodeShareUrl(url)}/driveItem`, {
      headers,
    });
    const item: SharepointDriveItem = response.data;
    if (item?.id && item?.parentReference?.driveId) {
      return {
        itemType: item.folder ? "folder" : "file",
        driveId: item.parentReference.driveId,
        itemId: item.id,
        siteId: item.parentReference.siteId,
        name: item.name,
        webUrl: item.webUrl,
        mimeType: item.file?.mimeType,
        sizeBytes: item.size,
      };
    }
    throw new Error(`Unable to resolve URL to a drive item: ${url}`);
  } catch (error) {
    // A site is not a drive item, so /shares rejects site URLs with a 4xx. URL shape cannot
    // distinguish a subsite from a folder path, so we always probe /shares first and, on any
    // client error, fall back to resolving the path as a site. 5xx/network errors are real
    // failures and are rethrown immediately.
    if (!(error instanceof ApiError && error.status !== undefined && error.status < 500)) {
      throw error;
    }
    shareError = error;
  }

  try {
    const site = await getSiteByPath(parsed.hostname, parsed.pathname, headers);
    return { itemType: "site", siteId: site.id, name: site.displayName, webUrl: site.webUrl };
  } catch (siteError) {
    // A missing sites scope is the more actionable diagnosis — surface it as-is
    if (siteError instanceof Error && siteError.message === MISSING_SITES_SCOPE_MESSAGE) {
      throw siteError;
    }
    const siteStatus = siteError instanceof ApiError && siteError.status !== undefined ? siteError.status : "error";
    throw new Error(
      `Unable to resolve URL: not a document or folder (/shares: ${shareError?.status ?? "error"}) and not a site (/sites: ${siteStatus}): ${url}`,
      { cause: siteError },
    );
  }
}
