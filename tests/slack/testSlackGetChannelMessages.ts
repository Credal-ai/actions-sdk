import assert from "node:assert";
import { runAction } from "../../src/app.js";
import dotenv from "dotenv";

dotenv.config();

async function runTest() {
  const oldest = "1723996800";
  const authParams = {
    authToken: process.env.SLACK_AUTH_TOKEN,
  };

  try {
    const result1 = await runAction("getChannelMessages", "slack", authParams, {
      channelId: process.env.SLACK_TEST_PUBLIC_CHANNEL_ID,
      oldest,
    });
    const result2 = await runAction("getChannelMessages", "slack", authParams, {
      channelName: process.env.SLACK_TEST_PUBLIC_CHANNEL_NAME,
      oldest,
    });
    const result3 = await runAction("getChannelMessages", "slack", authParams, {
      channelId: process.env.SLACK_TEST_PRIVATE_CHANNEL_ID,
      oldest,
    });
    const result4 = await runAction("getChannelMessages", "slack", authParams, {
      channelName: process.env.SLACK_TEST_PRIVATE_CHANNEL_NAME,
      oldest,
    });

    assert(result1, "Public channel ID response should not be null");
    assert(
      result1.messages,
      "Public channel ID response should contain messages",
    );
    assert(result2, "Public channel name response should not be null");
    assert(
      result2.messages,
      "Public channel name response should contain messages",
    );
    assert(result3, "Private channel ID response should not be null");
    assert(
      result3.messages,
      "Private channel ID response should contain messages",
    );
    assert(result4, "Private channel name response should not be null");
    assert(
      result4.messages,
      "Private channel name response should contain messages",
    );

    console.log(
      "Test passed! Public channel ID messages: " +
        JSON.stringify(result1.messages, null, 2),
    );
    console.log(
      "Test passed! Public channel name messages: " +
        JSON.stringify(result2.messages, null, 2),
    );
    console.log(
      "Test passed! Private channel ID messages: " +
        JSON.stringify(result3.messages, null, 2),
    );
    console.log(
      "Test passed! Private channel name messages: " +
        JSON.stringify(result4.messages, null, 2),
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
