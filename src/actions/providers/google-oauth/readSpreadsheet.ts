import axios from "axios";
import type {
  AuthParamsType,
  googleOauthReadSpreadsheetFunction,
  googleOauthReadSpreadsheetParamsType,
  googleOauthReadSpreadsheetOutputType,
} from "../../autogen/types.js";
import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants.js";

/**
 * Reads data from a specified range in an existing Google Spreadsheet using OAuth authentication
 * Uses Google Sheets API v4: https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets.values/get
 */
const readSpreadsheet: googleOauthReadSpreadsheetFunction = async ({
  params,
  authParams,
}: {
  params: googleOauthReadSpreadsheetParamsType;
  authParams: AuthParamsType;
}): Promise<googleOauthReadSpreadsheetOutputType> => {
  if (!authParams.authToken) {
    throw new Error(MISSING_AUTH_TOKEN);
  }

  const { spreadsheetId, range = "A1:Z1000", sheetName, includeHeaders = true } = params;
  
  // Construct the range - if sheetName is provided, prepend it
  const fullRange = sheetName ? `${sheetName}!${range}` : range;
  
  // Encode the range for URL safety
  const encodedRange = encodeURIComponent(fullRange);
  
  const baseApiUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodedRange}`;

  try {
    const response = await axios.get(baseApiUrl, {
      headers: {
        Authorization: `Bearer ${authParams.authToken}`,
      },
      params: {
        // Include additional query parameters for better data handling
        valueRenderOption: "FORMATTED_VALUE", // Get formatted values (dates, numbers as displayed)
        dateTimeRenderOption: "FORMATTED_STRING", // Get dates as formatted strings
      },
    });

    if (response.status < 200 || response.status >= 300) {
      return {
        success: false,
        error: response.statusText,
      };
    }

    const { values = [], range: actualRange } = response.data;
    
    // Process the data based on includeHeaders flag
    let headers: string[] = [];
    let data: string[][] = values;
    
    if (includeHeaders && values.length > 0) {
      headers = values[0] || [];
      data = values.slice(1);
    }

    return {
      success: true,
      spreadsheetId,
      range: actualRange || fullRange,
      values: data,
      headers: includeHeaders ? headers : undefined,
      rowCount: data.length,
      columnCount: data.length > 0 ? Math.max(...data.map(row => row.length)) : 0,
    };
  } catch (error) {
    console.error("Error reading spreadsheet:", error);
    
    // Handle specific Google Sheets API errors
    if (axios.isAxiosError(error) && error.response) {
      const { status, data } = error.response;
      
      if (status === 404) {
        return {
          success: false,
          error: "Spreadsheet not found or you don't have access to it",
        };
      }
      
      if (status === 400) {
        return {
          success: false,
          error: `Invalid range or spreadsheet format: ${data.error?.message || "Bad request"}`,
        };
      }
      
      if (status === 403) {
        return {
          success: false,
          error: "Insufficient permissions to read this spreadsheet",
        };
      }
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

export default readSpreadsheet;