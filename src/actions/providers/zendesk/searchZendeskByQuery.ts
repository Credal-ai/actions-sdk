import type {
  AuthParamsType,
  zendeskSearchZendeskByQueryFunction,
  zendeskSearchZendeskByQueryOutputType,
  zendeskSearchZendeskByQueryParamsType,
} from "../../autogen/types.js";
import { createAxiosClientWithRetries } from "../../util/axiosClient.js";
import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants.js";

const searchZendeskByQuery: zendeskSearchZendeskByQueryFunction = async ({
  params,
  authParams,
}: {
  params: zendeskSearchZendeskByQueryParamsType;
  authParams: AuthParamsType;
}): Promise<zendeskSearchZendeskByQueryOutputType> => {
  const { authToken } = authParams;
  const { subdomain, query, objectType = "ticket", limit = 100 } = params;

  // Endpoint for searching Zendesk objects
  const url = `https://${subdomain}.zendesk.com/api/v2/search.json`;

  if (!authToken) {
    throw new Error(MISSING_AUTH_TOKEN);
  }
  const axiosClient = createAxiosClientWithRetries({ timeout: 10000, retryCount: 4 });

  // Build search query parameters
  const queryParams = new URLSearchParams();
  queryParams.append("query", `type:${objectType} ${query}`);
  queryParams.append("per_page", limit.toString());

  const response = await axiosClient.get(`${url}?${queryParams.toString()}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
  });

  return {
    results: response.data.results,
    count: response.data.count,
  };
};

export default searchZendeskByQuery;
