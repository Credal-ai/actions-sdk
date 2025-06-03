import type {
  AuthParamsType,
  googleOauthListGroupMembersFunction,
  googleOauthListGroupMembersOutputType,
  googleOauthListGroupMembersParamsType,
} from "../../autogen/types";
import { axiosClient } from "../../util/axiosClient";
import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants";

interface GoogleGroupMember {
  id: string;
  email: string;
  role: string;
  type: string;
  [key: string]: unknown;
}

interface GoogleGroupMembersResponse {
  members?: GoogleGroupMember[];
  nextPageToken?: string;
  [key: string]: unknown;
}

const listGroupMembers: googleOauthListGroupMembersFunction = async ({
  params,
  authParams,
}: {
  params: googleOauthListGroupMembersParamsType;
  authParams: AuthParamsType;
}): Promise<googleOauthListGroupMembersOutputType> => {
  const { authToken } = authParams;
  const { groupKey, maxResults } = params;
  if (!authToken) {
    return { success: false, members: [], error: MISSING_AUTH_TOKEN };
  }
  try {
    let members: GoogleGroupMember[] = [];
    let pageToken: string | undefined = undefined;
    const limit = Math.min(maxResults ?? 200, 200);
    while (members.length < limit) {
      const url = new URL(
        `https://admin.googleapis.com/admin/directory/v1/groups/${encodeURIComponent(groupKey)}/members`,
      );
      url.searchParams.set("maxResults", String(limit - members.length));
      if (pageToken) url.searchParams.set("pageToken", pageToken);

      const response = await axiosClient.get(url.toString(), {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const data = response.data as GoogleGroupMembersResponse;
      const batch = (data.members || []).map(({ id, email, role, type }) => ({
        id,
        email,
        role,
        type,
      }));
      members = members.concat(batch);
      pageToken = data.nextPageToken;
      if (!pageToken) break;
    }

    return { success: true, members: members.slice(0, limit) };
  } catch (error) {
    return {
      success: false,
      members: [],
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

export default listGroupMembers;
