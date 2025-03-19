import { assert } from "node:console"
import { runAction } from "../src/app";

async function runTest() {
    const result = await runAction(
        "requestTimeOff",
        "workday",
        { clientId: "insert-during-testing", clientSecret: "insert-during-testing", subdomain: "insert-during-testing" }, // authParams
        {
            userEmail: "ria@credal.ai",
            startDate: "2022-01-01",
            endDate: "2022-01-02",
            timeOffType: "PTO",
        }
    );
    assert(result.requestId !== "Error");
}

runTest().catch(console.error);