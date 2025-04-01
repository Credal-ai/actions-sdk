import {
  AuthParamsType,
  salesforceUpdateRecordFunction,
  salesforceUpdateRecordOutputType,
  salesforceUpdateRecordParamsType,
} from "../../autogen/types";
import { axiosClient } from "../../util/axiosClient";

const updateRecord: salesforceUpdateRecordFunction = async ({
  params,
  authParams,
}: {
  params: salesforceUpdateRecordParamsType;
  authParams: AuthParamsType;
}): Promise<salesforceUpdateRecordOutputType> => {
  const { authToken, baseUrl } = authParams;
  const { objectType, recordId, fieldsToUpdate } = params;

  if (!authToken || !baseUrl) {
    return {
      success: false,
      error: "authToken and baseUrl are required for Salesforce API",
    };
  }

  const url = `${baseUrl}/services/data/v56.0/sobjects/${objectType}/${recordId}`;

  try {
    await axiosClient.patch(url, fieldsToUpdate, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
    });

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error updating Salesforce record:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
};

export default updateRecord;
