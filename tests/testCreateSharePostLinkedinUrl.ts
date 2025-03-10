import assert from "node:assert";
import { runAction } from "../src/app";

async function runTest() {

    const text = `This is a multi-line 👋
text for LinkedIn sharing

This should work with whitespace 
And should display in the post when you click the URL
    `;
    const url = "https://app.credal.ai/";
    
    const result = await runAction(
        "createShareLinkedinPostUrl",
        "linkedin",
        {}, 
        {
            text,
            url
        }
    );
        
    assert(result, "Response should not be null");
    assert(result.linkedinUrl, "Response should contain a shareable linkedin URL");

    console.log(`Successfully created Linkedin Share Post URL: ${result.linkedinUrl}`);
}

runTest().catch(error => {
    console.error("Test failed:", error);
    if (error.response) {
        console.error("API response:", error.response.data);
        console.error("Status code:", error.response.status);
    }
    process.exit(1);
});