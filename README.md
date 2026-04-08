# Recruit CRM MCP Server

Local `stdio` MCP server for Recruit CRM's Public API.

Repository: `https://github.com/saurav-rcrm/mcp-recruitcrm`

## What It Does

This server exposes compact Recruit CRM search and lookup tools for MCP clients.

## Tools

| Tool | Description |
| --- | --- |
| `search_candidates` | Search candidates and return compact summaries for large result sets. Returns `slug`, which can be used for candidate detail lookup or Recruit CRM app links. |
| `search_jobs` | Search jobs and return compact summaries for large result sets. Returns job, company, and contact slugs for Recruit CRM app links. |
| `search_companies` | Search companies and return compact summaries for large result sets. Returns company slug and related contact slugs for Recruit CRM app links. |
| `search_tasks` | Search tasks and return compact task summaries with related entity context. Returns `related_to` and `related_to_type` for related entity links. |
| `search_meetings` | Search meetings and return compact meeting summaries with scheduling metadata. Returns `related_to` and `related_to_type` for related entity links. |
| `search_notes` | Search notes and return compact note summaries with related entity context. Returns `related_to` and `related_to_type` for related entity links. |
| `search_call_logs` | Search call logs and return compact call summaries with related entity context. Returns `related_to` and `related_to_type` for related entity links. |
| `get_candidate_details` | Fetch one candidate by slug and return the raw Recruit CRM payload, which may include `resource_url`. |
| `get_job_details` | Fetch one job by slug and return the raw Recruit CRM payload, which may include `resource_url` and `application_form_url`. |
| `get_candidate_job_assignment_hiring_stage_history` | Fetch one candidate's job assignment hiring stage history by slug and return compact entries with job, company, stage, remark, and update metadata. |
| `list_candidate_custom_fields` | List curated searchable candidate custom field metadata. |
| `get_candidate_custom_field_details` | Fetch curated details for one candidate custom field, including full option values when relevant. |

## Open In Recruit CRM

Current live Recruit CRM `resource_url` values use the app path pattern `https://app.recruitcrm.io/<entity>/<slug>`.

| Entity | App Link Pattern | Source Field In MCP Output |
| --- | --- | --- |
| Candidate | `https://app.recruitcrm.io/candidate/{slug}` | `search_candidates.slug` or `get_candidate_details.slug` |
| Company | `https://app.recruitcrm.io/company/{slug}` | `search_companies.slug`, `search_jobs.company_slug`, activity search `related_to` when `related_to_type` is `company`, or `get_candidate_job_assignment_hiring_stage_history.history[].company_slug` |
| Contact | `https://app.recruitcrm.io/contact/{slug}` | `search_companies.contact_slugs[]`, `search_jobs.contact_slug`, or activity search `related_to` when `related_to_type` is `contact` |
| Job | `https://app.recruitcrm.io/job/{slug}` | `search_jobs.slug`, `get_job_details.slug`, activity search `related_to` when `related_to_type` is `job`, or `get_candidate_job_assignment_hiring_stage_history.history[].job_slug` |
| Deal | `https://app.recruitcrm.io/deal/{slug}` | activity search `related_to` when `related_to_type` is `deal` |

## Required Environment Variable

`RECRUITCRM_API_TOKEN`

Optional:

- `RECRUITCRM_BASE_URL` default: `https://api.recruitcrm.io/v1`
- `RECRUITCRM_TIMEOUT_MS` default: `10000`
- `RECRUITCRM_DEBUG_SCHEMA_ERRORS` default: `false`

## Install And Run

Run directly from GitHub with `npx`:

```bash
npx -y github:saurav-rcrm/mcp-recruitcrm
```

## MCP Config Example

```json
{
  "mcpServers": {
    "recruitcrm": {
      "command": "npx",
      "args": ["-y", "github:saurav-rcrm/mcp-recruitcrm"],
      "env": {
        "RECRUITCRM_API_TOKEN": "<your-api-token>"
      }
    }
  }
}
```

## Local Development

```bash
npm install
npm run build
npm test
```

## Privacy And Security

- Runs locally on the user's machine over `stdio`
- No live deployment required
- Search results exclude email and phone by default
- `search_companies` excludes custom fields, social links, logos, `resource_url`, last-meeting metadata, and other large raw fields not needed for compact search output
- `search_jobs` excludes contact emails, phone numbers, and large nested arrays or objects such as job questions, custom fields, collaborator payloads, and feed metadata
- `search_tasks` exposes only a compact `related` identity object from the nested `related` payload and excludes the rest of that payload plus associated entity and collaborator arrays
- `search_meetings` exposes only a compact `related` identity object from the nested `related` payload and excludes the rest of that payload plus attendee, associated entity, and collaborator arrays
- `search_notes` exposes only a compact `related` identity object from the nested `related` payload and excludes the rest of that payload plus associated entity and collaborator arrays
- `search_call_logs` exposes only a compact `related` identity object from the nested `related` payload and excludes the rest of that payload plus associated entity and collaborator arrays
- `search_tasks` treats `created_*` as task created-on range filters, `starting_*` as task due-date range filters, and `updated_*` as task updated-on range filters
- `search_meetings` treats `created_*` as meeting created-on range filters, `starting_*` as meeting start date/time range filters, and `updated_*` as meeting updated-on range filters
- `search_notes` treats `added_*` as note added-on range filters and `updated_*` as note updated-on range filters
- `search_call_logs` treats `starting_*` as call started-on range filters and `updated_*` as call log updated-on range filters
- `search_call_logs` does not support `related_to_type=job` or `related_to_type=deal`; Recruit CRM rejects those filters upstream
- API tokens are read from environment variables only

## Custom Field Flow

Ask the client to resolve a custom field first, then search with its `field_id`. Example: find `Tech Stack`, get `field_id: 34`, then call `search_candidates` with `custom_fields`.

`supported_filter_types` and `filter_value_required_for` are guidance for the model. The MCP server no longer blocks valid-looking searches locally based on the hardcoded field-type matrix, except when a referenced `field_id` does not exist.
