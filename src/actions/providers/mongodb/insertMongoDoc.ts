import { MongoClient } from "mongodb";
import type {
  AuthParamsType,
  mongoInsertMongoDocFunction,
  mongoInsertMongoDocOutputType,
  mongoInsertMongoDocParamsType,
} from "../../autogen/types";

const insertMongoDoc: mongoInsertMongoDocFunction = async ({
  params,
  authParams,
}: {
  params: mongoInsertMongoDocParamsType;
  authParams: AuthParamsType;
}): Promise<mongoInsertMongoDocOutputType> => {
  const { baseUrl } = authParams;
  const { collectionName, databaseName, document } = params;

  if (!baseUrl) throw new Error("baseUrl is required to connect to the mongodb cluster");
  const client = new MongoClient(baseUrl);

  try {
    await client.connect();
    console.log("Connected successfully to MongoDB");
    const db = client.db(databaseName);
    const collection = db.collection(collectionName);
    const insert = await collection.insertOne(document);
    const objectId = insert.insertedId.toString();
    return { objectId };
  } catch (error) {
    console.error("Error connecting to MongoDB or performing operations", error);
    throw error;
  } finally {
    await client.close();
  }
};

export default insertMongoDoc;
