import type {
  AuthParamsType,
  salesforceCreateRecordFunction,
  salesforceCreateRecordOutputType,
  salesforceCreateRecordParamsType,
} from "../../autogen/types";
import { ApiError, axiosClient } from "../../util/axiosClient";

const createRecord: salesforceCreateRecordFunction = async ({
  params,
  authParams,
}: {
  params: salesforceCreateRecordParamsType;
  authParams: AuthParamsType;
}): Promise<salesforceCreateRecordOutputType> => {
  const { authToken, baseUrl } = authParams;
  const { objectType, fieldsToCreate } = params;

  if (!authToken || !baseUrl) {
    return {
      success: false,
      error: "authToken and baseUrl are required for Salesforce API",
    };
  }

  if (!fieldsToCreate) {
    return {
      success: false,
      error: "fieldsToCreate is required to create a Salesforce object",
    };
  }

  const url = `${baseUrl}/services/data/v56.0/sobjects/${objectType}/`;

  try {
    const response = await axiosClient.post(url, fieldsToCreate, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
    });

    return {
      success: true,
      recordId: response.data.id,
    };
  } catch (error) {
    console.error("Error creating Salesforce object:", error);
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

export default createRecord;
