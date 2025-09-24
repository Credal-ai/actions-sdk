import { jiraConfig, validateConfig } from "./utils.js";
import type { JiraTestConfig } from "./utils.js";

interface ErrorWithResponse {
  response?: {
    data?: unknown;
    status?: number;
  };
}

export async function runJiraTest(
  testName: string,
  testFunction: (config: JiraTestConfig) => Promise<void>,
): Promise<void> {
  if (!validateConfig()) {
    console.log("\n💡 Set environment variables:");
    console.log("   JIRA_PROVIDER=cloud|datacenter (defaults to cloud)");
    console.log("   JIRA_AUTH_TOKEN=your_oauth_token");
    console.log("   JIRA_BASE_URL=https://your-domain.atlassian.net (or your DC URL)");
    console.log("   JIRA_PROJECT_KEY=TEST");
    console.log("   JIRA_ISSUE_ID=TEST-123");
    console.log("   JIRA_CLOUD_ID=abc123 (only required for cloud)");
    console.log("\n📚 OAuth setup guides:");
    console.log("   Cloud: https://developer.atlassian.com/cloud/jira/platform/oauth-2-3lo-apps/");
    console.log("   Data Center: https://confluence.atlassian.com/adminjiraserver/jira-oauth-2-0-provider-api-1115659070.html");
    return;
  }

  try {
    await testFunction(jiraConfig);
    console.log(`✅ ${testName} passed for ${jiraConfig.name}`);
  } catch (error) {
    console.error(`❌ ${testName} failed for ${jiraConfig.name}:`);
    console.error(error);

    const err = error as ErrorWithResponse;
    if (err.response) {
      console.error("API response:", err.response.data);
      console.error("Status code:", err.response.status);
    }
  }
}