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

    const fullMetadata = response.data;
    const filteredMetadata = {
      reportType: fullMetadata.reportMetadata?.reportType
        ? {
            type: fullMetadata.reportMetadata.reportType.type,
            label: fullMetadata.reportMetadata.reportType.label,
          }
        : undefined,
      detailColumns: fullMetadata.reportMetadata?.detailColumns,
      reportFilters: fullMetadata.reportMetadata?.reportFilters,
      reportBooleanFilter: fullMetadata.reportMetadata?.reportBooleanFilter,
      standardDateFilter: fullMetadata.reportMetadata?.standardDateFilter,
      groupingsDown: fullMetadata.reportMetadata?.groupingsDown,
      groupingsAcross: fullMetadata.reportMetadata?.groupingsAcross,
      scope: fullMetadata.reportMetadata?.scope,
    };

    return {
      success: true,
      metadata: filteredMetadata,
    };
  } catch (error) {
    console.error("Error retrieving Salesforce report metadata:", error);
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

export default getReportMetadata;
