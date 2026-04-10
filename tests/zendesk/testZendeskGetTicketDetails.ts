import { assert } from "node:console";
import { runAction } from "../../src/app.js";

import dotenv from "dotenv";
dotenv.config();

async function runTest() {
  const result = await runAction(
    "getTicketDetails",
    "zendesk",
    {
      authToken: process.env.ZENDESK_TOKEN || "insert-your-token",
    },
    {
      ticketId: "40",
      subdomain: "credalai",
    },
  );

  // Basic assertions
  console.log("Ticket Id:", result.ticket.id);
  console.log("Ticket Status:", result.ticket.status);

  assert(result.ticket, "Ticket should be present");
  assert(result.ticket.id, "Ticket should have an ID");
  assert(result.ticket.subject, "Ticket should have a subject");
  assert(result.ticket.status, "Ticket should have a status");

  console.log("✅ All tests passed!");
}

runTest().catch(console.error);
