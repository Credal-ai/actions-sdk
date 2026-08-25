import type {
  AuthParamsType,
  zendeskAssignTicketFunction,
  zendeskAssignTicketOutputType,
  zendeskAssignTicketParamsType,
} from "../../autogen/types.js";
import { createAxiosClientWithRetries } from "../../util/axiosClient.js";
import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants.js";
import { validateZendeskSubdomain } from "./utils/validateSubdomain.js";

const updateTicketStatus: zendeskAssignTicketFunction = async ({
  params,
  authParams,
}: {
  params: zendeskAssignTicketParamsType;
  authParams: AuthParamsType;
}): Promise<zendeskAssignTicketOutputType> => {
  const { authToken } = authParams;
  const { subdomain, ticketId, assigneeEmail } = params;

  if (!authToken) {
    throw new Error(MISSING_AUTH_TOKEN);
  }

  validateZendeskSubdomain(subdomain);

  const url = `https://${subdomain}.zendesk.com/api/v2/tickets/${ticketId}.json`;
  const axiosClient = createAxiosClientWithRetries({ timeout: 10000, retryCount: 4 });

  await axiosClient.request({
    url: url,
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
    data: {
      ticket: {
        assignee_email: assigneeEmail,
      },
    },
  });
};

export default updateTicketStatus;
