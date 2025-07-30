import type {
  AuthParamsType,
  zendeskListTicketsByQueryFunction,
  zendeskListTicketsByQueryOutputType,
  zendeskListTicketsByQueryParamsType,
} from "../../autogen/types.js";
import { axiosClient } from "../../util/axiosClient.js";
import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants.js";

const listTicketsByQuery: zendeskListTicketsByQueryFunction = async ({
  params,
  authParams,
}: {
  params: zendeskListTicketsByQueryParamsType;
  authParams: AuthParamsType;
}): Promise<zendeskListTicketsByQueryOutputType> => {
  const { authToken } = authParams;
  const { subdomain, query, limit = 100 } = params;

  // Endpoint for searching tickets
  const url = `https://${subdomain}.zendesk.com/api/v2/search.json`;

  if (!authToken) {
    throw new Error(MISSING_AUTH_TOKEN);
  }

  // Build search query parameters
  const queryParams = new URLSearchParams();
  queryParams.append("query", `type:ticket ${query}`);
  queryParams.append("per_page", limit.toString());

  const response = await axiosClient.get(`${url}?${queryParams.toString()}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
  });

  return {
    tickets: response.data.results,
    count: response.data.count,
  };
};

export default listTicketsByQuery;
