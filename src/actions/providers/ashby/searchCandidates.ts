import type {
  ashbySearchCandidatesFunction,
  ashbySearchCandidatesOutputType,
  ashbySearchCandidatesParamsType,
  AuthParamsType,
} from "../../autogen/types";

import { axiosClient } from "../../util/axiosClient";
import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants";
const searchCandidates: ashbySearchCandidatesFunction = async ({
  params,
  authParams,
}: {
  params: ashbySearchCandidatesParamsType;
  authParams: AuthParamsType;
}): Promise<ashbySearchCandidatesOutputType> => {
  const { email, name } = params;
  const { authToken } = authParams;

  if (!authToken) {
    throw new Error(MISSING_AUTH_TOKEN);
  }

  const response = await axiosClient.post(
    `https://api.ashbyhq.com/candidate.search`,
    {
      email,
      name,
    },
    {
      auth: {
        username: authToken,
        password: "",
      },
    },
  );
  if (!response.data.success) {
    throw new Error(response.data.errors.join("; "));
  }

  return {
    candidates: response.data.results,
  };
};

export default searchCandidates;
