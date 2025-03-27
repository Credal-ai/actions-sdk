import {
  AuthParamsType,
  zendeskAddCommentToTicketFunction,
  zendeskAddCommentToTicketOutputType,
  zendeskAddCommentToTicketParamsType,
} from "../../autogen/types";
import { axiosClient } from "../../util/axiosClient";

const addCommentToTicket: zendeskAddCommentToTicketFunction = async ({
  params,
  authParams,
}: {
  params: zendeskAddCommentToTicketParamsType;
  authParams: AuthParamsType;
}): Promise<zendeskAddCommentToTicketOutputType> => {
  const { authToken, username } = authParams;
  const { subdomain, ticketId, comment } = params;
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
        comment: comment,
      },
    },
  });
};

export default addCommentToTicket;
