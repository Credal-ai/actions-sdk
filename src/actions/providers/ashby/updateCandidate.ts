import {
  ashbyUpdateCandidateFunction,
  ashbyUpdateCandidateOutputType,
  ashbyUpdateCandidateParamsType,
  AuthParamsType,
} from "../../autogen/types";

import { axiosClient } from "../../util/axiosClient";
const updateCandidate: ashbyUpdateCandidateFunction = async ({
  params,
  authParams,
}: {
  params: ashbyUpdateCandidateParamsType;
  authParams: AuthParamsType;
}): Promise<ashbyUpdateCandidateOutputType> => {
  const { authToken } = authParams;

  if (!authToken) {
    throw new Error("Auth token is required");
  }
  if (!params.candidateId) {
    throw new Error("Candidate ID is required");
  }

  const body: Partial<ashbyUpdateCandidateParamsType> = {
    candidateId: params.candidateId,
  };

  if (params.name !== undefined) body.name = params.name;
  if (params.email !== undefined) body.email = params.email;
  if (params.phoneNumber !== undefined) body.phoneNumber = params.phoneNumber;
  if (params.linkedInUrl !== undefined) body.linkedInUrl = params.linkedInUrl;
  if (params.githubUrl !== undefined) body.githubUrl = params.githubUrl;
  if (params.websiteUrl !== undefined) body.websiteUrl = params.websiteUrl;
  if (params.alternateEmail !== undefined) body.alternateEmail = params.alternateEmail;
  if (params.socialLinks !== undefined) body.socialLinks = params.socialLinks;
  if (params.sourceId !== undefined) body.sourceId = params.sourceId;
  if (params.creditedToUserId !== undefined) body.creditedToUserId = params.creditedToUserId;
  if (params.location !== undefined) body.location = params.location;
  if (params.createdAt !== undefined) body.createdAt = params.createdAt;
  if (params.sendNotifications !== undefined) body.sendNotifications = params.sendNotifications;

  const response = await axiosClient.post(`https://api.ashbyhq.com/candidate.update`, body, {
    auth: {
      username: authToken,
      password: "",
    },
  });
  if (!response.data.success) {
    throw new Error(response.data.errors.join("; "));
  }
};

export default updateCandidate;
