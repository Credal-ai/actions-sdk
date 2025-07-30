import { runAction } from "../../src/app.js";

async function runTest() {
  const output = await runAction(
    "listTicketsByQuery",
    "zendesk",
    {
      authToken: "insert-auth-token",
    }, // authParams
    {
      subdomain: "insert-subdomain",
      query: "status:closed priority:high",
      limit: 5,
    }
  );

  console.log("Output:", output);
}

runTest().catch(console.error);
