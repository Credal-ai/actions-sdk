import type {
  AuthParamsType,
  googleOauthUpdateRowsInSpreadsheetFunction,
  googleOauthUpdateRowsInSpreadsheetOutputType,
  googleOauthUpdateRowsInSpreadsheetParamsType,
} from "../../autogen/types.js";
import { axiosClient } from "../../util/axiosClient.js";
import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants.js";

/**
 * Updates one or more rows in a Google Spreadsheet using OAuth authentication
 * https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets.values/update
 */
const updateRowsInSpreadsheet: googleOauthUpdateRowsInSpreadsheetFunction = async ({
  params,
  authParams,
}: {
  params: googleOauthUpdateRowsInSpreadsheetParamsType;
  authParams: AuthParamsType;
}): Promise<googleOauthUpdateRowsInSpreadsheetOutputType> => {
  if (!authParams.authToken) {
    throw new Error(MISSING_AUTH_TOKEN);
  }

  const { spreadsheetId, sheetName, startRow, rows } = params;

  const values = rows.map(row => row.map(cell => cell.stringValue));

  const endRow = startRow + rows.length - 1;
  const range = `'${sheetName ?? "Sheet1"}'!A${startRow}:ZZ${endRow}`;

  const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`;

  try {
    const response = await axiosClient.put(
      updateUrl,
      {
        values,
        majorDimension: "ROWS",
        range,
      },
      {
        headers: {
          Authorization: `Bearer ${authParams.authToken}`,
          "Content-Type": "application/json",
        },
        params: {
          valueInputOption: "USER_ENTERED",
        },
      },
    );

    const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;

    return {
      success: true,
      spreadsheetUrl,
      updatedRange: response.data.updatedRange,
      updatedRows: response.data.updatedRows,
      updatedColumns: response.data.updatedColumns,
      updatedCells: response.data.updatedCells,
    };
  } catch (error) {
    console.error("Error updating rows in spreadsheet", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

export default updateRowsInSpreadsheet;
