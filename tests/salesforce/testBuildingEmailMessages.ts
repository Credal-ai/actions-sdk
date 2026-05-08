import { runAction } from "../../src/app.js";
import { type salesforceGetCleanActivityRecordsOutputType } from "../../src/actions/autogen/types.js";
import { authenticateWithJWT } from "./utils.js";

const BUILDING_ID = "a00Qp00000GGLqUIAX"; // Ballston Park Condominiums building

async function main() {
  const { accessToken, instanceUrl } = await authenticateWithJWT();
  const AUTH = { authToken: accessToken, baseUrl: instanceUrl };

  console.log("=== EmailMessage: Cases related to Building (Email-to-Case threading test) ===\n");
  const result = (await runAction("getCleanActivityRecords", "salesforce", AUTH, {
    objectType: "EmailMessage",
    whereClause: `ParentId IN (SELECT Id FROM Case WHERE Building__c = '${BUILDING_ID}')`,
    limit: 20,
    returnActivityIds: true,
  })) as salesforceGetCleanActivityRecordsOutputType;

  if (!result.success) {
    console.error("FAILED:", result.error);
    return;
  }

  console.log(`Fetched: ${result.totalFetched}, Threads: ${result.totalThreads}, hasMore: ${result.hasMore ?? false}\n`);

  for (const t of result.threads ?? []) {
    const thread = t as Record<string, unknown>;
    console.log(`--- Thread: "${thread.normalizedSubject}" ---`);
    console.log(`  threadIdentifier    : ${thread.threadIdentifier}`);
    console.log(`  parentId            : ${thread.parentId}  ← should be Case ID (500...)`);
    console.log(`  relatedToId         : ${thread.relatedToId}`);
    console.log(`  direction           : ${thread.direction}`);
    console.log(`  status              : ${thread.status}`);
    console.log(`  hasAttachment       : ${thread.hasAttachment}`);
    console.log(`  fromName            : ${thread.fromName}`);
    console.log(`  fromAddress         : ${thread.fromAddress}`);
    console.log(`  bounced             : ${thread.bounced}`);
    console.log(`  threadSize          : ${thread.threadSize}`);
    console.log(`  latestDate          : ${thread.latestDate}`);
    console.log(`  replyToEmailMsgId   : ${thread.replyToEmailMessageId ?? "(none)"}`);
    console.log(`  people              : ${JSON.stringify(thread.people)}`);
    console.log(`  cleanedBody (200ch) : ${String(thread.cleanedBody ?? "(empty)").slice(0, 200)}`);
    console.log();
  }

  const ids = result.activityIds ? (JSON.parse(result.activityIds as string) as string[]) : [];
  console.log(`ActivityIds collected: ${ids.length}`);
}

main().catch(console.error);
