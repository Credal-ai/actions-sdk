import type {
  AuthParamsType,
  googleOauthHasGroupMemberFunction,
  googleOauthHasGroupMemberOutputType,
  googleOauthHasGroupMemberParamsType,
} from "../../autogen/types";
import { axiosClient } from "../../util/axiosClient";
import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants";

const hasGroupMember: googleOauthHasGroupMemberFunction = async ({
  params,
  authParams,
}: {
  params: googleOauthHasGroupMemberParamsType;
  authParams: AuthParamsType;
}): Promise<googleOauthHasGroupMemberOutputType> => {
  const { authToken } = authParams;
  const { groupKey, memberKey } = params;
  if (!authToken) {
    return { success: false, isMember: false, error: MISSING_AUTH_TOKEN };
  }
  try {
    const response = await axiosClient.get(
      `https://admin.googleapis.com/admin/directory/v1/groups/${encodeURIComponent(
        groupKey,
      )}/hasMember/${encodeURIComponent(memberKey)}`,
      {
        headers: { Authorization: `Bearer ${authToken}` },
      },
    );
    return {
      success: true,
      isMember: !!response.data.isMember,
    };
  } catch (error) {
    return {
      success: false,
      isMember: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

export default hasGroupMember;
