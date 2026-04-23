# Claude Context — Recruit CRM MCP Server

Context for AI assistants working on this repo.

## What this is

Local stdio MCP server that wraps the Recruit CRM Public API (https://api.recruitcrm.io/v1). Most tools are read-only for searching and fetching candidates, jobs, companies, contacts, users, hotlists, tasks, meetings, notes, call logs, and hiring stage data. Hotlist create/add tools are explicit mutating exceptions.

- **npm:** `recruitcrm-mcp-server` (published at https://www.npmjs.com/package/recruitcrm-mcp-server)
- **GitHub:** https://github.com/saurav-rcrm/mcp-recruitcrm
- **Owner:** saurav@recruitcrm.io
- **License:** MIT

## Project layout

```
recruitcrm-public-api-mcp/        # main repo (this folder)
  src/
    index.ts                      # stdio entry point
    server.ts                     # tool registration + executors
    config.ts                     # env var loading
    errors.ts                     # RecruitCrmApiError + error mappers
    recruitcrm/
      client.ts                   # HTTP client + Zod schemas for API responses
      http.ts                     # raw node http/https transport
      mappers.ts                  # API payload → compact output shape
      types.ts                    # input/output types
      custom-fields.ts            # custom field validation
  tests/                          # vitest suite
  manifest.json                   # .mcpb manifest for Claude Desktop directory
  icon.png                        # extension icon (512x512)
  release/                        # .mcpb output (gitignored)
  LICENSE                         # MIT

recruitcrm-public-api-mcp-mcpb/   # sibling folder used only for packing .mcpb
                                   # (has prod-only node_modules)
```

## Adding a new tool — checklist

1. **`src/recruitcrm/types.ts`** — add input type (e.g. `ListJobsInput`)
2. **`src/recruitcrm/client.ts`**:
   - Import the new type
   - Add client method (e.g. `async listJobs(...)`) that calls `this.#requestJson(path, schema, request, entity)`
   - Add `buildXxxRequest` helper if params need shaping (or reuse `buildListPaginationRequest` for simple list endpoints)
   - If response schema may come back as `[]` when empty, wrap the schema in `z.union([ originalSchema, z.array(z.unknown()).length(0).transform(...) ])`
3. **`src/server.ts`**:
   - Import the new input type
   - Add zod input schema (e.g. `listJobsInputSchema`)
   - Register tool with `server.registerTool(name, { description, inputSchema, outputSchema, annotations: { readOnlyHint: true } }, handler)`
   - Add `executeXxx(client, args)` function — applies defaults, calls client, runs mapper
4. **`manifest.json`** — add entry to `tools` array
5. **`tests/integration.test.ts`** and **`tests/smoke.test.ts`** — update the tool-names array assertions
6. **Bump version** in `package.json` + `manifest.json` (semver: patch for bug fix, minor for new tool)
7. **Rebuild + repack:**
   ```bash
   npm run build
   cp -R src dist manifest.json package.json ../recruitcrm-public-api-mcp-mcpb/
   cd ../recruitcrm-public-api-mcp-mcpb
   mcpb pack . /Users/saurav/Documents/Projects/recruitcrm-public-api-mcp/release/recruitcrm-mcp-server-<VERSION>.mcpb
   ```

## Tool design conventions

- **Most tools read-only** — search/list/detail tools use `annotations.readOnlyHint: true`
- **Hotlist write tools are explicit exceptions** — `create_hotlist` and `add_records_to_hotlist` use `readOnlyHint: false`, `destructiveHint: false`, `idempotentHint: false`, and `openWorldHint: false`
- **Compact output** — strip email, phone, large nested payloads, logos, social links, etc. from search responses. Full raw payload only from `get_*_details` tools. Candidate/contact search and list tools accept an opt-in `include_contact_info` flag that adds `email`, `contact_number`, and `linkedin` to each result. Default remains off; flag description warns the LLM about PII/size so it isn't flipped on reflexively.
- **Descriptions must steer the LLM** — e.g. `list_candidates` says "Use this for unfiltered 'show recent candidates' requests; use search_candidates when you have filter criteria." This matters because the LLM picks the tool from the description.
- **Tool names ≤ 64 chars** (MCP requirement)
- **Input defaults** — apply in the `executeXxx` wrapper, not the client, so client methods stay thin
- **Unified detail tools** — `get_candidate_details`, `get_company_details`, and `get_contact_details` accept 1-10 slugs and always return batch envelopes with partial-failure `errors`

## Error handling conventions (see `src/errors.ts`)

- `mapHttpError(statusCode, bodyText?, entity?)` — extracts `message`/`error`/`detail`/`errors{}` from API body. Entity-aware 404s (e.g. "Candidate not found").
- `invalidApiResponse(endpoint?, issues?)` — includes endpoint path + Zod issue paths so failures are self-diagnosing.
- `mapFetchError(error)` — timeout/network errors.

If you add new error scenarios, keep the message **specific and actionable for the LLM** — generic messages caused issues in the past.

## Publishing

1. Bump version in `package.json` + `manifest.json`
2. Build, test, repack (see above)
3. Commit via GitHub Desktop → push
4. GitHub release: tag `vX.Y.Z`, attach `.mcpb` from `release/`
5. `npm publish` (requires 2FA token)
6. If submitted to Anthropic directory, may need to notify them of update

## Environment

- `RECRUITCRM_API_TOKEN` (required) — Bearer token
- `RECRUITCRM_BASE_URL` (default `https://api.recruitcrm.io/v1`)
- `RECRUITCRM_TIMEOUT_MS` (default 10000)
- `RECRUITCRM_DEBUG_SCHEMA_ERRORS` (default false) — logs Zod schema mismatches to stderr

## Known API quirks

- Unfiltered search (e.g. `GET /candidates/search` with no filters) is **not supported** — use list endpoints (`GET /candidates`, `/jobs`, `/companies`, `/contacts`) instead. This is why list tools exist separately from their `search_*` counterparts.
- Some endpoints return `[]` when empty instead of `{data: []}` — schemas must handle both via `z.union`.
- `search_call_logs` does not support `related_to_type=job` or `related_to_type=deal`.
- No batch candidate/company/contact detail endpoints on the API — unified `get_*_details` tools wrap up to 10 parallel per-slug calls via `Promise.allSettled` with partial-failure handling. Keep the cap at 10 to stay friendly to rate limits.
- Hotlist member slugs can be large; `search_hotlists` returns full `related_slugs` only when a `name` filter is provided.

## Current version

See `package.json` and `manifest.json` — they must match. Last published: v0.4.0.
