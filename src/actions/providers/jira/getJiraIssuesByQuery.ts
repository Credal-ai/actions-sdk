import type {
  AuthParamsType,
  jiraGetJiraIssuesByQueryFunction,
  jiraGetJiraIssuesByQueryOutputType,
  jiraGetJiraIssuesByQueryParamsType,
} from "../../autogen/types.js";
import { Version3Client, type Version3Models } from "jira.js";
import { getJiraApiConfig, getErrorMessage, extractPlainText, getUserInfoFromAccountId } from "./utils.js";

const DEFAULT_LIMIT = 100;

const getJiraIssuesByQuery: jiraGetJiraIssuesByQueryFunction = async ({
  params,
  authParams,
}: {
  params: jiraGetJiraIssuesByQueryParamsType;
  authParams: AuthParamsType;
}): Promise<jiraGetJiraIssuesByQueryOutputType> => {
  const { authToken, cloudId } = authParams;
  const { query, limit } = params;
  const { browseUrl } = getJiraApiConfig(authParams);

  if (!authToken) throw new Error("Auth token is required");
  if (!browseUrl) throw new Error("Browse URL is required");
  if (!cloudId) throw new Error("Cloud ID is required for Jira Cloud");

  const fields = [
    "summary",
    "description",
    "project",
    "issuetype",
    "status",
    "assignee",
    "reporter",
    "creator",
    "created",
    "updated",
    "resolution",
    "duedate",
    "timeoriginalestimate",
    "timespent",
    "aggregatetimeoriginalestimate",
  ];

  const requestedLimit = limit ?? DEFAULT_LIMIT;
  const allIssues = [];
  let nextPageToken: string | undefined = undefined;

  try {
    // Initialize jira.js client with OAuth 2.0 authentication
    const client = new Version3Client({
      host: `https://api.atlassian.com/ex/jira/${cloudId}`,
      authentication: {
        oauth2: {
          accessToken: authToken,
        },
      },
    });

    // Keep fetching pages until we have all requested issues
    while (allIssues.length < requestedLimit) {
      // Calculate how many results to fetch in this request
      const remainingIssues = requestedLimit - allIssues.length;
      const maxResults = Math.min(remainingIssues, DEFAULT_LIMIT);

      // Use the enhanced search endpoint (recommended)
      const searchResults: Version3Models.SearchAndReconcileResults =
        await client.issueSearch.searchForIssuesUsingJqlEnhancedSearch({
          jql: query,
          nextPageToken,
          maxResults,
          fields,
        });

      if (!searchResults.issues || searchResults.issues.length === 0) {
        break;
      }

      allIssues.push(...searchResults.issues);

      // Check if we've reached the end or have enough results
      if (allIssues.length >= requestedLimit || !searchResults.nextPageToken || searchResults.issues.length === 0) {
        break;
      }

      nextPageToken = searchResults.nextPageToken;
    }

    //console.log('RESPONSE: ', allIssues[0].fields);
    // Map issues with email addresses
    const results = await Promise.all(
      allIssues.map(async ({ id, key, fields }) => {
        const ticketUrl = `${browseUrl}/browse/${key}`;
        const {
          summary,
          description,
          project,
          issuetype,
          status,
          assignee,
          reporter,
          creator,
          created,
          updated,
          resolution,
          duedate,
        } = fields;

        // Fetch user info in parallel
        const [assigneeInfo, reporterInfo, creatorInfo] = await Promise.all([
          getUserInfoFromAccountId(assignee?.accountId, client),
          getUserInfoFromAccountId(reporter?.accountId, client),
          getUserInfoFromAccountId(creator?.accountId, client),
        ]);

        return {
          name: key,
          url: ticketUrl,
          contents: {
            id,
            key,
            summary,
            description: extractPlainText(description),
            project: {
              id: project?.id,
              key: project?.key,
              name: project?.name,
            },
            issueType: {
              id: issuetype?.id,
              name: issuetype?.name,
            },
            status: {
              id: status?.id,
              name: status?.name,
              category: status?.statusCategory?.name,
            },
            assignee: assigneeInfo,
            reporter: reporterInfo,
            creator: creatorInfo,
            created: created,
            updated: updated,
            resolution: resolution?.name,
            dueDate: duedate,
            url: ticketUrl,
          },
        };
      }),
    );

    return { results };
  } catch (error: unknown) {
    console.error("Error retrieving Jira issues:", error);
    return {
      results: [],
      error: getErrorMessage(error),
    };
  }
};

export default getJiraIssuesByQuery;
