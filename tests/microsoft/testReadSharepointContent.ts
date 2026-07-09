import { runAction } from "../../src/app.js";
import { assert } from "node:console";
import dotenv from "dotenv";

dotenv.config();

async function runTest() {
  const result = await runAction(
    "readSharepointContent",
    "microsoft",
    {
      authToken: process.env.MICROSOFT_AUTH_TOKEN!,
    }, // authParams
    {
      url: process.env.MICROSOFT_SHAREPOINT_FILE_URL!,
      charLimit: 5000,
    },
  );
  console.log(JSON.stringify(result, null, 2));
  assert(result.success, "Content was not read successfully");
}

runTest().catch(console.error);
