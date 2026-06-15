import type {
  AuthParamsType,
  smartsheetUpdateRowFunction,
  smartsheetUpdateRowOutputType,
  smartsheetUpdateRowParamsType,
} from "../../autogen/types.js";
import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants.js";
import { getSmartsheetToken, resolveCellsByColumnTitle, smartsheetRequest } from "./utils.js";

type UpdateRowsResponse = {
  result: { id: number } | Array<{ id: number }>;
};

const updateRow: smartsheetUpdateRowFunction = async ({
  params,
  authParams,
}: {
  params: smartsheetUpdateRowParamsType;
  authParams: AuthParamsType;
}): Promise<smartsheetUpdateRowOutputType> => {
  const token = getSmartsheetToken(authParams);
  if (!token) throw new Error(MISSING_AUTH_TOKEN);

  const { sheetId, rowId, cells } = params;

  try {
    const resolvedCells = await resolveCellsByColumnTitle(token, sheetId, cells);
    if (resolvedCells.length === 0) {
      return { success: false, error: "cells must contain at least one column title to value mapping" };
    }

    const response = await smartsheetRequest<UpdateRowsResponse>(`/sheets/${sheetId}/rows`, token, {
      method: "PUT",
      body: {
        id: Number(rowId),
        cells: resolvedCells,
      },
    });

    const updatedRow = Array.isArray(response.result) ? response.result[0] : response.result;

    return {
      success: true,
      rowId: updatedRow ? String(updatedRow.id) : String(rowId),
    };
  } catch (error) {
    console.error("Error updating row in Smartsheet sheet:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

export default updateRow;
