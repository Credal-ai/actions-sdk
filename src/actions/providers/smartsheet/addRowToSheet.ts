import type {
  AuthParamsType,
  smartsheetAddRowToSheetFunction,
  smartsheetAddRowToSheetOutputType,
  smartsheetAddRowToSheetParamsType,
} from "../../autogen/types.js";
import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants.js";
import { getSmartsheetToken, resolveCellsByColumnTitle, smartsheetRequest } from "./utils.js";

type AddRowsResponse = {
  result: { id: number } | Array<{ id: number }>;
};

const addRowToSheet: smartsheetAddRowToSheetFunction = async ({
  params,
  authParams,
}: {
  params: smartsheetAddRowToSheetParamsType;
  authParams: AuthParamsType;
}): Promise<smartsheetAddRowToSheetOutputType> => {
  const token = getSmartsheetToken(authParams);
  if (!token) throw new Error(MISSING_AUTH_TOKEN);

  const { sheetId, cells, toTop } = params;

  try {
    const resolvedCells = await resolveCellsByColumnTitle(token, sheetId, cells);
    if (resolvedCells.length === 0) {
      return { success: false, error: "cells must contain at least one column title to value mapping" };
    }

    const response = await smartsheetRequest<AddRowsResponse>(`/sheets/${sheetId}/rows`, token, {
      method: "POST",
      body: {
        ...(toTop ? { toTop: true } : { toBottom: true }),
        cells: resolvedCells,
      },
    });

    const createdRow = Array.isArray(response.result) ? response.result[0] : response.result;

    return {
      success: true,
      rowId: createdRow ? String(createdRow.id) : undefined,
    };
  } catch (error) {
    console.error("Error adding row to Smartsheet sheet:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

export default addRowToSheet;
