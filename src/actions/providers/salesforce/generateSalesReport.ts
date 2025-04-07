import type {
  AuthParamsType,
  salesforceGenerateSalesReportFunction,
  salesforceGenerateSalesReportOutputType,
  salesforceGenerateSalesReportParamsType,
} from "../../autogen/types";
import { axiosClient } from "../../util/axiosClient";

const generateSalesReport: salesforceGenerateSalesReportFunction = async ({
  params,
  authParams,
}: {
  params: salesforceGenerateSalesReportParamsType;
  authParams: AuthParamsType;
}): Promise<salesforceGenerateSalesReportOutputType> => {
  const { authToken, baseUrl } = authParams;
  const { startDate, endDate, filters } = params;

  if (!authToken || !baseUrl) {
    return {
      success: false,
      error: "authToken and baseUrl are required for Salesforce API",
    };
  }

  const query = `
    SELECT Name, Amount, CloseDate, StageName
    FROM Opportunity
    WHERE CloseDate >= ${startDate} AND CloseDate <= ${endDate}
    ${
      filters
        ? Object.entries(filters)
            .map(([key, value]) => `AND ${key} = '${value}'`)
            .join(" ")
        : ""
    }
  `;

  const url = `${baseUrl}/services/data/v56.0/query?q=${encodeURIComponent(query)}`;

  try {
    const response = await axiosClient.get(url, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    return {
      success: true,
      reportData: response.data.records,
    };
  } catch (error) {
    console.error("Error generating Salesforce sales report:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
};

export default generateSalesReport;
