import type {
  AuthParamsType,
  googleOauthAddGroupMemberFunction,
  googleOauthAddGroupMemberOutputType,
  googleOauthAddGroupMemberParamsType,
} from "../../autogen/types";
import { axiosClient } from "../../util/axiosClient";
import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants";

const addGroupMember: googleOauthAddGroupMemberFunction = async ({
  params,
  authParams,
}: {
  params: googleOauthAddGroupMemberParamsType;
  authParams: AuthParamsType;
}): Promise<googleOauthAddGroupMemberOutputType> => {
  const { authToken } = authParams;
  const { groupKey, email } = params;
  if (!authToken) {
    return { success: false, memberID: "", error: MISSING_AUTH_TOKEN };
  }
  try {
    const response = await axiosClient.post(
      `https://admin.googleapis.com/admin/directory/v1/groups/${encodeURIComponent(groupKey)}/members`,
      { email },
      {
        headers: { Authorization: `Bearer ${authToken}` },
      },
    );
    return {
      success: true,
      memberID: response.data.id,
    };
  } catch (error) {
    return {
      success: false,
      memberID: "",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

export default addGroupMember;
