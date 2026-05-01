import type {
  AuthParamsType,
  salesforceExecuteReportFunction,
  salesforceExecuteReportOutputType,
  salesforceExecuteReportParamsType,
} from "../../autogen/types.js";
import { ApiError, axiosClient } from "../../util/axiosClient.js";
import { log } from "../../../utils/logger.js";

interface SalesforceGrouping {
  label: string;
  value: string;
  aggregates?: unknown;
}

const executeReport: salesforceExecuteReportFunction = async ({
  params,
  authParams,
}: {
  params: salesforceExecuteReportParamsType;
  authParams: AuthParamsType;
}): Promise<salesforceExecuteReportOutputType> => {
  const { authToken, baseUrl } = authParams;
  const { reportId, includeDetails, includeSummary } = params;

  if (!authToken || !baseUrl) {
    return { success: false, error: "authToken and baseUrl are required for Salesforce API" };
  }

  const url = `${baseUrl}/services/data/v65.0/analytics/reports/${reportId}${includeDetails ? "?includeDetails=true" : ""}`;

  try {
    const response = await axiosClient.get(url, { headers: { Authorization: `Bearer ${authToken}` } });

    let summary;
    if (includeSummary && response.data) {
      summary = {
        aggregates: response.data.factMap?.aggregates || response.data.factMap?.["T!T"]?.aggregates,
        groupingsDown: response.data.groupingsDown?.groupings?.map((g: SalesforceGrouping) => ({
          label: g.label,
          value: g.value,
          aggregates: g.aggregates,
        })),
        groupingsAcross: response.data.groupingsAcross?.groupings?.map((g: SalesforceGrouping) => ({
          label: g.label,
          value: g.value,
          aggregates: g.aggregates,
        })),
        reportMetadata: {
          name: response.data.reportMetadata?.name,
          reportType: response.data.reportMetadata?.reportType?.type,
        },
      };
    }

    return {
      success: true,
      summary,
      reportData: includeDetails ? response.data : undefined,
    };
  } catch (error) {
    log.error("Error executing Salesforce report:", error);
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
