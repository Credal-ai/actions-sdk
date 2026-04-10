import { runAction } from "../../src/app.js";

async function runTest() {
  const output = await runAction(
    "searchZendeskByQuery",
    "zendesk",
    {
      authToken: "insert-auth-token",
    }, // authParams
    {
      subdomain: "insert-subdomain",
      query: "status:closed priority:high",
      objectType: "ticket",
      limit: 5,
    },
  );

  console.log("Output:", output);
}

runTest().catch(console.error);
