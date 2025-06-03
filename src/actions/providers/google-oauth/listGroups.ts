import type {
  AuthParamsType,
  googleOauthListGroupsFunction,
  googleOauthListGroupsOutputType,
  googleOauthListGroupsParamsType,
} from "../../autogen/types";
import { axiosClient } from "../../util/axiosClient";
import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants";

interface GoogleGroup {
  id: string;
  email: string;
  name: string;
  description?: string;
  [key: string]: unknown;
}

interface GoogleGroupsResponse {
  groups?: GoogleGroup[];
  nextPageToken?: string;
  [key: string]: unknown;
}

const listGroups: googleOauthListGroupsFunction = async ({
  authParams,
  params,
}: {
  params: googleOauthListGroupsParamsType;
  authParams: AuthParamsType;
}): Promise<googleOauthListGroupsOutputType> => {
  const { authToken } = authParams;
  const maxResults = params?.maxResults ?? 200;
  if (!authToken) {
    return { success: false, groups: [], error: MISSING_AUTH_TOKEN };
  }
  try {
    let groups: GoogleGroup[] = [];
    let pageToken: string | undefined = undefined;
    const limit = Math.min(maxResults, 200);
    while (groups.length < limit) {
      const url = new URL("https://admin.googleapis.com/admin/directory/v1/groups");
      url.searchParams.set("customer", "my_customer");
      url.searchParams.set("maxResults", String(limit - groups.length));
      if (pageToken) url.searchParams.set("pageToken", pageToken);

      const response = await axiosClient.get(url.toString(), {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const data = response.data as GoogleGroupsResponse;
      const batch = (data.groups || []).map(({ id, email, name, description }: GoogleGroup) => ({
        id,
        email,
        name,
        description,
      }));
      groups = groups.concat(batch);
      pageToken = data.nextPageToken;
      if (!pageToken) break;
    }

    return { success: true, groups: groups.slice(0, limit) };
  } catch (error) {
    return {
      success: false,
      groups: [],
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

export default listGroups;
