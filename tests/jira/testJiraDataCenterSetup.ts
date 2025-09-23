import { jiraConfig, validateConfig } from "./utils.js";

async function testSetup() {
  console.log("🔧 Jira Test Setup");
  console.log("==================\n");

  console.log("📋 Configuration check:");

  if (!validateConfig()) {
    console.log("❌ Configuration incomplete!\n");
    console.log("💡 Set environment variables:");
    console.log("   JIRA_PROVIDER=cloud|datacenter (defaults to cloud)");
    console.log("   JIRA_AUTH_TOKEN=your_oauth_token");
    console.log("   JIRA_BASE_URL=https://your-domain.atlassian.net (or your DC URL)");
    console.log("   JIRA_PROJECT_KEY=TEST");
    console.log("   JIRA_ISSUE_ID=TEST-123");
    console.log("   JIRA_CLOUD_ID=abc123 (only required for cloud)\n");
    console.log("📚 OAuth setup guides:");
    console.log("   Cloud: https://developer.atlassian.com/cloud/jira/platform/oauth-2-3lo-apps/");
    console.log("   Data Center: https://confluence.atlassian.com/adminjiraserver/jira-oauth-2-0-provider-api-1115659070.html");
    return;
  }

  console.log(`✅ ${jiraConfig.name} Configuration:`);
  console.log(`   Provider: ${jiraConfig.provider}`);
  console.log(`   Base URL: ${jiraConfig.baseUrl}`);
  if (jiraConfig.cloudId) {
    console.log(`   Cloud ID: ${jiraConfig.cloudId}`);
  }
  console.log(`   Project: ${jiraConfig.projectKey}`);
  console.log(`   Issue ID: ${jiraConfig.issueId}`);
  console.log(`   Has Auth Token: ${jiraConfig.authToken ? "✅" : "❌"}`);
  console.log();

  console.log("🧪 Ready to run tests! Try:");
  console.log("   npm run test tests/jira/testCreateJiraTicket.ts");
  console.log("   npm run test tests/jira/testAssignJiraTicket.ts");
  console.log("   npm run test tests/jira/testCommentJiraTicket.ts");
  console.log("\n💡 To switch between Cloud and Data Center:");
  console.log("   export JIRA_PROVIDER=cloud    # Test Jira Cloud");
  console.log("   export JIRA_PROVIDER=datacenter # Test Jira Data Center");
}

testSetup().catch((error) => {
  console.error("Setup check failed:", error);
  process.exit(1);
});