import type { AxiosRequestConfig } from "axios";
import { AxiosError } from "axios";
import type {
  AuthParamsType,
  oktaTriggerOktaWorkflowFunction,
  oktaTriggerOktaWorkflowOutputType,
  oktaTriggerOktaWorkflowParamsType,
} from "../../autogen/types.js";
import { axiosClient } from "../../util/axiosClient.js";

const triggerOktaWorkflow: oktaTriggerOktaWorkflowFunction = async ({
  authParams,
  params,
}: {
  authParams: AuthParamsType;
  params: oktaTriggerOktaWorkflowParamsType;
}): Promise<oktaTriggerOktaWorkflowOutputType> => {
  const { authToken, subdomain } = authParams;
  const { httpTriggerCard, workflowParameters } = params;

  if (!authToken || !subdomain) {
    return { success: false, error: "Missing authToken or subdomain in authParams." };
  }

  try {
    const requestConfig: AxiosRequestConfig = {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(authToken && { Authorization: `Bearer ${authToken}` }),
      },
    };

    const workflowUrl = `https://${subdomain}.okta.com/api/flo/https/${httpTriggerCard}`;

    const response = await axiosClient.post(workflowUrl, workflowParameters || {}, requestConfig);

    if (response.status >= 200 && response.status < 300) {
      return { success: true, output: response.data };
    } else {
      const errorDetail =
        response.data?.errorSummary || response.data?.message || `Workflow responded with status ${response.status}`;
      return { success: false, error: `Workflow trigger failed: ${errorDetail}` };
    }
  } catch (error) {
    console.error("Error triggering Okta workflow:", error);
    let errorMessage = "Unknown error while triggering workflow";

    if (error instanceof AxiosError && error.response) {
      const workflowError = error.response.data;
      errorMessage =
        workflowError?.errorSummary ||
        workflowError?.message ||
        `Workflow request failed with status ${error.response.status}`;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    return { success: false, error: errorMessage };
  }
};

export default triggerOktaWorkflow;
