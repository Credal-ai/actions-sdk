import { WebClient } from "@slack/web-api";
import type {
  AuthParamsType,
  slackGetUserProfileFunction,
  slackGetUserProfileOutputType,
  slackGetUserProfileParamsType,
} from "../../autogen/types.js";
import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants.js";

const getUserProfile: slackGetUserProfileFunction = async ({
  params,
  authParams,
}: {
  params: slackGetUserProfileParamsType;
  authParams: AuthParamsType;
}): Promise<slackGetUserProfileOutputType> => {
  if (!authParams.authToken) {
    throw new Error(MISSING_AUTH_TOKEN);
  }

  const { userId: inputUserId, email } = params;
  if (!inputUserId && !email) {
    return { success: false, error: "Either userId or email must be provided" };
  }

  const client = new WebClient(authParams.authToken);

  let userId = inputUserId;
  if (!userId && email) {
    const lookup = await client.users.lookupByEmail({ email });
    if (!lookup.ok || !lookup.user?.id) {
      return { success: false, error: `No Slack user found with email ${email}` };
    }
    userId = lookup.user.id;
  }

  if (!userId) {
    return { success: false, error: "Failed to resolve Slack user ID" };
  }

  const [infoResp, profileResp] = await Promise.all([
    client.users.info({ user: userId }),
    client.users.profile.get({ user: userId }),
  ]);

  if (!infoResp.ok || !infoResp.user) {
    return { success: false, error: `Failed to fetch Slack user info for ${userId}` };
  }
  if (!profileResp.ok || !profileResp.profile) {
    return { success: false, error: `Failed to fetch Slack user profile for ${userId}` };
  }

  const user = infoResp.user;
  const profile = profileResp.profile;

  const fields = (profile as { fields?: Record<string, { label?: string; value?: string; alt?: string }> | null })
    .fields;
  const customFields = fields
    ? Object.entries(fields)
        .filter(([, field]) => field && (field.value ?? "") !== "")
        .map(([fieldId, field]) => ({
          fieldId,
          label: field.label ?? "",
          value: field.value ?? "",
          ...(field.alt ? { alt: field.alt } : {}),
        }))
    : [];

  return {
    success: true,
    userId: user.id ?? userId,
    teamId: user.team_id ?? undefined,
    email: profile.email ?? user.profile?.email ?? undefined,
    realName: profile.real_name ?? user.real_name ?? undefined,
    displayName: profile.display_name ?? user.profile?.display_name ?? user.name ?? undefined,
    firstName: profile.first_name ?? undefined,
    lastName: profile.last_name ?? undefined,
    title: profile.title ?? undefined,
    phone: profile.phone ?? undefined,
    pronouns: profile.pronouns ?? undefined,
    timezone: user.tz ?? undefined,
    statusText: profile.status_text ?? undefined,
    statusEmoji: profile.status_emoji ?? undefined,
    isBot: user.is_bot,
    isAdmin: user.is_admin,
    isOwner: user.is_owner,
    deleted: user.deleted,
    imageUrl: profile.image_512 ?? undefined,
    customFields,
  };
};

export default getUserProfile;
