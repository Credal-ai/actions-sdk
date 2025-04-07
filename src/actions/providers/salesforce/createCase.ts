import type {
  AuthParamsType,
  salesforceCreateCaseFunction,
  salesforceCreateCaseOutputType,
  salesforceCreateCaseParamsType,
} from "../../autogen/types";
import { axiosClient } from "../../util/axiosClient";

const createCase: salesforceCreateCaseFunction = async ({
  params,
  authParams,
}: {
  params: salesforceCreateCaseParamsType;
  authParams: AuthParamsType;
}): Promise<salesforceCreateCaseOutputType> => {
  const { authToken, baseUrl } = authParams;
  const { subject, description, priority, origin, customFields } = params;

  if (!authToken || !baseUrl) {
    return {
      success: false,
      error: "authToken and baseUrl are required for Salesforce API",
    };
  }

  const url = `${baseUrl}/services/data/v56.0/sobjects/Case`;

  const caseData = {
    Subject: subject,
    Description: description,
    Priority: priority,
    Origin: origin,
    ...customFields, // Include any additional custom fields
  };

  try {
    const response = await axiosClient.post(url, caseData, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
    });

    return {
      success: true,
      caseId: response.data.id,
    };
  } catch (error) {
    console.error("Error creating Salesforce case:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
};

export default createCase;
