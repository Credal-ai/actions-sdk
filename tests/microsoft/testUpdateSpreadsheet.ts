import { runAction } from "../../src/app";
import { assert } from "node:console";
import dotenv from 'dotenv';

dotenv.config();

async function runTest() {
    const result = await runAction(
        "updateSpreadsheet",
        "microsoft",
        {
            tenantId: process.env.MICROSOFT_TENANT_ID!,
            clientId: process.env.MICROSOFT_CLIENT_ID!,
            clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
            refreshToken: process.env.MICROSOFT_REFRESH_TOKEN!,
            redirectUri: process.env.MICROSOFT_REDIRECT_URI!,
        }, // authParams
        {
            siteID: process.env.MICROSOFT_SITE_ID!,
            spreadsheetId: process.env.MICROSOFT_SPREADSHEET_ID!,
            range: "Sheet1!A1:C2",
            values: [
                ["Name", "Age"],
                ["John Doe", "30"],
                ["Date", new Date().toISOString()],
            ],
        },
    );
    console.log(result);
    assert(result.success, "Spreadsheet was not updated successfully");
}

runTest().catch(console.error);
