import assert from "node:assert";
import { runAction } from "../../src/app.js";
import dotenv from "dotenv";

dotenv.config();

async function runTest() {
  const result = await runAction(
    "getTeamDetails",
    "linear",
    { authToken: process.env.LINEAR_AUTH_TOKEN! },
    { teamId: process.env.LINEAR_TEAM_ID! },
  );

  assert(result, "Response should not be null");
  assert(result.success, "Success should be true");
  assert(result.team, "Response should contain team data");
  assert(result.team.id, "Team should have an ID");
  assert(result.team.name, "Team should have a name");

  console.log(JSON.stringify(result, null, 2));
}

runTest().catch((error) => {
  console.error("Test failed:", error);
  if (error.response) {
    console.error("API response:", error.response.data);
    console.error("Status code:", error.response.status);
  }
  process.exit(1);
});
