export async function getOctokit(authToken: string) {
  const { Octokit } = await import("@octokit/core");
  const { restEndpointMethods } = await import("@octokit/plugin-rest-endpoint-methods");
  const MyOctokit = Octokit.plugin(restEndpointMethods);
  return new MyOctokit({ auth: authToken });
}
