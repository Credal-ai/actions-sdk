import type {
  AuthParamsType,
  snowflakeGetRowByFieldValueFunction,
  snowflakeGetRowByFieldValueOutputType,
  snowflakeGetRowByFieldValueParamsType,
} from "../../autogen/types.js";
import { getSnowflakeConnection } from "./auth/getSnowflakeConnection.js";

const getRowByFieldValue: snowflakeGetRowByFieldValueFunction = async ({
  params,
  authParams,
}: {
  params: snowflakeGetRowByFieldValueParamsType;
  authParams: AuthParamsType;
}): Promise<snowflakeGetRowByFieldValueOutputType> => {
  const { databaseName, tableName, fieldName, warehouse, fieldValue, accountName } = params;

  if (!accountName || !databaseName || !warehouse) {
    // TODO: Move these to required params
    throw new Error("Account name and user are required");
  }

  // Set up a connection using snowflake-sdk
  const connection = getSnowflakeConnection(
    {
      account: accountName,
      username: authParams.username || "CREDAL_USER",
      warehouse: warehouse,
      database: databaseName,
    },
    {
      authToken: authParams.authToken,
      apiKey: authParams.apiKey,
    },
  );

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
