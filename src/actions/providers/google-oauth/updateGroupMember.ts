import type {
  AuthParamsType,
  googleOauthUpdateGroupMemberFunction,
  googleOauthUpdateGroupMemberOutputType,
  googleOauthUpdateGroupMemberParamsType,
} from "../../autogen/types";
import { axiosClient } from "../../util/axiosClient";
import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants";

const updateGroupMember: googleOauthUpdateGroupMemberFunction = async ({
  params,
  authParams,
}: {
  params: googleOauthUpdateGroupMemberParamsType;
  authParams: AuthParamsType;
}): Promise<googleOauthUpdateGroupMemberOutputType> => {
  const { authToken } = authParams;
  const { groupKey, memberKey, role } = params;
  if (!authToken) {
    return { success: false, error: MISSING_AUTH_TOKEN };
  }
  try {
    await axiosClient.patch(
      `https://admin.googleapis.com/admin/directory/v1/groups/${encodeURIComponent(groupKey)}/members/${encodeURIComponent(memberKey)}`,
      { role },
      {
        headers: { Authorization: `Bearer ${authToken}` },
      },
    );
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error updating group member",
    };
  }
};

export default updateGroupMember;
