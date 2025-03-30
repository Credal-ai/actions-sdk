import {
  AuthParamsType,
  salesforceGetRecordFunction,
  salesforceGetRecordOutputType,
  salesforceGetRecordParamsType,
} from "../../autogen/types";
import { axiosClient } from "../../util/axiosClient";

const getRecord: salesforceGetRecordFunction = async ({
  params,
  authParams,
}: {
  params: salesforceGetRecordParamsType;
  authParams: AuthParamsType;
}): Promise<salesforceGetRecordOutputType> => {
  const { authToken, baseUrl } = authParams;
  const { objectType, recordId } = params;

  if (!authToken || !baseUrl) {
    return {
      success: false,
      error: "authToken and baseUrl are required for Salesforce API",
    };
  }

  const url = `${baseUrl}/services/data/v56.0/sobjects/${objectType}/${recordId}`;

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

export default getRecord;
