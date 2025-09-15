import type {
  AuthParamsType,
  githubSearchOrganizationFunction,
  githubSearchOrganizationOutputType,
  githubSearchOrganizationParamsType,
} from "../../autogen/types.js";
import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants.js";
import { getOctokit } from "./utils.js";

interface SearchCodeResult {
  name: string;
  path: string;
  sha: string;
  url: string;
  score: number;
  textMatches: TextMatch[];
}

interface TextMatch {
  object_url?: string;
  object_type?: string;
  fragment?: string;
  matches: {
    text?: string;
    indices?: number[];
  }[];
}

interface CommitDiffFile {
  filename: string;
  status: string;
  patch?: string;
}

interface SearchCommitResult {
  sha: string;
  url: string;
  commit: {
    message: string;
    author: {
      name: string;
      email: string;
      date: string;
    };
  };
  author?: {
    login: string;
    html_url: string;
  };
  score: number;
  files?: CommitDiffFile[];
}

interface SearchIssueOrPullRequestResult {
  number: number;
  title: string;
  html_url: string;
  state: "open" | "closed";
  isPullRequest: boolean;
  body?: string;
  user: {
    email?: string;
    name?: string;
  };
  score: number;
  files?: CommitDiffFile[];
}

// Limits on the number of results to return
const MAX_CODE_RESULTS = 15;
const MAX_COMMITS = 10;
const MAX_FILES_PER_COMMIT = 5;
const MAX_ISSUES_OR_PRS = 10;
const MAX_FILES_PER_PR = 5;
const MAX_PATCH_LINES = 20;
const MAX_FRAGMENT_LINES = 20;

const searchOrganization: githubSearchOrganizationFunction = async ({
  params,
  authParams,
}: {
  params: githubSearchOrganizationParamsType;
  authParams: AuthParamsType;
}): Promise<githubSearchOrganizationOutputType> => {
  if (!authParams.authToken) {
    throw new Error(MISSING_AUTH_TOKEN);
  }

  const octokit = await getOctokit(authParams.authToken);

  const { organization, query, repository } = params;

  const searchScope = repository ? `repo:${organization}/${repository}` : `org:${organization}`;

  const [codeResultsResponse, commitResults, issueResults] = await Promise.all([
    octokit.rest.search.code({
      q: `${query} in:file,path ${searchScope}`,
      text_match: true,
      headers: {
        accept: "application/vnd.github.v3.text-match+json",
      },
    }),
    octokit.rest.search.commits({
      q: `${query} ${searchScope}`,
      headers: {
        accept: "application/vnd.github.cloak-preview+json",
      },
    }),
    octokit.rest.search.issuesAndPullRequests({
      q: `${query} ${searchScope} (is:issue OR is:pull-request)`,
      advanced_search: "true",
    }),
  ]);

  const codeResults: SearchCodeResult[] = codeResultsResponse.data.items.slice(0, MAX_CODE_RESULTS).map(item => ({
    name: item.name,
    path: item.path,
    sha: item.sha.slice(0, 7),
    url: item.url,
    score: item.score,
    textMatches: item.text_matches
      ? item.text_matches.map(match => ({
        object_url: match.object_url ?? undefined,
        object_type: match.object_type ?? undefined,
        fragment: match.fragment?.split("\n").slice(0, MAX_FRAGMENT_LINES).join("\n"),
        matches: match.matches ?? [],
      }))
      : [],
  }));

  const commitDetailsWithErrors = await Promise.all(
    commitResults.data.items.slice(0, MAX_COMMITS).map(async item => {
      // Get the repo details from the commit search result
      const { owner, name } = item.repository;
      try {
        return await octokit.rest.repos.getCommit({ owner: owner.login, repo: name, ref: item.sha });
      } catch (error) {
        console.error(`Error fetching commit ${item.sha} in ${owner.login}/${name}:`, error);
        return null;
      }
    }),
  );

  const commitDetails = commitDetailsWithErrors.filter(c => c !== null);

  const enrichedCommits: SearchCommitResult[] = commitResults.data.items.slice(0, MAX_COMMITS).map(item => {
    const full = commitDetails.find(c => c.data.sha === item.sha);
    return {
      sha: item.sha,
      url: item.url,
      commit: {
        message: item.commit.message,
        author: item.commit.author,
      },
      score: item.score,
      author: item.author ?? undefined,
      files:
        full?.data.files?.slice(0, MAX_FILES_PER_COMMIT).map(f => ({
          filename: f.filename,
          status: f.status,
          patch: f.patch?.split("\n").slice(0, MAX_PATCH_LINES).join("\n"),
        })) || [],
    };
  });

  const prItems = issueResults.data.items.filter(item => item.pull_request).slice(0, MAX_ISSUES_OR_PRS);
  const prNumbers: number[] = prItems.map(item => item.number);

  const prFiles = await Promise.all(
    prItems.map(async item => {
      // Each item has a 'repository_url' like: "https://api.github.com/repos/ORG/REPO"
      const repoUrlParts = item.repository_url.split("/");
      const repo = repository ?? repoUrlParts[repoUrlParts.length - 1];
      try {
        return await octokit.rest.pulls.listFiles({ owner: organization, repo: repo, pull_number: item.number });
      } catch (error) {
        console.error(`Error fetching PR files for PR ${item.number} in ${organization}/${repo}:`, error);
        return { data: [] };
      }
    }),
  );

  const issuesAndPRs: SearchIssueOrPullRequestResult[] = issueResults.data.items
    .slice(0, MAX_ISSUES_OR_PRS)
    .map(item => {
      const isPR = !!item.pull_request;
      const prIndex = prNumbers.indexOf(item.number);
      const files =
        isPR && prIndex !== -1
          ? prFiles[prIndex].data.slice(0, MAX_FILES_PER_PR).map(f => ({
            filename: f.filename,
            status: f.status,
            patch: f.patch?.split("\n").slice(0, MAX_PATCH_LINES).join("\n"),
          }))
          : undefined;

      return {
        number: item.number,
        title: item.title,
        html_url: item.html_url,
        state: item.state as "open" | "closed",
        isPullRequest: isPR,
        body: item.body,
        user: {
          email: item.user?.email ?? undefined,
          name: item.user?.name ?? undefined,
        },
        score: item.score,
        files,
      };
    });

  return {
    code: codeResults,
    commits: enrichedCommits,
    issuesAndPullRequests: issuesAndPRs,
  };
};

export default searchOrganization;
