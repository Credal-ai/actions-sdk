import assert from "node:assert";
import { runAction } from "../src/app";


async function runTest() {


    const fullParams = {
        subdomain: "insert-subdomain",
        subject: "Credal Test Support Ticket",
        body: "This is a test ticket created through the API.\nIt has multiple lines of text.\n\nPlease ignore.",
    };
    
    const result = await runAction(
        "createZendeskTicket",
        "zendesk",
        {
            apiKey: "insert-api-key",
            username: "insert-email-associated-with-api-key"
        }, 
        fullParams
    );
        
    assert(result, "Response should not be null");
    assert(result.ticket, "Response should contain a ticket object");
    assert(result.ticket.id, "Ticket should have an ID");
    
    console.log(`Successfully created Zendesk ticket with ID: ${result.ticket.id}`);
}

runTest().catch(error => {
    console.error("Test failed:", error);
    if (error.response) {
        console.error("API response:", error.response.data);
        console.error("Status code:", error.response.status);
    }
    process.exit(1);
});