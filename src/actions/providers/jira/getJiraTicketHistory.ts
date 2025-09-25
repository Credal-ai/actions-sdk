import type {
  AuthParamsType,
  jiraGetJiraTicketHistoryFunction,
  jiraGetJiraTicketHistoryOutputType,
  jiraGetJiraTicketHistoryParamsType,
} from "../../autogen/types.js";
import { axiosClient } from "../../util/axiosClient.js";
import { getJiraApiConfig, getErrorMessage } from "./utils.js";

const getJiraTicketHistory: jiraGetJiraTicketHistoryFunction = async ({
  params,
  authParams,
}: {
  params: jiraGetJiraTicketHistoryParamsType;
  authParams: AuthParamsType;
}): Promise<jiraGetJiraTicketHistoryOutputType> => {
  const { authToken } = authParams;
  const { issueId } = params;
  const { apiUrl } = getJiraApiConfig(authParams);

  if (!authToken) {
    throw new Error("Auth token is required");
  }

  const { isDataCenter } = getJiraApiConfig(authParams);

  // Data Center uses expand parameter, Cloud has dedicated endpoint
  const fullApiUrl = isDataCenter
    ? `${apiUrl}/issue/${issueId}?expand=changelog`
    : `${apiUrl}/issue/${issueId}/changelog`;

  try {
    const response = await axiosClient.get(fullApiUrl, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        Accept: "application/json",
      },
    });

    // Data Center returns changelog in different structure when using expand
    const historyData = isDataCenter ? response?.data?.changelog?.histories : response?.data?.values;

    return {
      success: true,
      history: historyData,
    };
  } catch (error: unknown) {
    console.error("Error retrieving Jira ticket history: ", error);
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
};

export default getJiraTicketHistory;
