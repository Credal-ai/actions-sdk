import { assert } from "node:console";
import { runAction } from "../src/app";

async function runTest() {
  const result = await runAction(
    "createTicket",
    "zendesk",
    { apiKey: "insert-during-testing" }, // authParams
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
