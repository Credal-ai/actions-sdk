import type {
  AuthParamsType,
  zendeskListZendeskTicketsFunction,
  zendeskListZendeskTicketsOutputType,
  zendeskListZendeskTicketsParamsType,
} from "../../autogen/types.js";
import { axiosClient } from "../../util/axiosClient.js";
import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants.js";

const listZendeskTickets: zendeskListZendeskTicketsFunction = async ({
  params,
  authParams,
}: {
  params: zendeskListZendeskTicketsParamsType;
  authParams: AuthParamsType;
}): Promise<zendeskListZendeskTicketsOutputType> => {
  const { authToken } = authParams;
  const { subdomain, status } = params;

  // Calculate date 3 months ago from now
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  const formattedDate = threeMonthsAgo.toISOString().split("T")[0];

  // Endpoint for getting tickets
  const url = `https://${subdomain}.zendesk.com/api/v2/tickets.json`;

  if (!authToken) {
    throw new Error(MISSING_AUTH_TOKEN);
  }

  // Add query parameters for filtering
  const queryParams = new URLSearchParams();
  queryParams.append("created_after", formattedDate);

  if (status) {
    queryParams.append("status", status);
  }

  const response = await axiosClient.get(`${url}?${queryParams.toString()}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
  });

  return {
    tickets: response.data.tickets,
    count: response.data.count,
  };
};

export default listZendeskTickets;
