import { axiosClient } from "../../util/axiosClient.js";
import type {
  AuthParamsType,
  googleOauthReadCommentsOnDocFunction,
  googleOauthReadCommentsOnDocOutputType,
  googleOauthReadCommentsOnDocParamsType,
} from "../../autogen/types.js";
import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants.js";

const readCommentsOnDoc: googleOauthReadCommentsOnDocFunction = async ({
  params,
  authParams,
}: {
  params: googleOauthReadCommentsOnDocParamsType;
  authParams: AuthParamsType;
}): Promise<googleOauthReadCommentsOnDocOutputType> => {
  if (!authParams.authToken) {
    return { success: false, error: MISSING_AUTH_TOKEN, comments: [] };
  }

  const { documentId, pageSize, includeDeleted = false } = params;

  try {
    const url = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(documentId)}/comments`;

    const res = await axiosClient.get(url, {
      headers: {
        Authorization: `Bearer ${authParams.authToken}`,
      },
      params: {
        supportsAllDrives: true,
        pageSize,
        includeDeleted,
        fields:
          "comments(id,content,createdTime,modifiedTime,resolved,quotedFileContent,author(displayName,emailAddress,me),replies(id,content,createdTime,modifiedTime,author(displayName,emailAddress,me))),nextPageToken",
      },
    });

    const comments =
      res.data.comments?.map((c: any) => ({
        commentId: c.commentId,
        content: c.content,
        createdTime: c.createdTime,
        modifiedTime: c.modifiedTime,
        resolved: c.resolved,
        author: c.author
          ? {
              displayName: c.author.displayName,
              emailAddress: c.author.emailAddress,
              me: c.author.me,
            }
          : undefined,
        quotedFileContent: c.quotedFileContent,
        replies:
          c.replies?.map((r: any) => ({
            replyId: r.replyId,
            content: r.content,
            createdTime: r.createdTime,
            modifiedTime: r.modifiedTime,
            author: r.author
              ? {
                  displayName: r.author.displayName,
                  emailAddress: r.author.emailAddress,
                  me: r.author.me,
                }
              : undefined,
          })) ?? [],
      })) ?? [];

    return {
      success: true,
      comments,
      nextPageToken: res.data.nextPageToken,
    };
  } catch (error) {
    console.error("Error reading comments on Google Doc", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      comments: [],
    };
  }
};

export default readCommentsOnDoc;
