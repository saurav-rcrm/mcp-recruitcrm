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
import {
  mapSearchCallLogsResult,
  mapSearchCandidatesResult,
  mapSearchMeetingsResult,
  mapSearchNotesResult,
  mapSearchTasksResult,
} from "./recruitcrm/mappers.js";
import {
  type SearchCallLogsInput,
  type SearchCallLogsResult,
  CUSTOM_FIELD_FILTER_TYPES,
  type CandidateCustomFieldDetail,
  type CandidateCustomFieldListResult,
  type CandidateDetail,
  type SearchCandidatesInput,
  type SearchMeetingsInput,
  type SearchMeetingsResult,
  type SearchNotesInput,
  type SearchNotesResult,
  type SearchCandidatesResult,
  type SearchTasksInput,
  type SearchTasksResult,
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

const searchTasksInputSchema = {
  page: z.coerce.number().int().min(1).optional().describe("Page number."),
  created_from: textFilterSchema.optional().describe("Task created-on date range start."),
  created_to: textFilterSchema.optional().describe("Task created-on date range end."),
  owner_email: textFilterSchema.optional().describe("Task owner email."),
  owner_id: textFilterSchema.optional().describe("Task owner id."),
  owner_name: textFilterSchema.optional().describe("Task owner name."),
  related_to: textFilterSchema.optional().describe("Related entity slug or id. Must be used with related_to_type."),
  related_to_type: textFilterSchema.optional().describe("Related entity type. Must be used with related_to."),
  starting_from: textFilterSchema.optional().describe("Task due-date range start."),
  starting_to: textFilterSchema.optional().describe("Task due-date range end."),
  title: textFilterSchema.optional().describe("Task title."),
  updated_from: textFilterSchema.optional().describe("Task updated-on date range start."),
  updated_to: textFilterSchema.optional().describe("Task updated-on date range end."),
};

const searchMeetingsInputSchema = {
  page: z.coerce.number().int().min(1).optional().describe("Page number."),
  created_from: textFilterSchema.optional().describe("Meeting created-on date range start."),
  created_to: textFilterSchema.optional().describe("Meeting created-on date range end."),
  owner_email: textFilterSchema.optional().describe("Meeting owner email."),
  owner_id: textFilterSchema.optional().describe("Meeting owner id."),
  owner_name: textFilterSchema.optional().describe("Meeting owner name."),
  related_to: textFilterSchema.optional().describe("Related entity slug or id. Must be used with related_to_type."),
  related_to_type: textFilterSchema.optional().describe("Related entity type. Must be used with related_to."),
  starting_from: textFilterSchema.optional().describe("Meeting start date/time range start."),
  starting_to: textFilterSchema.optional().describe("Meeting start date/time range end."),
  title: textFilterSchema.optional().describe("Meeting title."),
  updated_from: textFilterSchema.optional().describe("Meeting updated-on date range start."),
  updated_to: textFilterSchema.optional().describe("Meeting updated-on date range end."),
};

const searchNotesInputSchema = {
  page: z.coerce.number().int().min(1).optional().describe("Page number."),
  added_from: textFilterSchema.optional().describe("Note added-on date range start."),
  added_to: textFilterSchema.optional().describe("Note added-on date range end."),
  related_to: textFilterSchema.optional().describe("Related entity slug. Must be used with related_to_type."),
  related_to_type: textFilterSchema.optional().describe("Related entity type. Must be used with related_to."),
  updated_from: textFilterSchema.optional().describe("Note updated-on date range start."),
  updated_to: textFilterSchema.optional().describe("Note updated-on date range end."),
};

const searchCallLogsInputSchema = {
  page: z.coerce.number().int().min(1).optional().describe("Page number."),
  call_type: z.enum(["CALL_OUTGOING", "CALL_INCOMING"]).optional().describe("Call direction filter."),
  related_to: textFilterSchema.optional().describe("Related entity slug. Must be used with related_to_type."),
  related_to_type: textFilterSchema.optional().describe("Related entity type. Must be used with related_to."),
  starting_from: textFilterSchema.optional().describe("Call started-on date/time range start."),
  starting_to: textFilterSchema.optional().describe("Call started-on date/time range end."),
  updated_from: textFilterSchema.optional().describe("Call log updated-on date range start."),
  updated_to: textFilterSchema.optional().describe("Call log updated-on date range end."),
};

const nullableStringSchema = z.union([z.string(), z.null()]);
const nullableNumberSchema = z.union([z.number(), z.null()]);
const nullableBooleanSchema = z.union([z.boolean(), z.null()]);
const nullableStringOrNumberSchema = z.union([z.string(), z.number(), z.null()]);

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

const taskTypeSummarySchema = z.object({
  id: nullableStringOrNumberSchema,
  label: nullableStringSchema,
});

const activityRelatedSummarySchema = z.object({
  first_name: nullableStringSchema.optional(),
  last_name: nullableStringSchema.optional(),
  company_name: nullableStringSchema.optional(),
  name: nullableStringSchema.optional(),
});

const taskSummarySchema = z.object({
  id: nullableNumberSchema,
  related_to: nullableStringSchema,
  task_type: z.union([z.array(taskTypeSummarySchema), z.null()]),
  related_to_type: nullableStringSchema,
  related_to_name: nullableStringSchema,
  related: z.union([activityRelatedSummarySchema, z.null()]),
  description: nullableStringSchema,
  title: nullableStringSchema,
  status: nullableNumberSchema,
  start_date: nullableStringSchema,
  reminder_date: nullableStringSchema,
  reminder: nullableNumberSchema,
  owner: nullableNumberSchema,
  created_on: nullableStringSchema,
  updated_on: nullableStringSchema,
  created_by: nullableNumberSchema,
  updated_by: nullableNumberSchema,
});

const searchTasksOutputSchema = {
  page: z.number().int().min(1),
  returned_count: z.number().int().min(0),
  has_more: z.boolean(),
  tasks: z.array(taskSummarySchema),
};

const meetingTypeSummarySchema = z.object({
  id: nullableStringOrNumberSchema,
  label: nullableStringSchema,
});

const meetingSummarySchema = z.object({
  id: nullableNumberSchema,
  title: nullableStringSchema,
  meeting_type: z.union([z.array(meetingTypeSummarySchema), z.null()]),
  description: nullableStringSchema,
  address: nullableStringSchema,
  reminder: nullableNumberSchema,
  start_date: nullableStringSchema,
  end_date: nullableStringSchema,
  related_to: nullableStringSchema,
  related_to_type: nullableStringSchema,
  related: z.union([activityRelatedSummarySchema, z.null()]),
  do_not_send_calendar_invites: nullableBooleanSchema,
  status: nullableStringOrNumberSchema,
  reminder_date: nullableStringSchema,
  all_day: nullableBooleanSchema,
  owner: nullableNumberSchema,
  created_on: nullableStringSchema,
  updated_on: nullableStringSchema,
  created_by: nullableNumberSchema,
  updated_by: nullableNumberSchema,
});

const searchMeetingsOutputSchema = {
  page: z.number().int().min(1),
  returned_count: z.number().int().min(0),
  has_more: z.boolean(),
  meetings: z.array(meetingSummarySchema),
};

const noteTypeSummarySchema = z.object({
  id: nullableStringOrNumberSchema,
  label: nullableStringSchema,
});

const noteSummarySchema = z.object({
  id: nullableNumberSchema,
  note_type: z.union([z.array(noteTypeSummarySchema), z.null()]),
  description: nullableStringSchema,
  related_to: nullableStringSchema,
  related_to_type: nullableStringSchema,
  related: z.union([activityRelatedSummarySchema, z.null()]),
  created_on: nullableStringSchema,
  updated_on: nullableStringSchema,
  created_by: nullableNumberSchema,
  updated_by: nullableNumberSchema,
});

const searchNotesOutputSchema = {
  page: z.number().int().min(1),
  returned_count: z.number().int().min(0),
  has_more: z.boolean(),
  notes: z.array(noteSummarySchema),
};

const callLogTypeSummarySchema = z.object({
  id: nullableStringOrNumberSchema,
  label: nullableStringSchema,
});

const callLogSummarySchema = z.object({
  id: nullableNumberSchema,
  call_type: nullableStringSchema,
  custom_call_type: z.union([z.array(callLogTypeSummarySchema), z.null()]),
  call_started_on: nullableStringSchema,
  contact_number: nullableStringSchema,
  call_notes: nullableStringSchema,
  related_to: nullableStringSchema,
  related_to_type: nullableStringSchema,
  related: z.union([activityRelatedSummarySchema, z.null()]),
  duration: nullableStringOrNumberSchema,
  created_on: nullableStringSchema,
  updated_on: nullableStringSchema,
  created_by: nullableNumberSchema,
  updated_by: nullableNumberSchema,
});

const searchCallLogsOutputSchema = {
  page: z.number().int().min(1),
  returned_count: z.number().int().min(0),
  has_more: z.boolean(),
  call_logs: z.array(callLogSummarySchema),
};

const candidateDetailOutputSchema = z.object({}).passthrough();

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
      description: "Search Recruit CRM candidates and return compact summaries designed for large result sets.",
      inputSchema: searchCandidatesInputSchema,
      outputSchema: searchCandidatesOutputSchema,
      annotations: {
        readOnlyHint: true,
      },
    },
    async (args) => formatResult(await executeSearchCandidates(client, args)),
  );

  server.registerTool(
    "search_tasks",
    {
      description: "Search Recruit CRM tasks and return compact summaries designed for large result sets.",
      inputSchema: searchTasksInputSchema,
      outputSchema: searchTasksOutputSchema,
      annotations: {
        readOnlyHint: true,
      },
    },
    async (args) => formatResult(await executeSearchTasks(client, args)),
  );

  server.registerTool(
    "search_meetings",
    {
      description: "Search Recruit CRM meetings and return compact summaries designed for large result sets.",
      inputSchema: searchMeetingsInputSchema,
      outputSchema: searchMeetingsOutputSchema,
      annotations: {
        readOnlyHint: true,
      },
    },
    async (args) => formatResult(await executeSearchMeetings(client, args)),
  );

  server.registerTool(
    "search_notes",
    {
      description: "Search Recruit CRM notes and return compact summaries designed for large result sets.",
      inputSchema: searchNotesInputSchema,
      outputSchema: searchNotesOutputSchema,
      annotations: {
        readOnlyHint: true,
      },
    },
    async (args) => formatResult(await executeSearchNotes(client, args)),
  );

  server.registerTool(
    "search_call_logs",
    {
      description: "Search Recruit CRM call logs and return compact summaries designed for large result sets.",
      inputSchema: searchCallLogsInputSchema,
      outputSchema: searchCallLogsOutputSchema,
      annotations: {
        readOnlyHint: true,
      },
    },
    async (args) => formatResult(await executeSearchCallLogs(client, args)),
  );

  server.registerTool(
    "get_candidate_details",
    {
      description: "Fetch one Recruit CRM candidate by slug and return the raw Recruit CRM payload.",
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
      description: "List curated candidate custom field metadata for search. Returns searchable fields by default.",
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
      description: "Fetch curated candidate custom field details by field_id, including dropdown or multiselect options.",
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

export async function executeSearchTasks(client: RecruitCrmClient, args: SearchTasksInput): Promise<SearchTasksResult> {
  validateRelatedFilters(args);
  const normalizedArgs = normalizeTaskDateRanges(args);

  let result;

  try {
    result = await client.searchTasks({
      page: normalizedArgs.page ?? 1,
      created_from: normalizedArgs.created_from,
      created_to: normalizedArgs.created_to,
      owner_email: normalizedArgs.owner_email,
      owner_id: normalizedArgs.owner_id,
      owner_name: normalizedArgs.owner_name,
      related_to: normalizedArgs.related_to,
      related_to_type: normalizedArgs.related_to_type,
      starting_from: normalizedArgs.starting_from,
      starting_to: normalizedArgs.starting_to,
      title: normalizedArgs.title,
      updated_from: normalizedArgs.updated_from,
      updated_to: normalizedArgs.updated_to,
    });
  } catch (error) {
    throw mapTaskSearchError(error, args);
  }

  return mapSearchTasksResult(result);
}

export async function executeSearchMeetings(
  client: RecruitCrmClient,
  args: SearchMeetingsInput,
): Promise<SearchMeetingsResult> {
  validateRelatedFilters(args);

  const result = await client.searchMeetings({
    page: args.page ?? 1,
    created_from: args.created_from,
    created_to: args.created_to,
    owner_email: args.owner_email,
    owner_id: args.owner_id,
    owner_name: args.owner_name,
    related_to: args.related_to,
    related_to_type: args.related_to_type,
    starting_from: args.starting_from,
    starting_to: args.starting_to,
    title: args.title,
    updated_from: args.updated_from,
    updated_to: args.updated_to,
  });

  return mapSearchMeetingsResult(result);
}

export async function executeSearchNotes(client: RecruitCrmClient, args: SearchNotesInput): Promise<SearchNotesResult> {
  validateRelatedFilters(args);

  const result = await client.searchNotes({
    page: args.page ?? 1,
    added_from: args.added_from,
    added_to: args.added_to,
    related_to: args.related_to,
    related_to_type: args.related_to_type,
    updated_from: args.updated_from,
    updated_to: args.updated_to,
  });

  return mapSearchNotesResult(result);
}

export async function executeSearchCallLogs(
  client: RecruitCrmClient,
  args: SearchCallLogsInput,
): Promise<SearchCallLogsResult> {
  validateRelatedFilters(args);
  validateCallLogRelatedType(args.related_to_type);

  const result = await client.searchCallLogs({
    page: args.page ?? 1,
    call_type: args.call_type,
    related_to: args.related_to,
    related_to_type: args.related_to_type,
    starting_from: args.starting_from,
    starting_to: args.starting_to,
    updated_from: args.updated_from,
    updated_to: args.updated_to,
  });

  return mapSearchCallLogsResult(result);
}

export async function executeGetCandidateDetails(
  client: RecruitCrmClient,
  candidateSlug: string,
): Promise<CandidateDetail> {
  return client.getCandidateDetails(candidateSlug);
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

function validateRelatedFilters(args: { related_to?: string; related_to_type?: string }): void {
  const hasRelatedTo = args.related_to !== undefined;
  const hasRelatedToType = args.related_to_type !== undefined;

  if (hasRelatedTo !== hasRelatedToType) {
    throw new RecruitCrmApiError("related_to and related_to_type must be provided together.");
  }
}

function validateCallLogRelatedType(relatedToType: string | undefined): void {
  if (relatedToType === undefined) {
    return;
  }

  const normalizedType = relatedToType.trim().toLowerCase();

  if (normalizedType === "job" || normalizedType === "deal") {
    throw new RecruitCrmApiError(
      "Recruit CRM call log search does not support related_to_type=job or related_to_type=deal.",
    );
  }
}

function normalizeTaskDateRanges(args: SearchTasksInput): SearchTasksInput {
  return {
    ...args,
    page: args.page ?? 1,
    created_from: args.created_from ?? getImplicitRangeStart(args.created_to),
    starting_from: args.starting_from ?? getImplicitRangeStart(args.starting_to),
    updated_from: args.updated_from ?? getImplicitRangeStart(args.updated_to),
  };
}

function getImplicitRangeStart(upperBound: string | undefined): string | undefined {
  if (upperBound === undefined) {
    return undefined;
  }

  return "1970-01-01";
}

function mapTaskSearchError(error: unknown, args: SearchTasksInput): RecruitCrmApiError {
  if (!(error instanceof RecruitCrmApiError)) {
    return new RecruitCrmApiError("Recruit CRM task search failed.", undefined, error);
  }

  if (error.statusCode === 500 && (args.updated_from !== undefined || args.updated_to !== undefined)) {
    return new RecruitCrmApiError(
      "Recruit CRM task search failed for this updated-on date range. Try a narrower updated_from/updated_to range.",
      error.statusCode,
      error,
    );
  }

  if (error.statusCode === 500 && (args.created_from !== undefined || args.created_to !== undefined)) {
    return new RecruitCrmApiError(
      "Recruit CRM task search failed for this created-on date range. Try adding created_from or narrowing the created_from/created_to window.",
      error.statusCode,
      error,
    );
  }

  if (error.statusCode === 500 && (args.starting_from !== undefined || args.starting_to !== undefined)) {
    return new RecruitCrmApiError(
      "Recruit CRM task search failed for this due-date range. Try adding starting_from or narrowing the starting_from/starting_to window.",
      error.statusCode,
      error,
    );
  }

  return error;
}

function formatResult(
  result:
    | SearchCandidatesResult
    | SearchMeetingsResult
    | SearchNotesResult
    | SearchCallLogsResult
    | SearchTasksResult
    | CandidateDetail
    | CandidateCustomFieldListResult
    | CandidateCustomFieldDetail,
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
