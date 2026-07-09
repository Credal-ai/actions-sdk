import type {
  AuthParamsType,
  microsoftListSharepointFolderFunction,
  microsoftListSharepointFolderOutputType,
  microsoftListSharepointFolderParamsType,
} from "../../autogen/types.js";
import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants.js";
import { axiosClient } from "../../util/axiosClient.js";
import type { SharepointDriveItem } from "./utils.js";
import { MICROSOFT_GRAPH_API_URL, resolveItemFromUrl } from "./utils.js";

const DEFAULT_MAX_ITEMS = 200;
const PAGE_SIZE = 200;

function childrenUrl(driveId: string, itemId: string): string {
  const base =
    itemId === "root"
      ? `${MICROSOFT_GRAPH_API_URL}/drives/${driveId}/root/children`
      : `${MICROSOFT_GRAPH_API_URL}/drives/${driveId}/items/${itemId}/children`;
  return `${base}?$top=${PAGE_SIZE}`;
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

  const { url, driveId, itemId, recursive = false } = params;
  const maxItems = params.maxItems && params.maxItems > 0 ? params.maxItems : DEFAULT_MAX_ITEMS;

  if (!url && !(driveId && itemId)) {
    return { success: false, error: "Either url or both driveId and itemId must be provided" };
  }

  const headers = { Authorization: `Bearer ${authParams.authToken}` };

  try {
    let rootFolder: { driveId: string; itemId: string };
    if (driveId && itemId) {
      rootFolder = { driveId, itemId };
    } else {
      const resolved = await resolveItemFromUrl(authParams.authToken, url!);
      if (resolved.itemType === "file") {
        return { success: false, error: "The URL points to a file, not a folder. Use readSharepointContent instead." };
      }
      if (resolved.itemType === "page") {
        return {
          success: false,
          error: "The URL points to a site page, not a folder. Use readSharepointContent instead.",
        };
      }
      if (resolved.itemType === "site") {
        // A site URL lists the root of the site's default document library
        const driveResponse = await axiosClient.get(`${MICROSOFT_GRAPH_API_URL}/sites/${resolved.siteId}/drive`, {
          headers,
        });
        rootFolder = { driveId: driveResponse.data.id, itemId: "root" };
      } else {
        rootFolder = { driveId: resolved.driveId, itemId: resolved.itemId };
      }
    }

    const items: NonNullable<microsoftListSharepointFolderOutputType["items"]> = [];
    let truncated = false;
    const queue: { driveId: string; itemId: string }[] = [rootFolder];

    outer: while (queue.length > 0) {
      const folder = queue.shift()!;
      let nextUrl: string | undefined = childrenUrl(folder.driveId, folder.itemId);
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
