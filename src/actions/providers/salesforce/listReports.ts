import type {
  AuthParamsType,
  salesforceListReportsFunction,
  salesforceListReportsOutputType,
} from "../../autogen/types.js";
import { ApiError, axiosClient } from "../../util/axiosClient.js";

const listReports: salesforceListReportsFunction = async ({
  authParams,
}: {
  authParams: AuthParamsType;
}): Promise<salesforceListReportsOutputType> => {
  const { authToken, baseUrl } = authParams;

  if (!authToken || !baseUrl) {
    return { success: false, error: "authToken and baseUrl are required for Salesforce API" };
  }

  const url = `${baseUrl}/services/data/v65.0/analytics/reports`;

  try {
    const response = await axiosClient.get(url, { headers: { Authorization: `Bearer ${authToken}` } });

    return {
      success: true,
      reports: response.data,
    };
  } catch (error) {
    console.error("Error listing Salesforce reports:", error);
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

export default listReports;
