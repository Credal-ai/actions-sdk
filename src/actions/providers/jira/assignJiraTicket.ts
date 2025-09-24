import axios from "axios";
import type {
  AuthParamsType,
  jiraAssignJiraTicketFunction,
  jiraAssignJiraTicketOutputType,
  jiraAssignJiraTicketParamsType,
} from "../../autogen/types.js";
import { getUserAccountIdFromEmail, getJiraApiConfig, createUserFieldObject } from "./utils.js";

const assignJiraTicket: jiraAssignJiraTicketFunction = async ({
  params,
  authParams,
}: {
  params: jiraAssignJiraTicketParamsType;
  authParams: AuthParamsType;
}): Promise<jiraAssignJiraTicketOutputType> => {
  const { authToken } = authParams;
  const { apiUrl, browseUrl, isDataCenter } = getJiraApiConfig(authParams);

  if (!authToken) {
    throw new Error("Auth token is required");
  }

  try {
    let assigneeId: string | null = params.assignee;
    if (assigneeId && assigneeId.includes("@") && authToken) {
      assigneeId = await getUserAccountIdFromEmail(assigneeId, apiUrl, authToken, isDataCenter);
    }

    if (!assigneeId) {
      throw new Error("Unable to get valid assignee account ID.");
    }

    const assigneePayload = createUserFieldObject(assigneeId, isDataCenter);
    if (!assigneePayload) {
      throw new Error("Unable to create assignee payload.");
    }

    await axios.put(`${apiUrl}/issue/${params.issueId}/assignee`, assigneePayload, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    return {
      success: true,
      ticketUrl: `${browseUrl}/browse/${params.issueId}`,
    };
  } catch (error: unknown) {
    console.error("Error assigning issue:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

export default assignJiraTicket;
