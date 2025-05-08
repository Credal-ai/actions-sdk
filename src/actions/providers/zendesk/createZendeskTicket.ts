import type {
  AuthParamsType,
  zendeskCreateZendeskTicketFunction,
  zendeskCreateZendeskTicketOutputType,
  zendeskCreateZendeskTicketParamsType,
} from "../../autogen/types";
import { axiosClient } from "../../util/axiosClient";
import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants";

const createZendeskTicket: zendeskCreateZendeskTicketFunction = async ({
  params,
  authParams,
}: {
  params: zendeskCreateZendeskTicketParamsType;
  authParams: AuthParamsType;
}): Promise<zendeskCreateZendeskTicketOutputType> => {
  const { authToken } = authParams;
  const { subdomain, subject, body } = params;
  const url = `https://${subdomain}.zendesk.com/api/v2/tickets.json`;
  const payload = {
    ticket: {
      subject,
      comment: {
        body,
      },
    },
  };

  if (!authToken) {
    throw new Error(MISSING_AUTH_TOKEN);
  }

  const response = await axiosClient.post(url, payload, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
  });
  return {
    ticketId: response.data.ticket.id,
    ticketUrl: `https://${subdomain}.zendesk.com/requests/${response.data.ticket.id}`,
  };
};

export default createZendeskTicket;
