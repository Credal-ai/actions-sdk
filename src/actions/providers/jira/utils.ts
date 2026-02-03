import type { AxiosError } from "axios";
import type { Version3Client } from "jira.js";
import { markdownToAdf } from "marklassian";
import { axiosClient } from "../../util/axiosClient.js";


export interface JiraErrorResponse {
  errorMessages?: string[];
  errors?: Record<string, string>;
}

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
  formatText: (text: string) => markdownToAdf(text),

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
  // Handle ApiError from axiosClient which includes response data
  if (error && typeof error === "object" && "data" in error) {
    const apiError = error as { message?: string; data?: JiraErrorResponse };
    if (apiError.data) {
      const data = apiError.data;
      const messages: string[] = [];

      // Jira returns errorMessages array for general errors
      if (data.errorMessages && Array.isArray(data.errorMessages)) {
        messages.push(...data.errorMessages.filter((m): m is string => typeof m === "string"));
      }

      // Jira returns errors object for field-specific errors
      if (data.errors && typeof data.errors === "object") {
        for (const [field, message] of Object.entries(data.errors)) {
          if (typeof message === "string") {
            messages.push(`${field}: ${message}`);
          }
        }
      }

      if (messages.length > 0) {
        return messages.join("; ");
      }
    }

    // Fall back to the message if no detailed errors found
    if (apiError.message) {
      return apiError.message;
    }
  }

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

/**
 * Attempts to parse a string as JSON.
 * Returns the parsed object/array if successful, or null if it's not valid JSON.
 */
function tryParseJson(value: string): unknown | null {
  // Quick check: only try parsing if it looks like JSON (starts with { or [)
  const trimmed = value.trim();
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

/**
 * Formats custom field values for Jira API compatibility.
 *
 * For Jira Cloud (API v3), many field types require specific formats:
 * - Select fields: { value: "option" } or { id: "optionId" }
 * - Multi-select fields: [{ value: "option1" }, { value: "option2" }]
 * - User fields: { accountId: "..." }
 * - Number fields: number
 * - Date fields: "YYYY-MM-DD" string
 *
 * This function handles values that may come as:
 * - JSON strings like '{ "value": "High" }' - these are parsed into objects
 * - Objects/arrays - passed through as-is
 * - Plain strings - passed through as-is (user is responsible for correct format)
 * - Numbers/booleans - passed through as-is
 */
export function formatCustomFieldsForApi(
  customFields: Record<string, unknown> | undefined,
  _isDataCenter: boolean,
): Record<string, unknown> | undefined {
  if (!customFields) {
    return undefined;
  }

  const formattedFields: Record<string, unknown> = {};

  for (const [fieldId, value] of Object.entries(customFields)) {
    if (value === null || value === undefined) {
      // Pass through null/undefined to clear fields
      formattedFields[fieldId] = value;
    } else if (typeof value === "object") {
      // Objects and arrays are passed through as-is
      // User is expected to provide the correct format
      formattedFields[fieldId] = value;
    } else if (typeof value === "number" || typeof value === "boolean") {
      // Numbers and booleans are passed through as-is
      formattedFields[fieldId] = value;
    } else if (typeof value === "string") {
      // Check if the string is JSON (e.g., '{ "value": "High" }')
      const parsed = tryParseJson(value);
      if (parsed !== null) {
        // String was valid JSON, use the parsed value
        formattedFields[fieldId] = parsed;
      } else {
        // Plain string - pass through as-is
        // User is responsible for providing the correct format for their field type
        formattedFields[fieldId] = value;
      }
    } else {
      // Fallback: pass through as-is
      formattedFields[fieldId] = value;
    }
  }

  return formattedFields;
}
