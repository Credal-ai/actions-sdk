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

  // Add hashtags parameter if it exists
  if (params.hashtag && params.hashtag.length > 0) {
    queryParams.append("hashtags", params.hashtag.join(","));
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
