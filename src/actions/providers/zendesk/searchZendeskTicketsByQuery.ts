import type {
  AuthParamsType,
  zendeskSearchZendeskTicketsByQueryFunction,
  zendeskSearchZendeskTicketsByQueryOutputType,
  zendeskSearchZendeskTicketsByQueryParamsType,
} from "../../autogen/types.js";
import { createAxiosClientWithRetries } from "../../util/axiosClient.js";
import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants.js";

const searchZendeskTicketsByQuery: zendeskSearchZendeskTicketsByQueryFunction = async ({
  params,
  authParams,
}: {
  params: zendeskSearchZendeskTicketsByQueryParamsType;
  authParams: AuthParamsType;
}): Promise<zendeskSearchZendeskTicketsByQueryOutputType> => {
  const { authToken } = authParams;
  const { subdomain, query, limit = 100 } = params;

  // Endpoint for searching Zendesk objects
  const url = `https://${subdomain}.zendesk.com/api/v2/search.json`;

  if (!authToken) {
    throw new Error(MISSING_AUTH_TOKEN);
  }
  const axiosClient = createAxiosClientWithRetries({ timeout: 10000, retryCount: 4 });

  // Strip any type: filters from the incoming query so it can't target other resource types,
  // then force the search to tickets only
  const sanitizedQuery = query
    .replace(/\btype:\S+/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  const queryParams = new URLSearchParams();
  queryParams.append("query", `type:ticket ${sanitizedQuery}`.trim());
  queryParams.append("per_page", limit.toString());

  const response = await axiosClient.get(`${url}?${queryParams.toString()}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
  });

  // Defense in depth: only return results Zendesk marks as tickets
  const results = Array.isArray(response.data.results)
    ? response.data.results.filter((result: { result_type?: string }) => result.result_type === "ticket")
    : [];

  return {
    results,
    count: results.length,
  };
};

export default searchZendeskTicketsByQuery;
