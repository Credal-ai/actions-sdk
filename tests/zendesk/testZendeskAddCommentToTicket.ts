import { runAction } from "../../src/app";

async function runTest() {
  await runAction(
    "addCommentToTicket",
    "zendesk",
    {
      apiKey: "insert-your-api-key",
      username: "insert-your-username",
    }, // authParams
    {
      ticketId: "62",
      subdomain: "credalai",
      comment: {
        body: "This is a test private comment",
        public: true,
      },
    },
  );
}

runTest().catch(console.error);
