import type { googleOauthReadCommentsOnDocFunction } from "../../autogen/types.js";
import { axiosClient } from "../../util/axiosClient.js";
import { GDRIVE_BASE_URL, readDocComments, matchDocxCommentsToDriveComments } from "../../../utils/google.js";
import type { DocxComment } from "../../../utils/google.js";
import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants.js";

const readCommentsOnDoc: googleOauthReadCommentsOnDocFunction = async ({ authParams, params }) => {
  const { documentId, includeDeleted = false, includeReplies = false, includeResolved = false } = params;

  if (!authParams.authToken) {
    return { success: false, comments: [], error: MISSING_AUTH_TOKEN };
  }

  const token = authParams.authToken;

  try {
    // 1. Get file metadata to check mimeType
    const fileMetaRes = await axiosClient.get(`${GDRIVE_BASE_URL}${encodeURIComponent(documentId)}?fields=mimeType`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const mimeType = fileMetaRes.data.mimeType;
    const isGoogleDoc = mimeType === "application/vnd.google-apps.document";
    const isDocx = mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

    if (!isGoogleDoc && !isDocx) {
      return { success: false, comments: [], error: `Unsupported mimeType: ${mimeType}. Expected Google Doc or DOCX.` };
    }

    if (isDocx) {
      // PATH B: Raw DOCX file uploaded to Google Drive
      const getFileRes = await axiosClient.get(`${GDRIVE_BASE_URL}${encodeURIComponent(documentId)}?alt=media`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "arraybuffer",
      });

      const docxComments = await readDocComments(getFileRes.data, true);

      // If replies are supported, we need to nest them
      const topLevelComments: DocxComment[] = [];
      const repliesMap: Record<
        string,
        Array<{ replyId: string; content: string; createdTime: string; author: { displayName: string } }>
      > = {};

      for (const c of docxComments) {
        if (c.parentId) {
          if (!repliesMap[c.parentId]) repliesMap[c.parentId] = [];
          repliesMap[c.parentId].push({
            replyId: c.id,
            content: c.text,
            createdTime: c.date,
            author: { displayName: c.author },
          });
        } else {
          topLevelComments.push(c);
        }
      }

      const formattedComments = topLevelComments.map(c => ({
        docxCommentId: c.id,
        commentId: c.id,
        anchoredText: c.anchoredText,
        content: c.text,
        author: { displayName: c.author },
        createdTime: c.date,
        modifiedTime: undefined,
        resolved: false,
        deleted: false,
        anchorConfidence: (c.anchoredText ? "exact" : "none") as "exact" | "none",
        inlineObjects: c.inlineObjects,
        replies: includeReplies ? repliesMap[c.id] || [] : [],
        documentPosition: c.documentPosition,
      }));

      // Sort by true top-to-bottom document order, fallback to createdTime
      formattedComments.sort((a, b) => {
        if (a.documentPosition !== undefined && b.documentPosition !== undefined) {
          return a.documentPosition - b.documentPosition;
        }
        return new Date(a.createdTime).getTime() - new Date(b.createdTime).getTime();
      });

      return {
        success: true,
        comments: formattedComments.map(c => ({
          docxCommentId: c.docxCommentId,
          commentId: c.commentId,
          anchoredText: c.anchoredText,
          content: c.content,
          author: c.author,
          createdTime: c.createdTime,
          modifiedTime: c.modifiedTime,
          resolved: c.resolved,
          deleted: c.deleted,
          anchorConfidence: c.anchorConfidence,
          inlineObjects: c.inlineObjects,
          replies: c.replies,
        })),
      };
    } else {
      const fields =
        "nextPageToken,comments(id,content,quotedFileContent,createdTime,modifiedTime,resolved,deleted,author,replies)";
      const MAX_COMMENT_PAGES = 100;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let allComments: any[] = [];
      let pageToken: string | undefined = undefined;
      let pageCount = 0;

      // Fetch authoritative comments from Drive API
      do {
        const url: string = `${GDRIVE_BASE_URL}${encodeURIComponent(documentId)}/comments?fields=${encodeURIComponent(fields)}&includeDeleted=${includeDeleted}&supportsAllDrives=true${pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ""}`;
        const res = await axiosClient.get(url, { headers: { Authorization: `Bearer ${token}` } });

        if (res.data.comments) {
          allComments = allComments.concat(res.data.comments);
        }
        pageToken = res.data.nextPageToken;
        pageCount++;
      } while (pageToken && pageCount < MAX_COMMENT_PAGES);

      // Filter resolved comments if necessary
      if (!includeResolved) {
        allComments = allComments.filter(c => !c.resolved);
      }

      // Format comments and filter replies if needed
      const formattedDriveComments = allComments.map(c => {
        let replies = c.replies || [];
        if (!includeReplies) replies = [];
        return {
          commentId: c.id,
          content: c.content,
          anchoredText: c.quotedFileContent?.value || undefined,
          createdTime: c.createdTime,
          modifiedTime: c.modifiedTime,
          resolved: !!c.resolved,
          deleted: !!c.deleted,
          author: c.author ? { displayName: c.author.displayName, emailAddress: c.author.emailAddress } : undefined,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          replies: replies.map((r: any) => ({
            replyId: r.id,
            content: r.content,
            createdTime: r.createdTime,
            modifiedTime: r.modifiedTime,
            deleted: !!r.deleted,
            action: r.action,
            author: r.author ? { displayName: r.author.displayName, emailAddress: r.author.emailAddress } : undefined,
          })),
        };
      });

      // Try to get precise anchors from exported DOCX
      try {
        const exportRes = await axiosClient.get(
          `${GDRIVE_BASE_URL}${encodeURIComponent(documentId)}/export?mimeType=application/vnd.openxmlformats-officedocument.wordprocessingml.document`,
          {
            headers: { Authorization: `Bearer ${token}` },
            responseType: "arraybuffer",
          },
        );

        const docxComments = await readDocComments(exportRes.data, false);
        const joinedComments = matchDocxCommentsToDriveComments(formattedDriveComments, docxComments);

        // Sort ascending by true document order, fallback to createdTime
        joinedComments.sort((a, b) => {
          if (a.documentPosition !== undefined && b.documentPosition !== undefined) {
            return a.documentPosition - b.documentPosition;
          }
          return new Date(a.createdTime).getTime() - new Date(b.createdTime).getTime();
        });
        const orderedComments = joinedComments.map(c => ({
          docxCommentId: c.docxCommentId,
          commentId: c.commentId,
          anchoredText: c.anchoredText,
          content: c.content,
          author: c.author,
          createdTime: c.createdTime,
          modifiedTime: c.modifiedTime,
          resolved: c.resolved,
          deleted: c.deleted,
          anchorConfidence: c.anchorConfidence,
          inlineObjects: c.inlineObjects,
          replies: c.replies,
        }));

        return { success: true, comments: orderedComments };
      } catch (exportErr) {
        console.warn("Failed to export Google Doc to DOCX for anchor extraction", exportErr);
        // Return without exact anchors if export fails
        const commentsNoAnchors = formattedDriveComments.map(c => ({
          docxCommentId: undefined,
          commentId: c.commentId,
          anchoredText: c.anchoredText,
          content: c.content,
          author: c.author,
          createdTime: c.createdTime,
          modifiedTime: c.modifiedTime,
          resolved: c.resolved,
          deleted: c.deleted,
          anchorConfidence: "none" as const,
          inlineObjects: undefined,
          replies: c.replies,
        }));

        commentsNoAnchors.sort((a, b) => new Date(a.createdTime).getTime() - new Date(b.createdTime).getTime());

        return {
          success: true,
          comments: commentsNoAnchors,
          warnings: ["Could not export DOCX to extract precise text anchors."],
        };
      }
    }
  } catch (err: unknown) {
    console.error("Error reading comments from doc", err);
    return { success: false, comments: [], error: err instanceof Error ? err.message : "Failed to read comments" };
  }
};

export default readCommentsOnDoc;
