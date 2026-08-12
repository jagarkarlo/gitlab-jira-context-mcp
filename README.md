# GitLab Jira Context MCP

A local, read-only Model Context Protocol (MCP) server that lets MCP clients retrieve GitLab project and merge-request context alongside Jira issues.

The server uses stdio and runs on your machine. It sends requests only to the GitLab and Jira base URLs that you configure locally.

## Included Tools

| Tool | Description |
| --- | --- |
| `gitlab_list_projects` | List projects visible to the configured GitLab token. |
| `gitlab_get_project` | Get a project by ID or path. |
| `gitlab_list_merge_requests` | List merge requests, optionally for one project. |
| `gitlab_get_merge_request` | Get a merge request and its metadata. |
| `jira_get_my_issues` | List issues assigned to the authenticated Jira user. |
| `jira_get_issue` | Get an issue by key, including comments. |

All tools in this release are read-only.

## Requirements

- Node.js 20 or newer
- An MCP client with stdio server support, such as Visual Studio Code with GitHub Copilot
- A GitLab personal access token with access to the projects you need
- A Jira Server or Data Center personal access token

## Quick Start

1. Clone the repository and install dependencies.

   ```bash
   git clone https://github.com/jagarkarlo/gitlab-jira-context-mcp.git
   cd gitlab-jira-context-mcp
   npm install
   npm test
   npm run build
   ```

2. Create your local configuration.

   ```bash
   cp .env.example .env
   ```

   Set `GITLAB_BASE_URL`, `GITLAB_TOKEN`, `JIRA_BASE_URL`, and `JIRA_API_TOKEN`. Keep `.env` local; it is ignored by Git.

3. Register the compiled server in your MCP client. In VS Code, run `MCP: Open User Configuration` and add this entry to the `servers` object. Replace `/absolute/path/to` with the cloned repository path.

   ```json
   {
     "servers": {
       "gitlab-jira-context": {
         "type": "stdio",
         "command": "node",
         "args": [
           "/absolute/path/to/gitlab-jira-context-mcp/dist/server.js"
         ]
       }
     }
   }
   ```

4. Restart the server from `MCP: List Servers` or reload VS Code.

## Security

- The server reads credentials only from the local `.env` file or process environment.
- Use tokens with the smallest access scope that supports your intended requests.
- Review the configured GitLab and Jira URLs before starting the server.
- Do not place credentials in source files, MCP configuration, issue comments, or commits.

## Development

Run the checks before committing changes:

```bash
npm test
npm run build
git diff --check
```

`src/client.ts` contains the HTTP and response-handling helpers. `src/server.ts` registers the MCP tools and their input schemas. Tests cover the shared client helpers; add focused tests when changing behavior.

## Roadmap

The initial release is intentionally small and read-only. Later releases can add merge-request discussions, project search, or carefully confirmed write operations with dedicated tests and documentation.

## License

This project is licensed under the [MIT License](LICENSE).
