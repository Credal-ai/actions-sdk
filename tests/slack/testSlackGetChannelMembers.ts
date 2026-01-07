import assert from "node:assert";
import { runAction } from "../../src/app.js";
import dotenv from "dotenv";

dotenv.config();

async function runTest() {
  const authParams = {
    authToken: process.env.SLACK_AUTH_TOKEN,
  };

  try {
    const result1 = await runAction("getChannelMembers", "slack", authParams, {
      channelId: process.env.SLACK_TEST_PUBLIC_CHANNEL_ID,
    });
    const result2 = await runAction("getChannelMembers", "slack", authParams, {
      channelName: process.env.SLACK_TEST_PUBLIC_CHANNEL_NAME,
    });
    const result3 = await runAction("getChannelMembers", "slack", authParams, {
      channelId: process.env.SLACK_TEST_PRIVATE_CHANNEL_ID,
    });
    const result4 = await runAction("getChannelMembers", "slack", authParams, {
      channelName: process.env.SLACK_TEST_PRIVATE_CHANNEL_NAME,
    });

    assert(result1, "Public channel ID response should not be null");
    assert(
      Array.isArray(result1.members),
      "Public channel ID response members should be an array"
    );
    assert(
      result1.members.length > 0,
      "Public channel ID response should contain at least one member"
    );
    assert(result2, "Public channel name response should not be null");
    assert(
      Array.isArray(result2.members),
      "Public channel name response members should be an array"
    );
    assert(
      result2.members.length > 0,
      "Public channel name response should contain at least one member"
    );
    assert(result3, "Private channel ID response should not be null");
    assert(
      Array.isArray(result3.members),
      "Private channel ID response members should be an array"
    );
    assert(
      result3.members.length > 0,
      "Private channel ID response should contain at least one member"
    );
    assert(result4, "Private channel name response should not be null");
    assert(
      Array.isArray(result4.members),
      "Private channel name response members should be an array"
    );
    assert(
      result4.members.length > 0,
      "Private channel name response should contain at least one member"
    );

    console.log(
      "Test passed! Public channel ID members: " +
        JSON.stringify(result1.members, null, 2)
    );
    console.log(
      "Test passed! Public channel name members: " +
        JSON.stringify(result2.members, null, 2)
    );
    console.log(
      "Test passed! Private channel ID members: " +
        JSON.stringify(result3.members, null, 2)
    );
    console.log(
      "Test passed! Private channel name members: " +
        JSON.stringify(result4.members, null, 2)
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
