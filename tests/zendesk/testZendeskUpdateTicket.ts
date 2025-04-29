import { runAction } from "../../src/app";

async function runTest() {
  await runAction(
    "updateTicketStatus",
    "zendesk",
    {
      apiKey: "insert-your-api-key",
      username: "insert-your-username",
    }, // authParams
    {
      ticketId: "62",
      subdomain: "credalai",
      status: "pending",
    },
  );
}

runTest().catch(console.error);
