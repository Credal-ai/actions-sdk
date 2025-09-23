import dotenv from "dotenv";

dotenv.config();

export interface JiraTestConfig {
  authToken: string;
  cloudId?: string;
  baseUrl: string;
  projectKey: string;
  issueId: string;
  assignee: string;
  serviceDeskId: string;
  requestTypeId: string;
  provider: "jira" | "jiraOrg" | "jiraDataCenter";
  name: string;
}

export type ProviderType = "cloud" | "datacenter";

// Get the provider type from environment
const providerType = (process.env.JIRA_PROVIDER as ProviderType) || "cloud";

function createJiraConfig(): JiraTestConfig {
  const baseConfig = {
    authToken: process.env.JIRA_AUTH_TOKEN!,
    baseUrl: process.env.JIRA_BASE_URL!,
    projectKey: process.env.JIRA_PROJECT_KEY!,
    issueId: process.env.JIRA_ISSUE_ID!,
    assignee: process.env.JIRA_ASSIGNEE || "",
    serviceDeskId: process.env.JIRA_SERVICE_DESK_ID || "1",
    requestTypeId: process.env.JIRA_REQUEST_TYPE_ID || "5",
  };

  if (providerType === "datacenter") {
    return {
      ...baseConfig,
      provider: "jiraDataCenter",
      name: "Jira Data Center",
    };
  } else {
    return {
      ...baseConfig,
      cloudId: process.env.JIRA_CLOUD_ID!,
      provider: "jira",
      name: "Jira Cloud",
    };
  }
}

export const jiraConfig = createJiraConfig();

// For backward compatibility
export const provider = "jiraOrg";

export function validateConfig(): boolean {
  if (!process.env.JIRA_AUTH_TOKEN) {
    console.error("❌ JIRA_AUTH_TOKEN is required");
    return false;
  }

  if (!process.env.JIRA_BASE_URL) {
    console.error("❌ JIRA_BASE_URL is required");
    return false;
  }

  if (!process.env.JIRA_PROJECT_KEY) {
    console.error("❌ JIRA_PROJECT_KEY is required");
    return false;
  }

  if (!process.env.JIRA_ISSUE_ID) {
    console.error("❌ JIRA_ISSUE_ID is required");
    return false;
  }

  if (providerType === "cloud" && !process.env.JIRA_CLOUD_ID) {
    console.error("❌ JIRA_CLOUD_ID is required when JIRA_PROVIDER=cloud");
    return false;
  }

  return true;
}
