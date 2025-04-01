import {
  ashbyAddCandidateToProjectFunction,
  ashbyAddCandidateToProjectOutputType,
  ashbyAddCandidateToProjectParamsType,
  AuthParamsType,
} from "../../autogen/types";

import { axiosClient } from "../../util/axiosClient";
const addCandidateToProject: ashbyAddCandidateToProjectFunction = async ({
  params,
  authParams,
}: {
  params: ashbyAddCandidateToProjectParamsType;
  authParams: AuthParamsType;
}): Promise<ashbyAddCandidateToProjectOutputType> => {
  const { candidateId, projectId } = params;
  const { authToken } = authParams;

  if (!authToken) {
    throw new Error("Auth token is required");
  }

  const response = await axiosClient.post(
    `https://api.ashbyhq.com/candidate.addProject`,
    {
      candidateId,
      projectId,
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

export default addCandidateToProject;
