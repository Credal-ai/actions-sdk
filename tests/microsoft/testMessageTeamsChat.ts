import { runAction } from "../../src/app";
import { assert } from "node:console"
import dotenv from 'dotenv';

dotenv.config();

async function runTest() {
    const result = await runAction(
        "messageTeamsChat",
        "microsoft",
        {
            tenantId: process.env.MICROSOFT_TENANT_ID!,
            clientId: process.env.MICROSOFT_CLIENT_ID!,
            clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
            refreshToken: process.env.MICROSOFT_REFRESH_TOKEN!,
            redirectUri: process.env.MICROSOFT_REDIRECT_URI!,
        }, // authParams
        {
            message: "Hello from actions-sdk testing of Microsoft365 Teams chat integration",
            chatId: process.env.MICROSOFT_CHAT_ID!,
        },
    );
    console.log(result);
    assert(result.success, "Message was not sent successfully");
}

runTest().catch(console.error);