import assert from "node:assert/strict";
import { test } from "node:test";
import { runAction } from "../../src/app.js";
import { axiosClient } from "../../src/actions/util/axiosClient.js";

// Run with: node --loader ts-node/esm tests/jira/testJiraQueryActionContract.ts
// Exercise the public registry and generated validation with HTTP fully mocked.
test("runAction exposes Data Center continuation and rejects invalid offsets", async () => {
  const originalAdapter = axiosClient.defaults.adapter;
  const requestedOffsets: string[] = [];
  const controller = new AbortController();

  axiosClient.defaults.adapter = async (config) => {
    const request = new URL(config.url!);
    assert.equal(request.origin, "https://jira.example.test");
    assert.equal(request.pathname, "/rest/api/2/search");
    assert.equal(config.headers.Authorization, "Bearer test-token");
    assert.equal(config.signal, controller.signal);
    requestedOffsets.push(request.searchParams.get("startAt")!);

    return {
      status: 200,
      statusText: "OK",
      headers: {},
      config,
      data: {
        startAt: 4,
        total: 6,
        issues: [
          {
            id: "10042",
            key: "ENG-123",
            fields: {
              summary: "A ticket",
              description: "Data Center text",
              project: { id: "1", key: "ENG", name: "Engineering" },
              issuetype: { id: "2", name: "Bug" },
              status: {
                id: "3",
                name: "Open",
                statusCategory: { name: "To Do" },
              },
              created: "2026-09-21T14:00:00.000+0000",
              updated: "2026-09-21T14:00:00.000+0000",
            },
          },
        ],
      },
    };
  };

  try {
    const auth = {
      authToken: "test-token",
      baseUrl: "https://jira.example.test/",
    };
    const parameters = {
      query: "project = ENG ORDER BY id ASC",
      limit: 1,
      startAt: 4,
    };
    const result = await runAction(
      "getJiraIssuesByQuery",
      "jiraDataCenter",
      auth,
      parameters,
      { signal: controller.signal },
    );

    assert.equal(result.sourceUrl, "https://jira.example.test");
    assert.equal(result.itemsReturned, 1);
    assert.equal(result.startAt, 4);
    assert.equal(result.total, 6);
    assert.equal(result.nextStartAt, 5);
    assert.equal(result.isLast, false);
    assert.equal(result.results[0].contents.description, "Data Center text");

    const coercedResult = await runAction(
      "getJiraIssuesByQuery",
      "jiraDataCenter",
      auth,
      { ...parameters, limit: "1", startAt: "4" },
      { signal: controller.signal },
    );
    assert.equal(coercedResult.nextStartAt, 5);

    await assert.rejects(
      runAction("getJiraIssuesByQuery", "jiraDataCenter", auth, {
        ...parameters,
        startAt: -1,
      }),
      /Invalid parameters/,
    );

    controller.abort(new Error("Trigger cancelled"));
    await assert.rejects(
      runAction("getJiraIssuesByQuery", "jiraDataCenter", auth, parameters, {
        signal: controller.signal,
      }),
      /Trigger cancelled/,
    );
    assert.deepEqual(requestedOffsets, ["4", "4"]);
  } finally {
    axiosClient.defaults.adapter = originalAdapter;
  }
});
