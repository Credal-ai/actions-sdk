import {
  AuthParamsType,
  xCreateShareXPostUrlFunction,
  xCreateShareXPostUrlParamsType,
  xCreateShareXPostUrlOutputType,
} from "../../autogen/types";

const createXSharePostUrl: xCreateShareXPostUrlFunction = ({
  params,
}: {
  params: xCreateShareXPostUrlParamsType;
  authParams: AuthParamsType;
}): Promise<xCreateShareXPostUrlOutputType> => {
  const baseUrl = "https://twitter.com/intent/tweet";
  const queryParams = new URLSearchParams();

  // Add text parameter (required) with encoding
  if (params.text) {
    queryParams.append("text", params.text + "\n");
  }

  // Add url parameter if it exists
  if (params.url) {
    queryParams.append("url", params.url);
  }

  let hashtags: string[] = [];
  if (typeof params.hashtag == "string") {
    hashtags = [params.hashtag];
  } else if (Array.isArray(params.hashtag)) {
    hashtags = params.hashtag;
  }
  // Add hashtags parameter if it exists
  if (hashtags.length > 0) {
    const cleanedHashtags = hashtags.map(tag => tag.replace(/^#+/, "").trim()).filter(tag => tag.length > 0);

    if (cleanedHashtags.length > 0) {
      queryParams.append("hashtags", cleanedHashtags.join(","));
    }
  }

  // Add via parameter if it exists
  if (params.via) {
    queryParams.append("via", params.via);
  }

  // Add in_reply_to parameter if it exists
  if (params.inReplyTo) {
    queryParams.append("in_reply_to", params.inReplyTo);
  }

  // Build the final URL
  const shareUrl = queryParams.toString() ? `${baseUrl}?${queryParams.toString()}` : baseUrl;

  return Promise.resolve({
    xUrl: shareUrl,
  });
};

export default createXSharePostUrl;
