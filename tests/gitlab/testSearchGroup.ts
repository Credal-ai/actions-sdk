import type {
  gitlabSearchGroupOutputType,
  gitlabSearchGroupParamsType,
} from "../../src/actions/autogen/types.js";
import { runAction } from "../../src/app.js";
import assert from "node:assert";
import dotenv from "dotenv";

dotenv.config();

async function runSearchGroupWithoutProject() {
  console.log("Running test gitlab search");

  const params: gitlabSearchGroupParamsType = {
    query: "test",
    groupId: "credal",
  };

  const result = (await runAction(
    "searchGroup",
    "gitlab",
    { authToken: process.env.GITLAB_ACCESS_TOKEN },
    params
  )) as gitlabSearchGroupOutputType;
  console.log("Resulting payload:");
  console.dir(result, { depth: 4 });

  // Validate response structure
  assert.strictEqual(result.success, true, "Success should be true");
  assert(Array.isArray(result.results), "Results should be an array");

  // Validate first result structure if results exist
  if (result.results.length > 0) {
    const firstResult = result.results[0];
    assert(firstResult.name && typeof firstResult.name === "string", "First result should have a name (string)");
    assert(firstResult.url && typeof firstResult.url === "string", "First result should have a url (string)");
    assert(firstResult.contents && typeof firstResult.contents === "object", "First result should have contents (object)");

    // Validate contents has type field and reasonable fields
    const contents = firstResult.contents;
    assert(contents.type, "Contents should have a type field");
    assert(
      ["mergeRequest", "blob", "commit"].includes(contents.type),
      "Contents type should be mergeRequest, blob, or commit"
    );
    assert(
      contents.metadata || contents.sha || contents.message,
      "Contents should have at least one reasonable field (metadata, sha, or message)"
    );
  }

  console.log("All tests passed for searchGroup without project!");
}

async function runSearchGroupWithProject() {
  console.log("Running test gitlab search with project");

  const params: gitlabSearchGroupParamsType = {
    query: "test",
    groupId: "credal",
    project: "test-project",
  };

  const result = (await runAction(
    "searchGroup",
    "gitlab",
    { authToken: process.env.GITLAB_ACCESS_TOKEN },
    params
  )) as gitlabSearchGroupOutputType;
  console.log("Resulting payload:");
  console.dir(result, { depth: 4 });

  // Validate response structure
  assert.strictEqual(result.success, true, "Success should be true");
  assert(Array.isArray(result.results), "Results should be an array");

  // Validate first result structure if results exist
  if (result.results.length > 0) {
    const firstResult = result.results[0];
    assert(firstResult.name && typeof firstResult.name === "string", "First result should have a name (string)");
    assert(firstResult.url && typeof firstResult.url === "string", "First result should have a url (string)");
    assert(firstResult.contents && typeof firstResult.contents === "object", "First result should have contents (object)");

    // Validate contents has type field and reasonable fields
    const contents = firstResult.contents;
    assert(contents.type, "Contents should have a type field");
    assert(
      ["mergeRequest", "blob", "commit"].includes(contents.type),
      "Contents type should be mergeRequest, blob, or commit"
    );
    assert(
      contents.metadata || contents.sha || contents.message,
      "Contents should have at least one reasonable field (metadata, sha, or message)"
    );
  }

  console.log("All tests passed for searchGroup with project!");
}

runSearchGroupWithoutProject().catch((error) => {
  console.error("Test failed:", error);
  if (error.response) {
    console.error("API response:", error.response.data);
    console.error("Status code:", error.response.status);
  }
  process.exit(1);
});

runSearchGroupWithProject().catch((error) => {
  console.error("Test failed:", error);
  if (error.response) {
    console.error("API response:", error.response.data);
    console.error("Status code:", error.response.status);
  }
  process.exit(1);
});
