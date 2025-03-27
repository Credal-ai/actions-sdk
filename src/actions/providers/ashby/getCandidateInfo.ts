import {
  ashbyGetCandidateInfoFunction,
  ashbyGetCandidateInfoOutputType,
  ashbyGetCandidateInfoParamsType,
  AuthParamsType,
} from "../../autogen/types";

import { axiosClient } from "../../util/axiosClient";
const getCandidateInfo: ashbyGetCandidateInfoFunction = async ({
  params,
  authParams,
}: {
  params: ashbyGetCandidateInfoParamsType;
  authParams: AuthParamsType;
}): Promise<ashbyGetCandidateInfoOutputType> => {
  const { candidateId } = params;
  const { authToken } = authParams;

  if (!authToken) {
    throw new Error("Auth token is required");
  }

  const response = await axiosClient.post(
    `https://api.ashbyhq.com/candidate.info`,
    {
      id: candidateId,
    },
    {
      auth: {
        username: authToken,
        password: "",
      },
    },
  );
  return {
    candidate: response.data,
  };
};

export default getCandidateInfo;
