import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import addTextToTopOfDoc from "../../src/actions/providers/google-oauth/addTextToTopOfDoc";
import createNewGoogleDoc from "../../src/actions/providers/google-oauth/createNewGoogleDoc";
import updateDoc from "../../src/actions/providers/google-oauth/updateDoc";

/* eslint-disable @typescript-eslint/no-explicit-any */
const mockPost = jest.fn<(...args: any[]) => Promise<any>>();

jest.mock("../../src/actions/util/axiosClient", () => ({
  axiosClient: { post: (...args: any[]) => mockPost(...args) },
}));

jest.mock("axios", () => ({
  __esModule: true,
  default: { post: (...args: any[]) => mockPost(...args) },
}));

const AUTH = { authToken: "test-token" };
const NO_AUTH = { authToken: "" };

describe("createNewGoogleDoc", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("creates doc then inserts plain text content", async () => {
    mockPost
      .mockResolvedValueOnce({ data: { documentId: "doc-123" } })
      .mockResolvedValueOnce({ data: {} });

    const result = await createNewGoogleDoc({
      params: { title: "My Doc", content: "Hello world" },
      authParams: AUTH,
    });

    expect(result.documentId).toBe("doc-123");
    expect(result.documentUrl).toBe(
      "https://docs.google.com/document/d/doc-123/edit",
    );

    expect(mockPost).toHaveBeenCalledTimes(2);

    const [createUrl, createBody] = mockPost.mock.calls[0];
    expect(createUrl).toBe("https://docs.googleapis.com/v1/documents");
    expect(createBody).toEqual({ title: "My Doc" });

    const [batchUrl, batchBody] = mockPost.mock.calls[1];
    expect(batchUrl).toBe(
      "https://docs.googleapis.com/v1/documents/doc-123:batchUpdate",
    );
    expect(batchBody.requests).toEqual([
      { insertText: { location: { index: 1 }, text: "Hello world" } },
    ]);
  });

  it("creates doc with markdown content — produces styled requests", async () => {
    mockPost
      .mockResolvedValueOnce({ data: { documentId: "doc-md" } })
      .mockResolvedValueOnce({ data: {} });

    await createNewGoogleDoc({
      params: {
        title: "MD Doc",
        content: "**bold**",
        contentFormat: "markdown",
      },
      authParams: AUTH,
    });

    const [, batchBody] = mockPost.mock.calls[1];
    const inserts = batchBody.requests.filter(
      (r: Record<string, unknown>) => r.insertText,
    );
    const styles = batchBody.requests.filter(
      (r: Record<string, unknown>) => r.updateTextStyle,
    );

    expect(inserts.length).toBeGreaterThan(0);
    const text = inserts
      .map((r: { insertText: { text: string } }) => r.insertText.text)
      .join("");
    expect(text).toContain("bold");
    expect(text).not.toContain("**");

    expect(styles.length).toBeGreaterThan(0);
    expect(styles[0].updateTextStyle.textStyle.bold).toBe(true);
  });

  it("creates doc with html content", async () => {
    mockPost
      .mockResolvedValueOnce({ data: { documentId: "doc-html" } })
      .mockResolvedValueOnce({ data: {} });

    await createNewGoogleDoc({
      params: {
        title: "HTML Doc",
        content: "<b>hi</b>",
        contentFormat: "html",
      },
      authParams: AUTH,
    });

    const [, batchBody] = mockPost.mock.calls[1];
    expect(batchBody.requests).toEqual([
      { insertText: { location: { index: 1 }, text: "hi" } },
      {
        updateTextStyle: {
          range: { startIndex: 1, endIndex: 3 },
          textStyle: { bold: true },
          fields: "bold",
        },
      },
    ]);
  });

  it("respects deprecated usesHtml when contentFormat not set", async () => {
    mockPost
      .mockResolvedValueOnce({ data: { documentId: "doc-legacy" } })
      .mockResolvedValueOnce({ data: {} });

    await createNewGoogleDoc({
      params: { title: "Legacy", content: "<i>em</i>", usesHtml: true },
      authParams: AUTH,
    });

    const [, batchBody] = mockPost.mock.calls[1];
    const styles = batchBody.requests.filter(
      (r: Record<string, unknown>) => r.updateTextStyle,
    );
    expect(styles[0].updateTextStyle.textStyle.italic).toBe(true);
  });

  it("contentFormat takes precedence over usesHtml", async () => {
    mockPost
      .mockResolvedValueOnce({ data: { documentId: "doc-precedence" } })
      .mockResolvedValueOnce({ data: {} });

    await createNewGoogleDoc({
      params: {
        title: "Precedence",
        content: "plain text",
        contentFormat: "plain",
        usesHtml: true,
      },
      authParams: AUTH,
    });

    const [, batchBody] = mockPost.mock.calls[1];
    expect(batchBody.requests).toEqual([
      { insertText: { location: { index: 1 }, text: "plain text" } },
    ]);
  });

  it("skips batchUpdate when no content provided", async () => {
    mockPost.mockResolvedValueOnce({ data: { documentId: "doc-empty" } });

    const result = await createNewGoogleDoc({
      params: { title: "Empty Doc" },
      authParams: AUTH,
    });

    expect(result.documentId).toBe("doc-empty");
    expect(mockPost).toHaveBeenCalledTimes(1);
  });

  it("throws on missing auth token", async () => {
    await expect(
      createNewGoogleDoc({ params: { title: "Fail" }, authParams: NO_AUTH }),
    ).rejects.toThrow();
  });
});

