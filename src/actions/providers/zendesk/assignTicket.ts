import type {
  AuthParamsType,
  zendeskAssignTicketFunction,
  zendeskAssignTicketOutputType,
  zendeskAssignTicketParamsType,
} from "../../autogen/types";
import { axiosClient } from "../../util/axiosClient";

const updateTicketStatus: zendeskAssignTicketFunction = async ({
  params,
  authParams,
}: {
  params: zendeskAssignTicketParamsType;
  authParams: AuthParamsType;
}): Promise<zendeskAssignTicketOutputType> => {
  const { apiKey, username } = authParams;
  const { subdomain, ticketId, assigneeEmail } = params;
  const url = `https://${subdomain}.zendesk.com/api/v2/tickets/${ticketId}.json`;

  if (!apiKey) {
    throw new Error("API key is required");
  }

  await axiosClient.request({
    url: url,
    method: "PUT",
    auth: {
      username: `${username}/token`,
      password: apiKey,
    },
    headers: {
      "Content-Type": "application/json",
    },
    data: {
      ticket: {
        assignee_email: assigneeEmail,
      },
    },
  });
};

export default updateTicketStatus;
