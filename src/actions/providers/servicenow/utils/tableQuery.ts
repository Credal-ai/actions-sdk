import type { AuthParamsType } from "../../../autogen/types.js";
import { ApiError, axiosClient } from "../../../util/axiosClient.js";

export const DEFAULT_LIMIT = 25;
export const MAX_LIMIT = 10000;

export type ServiceNowRecord = Record<string, string>;

export interface QueryServiceNowTableArgs {
  authParams: AuthParamsType;
  tableName: string;
  fields: string[];
  filter?: string;
  baseFilter?: string;
  additionalFields?: string[];
  limit?: number;
  offset?: number;
}

export type QueryServiceNowTableResult = { records: ServiceNowRecord[] } | { error: string };

// Uses sysparm_display_value=true so choice fields (e.g. state, priority) and reference fields
// (e.g. assigned_to, request_item) come back as plain human-readable strings rather than nested
// {value, display_value} objects.
export async function queryServiceNowTable({
  authParams,
  tableName,
  fields,
  filter,
  baseFilter,
  additionalFields,
  limit = DEFAULT_LIMIT,
  offset = 0,
}: QueryServiceNowTableArgs): Promise<QueryServiceNowTableResult> {
  const { authToken, baseUrl } = authParams;
  if (!authToken || !baseUrl) {
    return { error: "authToken and baseUrl are required for the ServiceNow API" };
  }

  const cappedLimit = Math.min(limit, MAX_LIMIT);
  const allFields = additionalFields && additionalFields.length > 0 ? [...fields, ...additionalFields] : fields;
  const combinedFilter = [baseFilter, filter].filter(part => !!part).join("^");

  const queryParams = new URLSearchParams();
  queryParams.append("sysparm_limit", cappedLimit.toString());
  queryParams.append("sysparm_offset", offset.toString());
  queryParams.append("sysparm_display_value", "true");
  queryParams.append("sysparm_fields", allFields.join(","));
  if (combinedFilter) {
    queryParams.append("sysparm_query", combinedFilter);
  }

  const url = `${baseUrl.replace(/\/+$/, "")}/api/now/table/${encodeURIComponent(tableName)}?${queryParams.toString()}`;

  try {
    const response = await axiosClient.get(url, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${authToken}`,
      },
    });
    return { records: response.data.result };
  } catch (error) {
    console.error(`Error querying ServiceNow table ${tableName}:`, error);
    return { error: error instanceof ApiError ? error.message : "An unknown error occurred" };
  }
}

export function computeTimeToResolutionMinutes(openedAt?: string, closedAt?: string): number | undefined {
  if (!openedAt || !closedAt) {
    return undefined;
  }
  const openedMs = new Date(openedAt).getTime();
  const closedMs = new Date(closedAt).getTime();
  if (Number.isNaN(openedMs) || Number.isNaN(closedMs) || closedMs < openedMs) {
    return undefined;
  }
  return Math.round((closedMs - openedMs) / 60000);
}

export function extractAdditionalFields(
  record: ServiceNowRecord,
  additionalFields?: string[],
): Record<string, string> | undefined {
  if (!additionalFields || additionalFields.length === 0) {
    return undefined;
  }
  const extra: Record<string, string> = {};
  for (const field of additionalFields) {
    if (record[field] !== undefined) {
      extra[field] = record[field];
    }
  }
  return extra;
}
