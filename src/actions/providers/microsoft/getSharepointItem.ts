import type {
  AuthParamsType,
  microsoftGetSharepointItemFunction,
  microsoftGetSharepointItemOutputType,
  microsoftGetSharepointItemParamsType,
} from "../../autogen/types.js";
import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants.js";
import { axiosClient } from "../../util/axiosClient.js";
import { MICROSOFT_GRAPH_API_URL, resolveItemFromUrl } from "./utils.js";

const getSharepointItem: microsoftGetSharepointItemFunction = async ({
  params,
  authParams,
}: {
  params: microsoftGetSharepointItemParamsType;
  authParams: AuthParamsType;
}): Promise<microsoftGetSharepointItemOutputType> => {
  if (!authParams.authToken) {
    return { success: false, error: MISSING_AUTH_TOKEN };
  }

  const headers = { Authorization: `Bearer ${authParams.authToken}` };

  try {
    const resolved = await resolveItemFromUrl(authParams.authToken, params.url);

    if (resolved.itemType === "site") {
      const drivesResponse = await axiosClient.get(`${MICROSOFT_GRAPH_API_URL}/sites/${resolved.siteId}/drives`, {
        headers,
      });
      const drives: { id?: string; name?: string }[] = drivesResponse.data.value ?? [];
      return {
        success: true,
        item: {
          itemType: "site",
          siteId: resolved.siteId,
          name: resolved.name,
          webUrl: resolved.webUrl,
          drives: drives.map(drive => ({ driveId: drive.id, name: drive.name })),
        },
      };
    }

    if (resolved.itemType === "page") {
      return {
        success: true,
        item: {
          itemType: "page",
          siteId: resolved.siteId,
          itemId: resolved.pageId,
          name: resolved.name,
          webUrl: resolved.webUrl,
        },
      };
    }

    return {
      success: true,
      item: {
        itemType: resolved.itemType,
        name: resolved.name,
        webUrl: resolved.webUrl,
        driveId: resolved.driveId,
        itemId: resolved.itemId,
        siteId: resolved.siteId,
        mimeType: resolved.mimeType,
        sizeBytes: resolved.sizeBytes,
      },
    };
  } catch (error) {
    console.error("Error resolving SharePoint item from URL", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

export default getSharepointItem;
