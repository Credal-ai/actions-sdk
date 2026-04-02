import type {
  AuthParamsType,
  googleOauthGetSpreadsheetMetadataFunction,
  googleOauthGetSpreadsheetMetadataOutputType,
  googleOauthGetSpreadsheetMetadataParamsType,
} from "../../autogen/types.js";
import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants.js";
import { createAxiosClientWithTimeout } from "../../util/axiosClient.js";

/**
 * Fetches metadata for a Google Sheets spreadsheet — title and the list of
 * sheets (name, sheetId, and tab index) — without downloading any cell data.
 *
 * Use this action to discover sheet names and their numeric sheetId values
 * before performing targeted reads or writes. The `sheetId` returned for each
 * sheet is the same integer that appears as `#gid=<n>` in the spreadsheet URL.
 *
 * @param params.spreadsheetId - The ID of the spreadsheet (from its URL)
 * @param authParams.authToken - OAuth2 bearer token with Sheets read scope
 * @returns Spreadsheet title and an array of sheet descriptors, or an error
 */
const getSpreadsheetMetadata: googleOauthGetSpreadsheetMetadataFunction = async ({
  params,
  authParams,
}: {
  params: googleOauthGetSpreadsheetMetadataParamsType;
  authParams: AuthParamsType;
}): Promise<googleOauthGetSpreadsheetMetadataOutputType> => {
  if (!authParams.authToken) {
    return { success: false, error: MISSING_AUTH_TOKEN };
  }

  const { spreadsheetId } = params;
  const axiosClient = createAxiosClientWithTimeout(15_000);

  try {
    const response = await axiosClient.get(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`,
      {
        headers: { Authorization: `Bearer ${authParams.authToken}` },
        params: {
          fields: "spreadsheetId,properties/title,sheets/properties(sheetId,title,index)",
        },
      },
    );

    return {
      success: true,
      spreadsheetId: response.data.spreadsheetId,
      spreadsheetTitle: response.data.properties?.title,
      sheets: (response.data.sheets || []).map(
        (sheet: { properties?: { sheetId?: number; title?: string; index?: number } }) => ({
          sheetId: sheet.properties?.sheetId,
          title: sheet.properties?.title,
          /** 0-based position of this sheet in the spreadsheet tab order */
          index: sheet.properties?.index,
        }),
      ),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

export default getSpreadsheetMetadata;
