import { runAction } from "../../src/app";
import { assert } from "node:console";
import dotenv from 'dotenv';

dotenv.config();

async function runTest() {
    const result = await runAction(
        "updateDocument",
        "microsoft",
        {
            tenantId: process.env.MICROSOFT_TENANT_ID!,
            clientId: process.env.MICROSOFT_CLIENT_ID!,
            clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
            refreshToken: process.env.MICROSOFT_REFRESH_TOKEN!,
            redirectUri: process.env.MICROSOFT_REDIRECT_URI!,
        },
        {
            siteID: process.env.MICROSOFT_SITE_ID!,
            documentId: process.env.MICROSOFT_DOCUMENT_ID!,
            content: `This is updated document content. ${new Date().toISOString()}`,
            contentType: "text"
        },
    );
    console.log(result);
    assert(result.success, "Document was not updated successfully");
}

runTest().catch(console.error);
