import type {
  AuthParamsType,
  salesforceExecuteReportFunction,
  salesforceExecuteReportOutputType,
  salesforceExecuteReportParamsType,
} from "../../autogen/types.js";
import { ApiError, axiosClient } from "../../util/axiosClient.js";

const executeReport: salesforceExecuteReportFunction = async ({
  params,
  authParams,
}: {
  params: salesforceExecuteReportParamsType;
  authParams: AuthParamsType;
}): Promise<salesforceExecuteReportOutputType> => {
  const { authToken, baseUrl } = authParams;
  const { reportId, includeDetails } = params;

  if (!authToken || !baseUrl) {
    return { success: false, error: "authToken and baseUrl are required for Salesforce API" };
  }

  const url = `${baseUrl}/services/data/v65.0/analytics/reports/${reportId}${includeDetails ? "?includeDetails=true" : ""}`;

  try {
    await axiosClient.get(url, { headers: { Authorization: `Bearer ${authToken}` } });

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error executing Salesforce report:", error);
    return {
      success: false,
      error:
        error instanceof ApiError
          ? Array.isArray(error.data) && error.data.length > 0
            ? error.data[0].message
            : error.message
          : "An unknown error occurred",
    };
  }
};

export default executeReport;
