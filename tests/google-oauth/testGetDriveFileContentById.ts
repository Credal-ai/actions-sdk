import type { googleOauthGetDriveFileContentByIdParamsType } from "../../src/actions/autogen/types.js";
import { runAction } from "../../src/app.js";
import assert from "node:assert";
import dotenv from "dotenv";

dotenv.config();

/**
 * Test for retrieving Google Drive file content by ID
 */
async function runTest() {
  console.log("Running test getDriveContentById");

  const params: googleOauthGetDriveFileContentByIdParamsType = {
    fileId: process.env.GOOGLE_DRIVE_FILE_ID!, // Provide a valid file ID here
    limit: 5000, // optional character limit
    timeoutLimit: 0,
  };

  const startTime = performance.now();
  const result = await runAction(
    "getDriveFileContentById", // Ensure this matches the action name defined in schema
    "googleOauth",
    {
      authToken: process.env.GOOGLE_DRIVE_AUTH_TOKEN, // Use a valid OAuth token with Drive readonly scope,
    },
    params,
  );
  const endTime = performance.now();
  const duration = endTime - startTime;
  console.log(`Time taken: ${duration} milliseconds`);

  // Basic assertions
  assert.strictEqual(result.success, true, "Retrieval should be successful");
  assert(typeof result.content === "string", "Content should be a string");

  // Additional checks when successful
  if (result.success) {
    assert(result.fileName, "Should include fileName");
    assert(
      typeof result.fileLength === "number",
      "Should include fileLength as number"
    );

    // Ensure truncation logic works when limit is set
    if (params.limit) {
      assert(
        result.content!.length <= params.limit,
        "Content should respect the limit"
      );
    }
  }

  console.log("File name:", result.fileName);
  console.log("Content snippet:", result.content);
}

// Run the test
runTest().catch((error) => {
  console.error("Test failed:", error);
  process.exit(1);
});
