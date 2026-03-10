import dotenv from "dotenv";
import assert from "node:assert";
import type { googleOauthCreateNewGoogleDocOutputType } from "../../src/actions/autogen/types.js";
import { runAction } from "../../src/app.js";

dotenv.config();

async function runTest() {
  console.log("Running test: createNewGoogleDoc with markdown contentFormat");

  const markdown = `# Formatting Test

## Summary

Revenue grew **23%** YoY to **$4.2M**. See [full dashboard](https://credal.ai).

## Key Highlights

- **Enterprise** segment up *31%*
- **SMB** segment up *18%*
- New logo acquisition: \`47 accounts\`

## Next Steps

1. Finalize **board deck** by Friday
2. Schedule review with *leadership team*
3. Update [forecast model](https://sheets.google.com/forecast)

\`\`\`python
def calculate_growth(current, previous):
    return (current - previous) / previous * 100
\`\`\`

This is plain text after the code block.
`;

  const result = (await runAction(
    "createNewGoogleDoc",
    "googleOauth",
    { authToken: process.env.GOOGLE_OAUTH_TOKEN },
    {
      title: "Markdown Formatting Test - " + new Date().toISOString(),
      content: markdown,
      contentFormat: "markdown",
    },
  )) as googleOauthCreateNewGoogleDocOutputType;

  console.log("Result:", JSON.stringify(result, null, 2));

  assert(result.documentId, "Should return a documentId");
  assert(result.documentUrl, "Should return a documentUrl");

  console.log("\nOpen the doc to verify formatting:");
  console.log(result.documentUrl);
  console.log(
    "\nExpected: headings, bold, italic, links, bullet lists, numbered lists, code block",
  );
}

runTest().catch((error) => {
  console.error("Test failed:", error);
  process.exit(1);
});
