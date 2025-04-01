import { Client } from "@microsoft/microsoft-graph-client";
import { axiosClient } from "../../util/axiosClient";
import { AuthParamsType } from "../../autogen/types";

export async function getGraphClientForMessageSend(authParams: AuthParamsType): Promise<Client> {
  if (
    !authParams.clientId ||
    !authParams.clientSecret ||
    !authParams.tenantId ||
    !authParams.refreshToken ||
    !authParams.redirectUri
  ) {
    throw new Error("Missing required authentication parameters");
  }

  const url = `https://login.microsoftonline.com/${authParams.tenantId}/oauth2/v2.0/token`;

  const params = new URLSearchParams({
    client_id: authParams.clientId!,
    client_secret: authParams.clientSecret!,
    scope: "offline_access ChannelMessage.Send ChatMessage.Send",
    grant_type: "refresh_token",
    refresh_token: authParams.refreshToken!,
    redirect_uri: authParams.redirectUri!,
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

export async function sendMessage(api_url: string, message: string, authParams: AuthParamsType): Promise<string> {
  const client = await getGraphClientForMessageSend(authParams);
  const response = await client.api(api_url).post({
    body: {
      content: message,
    },
  });
  return response.id;
}
