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

  try {
    const apiEndpointPrefix = siteId ? `/sites/${siteId}` : "/me";
    const apiEndpoint = `${apiEndpointPrefix}/drive/items/${spreadsheetId}/workbook/worksheets/${range.split("!")[0]}/range(address='${range.split("!")[1]}')`;

    const response = await client.api(apiEndpoint).patch({ values });

    return {
      success: response.status === 200,
      spreadsheetUrl: response.data.webUrl,
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
