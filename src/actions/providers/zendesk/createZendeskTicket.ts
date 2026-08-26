import type {
  AuthParamsType,
  zendeskCreateZendeskTicketFunction,
  zendeskCreateZendeskTicketOutputType,
  zendeskCreateZendeskTicketParamsType,
} from "../../autogen/types.js";
import { createAxiosClientWithRetries } from "../../util/axiosClient.js";
import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants.js";
import { getZendeskBaseUrl } from "./utils/getZendeskBaseUrl.js";

const createZendeskTicket: zendeskCreateZendeskTicketFunction = async ({
  params,
  authParams,
}: {
  params: zendeskCreateZendeskTicketParamsType;
  authParams: AuthParamsType;
}): Promise<zendeskCreateZendeskTicketOutputType> => {
  const { authToken } = authParams;
  const { subdomain, subject, body, groupId } = params;

  if (!authToken) {
    throw new Error(MISSING_AUTH_TOKEN);
  }

  const zendeskBaseUrl = getZendeskBaseUrl({ subdomain });
  const apiEndpoint = new URL("/api/v2/tickets.json", zendeskBaseUrl);
  const payload = {
    ticket: {
      subject,
      comment: {
        body,
      },
      group_id: groupId,
    },
  };

  const axiosClient = createAxiosClientWithRetries({ timeout: 10000, retryCount: 4 });

  const response = await axiosClient.post(apiEndpoint.toString(), payload, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
  });
  return {
    ticketId: response.data.ticket.id,
    ticketUrl: new URL(`/requests/${response.data.ticket.id}`, zendeskBaseUrl).toString(),
  };
};

export default createZendeskTicket;
