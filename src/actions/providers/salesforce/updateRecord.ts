import type {
  AuthParamsType,
  salesforceUpdateRecordFunction,
  salesforceUpdateRecordOutputType,
  salesforceUpdateRecordParamsType,
} from "../../autogen/types.js";
import { axiosClient } from "../../util/axiosClient.js";

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

    // Extract more detailed error information from Salesforce API response
    let errorMessage = "An unknown error occurred";

    if (error && typeof error === "object" && "data" in error && Array.isArray(error.data)) {
      // Salesforce API returns detailed error information in the data array
      const salesforceErrors = error.data
        .map(
          (err: { message?: string; errorCode?: string }) =>
            `${err.message || "Unknown error"} (${err.errorCode || "UNKNOWN_ERROR"})`,
        )
        .join("; ");
      errorMessage = salesforceErrors;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
};

export default updateRecord;
