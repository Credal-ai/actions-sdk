import axios from "axios";
import type {
  AuthParamsType,
  googleOauthCreateSpreadsheetFunction,
  googleOauthCreateSpreadsheetParamsType,
  googleOauthCreateSpreadsheetOutputType,
} from "../../autogen/types";

/**
 * Creates a new Google Spreadsheet using OAuth authentication
 */
const createSpreadsheet: googleOauthCreateSpreadsheetFunction = async ({
  params,
  authParams,
}: {
  params: googleOauthCreateSpreadsheetParamsType;
  authParams: AuthParamsType;
}): Promise<googleOauthCreateSpreadsheetOutputType> => {
  if (!authParams.authToken) {
    throw new Error("authToken is required for Google Sheets API");
  }

  const { title, sheets = [], properties = {} } = params;
  const baseApiUrl = "https://sheets.googleapis.com/v4/spreadsheets";

  const requestBody = {
    properties: {
      title,
      ...properties,
    },
    sheets: sheets.map(sheet => ({ properties: sheet })),
  };

  try {
    const response = await axios.post(baseApiUrl, requestBody, {
      headers: {
        Authorization: `Bearer ${authParams.authToken}`,
      },
    });

    if (response.status < 200 || response.status >= 300) {
      return {
        success: false,
        error: response.statusText,
      };
    }

    const { spreadsheetId, sheets: createdSheets } = response.data;
    const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;

    return {
      success: true,
      spreadsheetId,
      spreadsheetUrl,
      sheets: createdSheets.map((sheet: { properties: { sheetId: number; title: string; index: number } }) => ({
        sheetId: sheet.properties.sheetId,
        title: sheet.properties.title,
        index: sheet.properties.index,
      })),
    };
  } catch (error) {
    console.error("Error creating spreadsheet:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

export default createSpreadsheet;
