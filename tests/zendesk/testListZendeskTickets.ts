import { runAction } from "../../src/app.js";

async function runTest() {
  const output = await runAction(
    "listZendeskTickets",
    "zendesk",
    {
      authToken: "insert-auth-token",
    }, // authParams
    {
      subdomain: "insert_your_subdomain_here",
      comment: {
        body: "This is a test private comment",
        public: true,
      },
    },
  );

  console.log("Output:", output);
}

runTest().catch(console.error);
