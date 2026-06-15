import type {
  AuthParamsType,
  smartsheetListSheetsFunction,
  smartsheetListSheetsOutputType,
} from "../../autogen/types.js";
import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants.js";
import { getSmartsheetToken, smartsheetRequest } from "./utils.js";

type ListSheetsResponse = {
  data: Array<{
    id: number;
    name: string;
    permalink: string;
  }>;
};

const listSheets: smartsheetListSheetsFunction = async ({
  authParams,
}: {
  authParams: AuthParamsType;
}): Promise<smartsheetListSheetsOutputType> => {
  const token = getSmartsheetToken(authParams);
  if (!token) throw new Error(MISSING_AUTH_TOKEN);

  try {
    const response = await smartsheetRequest<ListSheetsResponse>("/sheets?includeAll=true", token);

    return {
      success: true,
      sheets: response.data.map(sheet => ({
        id: String(sheet.id),
        name: sheet.name,
        permalink: sheet.permalink,
      })),
    };
  } catch (error) {
    console.error("Error listing Smartsheet sheets:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

export default listSheets;
