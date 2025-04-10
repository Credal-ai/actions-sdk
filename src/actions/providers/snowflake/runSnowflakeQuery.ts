import snowflake from "snowflake-sdk";
import type {
  AuthParamsType,
  snowflakeRunSnowflakeQueryFunction,
  snowflakeRunSnowflakeQueryOutputType,
  snowflakeRunSnowflakeQueryParamsType,
} from "../../autogen/types";
import { connectToSnowflakeAndWarehouse, getSnowflakeConnection } from "./auth/getSnowflakeConnection";
import { formatDataForCodeInterpreter } from "../../util/formatDataForCodeInterpreter";

snowflake.configure({ logLevel: "ERROR" });

const runSnowflakeQuery: snowflakeRunSnowflakeQueryFunction = async ({
  params,
  authParams,
}: {
  params: snowflakeRunSnowflakeQueryParamsType;
  authParams: AuthParamsType;
}): Promise<snowflakeRunSnowflakeQueryOutputType> => {
  const { databaseName, warehouse, query, user, accountName, outputFormat = "json" } = params;

  if (!accountName || !user || !databaseName || !warehouse || !query) {
    throw new Error("Missing required parameters for Snowflake query");
  }
  const executeQueryAndFormatData = async (): Promise<{ formattedData: string; resultsLength: number }> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const queryResults: any[] = await new Promise<any[]>((resolve, reject) => {
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
    const { formattedData, resultsLength } = formatDataForCodeInterpreter(queryResults, outputFormat);
    return { formattedData, resultsLength };
  };

  // Set up a connection using snowflake-sdk
  const connection = getSnowflakeConnection(
    {
      account: accountName,
      username: user,
      warehouse: warehouse,
      database: databaseName,
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
