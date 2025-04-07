import type {
  AuthParamsType,
  jiraGetJiraTicketHistoryFunction,
  jiraGetJiraTicketHistoryOutputType,
  jiraGetJiraTicketHistoryParamsType,
} from "../../autogen/types";
import { axiosClient } from "../../util/axiosClient";

const getJiraTicketHistory: jiraGetJiraTicketHistoryFunction = async ({
  params,
  authParams,
}: {
  params: jiraGetJiraTicketHistoryParamsType;
  authParams: AuthParamsType;
}): Promise<jiraGetJiraTicketHistoryOutputType> => {
  const { authToken, cloudId } = authParams;
  const { issueId } = params;

  if (!cloudId || !issueId) {
    throw new Error("Cloud ID and Issue ID are required to retrieve ticket history");
  }

  const apiUrl = `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/issue/${issueId}/changelog`;

  try {
    const response = await axiosClient.get(apiUrl, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        Accept: "application/json",
      },
    });

    return {
      success: true,
      history: response?.data?.values,
    };
  } catch (error) {
    console.error("Error retrieving Jira ticket history: ", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

export default getJiraTicketHistory;
