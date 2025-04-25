import { runAction } from "../../src/app";

/**
 * Test for updating a Confluence page
 */
async function runTest() {
  console.log("Running test for Confluence overwritePage");

  // Generate from https://id.atlassian.com/manage-profile/security/api-tokens
  const authParams = {
    authToken: "insert-your-token-here",
  };

  // Define the page parameters
  const pageParams = {
    pageId: "insert-the-page-id-here", // Page ID to update
    title: "insert-the-page-title-here", // Title of the page
    content:
      "<p>This page was updated by the actions-sdk test on " +
      new Date().toISOString() +
      "</p>",
  };

  try {
    await runAction("overwritePage", "confluence", authParams, pageParams);
    console.log("Confluence page updated successfully!: " + pageParams.title);
    return true;
  } catch (error) {
    console.error("Failed to update Confluence page:", error);
    throw error;
  }
}

// Run the test
runTest().catch((error) => {
  console.error("Test execution failed:", error);
  process.exit(1);
});
