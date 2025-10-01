import type {
  AuthParamsType,
  salesforceSearchAllSalesforceRecordsFunction,
  salesforceSearchAllSalesforceRecordsOutputType,
  salesforceSearchAllSalesforceRecordsParamsType,
} from "../../autogen/types.js";
import { ApiError, axiosClient } from "../../util/axiosClient.js";

const searchAllSalesforceRecords: salesforceSearchAllSalesforceRecordsFunction = async ({
  params,
  authParams,
}: {
  params: salesforceSearchAllSalesforceRecordsParamsType;
  authParams: AuthParamsType;
}): Promise<salesforceSearchAllSalesforceRecordsOutputType> => {
  const { authToken, baseUrl } = authParams;
  const { keyword, maxLimit } = params;

  if (!authToken || !baseUrl) {
    return { success: false, error: "authToken and baseUrl are required for Salesforce API" };
  }

  const maxLimitValue = maxLimit || 25;

  // Escape special characters for SOSL search
  const escapedKeyword = keyword
    .replace(/"/g, '\\"') // Escape quotes
    .replace(/-/g, "\\-"); // Escape dashes

  let customObject = "";
  if (params.usesLightningKnowledge) {
    customObject = `Knowledge__kav(Article_Body__c, Title),
      FeedItem(Id, Body, Title, ParentId, Parent.Name, CreatedBy.Name, CreatedDate, CommentCount),
      FeedComment(Id, CommentBody, FeedItemId, ParentId, CreatedBy.Name, CreatedDate),
      EmailMessage(Id, Subject, TextBody, FromAddress, ToAddress, ParentId, CreatedDate, Incoming)`;
  }
  const limitValue = params.limit && params.limit <= maxLimitValue ? params.limit : maxLimitValue;
  const soslQuery =
    `FIND {${escapedKeyword}} RETURNING ` +
    "Contact(Id, FirstName, LastName, Email, Phone, Title, Department, Account.Name, CreatedDate, LastModifiedDate), " +
    "Account(Id, Name, Type, Industry, Phone, Website, BillingCity, BillingState, Description, CreatedDate, LastModifiedDate), " +
    "Lead(Id, FirstName, LastName, Email, Company, Status, LeadSource, CreatedDate), " +
    "Opportunity(Id, Name, StageName, Amount, CloseDate, Account.Name, Description, CreatedDate), " +
    "Task(Id, Subject, Description, Status, WhatId, WhoId, ActivityDate, Account.Name), " +
    "Case(Id, Subject, Status, Priority, Origin, Account.Name, Contact.Name, Description, CreatedDate)" +
    `${customObject ? ", " + customObject : ""} LIMIT ${limitValue}`;

  const url = `${baseUrl}/services/data/v64.0/search/?q=${encodeURIComponent(soslQuery)}`;

  try {
    const response = await axiosClient.get(url, { headers: { Authorization: `Bearer ${authToken}` } });

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

    // Salesforce record types are confusing and non standard
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recordsWithUrl = response.data.searchRecords.map((record: any) => {
      const recordId = record.Id;
      const webUrl = recordId ? `${baseUrl}/lightning/r/${recordId}/view` : undefined;
      return { ...record, webUrl };
    });

    return { success: true, searchRecords: recordsWithUrl };
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

export default searchAllSalesforceRecords;
