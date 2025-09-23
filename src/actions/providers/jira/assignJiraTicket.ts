import type { AxiosError } from "axios";
import axios from "axios";
import type {
  AuthParamsType,
  jiraAssignJiraTicketFunction,
  jiraAssignJiraTicketOutputType,
  jiraAssignJiraTicketParamsType,
} from "../../autogen/types.js";
import { getUserAccountIdFromEmail, getJiraApiConfig } from "./utils.js";

const assignJiraTicket: jiraAssignJiraTicketFunction = async ({
  params,
  authParams,
}: {
  params: jiraAssignJiraTicketParamsType;
  authParams: AuthParamsType;
}): Promise<jiraAssignJiraTicketOutputType> => {
  const { authToken } = authParams;
  const { apiUrl, browseUrl } = getJiraApiConfig(authParams);

  if (!authToken) {
    throw new Error("Auth token is required");
  }

  try {
    let assigneeId: string | null = params.assignee;
    if (assigneeId && assigneeId.includes("@") && authToken) {
      assigneeId = await getUserAccountIdFromEmail(assigneeId, apiUrl, authToken);
    }

    if (!assigneeId) {
      throw new Error("Unable to get valid assignee account ID.");
    }

    await axios.put(
      `${apiUrl}issue/${params.issueId}/assignee`,
      { accountId: assigneeId },
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      },
    );

    return {
      success: true,
      ticketUrl: `${browseUrl}/browse/${params.issueId}`,
    };
  } catch (error) {
    const axiosError = error as AxiosError;
    console.error("Error assigning issue:", axiosError);
    return {
      success: false,
      error: axiosError.message,
    };
  }
};

export default assignJiraTicket;
