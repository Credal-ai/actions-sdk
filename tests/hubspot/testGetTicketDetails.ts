import assert from "node:assert";
import { runAction } from "../../src/app.js";
import dotenv from "dotenv";

dotenv.config();

async function runTest() {
  const result = await runAction(
    "getTicketDetails",
    "hubspot",
    { authToken: process.env.HUBSPOT_AUTH_TOKEN },
    { ticketId: process.env.HUBSPOT_TICKET_ID },
  );

  console.log("Response: ", JSON.stringify(result, null, 2));

  assert(result, "Response should not be null");
  assert(result.success, "Response should indicate success");
  assert(result.ticket, "Response should contain ticket data");
  assert(result.ticket.id, "Ticket should have an ID");
  assert("subject" in result.ticket, "Ticket should have a subject");
  assert("content" in result.ticket, "Ticket should have content");
  assert("pipeline" in result.ticket, "Ticket should have a pipeline");
  assert("status" in result.ticket, "Ticket should have a status");
  assert("priority" in result.ticket, "Ticket should have a priority");
  assert("createdAt" in result.ticket, "Ticket should have a createdAt");
  assert("updatedAt" in result.ticket, "Ticket should have an updatedAt");
  assert("ownerId" in result.ticket, "Ticket should have an ownerId");
  assert("archived" in result.ticket, "Ticket should have an archived field");
}

runTest().catch((error) => {
  console.error("Test failed:", error);
  if (error.response) {
    console.error("API response:", error.response.data);
    console.error("Status code:", error.response.status);
  }
  process.exit(1);
});
