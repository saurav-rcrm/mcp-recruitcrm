# Recruit CRM MCP Server

Local `stdio` MCP server for Recruit CRM's Public API.

Repository: `https://github.com/saurav-rcrm/mcp-recruitcrm`

## What It Does

- `search_candidates`: search candidates and return compact summaries with `slug`, `first_name`, `last_name`, `position`, `current_organization`, `current_status`, `city`, and `updated_on`
- `get_candidate_details`: fetch one candidate by slug and return curated details
- `list_candidate_custom_fields`: list candidate custom fields for custom-field search
- `get_candidate_custom_field_details`: fetch one candidate custom field with full options when relevant

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
- API tokens are read from environment variables only

## Custom Field Flow

Ask the client to resolve a custom field first, then search with its `field_id`. Example: find `Tech Stack`, get `field_id: 34`, then call `search_candidates` with `custom_fields`.
