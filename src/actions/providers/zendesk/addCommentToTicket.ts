import type {
  AuthParamsType,
  zendeskAddCommentToTicketFunction,
  zendeskAddCommentToTicketOutputType,
  zendeskAddCommentToTicketParamsType,
} from "../../autogen/types.js";
import { createAxiosClientWithRetries } from "../../util/axiosClient.js";
import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants.js";

const addCommentToTicket: zendeskAddCommentToTicketFunction = async ({
  params,
  authParams,
}: {
  params: zendeskAddCommentToTicketParamsType;
  authParams: AuthParamsType;
}): Promise<zendeskAddCommentToTicketOutputType> => {
  const { authToken } = authParams;
  const { subdomain, ticketId, body, public: isPublic } = params;
  const url = `https://${subdomain}.zendesk.com/api/v2/tickets/${ticketId}.json`;

  if (!authToken) {
    throw new Error(MISSING_AUTH_TOKEN);
  }
  const axiosClient = createAxiosClientWithRetries({ timeout: 20000, retryCount: 5 });

  try {
    const response = await axiosClient.request({
      url: url,
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
      ticketUrl: `https://${subdomain}.zendesk.com/agent/tickets/${ticketId}`,
    };
  } catch (error) {
    console.error("Failed to add comment to Zendesk ticket:", error);
    throw new Error(
      `Failed to add comment to ticket ${ticketId}: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
};

export default addCommentToTicket;
