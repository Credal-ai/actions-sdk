import type { googleOauthReadCommentsOnDocFunction } from "../../autogen/types.js";
import { axiosClient } from "../../util/axiosClient.js";
import { GDRIVE_BASE_URL } from "../../../utils/google.js";
import { readDocComments, matchDocxCommentsToDriveComments } from "../../../utils/docx.js";
import type { DocxComment } from "../../../utils/docx.js";
import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants.js";

const readCommentsOnDoc: googleOauthReadCommentsOnDocFunction = async ({ authParams, params }) => {
  const { documentId, includeDeleted = false, includeReplies = false, includeResolved = false } = params;

  if (!authParams.authToken) {
    return { success: false, comments: [], error: MISSING_AUTH_TOKEN };
  }

  const token = authParams.authToken;

  try {
    // 1. Get file metadata to check mimeType
    const fileMetaRes = await axiosClient.get(
      `${GDRIVE_BASE_URL}${encodeURIComponent(documentId)}?fields=mimeType,size&supportsAllDrives=true`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    const mimeType = fileMetaRes.data.mimeType;
    const isGoogleDoc = mimeType === "application/vnd.google-apps.document";
    const isDocx = mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

    if (!isGoogleDoc && !isDocx) {
      return { success: false, comments: [], error: `Unsupported mimeType: ${mimeType}. Expected Google Doc or DOCX.` };
    }

    const size = fileMetaRes.data.size ? parseInt(fileMetaRes.data.size, 10) : undefined;
    if (size !== undefined && size > 50 * 1024 * 1024) {
      return { success: false, comments: [], error: "File exceeds size limit of 50MB." };
    }

    if (isDocx) {
      // PATH B: Raw DOCX file uploaded to Google Drive
      const getFileRes = await axiosClient.get(
        `${GDRIVE_BASE_URL}${encodeURIComponent(documentId)}?alt=media&supportsAllDrives=true`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: "arraybuffer",
        },
      );

      const buffer = getFileRes.data;
      if (buffer.byteLength > 50 * 1024 * 1024) {
        return { success: false, comments: [], error: "File size exceeds the 50MB limit." };
      }

      const docxComments = await readDocComments(buffer, true);

      // If replies are supported, we need to nest them
      const topLevelComments: DocxComment[] = [];
      const repliesMap: Record<
        string,
        Array<{
          replyId: string;
          content: string;
          createdTime: string;
          modifiedTime: string | undefined;
          deleted: boolean;
          action: string | undefined;
          author: { displayName: string; emailAddress?: string };
        }>
      > = Object.create(null);

      for (const c of docxComments) {
        if (!includeResolved && c.resolved) continue;

        if (c.parentId) {
          if (!repliesMap[c.parentId]) repliesMap[c.parentId] = [];
          repliesMap[c.parentId].push({
            replyId: c.id,
            content: c.text,
            createdTime: c.date,
            modifiedTime: c.date,
            deleted: false,
            action: undefined,
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
        resolved: !!c.resolved,
        deleted: false,
        anchorConfidence: (c.anchoredText ? "exact" : "none") as "exact" | "none",
        inlineObjects: c.inlineObjects,
        replies: includeReplies ? repliesMap[c.id] || [] : [],
        documentPosition: c.documentPosition,
      }));

      // Sort by true top-to-bottom document order, fallback to createdTime
      formattedComments.sort((a, b) => {
        const posA = a.documentPosition;
        const posB = b.documentPosition;
        if (posA !== undefined && posB !== undefined) {
          if (posA !== posB) return posA - posB;
        } else if (posA !== undefined) {
          return -1;
        } else if (posB !== undefined) {
          return 1;
        }
        const timeA = new Date(a.createdTime).getTime();
        const timeB = new Date(b.createdTime).getTime();
        return (isNaN(timeA) ? 0 : timeA) - (isNaN(timeB) ? 0 : timeB);
      });

      const docxWarnings: string[] = [];
      if (includeDeleted) {
        docxWarnings.push("includeDeleted is not supported for native DOCX files and was ignored.");
      }

      return {
        success: true,
        warnings: docxWarnings.length > 0 ? docxWarnings : undefined,
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
      const baseCommentFields = "id,content,quotedFileContent,createdTime,modifiedTime,resolved,deleted,author";
      const fields = `nextPageToken,comments(${baseCommentFields}${includeReplies ? ",replies" : ""})`;
      const MAX_COMMENT_PAGES = 100;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let allComments: any[] = [];
      let pageToken: string | undefined = undefined;
      let pageCount = 0;

      // Fetch authoritative comments from Drive API
      do {
        const url: string = `${GDRIVE_BASE_URL}${encodeURIComponent(documentId)}/comments?fields=${encodeURIComponent(fields)}&includeDeleted=${includeDeleted}&supportsAllDrives=true&pageSize=100${pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ""}`;
        const res = await axiosClient.get(url, { headers: { Authorization: `Bearer ${token}` } });

        if (res.data.comments) {
          allComments = allComments.concat(res.data.comments);
        }
        pageToken = res.data.nextPageToken;
        pageCount++;
      } while (pageToken && pageCount < MAX_COMMENT_PAGES);

      const paginationWarnings: string[] = [];
      if (pageToken && pageCount >= MAX_COMMENT_PAGES) {
        paginationWarnings.push(
          `Comment pagination was capped at ${MAX_COMMENT_PAGES} pages; some comments may have been omitted.`,
        );
      }

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
          content: c.content ?? undefined,
          anchoredText: c.quotedFileContent?.value || undefined,
          createdTime: c.createdTime,
          modifiedTime: c.modifiedTime,
          resolved: !!c.resolved,
          deleted: !!c.deleted,
          author: c.author ? { displayName: c.author.displayName, emailAddress: c.author.emailAddress } : undefined,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          replies: replies.map((r: any) => ({
            replyId: r.id,
            content: r.content ?? undefined,
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
          `${GDRIVE_BASE_URL}${encodeURIComponent(documentId)}/export?mimeType=application/vnd.openxmlformats-officedocument.wordprocessingml.document&supportsAllDrives=true`,
          {
            headers: { Authorization: `Bearer ${token}` },
            responseType: "arraybuffer",
          },
        );

        const buffer = exportRes.data;
        if (buffer.byteLength > 50 * 1024 * 1024) {
          throw new Error("Exported file size exceeds the 50MB limit.");
        }

        let docxComments = await readDocComments(buffer, false);
        if (!includeResolved) {
          docxComments = docxComments.filter(c => !c.resolved);
        }
        const joinedComments = matchDocxCommentsToDriveComments(formattedDriveComments, docxComments);

        // Sort ascending by true document order, fallback to createdTime
        joinedComments.sort((a, b) => {
          const posA = a.documentPosition;
          const posB = b.documentPosition;
          if (posA !== undefined && posB !== undefined) {
            if (posA !== posB) return posA - posB;
          } else if (posA !== undefined) {
            return -1;
          } else if (posB !== undefined) {
            return 1;
          }
          const timeA = new Date(a.createdTime).getTime();
          const timeB = new Date(b.createdTime).getTime();
          return (isNaN(timeA) ? 0 : timeA) - (isNaN(timeB) ? 0 : timeB);
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

        return {
          success: true,
          comments: orderedComments,
          ...(paginationWarnings.length > 0 ? { warnings: paginationWarnings } : {}),
        };
      } catch (exportErr) {
        console.warn(
          "Failed to export Google Doc to DOCX for anchor extraction:",
          exportErr instanceof Error ? exportErr.message : String(exportErr),
        );
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
          warnings: [...paginationWarnings, "Could not export DOCX to extract precise text anchors."],
        };
      }
    }
  } catch (err: unknown) {
    console.error("Error reading comments from doc:", err instanceof Error ? err.message : String(err));
    return { success: false, comments: [], error: err instanceof Error ? err.message : "Failed to read comments" };
  }
};

export default readCommentsOnDoc;
