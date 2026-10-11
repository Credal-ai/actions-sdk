import {
  createPrivateKey,
  createPublicKey,
  generateKeyPairSync,
} from "node:crypto";
import { describe, expect, it } from "@jest/globals";
import { getPrivateKeyCorrectFormat } from "../../src/actions/providers/snowflake/auth/getPrivateKeyCorrectFormat";

const { privateKey: pkcs1PrivateKey, publicKey } = generateKeyPairSync("rsa", {
  modulusLength: 2048,
  privateKeyEncoding: { format: "pem", type: "pkcs1" },
  publicKeyEncoding: { format: "pem", type: "spki" },
});
const pkcs8PrivateKey = createPrivateKey(pkcs1PrivateKey)
  .export({ format: "pem", type: "pkcs8" })
  .toString();

describe("getPrivateKeyCorrectFormat", () => {
  it.each([
    ["PKCS#1", pkcs1PrivateKey],
    ["PKCS#8", pkcs8PrivateKey],
  ])(
    "converts a %s RSA key to PKCS#8 without changing the key",
    (_format, privateKey) => {
      const normalized = getPrivateKeyCorrectFormat(privateKey);

      expect(normalized).toMatch(/^-----BEGIN PRIVATE KEY-----/);
      expect(
        createPublicKey(normalized)
          .export({ format: "pem", type: "spki" })
          .toString(),
      ).toBe(publicKey);
    },
  );

  it("rejects invalid private keys", () => {
    expect(() => getPrivateKeyCorrectFormat("invalid key")).toThrow(
      "Invalid private key format. Please check the key format and try again.",
    );
  });
});
