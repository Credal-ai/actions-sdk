import { axiosClient } from "../../util/axiosClient.js";
import type {
  AuthParamsType,
  googleOauthQueryGoogleBigQueryFunction,
  googleOauthQueryGoogleBigQueryParamsType,
  googleOauthQueryGoogleBigQueryOutputType,
} from "../../autogen/types.js";
import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants.js";

function hasReadOnlyQuery(query: string): boolean {
  const normalizedQuery = query
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/--.*$/gm, "")
    .trim()
    .toUpperCase();

  const writeOperations = [
    "INSERT",
    "UPDATE",
    "DELETE",
    "CREATE",
    "DROP",
    "ALTER",
    "TRUNCATE",
    "MERGE",
    "REPLACE",
    "GRANT",
    "REVOKE",
    "CALL",
    "EXECUTE",
  ];

  for (const operation of writeOperations) {
    const regex = new RegExp(`\\b${operation}\\b`, "i");
    if (regex.test(normalizedQuery)) {
      return false; // Not read-only
    }
  }

  return true; // Read-only
}

interface BigQueryQueryResponse {
  jobReference: {
    jobId: string;
    projectId: string;
  };
  totalRows: string;
  schema: {
    fields: Array<{
      name: string;
      type: string;
      mode: string;
    }>;
  };
  rows?: Array<{
    f: Array<{ v: unknown }>;
  }>;
  pageToken?: string;
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

  const { query, projectId, maxResults = 1000, timeoutMs = 30_000, maximumBytesProcessed = "500000000" } = params;

  const hasReadOnly = hasReadOnlyQuery(query);
  if (!hasReadOnly) {
    return { success: false, error: `Read-only queries only. Your query contains write operations.` };
  }

  try {
    const allRows: Array<Record<string, unknown>> = [];
    let schema: Array<{ name: string; type: string; mode: string }> = [];
    let totalRows = "0";
    let pageToken: string | undefined;
    const deadline = Date.now() + timeoutMs;

    /**
     * We loop while a pageToken is returned **and** we haven't exceeded the
     * caller‑supplied timeout.
     */
    do {
      const { data } = await axiosClient.post<BigQueryQueryResponse>(
        `https://bigquery.googleapis.com/bigquery/v2/projects/${projectId}/queries`,
        {
          query,
          useLegacySql: false,
          maximumBytesProcessed,
          maxResults,
          pageToken,
        },
        {
          headers: {
            Authorization: `Bearer ${authParams.authToken}`,
            "Content-Type": "application/json",
          },
        },
      );

      // capture schema once
      if (!schema.length && data.schema?.fields) {
        schema = data.schema.fields.map(f => ({
          name: f.name,
          type: f.type,
          mode: f.mode,
        }));
      }

      // accumulate rows
      if (data.rows?.length) {
        data.rows.forEach(row => {
          const rowObj: Record<string, unknown> = {};
          row.f.forEach((cell, idx) => {
            const fieldName = schema[idx]?.name ?? `column_${idx}`;
            rowObj[fieldName] = cell.v;
          });
          allRows.push(rowObj);
        });
      }

      totalRows = data.totalRows ?? totalRows;
      pageToken = data.pageToken;

      if (pageToken && Date.now() > deadline) {
        return {
          success: false,
          error: "Query timeout exceeded while paging through results",
        };
      }
    } while (pageToken);

    // check for any job‑level errors that API surfaced
    if (allRows.length === 0 && schema.length === 0) {
      return {
        success: false,
        error: "Query returned no data and no schema (unexpected)",
      };
    }

    return {
      success: true,
      data: allRows,
      totalRows,
      schema,
    };
  } catch (err: unknown) {
    console.error("Error querying BigQuery:", err);
    let errorMessage = "Unknown error";

    if (err instanceof Error) {
      errorMessage = err.message;
    } else if (typeof err === "object" && err !== null && "response" in err) {
      const axiosErr = err as {
        response?: { data?: { error?: { message?: string } }; statusText?: string };
      };
      if (axiosErr.response?.data?.error?.message) {
        errorMessage = axiosErr.response.data.error.message;
      } else if (axiosErr.response?.statusText) {
        errorMessage = axiosErr.response.statusText;
      }
    }

    return { success: false, error: errorMessage };
  }
};

export default queryGoogleBigQuery;
