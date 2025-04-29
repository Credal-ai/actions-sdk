import type {
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
  const { apiKey, username } = authParams;
  const { subdomain, ticketId, comment } = params;
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
        comment: comment,
      },
    },
  });
};

export default addCommentToTicket;
