import { runAction } from "../../src/app.js";
import { assert } from "node:console";
import dotenv from "dotenv";

dotenv.config();

async function runTest() {
  const result = await runAction(
    "getSharepointItem",
    "microsoft",
    {
      authToken: process.env.MICROSOFT_AUTH_TOKEN!,
    }, // authParams
    {
      url: process.env.MICROSOFT_SHAREPOINT_URL!,
    },
  );
  console.log(JSON.stringify(result, null, 2));
  assert(result.success, "Item was not resolved successfully");
}

runTest().catch(console.error);
