import {
  AuthParamsType,
  salesforceGetSalesforceRecordByNameFunction,
  salesforceGetSalesforceRecordByNameOutputType,
  salesforceGetSalesforceRecordByNameParamsType,
} from "../../autogen/types";
import { axiosClient } from "../../util/axiosClient";

const getSalesforceRecordByName: salesforceGetSalesforceRecordByNameFunction = async ({
  params,
  authParams,
}: {
  params: salesforceGetSalesforceRecordByNameParamsType;
  authParams: AuthParamsType;
}): Promise<salesforceGetSalesforceRecordByNameOutputType> => {
  const { authToken, baseUrl } = authParams;
  const { objectType, recordName, limit } = params;

  if (!authToken || !baseUrl) {
    return {
      success: false,
      error: "authToken and baseUrl are required for Salesforce API",
    };
  }

  // The API limits the maximum number of records returned to 2000, the limit lets the user set a smaller custom limit
  const MAX_RECORDS = 2000;
  const url = `${baseUrl}/services/data/v56.0/query/?q=${encodeURIComponent(`SELECT id from ${objectType} WHERE Name='${recordName}'` + " LIMIT " + (limit != undefined && limit <= MAX_RECORDS ? limit : MAX_RECORDS))}`;

  try {
    const response = await axiosClient.get(url, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    return {
      success: true,
      record: response.data,
    };
  } catch (error) {
    console.error("Error retrieving Salesforce record:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
};

export default getSalesforceRecordByName;
