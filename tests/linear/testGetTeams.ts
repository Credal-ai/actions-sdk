import assert from "node:assert";
import { runAction } from "../../src/app.js";
import dotenv from "dotenv";

dotenv.config();

async function testGetTeams() {
  const result = await runAction(
    "getTeams",
    "linear",
    { authToken: process.env.LINEAR_AUTH_TOKEN! },
    {},
  );

  assert(result.success, result.error || "getTeams did not succeed");
  assert(Array.isArray(result.teams), "Teams should be an array");
  assert(result.teams.length > 0, "Should return at least one team");
  assert(result.teams[0].id, "Team should have an id");
  assert(result.teams[0].name, "Team should have a name");

  console.log(JSON.stringify(result, null, 2));
}

testGetTeams();
