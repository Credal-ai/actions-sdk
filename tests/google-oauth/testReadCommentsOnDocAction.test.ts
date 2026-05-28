import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import readCommentsOnDoc from "../../src/actions/providers/google-oauth/readCommentsOnDoc";

/* eslint-disable @typescript-eslint/no-explicit-any */
const mockGet = jest.fn<(...args: any[]) => Promise<any>>();

jest.mock("../../src/actions/util/axiosClient", () => ({
  axiosClient: { get: (...args: any[]) => mockGet(...args) },
}));

const AUTH = { authToken: "test-token" };

describe("readCommentsOnDoc Drive metadata handling", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("excludes resolved comments by default and preserves deleted comments/replies when requested", async () => {
    mockGet
      .mockResolvedValueOnce({
        data: { mimeType: "application/vnd.google-apps.document" },
      })
      .mockResolvedValueOnce({
        data: {
          comments: [
            {
              id: "deleted-comment",
              content: null,
              createdTime: "2026-05-28T03:44:15.852Z",
              modifiedTime: "2026-05-28T03:44:32.547Z",
              resolved: null,
              deleted: true,
              author: null,
              quotedFileContent: null,
              replies: [
                {
                  id: "deleted-reply",
                  content: null,
                  createdTime: "2026-05-28T03:44:28.935Z",
                  modifiedTime: "2026-05-28T03:44:28.935Z",
                  action: null,
                  deleted: true,
                  author: null,
                },
              ],
            },
            {
              id: "resolved-comment",
              content: "Duplicate comment highlighting the word cat",
              createdTime: "2026-05-20T02:19:16.835Z",
              modifiedTime: "2026-05-28T03:45:54.825Z",
              resolved: true,
              deleted: false,
              author: { displayName: "Matthew Betancourt" },
              quotedFileContent: { value: "cat" },
              replies: [],
            },
          ],
        },
      })
      .mockRejectedValueOnce(new Error("DOCX export unavailable in unit test"));

    const result = await readCommentsOnDoc({
      authParams: AUTH,
      params: {
        documentId: "doc-id",
        includeDeleted: true,
        includeReplies: true,
      },
    });

    expect(result.success).toBe(true);
    expect(result.comments).toEqual([
      expect.objectContaining({
        commentId: "deleted-comment",
        content: null,
        deleted: true,
        resolved: false,
        anchorConfidence: "none",
        replies: [
          expect.objectContaining({
            replyId: "deleted-reply",
            content: null,
            deleted: true,
          }),
        ],
      }),
    ]);

    expect(mockGet.mock.calls[1][0]).toContain("includeDeleted=true");
  });

  it("includes resolved comments when includeResolved is true", async () => {
    mockGet
      .mockResolvedValueOnce({
        data: { mimeType: "application/vnd.google-apps.document" },
      })
      .mockResolvedValueOnce({
        data: {
          comments: [
            {
              id: "resolved-comment",
              content: "Duplicate comment highlighting the word cat",
              createdTime: "2026-05-20T02:19:16.835Z",
              modifiedTime: "2026-05-28T03:45:54.825Z",
              resolved: true,
              deleted: false,
              author: { displayName: "Matthew Betancourt" },
              quotedFileContent: { value: "cat" },
              replies: [
                {
                  id: "resolve-reply",
                  content: "",
                  createdTime: "2026-05-28T03:45:54.825Z",
                  modifiedTime: "2026-05-28T03:45:54.825Z",
                  action: "resolve",
                  deleted: false,
                  author: { displayName: "Matthew Betancourt" },
                },
              ],
            },
          ],
        },
      })
      .mockRejectedValueOnce(new Error("DOCX export unavailable in unit test"));

    const result = await readCommentsOnDoc({
      authParams: AUTH,
      params: {
        documentId: "doc-id",
        includeResolved: true,
        includeReplies: true,
      },
    });

    expect(result.success).toBe(true);
    expect(result.comments).toEqual([
      expect.objectContaining({
        commentId: "resolved-comment",
        resolved: true,
        deleted: false,
        anchoredText: "cat",
        replies: [
          expect.objectContaining({
            replyId: "resolve-reply",
            action: "resolve",
          }),
        ],
      }),
    ]);
  });
});
