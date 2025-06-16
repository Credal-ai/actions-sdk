import snowflake from "snowflake-sdk";
import type {
  AuthParamsType,
  snowflakeRunSnowflakeQueryFunction,
  snowflakeRunSnowflakeQueryOutputType,
  snowflakeRunSnowflakeQueryParamsType,
} from "../../autogen/types.js";
import { connectToSnowflakeAndWarehouse, getSnowflakeConnection } from "./auth/getSnowflakeConnection.js";
import { formatDataForCodeInterpreter } from "../../util/formatDataForCodeInterpreter.js";

snowflake.configure({ logLevel: "ERROR" });

const runSnowflakeQuery: snowflakeRunSnowflakeQueryFunction = async ({
  params,
  authParams,
}: {
  params: snowflakeRunSnowflakeQueryParamsType;
  authParams: AuthParamsType;
}): Promise<snowflakeRunSnowflakeQueryOutputType> => {
  const { databaseName, warehouse, query, accountName, outputFormat = "json", limit, role } = params;

  const executeQueryAndFormatData = async (): Promise<{ formattedData: string; resultsLength: number }> => {
    const formattedQuery = query.trim().replace(/\s+/g, " "); // Normalize all whitespace to single spaces

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const queryResults: any[] = await new Promise<any[]>((resolve, reject) => {
      connection.execute({
        sqlText: formattedQuery,
        complete: (err, stmt, rows) => {
          if (err) {
            return reject(err);
          }
          return resolve(rows || []);
        },
      });
    });

    const fullResultLength = queryResults.length;

    // Format the results based on the output format
    if (limit && queryResults.length > limit) {
      queryResults.splice(limit);
    }
    const formattedData = formatDataForCodeInterpreter(queryResults, outputFormat);
    return { formattedData: formattedData, resultsLength: fullResultLength };
  };

  if (!authParams.username) {
    throw new Error("Snowflake username is required in authParams.");
  }

  // Set up a connection using snowflake-sdk
  const connection = getSnowflakeConnection(
    {
      account: accountName,
      username: authParams.username,
      warehouse: warehouse,
      database: databaseName,
      role: role,
    },
    { authToken: authParams.authToken, apiKey: authParams.apiKey },
  );

  try {
    // Connect to Snowflake
    await connectToSnowflakeAndWarehouse(connection, warehouse);
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
      error: limit && limit < resultsLength ? `Query results truncated to ${limit} rows.` : undefined,
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
