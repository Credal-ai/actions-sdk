import dotenv from "dotenv";

dotenv.config();

export const jiraConfig = {
  // For OAuth Credentials with Jira: https://developer.atlassian.com/cloud/jira/platform/oauth-2-3lo-apps/
  authToken: process.env.JIRA_AUTH_TOKEN!,
  cloudId: process.env.JIRA_CLOUD_ID!,
  baseUrl: process.env.JIRA_BASE_URL!,
  projectKey: process.env.JIRA_PROJECT_KEY!,
  issueId: process.env.JIRA_ISSUE_ID!,
  assignee: process.env.JIRA_ASSIGNEE || "",
  serviceDeskId: process.env.JIRA_SERVICE_DESK_ID || "1",
  requestTypeId: process.env.JIRA_REQUEST_TYPE_ID || "5",
};

// export const provider = "jira";
export const provider = "jiraOrg";
