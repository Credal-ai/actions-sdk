import {
  AuthParamsType,
  jiraUpdateJiraTicketStatusFunction,
  jiraUpdateJiraTicketStatusOutputType,
  jiraUpdateJiraTicketStatusParamsType,
} from "../../autogen/types";
import { axiosClient } from "../../util/axiosClient";

const updateJiraTicketStatus: jiraUpdateJiraTicketStatusFunction = async ({
  params,
  authParams,
}: {
  params: jiraUpdateJiraTicketStatusParamsType;
  authParams: AuthParamsType;
}): Promise<jiraUpdateJiraTicketStatusOutputType> => {
  const { authToken, cloudId, baseUrl } = authParams;
  if (!cloudId || !params?.issueId || !params?.status) {
    throw new Error("Cloud ID, Issue ID, and Status Name are required to update a Jira ticket status");
  }

  const { issueId, status } = params;
  const transitionsUrl = `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/issue/${issueId}/transitions`;

  try {
    // API takes transition ID, so fetch available transitions the find ID of transition that matches given status name
    const transitionsResponse = await axiosClient.get(transitionsUrl, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        Accept: "application/json",
      },
    });

    const transitions = transitionsResponse.data.transitions;
    if (!transitions || transitions.length === 0) {
      throw new Error("No available transitions found for this issue.");
    }

    const transition = transitions.find((t: { name: string }) => t.name.toLowerCase() === status.trim().toLowerCase());
    if (!transition) {
      throw new Error(
        `Status '${status}' not found for this issue. Available statuses: ${transitions.map((t: { name: string }) => t.name).join(", ")}`,
      );
    }

    // update status with transition ID
    await axiosClient.post(
      transitionsUrl,
      { transition: { id: transition.id } },
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
      ticketUrl: `${baseUrl}/browse/${issueId}`,
    };
  } catch (error) {
    console.error("Error updating Jira ticket status: ", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

export default updateJiraTicketStatus;
