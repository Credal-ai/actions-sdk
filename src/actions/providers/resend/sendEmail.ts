import { Resend } from "resend";
import {
  resendSendEmailFunction,
  resendSendEmailParamsType,
  resendSendEmailOutputType,
  resendSendEmailOutputSchema,
  AuthParamsType,
} from "../../autogen/types";

const sendEmail: resendSendEmailFunction = async ({
  params,
  authParams,
}: {
  params: resendSendEmailParamsType;
  authParams: AuthParamsType;
}): Promise<resendSendEmailOutputType> => {
  try {
    const resend = new Resend(authParams.apiKey);

    
    // Regex to detect + in email addresses before the @ symbol
    const aliasRegex = /[^@]+\+[^@]+@.+/;
    
    if (authParams.emailReplyTo && aliasRegex.test(authParams.emailReplyTo)) {
      return {
        success: false, 
        error: `Email address '${authParams.emailReplyTo}' uses aliasing (+ symbol), which is not permitted`,
      }
    }

    const result = await resend.emails.send({
      from: authParams.emailFrom!,
      replyTo: authParams.emailReplyTo!,
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
