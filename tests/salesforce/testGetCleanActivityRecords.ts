import { runAction } from "../../src/app.js";
import { type salesforceGetCleanActivityRecordsOutputType } from "../../src/actions/autogen/types.js";
import { authenticateWithJWT } from "./utils.js";

const CONTACT_ID = "0031K00002hjilcQAA"; // Christian Brewer
const ACCOUNT_ID = "0011K00002AZSuTQAX"; // A Better Connection Communications, LLC.

async function main() {
  const { accessToken, instanceUrl } = await authenticateWithJWT();
  const AUTH = { authToken: accessToken, baseUrl: instanceUrl };

  // ── Pass 1: EmailMessage (returnActivityIds=true) ────────────────────────
  console.log("=== TEST 1: EmailMessage (contact relation semi-join, returnActivityIds=true) ===\n");
  const emResult = (await runAction("getCleanActivityRecords", "salesforce", AUTH, {
    objectType: "EmailMessage",
    whereClause: `Id IN (SELECT EmailMessageId FROM EmailMessageRelation WHERE RelationId = '${CONTACT_ID}')`,
    limit: 10,
    returnActivityIds: true,
  })) as salesforceGetCleanActivityRecordsOutputType;

  console.log(JSON.stringify(emResult, null, 2));

  const activityIds = emResult.activityIds;
  console.log(`\n→ activityIds returned: ${activityIds ?? "(none)"}`);
  const parsedIds: string[] = activityIds ? (JSON.parse(activityIds) as string[]) : [];
  console.log(`→ ${parsedIds.length} Task IDs will be excluded from the Task query\n`);

  // ── Pass 2: Task (WhoId = Contact, exclude EmailMessage-linked Tasks) ────
  console.log("=== TEST 2: Task (WhoId = Contact, excludeActivityIds from pass 1) ===\n");
  const taskResult = (await runAction("getCleanActivityRecords", "salesforce", AUTH, {
    objectType: "Task",
    whereClause: `WhoId = '${CONTACT_ID}'`,
    limit: 10,
    excludeActivityIds: activityIds,
  })) as salesforceGetCleanActivityRecordsOutputType;

  console.log(JSON.stringify(taskResult, null, 2));

  // ── Pass 3: Task without exclusion (baseline comparison) ─────────────────
  console.log("\n=== TEST 3: Task (WhoId = Contact, no exclusion — baseline) ===\n");
  const taskBaselineResult = (await runAction("getCleanActivityRecords", "salesforce", AUTH, {
    objectType: "Task",
    whereClause: `WhoId = '${CONTACT_ID}'`,
    limit: 10,
  })) as salesforceGetCleanActivityRecordsOutputType;

  console.log(JSON.stringify(taskBaselineResult, null, 2));

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log("\n=== SUMMARY ===");
  console.log(`EmailMessage threads: ${emResult.totalThreads ?? 0} (fetched ${emResult.totalFetched ?? 0}), hasMore=${emResult.hasMore ?? false}`);
  console.log(`Task threads (excluded): ${taskResult.totalThreads ?? 0} (fetched ${taskResult.totalFetched ?? 0}), hasMore=${taskResult.hasMore}`);
  console.log(`Task threads (baseline): ${taskBaselineResult.totalThreads ?? 0} (fetched ${taskBaselineResult.totalFetched ?? 0}), hasMore=${taskBaselineResult.hasMore}`);
  if (!emResult.success) console.error("EmailMessage query FAILED:", emResult.error);
  if (!taskResult.success) console.error("Task query (excluded) FAILED:", taskResult.error);
  if (!taskBaselineResult.success) console.error("Task query (baseline) FAILED:", taskBaselineResult.error);
}

main().catch(console.error);
