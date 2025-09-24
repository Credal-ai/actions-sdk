import type {
  AuthParamsType,
  jiraGetJiraIssuesByQueryFunction,
  jiraGetJiraIssuesByQueryOutputType,
  jiraGetJiraIssuesByQueryParamsType,
} from "../../autogen/types.js";
import { axiosClient } from "../../util/axiosClient.js";
import { getJiraApiConfig } from "./utils.js";

const DEFAULT_LIMIT = 100;

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
  const { authToken } = authParams;
  const { query, limit } = params;
  const { apiUrl, browseUrl, isDataCenter } = getJiraApiConfig(authParams);

  if (!authToken) {
    throw new Error("Auth token is required");
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

  // Data Center uses /search, Cloud uses /search/jql
  const searchEndpoint = isDataCenter ? "/search" : "/search/jql";
  const fullApiUrl = `${apiUrl}${searchEndpoint}?${queryParams.toString()}`;

  try {
    const response = await axiosClient.get<JiraSearchResponse>(fullApiUrl, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        Accept: "application/json",
      },
    });

    return {
      success: true,
      results: response.data.issues.map(issue => ({
        name: issue.key,
        url: `${browseUrl}/browse/${issue.key}`,
        contents: {
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
          url: `${browseUrl}/browse/${issue.key}`,
        },
      })),
    };
  } catch (error: unknown) {
    console.error("Error retrieving Jira issues:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

function extractPlainText(adf: JiraADFDoc | null | undefined): string {
  if (!adf || adf.type !== "doc" || !Array.isArray(adf.content)) return "";

  return adf.content
    .map(block => {
      if (block.type === "paragraph" && Array.isArray(block.content)) {
        return block.content.map(inline => inline.text ?? "").join("");
      }
      return "";
    })
    .join("\n")
    .trim();
}

export default getJiraIssuesByQuery;
