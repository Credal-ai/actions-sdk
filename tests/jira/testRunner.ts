import { jiraConfig } from "./utils.js";
import type { JiraTestConfig } from "./utils.js";

interface ErrorWithResponse {
  response?: {
    data?: unknown;
    status?: number;
  };
}

export async function runJiraTest(
  testName: string,
  testFunction: (config: JiraTestConfig) => Promise<void>,
): Promise<void> {
  try {
    await testFunction(jiraConfig);
    console.log(`✅ ${testName} passed for ${jiraConfig.name}`);
  } catch (error) {
    console.error(`❌ ${testName} failed for ${jiraConfig.name}:`);
    console.error(error);

    const err = error as ErrorWithResponse;
    if (err.response) {
      console.error("API response:", err.response.data);
      console.error("Status code:", err.response.status);
    }
  }
}