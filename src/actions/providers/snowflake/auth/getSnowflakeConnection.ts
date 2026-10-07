import type { AuthParamsType } from "../../../autogen/types.js";
import type { Connection } from "snowflake-sdk";
import snowflake from "snowflake-sdk";
import { createPrivateKey } from "node:crypto";

const getPrivateKeyCorrectFormat = (privateKey: string): string => {
  try {
    return createPrivateKey(privateKey).export({ type: "pkcs8", format: "pem" }).toString();
  } catch (error) {
    console.error("Error processing private key:", error);
    throw new Error("Invalid private key format. Please check the key format and try again.", { cause: error });
  }
};

export function getSnowflakeConnection(
  snowflakeData: {
    account: string;
    username: string;
    warehouse: string;
    database: string;
    role?: string;
  },
  authParams: AuthParamsType,
): Connection {
  const { authToken, apiKey } = authParams;
  const { account, username, warehouse, database, role } = snowflakeData;

  if (authToken) {
    // Always try to use Nango-Snowflake OAuth (unused for now)
    return snowflake.createConnection({
      account: account,
      username: username,
      authenticator: "OAUTH",
      token: authToken,
      warehouse: warehouse,
      database: database,
    });
  } else if (apiKey) {
    const privateKeyCorrectFormatString = getPrivateKeyCorrectFormat(apiKey);

    return snowflake.createConnection({
      account: account,
      username: username,
      privateKey: privateKeyCorrectFormatString,
      authenticator: "SNOWFLAKE_JWT",
      role: role,
      warehouse: warehouse,
      database: database,
    });
  } else {
    throw new Error("Snowflake authToken or apiKey is required");
  }
}

export async function connectToSnowflakeAndWarehouse(connection: Connection, warehouse?: string) {
  await new Promise((resolve, reject) => {
    connection.connect((err, conn) => {
      if (err) {
        console.error("Unable to connect to Snowflake:", err.message);
        return reject(err);
      }
      resolve(conn);
    });
  });

  if (warehouse) {
    await new Promise((resolve, reject) => {
      connection.execute({
        sqlText: `USE WAREHOUSE ${warehouse}`,
        complete: (err, stmt, rows) => {
          if (err) {
            console.error("Unable to use warehouse:", err.message);
            return reject(err);
          }
          resolve(rows);
        },
      });
    });
  }
}
