import { axiosClient } from "../../util/axiosClient.js";
import type {
  AuthParamsType,
  googlemailSendGmailFunction,
  googlemailSendGmailOutputType,
  googlemailSendGmailParamsType,
} from "../../autogen/types.js";
import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants.js";

// Gmail API types
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

const sendGmail: googlemailSendGmailFunction = async ({
  params,
  authParams,
}: {
  params: googlemailSendGmailParamsType;
  authParams: AuthParamsType;
}): Promise<googlemailSendGmailOutputType> => {
  if (!authParams.authToken) {
    return { success: false, error: MISSING_AUTH_TOKEN };
  }

  const { to, cc, bcc, subject, content, threadId } = params;

  try {
    // If replying to a thread, get the original message details
    let inReplyTo = "";
    let references = "";
    let formattedSubject = subject;

    if (threadId) {
      try {
        // Get the thread to find the last message ID and subject
        const threadResponse = await axiosClient.get<GmailThread>(
          `https://gmail.googleapis.com/gmail/v1/users/me/threads/${threadId}`,
          {
            headers: {
              Authorization: `Bearer ${authParams.authToken}`,
            },
          },
        );

        const messages = threadResponse.data.messages;
        if (messages && messages.length > 0) {
          const lastMessage = messages[messages.length - 1];

          // Get the Message-ID header from the last message
          const messageIdHeader = lastMessage.payload.headers?.find(
            (h: GmailHeader) => h.name.toLowerCase() === "message-id",
          );
          if (messageIdHeader) {
            inReplyTo = messageIdHeader.value;
          }

          // Get existing References header or create new one
          const referencesHeader = lastMessage.payload.headers?.find(
            (h: GmailHeader) => h.name.toLowerCase() === "references",
          );
          if (referencesHeader) {
            references = `${referencesHeader.value} ${inReplyTo}`.trim();
          } else {
            references = inReplyTo;
          }

          // Get original subject and format as reply
          const subjectHeader = lastMessage.payload.headers?.find(
            (h: GmailHeader) => h.name.toLowerCase() === "subject",
          );

          // When threadId is provided, ALWAYS use the original thread's subject
          // Ignore the subject parameter completely to ensure proper threading
          if (subjectHeader) {
            const originalSubject = subjectHeader.value;
            formattedSubject = originalSubject.toLowerCase().startsWith("re:")
              ? originalSubject
              : `Re: ${originalSubject}`;
          } else {
            formattedSubject = "Re: (no subject)";
          }
        }
      } catch (threadError) {
        console.warn("Could not fetch thread details for proper reply formatting:", threadError);
        // When threadId is provided but thread fetch fails, still ignore the subject param
        formattedSubject = "Re: (no subject)";
      }
    }

    // Create the email message in RFC 2822 format
    let message = "";

    // Add recipients
    message += `To: ${to.join(", ")}\r\n`;

    // Add CC if provided
    if (cc && cc.length > 0) {
      message += `Cc: ${cc.join(", ")}\r\n`;
    }

    // Add BCC if provided
    if (bcc && bcc.length > 0) {
      message += `Bcc: ${bcc.join(", ")}\r\n`;
    }

    // Add subject (formatted for reply if needed)
    message += `Subject: ${formattedSubject}\r\n`;

    // Add threading headers if replying - CRITICAL for proper threading
    if (threadId && inReplyTo) {
      message += `In-Reply-To: ${inReplyTo}\r\n`;
      if (references) {
        message += `References: ${references}\r\n`;
      }
    }

    message += `Content-Type: text/html; charset=utf-8\r\n`;
    message += `MIME-Version: 1.0\r\n`;
    message += `\r\n`;
    message += content;

    // Encode the message in base64url format
    const encodedMessage = Buffer.from(message)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    const requestBody: { raw: string; threadId?: string } = {
      raw: encodedMessage,
    };

    // IMPORTANT: Include threadId in the request body for proper threading
    if (threadId) {
      requestBody.threadId = threadId;
    }

    const response = await axiosClient.post(
      "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
      requestBody,
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
    };
  } catch (error) {
    console.error("Gmail send error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error sending email",
    };
  }
};

export default sendGmail;
