# Recruit CRM MCP Server

Local `stdio` MCP server for [Recruit CRM](https://recruitcrm.io)'s Public API. Access your candidates, jobs, companies, tasks, meetings, notes, and call logs directly from Claude.

Repository: https://github.com/saurav-rcrm/mcp-recruitcrm

## Install

### Option 1: Claude Desktop Extension (Recommended)

1. Download the latest `recruitcrm-mcp-server.mcpb` from the [Releases](https://github.com/saurav-rcrm/mcp-recruitcrm/releases) page
2. Double-click to install, or drag it into Claude Desktop
3. Enter your Recruit CRM API token when prompted (found in Recruit CRM → Settings → API & Integrations)

### Option 2: npm Package (for any MCP client)

```json
{
  "mcpServers": {
    "recruit-crm": {
      "command": "npx",
      "args": ["-y", "recruitcrm-mcp-server"],
      "env": {
        "RECRUITCRM_API_TOKEN": "<your-api-token>"
      }
    }
  }
}
```

> **Mac users:** If you get "Failed to spawn process", use the full path to `npx` (e.g. `/usr/local/bin/npx`) as the `command`.

## Example Prompts

Once installed, try asking Claude:

- "Show me open jobs for Acme Corp"
- "What companies do we have in the fintech space?"
- "What tasks are due this week?"
- "Pull up recent notes on John Smith"
- "Show call logs from last month"
- "Show me Frank's progression across all jobs"
- "How many candidates are in Interview hiring stage for Sales Consultant?"

## Tools

| Tool | Description |
| --- | --- |
| `search_candidates` | Search candidates and return compact summaries for large result sets. Returns `slug`, which can be used for candidate detail lookup or Recruit CRM app links. |
| `search_jobs` | Search jobs and return compact summaries for large result sets. Returns job, company, and contact slugs for Recruit CRM app links. |
| `search_companies` | Search companies and return compact summaries for large result sets. Returns company slug and related contact slugs for Recruit CRM app links. |
| `search_tasks` | Search tasks and return compact task summaries with related entity context. |
| `search_meetings` | Search meetings and return compact meeting summaries with scheduling metadata. |
| `search_notes` | Search notes and return compact note summaries with related entity context. |
| `search_call_logs` | Search call logs and return compact call summaries with related entity context. |
| `get_candidate_details` | Fetch one candidate by slug and return the raw Recruit CRM payload. |
| `get_job_details` | Fetch one job by slug and return the raw Recruit CRM payload. |
| `get_job_assigned_candidates` | Fetch assigned candidates for one job and return compact assignment summaries. |
| `list_candidate_hiring_stages` | List compact candidate hiring stage rows to resolve labels such as `Placed` to ids. |
| `get_candidate_job_assignment_hiring_stage_history` | Fetch one candidate's job assignment hiring stage history. |
| `list_candidate_custom_fields` | List curated searchable candidate custom field metadata. |
| `get_candidate_custom_field_details` | Fetch curated details for one candidate custom field, including full option values. |

All tools are **read-only** (`readOnlyHint: true`). This extension does not modify any data in your Recruit CRM account.

## Open In Recruit CRM

Recruit CRM entities follow the app URL pattern `https://app.recruitcrm.io/<entity>/<slug>`.

| Entity | App Link Pattern |
| --- | --- |
| Candidate | `https://app.recruitcrm.io/candidate/{slug}` |
| Company | `https://app.recruitcrm.io/company/{slug}` |
| Contact | `https://app.recruitcrm.io/contact/{slug}` |
| Job | `https://app.recruitcrm.io/job/{slug}` |
| Deal | `https://app.recruitcrm.io/deal/{slug}` |

## Configuration

### Required

- `RECRUITCRM_API_TOKEN` — your Recruit CRM API token

### Optional

- `RECRUITCRM_BASE_URL` — default: `https://api.recruitcrm.io/v1`
- `RECRUITCRM_TIMEOUT_MS` — default: `10000`
- `RECRUITCRM_DEBUG_SCHEMA_ERRORS` — default: `false`

## Privacy And Security

- Runs **locally** on your machine over `stdio` — no data sent to third parties
- API tokens read from environment variables only; stored securely in OS keychain when using the `.mcpb` extension
- Search results exclude emails, phone numbers, and other sensitive fields by default
- All tools are read-only — no write, update, or delete operations
- See our full [Privacy Policy](https://recruitcrm.io/legal/privacy/)

## Troubleshooting

**"Server disconnected" or "Failed to spawn process"**
- Make sure Node.js ≥ 20 is installed ([nodejs.org](https://nodejs.org))
- On Mac, use the full path to `npx` (run `which npx` in terminal to find it)
- Use the `.mcpb` install option instead — it doesn't need Node set up

**"Authentication failed" / 401 errors**
- Verify your API token at Recruit CRM → Settings → API & Integrations
- Ensure the token has the required permissions for the tools you're using

**Other issues**
- File an issue at [GitHub Issues](https://github.com/saurav-rcrm/mcp-recruitcrm/issues)
- Contact support: [support@recruitcrm.io](mailto:support@recruitcrm.io)

## Local Development

```bash
npm install
npm run build
npm test
```

## License

MIT — see [LICENSE](./LICENSE)
