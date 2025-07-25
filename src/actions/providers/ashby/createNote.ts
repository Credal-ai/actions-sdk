import type {
  ashbyCreateNoteFunction,
  ashbyCreateNoteOutputType,
  ashbyCreateNoteParamsType,
  AuthParamsType,
} from "../../autogen/types.js";

import { axiosClient } from "../../util/axiosClient.js";
import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants.js";
const createNote: ashbyCreateNoteFunction = async ({
  params,
  authParams,
}: {
  params: ashbyCreateNoteParamsType;
  authParams: AuthParamsType;
}): Promise<ashbyCreateNoteOutputType> => {
  const { candidateId, note } = params;
  const { authToken } = authParams;

  if (!authToken) {
    throw new Error(MISSING_AUTH_TOKEN);
  }

  const response = await axiosClient.post(
    `https://api.ashbyhq.com/candidate.createNote`,
    {
      candidateId,
      note,
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
};

export default createNote;
