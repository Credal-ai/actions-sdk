import type {
  AuthParamsType,
  linearGetIssuesFunction,
  linearGetIssuesOutputType,
  linearGetIssuesParamsType,
} from "../../autogen/types";

type IssueNode = {
  id: string;
  title: string;
  url: string;
  dueDate: string | null;
  state: { name: string };
  assignee: { id: string; name: string } | null;
  project: { id: string; name: string } | null;
  team: { id: string; name: string } | null;
  labels: { nodes: Array<{ name: string }> };
  comments: { nodes: Array<{ user: { name: string } | null; body: string }> };
};

type PageInfo = { endCursor: string | null; hasNextPage: boolean };
type IssuesData = { nodes: IssueNode[]; pageInfo: PageInfo };
type VariablesType = { query: string | null; first: number; after: string | null };

type ProcessedIssue = {
  id: string;
  title: string;
  labels: string[];
  state: string;
  assignee: { id: string; name: string } | null;
  due_date: string | null;
  project: { id: string; name: string } | null;
  team: { id: string; name: string } | null;
  url: string;
  comments: Array<{ author_name: string; comment: string }>;
};

const getIssues: linearGetIssuesFunction = async ({
  params,
  authParams,
}: {
  params: linearGetIssuesParamsType;
  authParams: AuthParamsType;
}): Promise<linearGetIssuesOutputType> => {
  const { authToken } = authParams;
  const { query, maxResults } = params;

  if (!authToken) {
    throw new Error("Valid auth token is required to get Linear issues");
  }

  const PAGE_SIZE = 50; // Linear's max per page
  const max = typeof maxResults === "number" && maxResults > 0 ? maxResults : 500;
  let fetched = 0;
  let afterCursor: string | null = null;
  const allIssues: ProcessedIssue[] = [];

  try {
    while (fetched < max) {
      const graphqlQuery = `
        query GetIssues($query: String, $first: Int, $after: String) {
          issues(
            filter: { or: [
              { title: { contains: $query } },
              { description: { contains: $query } }
            ] },
            first: $first,
            after: $after
          ) {
            nodes {
              id
              title
              url
              dueDate
              state {
                name
              }
              assignee {
                id
                name
              }
              project {
                id
                name
              }
              team {
                id
                name
              }
              labels {
                nodes {
                  name
                }
              }
              comments {
                nodes {
                  user {
                    name
                  }
                  body
                }
              }
            }
            pageInfo {
              endCursor
              hasNextPage
            }
          }
        }
      `;

      const variables: VariablesType = {
        query: query || null,
        first: Math.min(PAGE_SIZE, max - fetched),
        after: afterCursor,
      };

      const response = await fetch("https://api.linear.app/graphql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          query: graphqlQuery,
          variables,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error: status: ${response.status}, body: ${errorText}`);
      }

      const data = await response.json();

      if (data.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
      }

      const issuesData: IssuesData | undefined = data.data?.issues;
      if (!issuesData) {
        break;
      }

      const { nodes, pageInfo } = issuesData;
      if (Array.isArray(nodes) && nodes.length > 0) {
        const processedIssues = nodes.map((issue: IssueNode) => {
          const { id, title, url, dueDate, state, assignee, project, team, labels, comments } = issue;
          return {
            id,
            title,
            labels: Array.isArray(labels?.nodes) ? labels.nodes.map(({ name }) => name) : [],
            state: state?.name || "",
            assignee: assignee ? { id: assignee.id, name: assignee.name } : null,
            due_date: dueDate,
            project: project ? { id: project.id, name: project.name } : null,
            team: team ? { id: team.id, name: team.name } : null,
            url,
            comments: Array.isArray(comments?.nodes)
              ? comments.nodes.map(({ user, body }) => ({
                  author_name: user?.name || "Unknown",
                  comment: body,
                }))
              : [],
          };
        });
        allIssues.push(...processedIssues);
        fetched = allIssues.length;
      }

      if (!pageInfo?.hasNextPage || !pageInfo?.endCursor || allIssues.length >= max) {
        break;
      }
      afterCursor = pageInfo.endCursor;
    }

    return {
      success: true,
      results: allIssues.slice(0, max).map(issue => ({
        name: issue.title,
        url: issue.url,
        contents: {
          id: issue.id,
          title: issue.title,
          labels: issue.labels,
          state: issue.state,
          assignee: issue.assignee || undefined,
          due_date: issue.due_date || undefined,
          project: issue.project || undefined,
          team: issue.team || undefined,
          url: issue.url,
          comments: issue.comments,
        },
      })),
    };
  } catch (error) {
    console.error("Error retrieving Linear issues: ", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

export default getIssues;
