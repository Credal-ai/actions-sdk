import assert from "node:assert";
import { runAction } from "../src/app";

async function runTest() {
    const text = `
    Check out this cool project 👋
    with multi-line text

    This should properly encode spaces and special characters!
    `;
    const url = "https://app.credal.ai/";
    const hashtag = ["AI", "DevTools", "Productivity"];
    const via = "credalai";
    const inReplyTo = "1899674121098957217";
    
    const result = await runAction(
        "createShareXPostUrl",
        "x",
        {}, 
        {
            text,
            url,
            hashtag,
            via,
            inReplyTo
        }
    );
        
    assert(result, "Response should not be null");
    assert(result.xUrl, "Response should contain a shareable X URL");
    
    console.log(`Successfully created X Share Post URL: ${result.xUrl}`);

    // Test with minimal parameters (just text)
    const minimalResult = await runAction(
        "createShareXPostUrl",
        "x",
        {},
        {
            text: "Simple test tweet"
        }
    );

    assert(minimalResult, "Minimal response should not be null");
    assert(minimalResult.xUrl, "Minimal response should contain a shareable X URL");
    
    console.log(`Successfully created minimal X Share Post URL: ${minimalResult.xUrl}`);
}

runTest().catch(error => {
    console.error("Test failed:", error);
    if (error.response) {
        console.error("API response:", error.response.data);
        console.error("Status code:", error.response.status);
    }
    process.exit(1);
});