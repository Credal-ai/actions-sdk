import type {
  AuthParamsType,
  jiraGetJiraIssuesByQueryFunction,
  jiraGetJiraIssuesByQueryOutputType,
  jiraGetJiraIssuesByQueryParamsType,
} from "../../autogen/types.js";
import { axiosClient } from "../../util/axiosClient.js";
import { getJiraApiConfig, getErrorMessage } from "./utils.js";

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
  const { apiUrl, browseUrl, strategy } = getJiraApiConfig(authParams);

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

  const searchEndpoint = strategy.getSearchEndpoint();
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
      results: response.data.issues.map(issue => {
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
            assignee: assignee?.emailAddress || null,
            reporter: reporter?.emailAddress || null,
            creator: creator?.emailAddress || null,
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
      success: false,
      error: getErrorMessage(error),
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
