import { axiosClient } from "../../util/axiosClient.js";
import type {
  AuthParamsType,
  googleOauthQueryGoogleBigQueryFunction,
  googleOauthQueryGoogleBigQueryParamsType,
  googleOauthQueryGoogleBigQueryOutputType,
} from "../../autogen/types.js";
import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants.js";

interface BigQueryJobResponse {
  jobReference: {
    jobId: string;
    projectId: string;
  };
  status: {
    state: string;
    errorResult?: {
      reason: string;
      message: string;
    };
    errors?: Array<{
      reason: string;
      message: string;
    }>;
  };
}

interface BigQueryResultsResponse {
  totalRows: string;
  schema: {
    fields: Array<{
      name: string;
      type: string;
      mode: string;
    }>;
  };
  rows?: Array<{
    f: Array<{
      v: unknown;
    }>;
  }>;
  jobComplete: boolean;
  errors?: Array<{
    reason: string;
    message: string;
  }>;
}

const queryGoogleBigQuery: googleOauthQueryGoogleBigQueryFunction = async ({
  params,
  authParams,
}: {
  params: googleOauthQueryGoogleBigQueryParamsType;
  authParams: AuthParamsType;
}): Promise<googleOauthQueryGoogleBigQueryOutputType> => {
  if (!authParams.authToken) {
    return { success: false, error: MISSING_AUTH_TOKEN };
  }

  const { query, projectId, maxResults = 1000, timeoutMs = 30000, maximumBytesProcessed = "500000000" } = params;

  try {
    // Get default project ID if not provided
    let resolvedProjectId = projectId;
    if (!resolvedProjectId) {
      const projectResponse = await axiosClient.get(
        "https://bigquery.googleapis.com/bigquery/v2/projects",
        {
          headers: {
            Authorization: `Bearer ${authParams.authToken}`,
          },
        }
      );
      
      if (projectResponse.data.projects && projectResponse.data.projects.length > 0) {
        resolvedProjectId = projectResponse.data.projects[0].id;
      } else {
        return { success: false, error: "No BigQuery projects found. Please specify a projectId." };
      }
    }

    // Submit the query job
    const jobResponse = await axiosClient.post(
      `https://bigquery.googleapis.com/bigquery/v2/projects/${resolvedProjectId}/jobs`,
      {
        configuration: {
          query: {
            query: query,
            useLegacySql: false,
            maximumBytesProcessed: maximumBytesProcessed,
          },
        },
      },
      {
        headers: {
          Authorization: `Bearer ${authParams.authToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    const jobData: BigQueryJobResponse = jobResponse.data;
    const jobId = jobData.jobReference.jobId;

    // Wait for job completion with timeout
    const startTime = Date.now();
    let jobComplete = false;
    let resultsResponse: BigQueryResultsResponse;

    while (!jobComplete && Date.now() - startTime < timeoutMs) {
      const resultsRes = await axiosClient.get(
        `https://bigquery.googleapis.com/bigquery/v2/projects/${resolvedProjectId}/queries/${jobId}`,
        {
          headers: {
            Authorization: `Bearer ${authParams.authToken}`,
          },
          params: {
            maxResults: maxResults,
          },
        }
      );

      resultsResponse = resultsRes.data;
      jobComplete = resultsResponse.jobComplete;

      if (!jobComplete) {
        // Wait 1 second before checking again
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    if (!jobComplete) {
      return { success: false, error: "Query timeout exceeded" };
    }

    // Check for job errors
    if (resultsResponse!.errors && resultsResponse!.errors.length > 0) {
      const errorMessages = resultsResponse!.errors.map(err => err.message).join("; ");
      return { success: false, error: errorMessages };
    }

    // Process the results
    const schema = resultsResponse!.schema?.fields?.map(field => ({
      name: field.name,
      type: field.type,
      mode: field.mode,
    })) || [];

    const data = resultsResponse!.rows?.map(row => {
      const rowData: { [key: string]: unknown } = {};
      row.f.forEach((cell, index) => {
        const fieldName = schema[index]?.name || `column_${index}`;
        rowData[fieldName] = cell.v;
      });
      return rowData;
    }) || [];

    return {
      success: true,
      data: data,
      totalRows: resultsResponse!.totalRows,
      schema: schema,
    };

  } catch (error) {
    console.error("Error querying BigQuery:", error);
    let errorMessage = "Unknown error";
    
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === "object" && error !== null && "response" in error) {
      const axiosError = error as { response?: { data?: { error?: { message?: string } }; statusText?: string } };
      if (axiosError.response?.data?.error?.message) {
        errorMessage = axiosError.response.data.error.message;
      } else if (axiosError.response?.statusText) {
        errorMessage = axiosError.response.statusText;
      }
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
};

export default queryGoogleBigQuery;