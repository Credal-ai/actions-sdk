import axios from "axios";
import type {
  AuthParamsType,
  googleOauthGetSpreadsheetMetadataFunction,
  googleOauthGetSpreadsheetMetadataOutputType,
  googleOauthGetSpreadsheetMetadataParamsType,
} from "../../autogen/types.js";
import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants.js";

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

  try {
    const response = await axios.get(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, {
      headers: { Authorization: `Bearer ${authParams.authToken}` },
      params: {
        fields: "spreadsheetId,properties/title,sheets/properties(sheetId,title,index)",
      },
    });

    if (response.status < 200 || response.status >= 300) {
      return { success: false, error: response.statusText };
    }

    return {
      success: true,
      spreadsheetId: response.data.spreadsheetId,
      spreadsheetTitle: response.data.properties?.title,
      sheets: (response.data.sheets || []).map((sheet: { properties?: { sheetId?: number; title?: string; index?: number } }) => ({
        sheetId: sheet.properties?.sheetId,
        title: sheet.properties?.title,
        index: sheet.properties?.index,
        // `gid` in Google Sheets URLs maps to the same numeric identifier as `sheetId`.
        gid: sheet.properties?.sheetId,
      })),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

export default getSpreadsheetMetadata;
