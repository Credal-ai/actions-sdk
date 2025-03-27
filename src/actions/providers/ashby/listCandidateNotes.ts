import {
  ashbyListCandidateNotesFunction,
  ashbyListCandidateNotesOutputType,
  ashbyListCandidateNotesParamsType,
  AuthParamsType,
} from "../../autogen/types";

import { axiosClient } from "../../util/axiosClient";
const listCandidateNotes: ashbyListCandidateNotesFunction = async ({
  params,
  authParams,
}: {
  params: ashbyListCandidateNotesParamsType;
  authParams: AuthParamsType;
}): Promise<ashbyListCandidateNotesOutputType> => {
  const { candidateId } = params;
  const { authToken } = authParams;

  if (!authToken) {
    throw new Error("Auth token is required");
  }

  const response = await axiosClient.post(
    `https://api.ashbyhq.com/candidate.listNotes`,
    {
      candidateId,
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
    notes: response.data.results,
  };
};

export default listCandidateNotes;
