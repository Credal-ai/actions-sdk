import assert from "node:assert";
import { runAction } from "../src/app";

async function runTest() {

    // For OAuth Credentials with Jira: https://developer.atlassian.com/cloud/jira/platform/oauth-2-3lo-apps/
    const authToken =  "insert-your-auth-token-here"
    const cloudId = "insert-your-cloud-id-here"
    const baseUrl = "insert-your-base-url-here"
    const projectKey = "insert-your-project-key-here";


    const result = await runAction(
        "createJiraTicket",
        "jira",
        { 
            authToken,        
            cloudId,
            baseUrl,
        },
        {
            projectKey,
            summary: `Credal - Test Ticket ${new Date().toISOString()}`,
            description: `Credal - Test Ticket ${new Date().toISOString()}`,
            issueType: "Task", // Adjust based on available issue types in your Jira
            reporter: "", // Optional - (defaults to the authenticated user related to the oauth token)
            assignee: "", // Optional
            customFields: { customfield_10100: 'High' }, // Example of custom fields setting
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