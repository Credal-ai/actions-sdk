const SMARTSHEET_API_BASE = "https://api.smartsheet.com/2.0";

export type SmartsheetColumn = {
  id: number;
  title: string;
  type: string;
  options?: string[];
};

export type SmartsheetCell = {
  columnId: number;
  value?: string | number | boolean;
  displayValue?: string;
};

export type SmartsheetRow = {
  id: number;
  rowNumber: number;
  cells?: SmartsheetCell[];
};

export function getSmartsheetToken(authParams: { apiKey?: string; authToken?: string }): string | undefined {
  return authParams.apiKey ?? authParams.authToken;
}

export async function smartsheetRequest<T>(
  path: string,
  token: string,
  init?: { method?: string; body?: unknown },
): Promise<T> {
  const response = await fetch(`${SMARTSHEET_API_BASE}${path}`, {
    method: init?.method ?? "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
  });

  const data = await response.json().catch(() => undefined);

  if (!response.ok) {
    const message =
      data && typeof data === "object" && "message" in data
        ? (data as { message: string }).message
        : response.statusText;
    throw new Error(`Smartsheet API error (status ${response.status}): ${message}`);
  }

  return data as T;
}

/**
 * Resolves a { "Column Title": value } map to the cell objects the Smartsheet API expects,
 * which address cells by numeric columnId.
 */
export async function resolveCellsByColumnTitle(
  token: string,
  sheetId: string,
  cellsByTitle: Record<string, unknown>,
): Promise<Array<{ columnId: number; value: string | number | boolean; strict: boolean }>> {
  const { data: columns } = await smartsheetRequest<{ data: SmartsheetColumn[] }>(
    `/sheets/${sheetId}/columns?includeAll=true`,
    token,
  );

  const columnIdByTitle = new Map(columns.map(c => [c.title, c.id]));

  return Object.entries(cellsByTitle).map(([title, value]) => {
    const columnId = columnIdByTitle.get(title);
    if (columnId === undefined) {
      throw new Error(
        `Column "${title}" does not exist in this sheet. Valid column titles are: ${columns.map(c => `"${c.title}"`).join(", ")}`,
      );
    }
    if (typeof value !== "string" && typeof value !== "number" && typeof value !== "boolean") {
      throw new Error(`Cell value for column "${title}" must be a string, number, or boolean`);
    }
    // strict: false lets Smartsheet coerce values (e.g. numbers into TEXT_NUMBER columns)
    return { columnId, value, strict: false };
  });
}
