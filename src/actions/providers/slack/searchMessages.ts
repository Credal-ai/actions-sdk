import { WebClient } from "@slack/web-api";
import type {
  AuthParamsType,
  slackSearchMessagesFunction,
  slackSearchMessagesOutputType,
  slackSearchMessagesParamsType,
} from "../../autogen/types";
import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants";

const searchMessages: slackSearchMessagesFunction = async ({
  params,
  authParams,
}: {
  params: slackSearchMessagesParamsType;
  authParams: AuthParamsType;
}): Promise<slackSearchMessagesOutputType> => {
  if (!authParams.authToken) {
    throw new Error(MISSING_AUTH_TOKEN);
  }

  const client = new WebClient(authParams.authToken);
  const { query } = params;

  try {
    const response = await client.search.messages({ query });

    if (!response.ok) {
      return {
        success: false,
        error: "Slack API search failed",
        results: [],
      };
    }

    const matches =
      response.messages?.matches?.map(msg => ({
        channelId: msg.channel?.id,
        text: msg.text,
        ts: msg.ts,
        user: msg.user,
        permalink: msg.permalink,
      })) || [];

    return {
      success: true,
      error: "",
      results: matches,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
};

export default searchMessages;
