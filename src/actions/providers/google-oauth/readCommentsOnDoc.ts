import type { googleOauthReadCommentsOnDocFunction } from "../../autogen/types.js";
import { axiosClient } from "../../util/axiosClient.js";
import { readDocComments, matchDocxCommentsToDriveComments, type DocxComment } from "../../../utils/google.js";

const GDRIVE_BASE_URL = "https://www.googleapis.com/drive/v3/files/";

const readCommentsOnDoc: googleOauthReadCommentsOnDocFunction = async ({ authParams, params }) => {
  const { documentId, includeDeleted = false, includeReplies = false } = params;

  if (!authParams.authToken) {
    return { success: false, comments: [], error: "Missing OAuth token for Google Drive" };
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

      const docxComments = await readDocComments(getFileRes.data, includeReplies);

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
        commentId: c.id,
        docxCommentId: c.id,
        content: c.text,
        createdTime: c.date,
        anchoredText: c.anchoredText,
        surroundingParagraph: c.surroundingParagraph,
        anchorConfidence: "exact" as const,
        author: { displayName: c.author },
        replies: includeReplies ? repliesMap[c.id] || [] : [],
      }));

      return { success: true, comments: formattedComments };
    } else {
      // PATH A: Native Google Doc
      const fields =
        "nextPageToken,comments(id,content,htmlContent,quotedFileContent,createdTime,modifiedTime,resolved,deleted,author,replies)";
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let allComments: any[] = [];
      let pageToken: string | undefined = undefined;

      // Fetch authoritative comments from Drive API
      do {
        const url: string = `${GDRIVE_BASE_URL}${encodeURIComponent(documentId)}/comments?fields=${encodeURIComponent(fields)}&includeDeleted=${includeDeleted}&supportsAllDrives=true${pageToken ? `&pageToken=${pageToken}` : ""}`;
        const res = await axiosClient.get(url, { headers: { Authorization: `Bearer ${token}` } });

        if (res.data.comments) {
          allComments = allComments.concat(res.data.comments);
        }
        pageToken = res.data.nextPageToken;
      } while (pageToken);

      // Format comments and filter replies if needed
      const formattedDriveComments = allComments.map(c => {
        let replies = c.replies || [];
        if (!includeReplies) replies = [];
        return {
          commentId: c.id,
          content: c.content,
          htmlContent: c.htmlContent,
          quotedFileContent: c.quotedFileContent,
          createdTime: c.createdTime,
          modifiedTime: c.modifiedTime,
          resolved: !!c.resolved,
          deleted: !!c.deleted,
          author: c.author,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          replies: replies.map((r: any) => ({
            replyId: r.id,
            content: r.content,
            htmlContent: r.htmlContent,
            createdTime: r.createdTime,
            modifiedTime: r.modifiedTime,
            deleted: !!r.deleted,
            action: r.action,
            author: r.author,
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

        return { success: true, comments: joinedComments };
      } catch (exportErr) {
        console.warn("Failed to export Google Doc to DOCX for anchor extraction", exportErr);
        // Return without exact anchors if export fails
        const commentsNoAnchors = formattedDriveComments.map(c => ({
          ...c,
          anchorConfidence: "none" as const,
        }));
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
