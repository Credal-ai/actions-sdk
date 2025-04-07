import { Resend } from "resend";
import type {
  resendSendEmailFunction,
  resendSendEmailParamsType,
  resendSendEmailOutputType,
  AuthParamsType,
} from "../../autogen/types";
import { resendSendEmailOutputSchema } from "../../autogen/types";

const sendEmail: resendSendEmailFunction = async ({
  params,
  authParams,
}: {
  params: resendSendEmailParamsType;
  authParams: AuthParamsType;
}): Promise<resendSendEmailOutputType> => {
  try {
    const resend = new Resend(authParams.apiKey);

    const result = await resend.emails.send({
      from: authParams.emailFrom!,
      replyTo: authParams.emailReplyTo!,
      bcc: authParams.emailBcc,
      to: params.to,
      subject: params.subject,
      text: params.content,
    });

    if (result.error) {
      throw new Error(result.error.message);
    }

    return resendSendEmailOutputSchema.parse({
      success: true,
    });
  } catch (error) {
    return resendSendEmailOutputSchema.parse({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export default sendEmail;
