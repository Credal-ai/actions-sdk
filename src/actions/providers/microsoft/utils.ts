import { Client } from "@microsoft/microsoft-graph-client";
import { axiosClient } from "../../util/axiosClient";
import { AuthParamsType } from "../../autogen/types";

export async function getGraphClient(authParams: AuthParamsType, scope: string): Promise<Client> {
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
    scope: `offline_access ${scope}`,
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
