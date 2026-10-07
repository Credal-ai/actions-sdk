import { createPrivateKey, generateKeyPairSync } from "node:crypto";
import { describe, expect, it, jest } from "@jest/globals";
import snowflake from "snowflake-sdk";
import { getSnowflakeConnection } from "../../src/actions/providers/snowflake/auth/getSnowflakeConnection.js";

jest.mock("snowflake-sdk", () => ({
  __esModule: true,
  default: { createConnection: jest.fn() },
}));

const snowflakeData = {
  account: "account",
  username: "user",
  warehouse: "warehouse",
  database: "database",
};

describe("getSnowflakeConnection", () => {
  it("normalizes an RSA private key to PKCS#8 PEM for Snowflake", () => {
    const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 1024 });
    const pkcs1Pem = privateKey
      .export({ type: "pkcs1", format: "pem" })
      .toString();
    const pkcs8Pem = createPrivateKey(pkcs1Pem)
      .export({ type: "pkcs8", format: "pem" })
      .toString();

    getSnowflakeConnection(snowflakeData, { apiKey: pkcs1Pem });

    expect(snowflake.createConnection).toHaveBeenCalledWith(
      expect.objectContaining({
        authenticator: "SNOWFLAKE_JWT",
        privateKey: pkcs8Pem,
      }),
    );
  });

  it("rejects malformed private keys", () => {
    const log = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    expect(() =>
      getSnowflakeConnection(snowflakeData, { apiKey: "invalid key" }),
    ).toThrow(
      "Invalid private key format. Please check the key format and try again.",
    );

    log.mockRestore();
  });
});
