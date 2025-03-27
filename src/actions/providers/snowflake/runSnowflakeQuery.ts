import snowflake from "snowflake-sdk";
import {
  AuthParamsType,
  snowflakeRunSnowflakeQueryFunction,
  snowflakeRunSnowflakeQueryOutputType,
  snowflakeRunSnowflakeQueryParamsType,
} from "../../autogen/types";

snowflake.configure({ logLevel: "ERROR" });

const runSnowflakeQuery: snowflakeRunSnowflakeQueryFunction = async ({
  params,
  authParams,
}: {
  params: snowflakeRunSnowflakeQueryParamsType;
  authParams: AuthParamsType;
}): Promise<snowflakeRunSnowflakeQueryOutputType> => {
  const { databaseName, warehouse, query, user, accountName, outputFormat = "json" } = params;

  const { authToken } = authParams;

  if (!authToken) {
    throw new Error("Snowflake authToken key is required");
  }
  if (!accountName || !user || !databaseName || !warehouse || !query) {
    throw new Error("Missing required parameters for Snowflake query");
  }
  const executeQueryAndFormatData = async (): Promise<{ formattedData: string; resultsLength: number }> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const queryResults = await new Promise<any[]>((resolve, reject) => {
      connection.execute({
        sqlText: query,
        complete: (err, stmt, rows) => {
          if (err) {
            return reject(err);
          }
          return resolve(rows || []);
        },
      });
    });

    // Format the results based on the output format
    let formattedData;
    if (outputFormat.toLowerCase() === "csv") {
      if (queryResults.length === 0) {
        formattedData = "";
      } else {
        const headers = Object.keys(queryResults[0]).join(",");
        const rows = queryResults.map(row =>
          Object.values(row)
            .map(value => (typeof value === "object" && value !== null ? JSON.stringify(value) : value))
            .join(","),
        );
        formattedData = [headers, ...rows].join("\n");
      }
    } else {
      // Default to JSON
      formattedData = JSON.stringify(queryResults).replace(/\s+/g, "");
    }
    return { formattedData, resultsLength: queryResults.length };
  };

  // Set up a connection using snowflake-sdk
  const connection = snowflake.createConnection({
    account: accountName,
    username: user,
    authenticator: "OAUTH",
    token: authToken,
    role: "CREDAL_READ",
    warehouse: warehouse,
    database: databaseName,
  });

  try {
    // Connect to Snowflake
    await new Promise((resolve, reject) => {
      connection.connect((err, conn) => {
        if (err) {
          console.error("Unable to connect to Snowflake:", err.message);
          return reject(err);
        }
        resolve(conn);
      });
    });

    const { formattedData, resultsLength } = await executeQueryAndFormatData();

    // Return fields to match schema definition
    connection.destroy(err => {
      if (err) {
        console.log("Failed to disconnect from Snowflake:", err);
      }
    });
    return {
      rowCount: resultsLength,
      content: formattedData,
      format: outputFormat,
    };
  } catch (error: unknown) {
    connection.destroy(err => {
      if (err) {
        console.log("Failed to disconnect from Snowflake:", err);
      }
    });
    throw Error(`An error occurred: ${error}`);
  }
};

export default runSnowflakeQuery;
