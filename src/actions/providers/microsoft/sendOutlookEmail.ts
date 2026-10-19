import type {
  AuthParamsType,
  microsoftSendOutlookEmailFunction,
  microsoftSendOutlookEmailParamsType,
  microsoftSendOutlookEmailOutputType,
} from "../../autogen/types.js";

import { getGraphClient } from "./utils.js";

const sendEmail: microsoftSendOutlookEmailFunction = async ({
  params,
  authParams,
}: {
  params: microsoftSendOutlookEmailParamsType;
  authParams: AuthParamsType;
}): Promise<microsoftSendOutlookEmailOutputType> => {
  const { toRecipients, subject, body, ccRecipients, bccRecipients } = params;

  let client = undefined;
  try {
    client = await getGraphClient(authParams);
  } catch (error) {
    return {
      success: false,
      error: "Error while authorizing: " + (error instanceof Error ? error.message : "Unknown error"),
    };
  }

  try {
    const message = {
      message: {
        subject,
        body: {
          contentType: "HTML",
          content: body,
        },
        toRecipients: toRecipients.map(email => ({ emailAddress: { address: email } })),
        ...(ccRecipients && ccRecipients.length > 0
          ? { ccRecipients: ccRecipients.map(email => ({ emailAddress: { address: email } })) }
          : {}),
        ...(bccRecipients && bccRecipients.length > 0
          ? { bccRecipients: bccRecipients.map(email => ({ emailAddress: { address: email } })) }
          : {}),
      },
      saveToSentItems: true,
    };

    await client.api("/me/sendMail").post(message);

    return {
      success: true,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      error: "Error sending email: " + (error instanceof Error ? error.message : "Unknown error"),
    };
  }
};

export default sendEmail;
