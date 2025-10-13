import type { slackUserSearchSlackOutputType } from "../../src/actions/autogen/types.js";
import { runAction } from "../../src/app.js";
import dotenv from "dotenv";

dotenv.config();

async function runTest() {
  // Single person DM
  const result1 = (await runAction(
    "searchSlack",
    "slackUser",
    { authToken: process.env.SLACK_FLATIRON_AUTH_TOKEN },
    { emails: ["anamika.parida@flatiron.com"], limit: 15, topic: "Github Copilot", timeRange: "latest" }
  )) as slackUserSearchSlackOutputType;

  /*// Multiple person DM
  const result2 = (await runAction(
    "searchSlack",
    "slackUser",
    { authToken: process.env.SLACK_AUTH_TOKEN },
    {
      emails: ["jack@credal.ai", "ravin@credal.ai"],
      limit: 1,
      topic: "good to know",
    }
  )) as slackUserSearchSlackOutputType;

  // Channel
  const result3 = (await runAction(
    "searchSlack",
    "slackUser",
    { authToken: process.env.SLACK_AUTH_TOKEN },
    { channel: "general", limit: 1, topic: "welcome" }
  )) as slackUserSearchSlackOutputType;

  // DM with no topic
  const result4 = (await runAction(
    "searchSlack",
    "slackUser",
    { authToken: process.env.SLACK_AUTH_TOKEN },
    { emails: ["jack@credal.ai"], limit: 10 }
  )) as slackUserSearchSlackOutputType;

  // Channel no topic
  const result5 = (await runAction(
    "searchSlack",
    "slackUser",
    { authToken: process.env.SLACK_AUTH_TOKEN },
    { channel: "general", limit: 1, timeRange: "all" }
  )) as slackUserSearchSlackOutputType;*/

  console.log(
    "Send Message Test Response 1: " + JSON.stringify(result1, null, 2)
  );

  /*console.log(
    "Send Message Test Response 2: " + JSON.stringify(result2, null, 2)
  );

  console.log(
    "Send Message Test Response 3: " + JSON.stringify(result3, null, 2)
  );

  console.log(
    "Send Message Test Response 4: " + JSON.stringify(result4, null, 2)
  );

  console.log(
    "Send Message Test Response 5: " + JSON.stringify(result5, null, 2)
  );*/
}

runTest().catch((error) => {
  console.error("Test failed:", error);
  process.exit(1);
});
