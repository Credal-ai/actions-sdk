import type { slackUserSearchSlackRTSOutputType } from "../../src/actions/autogen/types.js";
import { runAction } from "../../src/app.js";
import dotenv from "dotenv";
import assert from "node:assert";

dotenv.config();

async function runTest() {
  assert(process.env.SLACK_AUTH_TOKEN, "SLACK_AUTH_TOKEN must be set to run this test");
  assert(
    process.env.SLACK_TEST_PUBLIC_CHANNEL_ID,
    "SLACK_TEST_PUBLIC_CHANNEL_ID must be set to run channel filter tests",
  );
  assert(
    process.env.SLACK_TEST_PUBLIC_CHANNEL_NAME,
    "SLACK_TEST_PUBLIC_CHANNEL_NAME must be set to run channel filter tests",
  );

  // Basic search with query only
  const result1 = (await runAction(
    "searchSlackRTS",
    "slackUser",
    { authToken: process.env.SLACK_AUTH_TOKEN },
    { query: "project update" }
  )) as slackUserSearchSlackRTSOutputType;

  // Search with channel type filters
  const result2 = (await runAction(
    "searchSlackRTS",
    "slackUser",
    { authToken: process.env.SLACK_AUTH_TOKEN },
    {
      query: "meeting notes",
      channelTypes: ["public_channel", "private_channel"],
      limit: 5,
    }
  )) as slackUserSearchSlackRTSOutputType;

  // Search in DMs only
  const result3 = (await runAction(
    "searchSlackRTS",
    "slackUser",
    { authToken: process.env.SLACK_AUTH_TOKEN },
    {
      query: "project",
      channelTypes: ["im"],
      limit: 3,
    }
  )) as slackUserSearchSlackRTSOutputType;

  // Search with time filters
  const result4 = (await runAction(
    "searchSlackRTS",
    "slackUser",
    { authToken: process.env.SLACK_AUTH_TOKEN },
    {
      query: "deployment",
      before: Math.floor(Date.now() / 1000).toString(),
      after: Math.floor((Date.now() - 7 * 24 * 60 * 60 * 1000) / 1000).toString(),
      limit: 10,
    }
  )) as slackUserSearchSlackRTSOutputType;

  // Search with time filters using date strings (non-unix input)
  const result4b = (await runAction(
    "searchSlackRTS",
    "slackUser",
    { authToken: process.env.SLACK_AUTH_TOKEN },
    {
      query: "temporal",
      before: "2026-02-06T00:00:00Z",
      after: "2026-02-05T00:00:00Z",
      limit: 10,
    }
  )) as slackUserSearchSlackRTSOutputType;

  // Search including bot messages
  const result5 = (await runAction(
    "searchSlackRTS",
    "slackUser",
    { authToken: process.env.SLACK_AUTH_TOKEN },
    {
      query: "alert",
      includeBots: true,
      limit: 5,
    }
  )) as slackUserSearchSlackRTSOutputType;

  // Search for files
  const result6 = (await runAction(
    "searchSlackRTS",
    "slackUser",
    { authToken: process.env.SLACK_AUTH_TOKEN },
    {
      query: "document",
      contentTypes: ["messages", "files"],
      limit: 5,
    }
  )) as slackUserSearchSlackRTSOutputType;

  const rawUserEmails: string[] = [/* fill in with emails */];
  const userEmails = rawUserEmails.length > 0
    ? rawUserEmails
        .map(s => s.trim())
        .filter(Boolean)
    : null;

  const result7 = userEmails && userEmails.length > 0
    ? ((await runAction(
        "searchSlackRTS",
        "slackUser",
        { authToken: process.env.SLACK_AUTH_TOKEN },
        {
          query: "project",
          userEmails,
          limit: 5,
        }
      )) as slackUserSearchSlackRTSOutputType)
    : null;

  const result8 = (await runAction(
    "searchSlackRTS",
    "slackUser",
    { authToken: process.env.SLACK_AUTH_TOKEN },
    {
      query: "project",
      channelIds: [process.env.SLACK_TEST_PUBLIC_CHANNEL_ID],
      limit: 5,
    }
  )) as slackUserSearchSlackRTSOutputType;

  const result9 = (await runAction(
    "searchSlackRTS",
    "slackUser",
    { authToken: process.env.SLACK_AUTH_TOKEN },
    {
      query: "project",
      channelIds: [process.env.SLACK_TEST_PUBLIC_CHANNEL_NAME],
      limit: 5,
    }
  )) as slackUserSearchSlackRTSOutputType;

  const result10 = (await runAction(
    "searchSlackRTS",
    "slackUser",
    { authToken: process.env.SLACK_AUTH_TOKEN },
    {
      channelIds: [process.env.SLACK_TEST_PUBLIC_CHANNEL_ID],
      limit: 5,
    }
  )) as slackUserSearchSlackRTSOutputType;

  let blankAllFiltersThrew = false;
  try {
    await runAction(
      "searchSlackRTS",
      "slackUser",
      { authToken: process.env.SLACK_AUTH_TOKEN },
      {},
    );
  } catch (e) {
    blankAllFiltersThrew = true;
    const msg = e instanceof Error ? e.message : String(e);
    assert(
      msg.includes("If query is left blank") || msg.includes("must provide"),
      `Unexpected error message for blank query test: ${msg}`,
    );
  }

  const result11 = (await runAction(
    "searchSlackRTS",
    "slackUser",
    { authToken: process.env.SLACK_AUTH_TOKEN },
    {
      channelIds: [process.env.SLACK_TEST_PRIVATE_CHANNEL_ID],
      query: "",
      contentTypes: ["messages"],
      limit: 5,
    }
  )) as slackUserSearchSlackRTSOutputType;

  assert(result8?.ok, "Channel ID filtered search should succeed");
  assert(result9?.ok, "Channel name filtered search should succeed");
  assert(result10?.ok, "Blank query + channel filter search should succeed");
  assert(blankAllFiltersThrew, "Blank query with no filters should throw");
  assert(result11?.ok && result11?.results.messages && result11?.results?.messages?.length > 0, "Blank query + private channel search should succeed and not be blank");

  console.log(
    "Search Test Response 1 (Basic): " + JSON.stringify(result1, null, 2)
  );

  console.log(
    "Search Test Response 2 (Channel Filters): " + JSON.stringify(result2, null, 2)
  );

  console.log(
    "Search Test Response 3 (DMs Only): " + JSON.stringify(result3, null, 2)
  );

  console.log(
    "Search Test Response 4 (Time Filters): " + JSON.stringify(result4, null, 2)
  );

  console.log(
    "Search Test Response 4b (Time Filters - Date Strings): " + JSON.stringify(result4b, null, 2)
  );

  console.log(
    "Search Test Response 5 (Include Bots): " + JSON.stringify(result5, null, 2)
  );

  console.log(
    "Search Test Response 6 (Files): " + JSON.stringify(result6, null, 2)
  );

  console.log(
    "Search Test Response 7 (From User): " + JSON.stringify(result7, null, 2)
  );

  console.log(
    "Search Test Response 8 (Channel ID): " + JSON.stringify(result8, null, 2)
  );

  console.log(
    "Search Test Response 9 (Channel Name): " + JSON.stringify(result9, null, 2)
  );

  console.log(
    "Search Test Response 10 (Blank Query + Channel ID): " + JSON.stringify(result10, null, 2)
  );

  console.log(
    "Search Test Response 11 (Blank Query + PrivateChannel ID): " + JSON.stringify(result11, null, 2)
  );

}

runTest().catch((error) => {
  console.error("Test failed:", error);
  process.exit(1);
});
