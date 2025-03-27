import {
  ashbyCreateCandidateFunction,
  ashbyCreateCandidateOutputType,
  ashbyCreateCandidateParamsType,
  AuthParamsType,
} from "../../autogen/types";

import { axiosClient } from "../../util/axiosClient";
const createCandidate: ashbyCreateCandidateFunction = async ({
  params,
  authParams,
}: {
  params: ashbyCreateCandidateParamsType;
  authParams: AuthParamsType;
}): Promise<ashbyCreateCandidateOutputType> => {
  const { authToken } = authParams;

  if (!authToken) {
    throw new Error("Auth token is required");
  }
  if (!params.name) {
    throw new Error("Name is required");
  }

  const response = await axiosClient.post(
    `https://api.ashbyhq.com/candidate.create`,
    {
      name: params.name,
      email: params.email,
      phoneNumber: params.phoneNumber,
      linkedInUrl: params.linkedInUrl,
      githubUrl: params.githubUrl,
      website: params.website,
      alternateEmailAddresses: params.alternateEmailAddresses,
      sourceId: params.sourceId,
      creditedToUserId: params.creditedToUserId,
      location: params.location,
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

export default createCandidate;
