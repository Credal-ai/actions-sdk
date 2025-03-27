import { runAction } from "../src/app";

async function runTest() {
  await runAction(
    "updateTicketStatus",
    "zendesk",
    {
      authToken: "insert-your-auth-token",
      username: "insert-your-username",
    }, // authParams
    {
      ticketId: "62",
      subdomain: "credalai",
      status: "pending",
    }
  );
}

runTest().catch(console.error);
