import { assert } from "node:console"
import { runAction } from "../src/app";

async function runTest() {
    const result = await runAction(
        "requestTimeOff",
        "workday",
        { authToken: "insert-during-testing" }, // authParams
        {
            tenantName: "credal",
            workerId: "123456",
            startDate: "2022-01-01",
            endDate: "2022-01-02",
            timeOffType: "PTO",
        }
    );
    assert(result.requestId !== "Error");
}

runTest().catch(console.error);