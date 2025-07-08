import type {
  AuthParamsType,
  salesforceSearchSalesforceRecordsFunction,
  salesforceSearchSalesforceRecordsOutputType,
  salesforceSearchSalesforceRecordsParamsType,
} from "../../autogen/types.js";
import { ApiError, axiosClient } from "../../util/axiosClient.js";

const searchSalesforceRecords: salesforceSearchSalesforceRecordsFunction = async ({
  params,
  authParams,
}: {
  params: salesforceSearchSalesforceRecordsParamsType;
  authParams: AuthParamsType;
}): Promise<salesforceSearchSalesforceRecordsOutputType> => {
  const { authToken, baseUrl } = authParams;
  const { keyword, recordType, fieldsToSearch } = params;

  if (!authToken || !baseUrl) {
    return {
      success: false,
      error: "authToken and baseUrl are required for Salesforce API",
    };
  }
  const maxLimit = 25;
  const url = `${baseUrl}/services/data/v64.0/search/?q=${encodeURIComponent(
    `FIND {${keyword}} RETURNING ${recordType} (${fieldsToSearch.join(", ")}) LIMIT ${params.limit && params.limit <= maxLimit ? params.limit : maxLimit}`,
  )}`;

  try {
    const response = await axiosClient.get(url, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (recordType === "Knowledge__kav") {
      for (const record of response.data.searchRecords) {
        if (record.Article_Body__c) {
          record.Article_Body__c = record.Article_Body__c.replace(/<[^>]*>/g, "");
        }
      }
    }

    return {
      success: true,
      searchRecords: response.data.searchRecords,
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

export default searchSalesforceRecords;
