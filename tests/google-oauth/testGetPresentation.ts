import { googleOauthGetPresentationParamsType } from "../../src/actions/autogen/types.js";
import { runAction } from "../../src/app.js";
import assert from "node:assert";
import dotenv from "dotenv";

dotenv.config();

/**
 * Test for the Google OAuth getPresentation action
 */
async function runTest() {
  console.log("Running test for Google OAuth getPresentation");

  const authToken = process.env.GOOGLE_OAUTH_TOKEN;
  const presentationId = process.env.PRESENTATION_ID;
  console.log("Presentation ID:", presentationId);

  // Get the presentation
  const result = await runAction(
    "getPresentation",
    "googleOauth",
    {
      authToken,
    },
    {
      presentationId,
    } as googleOauthGetPresentationParamsType,
  );

  console.log("Result:", JSON.stringify(result, null, 2));

  // Validate the result
  assert(result.success, "Result should indicate success");
  assert(result.presentation, "Result should contain presentation data");

  // Check basic presentation structure
  if (result.presentation.title) {
    console.log("Presentation title:", result.presentation.title);
  }

  if (result.presentation.slides && Array.isArray(result.presentation.slides)) {
    console.log("Number of slides:", result.presentation.slides.length);

    // Check if styling exists in slides
    let stylingFound = false;
    for (const slide of result.presentation.slides) {
      if (slide.pageElements && Array.isArray(slide.pageElements)) {
        for (const element of slide.pageElements) {
          if (element.styling && element.styling.length > 0) {
            console.log("Found styling:", element.styling);
            stylingFound = true;
            break;
          }
        }
        if (stylingFound) break;
      }
    }

    if (stylingFound) {
      console.log("Styling information found in presentation");
    } else {
      console.log("No styling information found in presentation elements");
    }
  }

  console.log("Test passed! Successfully retrieved presentation data");

  return result;
}

runTest().catch((error) => {
  console.error("Test execution failed:", error);
  process.exit(1);
});
