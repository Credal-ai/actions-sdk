import snowflake from "snowflake-sdk";
import {
  AuthParamsType,
  snowflakeRunSnowflakeQueryWriteResultsToS3Function,
  snowflakeRunSnowflakeQueryWriteResultsToS3OutputType,
  snowflakeRunSnowflakeQueryWriteResultsToS3ParamsType,
} from "../../autogen/types";
import crypto from "crypto";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const runSnowflakeQueryWriteResultsToS3: snowflakeRunSnowflakeQueryWriteResultsToS3Function = async ({
  params,
  authParams,
}: {
  params: snowflakeRunSnowflakeQueryWriteResultsToS3ParamsType;
  authParams: AuthParamsType;
}): Promise<snowflakeRunSnowflakeQueryWriteResultsToS3OutputType> => {
  const {
    databaseName,
    warehouse,
    query,
    user,
    accountName,
    s3BucketName,
    s3ObjectKey,
    s3Region,
    outputFormat = "json",
  } = params;

  const { apiKey: privateKey, awsAccessKeyId, awsSecretAccessKey } = authParams;

  // Validate required parameters
  if (!privateKey) {
    throw new Error("Snowflake private key is required");
  }

  if (!awsAccessKeyId || !awsSecretAccessKey) {
    throw new Error("AWS credentials are required");
  }

  if (!accountName || !user || !databaseName || !warehouse || !query || !s3BucketName || !s3ObjectKey) {
    throw new Error("Missing required parameters for Snowflake query or S3 destination");
  }

  // Process the private key
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
  const privateKeyCorrectFormatString = privateKeyCorrectFormat.toString();

  // Set up a connection using snowflake-sdk
  const connection = snowflake.createConnection({
    account: accountName,
    username: user,
    privateKey: privateKeyCorrectFormatString,
    authenticator: "SNOWFLAKE_JWT",
    role: "ACCOUNTADMIN",
    warehouse: warehouse,
    database: databaseName,
    schema: "PUBLIC",
  });

  try {
    // Connect to Snowflake
    await new Promise((resolve, reject) => {
      connection.connect((err, conn) => {
        if (err) {
          console.error("Unable to connect to Snowflake:", err.message);
          return reject(err);
        }
        console.log("Successfully connected to Snowflake.");
        resolve(conn);
      });
    });

    // Execute the query
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
        const rows = queryResults.map(row => Object.values(row).join(","));
        formattedData = [headers, ...rows].join("\n");
      }
    } else {
      // Default to JSON
      formattedData = JSON.stringify(queryResults, null, 2);
    }

    // Upload to S3
    const s3Client = new S3Client({
      region: s3Region || "us-east-1",
      credentials: {
        accessKeyId: awsAccessKeyId,
        secretAccessKey: awsSecretAccessKey,
      },
    });

    const contentType = outputFormat.toLowerCase() === "csv" ? "text/csv" : "application/json";
    const fileExtension = outputFormat.toLowerCase() === "csv" ? "csv" : "json";

    // Make sure the key has the appropriate extension
    const finalKey = s3ObjectKey.endsWith(`.${fileExtension}`) ? s3ObjectKey : `${s3ObjectKey}.${fileExtension}`;

    const uploadCommand = new PutObjectCommand({
      Bucket: s3BucketName,
      Key: finalKey,
      Body: formattedData,
      ContentType: contentType,
    });

    await s3Client.send(uploadCommand);

    const s3Url = `https://${s3BucketName}.s3.${s3Region || "us-east-1"}.amazonaws.com/${finalKey}`;

    // Return fields to match schema definition
    return {
      bucketUrl: s3Url, // Changed from resultLocation to bucketUrl to match schema
      message: `Query results successfully written to S3`,
      rowCount: queryResults.length,
    };
  } catch (error: unknown) {
    throw Error(`An error occurred: ${error}`);
  } finally {
    // Clean up the connection
    connection.destroy(err => {
      if (err) {
        console.log("Failed to disconnect from Snowflake:", err);
      } else {
        console.log("Disconnected from Snowflake.");
      }
    });
  }
};

export default runSnowflakeQueryWriteResultsToS3;
