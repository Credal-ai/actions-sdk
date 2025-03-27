import {
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
  const { authToken, username } = authParams;
  const { subdomain, ticketId, assigneeEmail } = params;
  const url = `https://${subdomain}.zendesk.com/api/v2/tickets/${ticketId}.json`;

  if (!authToken) {
    throw new Error("authToken is required");
  }

  await axiosClient.request({
    url: url,
    method: "PUT",
    auth: {
      username: `${username}/token`,
      password: authToken,
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
