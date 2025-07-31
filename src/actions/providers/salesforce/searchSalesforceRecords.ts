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
  const dateFieldExists = fieldsToSearch.includes("CreatedDate");
  const url = `${baseUrl}/services/data/v64.0/search/?q=${encodeURIComponent(
    `FIND {${keyword}} RETURNING ${recordType} (${fieldsToSearch.join(", ") + (dateFieldExists ? " ORDER BY CreatedDate DESC" : "")}) LIMIT ${params.limit && params.limit <= maxLimit ? params.limit : maxLimit}`,
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
          record.Article_Body__c = record.Article_Body__c
            // Convert links to text (URL) format
            .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, "$2 ($1)")
            // Add line breaks for block elements
            .replace(/<\/?(p|div|br|h[1-6])[^>]*>/gi, "\n")
            // Remove all other HTML tags
            .replace(/<[^>]*>/g, "")
            // Clean up extra whitespace
            .replace(/\n\s*\n/g, "\n")
            .trim();
        }
      }
    }

    // Salesforce record types are confusing and non standard
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recordsWithUrl = response.data.searchRecords.map((record: any) => {
      const recordId = record.Id;
      const webUrl = recordId ? `${baseUrl}/lightning/${recordId}` : undefined;
      return {
        ...record,
        webUrl,
      };
    });

    return {
      success: true,
      searchRecords: recordsWithUrl,
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
