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
  const { apiUrl, strategy } = getJiraApiConfig(authParams);

  if (!authToken) {
    throw new Error("Auth token is required");
  }

  const fullApiUrl = `${apiUrl}${strategy.getHistoryEndpoint(issueId)}`;

  try {
    const response = await axiosClient.get(fullApiUrl, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        Accept: "application/json",
      },
    });

    const historyData = strategy.parseHistoryResponse(response);

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
