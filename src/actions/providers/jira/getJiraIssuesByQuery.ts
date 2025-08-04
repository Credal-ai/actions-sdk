import type {
  AuthParamsType,
  jiraGetJiraIssuesByQueryFunction,
  jiraGetJiraIssuesByQueryOutputType,
  jiraGetJiraIssuesByQueryParamsType,
} from "../../autogen/types.js";
import { ApiError, axiosClient } from "../../util/axiosClient.js";

const DEFAULT_LIMIT = 1000;

type JiraUser = {
  accountId: string;
  emailAddress: string;
  displayName: string;
};

type JiraADFDoc = {
  type: "doc";
  version: number;
  content: Array<{
    type: string;
    content?: Array<{
      type: string;
      text?: string;
    }>;
  }>;
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
};

const getJiraIssuesByQuery: jiraGetJiraIssuesByQueryFunction = async ({
  params,
  authParams,
}: {
  params: jiraGetJiraIssuesByQueryParamsType;
  authParams: AuthParamsType;
}): Promise<jiraGetJiraIssuesByQueryOutputType> => {
  const { authToken, cloudId } = authParams;
  const { query, limit } = params;

  if (!cloudId || !authToken) {
    throw new Error("Valid Cloud ID and auth token are required to comment on Jira ticket");
  }

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
    const response = await axiosClient.get<JiraSearchResponse>(apiUrl, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        Accept: "application/json",
      },
    });

    return {
      success: true,
      records: {
        issues: response.data.issues.map(issue => ({
          id: issue.id,
          key: issue.key,
          summary: issue.fields.summary,
          description: extractPlainText(issue.fields.description),
          project: {
            id: issue.fields.project.id,
            key: issue.fields.project.key,
            name: issue.fields.project.name,
          },
          issueType: {
            id: issue.fields.issuetype.id,
            name: issue.fields.issuetype.name,
          },
          status: {
            id: issue.fields.status.id,
            name: issue.fields.status.name,
            category: issue.fields.status.statusCategory.name,
          },
          assignee: issue.fields.assignee?.emailAddress || null,
          reporter: issue.fields.reporter?.emailAddress || null,
          creator: issue.fields.creator?.emailAddress || null,
          created: issue.fields.created,
          updated: issue.fields.updated,
          resolution: issue.fields.resolution?.name || null,
          dueDate: issue.fields.duedate || null,
        })),
      },
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

function extractPlainText(adf: JiraADFDoc | null | undefined): string {
  if (!adf || adf.type !== "doc" || !Array.isArray(adf.content)) return "";

  return adf.content
    .map((block) => {
      if (block.type === "paragraph" && Array.isArray(block.content)) {
        return block.content.map((inline) => inline.text ?? "").join("");
      }
      return "";
    })
    .join("\n")
    .trim();
}


export default getJiraIssuesByQuery;
