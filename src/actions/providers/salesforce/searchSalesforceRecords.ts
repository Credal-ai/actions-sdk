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
  const { keyword, recordType, fieldsToSearch, maxLimit } = params;
  const searchFields = Array.from(new Set([...fieldsToSearch, "Id"]));

  if (!authToken || !baseUrl) {
    return { success: false, error: "authToken and baseUrl are required for Salesforce API" };
  }

  const maxLimitValue = maxLimit || 25;
  const dateFieldExists = searchFields.includes("CreatedDate");

  // Escape special characters for SOSL search
  const escapedKeyword = keyword
    .replace(/"/g, '\\"') // Escape quotes
    .replace(/-/g, "\\-"); // Escape dashes

  const url = `${baseUrl}/services/data/v64.0/search/?q=${encodeURIComponent(
    `FIND {${escapedKeyword}} RETURNING ${recordType} (${searchFields.join(", ") + (dateFieldExists ? " ORDER BY CreatedDate DESC" : "")}) LIMIT ${params.limit && params.limit <= maxLimitValue ? params.limit : maxLimitValue}`,
  )}`;

  try {
    const response = await axiosClient.get(url, { headers: { Authorization: `Bearer ${authToken}` } });

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
    return {
      success: true,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      results: response.data.searchRecords.map((record: any) => {
        const recordId = record.Id;
        const webUrl = recordId ? `${baseUrl}/lightning/r/${recordId}/view` : undefined;
        // Try common name fields in order of preference, using only what's available
        const displayName =
          record.Name ||
          record.Title ||
          record.Subject ||
          record.CaseNumber ||
          record.AccountName ||
          record.ContactName ||
          record.Id ||
          webUrl;
        return { name: displayName, url: webUrl, contents: record };
      }),
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
