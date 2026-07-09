import { Client } from "@microsoft/microsoft-graph-client";
import type { AuthParamsType } from "../../autogen/types.js";
import { ApiError, axiosClient } from "../../util/axiosClient.js";

export async function getGraphClient(authParams: AuthParamsType): Promise<Client> {
  if (!authParams.authToken) {
    throw new Error("Missing required authentication parameters");
  }
  const accessToken = authParams.authToken;
  return Client.init({
    authProvider: done => {
      done(null, accessToken);
    },
  });
}

/**
 * Validates and sanitizes a filename for SharePoint or OneDrive.
 * @param fileName The original filename to validate and sanitize.
 * @returns A sanitized filename that is safe to use.
 */
export function validateAndSanitizeFileName(fileName: string): string {
  // Define invalid characters for SharePoint and OneDrive
  const invalidCharacters = /[~"#%&*:<>?/{|}\\]/g;

  // Replace invalid characters with an underscore
  let sanitizedFileName = fileName.replace(invalidCharacters, "_");

  // Remove leading or trailing spaces
  sanitizedFileName = sanitizedFileName.trim();

  // Replace consecutive periods with a single period
  sanitizedFileName = sanitizedFileName.replace(/\.{2,}/g, ".");

  // Ensure the filename does not exceed 400 characters
  if (sanitizedFileName.length > 400) {
    const extensionIndex = sanitizedFileName.lastIndexOf(".");
    const baseName = sanitizedFileName.slice(0, extensionIndex);
    const extension = sanitizedFileName.slice(extensionIndex);
    sanitizedFileName = baseName.slice(0, 400 - extension.length) + extension;
  }

  return sanitizedFileName;
}

export const MICROSOFT_GRAPH_API_URL = "https://graph.microsoft.com/v1.0";

export const MISSING_SITES_SCOPE =
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

function isSiteScopeError(error: unknown): boolean {
  return error instanceof ApiError && (error.status === 401 || error.status === 403);
}

/** GET /sites/{hostname}:{serverRelativePath} — requires Sites.Read.All. */
async function getSiteByPath(
  hostname: string,
  serverRelativePath: string,
  headers: Record<string, string>,
): Promise<{ id: string; displayName?: string; webUrl?: string }> {
  const path = serverRelativePath.replace(/\/$/, "");
  try {
    const response = await axiosClient.get(`${MICROSOFT_GRAPH_API_URL}/sites/${hostname}:${path}`, { headers });
    return response.data;
  } catch (error) {
    // Capability is detected by attempting the call: a 401/403 here means the token lacks site scopes
    if (isSiteScopeError(error)) {
      throw new Error(MISSING_SITES_SCOPE, { cause: error });
    }
    throw error;
  }
}

/** Finds a site page's ID by its file name (e.g. "Home.aspx") — requires Sites.Read.All. */
async function findSitePageByName(
  siteId: string,
  pageName: string,
  headers: Record<string, string>,
): Promise<{ id?: string; name?: string; title?: string; webUrl?: string } | undefined> {
  let nextUrl: string | undefined =
    `${MICROSOFT_GRAPH_API_URL}/sites/${siteId}/pages/microsoft.graph.sitePage?$top=100`;
  try {
    while (nextUrl) {
      const response: {
        data: { value?: { id?: string; name?: string; title?: string; webUrl?: string }[]; "@odata.nextLink"?: string };
      } = await axiosClient.get(nextUrl, { headers });
      const pages = response.data.value ?? [];
      const match = pages.find(page => page.name?.toLowerCase() === pageName.toLowerCase());
      if (match) return match;
      nextUrl = response.data["@odata.nextLink"];
    }
  } catch (error) {
    if (isSiteScopeError(error)) {
      throw new Error(MISSING_SITES_SCOPE, { cause: error });
    }
    throw error;
  }
  return undefined;
}

/**
 * Resolves any pasted SharePoint/OneDrive URL (file, folder, Office web-viewer link, bare site,
 * site page, OneDrive share link) to Graph identifiers. Throws Error(MISSING_SITES_SCOPE) when a
 * site-level call fails with 401/403; other failures throw the underlying error.
 */
export async function resolveItemFromUrl(authToken: string, url: string): Promise<ResolvedSharepointItem> {
  const headers = { Authorization: `Bearer ${authToken}` };
  const parsed = new URL(url);

  // Site pages: https://{tenant}.sharepoint.com/sites/{site}/SitePages/{page}.aspx
  const sitePageMatch = parsed.pathname.match(/^(.*)\/SitePages\/([^/]+\.aspx)$/i);
  if (sitePageMatch) {
    const pageName = decodeURIComponent(sitePageMatch[2]);
    const site = await getSiteByPath(parsed.hostname, sitePageMatch[1], headers);
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
    // A site is not a drive item, so /shares rejects bare site URLs with a 4xx
    const isClientError = error instanceof ApiError && error.status !== undefined && error.status < 500;
    const looksLikeSite = /^\/(sites|teams)\/[^/]+\/?$/.test(parsed.pathname);
    if (!isClientError || !looksLikeSite) {
      throw error;
    }
  }

  const site = await getSiteByPath(parsed.hostname, parsed.pathname, headers);
  return { itemType: "site", siteId: site.id, name: site.displayName, webUrl: site.webUrl };
}
