import { runAction } from "../../src/app";

async function runTest() {
  await runAction(
    "assignTicket",
    "zendesk",
    {
      apiKey: "insert-your-api-key",
      username: "insert-your-username",
    }, // authParams
    {
      ticketId: "62",
      subdomain: "credalai",
      assigneeEmail: "ravin@credal.ai",
    },
  );
}

runTest().catch(console.error);
