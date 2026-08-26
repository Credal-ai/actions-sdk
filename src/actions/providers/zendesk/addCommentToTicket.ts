import type {
  AuthParamsType,
  zendeskAddCommentToTicketFunction,
  zendeskAddCommentToTicketOutputType,
  zendeskAddCommentToTicketParamsType,
} from "../../autogen/types.js";
import { createAxiosClientWithRetries } from "../../util/axiosClient.js";
import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants.js";
import { getZendeskBaseUrl } from "./utils/getZendeskBaseUrl.js";

const addCommentToTicket: zendeskAddCommentToTicketFunction = async ({
  params,
  authParams,
}: {
  params: zendeskAddCommentToTicketParamsType;
  authParams: AuthParamsType;
}): Promise<zendeskAddCommentToTicketOutputType> => {
  const { authToken } = authParams;
  const { subdomain, ticketId, body, public: isPublic } = params;

  if (!authToken) {
    throw new Error(MISSING_AUTH_TOKEN);
  }

  const zendeskBaseUrl = getZendeskBaseUrl({ subdomain });
  const apiEndpoint = new URL(`/api/v2/tickets/${ticketId}.json`, zendeskBaseUrl);
  const axiosClient = createAxiosClientWithRetries({ timeout: 20000, retryCount: 5 });

  try {
    await axiosClient.request({
      url: apiEndpoint.toString(),
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      data: {
        ticket: {
          comment: {
            body: body,
            public: isPublic ?? true,
          },
        },
      },
    });

    return {
      success: true,
      ticketUrl: new URL(`/agent/tickets/${ticketId}`, zendeskBaseUrl).toString(),
    };
  } catch (error) {
    console.error("Failed to add comment to Zendesk ticket:", error);
    throw new Error(
      `Failed to add comment to ticket ${ticketId}: ${error instanceof Error ? error.message : "Unknown error"}`,
      { cause: error },
    );
  }
};

export default addCommentToTicket;
