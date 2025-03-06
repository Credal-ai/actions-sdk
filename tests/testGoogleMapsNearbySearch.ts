import { runAction } from "../src/app";
import { assert } from "node:console"

async function runTest() {
    const result = await runAction(
        "nearbysearch",
        "googlemaps",
        { apiKey: "insert-during-testing" }, // authParams
        {
            latitude: 40.712776,
            longitude: -74.005974,
        }
    );
    console.log(result);
    assert(result.results.length > 0, "No results found");
}

runTest().catch(console.error);
