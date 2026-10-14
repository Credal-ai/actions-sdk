import type {
  AuthParamsType,
  jiraGetJiraIssuesByQueryOutputType,
  jiraGetJiraIssuesByQueryParamsType,
} from "../../autogen/types.js";
import { Version3Client } from "jira.js";
import { axiosClient } from "../../util/axiosClient.js";
import { z } from "zod";
import { getErrorMessage, extractPlainText, getUserInfoFromAccountId } from "./utils.js";
import {
  assertJiraReadResponse,
  getJiraIssueFullDetails,
  getJiraReadConfig,
  jiraReadRequestConfig,
  JIRA_READ_PAGE_LIMIT,
  validateJiraSearchIssues,
  validateJiraSearchParameters,
} from "./jiraReadPagination.js";

const DEFAULT_LIMIT = 100;

type JiraCloudSearchResponse = {
  issues: {
    id: string;
    key: string;
    fields: {
      summary: string;
      description?: unknown;
      project: { id: string; key: string; name: string };
      issuetype: { id: string; name: string };
      status: { id: string; name: string; statusCategory: { name: string } };
      assignee?: { accountId: string } | null;
      reporter?: { accountId: string } | null;
      creator?: { accountId: string } | null;
      created: string;
      updated: string;
      resolution?: { name: string } | null;
      duedate?: string | null;
      labels?: string[] | null;
    };
  }[];
  nextPageToken?: string;
  isLast?: boolean;
};

const getJiraIssuesByQuery = async ({
  params,
  authParams,
  signal,
}: {
  params: jiraGetJiraIssuesByQueryParamsType;
  authParams: AuthParamsType;
  signal?: AbortSignal;
}): Promise<jiraGetJiraIssuesByQueryOutputType> => {
  const { authToken, cloudId } = authParams;
  const { query, includeFullDetails, nextPageToken: paramNextPageToken } = params;
  const { apiUrl, browseUrl, sourceUrl } = getJiraReadConfig(authParams);

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
    "labels",
    "timeoriginalestimate",
    "timespent",
    "aggregatetimeoriginalestimate",
  ];

  const allIssues: JiraCloudSearchResponse["issues"] = [];
  let currentNextPageToken: string | undefined = paramNextPageToken;

  const client = new Version3Client({
    host: sourceUrl,
    authentication: { oauth2: { accessToken: authToken } },
    baseRequestConfig: jiraReadRequestConfig(authToken, signal),
  });

  try {
    const requestedLimit = validateJiraSearchParameters(params);
    z.string().min(1).optional().parse(currentNextPageToken);
    const seenTokens = new Set(currentNextPageToken ? [currentNextPageToken] : []);
    let isLast = false;
    let pageNumber = 0;

    while (allIssues.length < requestedLimit) {
      signal?.throwIfAborted();
      if (pageNumber++ >= JIRA_READ_PAGE_LIMIT) {
        throw new Error("Jira search exceeded 100 pages before reaching the requested limit");
      }

      const remainingIssues = requestedLimit - allIssues.length;
      const maxResults = Math.min(remainingIssues, DEFAULT_LIMIT);

      const queryParams = new URLSearchParams();
      queryParams.set("jql", query);
      queryParams.set("maxResults", String(maxResults));
      queryParams.set("fields", fields.join(","));
      if (currentNextPageToken) {
        queryParams.set("nextPageToken", currentNextPageToken);
      }

      const response = await axiosClient.get<JiraCloudSearchResponse>(
        `${apiUrl}/search/jql?${queryParams.toString()}`,
        jiraReadRequestConfig(authToken, signal),
      );

      signal?.throwIfAborted();
      assertJiraReadResponse(response.data);
      const { issues, nextPageToken } = response.data;
      validateJiraSearchIssues(issues, maxResults);
      z.string().min(1).optional().parse(nextPageToken);
      z.boolean().optional().parse(response.data.isLast);

      if (response.data.isLast === false && !nextPageToken) {
        throw new Error("Jira returned an incomplete page without a continuation token");
      }

      if (response.data.isLast === true && nextPageToken) {
        throw new Error("Jira returned a continuation token on the final page");
      }

      if (nextPageToken && seenTokens.has(nextPageToken)) {
        throw new Error("Jira returned a repeated continuation token");
      }

      if (nextPageToken) {
        seenTokens.add(nextPageToken);
      }

      allIssues.push(...issues);
      currentNextPageToken = nextPageToken;
      isLast = !nextPageToken;

      if (isLast) {
        break;
      }
    }

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
          labels,
        } = fields;

        signal?.throwIfAborted();
        const [assigneeInfo, reporterInfo, creatorInfo] = await Promise.all([
          getUserInfoFromAccountId(assignee?.accountId, client),
          getUserInfoFromAccountId(reporter?.accountId, client),
          getUserInfoFromAccountId(creator?.accountId, client),
        ]);

        signal?.throwIfAborted();
        const details = includeFullDetails
          ? await getJiraIssueFullDetails({ apiUrl, authToken, issueId: id, signal })
          : undefined;

        return {
          name: key,
          url: ticketUrl,
          contents: {
            id,
            key,
            summary,
            description: extractPlainText(description),
            ...(details ? { details } : {}),
            project: { id: project?.id, key: project?.key, name: project?.name },
            issueType: { id: issuetype?.id, name: issuetype?.name },
            status: { id: status?.id, name: status?.name, category: status?.statusCategory?.name },
            assignee: assigneeInfo,
            reporter: reporterInfo,
            creator: creatorInfo,
            created,
            updated,
            resolution: resolution?.name,
            dueDate: duedate,
            labels: labels ?? [],
            url: ticketUrl,
          },
        };
      }),
    );

    signal?.throwIfAborted();

    return {
      sourceUrl,
      isLast,
      itemsReturned: allIssues.length,
      ...(currentNextPageToken ? { nextPageToken: currentNextPageToken } : {}),
      results,
    };
  } catch (error: unknown) {
    return { results: [], error: getErrorMessage(error) };
  }
};

export default getJiraIssuesByQuery;
