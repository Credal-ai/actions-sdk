import { axiosClient } from "../../util/axiosClient.js";
import type {
  AuthParamsType,
  googlemailSendGmailFunction,
  googlemailSendGmailOutputType,
  googlemailSendGmailParamsType,
} from "../../autogen/types.js";
import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants.js";

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

  const { to, cc, bcc, subject, content } = params;

  try {
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

    // Add subject
    message += `Subject: ${subject}\r\n`;
    message += `Content-Type: text/html; charset=utf-8\r\n`;
    message += `\r\n`;
    message += content;

    // Encode the message in base64url format
    const encodedMessage = Buffer.from(message)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    const response = await axiosClient.post(
      "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
      {
        raw: encodedMessage,
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
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error sending email",
    };
  }
};

export default sendGmail;
