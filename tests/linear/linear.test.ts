import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { redactPII } from "../../src/actions/providers/linear/utils/piiRedaction";

// Must be mocked before importing modules that depend on it, to prevent
// better-sqlite3 from opening a real database during tests.
jest.mock("../../src/actions/providers/linear/utils/auditLogger", () => ({
  logAction: jest.fn(),
}));

import commentOnIssue from "../../src/actions/providers/linear/commentOnIssue";
import createIssue from "../../src/actions/providers/linear/createIssue";

const AUTH = { authToken: "test-token" };

// ---------------------------------------------------------------------------
// redactPII
// ---------------------------------------------------------------------------

describe("redactPII", () => {
  it("redacts an email address", () => {
    expect(redactPII("Contact me at user@example.com for details")).toBe(
      "Contact me at [REDACTED] for details",
    );
  });

  it("redacts a US phone number", () => {
    expect(redactPII("Call 555-867-5309 for support")).toBe(
      "Call [REDACTED] for support",
    );
  });

  it("redacts a 16-digit credit card number", () => {
    expect(redactPII("Card: 4111 1111 1111 1111")).toBe("Card: [REDACTED]");
  });

  it("redacts an SSN", () => {
    expect(redactPII("SSN: 123-45-6789")).toBe("SSN: [REDACTED]");
  });

  it("passes a clean string through unchanged", () => {
    const clean = "This is a safe string with no PII.";
    expect(redactPII(clean)).toBe(clean);
  });

  it("redacts multiple PII types in one string", () => {
    const input =
      "Email user@example.com, SSN 123-45-6789, card 4111-1111-1111-1111";
    const output = redactPII(input);
    expect(output).not.toContain("user@example.com");
    expect(output).not.toContain("123-45-6789");
    expect(output).not.toContain("4111-1111-1111-1111");
    expect((output.match(/\[REDACTED\]/g) ?? []).length).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// commentOnIssue — HITL gate
// ---------------------------------------------------------------------------

describe("commentOnIssue HITL gate", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn() as typeof fetch;
  });

  it("returns requiresApproval and does not call fetch when approved is not set", async () => {
    const result = await commentOnIssue({
      params: { issueId: "ISS-123", body: "This is a comment" },
      authParams: AUTH,
    });

    expect(result.success).toBe(false);
    expect(result.requiresApproval).toBe(true);
    expect(result.pendingAction).toBeDefined();
    expect(result.pendingAction?.actionName).toBe("commentOnIssue");
    expect(result.pendingAction?.provider).toBe("linear");
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// createIssue — HITL gate
// ---------------------------------------------------------------------------

describe("createIssue HITL gate", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn() as typeof fetch;
  });

  it("returns requiresApproval and does not call fetch when approved is not set", async () => {
    const result = await createIssue({
      params: { title: "Bug: login broken", teamId: "TEAM-1" },
      authParams: AUTH,
    });

    expect(result.success).toBe(false);
    expect(result.requiresApproval).toBe(true);
    expect(result.pendingAction).toBeDefined();
    expect(result.pendingAction?.actionName).toBe("createIssue");
    expect(result.pendingAction?.provider).toBe("linear");
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
