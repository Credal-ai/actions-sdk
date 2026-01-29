import { runAction } from "../../src/app.js";
import assert from "node:assert";

const authToken = "insert-auth-token";
const documentId = "insert-document-id";

async function runTest() {
  const result = await runAction(
    "addTextToTopOfDoc",
    "googleOauth",
    {
      authToken,
    },
    {
      documentId,
      text: "Prepended text\n",
    },
  );

  assert(result.success, "Add text to top of document operation should be successful");
  assert(result.documentUrl, "Result should contain a documentUrl");
  assert(result.documentUrl.includes(documentId), "Document URL should contain the document ID");

  console.log("Result:", result);
}

runTest();
