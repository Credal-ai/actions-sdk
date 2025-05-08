import type {
  AuthParamsType,
  googleOauthUpdateSpreadsheetFunction,
  googleOauthUpdateSpreadsheetOutputType,
  googleOauthUpdateSpreadsheetParamsType,
} from "../../autogen/types";
import { axiosClient } from "../../util/axiosClient";
import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants";

/**
 *  Update a Google Spreadsheet using OAuth authentication
 *  https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets/batchUpdate
 */
const updateSpreadsheet: googleOauthUpdateSpreadsheetFunction = async ({
  params,
  authParams,
}: {
  params: googleOauthUpdateSpreadsheetParamsType;
  authParams: AuthParamsType;
}): Promise<googleOauthUpdateSpreadsheetOutputType> => {
  if (!authParams.authToken) {
    throw new Error(MISSING_AUTH_TOKEN);
  }
  const { spreadsheetId, requests } = params;
  const batchUpdateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`;

  try {
    // Update the spreadsheet with the given requests
    const response = await axiosClient.post(
      batchUpdateUrl,
      { requests, includeSpreadsheetInResponse: true },
      {
        headers: {
          Authorization: `Bearer ${authParams.authToken}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (response.status < 200 || response.status >= 300) {
      return {
        success: false,
        error: response.data.error,
      };
    }

    return {
      success: true,
      spreadsheetUrl: response.data.updatedSpreadsheet.spreadsheetUrl,
      replies: response.data.replies,
    };
  } catch (error) {
    console.error("Error updating spreadsheet", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

export default updateSpreadsheet;
