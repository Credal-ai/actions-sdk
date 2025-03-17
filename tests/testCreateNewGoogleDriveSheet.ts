import { runAction } from "../src/app";
import assert from "node:assert";

/** Test for the Drive OAuth createNewGoogleDriveSheet action */
async function runTest() {
  console.log("Running test for Drive OAuth createNewGoogleDriveSheet");

  // Test with token from: https://developers.google.com/oauthplayground/
  // Scope is: https://www.googleapis.com/auth/drive.file
  const authToken = "insert-access-token";

  const result = await runAction(
    "createNewGoogleDriveSheet",
    "driveOauth",
    {
      authToken,
    },
    {
      title: "Credal Drive Test Sheet",
      content:
      "Name,Email,Role\nJohn Doe,john@example.com,Manager\nJane Smith,jane@example.com,Developer",    
    }
  );

  console.log("Result:", result);

  // Validate the result
  assert(result.fileId, "Result should contain a fileId");
  assert(result.fileUrl, "Result should contain a fileUrl");
  assert(result.fileUrl.includes(result.fileId), "File URL should contain the file ID");

  console.log("Link to Google Sheet: ", result.fileUrl);

  return result;
}

// Run the test
runTest().catch((error) => {
  console.error("Test execution failed:", error);
  process.exit(1);
});