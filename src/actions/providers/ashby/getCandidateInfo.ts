import type {
  ashbyGetCandidateInfoFunction,
  ashbyGetCandidateInfoOutputType,
  ashbyGetCandidateInfoParamsType,
  AuthParamsType,
} from "../../autogen/types";

import { axiosClient } from "../../util/axiosClient";
import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants";
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
    throw new Error(MISSING_AUTH_TOKEN);
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
  if (!response.data.success) {
    throw new Error(response.data.errors.join("; "));
  }

  return {
    candidate: response.data,
  };
};

export default getCandidateInfo;
