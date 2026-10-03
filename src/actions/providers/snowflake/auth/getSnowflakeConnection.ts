import type { AuthParamsType } from "../../../autogen/types.js";
import type { Connection } from "snowflake-sdk";
import snowflake from "snowflake-sdk";

// Rewrap a PEM block at 64 columns with CRLF, matching the previous node-forge
// pem.decode/encode output. node-forge 1.4.0 has no fix for GHSA-86w9-cpqp-85rv.
const rewrapPem = (input: string): string => {
  const begin = input.match(/-----BEGIN ([A-Z0-9- ]+)-----/);
  if (!begin || begin.index == null) {
    throw new Error("Invalid PEM formatted message.");
  }
  const rawType = begin[1];
  const type = rawType === "NEW CERTIFICATE REQUEST" ? "CERTIFICATE REQUEST" : rawType;
  const endToken = `-----END ${rawType}-----`;
  const end = input.indexOf(endToken, begin.index + begin[0].length);
  if (end === -1) {
    throw new Error("Invalid PEM formatted message.");
  }

  let inner = input.slice(begin.index + begin[0].length, end).replace(/^\r?\n/, "");
  let headers = "";
  const blankLine = inner.search(/\r?\n\r?\n/);
  if (blankLine !== -1 && inner.slice(0, blankLine).includes(":")) {
    headers = `${inner.slice(0, blankLine).replace(/\r\n/g, "\n").replace(/\n/g, "\r\n")}\r\n\r\n`;
    inner = inner.slice(blankLine).replace(/^(?:\r?\n)+/, "");
  }

  const body = inner.replace(/[^A-Za-z0-9+/=]/g, "");
  if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(body)) {
    throw new Error("Invalid PEM formatted message.");
  }

  const wrapped = body.replace(/.{1,64}/g, "$&\r\n");
  return `-----BEGIN ${type}-----\r\n${headers}${wrapped}-----END ${type}-----\r\n`;
};

const getPrivateKeyCorrectFormat = (privateKey: string): string => {
  try {
    return rewrapPem(privateKey);
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
