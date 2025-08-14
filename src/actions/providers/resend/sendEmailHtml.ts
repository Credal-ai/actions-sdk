import { Resend } from "resend";
import type {
  resendSendEmailHtmlFunction,
  resendSendEmailHtmlParamsType,
  resendSendEmailHtmlOutputType,
  AuthParamsType,
} from "../../autogen/types.js";
import { resendSendEmailHtmlOutputSchema } from "../../autogen/types.js";

const sendEmailHtml: resendSendEmailHtmlFunction = async ({
  params,
  authParams,
}: {
  params: resendSendEmailHtmlParamsType;
  authParams: AuthParamsType;
}): Promise<resendSendEmailHtmlOutputType> => {
  try {
    const resend = new Resend(authParams.apiKey);

    const result = await resend.emails.send({
      from: authParams.emailFrom!,
      replyTo: authParams.emailReplyTo!,
      bcc: authParams.emailBcc,
      to: params.to,
      subject: params.subject,
      html: params.content,
    });

    if (result.error) {
      throw new Error(result.error.message);
    }

    return resendSendEmailHtmlOutputSchema.parse({
      success: true,
    });
  } catch (error) {
    return resendSendEmailHtmlOutputSchema.parse({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export default sendEmailHtml;
