import type {
  AuthParamsType,
  servicenowGetRecordsByQueryFunction,
  servicenowGetRecordsByQueryOutputType,
  servicenowGetRecordsByQueryParamsType,
} from "../../autogen/types.js";
import { ApiError, axiosClient } from "../../util/axiosClient.js";

const DEFAULT_LIMIT = 25;

const getRecordsByQuery: servicenowGetRecordsByQueryFunction = async ({
  params,
  authParams,
}: {
  params: servicenowGetRecordsByQueryParamsType;
  authParams: AuthParamsType;
}): Promise<servicenowGetRecordsByQueryOutputType> => {
  const { authToken, baseUrl } = authParams;
  const { tableName, query, fields, limit = DEFAULT_LIMIT, offset = 0 } = params;

  if (!authToken || !baseUrl) {
    return { success: false, error: "authToken and baseUrl are required for the ServiceNow API" };
  }

  const queryParams = new URLSearchParams();
  queryParams.append("sysparm_limit", limit.toString());
  queryParams.append("sysparm_offset", offset.toString());
  // Return human-readable values alongside raw sys_ids for reference fields
  queryParams.append("sysparm_display_value", "all");
  queryParams.append("sysparm_exclude_reference_link", "true");
  if (query) {
    queryParams.append("sysparm_query", query);
  }
  if (fields && fields.length > 0) {
    queryParams.append("sysparm_fields", fields.join(","));
  }

  const url = `${baseUrl.replace(/\/+$/, "")}/api/now/table/${encodeURIComponent(tableName)}?${queryParams.toString()}`;

  try {
    const response = await axiosClient.get(url, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${authToken}`,
      },
    });
    return { success: true, records: response.data.result };
  } catch (error) {
    console.error("Error querying ServiceNow records:", error);
    return {
      success: false,
      error: error instanceof ApiError ? error.message : "An unknown error occurred",
    };
  }
};

export default getRecordsByQuery;
