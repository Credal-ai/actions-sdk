import type {
  AuthParamsType,
  jiraGetJiraIssuesByQueryFunction,
  jiraGetJiraIssuesByQueryOutputType,
  jiraGetJiraIssuesByQueryParamsType,
} from "../../autogen/types.js";
import { Version3Client } from "jira.js";
import { axiosClient } from "../../util/axiosClient.js";
import { getJiraApiConfig, getErrorMessage, extractPlainText, getUserInfoFromAccountId } from "./utils.js";

const DEFAULT_LIMIT = 100;

type JiraCloudSearchResponse = {
  issues: {
    id: string;
    key: string;
    fields: {
      summary: string;
      description?: unknown;
      project: { id: string; key: string; name: string };
      issuetype: { id: string; name: string };
      status: { id: string; name: string; statusCategory: { name: string } };
      assignee?: { accountId: string } | null;
      reporter?: { accountId: string } | null;
      creator?: { accountId: string } | null;
      created: string;
      updated: string;
      resolution?: { name: string } | null;
      duedate?: string | null;
    };
  }[];
  nextPageToken?: string;
};

const getJiraIssuesByQuery: jiraGetJiraIssuesByQueryFunction = async ({
  params,
  authParams,
}: {
  params: jiraGetJiraIssuesByQueryParamsType;
  authParams: AuthParamsType;
}): Promise<jiraGetJiraIssuesByQueryOutputType> => {
  const { authToken, cloudId } = authParams;
  const { query, limit, nextPageToken: paramNextPageToken } = params;
  const { browseUrl } = getJiraApiConfig(authParams);

  if (!authToken) throw new Error("Auth token is required");
  if (!browseUrl) throw new Error("Browse URL is required");
  if (!cloudId) throw new Error("Cloud ID is required for Jira Cloud");

  const fields = [
    "summary",
    "description",
    "project",
    "issuetype",
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

  const requestedLimit = limit ?? DEFAULT_LIMIT;
  const allIssues: JiraCloudSearchResponse["issues"] = [];
  let currentNextPageToken: string | undefined = paramNextPageToken;

  const client = new Version3Client({
    host: `https://api.atlassian.com/ex/jira/${cloudId}`,
    authentication: { oauth2: { accessToken: authToken } },
  });

  try {
    while (allIssues.length < requestedLimit) {
      const remainingIssues = requestedLimit - allIssues.length;
      const maxResults = Math.min(remainingIssues, DEFAULT_LIMIT);

      const queryParams = new URLSearchParams();
      queryParams.set("jql", query);
      queryParams.set("maxResults", String(maxResults));
      queryParams.set("fields", fields.join(","));
      if (currentNextPageToken) {
        queryParams.set("nextPageToken", currentNextPageToken);
      }

      const response = await axiosClient.get<JiraCloudSearchResponse>(
        `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/search/jql?${queryParams.toString()}`,
        { headers: { Authorization: `Bearer ${authToken}`, Accept: "application/json" } },
      );

      const { issues, nextPageToken } = response.data;
      allIssues.push(...issues);
      currentNextPageToken = nextPageToken;

      if (!nextPageToken || issues.length === 0) {
        break;
      }
    }

    const results = await Promise.all(
      allIssues.map(async ({ id, key, fields }) => {
        const ticketUrl = `${browseUrl}/browse/${key}`;
        const {
          summary,
          description,
          project,
          issuetype,
          status,
          assignee,
          reporter,
          creator,
          created,
          updated,
          resolution,
          duedate,
        } = fields;

        const [assigneeInfo, reporterInfo, creatorInfo] = await Promise.all([
          getUserInfoFromAccountId(assignee?.accountId, client),
          getUserInfoFromAccountId(reporter?.accountId, client),
          getUserInfoFromAccountId(creator?.accountId, client),
        ]);

        return {
          name: key,
          url: ticketUrl,
          contents: {
            id,
            key,
            summary,
            description: extractPlainText(description),
            project: { id: project?.id, key: project?.key, name: project?.name },
            issueType: { id: issuetype?.id, name: issuetype?.name },
            status: { id: status?.id, name: status?.name, category: status?.statusCategory?.name },
            assignee: assigneeInfo,
            reporter: reporterInfo,
            creator: creatorInfo,
            created,
            updated,
            resolution: resolution?.name,
            dueDate: duedate,
            url: ticketUrl,
          },
        };
      }),
    );

    return {
      itemsReturned: allIssues.length,
      nextPageToken: currentNextPageToken,
      results,
    };
  } catch (error: unknown) {
    console.error("Error retrieving Jira issues:", error);
    return { results: [], error: getErrorMessage(error) };
  }
};

export default getJiraIssuesByQuery;
