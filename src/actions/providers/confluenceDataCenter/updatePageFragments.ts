import type {
  confluenceDataCenterUpdatePageFragmentsFunction,
  confluenceDataCenterUpdatePageFragmentsParamsType,
  confluenceDataCenterUpdatePageFragmentsOutputType,
  AuthParamsType,
} from "../../autogen/types.js";
import { axiosClient } from "../../util/axiosClient.js";
import { applyConfluenceFragmentUpdates, resolveRowDisplayNames } from "../../util/confluenceStorageFormat.js";
import { createConfluenceDataCenterUserLookup, getConfluenceApi } from "./helpers.js";

/**
 * Server-side, deterministic partial update of a Confluence Data Center page.
 *
 * Unlike `overwritePage`, the caller never supplies the full body: the current storage-format body is
 * fetched here, the targeted cell updates / replacements are applied in code, the result is validated,
 * and only then is the full page PUT back. If anything fails the page is left untouched.
 */
const confluenceDataCenterUpdatePageFragments: confluenceDataCenterUpdatePageFragmentsFunction = async ({
  params,
  authParams,
}: {
  params: confluenceDataCenterUpdatePageFragmentsParamsType;
  authParams: AuthParamsType;
}): Promise<confluenceDataCenterUpdatePageFragmentsOutputType> => {
  const { pageId, tableCellUpdates, replacements, requiredMarkers } = params;

  try {
    const { baseUrl, config } = getConfluenceApi(authParams);

    // 1. Fetch the current body, title and version server-side.
    const response = await axiosClient.get(`${baseUrl}/content/${pageId}?expand=body.storage,version`, config);
    const title: string = response.data.title;
    const currentVersion: number = response.data.version.number;
    const currentBody: string = response.data.body?.storage?.value ?? "";

    // 2. Turn any rowDisplayName into the user key that the storage format actually contains.
    const resolved = await resolveRowDisplayNames(
      { tableCellUpdates, replacements, requiredMarkers },
      createConfluenceDataCenterUserLookup(baseUrl, config),
      currentBody,
    );

    // 3. Apply the targeted edits deterministically and validate the result.
    const { body, cellsUpdated, replacementsApplied } = applyConfluenceFragmentUpdates(currentBody, resolved);

    // 4. Save the full, minimally-changed body back to Confluence.
    const newVersion = currentVersion + 1;
    await axiosClient.put(
      `${baseUrl}/content/${pageId}`,
      {
        id: pageId,
        type: "page",
        title,
        body: {
          storage: {
            value: body,
            representation: "storage",
          },
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
      error:
        error instanceof Error
          ? error.message
          : "An unknown error occurred while updating the Confluence Data Center page.",
    };
  }
};

export default confluenceDataCenterUpdatePageFragments;
