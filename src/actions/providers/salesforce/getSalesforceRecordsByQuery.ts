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
  
  // Check if query already has a LIMIT clause with a number
  const limitRegex = /\bLIMIT\s+(\d+)\b/i;
  const existingLimitMatch = query.match(limitRegex);
  
  let finalQuery = query;
  if (containsAggregateFunction) {
    // Don't add LIMIT for aggregate functions
    finalQuery = query;
  } else if (existingLimitMatch) {
    if (limit != undefined) {
      // If limit parameter is provided, remove existing LIMIT and use the parameter
      const effectiveLimit = limit <= MAX_RECORDS_LIMIT ? limit : MAX_RECORDS_LIMIT;
      finalQuery = query.replace(limitRegex, '').trim() + " LIMIT " + effectiveLimit;
    } else {
      // No limit parameter provided, use existing LIMIT if valid and < 2000, otherwise replace
      const existingLimit = parseInt(existingLimitMatch[1], 10);
      if (isNaN(existingLimit) || existingLimit >= MAX_RECORDS_LIMIT) {
        finalQuery = query.replace(limitRegex, `LIMIT ${MAX_RECORDS_LIMIT}`);
      }
      // If existing limit is valid and < 2000, keep the query as is
    }
  } else {
    // No existing LIMIT clause, add one
    const effectiveLimit = limit != undefined && limit <= MAX_RECORDS_LIMIT ? limit : MAX_RECORDS_LIMIT;
    finalQuery = query + " LIMIT " + effectiveLimit;
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
