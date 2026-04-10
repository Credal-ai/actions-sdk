import assert from "node:assert";
import { runAction } from "../../src/app.js";
import dotenv from "dotenv";

dotenv.config();

async function runTest() {
  const result = await runAction(
    "getTickets",
    "hubspot",
    { authToken: process.env.HUBSPOT_AUTH_TOKEN },
    { query: "", limit: 2 },
  );

  console.log("Response: ", JSON.stringify(result, null, 2));

  assert(result, "Response should not be null");
  assert(result.success, "Response should indicate success");
  assert(Array.isArray(result.tickets), "Tickets should be an array");
  if (result.tickets.length > 0) {
    const ticket = result.tickets[0];
    assert(ticket.id, "Ticket should have an ID");
    assert("subject" in ticket, "Ticket should have a subject");
    assert("status" in ticket, "Ticket should have a status");
    assert("createdAt" in ticket, "Ticket should have a createdAt");
  }
}

runTest().catch((error) => {
  console.error("Test failed:", error);
  if (error.response) {
    console.error("API response:", error.response.data);
    console.error("Status code:", error.response.status);
  }
  process.exit(1);
});
