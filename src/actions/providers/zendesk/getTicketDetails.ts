import type {
  AuthParamsType,
  zendeskGetTicketDetailsFunction,
  zendeskGetTicketDetailsOutputType,
  zendeskGetTicketDetailsParamsType,
} from "../../autogen/types.js";
import { createAxiosClientWithRetries } from "../../util/axiosClient.js";
import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants.js";

const getZendeskTicketDetails: zendeskGetTicketDetailsFunction = async ({
  params,
  authParams,
}: {
  params: zendeskGetTicketDetailsParamsType;
  authParams: AuthParamsType;
}): Promise<zendeskGetTicketDetailsOutputType> => {
  const { authToken } = authParams;
  const { subdomain, ticketId } = params;
  const url = `https://${subdomain}.zendesk.com/api/v2/tickets/${ticketId}.json`;

  if (!authToken) {
    throw new Error(MISSING_AUTH_TOKEN);
  }

  const axiosClient = createAxiosClientWithRetries({ timeout: 10000, retryCount: 4 });

  const response = await axiosClient.request({
    url: url,
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
  });
  return {
    ticket: response.data.ticket,
  };
};

export default getZendeskTicketDetails;
