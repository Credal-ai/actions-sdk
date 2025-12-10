import type { slackSendDmOutputType } from "../../src/actions/autogen/types.js";
import { runAction } from "../../src/app.js";
import dotenv from "dotenv";

dotenv.config();

async function runTest() {
  // Test 1: Send a simple DM
  const result1 = (await runAction(
    "sendDm",
    "slack",
    { authToken: process.env.SLACK_AUTH_TOKEN },
    { 
      email: "livia@credal.ai", 
      message: "Test message from sendDm action - simple test" 
    }
  )) as slackSendDmOutputType;

  // Test 2: Send to non-existent user (should fail gracefully)
  const result2 = (await runAction(
    "sendDm",
    "slack",
    { authToken: process.env.SLACK_AUTH_TOKEN },
    {
      email: "nonexistent@credal.ai",
      message: "This should fail",
    }
  )) as slackSendDmOutputType;

  console.log(
    "Send DM Test Response 1: " + JSON.stringify(result1, null, 2)
  );

  console.log(
    "Send DM Test Response 2 (should fail): " + JSON.stringify(result2, null, 2)
  );
}

runTest().catch((error) => {
  console.error("Test failed:", error);
  process.exit(1);
});
