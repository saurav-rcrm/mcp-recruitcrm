# Recruit CRM MCP Server

Local `stdio` MCP server for [Recruit CRM](https://recruitcrm.io)'s Public API. Access your candidates, jobs, companies, tasks, meetings, notes, call logs, and more directly from AI tools like Claude and Codex.

## Install

### Option 1: Claude Desktop Extension (Recommended)

1. Download and install [Claude Desktop](https://claude.ai/download), then sign in
2. Download the latest `recruitcrm-mcp-server.mcpb` from the [Releases](https://github.com/saurav-rcrm/mcp-recruitcrm/releases) page
3. Double-click to install, or drag it into Claude Desktop
4. Enter your Recruit CRM API token when prompted (found in Recruit CRM → Admin Settings → API)

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

#### Codex for Mac

In the Codex Mac app:

1. Open **Settings → MCP Servers → Add server**
2. Enter name `recruit_crm`
3. Select **STDIO**
4. Set **Command to launch** to `npx`
5. Add arguments `-y` and `recruitcrm-mcp-server`
6. Add environment variable `RECRUITCRM_API_TOKEN` with your Recruit CRM API token
7. Leave **Environment variable passthrough** empty
8. Leave **Working directory** blank unless you need a custom launch directory, then save

Manual Codex config fallback:

```toml
[mcp_servers.recruit_crm]
command = "npx"
args = ["-y", "recruitcrm-mcp-server"]

[mcp_servers.recruit_crm.env]
RECRUITCRM_API_TOKEN = "<your-api-token>"
```

Codex MCP stdio servers use `command`, `args`, and `env` fields as documented in the [Codex MCP docs](https://developers.openai.com/codex/mcp#stdio-servers).

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

Ownership prompts: when a user says "my", "mine", or "owned by me", treat that as an owner-scoped request where the API supports owner filters. Resolve the Recruit CRM user id via `list_users` when needed, then use `owner_id` on `search_candidates`, `search_jobs`, `search_companies`, `search_contacts`, `search_tasks`, or `search_meetings`. `search_notes`, `search_call_logs`, and `search_hotlists` do not support owner filters; use an owner-scoped upstream search when applicable or explain the limitation.

| Tool | Description |
| --- | --- |
| `search_candidates` | Search candidates and return compact summaries for large result sets. Returns `slug`, which can be used for candidate detail lookup or Recruit CRM app links. Set `include_contact_info: true` to also include `email`, `contact_number`, and `linkedin` on each result (opt-in; off by default). Same flag is available on `list_candidates`. |
| `search_jobs` | Search jobs and return compact summaries for large result sets. Returns job, company, and contact slugs for Recruit CRM app links. |
| `search_companies` | Search companies and return compact summaries for large result sets. Returns company slug and related contact slugs for Recruit CRM app links. |
| `search_contacts` | Search contacts and return compact summaries for large result sets. Requires at least one real filter; `sort_by`, `sort_order`, `page`, `exact_search`, and `include_contact_info` do not count by themselves. Set `include_contact_info: true` to also include `email`, `contact_number`, and `linkedin` on each result (opt-in; off by default). |
| `list_contacts` | List contacts with pagination and sorting only. Use this for unfiltered recent/all-contact requests. Supports the same opt-in `include_contact_info` flag as `search_contacts`. |
| `list_users` | List Recruit CRM users with compact `id`, `first_name`, `last_name`, and `status` fields. Set `include_teams: true` only when team memberships are needed. Set `include_contact_info: true` to also include `email` and `contact_number`. |
| `search_hotlists` | Search hotlists by required `related_to_type` and optional `name` / `shared` filters. Broad searches return compact rows with `related_count` only. When `name` is provided, results also include full `related_slugs`. |
| `create_hotlist` | Create one Recruit CRM hotlist. Requires `created_by` as a Recruit CRM user id and `shared` as `0` or `1`. This is a mutating non-destructive tool; use `add_records_to_hotlist` to add records afterward. |
| `add_records_to_hotlist` | Add up to 10 record slugs to an existing hotlist. This is an additive write tool. It runs sequentially, ignores duplicate input slugs, and returns `{ hotlist_id, requested_count, successful_count, failed_count, added_slugs, errors }` instead of failing the whole batch. |
| `search_tasks` | Search tasks and return compact task summaries with related entity context. |
| `list_task_types` | List compact task type rows with `id` and `label`. Use this before `create_task` to resolve the intended `task_type_id`. |
| `create_task` | Create one Recruit CRM task. Requires `task_type_id`, `title`, `description`, `reminder`, `start_date`, `owner_id`, and `created_by`; supports basic HTML/rich text and returns compact output without the related entity payload. |
| `search_meetings` | Search meetings and return compact meeting summaries with scheduling metadata. |
| `search_notes` | Search notes and return compact note summaries with related entity context. |
| `list_note_types` | List compact note type rows with `id` and `label`. Use this before `create_note` to resolve the intended `note_type_id`. |
| `create_note` | Create one Recruit CRM note. Requires `note_type_id`, `created_by`, related entity slug/type, and `description`; supports basic HTML/rich text and returns compact output without the related entity payload. |
| `search_call_logs` | Search call logs and return compact call summaries with related entity context. |
| `get_candidate_details` | Fetch full details for up to 10 candidates in parallel by slug. Duplicates are deduplicated. Returns `{ requested_count, successful_count, failed_count, candidates, errors }` and does not fail the whole call when one slug is bad. |
| `get_job_details` | Fetch one job by slug and return the raw Recruit CRM payload. |
| `get_company_details` | Fetch full details for up to 10 companies in parallel by slug. Returns `{ requested_count, successful_count, failed_count, companies, errors }` and does not fail the whole call when one slug is bad. |
| `get_contact_details` | Fetch full details for up to 10 contacts in parallel by slug. Returns `{ requested_count, successful_count, failed_count, contacts, errors }` and does not fail the whole call when one slug is bad. |
| `get_job_assigned_candidates` | Fetch assigned candidates for one job and return compact assignment summaries. |
| `list_candidate_hiring_stages` | List compact candidate hiring stage rows to resolve labels such as `Placed` to ids. |
| `get_candidate_job_assignment_hiring_stage_history` | Fetch one candidate's job assignment hiring stage history. |
| `list_candidate_custom_fields` | List curated searchable candidate custom field metadata. |
| `get_candidate_custom_field_details` | Fetch curated details for one candidate custom field, including full option values. |

Most tools are **read-only** (`readOnlyHint: true`). `create_hotlist`, `add_records_to_hotlist`, `create_task`, and `create_note` are mutating tools and should only be used when explicitly requested by the user.

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
- Search and detail tools are read-only by default
- `create_hotlist`, `add_records_to_hotlist`, `create_task`, and `create_note` are additive write tools; this extension still does not expose update or delete operations
- See our full [Privacy Policy](https://recruitcrm.io/legal/privacy/)

## Troubleshooting

**"Server disconnected" or "Failed to spawn process"**
- Make sure Node.js ≥ 20 is installed ([nodejs.org](https://nodejs.org))
- On Mac, use the full path to `npx` (run `which npx` in terminal to find it)
- Use the `.mcpb` install option instead — it doesn't need Node set up

**"Authentication failed" / 401 errors**
- Verify your API token at Recruit CRM → Admin Settings → API
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
