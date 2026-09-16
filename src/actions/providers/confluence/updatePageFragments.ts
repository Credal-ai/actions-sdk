import type {
  confluenceUpdatePageFragmentsFunction,
  confluenceUpdatePageFragmentsParamsType,
  confluenceUpdatePageFragmentsOutputType,
  AuthParamsType,
} from "../../autogen/types.js";
import { axiosClient } from "../../util/axiosClient.js";
import { applyConfluenceFragmentUpdates } from "../../util/confluenceStorageFormat.js";
import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants.js";
import { getConfluenceRequestConfig } from "./helpers.js";

/**
 * Server-side, deterministic partial update of a Confluence Cloud page.
 *
 * Unlike `overwritePage`, the caller never supplies the full body: the current storage-format body is
 * fetched here, the targeted cell updates / replacements are applied in code, the result is validated,
 * and only then is the full page PUT back. If anything fails the page is left untouched.
 */
const confluenceUpdatePageFragments: confluenceUpdatePageFragmentsFunction = async ({
  params,
  authParams,
}: {
  params: confluenceUpdatePageFragmentsParamsType;
  authParams: AuthParamsType;
}): Promise<confluenceUpdatePageFragmentsOutputType> => {
  const { pageId, tableCellUpdates, replacements, requiredMarkers } = params;
  const { authToken } = authParams;

  if (!authToken) {
    throw new Error(MISSING_AUTH_TOKEN);
  }

  try {
    const cloudDetails = await axiosClient.get("https://api.atlassian.com/oauth/token/accessible-resources", {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    const cloudId = cloudDetails.data[0].id;
    const baseUrl = `https://api.atlassian.com/ex/confluence/${cloudId}/api/v2`;
    const config = getConfluenceRequestConfig(baseUrl, authToken);

    // 1. Fetch the current body, title and version server-side.
    const response = await axiosClient.get(`/pages/${pageId}?body-format=storage`, config);
    const title: string = response.data.title;
    const currentVersion: number = response.data.version.number;
    const currentBody: string = response.data.body?.storage?.value ?? "";

    // 2. Apply the targeted edits deterministically and validate the result.
    const { body, cellsUpdated, replacementsApplied } = applyConfluenceFragmentUpdates(currentBody, {
      tableCellUpdates,
      replacements,
      requiredMarkers,
    });

    // 3. Save the full, minimally-changed body back to Confluence.
    const newVersion = currentVersion + 1;
    await axiosClient.put(
      `/pages/${pageId}`,
      {
        id: pageId,
        status: "current",
        title,
        body: {
          representation: "storage",
          value: body,
        },
        version: {
          number: newVersion,
        },
      },
      config,
    );

    return {
      success: true,
      pageId,
      title,
      version: newVersion,
      cellsUpdated,
      replacementsApplied,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred while updating the Confluence page.",
    };
  }
};

export default confluenceUpdatePageFragments;
