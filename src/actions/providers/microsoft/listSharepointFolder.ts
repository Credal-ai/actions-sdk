import type {
  AuthParamsType,
  microsoftListSharepointFolderFunction,
  microsoftListSharepointFolderOutputType,
  microsoftListSharepointFolderParamsType,
} from "../../autogen/types.js";
import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants.js";
import { axiosClient } from "../../util/axiosClient.js";
import { MICROSOFT_GRAPH_API_URL } from "./utils.js";
import type { SharepointDriveItem } from "./sharepointUtils.js";
import { resolveItemFromUrl } from "./sharepointUtils.js";

const DEFAULT_MAX_ITEMS = 200;
const PAGE_SIZE = 200;

function buildChildrenUrl(driveId: string, itemId: string): string {
  const base =
    itemId === "root"
      ? `${MICROSOFT_GRAPH_API_URL}/drives/${driveId}/root/children`
      : `${MICROSOFT_GRAPH_API_URL}/drives/${driveId}/items/${itemId}/children`;
  return `${base}?$top=${PAGE_SIZE}`;
}

/**
 * Resolve a pasted URL to the folder to enumerate. Throws when the URL points at
 * something that cannot be listed (file, page); the action's catch maps the message
 * onto the error output.
 */
async function resolveRootFolderFromUrl(
  authToken: string,
  url: string,
  headers: Record<string, string>,
): Promise<{ driveId: string; itemId: string }> {
  const resolved = await resolveItemFromUrl(authToken, url);
  if (resolved.itemType === "file") {
    throw new Error("The URL points to a file, not a folder. Use readSharepointContent instead.");
  }
  if (resolved.itemType === "page") {
    throw new Error("The URL points to a site page, not a folder. Use readSharepointContent instead.");
  }
  if (resolved.itemType === "site") {
    // A site URL lists the root of the site's default document library
    const driveResponse = await axiosClient.get(`${MICROSOFT_GRAPH_API_URL}/sites/${resolved.siteId}/drive`, {
      headers,
    });
    return { driveId: driveResponse.data.id, itemId: "root" };
  }
  return { driveId: resolved.driveId, itemId: resolved.itemId };
}

const listSharepointFolder: microsoftListSharepointFolderFunction = async ({
  params,
  authParams,
}: {
  params: microsoftListSharepointFolderParamsType;
  authParams: AuthParamsType;
}): Promise<microsoftListSharepointFolderOutputType> => {
  if (!authParams.authToken) {
    return { success: false, error: MISSING_AUTH_TOKEN };
  }

  const { url, driveItem, recursive = false } = params;
  if (params.maxItems != null && (!Number.isFinite(params.maxItems) || params.maxItems <= 0)) {
    return { success: false, error: "maxItems must be a positive number" };
  }
  const maxItems = params.maxItems ?? DEFAULT_MAX_ITEMS;

  if (!url && !driveItem) {
    return { success: false, error: "Either url or driveItem must be provided" };
  }

  const headers = { Authorization: `Bearer ${authParams.authToken}` };

  try {
    const rootFolder = driveItem ?? (await resolveRootFolderFromUrl(authParams.authToken, url!, headers));

    const items: NonNullable<microsoftListSharepointFolderOutputType["items"]> = [];
    let truncated = false;
    const queue: { driveId: string; itemId: string }[] = [rootFolder];

    outer: while (queue.length > 0) {
      const folder = queue.shift()!;
      let nextUrl: string | undefined = buildChildrenUrl(folder.driveId, folder.itemId);
      while (nextUrl) {
        const response: { data: { value?: SharepointDriveItem[]; "@odata.nextLink"?: string } } = await axiosClient.get(
          nextUrl,
          { headers },
        );
        const children = response.data.value ?? [];
        for (const child of children) {
          if (items.length >= maxItems) {
            truncated = true;
            break outer;
          }
          const childDriveId = child.parentReference?.driveId ?? folder.driveId;
          items.push({
            itemId: child.id ?? "",
            driveId: childDriveId,
            name: child.name ?? "",
            itemType: child.folder ? "folder" : "file",
            mimeType: child.file?.mimeType,
            sizeBytes: child.size,
            webUrl: child.webUrl,
            lastModified: child.lastModifiedDateTime,
          });
          if (recursive && child.folder && child.id) {
            queue.push({ driveId: childDriveId, itemId: child.id });
          }
        }
        nextUrl = response.data["@odata.nextLink"];
      }
    }

    return { success: true, items, truncated };
  } catch (error) {
    console.error("Error listing SharePoint folder", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

export default listSharepointFolder;
