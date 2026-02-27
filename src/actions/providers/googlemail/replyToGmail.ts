import { axiosClient } from "../../util/axiosClient.js";
import type {
  AuthParamsType,
  googlemailReplyToGmailFunction,
  googlemailReplyToGmailOutputType,
  googlemailReplyToGmailParamsType,
} from "../../autogen/types.js";
import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants.js";

interface GmailHeader {
  name: string;
  value: string;
}

interface GmailPayload {
  headers?: GmailHeader[];
}

interface GmailMessage {
  id: string;
  payload: GmailPayload;
}

interface GmailThread {
  id: string;
  messages: GmailMessage[];
}

const replyToGmail: googlemailReplyToGmailFunction = async ({
  params,
  authParams,
}: {
  params: googlemailReplyToGmailParamsType;
  authParams: AuthParamsType;
}): Promise<googlemailReplyToGmailOutputType> => {
  if (!authParams.authToken) {
    return { success: false, error: MISSING_AUTH_TOKEN };
  }

  const { threadId, to, cc, bcc, content } = params;

  try {
    // Fetch the thread to get message details for proper reply headers
    const threadResponse = await axiosClient.get<GmailThread>(
      `https://gmail.googleapis.com/gmail/v1/users/me/threads/${threadId}`,
      {
        headers: {
          Authorization: `Bearer ${authParams.authToken}`,
        },
      },
    );

    const messages = threadResponse.data.messages;
    if (!messages || messages.length === 0) {
      return { success: false, error: "Thread has no messages" };
    }

    const lastMessage = messages[messages.length - 1];
    const getHeader = (name: string): string | undefined =>
      lastMessage.payload.headers?.find((h: GmailHeader) => h.name.toLowerCase() === name.toLowerCase())?.value;

    // Determine recipients - if not provided, reply to the sender of the last message
    let recipients: string[];
    if (to && to.length > 0) {
      recipients = to;
    } else {
      const from = getHeader("From");
      if (!from) {
        return { success: false, error: "Could not determine recipient from thread" };
      }
      recipients = [from];
    }

    // Build threading headers
    const messageId = getHeader("Message-ID") || "";
    const existingReferences = getHeader("References") || "";
    const references = existingReferences ? `${existingReferences} ${messageId}`.trim() : messageId;

    // Derive subject from the thread
    const originalSubject = getHeader("Subject") || "(no subject)";
    const subject = originalSubject.toLowerCase().startsWith("re:") ? originalSubject : `Re: ${originalSubject}`;

    // Build RFC 2822 formatted email
    let message = "";
    message += `To: ${recipients.join(", ")}\r\n`;

    if (cc && cc.length > 0) {
      message += `Cc: ${cc.join(", ")}\r\n`;
    }

    if (bcc && bcc.length > 0) {
      message += `Bcc: ${bcc.join(", ")}\r\n`;
    }

    message += `Subject: ${subject}\r\n`;

    if (messageId) {
      message += `In-Reply-To: ${messageId}\r\n`;
      if (references) {
        message += `References: ${references}\r\n`;
      }
    }

    message += `Content-Type: text/html; charset=utf-8\r\n`;
    message += `MIME-Version: 1.0\r\n`;
    message += `\r\n`;
    message += content;

    // Encode in base64url format
    const encodedMessage = Buffer.from(message)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    const response = await axiosClient.post(
      "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
      {
        raw: encodedMessage,
        threadId: threadId,
      },
      {
        headers: {
          Authorization: `Bearer ${authParams.authToken}`,
          "Content-Type": "application/json",
        },
      },
    );

    return {
      success: true,
      messageId: response.data.id,
      threadId: response.data.threadId,
    };
  } catch (error) {
    console.error("Gmail reply error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error sending reply",
    };
  }
};

export default replyToGmail;
