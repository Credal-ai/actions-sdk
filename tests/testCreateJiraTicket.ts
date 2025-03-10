import assert from "node:assert";
import { runAction } from "../src/app";

async function runTest() {

    const authToken = "insert-during-test"; // Get API Token from: https://id.atlassian.com/manage-profile/security/api-tokens
    const baseUrl = "insert-during-test" // Base URL of your confluence account
    const username = "insert-during-test"; // The email associated with the API token
    const projectKey = "insert-during-test"; // Project Key of your Jira project
    
    const result = await runAction(
        "createJiraTicket",
        "jira",
        { 
            authToken,
            baseUrl,
            username,
        },
        {
            projectKey,
            summary: `CR - Test Ticket ${new Date().toISOString()}`,
            description: `CR - Test Ticket ${new Date().toISOString()}`,
            issueType: "Task", // Adjust based on available issue types in your Jira
            reporter: "", // Optional - (defaults to the authenticated user related to the auth token)
            assignee: "", // Optional
            username,
        }
    );
    
    console.log(JSON.stringify(result, null, 2));
    
    // Validate response
    assert(result, "Response should not be null");
    assert(result.ticketUrl, "Response should contain a url to the created ticket");
    
    console.log(`Successfully created Jira ticket: ${result.ticketUrl}`);
}

runTest().catch(error => {
    console.error("Test failed:", error);
    if (error.response) {
        console.error("API response:", error.response.data);
        console.error("Status code:", error.response.status);
    }
    process.exit(1);
});