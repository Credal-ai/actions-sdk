export const basicAuthHeader = (credentials: string): string => {
  if (credentials.includes(":")) {
    const encoded = Buffer.from(credentials).toString("base64");
    return `Basic ${encoded}`;
  } else {
    return `Basic ${credentials}`;
  }
};
