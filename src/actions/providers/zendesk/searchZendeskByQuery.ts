import type {
  AuthParamsType,
  zendeskSearchZendeskByQueryFunction,
  zendeskSearchZendeskByQueryOutputType,
  zendeskSearchZendeskByQueryParamsType,
} from "../../autogen/types.js";
import { createAxiosClientWithRetries } from "../../util/axiosClient.js";
import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants.js";
import { getZendeskBaseUrl } from "./utils/getZendeskBaseUrl.js";

const searchZendeskByQuery: zendeskSearchZendeskByQueryFunction = async ({
  params,
  authParams,
}: {
  params: zendeskSearchZendeskByQueryParamsType;
  authParams: AuthParamsType;
}): Promise<zendeskSearchZendeskByQueryOutputType> => {
  const { authToken } = authParams;
  const { subdomain, query, objectType = "ticket", limit = 100 } = params;

  if (!authToken) {
    throw new Error(MISSING_AUTH_TOKEN);
  }

  const zendeskBaseUrl = getZendeskBaseUrl({ subdomain });
  const apiEndpoint = new URL("/api/v2/search.json", zendeskBaseUrl);
  const axiosClient = createAxiosClientWithRetries({ timeout: 10000, retryCount: 4 });

  // Build search query parameters
  apiEndpoint.searchParams.set("query", `type:${objectType} ${query}`);
  apiEndpoint.searchParams.set("per_page", limit.toString());

  const response = await axiosClient.get(apiEndpoint.toString(), {
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
