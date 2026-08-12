import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { config as loadEnv } from 'dotenv';
import { z } from 'zod';
import {
  fetchGitLab,
  fetchJira,
  requiredEnvironment,
  textResult,
  trimTrailingSlash,
  type ServiceConnection
} from './client.js';

loadEnv();

const gitlab: ServiceConnection = {
  baseUrl: trimTrailingSlash(requiredEnvironment(process.env, 'GITLAB_BASE_URL')),
  token: requiredEnvironment(process.env, 'GITLAB_TOKEN')
};
const jira: ServiceConnection = {
  baseUrl: trimTrailingSlash(requiredEnvironment(process.env, 'JIRA_BASE_URL')),
  token: requiredEnvironment(process.env, 'JIRA_API_TOKEN')
};

const server = new McpServer({
  name: 'gitlab-jira-context',
  version: '0.1.0'
});

server.registerTool(
  'gitlab_list_projects',
  {
    description: 'List GitLab projects visible to the configured token.',
    inputSchema: {
      limit: z.number().int().min(1).max(100).default(20)
    }
  },
  async ({ limit }) =>
    textResult(
      await fetchGitLab(gitlab, `/api/v4/projects?simple=true&membership=true&per_page=${limit}`)
    )
);

server.registerTool(
  'gitlab_get_project',
  {
    description: 'Get a GitLab project by numeric ID or URL-encoded path.',
    inputSchema: { project: z.string().min(1) }
  },
  async ({ project }) =>
    textResult(await fetchGitLab(gitlab, `/api/v4/projects/${encodeURIComponent(project)}`))
);

server.registerTool(
  'gitlab_list_merge_requests',
  {
    description: 'List GitLab merge requests visible to the configured token.',
    inputSchema: {
      project: z.string().min(1).optional(),
      scope: z.enum(['created_by_me', 'assigned_to_me', 'all']).default('created_by_me'),
      state: z.enum(['opened', 'closed', 'locked', 'merged', 'all']).default('all'),
      limit: z.number().int().min(1).max(100).default(20)
    }
  },
  async ({ project, scope, state, limit }) => {
    const query = `scope=${scope}&state=${state}&order_by=updated_at&sort=desc&per_page=${limit}`;
    const path = project
      ? `/api/v4/projects/${encodeURIComponent(project)}/merge_requests?${query}`
      : `/api/v4/merge_requests?${query}`;
    return textResult(await fetchGitLab(gitlab, path));
  }
);

server.registerTool(
  'gitlab_get_merge_request',
  {
    description: 'Get one GitLab merge request and its metadata.',
    inputSchema: {
      project: z.string().min(1),
      mergeRequestIid: z.number().int().positive()
    }
  },
  async ({ project, mergeRequestIid }) =>
    textResult(
      await fetchGitLab(
        gitlab,
        `/api/v4/projects/${encodeURIComponent(project)}/merge_requests/${mergeRequestIid}`
      )
    )
);

server.registerTool(
  'jira_get_my_issues',
  {
    description: 'List Jira issues assigned to the authenticated user.',
    inputSchema: { limit: z.number().int().min(1).max(100).default(20) }
  },
  async ({ limit }) => {
    const jql = encodeURIComponent('assignee = currentUser() ORDER BY updated DESC');
    return textResult(
      await fetchJira(
        jira,
        `/rest/api/2/search?jql=${jql}&maxResults=${limit}&fields=summary,status,assignee,updated,issuetype,priority,project`
      )
    );
  }
);

server.registerTool(
  'jira_get_issue',
  {
    description: 'Get a Jira issue by key, including comments.',
    inputSchema: { issueKey: z.string().min(1) }
  },
  async ({ issueKey }) =>
    textResult(
      await fetchJira(
        jira,
        `/rest/api/2/issue/${encodeURIComponent(issueKey)}?fields=summary,description,status,assignee,reporter,comment,issuetype,priority,project,labels,updated`
      )
    )
);

async function main(): Promise<void> {
  await server.connect(new StdioServerTransport());
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.stack ?? error.message : String(error);
  console.error(message);
  process.exit(1);
});
