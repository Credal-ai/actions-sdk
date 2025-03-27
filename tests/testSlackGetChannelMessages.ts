import assert from "node:assert";
import { runAction } from "../src/app";

async function runTest() {
    const params = {
        channelName: "insert-channel-name",
        oldest: "insert-oldest-timestamp",
    };
    const authParams = {
        authToken: "insert-oauth-access-token",
    };

    try {
        const result = await runAction(
            "getChannelMessages",
            "slack",
            authParams,
            params
        );

        assert(result, "Response should not be null");
        assert(result.messages, "Response should contain messages");
        console.log("Test passed! with messages: " + JSON.stringify(result.messages, null, 2));
    } catch (error) {
        console.error("Test failed:", error);
        process.exit(1);
    }
}

// Uncomment the test you want to run
runTest().catch((error) => {
    console.error("Test failed:", error);
    if (error.response) {
        console.error("API response:", error.response.data);
        console.error("Status code:", error.response.status);
    }
    process.exit(1);
});
