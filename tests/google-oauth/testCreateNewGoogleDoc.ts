import { runAction } from "../../src/app.js";
import assert from "node:assert";

/**
 * Test for the Google OAuth createNewGoogleDoc action
 */
async function runTest() {
  console.log("Running test for Google OAuth createNewGoogleDoc");

  const authToken = "insert-token-here";

  const result1 = await runAction(
    "createNewGoogleDoc",
    "googleOauth",
    {
      authToken,
    },
    {
      title: "Credal Test Doc",
      usesHtml: false,
      content:
        "This is a test document created automatically by the actions-sdk test suite.",
    },
  );

  const result2 = await runAction(
    "createNewGoogleDoc",
    "googleOauth",
    {
      authToken,
    },
    {
      title: "Credal Test Doc",
      usesHtml: true,
      content:
        "<p>This is a <strong>test</strong> document created automatically by the actions-sdk test suite.</p>",
    },
  );

  console.log("Result1:", result1);
  console.log("Result2:", result2);

  // Validate the result
  assert(result1.documentId, "Result should contain a documentId");
  assert(result1.documentUrl, "Result should contain a documentUrl");
  assert(result2.documentId, "Result should contain a documentId");
  assert(result2.documentUrl, "Result should contain a documentUrl");
  assert(
    result1.documentUrl.includes(result1.documentId),
    "Document URL should contain the document ID",
  );
  assert(
    result2.documentUrl.includes(result2.documentId),
    "Document URL should contain the document ID",
  );

  console.log("Link to Google Doc without html: ", result1.documentUrl);
  console.log("Link to Google Doc with html: ", result2.documentUrl);

  return result1;
}

// Run the test
runTest().catch((error) => {
  console.error("Test execution failed:", error);
  process.exit(1);
});
