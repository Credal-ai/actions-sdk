import { Client } from "@microsoft/microsoft-graph-client";
import {
  AuthParamsType,
  microsoftMessageTeamsChatFunction,
  microsoftMessageTeamsChatOutputType,
  microsoftMessageTeamsChatParamsType,
} from "../../autogen/types";
import { axiosClient } from "../../util/axiosClient";

async function getGraphClient(authParams: AuthParamsType): Promise<Client> {
  if (!authParams.clientId || !authParams.clientSecret || !authParams.tenantId) {
    throw new Error("Missing required authentication parameters");
  }

  const url = `https://login.microsoftonline.com/${authParams.tenantId}/oauth2/v2.0/token`;

  const params = new URLSearchParams({
    client_id: authParams.clientId!,
    client_secret: authParams.clientSecret!,
    scope: "https://graph.microsoft.com/.default",
    grant_type: "client_credentials",
  });

  const response = await axiosClient.post(url, params, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

  const accessToken = response.data.access_token;
  return Client.init({
    authProvider: done => {
      done(null, accessToken);
    },
  });
}

const sendMessageToTeamsChat: microsoftMessageTeamsChatFunction = async ({
  params,
  authParams,
}: {
  params: microsoftMessageTeamsChatParamsType;
  authParams: AuthParamsType;
}): Promise<microsoftMessageTeamsChatOutputType> => {
  const { chatId, message } = params;

  if (!chatId) {
    return {
      success: false,
      error: "Chat ID is required to send a message",
    };
  }

  if (!message) {
    return {
      success: false,
      error: "Message content is required to send a message",
    };
  }

  let client;
  try {
    client = await getGraphClient(authParams);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to initialize Graph client",
    };
  }

  const payload = {
    body: {
      content: message,
    },
  };

  try {
    const response = await client.api(`/chats/${chatId}/messages`).post(payload);
    return {
      success: true,
      messageId: response.id,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

export default sendMessageToTeamsChat;
