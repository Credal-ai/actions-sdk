import { runAction } from "../src/app";
import assert from "node:assert";

/**
 * Test for the Drive OAuth createNewGoogleDoc action
 */
async function runTest() {
  console.log("Running test for Drive OAuth createNewGoogleDoc");

  // Test with token from: https://developers.google.com/oauthplayground/
  // Scope is: https://www.googleapis.com/auth/drive.file
  const authToken = "insert-access-token";

  const result = await runAction(
    "createNewGoogleDriveDoc",
    "driveOauth",
    {
      authToken,
    },
    {
      title: "Credal Drive Test Doc",
      content:
        "This is a test document created automatically through the Drive API by the actions-sdk test suite.",
    }
  );

  console.log("Result:", result);

  // Validate the result
  assert(result.fileId, "Result should contain a fileId");
  assert(result.fileUrl, "Result should contain a fileUrl");
  assert(result.fileUrl.includes(result.fileId), "File URL should contain the file ID");

  console.log("Link to Google Doc: ", result.fileUrl);

  return result;
}

// Run the test
runTest().catch((error) => {
  console.error("Test execution failed:", error);
  process.exit(1);
});