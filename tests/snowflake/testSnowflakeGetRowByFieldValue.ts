import { runAction } from "../../src/app";

async function runTest() {
  const result = await runAction(
    "getRowByFieldValue",
    "snowflake",
    {
      apiKey: "insert-private-key", // private key for key-pair auth
      username: "insert-username", // username for key-pair auth
    },
    {
      databaseName: "insert-database-name",
      accountName: "insert-account-name",
      warehouse: "insert-warehouse-name",
      tableName: "insert-table-name",
      fieldName: "insert-field-name",
      fieldValue: "insert-field-value",
    },
  );
  console.log(result);
}

runTest().catch(console.error);
