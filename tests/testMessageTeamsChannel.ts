import { runAction } from "../src/app";
import { assert } from "node:console"

async function runTest() {
    const result = await runAction(
        "messageTeamsChannel",
        "microsoft",
        {
            tenantId: process.env.MICROSOFT_TENANT_ID!,
            clientId: process.env.MICROSOFT_CLIENT_ID!,
            clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
        }, // authParams
        {
            message: "Hello from actions-sdk testing of Microsoft365 Teams channel integration",
            teamId: process.env.MICROSOFT_TEAM_ID!,
            channelId: process.env.MICROSOFT_CHANNEL_ID!,
        },
    );
    console.log(result);
    assert(result.success, "Message was not sent successfully");
}

runTest().catch(console.error);
