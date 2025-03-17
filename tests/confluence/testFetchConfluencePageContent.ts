import assert from "assert";
import { runAction } from "../../src/app";

async function runTest() {
  console.log("Running test for Confluence fetchPageContent");

 // Generate from https://id.atlassian.com/manage-profile/security/api-tokens
 const authParams = {
  baseUrl: "insert-your-baseurl-here", // https://<your-domain>.atlassian.net/wiki
  username: "insert-your-username-here", // Email associated with api token
  authToken: "insert-your-token-here", 
};


  // Page ID to fetch
  const pageParams = {
    pageId: "insert-confluence-page-id" // Replace with an actual page ID from your Confluence
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
    console.log("Content", `${result.content.substring(0, 100)}..`);
    
    // Validate the result
    assert(result.pageId === pageParams.pageId, "Result should contain matching page ID");
    assert(result.title, "Result should contain a page title");
    assert(result.content, "Result should contain page content");
    
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