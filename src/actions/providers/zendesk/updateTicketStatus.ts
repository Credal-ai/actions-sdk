import type {
  AuthParamsType,
  zendeskUpdateTicketStatusFunction,
  zendeskUpdateTicketStatusOutputType,
  zendeskUpdateTicketStatusParamsType,
} from "../../autogen/types";
import { axiosClient } from "../../util/axiosClient";
import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants";

const updateTicketStatus: zendeskUpdateTicketStatusFunction = async ({
  params,
  authParams,
}: {
  params: zendeskUpdateTicketStatusParamsType;
  authParams: AuthParamsType;
}): Promise<zendeskUpdateTicketStatusOutputType> => {
  const { authToken } = authParams;
  const { subdomain, ticketId, status } = params;
  const url = `https://${subdomain}.zendesk.com/api/v2/tickets/${ticketId}.json`;

  if (!authToken) {
    throw new Error(MISSING_AUTH_TOKEN);
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
        status: status,
      },
    },
  });
};

export default updateTicketStatus;
