const ZENDESK_SUBDOMAIN_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i;

export const validateZendeskSubdomain = (subdomain: string): void => {
  if (!ZENDESK_SUBDOMAIN_PATTERN.test(subdomain)) {
    throw new Error("Invalid Zendesk subdomain");
  }
};
