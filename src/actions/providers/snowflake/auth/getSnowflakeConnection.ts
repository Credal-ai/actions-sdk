import type { AuthParamsType } from "../../../autogen/types";
import type { Connection } from "snowflake-sdk";
import * as snowflake from "snowflake-sdk";
import * as forge from "node-forge";

const getPrivateKeyCorrectFormat = (privateKey: string): string => {
  try {
    // Parse the private key
    const pemKey = forge.pem.decode(privateKey)[0];
    // Re-encode it properly with correct formatting
    return forge.pem.encode(pemKey);
  } catch (error) {
    console.error("Error processing private key:", error);
    throw new Error("Invalid private key format. Please check the key format and try again.");
  }
};

export function getSnowflakeConnection(
  snowflakeData: {
    account: string;
    username: string;
    warehouse: string;
    database: string;
  },
  authParams: AuthParamsType,
): Connection {
  const { authToken, apiKey } = authParams;
  const { account, username, warehouse, database } = snowflakeData;

  if (authToken) {
    // Always try to use Nango-Snowflake OAuth (unused for now)
    return snowflake.createConnection({
      account: account,
      username: username,
      authenticator: "OAUTH",
      token: authToken,
      role: "CREDAL_READ",
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
      role: "CREDAL_READ",
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
