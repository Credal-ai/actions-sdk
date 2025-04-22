import type {
  AuthParamsType,
  jiraGetJiraIssuesByQueryFunction,
  jiraGetJiraIssuesByQueryOutputType,
  jiraGetJiraIssuesByQueryParamsType,
} from "../../autogen/types";
import { ApiError, axiosClient } from "../../util/axiosClient";

const DEFAULT_LIMIT = 1000;

const getJiraIssuesByQuery: jiraGetJiraIssuesByQueryFunction = async ({
  params,
  authParams,
}: {
  params: jiraGetJiraIssuesByQueryParamsType;
  authParams: AuthParamsType;
}): Promise<jiraGetJiraIssuesByQueryOutputType> => {
  const { authToken, cloudId } = authParams;
  const { query, limit } = params;
  const queryParams = new URLSearchParams();
  queryParams.set("jql", query);
  queryParams.set("maxResults", String(limit != undefined && limit <= DEFAULT_LIMIT ? limit : DEFAULT_LIMIT));
  const fields = [
    "key",
    "id",
    "project",
    "issuetype",
    "summary",
    "description",
    "status",
    "assignee",
    "reporter",
    "creator",
    "created",
    "updated",
    "resolution",
    "duedate",
    "timeoriginalestimate",
    "timespent",
    "aggregatetimeoriginalestimate",
  ];
  queryParams.set("fields", fields.join(","));

  const apiUrl = `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/search/jql?${queryParams.toString()}`;

  try {
    const response = await axiosClient.get(apiUrl, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        Accept: "application/json",
      },
    });

    return {
      success: true,
      records: response.data,
    };
  } catch (error) {
    console.error("Error retrieving Jira issues:", error);
    return {
      success: false,
      error:
        error instanceof ApiError
          ? error.data.length > 0
            ? error.data[0].message
            : error.message
          : "An unknown error occurred",
    };
  }
};

export default getJiraIssuesByQuery;
