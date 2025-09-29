import { runAction } from "../../src/app.js";

async function runTest() {
  const result = await runAction(
    "addCommentToTicket",
    "zendesk",
    {
      authToken: "insert-auth-token",
    }, // authParams
    {
      ticketId: "62",
      subdomain: "credalai",
      body: "This is a test private-private comment",
      public: true,
    },
  );

  console.log(result);
}

runTest().catch(console.error);
