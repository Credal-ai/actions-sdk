import type {
  AuthParamsType,
  googleOauthCreateGroupFunction,
  googleOauthCreateGroupOutputType,
  googleOauthCreateGroupParamsType,
} from "../../autogen/types";
import { axiosClient } from "../../util/axiosClient";
import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants";

const createGroup: googleOauthCreateGroupFunction = async ({
  params,
  authParams,
}: {
  params: googleOauthCreateGroupParamsType;
  authParams: AuthParamsType;
}): Promise<googleOauthCreateGroupOutputType> => {
  const { authToken } = authParams;
  const { email, name, description } = params;
  if (!authToken) {
    return { success: false, error: MISSING_AUTH_TOKEN };
  }
  try {
    const response = await axiosClient.post(
      "https://admin.googleapis.com/admin/directory/v1/groups",
      { email, name, description },
      {
        headers: { Authorization: `Bearer ${authToken}` },
      },
    );
    const { id: groupId, email: groupEmail } = response.data;
    return {
      success: true,
      groupId,
      groupEmail,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

export default createGroup;
