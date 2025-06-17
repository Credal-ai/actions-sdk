import assert from "node:assert";
import { runAction } from "../../src/app.js";
import dotenv from "dotenv";

dotenv.config();

async function runTest() {
  if (!process.env.GURU_TOKEN) {
    console.log("Skipping Guru update test - GURU_TOKEN not set");
    return;
  }

  // This test assumes there's a card with this ID - in real usage you'd create one first
  const testCardId = "8fc891e9-129b-4931-8371-875d6832de3a";

  const result = await runAction(
    "updateGuruCard",
    "guru",
    { authToken: process.env.GURU_TOKEN },
    {
      cardId: testCardId,
      title: `Updated Test Card - ${new Date().toISOString()}`,
      content: "This card has been updated by the Credal Actions SDK test suite."
    }
  );

  assert(result, "Response should not be null");
  assert(result.id, "Card ID should be returned");
  assert(result.url, "Card URL should be returned");
  assert(result.title, "Card title should be returned");
  console.log("Update Guru Card Test Response: " + JSON.stringify(result, null, 2));
}

runTest().catch((error) => {
  console.error("Test failed:", error);
  if (error.response) {
    console.error("API response:", error.response.data);
    console.error("Status code:", error.response.status);
  }
  process.exit(1);
}); 