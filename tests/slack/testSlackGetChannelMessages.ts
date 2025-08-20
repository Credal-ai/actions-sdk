import assert from "node:assert";
import { runAction } from "../../src/app.js";
import dotenv from "dotenv";

dotenv.config();

async function runTest() {
  const channelName = process.env.SLACK_TEST_CHANNEL_NAME;
  const channelId = process.env.SLACK_TEST_CHANNEL_ID;
  const oldest = "1723996800";
  const authParams = {
    authToken: process.env.SLACK_AUTH_TOKEN,
  };

  try {
    const result1 = await runAction(
      "getChannelMessages",
      "slack",
      authParams,
      { channelId, oldest },
    );
    const result2 = await runAction(
      "getChannelMessages",
      "slack",
      authParams,
      { channelName, oldest },
    );

    assert(result1, "Response should not be null");
    assert(result1.messages, "Response should contain messages");
    assert(result2, "Response should not be null");
    assert(result2.messages, "Response should contain messages");
    console.log(
      "Test passed! with messages: " + JSON.stringify(result1.messages, null, 2),
    );
    console.log(
      "Test passed! with messages: " + JSON.stringify(result2.messages, null, 2),
    );
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
