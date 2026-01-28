import { runAction } from "../../src/app.js";
import assert from "node:assert";

const authToken = process.env.GOOGLE_OAUTH_TOKEN;
const documentId = process.env.GOOGLE_DOC_ID;

async function runTest() {
  assert(authToken, "Missing GOOGLE_OAUTH_TOKEN env var");
  assert(documentId, "Missing GOOGLE_DOC_ID env var");

  const result = await runAction(
    "readCommentsOnDoc",
    "googleOauth",
    {
      authToken,
    },
    {
      documentId,
      pageSize: 50,
      includeDeleted: false,
    },
  );

  assert(result.success, "readCommentsOnDoc operation should be successful");
  assert(Array.isArray(result.comments), "Result should contain a comments array");

  console.log("Result:", JSON.stringify(result, null, 2));
}

runTest();
