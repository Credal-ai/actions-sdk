import { CredalClient } from "@credal/sdk";
import {
  AuthParamsType,
  credalCallCopilotFunction,
  credalCallCopilotOutputType,
  credalCallCopilotParamsType,
} from "../../autogen/types";

const callCopilot: credalCallCopilotFunction = async ({
  params,
  authParams,
}: {
  params: credalCallCopilotParamsType;
  authParams: AuthParamsType;
}): Promise<credalCallCopilotOutputType> => {
  const requestBody = {
    agentId: params.agentId,
    query: params.query,
    userEmail: params.userEmail,
  };

  const baseUrl = authParams.baseUrl ?? "https://app.credal.ai/api";

  const client = new CredalClient({ environment: baseUrl, apiKey: authParams.apiKey });

  const response = await client.copilots.sendMessage({
    agentId: requestBody.agentId,
    message: requestBody.query,
    userEmail: requestBody.userEmail,
  });

  return {
    response:
      response.sendChatResult.type === "ai_response_result"
        ? response.sendChatResult.response.message
        : "Error getting response",
  };
};

export default callCopilot;
