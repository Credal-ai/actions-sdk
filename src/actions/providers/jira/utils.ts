import type { AxiosError } from "axios";
import type { Version3Client } from "jira.js";
import { axiosClient } from "../../util/axiosClient.js";

export interface JiraApiConfig {
  apiUrl: string;
  browseUrl: string;
  isDataCenter: boolean;
  strategy: JiraPlatformStrategy;
}

export interface JiraServiceDeskApiConfig {
  serviceDeskApiUrl: string;
  browseUrl: string;
  isDataCenter: boolean;
}

export type JiraADFDoc = {
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

interface JiraHistoryResponse {
  data?: {
    values?: unknown[];
    changelog?: {
      histories?: unknown[];
    };
  };
}

export interface JiraPlatformStrategy {
  formatText(text: string): string | object;
  formatUser(userId: string | null): { [key: string]: string } | null;
  formatUserAssignment(userId: string | null): { id?: string; name?: string } | null;
  getUserSearchParam(): string;
  getSearchEndpoint(): string;
  getHistoryEndpoint(issueId: string): string;
  parseHistoryResponse(response: JiraHistoryResponse): unknown[] | undefined;
}

const cloudStrategy: JiraPlatformStrategy = {
  formatText: (text: string) => ({
    type: "doc",
    version: 1,
    content: [
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: text,
          },
        ],
      },
    ],
  }),

  formatUser: (userId: string | null) => {
    if (!userId) return null;
    return { accountId: userId };
  },

  formatUserAssignment: (userId: string | null) => {
    if (!userId) return null;
    return { id: userId };
  },

  getUserSearchParam: () => "query",
  getSearchEndpoint: () => "/search/jql",
  getHistoryEndpoint: (issueId: string) => `/issue/${issueId}/changelog`,
  parseHistoryResponse: (response: JiraHistoryResponse) => response?.data?.values,
};

const dataCenterStrategy: JiraPlatformStrategy = {
  formatText: (text: string) => text,

  formatUser: (userId: string | null) => {
    if (!userId) return null;
    return { name: userId };
  },

  formatUserAssignment: (userId: string | null) => {
    if (!userId) return null;
    return { name: userId };
  },

  getUserSearchParam: () => "username",
  getSearchEndpoint: () => "/search",
  getHistoryEndpoint: (issueId: string) => `/issue/${issueId}?expand=changelog`,
  parseHistoryResponse: (response: JiraHistoryResponse) => response?.data?.changelog?.histories,
};

export function getPlatformStrategy(isDataCenter: boolean): JiraPlatformStrategy {
  return isDataCenter ? dataCenterStrategy : cloudStrategy;
}

export function getJiraApiConfig(authParams: {
  cloudId?: string;
  baseUrl?: string;
  authToken?: string;
  provider?: string;
}): JiraApiConfig {
  const { cloudId, baseUrl, authToken, provider } = authParams;

  if (!authToken) {
    throw new Error("Valid auth token is required");
  }

  const isDataCenter = provider === "jiraDataCenter";
  const strategy = getPlatformStrategy(isDataCenter);

  if (isDataCenter) {
    if (!baseUrl) {
      throw new Error("Valid base URL is required for Jira Data Center");
    }
    const trimmedUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
    return {
      apiUrl: `${trimmedUrl}/rest/api/2`,
      browseUrl: trimmedUrl,
      isDataCenter: true,
      strategy,
    };
  }

  if (!cloudId) {
    throw new Error("Valid Cloud ID is required for Jira Cloud");
  }

  return {
    apiUrl: `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3`,
    browseUrl: baseUrl || `https://${cloudId}.atlassian.net`,
    isDataCenter: false,
    strategy,
  };
}

export function isEmail(value: string | undefined): value is string {
  return typeof value === "string" && value.includes("@");
}

export async function resolveAccountIdIfEmail(
  value: string | undefined,
  apiUrl: string,
  authToken: string,
  strategy: JiraPlatformStrategy,
): Promise<string | null> {
  return isEmail(value) ? getUserAccountIdFromEmail(value, apiUrl, authToken, strategy) : null;
}

