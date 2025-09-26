import dotenv from "dotenv";

dotenv.config();

export interface JiraTestConfig {
  authToken: string;
  cloudId?: string;
  baseUrl: string;
  projectKey: string;
  issueId: string;
  assignee?: string;
  serviceDeskId?: string;
  requestTypeId?: string;
  provider: "jira" | "jiraOrg" | "jiraDataCenter";
  name: string;
}

export type ProviderType = "cloud" | "datacenter";

const providerType = (process.env.JIRA_PROVIDER as ProviderType) || "cloud";

function createJiraConfig(): JiraTestConfig {
  const baseConfig = {
    authToken: process.env.JIRA_AUTH_TOKEN!,
    baseUrl: process.env.JIRA_BASE_URL!,
    projectKey: process.env.JIRA_PROJECT_KEY!,
    issueId: process.env.JIRA_ISSUE_ID!,
    assignee: process.env.JIRA_ASSIGNEE || "",
    serviceDeskId: process.env.JIRA_SERVICE_DESK_ID,
    requestTypeId: process.env.JIRA_REQUEST_TYPE_ID,
  };

  if (providerType === "datacenter") {
    return {
      ...baseConfig,
      provider: "jiraDataCenter",
      name: "Jira Data Center",
    };
  } 
  return {
    ...baseConfig,
    cloudId: process.env.JIRA_CLOUD_ID!,
    provider: "jira",
    name: "Jira Cloud",
  };
}

export function getAuthParams(config: JiraTestConfig) {
  const authParams = {
    authToken: config.authToken,
    baseUrl: config.baseUrl,
  };

  if (config.cloudId) {
    return { ...authParams, cloudId: config.cloudId };
  }

  return authParams;
}

export const jiraConfig = createJiraConfig();

// For backward compatibility
export const provider = "jiraOrg";

