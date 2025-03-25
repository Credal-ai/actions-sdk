import axios from "axios";
import {
  AuthParamsType,
  googleOauthCreateSpreadsheetFunction,
  googleOauthCreateSpreadsheetParamsType,
  googleOauthCreateSpreadsheetOutputType,
} from "../../autogen/types";

/**
 * Creates a new Google Spreadsheet using OAuth authentication
 */
export const createSpreadsheet: googleOauthCreateSpreadsheetFunction = async ({
  params,
  authParams,
}: {
  params: googleOauthCreateSpreadsheetParamsType;
  authParams: AuthParamsType;
}): Promise<googleOauthCreateSpreadsheetOutputType> => {
  if (!authParams.authToken) {
    throw new Error("authToken is required for Google Docs API");
  }

  const { title, sheets = [], properties = {} } = params;
  const baseApiUrl = "https://sheets.googleapis.com/v4/spreadsheets";

  const requestBody = {
    properties: {
      title,
      ...properties,
    },
    sheets,
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
      sheets: createdSheets.map((sheet: { sheetId: number; title: string; index: number }) => ({
        sheetId: sheet.sheetId,
        title: sheet.title,
        index: sheet.index,
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
