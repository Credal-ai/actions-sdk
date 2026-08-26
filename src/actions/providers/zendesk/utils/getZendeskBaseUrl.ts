const ZENDESK_SUBDOMAIN_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i;

export const getZendeskBaseUrl = ({ subdomain }: { subdomain: string }): URL => {
  if (!ZENDESK_SUBDOMAIN_PATTERN.test(subdomain)) {
    throw new Error("Invalid Zendesk subdomain");
  }

  return new URL(`https://${subdomain}.zendesk.com/`);
};
