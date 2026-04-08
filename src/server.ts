import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as z from "zod/v4";

import { loadConfig, type AppConfig } from "./config.js";
import { RecruitCrmApiError } from "./errors.js";
import { RecruitCrmClient } from "./recruitcrm/client.js";
import {
  filterCandidateCustomFields,
  mapCandidateCustomFieldDetail,
  mapCandidateCustomFieldSummary,
  validateCustomFieldFilters,
} from "./recruitcrm/custom-fields.js";
import type { HttpTransport } from "./recruitcrm/http.js";
import { mapCandidateDetail, mapSearchCandidatesResult } from "./recruitcrm/mappers.js";
import {
  CUSTOM_FIELD_FILTER_TYPES,
  type CandidateCustomFieldDetail,
  type CandidateCustomFieldListResult,
  type CandidateDetail,
  type SearchCandidatesInput,
  type SearchCandidatesResult,
} from "./recruitcrm/types.js";

const booleanLikeSchema = z
  .union([z.boolean(), z.literal("true"), z.literal("false"), z.literal("1"), z.literal("0"), z.literal(1), z.literal(0)])
  .transform((value) => value === true || value === "true" || value === "1" || value === 1);

const textFilterSchema = z.string().trim().min(1);
const customFieldFilterValueSchema = z.union([z.string().trim().min(1), z.number()]);
const customFieldFilterTypeSchema = z.enum(CUSTOM_FIELD_FILTER_TYPES);

const searchCandidatesInputSchema = {
  page: z.coerce.number().int().min(1).optional().describe("Page number."),
  created_from: textFilterSchema.optional().describe("Created from date."),
  created_to: textFilterSchema.optional().describe("Created to date."),
  email: textFilterSchema.optional().describe("Candidate email."),
  first_name: textFilterSchema.optional().describe("Candidate first name."),
  last_name: textFilterSchema.optional().describe("Candidate last name."),
  linkedin: textFilterSchema.optional().describe("Candidate LinkedIn URL."),
  marked_as_off_limit: booleanLikeSchema.optional().describe("Filter candidates by off-limit status."),
  owner_email: textFilterSchema.optional().describe("Candidate owner email."),
  owner_id: textFilterSchema.optional().describe("Candidate owner id."),
  owner_name: textFilterSchema.optional().describe("Candidate owner name."),
  state: textFilterSchema.optional().describe("Candidate state."),
  updated_from: textFilterSchema.optional().describe("Updated from date."),
  updated_to: textFilterSchema.optional().describe("Updated to date."),
  candidate_slug: textFilterSchema.optional().describe("Candidate slug. Other filters are ignored when provided."),
  contact_number: textFilterSchema.optional().describe("Candidate contact number."),
  country: textFilterSchema.optional().describe("Candidate country."),
  exact_search: booleanLikeSchema.optional().describe("Use exact search instead of partial match."),
  sort_by: z.enum(["createdon", "updatedon"]).optional().describe("Sort field."),
  sort_order: z.enum(["asc", "desc"]).optional().describe("Sort order."),
  custom_fields: z
    .array(
      z.object({
        field_id: z.coerce.number().int().positive().describe("Candidate custom field id."),
        filter_type: customFieldFilterTypeSchema.describe("Custom field filter type."),
        filter_value: customFieldFilterValueSchema.optional().describe("Value for filter types that require it."),
      }),
    )
    .optional()
    .describe("Candidate custom field filters. Use field ids from the metadata tools."),
};

const nullableStringSchema = z.union([z.string(), z.null()]);
const nullableNumberSchema = z.union([z.number(), z.null()]);
const nullableBooleanSchema = z.union([z.boolean(), z.null()]);

const candidateSummarySchema = z.object({
  slug: z.string(),
  first_name: nullableStringSchema,
  last_name: nullableStringSchema,
  position: nullableStringSchema,
  current_organization: nullableStringSchema,
  current_status: nullableStringSchema,
  city: nullableStringSchema,
  updated_on: nullableStringSchema,
});

const searchCandidatesOutputSchema = {
  page: z.number().int().min(1),
  returned_count: z.number().int().min(0),
  has_more: z.boolean(),
  candidates: z.array(candidateSummarySchema),
};

const candidateDetailOutputSchema = {
  slug: z.string(),
  full_name: z.string(),
  email: nullableStringSchema,
  contact_number: nullableStringSchema,
  position: nullableStringSchema,
  current_organization: nullableStringSchema,
  current_status: nullableStringSchema,
  status_label: nullableStringSchema,
  location: nullableStringSchema,
  work_ex_year: nullableNumberSchema,
  relevant_experience: nullableNumberSchema,
  specialization: nullableStringSchema,
  skill: nullableStringSchema,
  language_skills: nullableStringSchema,
  notice_period: nullableNumberSchema,
  available_from: nullableStringSchema,
  willing_to_relocate: nullableBooleanSchema,
  salary: z.object({
    current: nullableStringSchema,
    expectation: nullableStringSchema,
    type: nullableStringSchema,
    currency_id: nullableNumberSchema,
  }),
  linkedin: nullableStringSchema,
  github: nullableStringSchema,
  candidate_summary: nullableStringSchema,
  updated_on: nullableStringSchema,
  owner: z.object({
    id: nullableNumberSchema,
  }),
};

const candidateCustomFieldSummarySchema = z.object({
  field_id: z.number().int().positive(),
  field_name: z.string(),
  field_type: z.string(),
  searchable: z.boolean(),
  supported_filter_types: z.array(customFieldFilterTypeSchema),
  filter_value_required_for: z.array(customFieldFilterTypeSchema),
  option_count: z.number().int().min(0),
  options_preview: z.array(z.string()),
});

