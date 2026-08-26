import type {
  AuthParamsType,
  zendeskUpdateTicketStatusFunction,
  zendeskUpdateTicketStatusOutputType,
  zendeskUpdateTicketStatusParamsType,
} from "../../autogen/types.js";
import { createAxiosClientWithRetries } from "../../util/axiosClient.js";
import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants.js";
import { getZendeskBaseUrl } from "./utils/getZendeskBaseUrl.js";

const updateTicketStatus: zendeskUpdateTicketStatusFunction = async ({
  params,
  authParams,
}: {
  params: zendeskUpdateTicketStatusParamsType;
  authParams: AuthParamsType;
}): Promise<zendeskUpdateTicketStatusOutputType> => {
  const { authToken } = authParams;
  const { subdomain, ticketId, status } = params;

  if (!authToken) {
    throw new Error(MISSING_AUTH_TOKEN);
  }

  const zendeskBaseUrl = getZendeskBaseUrl({ subdomain });
  const apiEndpoint = new URL(`/api/v2/tickets/${ticketId}.json`, zendeskBaseUrl);
  const axiosClient = createAxiosClientWithRetries({ timeout: 10000, retryCount: 4 });

  await axiosClient.request({
    url: apiEndpoint.toString(),
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
