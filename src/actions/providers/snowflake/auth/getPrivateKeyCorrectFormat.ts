import { createPrivateKey } from "node:crypto";

export const getPrivateKeyCorrectFormat = (privateKey: string): string => {
  try {
    return createPrivateKey(privateKey).export({ format: "pem", type: "pkcs8" }).toString();
  } catch (error) {
    throw new Error("Invalid private key format. Please check the key format and try again.", { cause: error });
  }
};
