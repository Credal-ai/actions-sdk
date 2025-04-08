import type { AuthParamsType } from "../../../autogen/types";
import crypto from "crypto";
import type { Connection } from "snowflake-sdk";
import snowflake from "snowflake-sdk";

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
    // Always try to use Nango-Snowflake OAuth
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
    // Use the apiKey for authentication (one off)
    const getPrivateKeyCorrectFormat = (privateKey: string): string => {
      const buffer: Buffer = Buffer.from(privateKey);
      const privateKeyObject = crypto.createPrivateKey({
        key: buffer,
        format: "pem",
        passphrase: "password",
      });
      const privateKeyCorrectFormat = privateKeyObject.export({
        format: "pem",
        type: "pkcs8",
      });
      return privateKeyCorrectFormat.toString();
    };
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
