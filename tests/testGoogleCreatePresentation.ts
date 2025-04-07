import { googleOauthCreatePresentationParamsType } from "../src/actions/autogen/types";
import { runAction } from "../src/app";
import assert from "node:assert";

/**
 * Test for the Google OAuth createPresentation action
 */
async function runTest() {
  console.log("Running test for Google OAuth createPresentation");

  const authToken = "insert-access-token"; // Test with token from: https://developers.google.com/oauthplayground/

  // Create a new presentation with custom page size
  const result = await runAction(
    "createPresentation",
    "googleOauth",
    {
      authToken,
    },
    {
      title: "Test Presentation",
      pageSize: {
        width: {
          magnitude: 720,
          unit: "PT",
        },
        height: {
          magnitude: 405,
          unit: "PT",
        },
      },
    } as googleOauthCreatePresentationParamsType,
  );

  console.log("Result:", result);

  // Validate the result
  assert(result.success, "Result should indicate success");
  assert(result.presentationId, "Result should contain a presentationId");
  assert(result.presentationUrl, "Result should contain a presentationUrl");
  assert(
    result.presentationUrl.includes(result.presentationId),
    "Presentation URL should contain the presentation ID",
  );

  console.log("Link to Google Presentation:", result.presentationUrl);

  return result;
}

// Run the test
runTest().catch((error) => {
  console.error("Test execution failed:", error);
  process.exit(1);
});
