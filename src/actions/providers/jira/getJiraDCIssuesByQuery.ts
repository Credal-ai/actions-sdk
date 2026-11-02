import type {
  AuthParamsType,
  jiraDataCenterGetJiraIssuesByQueryOutputType,
  jiraDataCenterGetJiraIssuesByQueryParamsType,
} from "../../autogen/types.js";
import { axiosClient } from "../../util/axiosClient.js";
import { z } from "zod";
import { getErrorMessage, extractPlainText, type JiraADFDoc } from "./utils.js";
import {
  assertJiraReadResponse,
  getJiraIssueFullDetails,
  getJiraNextOffset,
  getJiraReadConfig,
  jiraReadRequestConfig,
  JIRA_READ_PAGE_LIMIT,
  validateJiraSearchIssues,
  validateJiraSearchParameters,
} from "./jiraReadPagination.js";

const DEFAULT_LIMIT = 100;

type JiraUser = {
  accountId: string;
  emailAddress: string;
  displayName: string;
};

type JiraSearchResponse = {
  issues: {
    id: string;
    key: string;
    fields: {
      summary: string;
      description?: JiraADFDoc | string | null;
      project: {
        id: string;
        key: string;
        name: string;
      };
      issuetype: {
        id: string;
        name: string;
      };
      status: {
        id: string;
        name: string;
        statusCategory: {
          name: string;
        };
      };
      assignee?: JiraUser | null;
      reporter?: JiraUser | null;
      creator?: JiraUser | null;
      created: string;
      updated: string;
      resolution?: {
        name: string;
      } | null;
      duedate?: string | null;
      labels?: string[] | null;
    };
  }[];
  startAt: number;
  maxResults: number;
  total: number;
};

const getJiraDCIssuesByQuery = async ({
  params,
  authParams,
  signal,
}: {
  params: jiraDataCenterGetJiraIssuesByQueryParamsType;
  authParams: AuthParamsType;
  signal?: AbortSignal;
}): Promise<jiraDataCenterGetJiraIssuesByQueryOutputType> => {
  const { authToken } = authParams;
  const { query, includeFullDetails } = params;
  const { apiUrl, browseUrl, sourceUrl, strategy } = getJiraReadConfig(authParams);

  if (!authToken) {
    throw new Error("Auth token is required");
  }

  const fields = [
    "key",
    "id",
    "project",
    "issuetype",
    "summary",
    "description",
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

  const searchEndpoint = strategy.getSearchEndpoint();
  const allIssues: JiraSearchResponse["issues"] = [];

  try {
    const requestedLimit = validateJiraSearchParameters(params);
    const initialStartAt = z.coerce
      .number()
      .int()
      .nonnegative()
      .max(Number.MAX_SAFE_INTEGER)
      .parse(params.startAt ?? 0);
    let startAt = initialStartAt;
    let total = 0;
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
      queryParams.set("startAt", String(startAt));
      queryParams.set("fields", fields.join(","));

      const fullApiUrl = `${apiUrl}${searchEndpoint}?${queryParams.toString()}`;

      const response = await axiosClient.get<JiraSearchResponse>(fullApiUrl, jiraReadRequestConfig(authToken, signal));
      signal?.throwIfAborted();
      assertJiraReadResponse(response.data);
      const page = response.data;
      validateJiraSearchIssues(page.issues, maxResults);
      const next = getJiraNextOffset({
        startAt: page.startAt,
        total: page.total,
        expectedStartAt: startAt,
        count: page.issues.length,
      });

      allIssues.push(...page.issues);
      total = page.total;
      startAt = next.nextStartAt;
      isLast = next.isLast;

      if (isLast) {
        break;
      }
    }

    const results = await Promise.all(
      allIssues.map(async issue => {
        const { id, key, fields } = issue;
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

        const ticketUrl = `${browseUrl}/browse/${key}`;
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
            description: typeof description === "string" ? description : extractPlainText(description),
            ...(details ? { details } : {}),
            project: {
              id: project.id,
              key: project.key,
              name: project.name,
            },
            issueType: {
              id: issuetype.id,
              name: issuetype.name,
            },
            status: {
              id: status.id,
              name: status.name,
              category: status.statusCategory.name,
            },
            assignee: assignee
              ? {
                  id: assignee.accountId,
                  name: assignee.displayName,
                  email: assignee.emailAddress,
                }
              : null,
            reporter: reporter
              ? {
                  id: reporter.accountId,
                  name: reporter.displayName,
                  email: reporter.emailAddress,
                }
              : null,
            creator: creator
              ? {
                  id: creator.accountId,
                  name: creator.displayName,
                  email: creator.emailAddress,
                }
              : null,
            created,
            updated,
            resolution: resolution?.name || null,
            dueDate: duedate || null,
            labels: labels ?? [],
            url: ticketUrl,
          },
        };
      }),
    );

    signal?.throwIfAborted();

    return {
      sourceUrl,
      itemsReturned: results.length,
      startAt: initialStartAt,
      total,
      isLast,
      ...(isLast ? {} : { nextStartAt: startAt }),
      results,
    };
  } catch (error: unknown) {
    return {
      results: [],
      error: getErrorMessage(error),
    };
  }
};

export default getJiraDCIssuesByQuery;
