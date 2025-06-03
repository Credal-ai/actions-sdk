import type {
  AuthParamsType,
  googleOauthGetGroupFunction,
  googleOauthGetGroupOutputType,
  googleOauthGetGroupParamsType,
} from "../../autogen/types";
import { axiosClient } from "../../util/axiosClient";
import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants";

const getGroup: googleOauthGetGroupFunction = async ({
  params,
  authParams,
}: {
  params: googleOauthGetGroupParamsType;
  authParams: AuthParamsType;
}): Promise<googleOauthGetGroupOutputType> => {
  const { authToken } = authParams;
  const { groupKey } = params;
  if (!authToken) {
    return { success: false, group: { id: "", email: "", name: "" }, error: MISSING_AUTH_TOKEN };
  }
  try {
    const response = await axiosClient.get(
      `https://admin.googleapis.com/admin/directory/v1/groups/${encodeURIComponent(groupKey)}`,
      {
        headers: { Authorization: `Bearer ${authToken}` },
      },
    );
    const { id, email, name, description } = response.data;
    return {
      success: true,
      group: {
        id,
        email,
        name,
        description,
      },
    };
  } catch (error) {
    return {
      success: false,
      group: { id: "", email: "", name: "" },
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

export default getGroup;