export async function getUserAccountIdFromEmail(
  email: string,
  apiUrl: string,
  authToken: string,
  strategy: JiraPlatformStrategy,
): Promise<string | null> {
  try {
    const searchParam = strategy.getUserSearchParam();
    const response = await axiosClient.get<
      Array<{
        accountId?: string; // Cloud only
        key?: string; // Data Center
        name?: string; // Data Center
        displayName: string;
        emailAddress: string;
      }>
    >(`${apiUrl}/user/search?${searchParam}=${encodeURIComponent(email)}`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        Accept: "application/json",
      },
    });

    if (response.data && response.data.length > 0) {
      const user = response.data[0];
      // Use strategy to determine which field to use
      const userId = strategy === dataCenterStrategy ? user.name || user.key : user.accountId;
      if (!userId) return null;
      return userId;
    }
    return null;
  } catch (error) {
    const axiosError = error as AxiosError;
    console.error("Error finding user:", axiosError.message);
    return null;
  }
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

export async function resolveRequestTypeField(
  requestTypeId: string | undefined,
  projectKey: string | undefined,
  apiUrl: string,
  authToken: string,
): Promise<{ field: { [key: string]: string }; message?: string }> {
  if (!requestTypeId || !projectKey) {
    return { field: {} };
  }

  const result = await getRequestTypeCustomFieldId(projectKey, apiUrl, authToken);
  const field: { [key: string]: string } = {};

  if (result.fieldId) {
    field[result.fieldId] = requestTypeId;
  }

  return {
    field,
    message: result.message,
  };
}

export async function getRequestTypeCustomFieldId(
  projectKey: string,
  apiUrl: string,
  authToken: string,
): Promise<{ fieldId: string | null; message?: string }> {
  try {
    const response = await axiosClient.get(
      `${apiUrl}/issue/createmeta?projectKeys=${projectKey}&expand=projects.issuetypes.fields`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          Accept: "application/json",
        },
      },
    );

    const projects = response.data.projects;
    if (!projects || projects.length === 0) {
      return { fieldId: null };
    }

    const project = projects[0];
    const issueTypes = project.issuetypes;
    if (!issueTypes || issueTypes.length === 0) {
      return { fieldId: null };
    }

    for (const issueType of issueTypes) {
      const fields = issueType.fields;
      if (fields) {
        for (const [fieldId, fieldData] of Object.entries(fields)) {
          if (fieldData && typeof fieldData === "object" && "name" in fieldData) {
            const fieldInfo = fieldData as { name?: string };
            if (fieldInfo.name === "Request Type") {
              return { fieldId };
            }
          }
        }
      }
    }

    return { fieldId: null };
  } catch (error) {
    const axiosError = error as AxiosError;
    if (axiosError.response?.status === 404) {
      return { fieldId: null, message: "Request Type field not found (optional for Service Desk), skipping..." };
    } else {
      return { fieldId: null, message: `Error finding Request Type custom field: ${axiosError.message}` };
    }
  }
}

export async function getUserEmailFromAccountId(
  accountId: string | undefined,
  client: Version3Client,
): Promise<string | undefined> {
  if (!accountId) return undefined;

  try {
    const userEmail = await client.users.getUser({ accountId });
    console.log("USER EMAIL: ", userEmail);
    return userEmail.emailAddress;
  } catch (error) {
    const axiosError = error as AxiosError;
    console.error("Error fetching user email:", axiosError.message);
    return undefined;
  }
}

export async function getUserInfoFromAccountId(
  accountId: string | undefined,
  client: Version3Client,
): Promise<{
  id: string;
  name: string | undefined;
  email: string | undefined;
} | null> {
  if (!accountId) return null;

  try {
    const user = await client.users.getUser({ accountId });
    return {
      id: user.accountId,
      name: user?.displayName,
      email: user?.emailAddress,
    };
  } catch (error) {
    const axiosError = error as AxiosError;
    console.error("Error fetching user info:", axiosError.message);
    return null;
  }
}

export function extractPlainText(adf: unknown): string {
  if (!adf || typeof adf !== "object") return "";

  const doc = adf as JiraADFDoc;
  if (doc.type !== "doc" || !Array.isArray(doc.content)) return "";

  return doc.content
    .map((block: { type: string; content?: Array<{ type: string; text?: string }> }) => {
      if (block.type === "paragraph" && Array.isArray(block.content)) {
        return block.content.map((inline: { type: string; text?: string }) => inline.text ?? "").join("");
      }
      return "";
    })
    .join("\n")
    .trim();
}
