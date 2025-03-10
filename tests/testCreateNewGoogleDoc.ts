import { runAction } from "../src/app";
import assert from "node:assert";

/**
 * Test for the Google OAuth createNewGoogleDoc action
 */
async function runTest() {
  console.log("Running test for Google OAuth createNewGoogleDoc");

  const accessToken = "insert-access-token"; // Test with token from: https://developers.google.com/oauthplayground/

  const result = await runAction(
    "createNewGoogleDoc",
    "google_oauth",
    {
      accessToken,
    },
    {
      title: "Fahad Doc",
      description:
        "This is a test document created automatically by the actions-sdk test suite.",
    }
  );

  console.log("Result:", result);

  // Validate the result
  assert(result.documentId, "Result should contain a documentId");
  assert(result.documentUrl, "Result should contain a documentUrl");
  assert(result.documentUrl.includes(result.documentId),"Document URL should contain the document ID");

  console.log("Linke to Google Doc: ", result.documentUrl);

  return result;
}

// Run the test
runTest().catch((error) => {
  console.error("Test execution failed:", error);
  process.exit(1);
});
