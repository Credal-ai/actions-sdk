import type { AxiosError } from "axios";
import { axiosClient } from "../../util/axiosClient.js";

export interface JiraApiConfig {
  apiUrl: string;
  browseUrl: string;
  isDataCenter: boolean;
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
      apiUrl: `${trimmedUrl}/rest/api/3/`,
      browseUrl: trimmedUrl,
      isDataCenter: true,
    };
  } else {
    if (!cloudId) {
      throw new Error("Valid Cloud ID is required for Jira Cloud");
    }
    return {
      apiUrl: `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/`,
      browseUrl: baseUrl || `https://${cloudId}.atlassian.net`,
      isDataCenter: false,
    };
  }
}

export function isEmail(value: string | undefined): value is string {
  return typeof value === "string" && value.includes("@");
}

export async function resolveAccountIdIfEmail(
  value: string | undefined,
  apiUrl: string,
  authToken: string,
): Promise<string | null> {
  return isEmail(value) ? getUserAccountIdFromEmail(value, apiUrl, authToken) : null;
}

export async function getUserAccountIdFromEmail(
  email: string,
  apiUrl: string,
  authToken: string,
): Promise<string | null> {
  try {
    const response = await axiosClient.get<Array<{ accountId: string; displayName: string; emailAddress: string }>>(
      `${apiUrl}/user/search?query=${encodeURIComponent(email)}`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          Accept: "application/json",
        },
      },
    );

    if (response.data && response.data.length > 0) {
      return response.data[0].accountId;
    }
    return null;
  } catch (error) {
    const axiosError = error as AxiosError;
    console.error("Error finding user:", axiosError.message);
    return null;
  }
}

export async function getRequestTypeCustomFieldId(
  projectKey: string,
  apiUrl: string,
  authToken: string,
): Promise<string | null> {
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
      return null;
    }

    const project = projects[0];
    const issueTypes = project.issuetypes;
    if (!issueTypes || issueTypes.length === 0) {
      return null;
    }

    for (const issueType of issueTypes) {
      const fields = issueType.fields;
      if (fields) {
        for (const [fieldId, fieldData] of Object.entries(fields)) {
          if (fieldData && typeof fieldData === "object" && "name" in fieldData) {
            const fieldInfo = fieldData as { name?: string };
            if (fieldInfo.name === "Request Type") {
              return fieldId;
            }
          }
        }
      }
    }

    return null;
  } catch (error) {
    const axiosError = error as AxiosError;
    console.error("Error finding Request Type custom field:", axiosError.message);
    return null;
  }
}
