import dotenv from "dotenv";
import assert from "node:assert";
import type { googleOauthAddTextToTopOfDocOutputType } from "../../src/actions/autogen/types.js";
import { runAction } from "../../src/app.js";

dotenv.config();

async function runTest() {
  console.log("Running test: addTextToTopOfDoc with markdown contentFormat");

  const documentId = process.env.GOOGLE_TEST_DOCUMENT_ID;
  if (!documentId) {
    throw new Error(
      "Set GOOGLE_TEST_DOCUMENT_ID env var to an existing Google Doc ID",
    );
  }

  const markdown = `## Prepended Section

Revenue grew **23%** YoY to **$4.2M**. See [full dashboard](https://credal.ai).

### Highlights

- **Enterprise** segment up *31%*
- **SMB** segment up *18%*
- New logo acquisition: \`47 accounts\`

### Next Steps

1. Finalize **board deck** by Friday
2. Schedule review with *leadership team*
3. Update [forecast model](https://sheets.google.com/forecast)
`;

  const result = (await runAction(
    "addTextToTopOfDoc",
    "googleOauth",
    { authToken: process.env.GOOGLE_OAUTH_TOKEN },
    {
      documentId,
      text: markdown,
      contentFormat: "markdown",
    },
  )) as googleOauthAddTextToTopOfDocOutputType;

  console.log("Result:", JSON.stringify(result, null, 2));

  assert(result.success, "Add text to top of doc should succeed");
  assert(result.documentUrl, "Should return a documentUrl");
  assert(
    result.documentUrl.includes(documentId),
    "Document URL should contain the document ID",
  );

  console.log("\nOpen the doc to verify formatting:");
  console.log(result.documentUrl);
  console.log(
    "\nExpected: headings, bold, italic, links, bullet lists, numbered lists, inline code",
  );
}

runTest().catch((error) => {
  console.error("Test failed:", error);
  process.exit(1);
});
