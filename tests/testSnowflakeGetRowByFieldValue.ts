import { runAction } from "../src/app";

async function runTest() {
  const result = await runAction(
    "getRowByFieldValue",
    "snowflake",
    { authToken: "insert-oauth-access-token",
      apiKey: "insert-private-key", // Optional if not using OAuth
     },
    {
      databaseName: "insert-database-name",
      accountName: "insert-account-name",
      warehouse: "insert-warehouse-name",
      user: "insert-user-name",
      tableName: "insert-table-name",
      fieldName: "insert-field-name",
      fieldValue: "insert-field-value",
    },
  );
  console.log(result);
}

runTest().catch(console.error);
