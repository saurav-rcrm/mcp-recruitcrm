# Recruit CRM MCP Server

Local `stdio` MCP server for Recruit CRM's Public API.

Repository: `https://github.com/saurav-rcrm/mcp-recruitcrm`

## What It Does

- `search_candidates`: search candidates and return compact summaries with `slug`, `first_name`, `last_name`, `position`, `current_organization`, `current_status`, `city`, and `updated_on`. This compact shape is intentional because search can return large result sets.
- `search_tasks`: search tasks and return compact summaries with task metadata such as `id`, `title`, `status`, `related_to`, `related_to_type`, `related_to_name`, a compact `related` identity object, reminder fields, owner, and audit timestamps.
- `search_meetings`: search meetings and return compact summaries with meeting metadata such as `id`, `title`, `meeting_type`, schedule fields, reminder fields, related entity identifiers, a compact `related` identity object, and audit timestamps.
- `search_notes`: search notes and return compact summaries with note metadata such as `id`, `note_type`, `description`, related entity identifiers, a compact `related` identity object, and audit timestamps.
- `search_call_logs`: search call logs and return compact summaries with call metadata such as `id`, `call_type`, `custom_call_type`, call timing, phone number, notes, related entity identifiers, a compact `related` identity object, duration, and audit timestamps.
- `get_candidate_details`: fetch one candidate by slug and return the raw Recruit CRM candidate payload
- `list_candidate_custom_fields`: list curated candidate custom field metadata for search. This stays curated because option metadata can be large.
- `get_candidate_custom_field_details`: fetch curated candidate custom field details with full options when relevant

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
