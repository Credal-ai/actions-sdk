import { runAction } from "../../src/app.js";
import { assert } from "node:console";
import dotenv from "dotenv";

dotenv.config();

async function runTest() {
  const result = await runAction(
    "searchSharepoint",
    "microsoft",
    {
      authToken: process.env.MICROSOFT_AUTH_TOKEN!,
    }, // authParams
    {
      query: process.env.MICROSOFT_SHAREPOINT_SEARCH_QUERY!,
      scopeUrl: process.env.MICROSOFT_SHAREPOINT_SCOPE_URL,
      driveId: process.env.MICROSOFT_SHAREPOINT_DRIVE_ID,
      limit: 25,
    },
  );
  console.log(JSON.stringify(result, null, 2));
  assert(result.success, "Search did not complete successfully");
}

runTest().catch(console.error);
