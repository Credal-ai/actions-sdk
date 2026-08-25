import { runAction } from "../../src/app.js";

async function runTest() {
  const output = await runAction(
    "searchZendeskTicketsByQuery",
    "zendesk",
    {
      authToken: "insert-auth-token",
    }, // authParams
    {
      subdomain: "insert-subdomain",
      // The type:user filter should be stripped and only tickets returned
      query: "type:user status:closed priority:high",
      limit: 5,
    }
  );

  console.log("Output:", output);
}

runTest().catch(console.error);
