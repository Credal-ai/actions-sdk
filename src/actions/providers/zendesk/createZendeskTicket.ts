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
  const { apiKey } = authParams;
  const { subdomain, subject, body, requesterEmail } = params;
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

  try {
    const response = await axiosClient.post<zendeskCreateZendeskTicketOutputType>(url, payload, {
      auth: {
        username: `${requesterEmail}/token`,
        password: apiKey,
      },
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error creating ticket", error);
    return { ticketId: "Error" };
  }
};

export default createZendeskTicket;
