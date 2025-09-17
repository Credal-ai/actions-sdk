import type {
  AuthParamsType,
  jiraGetJiraTicketDetailsFunction,
  jiraGetJiraTicketDetailsOutputType,
  jiraGetJiraTicketDetailsParamsType,
} from "../../autogen/types.js";
import { axiosClient } from "../../util/axiosClient.js";

// https://developer.atlassian.com/cloud/jira/platform/rest/v2/api-group-issues/#api-rest-api-2-issue-issueidorkey-get
const getJiraTicketDetails: jiraGetJiraTicketDetailsFunction = async ({
  params,
  authParams,
}: {
  params: jiraGetJiraTicketDetailsParamsType;
  authParams: AuthParamsType;
}): Promise<jiraGetJiraTicketDetailsOutputType> => {
  const { authToken, cloudId } = authParams;
  const { issueId } = params;

  if (!cloudId || !authToken) {
    throw new Error("Valid Cloud ID and auth token are required to comment on Jira ticket");
  }

  const apiUrl = `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/issue/${issueId}`;

  try {
    const response = await axiosClient.get(apiUrl, {
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
  } catch (error) {
    console.error("Error retrieving Jira ticket details: ", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

export default getJiraTicketDetails;
