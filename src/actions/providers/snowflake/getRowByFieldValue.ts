import snowflake from "snowflake-sdk";
import type {
  AuthParamsType,
  snowflakeGetRowByFieldValueFunction,
  snowflakeGetRowByFieldValueOutputType,
  snowflakeGetRowByFieldValueParamsType,
} from "../../autogen/types";

const getRowByFieldValue: snowflakeGetRowByFieldValueFunction = async ({
  params,
  authParams,
}: {
  params: snowflakeGetRowByFieldValueParamsType;
  authParams: AuthParamsType;
}): Promise<snowflakeGetRowByFieldValueOutputType> => {
  const { databaseName, tableName, fieldName, warehouse, fieldValue, user, accountName } = params;
  const { authToken } = authParams;
  if (!authToken) {
    throw new Error("Access Token is required");
  }
  if (!accountName || !user || !databaseName || !warehouse || !tableName || !fieldName || !fieldValue) {
    throw new Error("Account name and user are required");
  }

  // Set up a connection using snowflake-sdk
  const connection = snowflake.createConnection({
    account: accountName,
    username: user,
    authenticator: "OAUTH",
    token: authToken,
    role: "CREDAL_READ",
    warehouse: warehouse,
    database: databaseName,
    schema: "PUBLIC",
  });

  try {
    await new Promise((resolve, reject) => {
      connection.connect((err, conn) => {
        if (err) {
          console.error("Unable to connect:", err.message);
          return reject(err);
        }
        console.log("Successfully connected to Snowflake.");
        resolve(conn);
      });
    });

    const query = `SELECT * FROM ${databaseName}.PUBLIC.${tableName} WHERE ${fieldName} = ?`;
    const binds = [fieldValue];

    return await new Promise<snowflakeGetRowByFieldValueOutputType>((resolve, reject) => {
      connection.execute({
        sqlText: query,
        binds: binds,
        complete: (err, stmt, rows) => {
          if (err) {
            return reject(err);
          }
          if (!rows) {
            return {
              row: {
                rowContents: {},
              },
            };
          }
          return resolve({
            row: {
              rowContents: rows[0],
            },
          });
        },
      });
    });
  } catch (error) {
    console.error("An error occurred while executing the query:", error);
    throw error;
  } finally {
    connection.destroy(err => {
      if (err) {
        console.log("Failed to disconnect:", err);
      } else {
        console.log("Disconnected from Snowflake.");
      }
    });
  }
};

export default getRowByFieldValue;
