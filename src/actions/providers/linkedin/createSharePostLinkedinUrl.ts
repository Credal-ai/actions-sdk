import {
  AuthParamsType,
  linkedinCreateShareLinkedinPostUrlFunction,
  linkedinCreateShareLinkedinPostUrlParamsType,
  linkedinCreateShareLinkedinPostUrlOutputType,
} from "../../autogen/types";

const createShareLinkedinPostUrl: linkedinCreateShareLinkedinPostUrlFunction = ({
  params,
}: {
  params: linkedinCreateShareLinkedinPostUrlParamsType;
  authParams: AuthParamsType;
}): Promise<linkedinCreateShareLinkedinPostUrlOutputType> => {
  const baseUrl = "https://www.linkedin.com/feed/?shareActive=true";
  let shareUrl = baseUrl;

  // Only add text parameter if it exists
  if (params.text) {
    const encodedText = encodeURIComponent(params.text);
    shareUrl += `&text=${encodedText}`;
  }

  // Only add url parameter if it exists
  if (params.url) {
    const encodedUrl = encodeURIComponent(params.url);
    shareUrl += `&shareUrl=${encodedUrl}`;
  }

  return Promise.resolve({
    linkedinUrl: shareUrl,
  });
};

export default createShareLinkedinPostUrl;
