import { microsoftUpdateSpreadsheetDefinition } from "../../autogen/templates";
import {
  AuthParamsType,
  microsoftUpdateSpreadsheetFunction,
  microsoftUpdateSpreadsheetOutputType,
  microsoftUpdateSpreadsheetParamsType,
} from "../../autogen/types";
import { getGraphClient } from "./utils";

const updateSpreadsheet: microsoftUpdateSpreadsheetFunction = async ({
  params,
  authParams,
}: {
  params: microsoftUpdateSpreadsheetParamsType;
  authParams: AuthParamsType;
}): Promise<microsoftUpdateSpreadsheetOutputType> => {
  const { spreadsheetId, range, values, siteId } = params; // Added siteId to destructured params

  let client = undefined;
  try {
    client = await getGraphClient(authParams, microsoftUpdateSpreadsheetDefinition.scopes.join(" "));
  } catch (error) {
    return {
      success: false,
      error: "Error while authorizing: " + (error instanceof Error ? error.message : "Unknown error"),
    };
  }

  const apiEndpointPrefix = siteId ? `/sites/${siteId}` : "/me";
  if (!range.includes("!")) {
    return {
      success: false,
      error: "Invalid range format. Expected format: 'SheetName!CellRange'",
    };
  }

  const [sheetName, cellRange] = range.split("!");
  if (!sheetName || !cellRange) {
    return {
      success: false,
      error: "Invalid range format. Both sheet name and cell range must be specified.",
    };
  }

  const apiEndpoint = `${apiEndpointPrefix}/drive/items/${spreadsheetId}/workbook/worksheets/${sheetName}/range(address='${cellRange}')`;

  try {
    const response = await client.api(apiEndpoint).patch({ values });

    return {
      success: true,
      updatedRange: response.address,
    };
  } catch (error) {
    console.error("Error updating spreadsheet:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
};

export default updateSpreadsheet;
