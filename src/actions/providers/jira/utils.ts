import type { AxiosError } from "axios";
import { axiosClient } from "../../util/axiosClient.js";

export interface JiraApiConfig {
  apiUrl: string;
  browseUrl: string;
  isDataCenter: boolean;
}

export interface JiraServiceDeskApiConfig {
  serviceDeskApiUrl: string;
  browseUrl: string;
  isDataCenter: boolean;
}

export function formatText(text: string, isDataCenter: boolean): string | object {
  if (isDataCenter) {
    // Data Center (API v2) expects plain string
    return text;
  } else {
    // Cloud (API v3) expects ADF format
    return {
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
    };
  }
}

export function getJiraApiConfig(authParams: {
  cloudId?: string;
  baseUrl?: string;
  authToken?: string;
}): JiraApiConfig {
  const { cloudId, baseUrl, authToken } = authParams;

  if (!authToken) {
    throw new Error("Valid auth token is required");
  }

  const isDataCenter = !cloudId && !!baseUrl;

  if (isDataCenter) {
    if (!baseUrl) {
      throw new Error("Valid base URL is required for Jira Data Center");
    }
    const trimmedUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
    return {
      apiUrl: `${trimmedUrl}/rest/api/2`,
      browseUrl: trimmedUrl,
      isDataCenter: true,
    };
  }

  if (!cloudId) {
    throw new Error("Valid Cloud ID is required for Jira Cloud");
  }

  return {
    apiUrl: `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3`,
    browseUrl: baseUrl || `https://${cloudId}.atlassian.net`,
    isDataCenter: false,
  };
}

export function isEmail(value: string | undefined): value is string {
  return typeof value === "string" && value.includes("@");
}

export async function resolveAccountIdIfEmail(
  value: string | undefined,
  apiUrl: string,
  authToken: string,
  isDataCenter: boolean = false,
): Promise<string | null> {
  return isEmail(value) ? getUserAccountIdFromEmail(value, apiUrl, authToken, isDataCenter) : null;
}

export function createUserFieldObject(userId: string | null, isDataCenter: boolean): { [key: string]: string } | null {
  if (!userId) return null;
  return isDataCenter ? { name: userId } : { accountId: userId };
}

export function createUserAssignmentObject(
  userId: string | null,
  isDataCenter: boolean,
): { id?: string; name?: string } | null {
  if (!userId) return null;
  return isDataCenter ? { name: userId } : { id: userId };
}

export async function getUserAccountIdFromEmail(
  email: string,
  apiUrl: string,
  authToken: string,
  isDataCenter: boolean = false,
): Promise<string | null> {
  try {
    const response = await axiosClient.get<
      Array<{
        accountId?: string; // Cloud only
        key?: string; // Data Center
        name?: string; // Data Center
        displayName: string;
        emailAddress: string;
      }>
    >(`${apiUrl}/user/search?${isDataCenter ? "username" : "query"}=${encodeURIComponent(email)}`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        Accept: "application/json",
      },
    });

    if (response.data && response.data.length > 0) {
      // Data Center uses 'name' or 'key', Cloud uses 'accountId'
      const user = response.data[0];
      const userId = isDataCenter ? user.name || user.key : user.accountId;
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
