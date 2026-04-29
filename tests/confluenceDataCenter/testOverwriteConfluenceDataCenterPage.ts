import { runAction } from "../../src/app.js";

async function runTest() {
  console.log("Running test for Confluence Data Center overwritePage");

  const authParams = {
    authToken: "insert-your-pat-here",
    baseUrl: "https://your-confluence-instance.example.com",
  };

  const pageParams = {
    pageId: "insert-the-page-id-here",
    title: "insert-the-page-title-here",
    content:
      "<p>This page was updated by the actions-sdk test on " +
      new Date().toISOString() +
      "</p>",
  };

  try {
    await runAction("overwritePage", "confluenceDataCenter", authParams, pageParams);
    console.log("Confluence Data Center page updated successfully!: " + pageParams.title);
    return true;
  } catch (error) {
    console.error("Failed to update Confluence Data Center page:", error);
    throw error;
  }
}

runTest().catch((error) => {
  console.error("Test execution failed:", error);
  process.exit(1);
});
