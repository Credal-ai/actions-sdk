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

  try {
    if (rows.length === 0) {
      throw new Error("rows array cannot be empty");
    }

    const sheet = sheetName ?? "Sheet1";
    const quotedSheet = /[\s'!]/.test(sheet) ? `'${sheet}'` : sheet;
    const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(quotedSheet)}:append`;

    const response = await axiosClient.post(
      appendUrl,
      {
        values: rows,
        majorDimension: "ROWS",
        range: quotedSheet,
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
