import type {
  AuthParamsType,
  zendeskListZendeskTicketsFunction,
  zendeskListZendeskTicketsOutputType,
  zendeskListZendeskTicketsParamsType,
} from "../../autogen/types.js";
import { createAxiosClientWithRetries } from "../../util/axiosClient.js";
import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants.js";
import { compactZendeskTickets, isZendeskTicketSearchResult } from "./utils/compactTicket.js";
import { getZendeskBaseUrl } from "./utils/getZendeskBaseUrl.js";

const listZendeskTickets: zendeskListZendeskTicketsFunction = async ({
  params,
  authParams,
}: {
  params: zendeskListZendeskTicketsParamsType;
  authParams: AuthParamsType;
}): Promise<zendeskListZendeskTicketsOutputType> => {
  const { authToken } = authParams;
  const { subdomain, status, limit = 20, page = 1 } = params;

  // Calculate date 3 months ago from now
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  const formattedDate = threeMonthsAgo.toISOString().split("T")[0];

  if (!authToken) {
    throw new Error(MISSING_AUTH_TOKEN);
  }

  const zendeskBaseUrl = getZendeskBaseUrl({ subdomain });
  const apiEndpoint = new URL("/api/v2/search.json", zendeskBaseUrl);
  const axiosClient = createAxiosClientWithRetries({ timeout: 10000, retryCount: 4 });

  const query = [`type:ticket`, `created>${formattedDate}`, ...(status ? [`status:${status}`] : [])].join(" ");
  apiEndpoint.searchParams.set("query", query);
  apiEndpoint.searchParams.set("per_page", limit.toString());
  apiEndpoint.searchParams.set("page", page.toString());

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${authToken}`,
  };
  const response = await axiosClient.get(apiEndpoint.toString(), {
    headers,
  });
  const rawTickets = Array.isArray(response.data.results)
    ? response.data.results.filter(isZendeskTicketSearchResult)
    : [];
  const tickets = compactZendeskTickets(rawTickets);
  const count = typeof response.data.count === "number" ? response.data.count : rawTickets.length;
  const hasMore = typeof response.data.next_page === "string" && response.data.next_page.length > 0;

  return {
    tickets,
    count,
    returned_count: tickets.length,
    has_more: hasMore,
    ...(hasMore ? { next_page: page + 1 } : {}),
  };
};

export default listZendeskTickets;
