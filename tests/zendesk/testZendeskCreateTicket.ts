import { assert } from "node:console";
import { runAction } from "../../src/app";

async function runTest() {
  const result = await runAction(
    "createTicket",
    "zendesk",
    { 
      apiKey: "insert-your-api-key",
      username: "insert-your-username"
    }, // authParams
    {
      subject: "Test ticket",
      body: "This is a test ticket",
      requesterEmail: "ravin@credal.ai",
      subdomain: "credalaihelp",
    },
  );
  assert(result.ticketId !== "Error");
}

runTest().catch(console.error);
