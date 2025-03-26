import {
  ashbySearchCandidatesFunction,
  ashbySearchCandidatesOutputType,
  ashbySearchCandidatesParamsType,
  AuthParamsType,
} from "../../autogen/types";

import { axiosClient } from "../../util/axiosClient";
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
    throw new Error("Auth token is required");
  }

  const response = await axiosClient.post(
    `https://api.ashbyhq.com/candidate.search`,
    {
      email: email,
      name: name,
    },
    {
      auth: {
        username: authToken,
        password: "",
      },
    },
  );

  return {
    candidates: response.data.results,
  };
};

export default searchCandidates;
