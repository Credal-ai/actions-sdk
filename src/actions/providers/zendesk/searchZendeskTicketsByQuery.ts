import type {
  AuthParamsType,
  zendeskSearchZendeskTicketsByQueryFunction,
  zendeskSearchZendeskTicketsByQueryOutputType,
  zendeskSearchZendeskTicketsByQueryParamsType,
} from "../../autogen/types.js";
import { createAxiosClientWithRetries } from "../../util/axiosClient.js";
import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants.js";
import { compactZendeskTickets, getTicketFieldNames } from "./utils/compactTicket.js";
import { getZendeskBaseUrl } from "./utils/getZendeskBaseUrl.js";

const searchZendeskTicketsByQuery: zendeskSearchZendeskTicketsByQueryFunction = async ({
  params,
  authParams,
}: {
  params: zendeskSearchZendeskTicketsByQueryParamsType;
  authParams: AuthParamsType;
}): Promise<zendeskSearchZendeskTicketsByQueryOutputType> => {
  const { authToken } = authParams;
  const { subdomain, query, limit = 20, page = 1, includeCustomFieldNames = true } = params;

  if (!authToken) {
    throw new Error(MISSING_AUTH_TOKEN);
  }

  const zendeskBaseUrl = getZendeskBaseUrl({ subdomain });
  const apiEndpoint = new URL("/api/v2/search.json", zendeskBaseUrl);
  const axiosClient = createAxiosClientWithRetries({ timeout: 10000, retryCount: 4 });

  // Strip any type: filters from the incoming query so it can't target other resource types,
  // then force the search to tickets only
  const sanitizedQuery = query
    .replace(/\btype:\S+/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  apiEndpoint.searchParams.set("query", `type:ticket ${sanitizedQuery}`.trim());
  apiEndpoint.searchParams.set("per_page", limit.toString());
  apiEndpoint.searchParams.set("page", page.toString());

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${authToken}`,
  };
  const response = await axiosClient.get(apiEndpoint.toString(), {
    headers,
  });

  // Defense in depth: only return results Zendesk marks as tickets
  const rawResults: unknown[] = Array.isArray(response.data.results)
    ? response.data.results.filter(
        (result: unknown) =>
          typeof result === "object" && result !== null && "result_type" in result && result.result_type === "ticket",
      )
    : [];
  const fieldNames = includeCustomFieldNames
    ? await getTicketFieldNames({
        tickets: rawResults,
        zendeskBaseUrl,
        authToken,
        axiosClient,
      })
    : new Map<number, string>();
  const compactResult = compactZendeskTickets({ tickets: rawResults, fieldNames });
  const count = typeof response.data.count === "number" ? response.data.count : rawResults.length;
  const hasMore = typeof response.data.next_page === "string" && response.data.next_page.length > 0;

  return {
    results: compactResult.tickets,
    count,
    returned_count: compactResult.tickets.length,
    has_more: hasMore,
    ...(hasMore ? { next_page: page + 1 } : {}),
    response_truncated: compactResult.responseTruncated,
  };
};

export default searchZendeskTicketsByQuery;
