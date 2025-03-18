import snowflake from "snowflake-sdk";
import {
  AuthParamsType,
  snowflakeRunSnowflakeQueryWriteResultsToS3Function,
  snowflakeRunSnowflakeQueryWriteResultsToS3OutputType,
  snowflakeRunSnowflakeQueryWriteResultsToS3ParamsType,
} from "../../autogen/types";
import crypto from "crypto";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";

// Only log errors.
snowflake.configure({ logLevel: "ERROR" });

const runSnowflakeQueryWriteResultsToS3: snowflakeRunSnowflakeQueryWriteResultsToS3Function = async ({
  params,
  authParams,
}: {
  params: snowflakeRunSnowflakeQueryWriteResultsToS3ParamsType;
  authParams: AuthParamsType;
}): Promise<snowflakeRunSnowflakeQueryWriteResultsToS3OutputType> => {
  const { databaseName, warehouse, query, user, accountName, s3BucketName, s3Region, outputFormat = "json" } = params;

  const { apiKey: privateKey, awsAccessKeyId, awsSecretAccessKey } = authParams;

  if (!privateKey) {
    throw new Error("Snowflake private key is required");
  }
  if (!awsAccessKeyId || !awsSecretAccessKey) {
    throw new Error("AWS credentials are required");
  }
  if (!accountName || !user || !databaseName || !warehouse || !query || !s3BucketName) {
    throw new Error("Missing required parameters for Snowflake query or S3 destination");
  }

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
      formattedData = JSON.stringify(queryResults, null, 2);
    }
    return { formattedData, resultsLength: queryResults.length };
  };
  const uploadToS3AndGetURL = async (formattedData: string): Promise<string> => {
    // Create S3 client
    const s3Client = new S3Client({
      region: s3Region,
      credentials: {
        accessKeyId: awsAccessKeyId,
        secretAccessKey: awsSecretAccessKey,
      },
    });

    const contentType = outputFormat.toLowerCase() === "csv" ? "text/csv" : "application/json";
    const fileExtension = outputFormat.toLowerCase() === "csv" ? "csv" : "json";
    const finalKey = `${databaseName}/${uuidv4()}.${fileExtension}`;

    // Upload to S3 without ACL
    const uploadCommand = new PutObjectCommand({
      Bucket: s3BucketName,
      Key: finalKey,
      Body: formattedData,
      ContentType: contentType,
    });

    await s3Client.send(uploadCommand);

    // Generate a presigned URL (valid for an hour)
    const getObjectCommand = new GetObjectCommand({
      Bucket: s3BucketName,
      Key: finalKey,
    });

    const presignedUrl = await getSignedUrl(s3Client, getObjectCommand, { expiresIn: 3600 });
    return presignedUrl;
  };

  // Process the private key
  const privateKeyCorrectFormatString = getPrivateKeyCorrectFormat(privateKey);

  // Set up a connection using snowflake-sdk
  const connection = snowflake.createConnection({
    account: accountName,
    username: user,
    privateKey: privateKeyCorrectFormatString,
    authenticator: "SNOWFLAKE_JWT",
    role: "ACCOUNTADMIN",
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
    const presignedUrl = await uploadToS3AndGetURL(formattedData);

    // Return fields to match schema definition
    connection.destroy(err => {
      if (err) {
        console.log("Failed to disconnect from Snowflake:", err);
      }
    });
    return {
      bucketUrl: presignedUrl,
      message: `Query results successfully written to S3. URL valid for 1 hour.`,
      rowCount: resultsLength,
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

export default runSnowflakeQueryWriteResultsToS3;
