import assert from "node:assert";
import { runAction } from "../src/app";

async function runTest() {
  const template = "This is a template that's not filled in ${VALUE}";

  const result = await runAction(
    "fillTemplateAction",
    "generic",
    {},
    {
      template,
    },
  );

  assert(result, "Response should not be null");
  assert(result.result, "Response should contain a result");
  assert.strictEqual(result.result, template, "Template should be returned as-is");

  console.log("Successfully tested fillTemplateAction");
}

runTest().catch((error) => {
  console.error("Test failed:", error);
  if (error.response) {
    console.error("API response:", error.response.data);
    console.error("Status code:", error.response.status);
  }
  process.exit(1);
});