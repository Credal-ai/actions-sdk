import { describe, expect, it } from "@jest/globals";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { z } from "zod";
import { getEmailContent } from "../../src/actions/providers/google-oauth/utils/decodeMessage.js";
import {
  googleOauthUpdateDocParamsSchema,
  mathAddParamsSchema,
  salesforceCreateRecordParamsSchema,
} from "../../src/actions/autogen/types.js";

describe("security dependency compatibility", () => {
  it("retains HTML email conversion after the html-to-text upgrade", () => {
    const content = getEmailContent({
      id: "message",
      threadId: "thread",
      snippet: "",
      labelIds: [],
      internalDate: "0",
      payload: {
        mimeType: "text/html",
        headers: [],
        body: {
          data: Buffer.from(
            '<p>Hello <a href="https://example.com">world</a></p>',
          ).toString("base64url"),
          size: 0,
        },
      },
    });
    expect(content).toBe("Hello world [https://example.com]");
  });

  it("rejects oversized constrained arrays before validating their elements", () => {
    let visited = 0;
    const schema = z
      .array(
        z.string().refine(() => {
          visited++;
          return true;
        }),
      )
      .max(2);
    expect(schema.safeParse(["a", "b", "c"]).success).toBe(false);
    expect(visited).toBe(0);
  });

  it("retains numeric coercion and string-valued records in generated schemas", () => {
    expect(mathAddParamsSchema.parse({ a: "2", b: "3" })).toEqual({
      a: 2,
      b: 3,
    });
    expect(
      salesforceCreateRecordParamsSchema.safeParse({
        recordType: "Lead",
        fieldsToCreate: { Name: "Test" },
      }).success,
    ).toBe(true);
    expect(
      salesforceCreateRecordParamsSchema.safeParse({
        recordType: "Lead",
        fieldsToCreate: { Name: 1 },
      }).success,
    ).toBe(false);
  });

  it("retains generated oneOf validation and nested error paths", () => {
    const valid = {
      documentId: "doc",
      requests: [{ insertText: { location: { index: 1 }, text: "Hello" } }],
    };
    expect(googleOauthUpdateDocParamsSchema.safeParse(valid).success).toBe(
      true,
    );
    const invalid = googleOauthUpdateDocParamsSchema.safeParse({
      documentId: "doc",
      requests: [{}],
    });
    expect(invalid.success).toBe(false);
    if (!invalid.success)
      expect(invalid.error.issues[0].path).toEqual(["requests", 0]);
  });

  it("merges Jest configuration while blocking prototype poisoning", () => {
    const require = createRequire(resolve("package.json"));
    const requireFromJest = createRequire(require.resolve("jest-config"));
    const merge = requireFromJest("deepmerge") as {
      (target: unknown, source: unknown): Record<string, unknown>;
      all(values: unknown[]): unknown;
    };
    expect(
      merge.all([{ globals: { first: true } }, { globals: { second: true } }]),
    ).toEqual({ globals: { first: true, second: true } });
    const payload = JSON.parse('{"__proto__":{"isAdmin":true}}');
    for (const target of [
      Object.create(null),
      JSON.parse('{"__proto__":null}'),
    ]) {
      const result = merge(target, payload);
      expect(Object.getPrototypeOf(result)).toBe(Object.prototype);
      expect(result.isAdmin).toBeUndefined();
    }
    const nested = merge({ session: null }, { session: payload });
    expect(Object.getPrototypeOf(nested.session)).toBe(Object.prototype);
    expect((nested.session as Record<string, unknown>).isAdmin).toBeUndefined();
  });
});
