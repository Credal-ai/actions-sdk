import { runAction } from "../../src/app";

async function runTest() {
    const output = await runAction(
        "listZendeskTickets",
        "zendesk",
        {
            apiKey: "insert_your_api_key_here",
            username: "insert_your_username_here",
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
