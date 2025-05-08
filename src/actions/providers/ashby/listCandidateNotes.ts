import type {
  ashbyListCandidateNotesFunction,
  ashbyListCandidateNotesOutputType,
  ashbyListCandidateNotesParamsType,
  AuthParamsType,
} from "../../autogen/types";

import { axiosClient } from "../../util/axiosClient";
import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants";
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
    throw new Error(MISSING_AUTH_TOKEN);
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