describe("addTextToTopOfDoc", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("inserts plain text at top of existing doc", async () => {
    mockPost.mockResolvedValueOnce({ data: {} });

    const result = await addTextToTopOfDoc({
      params: { documentId: "doc-456", text: "Hello" },
      authParams: AUTH,
    });

    expect(result.success).toBe(true);
    expect(result.documentId).toBe("doc-456");

    const [url, body] = mockPost.mock.calls[0];
    expect(url).toBe(
      "https://docs.googleapis.com/v1/documents/doc-456:batchUpdate",
    );
    expect(body.requests).toEqual([
      { insertText: { location: { index: 1 }, text: "Hello\n" } },
    ]);
  });

  it("returns error on missing auth", async () => {
    const result = await addTextToTopOfDoc({
      params: { documentId: "doc-no-auth", text: "x" },
      authParams: NO_AUTH,
    });

    expect(result.success).toBe(false);
    expect(mockPost).not.toHaveBeenCalled();
  });

  it("returns error on API failure", async () => {
    mockPost.mockRejectedValueOnce(new Error("Network error"));

    const result = await addTextToTopOfDoc({
      params: { documentId: "doc-fail", text: "x" },
      authParams: AUTH,
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("Network error");
  });

  it("inserts markdown-formatted content when contentFormat is markdown", async () => {
    mockPost.mockResolvedValueOnce({ data: {} });

    const result = await addTextToTopOfDoc({
      params: {
        documentId: "doc-md",
        text: "**bold text**",
        contentFormat: "markdown",
      },
      authParams: AUTH,
    });

    expect(result.success).toBe(true);

    const [, body] = mockPost.mock.calls[0];
    const inserts = body.requests.filter(
      (r: Record<string, unknown>) => r.insertText,
    );
    const styles = body.requests.filter(
      (r: Record<string, unknown>) => r.updateTextStyle,
    );

    const text = inserts
      .map((r: { insertText: { text: string } }) => r.insertText.text)
      .join("");
    expect(text).toContain("bold text");
    expect(text).not.toContain("**");

    expect(styles.length).toBeGreaterThan(0);
    expect(styles[0].updateTextStyle.textStyle.bold).toBe(true);
  });

  it("inserts html-formatted content when contentFormat is html", async () => {
    mockPost.mockResolvedValueOnce({ data: {} });

    const result = await addTextToTopOfDoc({
      params: {
        documentId: "doc-html",
        text: "<i>italic</i>",
        contentFormat: "html",
      },
      authParams: AUTH,
    });

    expect(result.success).toBe(true);

    const [, body] = mockPost.mock.calls[0];
    const inserts = body.requests.filter(
      (r: Record<string, unknown>) => r.insertText,
    );
    const styles = body.requests.filter(
      (r: Record<string, unknown>) => r.updateTextStyle,
    );

    const text = inserts
      .map((r: { insertText: { text: string } }) => r.insertText.text)
      .join("");
    expect(text).toContain("italic");

    expect(styles.length).toBeGreaterThan(0);
    expect(styles[0].updateTextStyle.textStyle.italic).toBe(true);
  });

  it("defaults to plain text when contentFormat is not set", async () => {
    mockPost.mockResolvedValueOnce({ data: {} });

    await addTextToTopOfDoc({
      params: { documentId: "doc-default", text: "**not bold**" },
      authParams: AUTH,
    });

    const [, body] = mockPost.mock.calls[0];
    expect(body.requests).toEqual([
      {
        insertText: {
          location: { index: 1 },
          text: "**not bold**\n",
        },
      },
    ]);
  });
});

describe("updateDoc", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("sends raw requests array when provided", async () => {
    const rawRequests = [
      { insertText: { location: { index: 1 }, text: "raw" } },
    ];
    mockPost.mockResolvedValueOnce({ status: 200, data: {} });

    const result = await updateDoc({
      params: { documentId: "doc-raw", requests: rawRequests },
      authParams: AUTH,
    });

    expect(result.success).toBe(true);
    const [url, body] = mockPost.mock.calls[0];
    expect(url).toBe(
      "https://docs.googleapis.com/v1/documents/doc-raw:batchUpdate",
    );
    expect(body.requests).toEqual(rawRequests);
  });

  it("returns error when no requests provided", async () => {
    const result = await updateDoc({
      params: { documentId: "doc-nothing" },
      authParams: AUTH,
    });

    expect(result.success).toBe(false);
    expect(mockPost).not.toHaveBeenCalled();
  });

  it("returns error on missing auth", async () => {
    const result = await updateDoc({
      params: { documentId: "doc-no-auth" },
      authParams: NO_AUTH,
    });

    expect(result.success).toBe(false);
    expect(mockPost).not.toHaveBeenCalled();
  });

  it("returns error on API failure", async () => {
    const rawRequests = [
      { insertText: { location: { index: 1 }, text: "fail" } },
    ];
    mockPost.mockRejectedValueOnce(new Error("Server error"));

    const result = await updateDoc({
      params: { documentId: "doc-fail", requests: rawRequests },
      authParams: AUTH,
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("Server error");
  });
});
