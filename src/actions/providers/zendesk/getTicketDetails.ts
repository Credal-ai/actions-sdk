import type {
  AuthParamsType,
  zendeskGetTicketDetailsFunction,
  zendeskGetTicketDetailsOutputType,
  zendeskGetTicketDetailsParamsType,
} from "../../autogen/types.js";
import { createAxiosClientWithRetries } from "../../util/axiosClient.js";
import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants.js";
import { getZendeskBaseUrl } from "./utils/getZendeskBaseUrl.js";

const getZendeskTicketDetails: zendeskGetTicketDetailsFunction = async ({
  params,
  authParams,
}: {
  params: zendeskGetTicketDetailsParamsType;
  authParams: AuthParamsType;
}): Promise<zendeskGetTicketDetailsOutputType> => {
  const { authToken } = authParams;
  const { subdomain, ticketId } = params;

  if (!authToken) {
    throw new Error(MISSING_AUTH_TOKEN);
  }

  const zendeskBaseUrl = getZendeskBaseUrl({ subdomain });
  const apiEndpoint = new URL(`/api/v2/tickets/${ticketId}.json`, zendeskBaseUrl);
  const axiosClient = createAxiosClientWithRetries({ timeout: 10000, retryCount: 4 });

  const response = await axiosClient.request({
    url: apiEndpoint.toString(),
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
  });
  return {
    ticket: response.data.ticket,
  };
};

export default getZendeskTicketDetails;
