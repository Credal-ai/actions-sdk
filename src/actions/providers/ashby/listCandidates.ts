import type {
  ashbyListCandidatesFunction,
  ashbyListCandidatesOutputType,
  ashbyListCandidatesParamsType,
  AuthParamsType,
} from "../../autogen/types.js";

import { axiosClient } from "../../util/axiosClient.js";
import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants.js";
const listCandidates: ashbyListCandidatesFunction = async ({
  authParams,
}: {
  params: ashbyListCandidatesParamsType;
  authParams: AuthParamsType;
}): Promise<ashbyListCandidatesOutputType> => {
  const { authToken } = authParams;

  if (!authToken) {
    throw new Error(MISSING_AUTH_TOKEN);
  }

  const response = await axiosClient.post(`https://api.ashbyhq.com/candidate.list`, null, {
    auth: {
      username: authToken,
      password: "",
    },
  });
  if (!response.data.success) {
    throw new Error(response.data.errors.join("; "));
  }

  return {
    candidates: response.data.results,
  };
};

export default listCandidates;
