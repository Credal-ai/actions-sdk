import type {
  AuthParamsType,
  salesforceGetSalesforceRecordsByQueryFunction,
  salesforceGetSalesforceRecordsByQueryOutputType,
  salesforceGetSalesforceRecordsByQueryParamsType,
} from "../../autogen/types.js";
import { ApiError, axiosClient } from "../../util/axiosClient.js";

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

  // The API limits the maximum number of records returned to 2000, the limit lets the user set a smaller custom limit
  const url = `${baseUrl}/services/data/v56.0/queryAll?q=${encodeURIComponent(
    containsAggregateFunction ? query : query + " LIMIT " + (limit != undefined && limit <= 2000 ? limit : 2000)
  )}`;

  try {
    const response = await axiosClient.get(url, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    return {
      success: true,
      records: response.data,
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
