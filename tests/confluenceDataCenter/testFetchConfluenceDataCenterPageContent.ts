import assert from "assert";
import { runAction } from "../../src/app.js";

async function runTest() {
  console.log("Running test for Confluence Data Center fetchPageContent");

  const authParams = {
    authToken: "insert-your-pat-here",
    baseUrl: "https://your-confluence-instance.example.com",
  };

  const pageParams = {
    pageId: "insert-confluence-page-id",
  };

  try {
    const result = await runAction(
      "fetchPageContent",
      "confluenceDataCenter",
      authParams,
      pageParams
    );

    console.log("Confluence Data Center page content fetched successfully!");
    console.log("Page title:", result.title);
    console.log("Content", `${result.content.substring(0, 100)}..`);

    assert(
      result.pageId === pageParams.pageId,
      "Result should contain matching page ID"
    );
    assert(result.title, "Result should contain a page title");
    assert(result.content, "Result should contain page content");

    return result;
  } catch (error) {
    console.error("Failed to fetch Confluence Data Center page content:", error);
    throw error;
  }
}

runTest().catch((error) => {
  console.error("Test execution failed:", error);
  process.exit(1);
});
