import { assert } from "node:console";
import { runAction } from "../../src/app";

async function runTest() {
  const result = await runAction(
    "getTicketDetails",
    "zendesk",
    {
      apiKey: "insert-your-api-key",
      username: "insert-your-username",
    }, // authParams
    {
      ticketId: "62",
      subdomain: "credalai",
    },
  );
  console.log(result);
  assert(result.id !== "");
}

runTest().catch(console.error);
