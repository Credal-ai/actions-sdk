import type { slackUserSearchSlackRTSOutputType } from "../../src/actions/autogen/types.js";
import { runAction } from "../../src/app.js";
import dotenv from "dotenv";

dotenv.config();

async function runTest() {
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

  const rawFromUsers: string[] = [/* fill in with emails */];
  const fromUsers = rawFromUsers
    ? rawFromUsers
        .map(s => s.trim())
        .filter(Boolean)
    : null;

  const result7 = fromUsers && fromUsers.length > 0
    ? ((await runAction(
        "searchSlackRTS",
        "slackUser",
        { authToken: process.env.SLACK_AUTH_TOKEN },
        {
          query: "project",
          fromUsers,
          limit: 5,
        }
      )) as slackUserSearchSlackRTSOutputType)
    : null;

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
    "Search Test Response 5 (Include Bots): " + JSON.stringify(result5, null, 2)
  );

  console.log(
    "Search Test Response 6 (Files): " + JSON.stringify(result6, null, 2)
  );

  console.log(
    "Search Test Response 7 (From User): " + JSON.stringify(result7, null, 2)
  );

}

runTest().catch((error) => {
  console.error("Test failed:", error);
  process.exit(1);
});
