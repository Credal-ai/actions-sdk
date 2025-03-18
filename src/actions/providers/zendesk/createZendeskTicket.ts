import {
  AuthParamsType,
  zendeskCreateZendeskTicketFunction,
  zendeskCreateZendeskTicketOutputType,
  zendeskCreateZendeskTicketParamsType,
} from "../../autogen/types";
import { axiosClient } from "../../util/axiosClient";

const createZendeskTicket: zendeskCreateZendeskTicketFunction = async ({
  params,
  authParams,
}: {
  params: zendeskCreateZendeskTicketParamsType;
  authParams: AuthParamsType;
}): Promise<zendeskCreateZendeskTicketOutputType> => {
  const { apiKey, username } = authParams;
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

  if (!apiKey) {
    throw new Error("API key is required");
  }

  const response = await axiosClient.post<zendeskCreateZendeskTicketOutputType>(url, payload, {
    auth: {
      username: `${username}/token`,
      password: apiKey,
    },
    headers: {
      "Content-Type": "application/json",
    },
  });
  return response.data;
};

export default createZendeskTicket;
