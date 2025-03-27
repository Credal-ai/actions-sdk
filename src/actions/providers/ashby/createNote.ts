import {
  ashbyCreateNoteFunction,
  ashbyCreateNoteOutputType,
  ashbyCreateNoteParamsType,
  AuthParamsType,
} from "../../autogen/types";

import { axiosClient } from "../../util/axiosClient";
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
    throw new Error("Auth token is required");
  }

  await axiosClient.post(
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
};

export default createNote;
