import type {
  AuthParamsType,
  smartsheetGetSheetRowsFunction,
  smartsheetGetSheetRowsOutputType,
  smartsheetGetSheetRowsParamsType,
} from "../../autogen/types.js";
import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants.js";
import type { SmartsheetColumn, SmartsheetRow } from "./utils.js";
import { getSmartsheetToken, smartsheetRequest } from "./utils.js";

type GetSheetResponse = {
  id: number;
  name: string;
  permalink: string;
  columns: SmartsheetColumn[];
  rows: SmartsheetRow[];
};

const getSheetRows: smartsheetGetSheetRowsFunction = async ({
  params,
  authParams,
}: {
  params: smartsheetGetSheetRowsParamsType;
  authParams: AuthParamsType;
}): Promise<smartsheetGetSheetRowsOutputType> => {
  const token = getSmartsheetToken(authParams);
  if (!token) throw new Error(MISSING_AUTH_TOKEN);

  try {
    const sheet = await smartsheetRequest<GetSheetResponse>(`/sheets/${params.sheetId}`, token);

    const columnTitleById = new Map(sheet.columns.map(column => [column.id, column.title]));

    return {
      success: true,
      sheet: {
        id: String(sheet.id),
        name: sheet.name,
        permalink: sheet.permalink,
        columns: sheet.columns.map(column => ({
          id: String(column.id),
          title: column.title,
          type: column.type,
          ...(column.options ? { options: column.options } : {}),
        })),
        rows: sheet.rows.map(row => {
          const cells: Record<string, string | number | boolean> = {};
          for (const cell of row.cells ?? []) {
            const title = columnTitleById.get(cell.columnId);
            const value = cell.displayValue ?? cell.value;
            if (title && value !== undefined) {
              cells[title] = value;
            }
          }
          return {
            id: String(row.id),
            rowNumber: row.rowNumber,
            cells,
          };
        }),
      },
    };
  } catch (error) {
    console.error("Error getting Smartsheet sheet rows:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

export default getSheetRows;
