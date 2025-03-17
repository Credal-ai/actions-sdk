import assert from "assert";
import { runAction } from "../../src/app";

async function runTest() {
  console.log("Running test for Confluence fetchPageContent");

  // Set authentication parameters
  const authParams = {
    baseUrl: "https://your-domain.atlassian.net", // Replace with your Confluence URL
    username: "your-email@example.com",           // Replace with your Confluence username/email
    authToken: "your-api-token"                   // Generate from https://id.atlassian.com/manage-profile/security/api-tokens
  };

  // Page ID to fetch
  const pageParams = {
    pageId: "123456" // Replace with an actual page ID from your Confluence
  };

  try {
    const result = await runAction(
      "fetchPageContent",
      "confluence",
      authParams,
      pageParams
    );
    
    console.log("Confluence page content fetched successfully!");
    console.log("Page title:", result.title);
    console.log("Page URL:", result.pageUrl);
    console.log("Content", `${result.content.substring(0, 100)}..`);
    
    // Validate the result
    assert(result.pageId === pageParams.pageId, "Result should contain matching page ID");
    assert(result.title, "Result should contain a page title");
    assert(result.content, "Result should contain page content");
    assert(result.pageUrl, "Result should contain a page URL");
    
    return result;
  } catch (error) {
    console.error("Failed to fetch Confluence page content:", error);
    throw error;
  }
}

// Run the test
runTest().catch((error) => {
  console.error("Test execution failed:", error);
  process.exit(1);
});