import type {
  AuthParamsType,
  googleOauthAppendRowsToSpreadsheetFunction,
  googleOauthAppendRowsToSpreadsheetOutputType,
  googleOauthAppendRowsToSpreadsheetParamsType,
} from "../../autogen/types.js";
import { axiosClient } from "../../util/axiosClient.js";
import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants.js";

/**
 * Appends rows to a Google Spreadsheet using OAuth authentication
 * https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets.values/append
 */
const appendRowsToSpreadsheet: googleOauthAppendRowsToSpreadsheetFunction = async ({
  params,
  authParams,
}: {
  params: googleOauthAppendRowsToSpreadsheetParamsType;
  authParams: AuthParamsType;
}): Promise<googleOauthAppendRowsToSpreadsheetOutputType> => {
  if (!authParams.authToken) {
    throw new Error(MISSING_AUTH_TOKEN);
  }

  const { spreadsheetId, sheetName, rows } = params;

  // Transform rows from schema format to Google Sheets API format
  // Schema: [[{ stringValue: "cell1" }, { stringValue: "cell2" }], ...]
  // API expects: [["cell1", "cell2"], ...]
  const values = rows.map(row => row.map(cell => cell.stringValue));

  const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${sheetName ?? "Sheet1"}':append`;

  try {
    const response = await axiosClient.post(
      appendUrl,
      {
        values,
        majorDimension: "ROWS",
        range: `'${sheetName}'`,
      },
      {
        headers: {
          Authorization: `Bearer ${authParams.authToken}`,
          "Content-Type": "application/json",
        },
        params: {
          valueInputOption: "USER_ENTERED",
          insertDataOption: "INSERT_ROWS",
        },
      },
    );

    if (response.status < 200 || response.status >= 300) {
      return {
        success: false,
        error: response.data.error,
      };
    }

    const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;

    return {
      success: true,
      spreadsheetUrl,
    };
  } catch (error) {
    console.error("Error appending rows to spreadsheet", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

export default appendRowsToSpreadsheet;
