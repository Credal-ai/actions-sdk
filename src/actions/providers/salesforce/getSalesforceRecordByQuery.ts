import {
  AuthParamsType,
  salesforceGetSalesforceRecordsByQueryFunction,
  salesforceGetSalesforceRecordsByQueryOutputType,
  salesforceGetSalesforceRecordsByQueryParamsType,
} from "../../autogen/types";
import { axiosClient } from "../../util/axiosClient";

const getRecord: salesforceGetSalesforceRecordsByQueryFunction = async ({
  params,
  authParams,
}: {
  params: salesforceGetSalesforceRecordsByQueryParamsType;
  authParams: AuthParamsType;
}): Promise<salesforceGetSalesforceRecordsByQueryOutputType> => {
  const { authToken, baseUrl } = authParams;
  const { query } = params;

  if (!authToken || !baseUrl) {
    return {
      success: false,
      error: "authToken and baseUrl are required for Salesforce API",
    };
  }

  const uniformQuery = query.toLowerCase();
  if (uniformQuery.includes("insert") || uniformQuery.includes("update") || uniformQuery.includes("delete")) {
    return {
      success: false,
      error: "Query contains forbidden keywords (insert, update, delete). Only SELECT queries are allowed.",
    };
  }

  const url = `${baseUrl}/services/data/v56.0/query/?q=${encodeURIComponent(query)}`;

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
      error: error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
};

export default getRecord;
