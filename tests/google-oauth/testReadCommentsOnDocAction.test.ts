import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import JSZip from "jszip";
import readCommentsOnDoc from "../../src/actions/providers/google-oauth/readCommentsOnDoc";

/* eslint-disable @typescript-eslint/no-explicit-any */
const mockGet = jest.fn<(...args: any[]) => Promise<any>>();

jest.mock("../../src/actions/util/axiosClient", () => ({
  axiosClient: { get: (...args: any[]) => mockGet(...args) },
}));

const AUTH = { authToken: "test-token" };

async function buildDocxWithThreadedReply() {
  const zip = new JSZip();

  zip.file(
    "word/comments.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
    <w:comments xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml">
      <w:comment w:id="0" w:author="Matthew Betancourt" w:date="2026-05-28T02:20:13Z">
        <w:p w14:paraId="00000000"><w:r><w:t>Root comment</w:t></w:r></w:p>
      </w:comment>
      <w:comment w:id="17" w:author="Matthew Betancourt" w:date="2026-05-28T04:20:00Z">
        <w:p w14:paraId="11111111"><w:r><w:t>This is a reply to Comment 1</w:t></w:r></w:p>
      </w:comment>
      <w:comment w:id="18" w:author="Matthew Betancourt" w:date="2026-05-28T04:25:00Z">
        <w:p w14:paraId="22222222"><w:r><w:t>Resolved comment</w:t></w:r></w:p>
      </w:comment>
    </w:comments>`,
  );
  zip.file(
    "word/commentsExtensible.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
    <w15:commentsEx xmlns:w15="http://schemas.microsoft.com/office/word/2012/wordml">
      <w15:commentEx w15:paraId="00000000" w15:done="0" />
      <w15:commentEx w15:paraId="11111111" w15:paraIdParent="00000000" w15:done="0" />
      <w15:commentEx w15:paraId="22222222" w15:done="1" />
    </w15:commentsEx>`,
  );
  zip.file(
    "word/document.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
    <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
      <w:body>
        <w:p>
          <w:commentRangeStart w:id="0"/>
          <w:r><w:t>Root anchor</w:t></w:r>
          <w:commentRangeEnd w:id="0"/>
        </w:p>
        <w:p>
          <w:commentRangeStart w:id="18"/>
          <w:r><w:t>Resolved anchor</w:t></w:r>
          <w:commentRangeEnd w:id="18"/>
        </w:p>
      </w:body>
    </w:document>`,
  );

  return zip.generateAsync({ type: "nodebuffer" });
}

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
        content: undefined,
        deleted: true,
        resolved: false,
        anchorConfidence: "none",
        replies: [
          expect.objectContaining({
            replyId: "deleted-reply",
            content: undefined,
            deleted: true,
          }),
        ],
      }),
    ]);

    expect(mockGet.mock.calls[1][0]).toContain("includeDeleted=true");
    expect(mockGet.mock.calls[0][0]).toContain("supportsAllDrives=true");
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

  it("excludes DOCX replies from top-level comments when includeReplies is false", async () => {
    mockGet
      .mockResolvedValueOnce({
        data: {
          mimeType:
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        },
      })
      .mockResolvedValueOnce({ data: await buildDocxWithThreadedReply() });

    const result = await readCommentsOnDoc({
      authParams: AUTH,
      params: {
        documentId: "doc-id",
        includeReplies: false,
      },
    });

    expect(result.success).toBe(true);
    expect(mockGet.mock.calls[1][0]).toContain("supportsAllDrives=true");
    expect(result.comments).toEqual([
      expect.objectContaining({
        commentId: "0",
        content: "Root comment",
        replies: [],
      }),
    ]);
  });

  it("filters resolved DOCX comments unless includeResolved is true", async () => {
    mockGet
      .mockResolvedValueOnce({
        data: {
          mimeType:
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        },
      })
      .mockResolvedValueOnce({ data: await buildDocxWithThreadedReply() });

    const defaultResult = await readCommentsOnDoc({
      authParams: AUTH,
      params: {
        documentId: "doc-id",
      },
    });

    expect(defaultResult.success).toBe(true);
    expect(defaultResult.comments.map((c) => c.commentId)).toEqual(["0"]);

    jest.clearAllMocks();
    mockGet
      .mockResolvedValueOnce({
        data: {
          mimeType:
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        },
      })
      .mockResolvedValueOnce({ data: await buildDocxWithThreadedReply() });

    const includeResolvedResult = await readCommentsOnDoc({
      authParams: AUTH,
      params: {
        documentId: "doc-id",
        includeResolved: true,
      },
    });

    expect(includeResolvedResult.success).toBe(true);
    expect(includeResolvedResult.comments).toEqual([
      expect.objectContaining({
        commentId: "0",
        resolved: false,
      }),
      expect.objectContaining({
        commentId: "18",
        content: "Resolved comment",
        resolved: true,
      }),
    ]);
  });

  it("encodes Drive comment page tokens", async () => {
    mockGet
      .mockResolvedValueOnce({
        data: { mimeType: "application/vnd.google-apps.document" },
      })
      .mockResolvedValueOnce({
        data: {
          comments: [],
          nextPageToken: "abc+123/==",
        },
      })
      .mockResolvedValueOnce({
        data: {
          comments: [],
        },
      })
      .mockRejectedValueOnce(new Error("DOCX export unavailable in unit test"));

    const result = await readCommentsOnDoc({
      authParams: AUTH,
      params: {
        documentId: "doc-id",
      },
    });

    expect(result.success).toBe(true);
    expect(mockGet.mock.calls[2][0]).toContain("pageToken=abc%2B123%2F%3D%3D");
  });

  it("warns when Drive comment pagination is capped", async () => {
    mockGet.mockResolvedValueOnce({
      data: { mimeType: "application/vnd.google-apps.document" },
    });

    for (let i = 0; i < 100; i++) {
      mockGet.mockResolvedValueOnce({
        data: {
          comments: [
            {
              id: `comment-${i}`,
              content: `Comment ${i}`,
              createdTime: "2026-05-28T03:44:15.852Z",
              modifiedTime: "2026-05-28T03:44:15.852Z",
              resolved: false,
              deleted: false,
              author: { displayName: "Matthew Betancourt" },
              replies: [],
            },
          ],
          nextPageToken: `token-${i}`,
        },
      });
    }

    mockGet.mockResolvedValueOnce({
      data: await buildDocxWithThreadedReply(),
    });

    const result = await readCommentsOnDoc({
      authParams: AUTH,
      params: {
        documentId: "doc-id",
      },
    });

    expect(result.success).toBe(true);
    expect(result.comments).toHaveLength(100);
    expect(result.warnings).toEqual([
      "Comment pagination was capped at 100 pages; some comments may have been omitted.",
    ]);
  });
});
