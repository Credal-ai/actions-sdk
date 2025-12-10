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
      email: "jack@credal.ai", 
      message: "Test message from sendDm action - simple test" 
    }
  )) as slackSendDmOutputType;

  // Test 2: Send a DM with more complex message
  const result2 = (await runAction(
    "sendDm",
    "slack",
    { authToken: process.env.SLACK_AUTH_TOKEN },
    {
      email: "ravin@credal.ai",
      message: "Hello! This is a test message with:\n- Bullet points\n- Multiple lines\n- Special characters: @#$%",
    }
  )) as slackSendDmOutputType;

  // Test 3: Send to non-existent user (should fail gracefully)
  const result3 = (await runAction(
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
    "Send DM Test Response 2: " + JSON.stringify(result2, null, 2)
  );

  console.log(
    "Send DM Test Response 3 (should fail): " + JSON.stringify(result3, null, 2)
  );
}

runTest().catch((error) => {
  console.error("Test failed:", error);
  process.exit(1);
});
