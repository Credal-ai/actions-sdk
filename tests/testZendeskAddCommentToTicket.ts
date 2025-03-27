import { runAction } from "../src/app";

async function runTest() {
  await runAction(
    "addCommentToTicket",
    "zendesk",
    {
      authToken: "insert-your-auth-token",
      username: "insert-your-username",
    }, // authParams
    {
      ticketId: "62",
      subdomain: "credalai",
      comment: {
        body: "This is a test private comment",
        public: true,
      }
    }
  );
}

runTest().catch(console.error);
