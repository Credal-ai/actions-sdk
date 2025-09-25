import type {
  AuthParamsType,
  jiraGetJiraTicketDetailsFunction,
  jiraGetJiraTicketDetailsOutputType,
  jiraGetJiraTicketDetailsParamsType,
} from "../../autogen/types.js";
import { axiosClient } from "../../util/axiosClient.js";
import { getJiraApiConfig, getErrorMessage } from "./utils.js";

// https://developer.atlassian.com/cloud/jira/platform/rest/v2/api-group-issues/#api-rest-api-2-issue-issueidorkey-get
const getJiraTicketDetails: jiraGetJiraTicketDetailsFunction = async ({
  params,
  authParams,
}: {
  params: jiraGetJiraTicketDetailsParamsType;
  authParams: AuthParamsType;
}): Promise<jiraGetJiraTicketDetailsOutputType> => {
  const { authToken } = authParams;
  const { issueId } = params;
  const { apiUrl } = getJiraApiConfig(authParams);

  if (!authToken) {
    throw new Error("Auth token is required");
  }

  const fullApiUrl = `${apiUrl}/issue/${issueId}`;

  try {
    const response = await axiosClient.get(fullApiUrl, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        Accept: "application/json",
      },
    });

    return {
      success: true,
      results: [
        {
          name: response.data.key,
          url: response.data.self,
          contents: response.data,
        },
      ],
    };
  } catch (error: unknown) {
    console.error("Error retrieving Jira ticket details: ", error);
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
};

export default getJiraTicketDetails;
