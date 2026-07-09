import { runAction } from "../../src/app.js";
import { assert } from "node:console";
import dotenv from "dotenv";

dotenv.config();

async function runTest() {
  const result = await runAction(
    "listSharepointFolder",
    "microsoft",
    {
      authToken: process.env.MICROSOFT_AUTH_TOKEN!,
    }, // authParams
    {
      url: process.env.MICROSOFT_SHAREPOINT_FOLDER_URL!,
      recursive: process.env.MICROSOFT_SHAREPOINT_RECURSIVE === "true",
      maxItems: 50,
    },
  );
  console.log(JSON.stringify(result, null, 2));
  assert(result.success, "Folder was not listed successfully");
}

runTest().catch(console.error);
