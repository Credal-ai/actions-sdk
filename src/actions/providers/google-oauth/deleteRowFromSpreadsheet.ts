import type {
  AuthParamsType,
  googleOauthDeleteRowFromSpreadsheetFunction,
  googleOauthDeleteRowFromSpreadsheetOutputType,
  googleOauthDeleteRowFromSpreadsheetParamsType,
} from "../../autogen/types.js";
import { axiosClient } from "../../util/axiosClient.js";
import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants.js";

/**
 * Deletes a row from a Google Spreadsheet using OAuth authentication
 * https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets/batchUpdate
 */
const deleteRowFromSpreadsheet: googleOauthDeleteRowFromSpreadsheetFunction = async ({
  params,
  authParams,
}: {
  params: googleOauthDeleteRowFromSpreadsheetParamsType;
  authParams: AuthParamsType;
}): Promise<googleOauthDeleteRowFromSpreadsheetOutputType> => {
  if (!authParams.authToken) {
    throw new Error(MISSING_AUTH_TOKEN);
  }

  const { spreadsheetId, sheetId, rowIndex } = params;

  const batchUpdateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`;

  try {
    const response = await axiosClient.post(
      batchUpdateUrl,
      {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: sheetId,
                dimension: "ROWS",
                startIndex: rowIndex,
                endIndex: rowIndex + 1,
              },
            },
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${authParams.authToken}`,
          "Content-Type": "application/json",
        },
      },
    );

    const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;

    return {
      success: true,
      spreadsheetUrl,
    };
  } catch (error) {
    console.error("Error deleting row from spreadsheet", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

export default deleteRowFromSpreadsheet;