const listCandidateCustomFieldsOutputSchema = {
  returned_count: z.number().int().min(0),
  fields: z.array(candidateCustomFieldSummarySchema),
};

const candidateCustomFieldDetailOutputSchema = {
  field_id: z.number().int().positive(),
  field_name: z.string(),
  field_type: z.string(),
  searchable: z.boolean(),
  supported_filter_types: z.array(customFieldFilterTypeSchema),
  filter_value_required_for: z.array(customFieldFilterTypeSchema),
  option_values: z.union([z.array(z.string()), z.null()]),
};

export type ServerDependencies = {
  config?: AppConfig;
  transport?: HttpTransport;
};

export function createRecruitCrmServer(dependencies: ServerDependencies = {}): McpServer {
  const config = dependencies.config ?? loadConfig();
  const client = new RecruitCrmClient(config, dependencies.transport);
  const server = new McpServer({
    name: "Recruit CRM MCP Server",
    version: "0.1.0",
  });

  server.registerTool(
    "search_candidates",
    {
      description: "Search Recruit CRM candidates and return compact summaries without email or phone.",
      inputSchema: searchCandidatesInputSchema,
      outputSchema: searchCandidatesOutputSchema,
      annotations: {
        readOnlyHint: true,
      },
    },
    async (args) => formatResult(await executeSearchCandidates(client, args)),
  );

  server.registerTool(
    "get_candidate_details",
    {
      description: "Fetch one Recruit CRM candidate by slug and return curated details.",
      inputSchema: {
        candidate_slug: textFilterSchema.describe("Candidate slug."),
      },
      outputSchema: candidateDetailOutputSchema,
      annotations: {
        readOnlyHint: true,
      },
    },
    async ({ candidate_slug }) => formatResult(await executeGetCandidateDetails(client, candidate_slug)),
  );

  server.registerTool(
    "list_candidate_custom_fields",
    {
      description: "List candidate custom fields for custom-field search. Returns searchable fields by default.",
      inputSchema: {
        include_non_searchable: booleanLikeSchema
          .optional()
          .describe("Include custom fields that cannot be used in search."),
      },
      outputSchema: listCandidateCustomFieldsOutputSchema,
      annotations: {
        readOnlyHint: true,
      },
    },
    async ({ include_non_searchable }) =>
      formatResult(await executeListCandidateCustomFields(client, include_non_searchable ?? false)),
  );

  server.registerTool(
    "get_candidate_custom_field_details",
    {
      description: "Fetch one candidate custom field by field_id, including all dropdown or multiselect options.",
      inputSchema: {
        field_id: z.coerce.number().int().positive().describe("Candidate custom field id."),
      },
      outputSchema: candidateCustomFieldDetailOutputSchema,
      annotations: {
        readOnlyHint: true,
      },
    },
    async ({ field_id }) => formatResult(await executeGetCandidateCustomFieldDetails(client, field_id)),
  );

  return server;
}

export async function executeSearchCandidates(
  client: RecruitCrmClient,
  args: SearchCandidatesInput,
): Promise<SearchCandidatesResult> {
  if (!args.candidate_slug && args.custom_fields && args.custom_fields.length > 0) {
    const customFields = await client.getCandidateCustomFields();
    validateCustomFieldFilters(args.custom_fields, customFields);
  }

  const result = await client.searchCandidates({
    page: args.page ?? 1,
    created_from: args.created_from,
    created_to: args.created_to,
    email: args.email,
    first_name: args.first_name,
    last_name: args.last_name,
    linkedin: args.linkedin,
    marked_as_off_limit: args.marked_as_off_limit,
    owner_email: args.owner_email,
    owner_id: args.owner_id,
    owner_name: args.owner_name,
    state: args.state,
    updated_from: args.updated_from,
    updated_to: args.updated_to,
    candidate_slug: args.candidate_slug,
    contact_number: args.contact_number,
    country: args.country,
    exact_search: args.exact_search,
    sort_by: args.sort_by ?? "updatedon",
    sort_order: args.sort_order ?? "desc",
    custom_fields: args.custom_fields,
  });

  return mapSearchCandidatesResult(result);
}

export async function executeGetCandidateDetails(
  client: RecruitCrmClient,
  candidateSlug: string,
): Promise<CandidateDetail> {
  const result = await client.searchCandidates({
    candidate_slug: candidateSlug,
    page: 1,
  });

  const candidate = result.data[0];

  if (!candidate) {
    throw new RecruitCrmApiError("Candidate not found.", 404);
  }

  return mapCandidateDetail(candidate);
}

export async function executeListCandidateCustomFields(
  client: RecruitCrmClient,
  includeNonSearchable = false,
): Promise<CandidateCustomFieldListResult> {
  const fields = await client.getCandidateCustomFields();
  const filteredFields = filterCandidateCustomFields(fields, includeNonSearchable);

  return {
    returned_count: filteredFields.length,
    fields: filteredFields.map(mapCandidateCustomFieldSummary),
  };
}

export async function executeGetCandidateCustomFieldDetails(
  client: RecruitCrmClient,
  fieldId: number,
): Promise<CandidateCustomFieldDetail> {
  const fields = await client.getCandidateCustomFields();
  const field = fields.find((item) => item.field_id === fieldId);

  if (!field) {
    throw new RecruitCrmApiError(`Unknown candidate custom field field_id: ${fieldId}.`);
  }

  return mapCandidateCustomFieldDetail(field);
}

function formatResult(
  result: SearchCandidatesResult | CandidateDetail | CandidateCustomFieldListResult | CandidateCustomFieldDetail,
) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(result, null, 2),
      },
    ],
    structuredContent: result,
  };
}
