import type {
  AuthParamsType,
  jiraGetJiraIssuesByQueryFunction,
  jiraGetJiraIssuesByQueryOutputType,
  jiraGetJiraIssuesByQueryParamsType,
} from "../../autogen/types.js";
import { axiosClient } from "../../util/axiosClient.js";
import { getJiraApiConfig, getErrorMessage, extractPlainText, type JiraADFDoc } from "./utils.js";

const DEFAULT_LIMIT = 100;

type JiraUser = {
  accountId: string;
  emailAddress: string;
  displayName: string;
};

type JiraSearchResponse = {
  issues: {
    id: string;
    key: string;
    fields: {
      summary: string;
      description?: JiraADFDoc | null;
      project: {
        id: string;
        key: string;
        name: string;
      };
      issuetype: {
        id: string;
        name: string;
      };
      status: {
        id: string;
        name: string;
        statusCategory: {
          name: string;
        };
      };
      assignee?: JiraUser | null;
      reporter?: JiraUser | null;
      creator?: JiraUser | null;
      created: string;
      updated: string;
      resolution?: {
        name: string;
      } | null;
      duedate?: string | null;
    };
  }[];
  startAt: number;
  maxResults: number;
  total: number;
};

/**
 * Get Jira issues from Jira Data Center using offset-based pagination (startAt).
 * Returns `itemsReturned` and `truncated` so agents can page through results by
 * incrementing startAt by itemsReturned each call until truncated is false.
 */
const getJiraDCIssuesByQuery: jiraGetJiraIssuesByQueryFunction = async ({
  params,
  authParams,
}: {
  params: jiraGetJiraIssuesByQueryParamsType;
  authParams: AuthParamsType;
}): Promise<jiraGetJiraIssuesByQueryOutputType> => {
  const { authToken } = authParams;
  const { query, limit, startAt: paramStartAt } = params;
  const { apiUrl, browseUrl, strategy } = getJiraApiConfig(authParams);

  if (!authToken) {
    throw new Error("Auth token is required");
  }

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

  const searchEndpoint = strategy.getSearchEndpoint();
  const requestedLimit = limit ?? DEFAULT_LIMIT;
  const allIssues: JiraSearchResponse["issues"] = [];
  let currentStartAt = paramStartAt ?? 0;
  let jiraTotal: number | undefined = undefined;

  try {
    // Keep fetching pages until we have all requested issues
    while (allIssues.length < requestedLimit) {
      // Calculate how many results to fetch in this request
      const remainingIssues = requestedLimit - allIssues.length;
      const maxResults = Math.min(remainingIssues, DEFAULT_LIMIT);

      const queryParams = new URLSearchParams();
      queryParams.set("jql", query);
      queryParams.set("maxResults", String(maxResults));
      queryParams.set("startAt", String(currentStartAt));
      queryParams.set("fields", fields.join(","));

      const fullApiUrl = `${apiUrl}${searchEndpoint}?${queryParams.toString()}`;

      const response = await axiosClient.get<JiraSearchResponse>(fullApiUrl, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          Accept: "application/json",
        },
      });

      const { issues, total } = response.data;
      jiraTotal = total;

      allIssues.push(...issues);
      if ((paramStartAt ?? 0) + allIssues.length >= total || issues.length === 0) {
        break;
      }

      currentStartAt += issues.length;
    }

    const absoluteEnd = (paramStartAt ?? 0) + allIssues.length;
    const truncated = jiraTotal !== undefined && absoluteEnd < jiraTotal;

    return {
      itemsReturned: allIssues.length,
      truncated,
      results: allIssues.map(issue => {
        const { id, key, fields } = issue;
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

        const ticketUrl = `${browseUrl}/browse/${key}`;

        return {
          name: key,
          url: ticketUrl,
          contents: {
            id,
            key,
            summary,
            description: extractPlainText(description),
            project: {
              id: project.id,
              key: project.key,
              name: project.name,
            },
            issueType: {
              id: issuetype.id,
              name: issuetype.name,
            },
            status: {
              id: status.id,
              name: status.name,
              category: status.statusCategory.name,
            },
            assignee: assignee
              ? {
                  id: assignee.accountId,
                  name: assignee.displayName,
                  email: assignee.emailAddress,
                }
              : null,
            reporter: reporter
              ? {
                  id: reporter.accountId,
                  name: reporter.displayName,
                  email: reporter.emailAddress,
                }
              : null,
            creator: creator
              ? {
                  id: creator.accountId,
                  name: creator.displayName,
                  email: creator.emailAddress,
                }
              : null,
            created,
            updated,
            resolution: resolution?.name || null,
            dueDate: duedate || null,
            url: ticketUrl,
          },
        };
      }),
    };
  } catch (error: unknown) {
    console.error("Error retrieving Jira issues:", error);
    return {
      results: [],
      error: getErrorMessage(error),
    };
  }
};

export default getJiraDCIssuesByQuery;
