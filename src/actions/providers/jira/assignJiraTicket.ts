import axios from "axios";
import type {
  AuthParamsType,
  jiraAssignJiraTicketFunction,
  jiraAssignJiraTicketOutputType,
  jiraAssignJiraTicketParamsType,
} from "../../autogen/types.js";
import { getUserAccountIdFromEmail, getJiraApiConfig, getErrorMessage } from "./utils.js";

const assignJiraTicket: jiraAssignJiraTicketFunction = async ({
  params,
  authParams,
}: {
  params: jiraAssignJiraTicketParamsType;
  authParams: AuthParamsType;
}): Promise<jiraAssignJiraTicketOutputType> => {
  const { authToken } = authParams;
  const { apiUrl, browseUrl, strategy } = getJiraApiConfig(authParams);
  const { issueId, assignee } = params;

  if (!authToken) {
    throw new Error("Auth token is required");
  }

  try {
    let assigneeId: string | null = assignee;
    if (assigneeId && assigneeId.includes("@")) {
      assigneeId = await getUserAccountIdFromEmail(assigneeId, apiUrl, authToken, strategy);
    }

    if (!assigneeId) {
      throw new Error("Unable to get valid assignee account ID.");
    }

    const assigneePayload = strategy.formatUser(assigneeId);
    if (!assigneePayload) {
      throw new Error("Unable to create assignee payload.");
    }

    await axios.put(`${apiUrl}/issue/${issueId}/assignee`, assigneePayload, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    return {
      success: true,
      ticketUrl: `${browseUrl}/browse/${issueId}`,
    };
  } catch (error: unknown) {
    console.error("Error assigning issue:", error);
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
};

export default assignJiraTicket;
