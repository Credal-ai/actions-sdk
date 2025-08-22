import type {
  AuthParamsType,
  salesforceGetSalesforceRecordsByQueryFunction,
  salesforceGetSalesforceRecordsByQueryOutputType,
  salesforceGetSalesforceRecordsByQueryParamsType,
} from "../../autogen/types.js";
import { ApiError, axiosClient } from "../../util/axiosClient.js";

const MAX_RECORDS_LIMIT = 2000;

const getSalesforceRecordsByQuery: salesforceGetSalesforceRecordsByQueryFunction = async ({
  params,
  authParams,
}: {
  params: salesforceGetSalesforceRecordsByQueryParamsType;
  authParams: AuthParamsType;
}): Promise<salesforceGetSalesforceRecordsByQueryOutputType> => {
  const { authToken, baseUrl } = authParams;
  const { query, limit } = params;

  if (!authToken || !baseUrl) {
    return {
      success: false,
      error: "authToken and baseUrl are required for Salesforce API",
    };
  }
  // Included a prepended space and an opening bracket to make sure these terms don't get confused
  // with parts of other words.
  const aggregateFunction = [" COUNT(", " SUM(", " AVG(", " MIN(", " MAX("];
  const containsAggregateFunction = aggregateFunction.some(func => query.toUpperCase().includes(func));
  
  let finalQuery = query;
  
  if (!containsAggregateFunction) {
    // Strip out existing LIMIT clause if it exists
    const limitRegex = /\bLIMIT\s+(\d+)\b/i;
    const existingLimitMatch = query.match(limitRegex);
    const queryLimit = existingLimitMatch ? parseInt(existingLimitMatch[1], 10) : null;
    const queryWithoutLimit = query.replace(limitRegex, '').trim();
    
    // Recompute final limit
    const finalLimit = Math.min(limit ?? queryLimit ?? MAX_RECORDS_LIMIT, MAX_RECORDS_LIMIT);
    
    // Add limit back to final query
    finalQuery = queryWithoutLimit + " LIMIT " + finalLimit;
  }
  
  const url = `${baseUrl}/services/data/v56.0/queryAll?q=${encodeURIComponent(finalQuery)}`;

  try {
    const response = await axiosClient.get(url, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    // Salesforce record types are confusing and non standard
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recordsWithUrl = response.data.records?.map((record: any) => {
      const recordId = record.Id;
      const webUrl = recordId ? `${baseUrl}/lightning/r/${recordId}/view` : undefined;
      return {
        ...record,
        webUrl,
      };
    });

    return {
      success: true,
      records: { ...response.data, records: response.data.records ? recordsWithUrl : undefined },
    };
  } catch (error) {
    console.error("Error retrieving Salesforce record:", error);
    return {
      success: false,
      error:
        error instanceof ApiError
          ? error.data.length > 0
            ? error.data[0].message
            : error.message
          : "An unknown error occurred",
    };
  }
};

export default getSalesforceRecordsByQuery;
