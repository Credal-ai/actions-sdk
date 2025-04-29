import type {
  AuthParamsType,
  zendeskGetTicketDetailsFunction,
  zendeskGetTicketDetailsOutputType,
  zendeskGetTicketDetailsParamsType,
} from "../../autogen/types";
import { axiosClient } from "../../util/axiosClient";

const getZendeskTicketDetails: zendeskGetTicketDetailsFunction = async ({
  params,
  authParams,
}: {
  params: zendeskGetTicketDetailsParamsType;
  authParams: AuthParamsType;
}): Promise<zendeskGetTicketDetailsOutputType> => {
  const { apiKey, username } = authParams;
  const { subdomain, ticketId } = params;
  const url = `https://${subdomain}.zendesk.com/api/v2/tickets/${ticketId}.json`;

  if (!apiKey) {
    throw new Error("API key is required");
  }

  const response = await axiosClient.request({
    url: url,
    method: "GET",
    auth: {
      username: `${username}/token`,
      password: apiKey,
    },
    headers: {
      "Content-Type": "application/json",
    },
  });
  return {
    ticket: response.data.ticket,
  };
};

export default getZendeskTicketDetails;
