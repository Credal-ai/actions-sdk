import type {
  AuthParamsType,
  googleOauthDeleteGroupMemberFunction,
  googleOauthDeleteGroupMemberOutputType,
  googleOauthDeleteGroupMemberParamsType,
} from "../../autogen/types";
import { axiosClient } from "../../util/axiosClient";
import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants";

const deleteGroupMember: googleOauthDeleteGroupMemberFunction = async ({
  params,
  authParams,
}: {
  params: googleOauthDeleteGroupMemberParamsType;
  authParams: AuthParamsType;
}): Promise<googleOauthDeleteGroupMemberOutputType> => {
  const { authToken } = authParams;
  const { groupKey, memberKey } = params;
  if (!authToken) {
    return { success: false, error: MISSING_AUTH_TOKEN };
  }
  try {
    await axiosClient.delete(
      `https://admin.googleapis.com/admin/directory/v1/groups/${encodeURIComponent(
        groupKey,
      )}/members/${encodeURIComponent(memberKey)}`,
      {
        headers: { Authorization: `Bearer ${authToken}` },
      },
    );
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

export default deleteGroupMember;
