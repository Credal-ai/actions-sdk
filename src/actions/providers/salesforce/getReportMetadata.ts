import type {
  AuthParamsType,
  salesforceGetReportMetadataFunction,
  salesforceGetReportMetadataOutputType,
  salesforceGetReportMetadataParamsType,
} from "../../autogen/types.js";
import { ApiError, axiosClient } from "../../util/axiosClient.js";

const getReportMetadata: salesforceGetReportMetadataFunction = async ({
  params,
  authParams,
}: {
  params: salesforceGetReportMetadataParamsType;
  authParams: AuthParamsType;
}): Promise<salesforceGetReportMetadataOutputType> => {
  const { authToken, baseUrl } = authParams;
  const { reportId } = params;

  if (!authToken || !baseUrl) {
    return { success: false, error: "authToken and baseUrl are required for Salesforce API" };
  }

  const url = `${baseUrl}/services/data/v65.0/analytics/reports/${reportId}/describe`;

  try {
    const response = await axiosClient.get(url, { headers: { Authorization: `Bearer ${authToken}` } });

    return {
      success: true,
      metadata: response.data,
    };
  } catch (error) {
    console.error("Error retrieving Salesforce report metadata:", error);
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

export default getReportMetadata;
