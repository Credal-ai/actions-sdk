import {
  ashbyListCandidatesFunction,
  ashbyListCandidatesOutputType,
  ashbyListCandidatesParamsType,
  AuthParamsType,
} from "../../autogen/types";

import { axiosClient } from "../../util/axiosClient";
const listCandidates: ashbyListCandidatesFunction = async ({
  authParams,
}: {
  params: ashbyListCandidatesParamsType;
  authParams: AuthParamsType;
}): Promise<ashbyListCandidatesOutputType> => {
  const { authToken } = authParams;

  if (!authToken) {
    throw new Error("Auth token is required");
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
