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
