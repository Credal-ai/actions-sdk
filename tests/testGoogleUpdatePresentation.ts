import { googleOauthUpdatePresentationParamsType } from "../src/actions/autogen/types";
import { runAction } from "../src/app";
import assert from "node:assert";

/**
 * Test for the Google OAuth updatePresentation action
 */
async function runTest() {
  console.log("Running test for Google OAuth updatePresentation");

  const authToken = "insert-access-token"; // Test with token from: https://developers.google.com/oauthplayground/
  const presentationId = "insert-presentation-id"; // Insert an existing presentation ID to test with

  // Update the presentation with various requests
  const result = await runAction(
    "updatePresentation",
    "googleOauth",
    {
      authToken,
    },
    {
      presentationId,
      requests: [
        {
          createSlide: {
            objectId: "newSlide1",
            insertionIndex: 1,
            slideLayoutReference: {
              predefinedLayout: "BLANK",
            },
          },
        },
        {
          createShape: {
            objectId: "shape1",
            shapeType: "RECTANGLE",
            elementProperties: {
              pageObjectId: "newSlide1",
              size: {
                width: { magnitude: 200, unit: "PT" },
                height: { magnitude: 100, unit: "PT" },
              },
              transform: {
                scaleX: 1,
                scaleY: 1,
                translateX: 100,
                translateY: 100,
                unit: "PT",
              },
            },
          },
        },
        {
          insertText: {
            objectId: "shape1",
            text: "Hello World!",
            insertionIndex: 0,
          },
        },
      ],
    } as googleOauthUpdatePresentationParamsType
  );

  console.log("Result:", result);

  // Validate the result
  assert(result.success, "Result should indicate success");
  assert(result.presentationUrl, "Result should contain a presentationUrl");
  assert(
    result.presentationUrl.includes(presentationId),
    "Presentation URL should contain the presentation ID"
  );

  console.log("Link to updated Google Presentation:", result.presentationUrl);

  return result;
}

// Run the test
runTest().catch((error) => {
  console.error("Test execution failed:", error);
  process.exit(1);
});
