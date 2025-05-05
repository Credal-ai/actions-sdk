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
  const { authToken } = authParams;
  const { subdomain, ticketId, comment } = params;
  const url = `https://${subdomain}.zendesk.com/api/v2/tickets/${ticketId}.json`;

  if (!authToken) {
    throw new Error("Auth token is required");
  }

  await axiosClient.request({
    url: url,
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
    data: {
      ticket: {
        comment: comment,
      },
    },
  });
};

export default addCommentToTicket;
