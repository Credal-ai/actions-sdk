import type { AxiosRequestConfig } from "axios";
import { AxiosError } from "axios";
import type {
  AuthParamsType,
  oktaTriggerOktaWorkflowFunction,
  oktaTriggerOktaWorkflowOutputType,
  oktaTriggerOktaWorkflowParamsType,
} from "../../autogen/types.js";
import { ApiError, axiosClient } from "../../util/axiosClient.js";

const triggerOktaWorkflow: oktaTriggerOktaWorkflowFunction = async ({
  authParams,
  params,
}: {
  authParams: AuthParamsType;
  params: oktaTriggerOktaWorkflowParamsType;
}): Promise<oktaTriggerOktaWorkflowOutputType> => {
  const { authToken, subdomain } = authParams;
  const { workflowId, workflowParameters } = params;

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

    const workflowUrl = `https://${subdomain}.workflows.okta.com/api/flo/${workflowId}/invoke`;
    
    const response = await axiosClient.post(workflowUrl, workflowParameters ?? {}, requestConfig);

    if (response.status >= 200 && response.status < 300) {
      return { success: true, output: response.data };
    } else {
      const errorDetail =
        response.data?.errorSummary || response.data?.message || `Workflow responded with status ${response.status}`;
      return { success: false, error: `Workflow trigger failed: ${errorDetail}` };
    }
  } catch (error) {
    let errorMessage = "Unknown error while triggering workflow";

    if (error instanceof ApiError && error.data) {
      const workflowError = error.data.error;
      errorMessage =
        workflowError + ` Status: ${error.status}`;
    }

    return { success: false, error: errorMessage };
  }
};

export default triggerOktaWorkflow;
