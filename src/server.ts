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
  mapCandidateHiringStagesResult,
  mapJobStatusesResult,
  mapCandidateJobAssignmentHiringStageHistoryResult,
  mapCreateHotlistResult,
  mapCreateNoteResult,
  mapCreateTaskResult,
  mapJobAssignedCandidatesResult,
  mapListNoteTypesResult,
  mapListTaskTypesResult,
  mapListUsersResult,
  mapSearchCallLogsResult,
  mapSearchCandidatesResult,
  mapSearchCompaniesResult,
  mapSearchContactsResult,
  mapSearchHotlistsResult,
  mapSearchJobsResult,
  mapSearchMeetingsResult,
  mapSearchNotesResult,
  mapSearchTasksResult,
} from "./recruitcrm/mappers.js";
import {
  type AddRecordsToHotlistInput,
  type AddRecordsToHotlistResult,
  type AnalyzeJobPipelineActivity,
  type AnalyzeJobPipelineBottleneck,
  type AnalyzeJobPipelineError,
  type AnalyzeJobPipelineIdleCandidate,
  type AnalyzeJobPipelineInput,
  type AnalyzeJobPipelineResult,
  type AnalyzeJobPipelineStageGroup,
  type AnalyzeJobPipelineTimeMetrics,
  type AnalyzeJobPipelineTimeToHire,
  type AnalyzeJobPipelineTimeToHirePlacement,
  type AnalyzeJobPipelineTimeToStageEntry,
  type AnalyzeJobPipelineTimeToFirstAction,
  type AssignedCandidateSummary,
  type CandidateHiringStagesResult,
  type JobStatusesResult,
  type SearchCallLogsInput,
  type SearchCallLogsResult,
  type CandidateJobAssignmentHiringStageHistoryResult,
  type CreateHotlistInput,
  type CreateHotlistResult,
  type CreateNoteInput,
  type CreateNoteResult,
  type CreateTaskInput,
  type CreateTaskResult,
  CUSTOM_FIELD_FILTER_TYPES,
  type CandidateCustomFieldDetail,
  type CandidateCustomFieldListResult,
  type CandidateDetail,
  type CandidateDetailsError,
  type CandidateDetailsResult,
  type CompanyDetail,
  type CompanyDetailsError,
  type CompanyDetailsResult,
  type ContactDetail,
  type ContactDetailsError,
  type ContactDetailsResult,
  type GetCandidateDetailsInput,
  type GetCompanyDetailsInput,
  type GetContactDetailsInput,
  type GetJobAssignedCandidatesInput,
  type JobAssignedCandidatesResult,
  type JobDetail,
  type ListCandidatesInput,
  type ListCompaniesInput,
  type ListContactsInput,
  type ListJobsInput,
  type ListNoteTypesResult,
  type ListTaskTypesResult,
  type ListUsersInput,
  type ListUsersResult,
  type RecruitCrmNoteType,
  type RecruitCrmTaskType,
  type SearchCandidatesInput,
  type SearchCompaniesInput,
  type SearchCompaniesResult,
  type SearchContactsInput,
  type SearchContactsResult,
  type SearchHotlistsInput,
  type SearchHotlistsResult,
  type SearchJobsInput,
  type SearchJobsResult,
  type SearchMeetingsInput,
  type SearchMeetingsResult,
  type SearchNotesInput,
  type SearchNotesResult,
  type SearchCandidatesResult,
  type SearchTasksInput,
  type SearchTasksResult,
  type RecruitCrmCandidateJobAssignmentHiringStageHistoryItem,
} from "./recruitcrm/types.js";

const booleanLikeSchema = z
  .union([z.boolean(), z.literal("true"), z.literal("false"), z.literal("1"), z.literal("0"), z.literal(1), z.literal(0)])
  .transform((value) => value === true || value === "true" || value === "1" || value === 1);

const textFilterSchema = z.string().trim().min(1);
const statusIdFilterSchema = z
  .union([z.coerce.number().int().positive(), textFilterSchema])
  .transform((value) => String(value));
const customFieldFilterValueSchema = z.union([z.string().trim().min(1), z.number()]);
const customFieldFilterTypeSchema = z.enum(CUSTOM_FIELD_FILTER_TYPES);
const binaryNumberSchema = z
  .union([z.literal("0"), z.literal("1"), z.literal(0), z.literal(1)])
  .transform((value) => Number(value) as 0 | 1);
const jobTypeInputSchema = z
  .union([z.literal("1"), z.literal("2"), z.literal("3"), z.literal("4"), z.literal(1), z.literal(2), z.literal(3), z.literal(4)])
  .transform((value) => Number(value) as 1 | 2 | 3 | 4);

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
  owner_id: textFilterSchema.optional().describe("Candidate owner id. Use this for 'my' candidate requests after resolving the Recruit CRM user id."),
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
  include_contact_info: booleanLikeSchema
    .optional()
    .describe(
      "Opt-in flag (default false). When true, each result also includes email, contact_number, and linkedin. Leave off for most requests; enable only when the user explicitly needs contact details, because it increases response size and exposes PII.",
    ),
};

const listCandidatesInputSchema = {
  limit: z.coerce.number().int().min(1).max(100).optional().describe("Records per page (max 100, default 100)."),
  page: z.coerce.number().int().min(1).optional().describe("Page number (default 1)."),
  sort_by: z.enum(["createdon", "updatedon"]).optional().describe("Sort field (default updatedon)."),
  sort_order: z.enum(["asc", "desc"]).optional().describe("Sort order (default desc)."),
  include_contact_info: booleanLikeSchema
    .optional()
    .describe(
      "Opt-in flag (default false). When true, each result also includes email, contact_number, and linkedin. Leave off for most requests; enable only when the user explicitly needs contact details, because it increases response size and exposes PII.",
    ),
};

const listJobsInputSchema = {
  limit: z.coerce.number().int().min(1).max(100).optional().describe("Records per page (max 100, default 100)."),
  page: z.coerce.number().int().min(1).optional().describe("Page number (default 1)."),
  sort_by: z.enum(["createdon", "updatedon"]).optional().describe("Sort field (default updatedon)."),
  sort_order: z.enum(["asc", "desc"]).optional().describe("Sort order (default desc)."),
};

const listCompaniesInputSchema = {
  limit: z.coerce.number().int().min(1).max(100).optional().describe("Records per page (max 100, default 100)."),
  page: z.coerce.number().int().min(1).optional().describe("Page number (default 1)."),
  sort_by: z.enum(["createdon", "updatedon"]).optional().describe("Sort field (default updatedon)."),
  sort_order: z.enum(["asc", "desc"]).optional().describe("Sort order (default desc)."),
};

const listContactsInputSchema = {
  limit: z.coerce.number().int().min(1).max(100).optional().describe("Records per page (max 100, default 100)."),
  page: z.coerce.number().int().min(1).optional().describe("Page number (default 1)."),
  sort_by: z.enum(["createdon", "updatedon"]).optional().describe("Sort field (default updatedon)."),
  sort_order: z.enum(["asc", "desc"]).optional().describe("Sort order (default desc)."),
  include_contact_info: booleanLikeSchema
    .optional()
    .describe(
      "Opt-in flag (default false). When true, each result also includes email, contact_number, and linkedin. Leave off for most requests; enable only when the user explicitly needs contact details, because it increases response size and exposes PII.",
    ),
};

const listUsersInputSchema = {
  include_teams: booleanLikeSchema
    .optional()
    .describe("Opt-in flag (default false). When true, each user includes team memberships."),
  include_contact_info: booleanLikeSchema
    .optional()
    .describe(
      "Opt-in flag (default false). When true, each user also includes email and contact_number. Leave off unless the user explicitly needs contact details.",
    ),
};

const searchTasksInputSchema = {
  page: z.coerce.number().int().min(1).optional().describe("Page number."),
  created_from: textFilterSchema.optional().describe("Task created-on date range start."),
  created_to: textFilterSchema.optional().describe("Task created-on date range end."),
  owner_email: textFilterSchema.optional().describe("Task owner email."),
  owner_id: textFilterSchema.optional().describe("Task owner id. Use this for 'my' task requests after resolving the Recruit CRM user id."),
  owner_name: textFilterSchema.optional().describe("Task owner name."),
  related_to: textFilterSchema.optional().describe("Related entity slug or id. Must be used with related_to_type."),
  related_to_type: textFilterSchema.optional().describe("Related entity type. Must be used with related_to."),
  starting_from: textFilterSchema.optional().describe("Task due-date range start."),
  starting_to: textFilterSchema.optional().describe("Task due-date range end."),
  title: textFilterSchema.optional().describe("Task title."),
  updated_from: textFilterSchema.optional().describe("Task updated-on date range start."),
  updated_to: textFilterSchema.optional().describe("Task updated-on date range end."),
};

const searchJobsInputSchema = {
  page: z.coerce.number().int().min(1).optional().describe("Page number."),
  city: textFilterSchema.optional().describe("City."),
  company_name: textFilterSchema.optional().describe("Company name."),
  company_slug: textFilterSchema.optional().describe("Company slug."),
  contact_email: textFilterSchema.optional().describe("Primary contact email."),
  contact_name: textFilterSchema.optional().describe("Primary contact name."),
  contact_number: textFilterSchema.optional().describe("Primary contact number."),
  contact_slug: textFilterSchema.optional().describe("Primary contact slug."),
  country: textFilterSchema.optional().describe("Country."),
  created_from: textFilterSchema.optional().describe("Created-on date range start."),
  created_to: textFilterSchema.optional().describe("Created-on date range end."),
  enable_job_application_form: binaryNumberSchema.optional().describe("Filter by job application form enabled flag."),
  exact_search: booleanLikeSchema.optional().describe("Use exact search instead of partial match."),
  full_address: textFilterSchema.optional().describe("Full address."),
  job_category: textFilterSchema.optional().describe("Job category."),
  job_skill: textFilterSchema.optional().describe("Job skill."),
  job_slug: textFilterSchema.optional().describe("Job slug. Other filters are ignored when provided."),
  job_status: z.coerce.number().int().optional().describe("Job status id."),
  job_type: jobTypeInputSchema.optional().describe("Job type."),
  limit: z.coerce.number().int().min(1).optional().describe("Results per page."),
  locality: textFilterSchema.optional().describe("Locality."),
  name: textFilterSchema.optional().describe("Job name."),
  note_for_candidates: textFilterSchema.optional().describe("Note for candidates."),
  owner_email: textFilterSchema.optional().describe("Job owner email."),
  owner_id: textFilterSchema.optional().describe("Job owner id. Use this for 'my' job requests after resolving the Recruit CRM user id."),
  owner_name: textFilterSchema.optional().describe("Job owner name."),
  secondary_contact_email: textFilterSchema.optional().describe("Secondary contact email."),
  secondary_contact_name: textFilterSchema.optional().describe("Secondary contact name."),
  secondary_contact_number: textFilterSchema.optional().describe("Secondary contact number."),
  secondary_contact_slug: textFilterSchema.optional().describe("Secondary contact slug."),
  sort_by: z.enum(["createdon", "updatedon"]).optional().describe("Sort field."),
  sort_order: z.enum(["asc", "desc"]).optional().describe("Sort order."),
  updated_from: textFilterSchema.optional().describe("Updated-on date range start."),
  updated_to: textFilterSchema.optional().describe("Updated-on date range end."),
};

const getJobAssignedCandidatesInputSchema = {
  job_slug: textFilterSchema.describe("Job slug."),
  page: z.coerce.number().int().min(1).optional().describe("Page number."),
  limit: z.coerce.number().int().min(1).optional().describe("Results per page. Max 100."),
  status_id: statusIdFilterSchema
    .optional()
    .describe("Hiring stage id filter. Accepts a single id or comma-separated ids like 8 or 8,12."),
};

const searchCompaniesInputSchema = {
  page: z.coerce.number().int().min(1).optional().describe("Page number."),
  company_name: textFilterSchema.optional().describe("Company name."),
  created_from: textFilterSchema.optional().describe("Created-on date range start."),
  created_to: textFilterSchema.optional().describe("Created-on date range end."),
  marked_as_off_limit: booleanLikeSchema.optional().describe("Filter by off-limit status."),
  owner_email: textFilterSchema.optional().describe("Company owner email."),
  owner_id: z.coerce.number().int().optional().describe("Company owner id. Use this for 'my' company requests after resolving the Recruit CRM user id."),
  owner_name: textFilterSchema.optional().describe("Company owner name."),
  updated_from: textFilterSchema.optional().describe("Updated-on date range start."),
  updated_to: textFilterSchema.optional().describe("Updated-on date range end."),
  company_slug: textFilterSchema.optional().describe("Company slug. Other filters are ignored when provided."),
  exact_search: booleanLikeSchema.optional().describe("Use exact search instead of partial match."),
  sort_by: z.enum(["createdon", "updatedon"]).optional().describe("Sort field."),
  sort_order: z.enum(["asc", "desc"]).optional().describe("Sort order."),
};

const searchContactsInputSchema = {
  page: z.coerce.number().int().min(1).optional().describe("Page number."),
  created_from: textFilterSchema.optional().describe("Created-on date range start."),
  created_to: textFilterSchema.optional().describe("Created-on date range end."),
  email: textFilterSchema.optional().describe("Contact email."),
  first_name: textFilterSchema.optional().describe("Contact first name."),
  last_name: textFilterSchema.optional().describe("Contact last name."),
  linkedin: textFilterSchema.optional().describe("Contact LinkedIn URL."),
  marked_as_off_limit: booleanLikeSchema.optional().describe("Filter contacts by off-limit status."),
  owner_email: textFilterSchema.optional().describe("Contact owner email."),
  owner_id: textFilterSchema.optional().describe("Contact owner id. Use this for 'my' contact requests after resolving the Recruit CRM user id."),
  owner_name: textFilterSchema.optional().describe("Contact owner name."),
  updated_from: textFilterSchema.optional().describe("Updated-on date range start."),
  updated_to: textFilterSchema.optional().describe("Updated-on date range end."),
  company_slug: textFilterSchema.optional().describe("Company slug."),
  contact_number: textFilterSchema.optional().describe("Contact number."),
  contact_slug: textFilterSchema.optional().describe("Contact slug. Other filters are ignored when provided."),
  exact_search: booleanLikeSchema.optional().describe("Use exact search instead of partial match."),
  sort_by: z.enum(["createdon", "updatedon"]).optional().describe("Sort field."),
  sort_order: z.enum(["asc", "desc"]).optional().describe("Sort order."),
  include_contact_info: booleanLikeSchema
    .optional()
    .describe(
      "Opt-in flag (default false). When true, each result also includes email, contact_number, and linkedin. Leave off for most requests; enable only when the user explicitly needs contact details, because it increases response size and exposes PII.",
    ),
};

const searchHotlistsInputSchema = {
  page: z.coerce.number().int().min(1).optional().describe("Page number."),
  name: textFilterSchema.optional().describe("Hotlist name."),
  shared: binaryNumberSchema.optional().describe("Shared with team flag. Use 1 for shared hotlists or 0 for private hotlists."),
  related_to_type: z
    .enum(["candidate", "company", "contact", "job"])
    .describe("Associated entity type for the hotlist."),
};

const createHotlistInputSchema = {
  name: textFilterSchema.describe("Hotlist name."),
  related_to_type: z
    .enum(["candidate", "company", "contact", "job"])
    .describe("Associated entity type for the hotlist."),
  shared: binaryNumberSchema.describe("Shared with team flag. Use 0 for private hotlists or 1 for shared hotlists."),
  created_by: z.coerce.number().int().positive().describe("Recruit CRM user id creating the hotlist."),
};

const searchMeetingsInputSchema = {
  page: z.coerce.number().int().min(1).optional().describe("Page number."),
  created_from: textFilterSchema.optional().describe("Meeting created-on date range start."),
  created_to: textFilterSchema.optional().describe("Meeting created-on date range end."),
  owner_email: textFilterSchema.optional().describe("Meeting owner email."),
  owner_id: textFilterSchema.optional().describe("Meeting owner id. Use this for 'my' meeting requests after resolving the Recruit CRM user id."),
  owner_name: textFilterSchema.optional().describe("Meeting owner name."),
  related_to: textFilterSchema.optional().describe("Related entity slug or id. Must be used with related_to_type."),
  related_to_type: textFilterSchema.optional().describe("Related entity type. Must be used with related_to."),
  starting_from: textFilterSchema.optional().describe("Meeting start date/time range start."),
  starting_to: textFilterSchema.optional().describe("Meeting start date/time range end."),
  title: textFilterSchema.optional().describe("Meeting title."),
  updated_from: textFilterSchema.optional().describe("Meeting updated-on date range start."),
  updated_to: textFilterSchema.optional().describe("Meeting updated-on date range end."),
};

const taskRelatedToTypeSchema = z.enum(["candidate", "company", "contact", "job", "deal"]);
const taskReminderSchema = z
  .union([
    z.literal("-1"),
    z.literal("0"),
    z.literal("15"),
    z.literal("30"),
    z.literal("60"),
    z.literal("1440"),
    z.literal(-1),
    z.literal(0),
    z.literal(15),
    z.literal(30),
    z.literal(60),
    z.literal(1440),
  ])
  .transform((value) => Number(value) as -1 | 0 | 15 | 30 | 60 | 1440);
const createTaskAssociatedSlugsSchema = z.array(textFilterSchema).min(1);
const createTaskCollaboratorIdsSchema = z.array(z.coerce.number().int().positive()).min(1);

const createTaskInputSchema = {
  task_type_id: z.coerce
    .number()
    .int()
    .positive()
    .describe("Recruit CRM task type id. Use list_task_types first and only pass an id returned by that tool."),
  title: textFilterSchema.describe("Task title."),
  description: z
    .string()
    .min(1)
    .describe("Task description. Supports basic HTML/rich text and is sent to Recruit CRM as-is."),
  reminder: taskReminderSchema.describe(
    "Reminder ID: -1 No Reminder, 0 0 Min Before, 15 15 Min Before, 30 30 Min Before, 60 1 Hour Before, 1440 1 Day Before.",
  ),
  start_date: textFilterSchema.describe("Task start date/time, preferably ISO 8601."),
  owner_id: z.coerce
    .number()
    .int()
    .positive()
    .describe("Recruit CRM user id assigned to own the task. Use list_users to resolve a known user name or email; ask if unknown."),
  created_by: z.coerce
    .number()
    .int()
    .positive()
    .describe("Recruit CRM user id creating the task. Often the same as owner_id; use list_users to resolve a known user name or email; ask if unknown."),
  related_to: textFilterSchema.optional().describe("Associated entity slug. Must be used with related_to_type."),
  related_to_type: taskRelatedToTypeSchema.optional().describe("Associated entity type. Must be used with related_to."),
  updated_by: z.coerce.number().int().positive().optional().describe("Recruit CRM user id updating the task."),
  associated_candidates: createTaskAssociatedSlugsSchema
    .optional()
    .describe("Additional associated candidate slugs. Sent as a comma-separated API field."),
  associated_companies: createTaskAssociatedSlugsSchema
    .optional()
    .describe("Additional associated company slugs. Sent as a comma-separated API field."),
  associated_contacts: createTaskAssociatedSlugsSchema
    .optional()
    .describe("Additional associated contact slugs. Sent as a comma-separated API field."),
  associated_jobs: createTaskAssociatedSlugsSchema
    .optional()
    .describe("Additional associated job slugs. Sent as a comma-separated API field."),
  associated_deals: createTaskAssociatedSlugsSchema
    .optional()
    .describe("Additional associated deal slugs. Sent as a comma-separated API field."),
  collaborator_user_ids: createTaskCollaboratorIdsSchema
    .optional()
    .describe("Collaborator user IDs. Sent to the Recruit CRM tasks API as the comma-separated collaborators field."),
  collaborator_team_ids: createTaskCollaboratorIdsSchema
    .optional()
    .describe("Collaborator team IDs. Sent as a comma-separated API field."),
  enable_auto_populate_teams: booleanLikeSchema
    .optional()
    .describe("When true, Recruit CRM auto-populates teams for the owner_id user/account owner unless collaborator_team_ids is provided."),
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

const noteRelatedToTypeSchema = z.enum(["candidate", "company", "contact", "job", "deal"]);
const createNoteAssociatedSlugsSchema = z.array(textFilterSchema).min(1);
const createNoteCollaboratorIdsSchema = z.array(z.coerce.number().int().positive()).min(1);

const createNoteInputSchema = {
  note_type_id: z.coerce.number()
    .int()
    .positive()
    .describe("Recruit CRM note type id. Use list_note_types first and only pass an id returned by that tool."),
  description: z
    .string()
    .min(1)
    .describe("Note description. Supports basic HTML/rich text and is sent to Recruit CRM as-is."),
  related_to: textFilterSchema.describe("Associated entity slug."),
  related_to_type: noteRelatedToTypeSchema.describe("Associated entity type."),
  created_by: z.coerce.number()
    .int()
    .positive()
    .describe("Recruit CRM user id creating the note. Use list_users to resolve a known user name or email; ask the user if unknown."),
  updated_by: z.coerce.number().int().positive().optional().describe("Recruit CRM user id updating the note."),
  associated_candidates: createNoteAssociatedSlugsSchema
    .optional()
    .describe("Additional associated candidate slugs. Sent as a comma-separated API field."),
  associated_companies: createNoteAssociatedSlugsSchema
    .optional()
    .describe("Additional associated company slugs. Sent as a comma-separated API field."),
  associated_contacts: createNoteAssociatedSlugsSchema
    .optional()
    .describe("Additional associated contact slugs. Sent as a comma-separated API field."),
  associated_jobs: createNoteAssociatedSlugsSchema
    .optional()
    .describe("Additional associated job slugs. Sent as a comma-separated API field."),
  associated_deals: createNoteAssociatedSlugsSchema
    .optional()
    .describe("Additional associated deal slugs. Sent as a comma-separated API field."),
  collaborator_user_ids: createNoteCollaboratorIdsSchema
    .optional()
    .describe("Collaborator user IDs. Sent as a comma-separated API field."),
  collaborator_team_ids: createNoteCollaboratorIdsSchema
    .optional()
    .describe("Collaborator team IDs. Sent as a comma-separated API field."),
  enable_auto_populate_teams: booleanLikeSchema
    .optional()
    .describe("When true, Recruit CRM auto-populates teams for the created_by user/account owner unless collaborator_team_ids is provided."),
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
const myRecordsOwnerFilterGuidance =
  "When the user says 'my', 'mine', or 'owned by me', resolve the Recruit CRM user id via list_users when needed and filter with owner_id; if the current user cannot be identified, ask for their Recruit CRM user name/email/id instead of guessing.";
const unsupportedOwnerFilterGuidance =
  "This tool does not support owner filters; do not invent owner_id for 'my' requests. Use an owner-scoped upstream search when applicable, or explain the limitation.";

const candidateSummarySchema = z.object({
  slug: z.string(),
  first_name: nullableStringSchema,
  last_name: nullableStringSchema,
  position: nullableStringSchema,
  current_organization: nullableStringSchema,
  current_status: nullableStringSchema,
  city: nullableStringSchema,
  updated_on: nullableStringSchema,
  email: nullableStringSchema.optional(),
  contact_number: nullableStringSchema.optional(),
  linkedin: nullableStringSchema.optional(),
});

const searchCandidatesOutputSchema = {
  page: z.number().int().min(1),
  returned_count: z.number().int().min(0),
  has_more: z.boolean(),
  candidates: z.array(candidateSummarySchema),
};

const jobStatusSummarySchema = z.object({
  id: nullableNumberSchema,
  label: nullableStringSchema,
});

const jobSummarySchema = z.object({
  id: nullableNumberSchema,
  slug: nullableStringSchema,
  name: nullableStringSchema,
  company_slug: nullableStringSchema,
  contact_slug: nullableStringSchema,
  secondary_contact_slugs: z.array(z.string()),
  job_status: z.union([jobStatusSummarySchema, z.null()]),
  note_for_candidates: nullableStringSchema,
  number_of_openings: nullableNumberSchema,
  minimum_experience: nullableNumberSchema,
  maximum_experience: nullableNumberSchema,
  min_annual_salary: nullableNumberSchema,
  max_annual_salary: nullableNumberSchema,
  pay_rate: nullableNumberSchema,
  bill_rate: nullableNumberSchema,
  salary_type: nullableStringSchema,
  job_type: nullableStringSchema,
  job_category: nullableStringSchema,
  job_skill: nullableStringSchema,
  city: nullableStringSchema,
  locality: nullableStringSchema,
  state: nullableStringSchema,
  country: nullableStringSchema,
  enable_job_application_form: nullableBooleanSchema,
  application_form_url: nullableStringSchema,
  owner: nullableNumberSchema,
  created_on: nullableStringSchema,
  updated_on: nullableStringSchema,
});

const searchJobsOutputSchema = {
  page: z.number().int().min(1),
  returned_count: z.number().int().min(0),
  has_more: z.boolean(),
  jobs: z.array(jobSummarySchema),
};

const companyOffLimitSummarySchema = z.object({
  status_id: nullableNumberSchema,
  status_label: nullableStringSchema,
  reason: nullableStringSchema,
  end_date: nullableStringSchema,
});

const companySummarySchema = z.object({
  id: nullableNumberSchema,
  slug: nullableStringSchema,
  company_name: nullableStringSchema,
  website: nullableStringSchema,
  city: nullableStringSchema,
  locality: nullableStringSchema,
  state: nullableStringSchema,
  country: nullableStringSchema,
  postal_code: nullableStringSchema,
  address: nullableStringSchema,
  owner: nullableNumberSchema,
  contact_slugs: z.array(z.string()),
  is_child_company: nullableBooleanSchema,
  is_parent_company: nullableBooleanSchema,
  child_company_slugs: z.array(z.string()),
  parent_company_slug: nullableStringSchema,
  marked_as_off_limit: z.boolean(),
  off_limit: z.union([companyOffLimitSummarySchema, z.null()]),
  created_on: nullableStringSchema,
  updated_on: nullableStringSchema,
});

const searchCompaniesOutputSchema = {
  page: z.number().int().min(1),
  returned_count: z.number().int().min(0),
  has_more: z.boolean(),
  companies: z.array(companySummarySchema),
};

const contactSummarySchema = z.object({
  slug: z.string(),
  first_name: nullableStringSchema,
  last_name: nullableStringSchema,
  designation: nullableStringSchema,
  company_slug: nullableStringSchema,
  additional_company_slugs: z.array(z.string()),
  city: nullableStringSchema,
  locality: nullableStringSchema,
  updated_on: nullableStringSchema,
  email: nullableStringSchema.optional(),
  contact_number: nullableStringSchema.optional(),
  linkedin: nullableStringSchema.optional(),
});

const searchContactsOutputSchema = {
  page: z.number().int().min(1),
  returned_count: z.number().int().min(0),
  has_more: z.boolean(),
  contacts: z.array(contactSummarySchema),
};

const hotlistSummarySchema = z.object({
  id: nullableNumberSchema,
  name: nullableStringSchema,
  related_to_type: nullableStringSchema,
  shared: nullableBooleanSchema,
  created_by: nullableNumberSchema,
  related_count: z.number().int().min(0),
  related_slugs: z.array(z.string()).optional(),
});

const searchHotlistsOutputSchema = {
  page: z.number().int().min(1),
  returned_count: z.number().int().min(0),
  has_more: z.boolean(),
  hotlists: z.array(hotlistSummarySchema),
};

const userTeamSummarySchema = z.object({
  team_id: nullableNumberSchema,
  team_name: nullableStringSchema,
});

const userSummarySchema = z.object({
  id: nullableNumberSchema,
  first_name: nullableStringSchema,
  last_name: nullableStringSchema,
  status: nullableStringSchema,
  teams: z.array(userTeamSummarySchema).optional(),
  email: nullableStringSchema.optional(),
  contact_number: nullableStringSchema.optional(),
});

const listUsersOutputSchema = {
  returned_count: z.number().int().min(0),
  users: z.array(userSummarySchema),
};

const createHotlistOutputSchema = {
  hotlist_id: nullableNumberSchema,
  name: nullableStringSchema,
  related_to_type: nullableStringSchema,
  shared: nullableBooleanSchema,
  created_by: nullableNumberSchema,
};

const addRecordsToHotlistInputSchema = {
  hotlist_id: z.coerce.number().int().positive().describe("Hotlist id to modify."),
  related_slugs: z
    .array(textFilterSchema)
    .min(1)
    .max(10)
    .describe("Record slugs to add. Max 10 per call. Duplicates are ignored."),
};

const addRecordsToHotlistOutputSchema = {
  hotlist_id: z.number().int().positive(),
  requested_count: z.number().int().min(0),
  successful_count: z.number().int().min(0),
  failed_count: z.number().int().min(0),
  added_slugs: z.array(z.string()),
  errors: z.array(
    z.object({
      slug: z.string(),
      error: z.string(),
      status_code: z.union([z.number().int(), z.null()]),
    }),
  ),
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

const listTaskTypesOutputSchema = {
  returned_count: z.number().int().min(0),
  task_types: z.array(taskTypeSummarySchema),
};

const taskCollaboratorSummarySchema = z.object({
  attendee_type: nullableStringSchema,
  attendee_id: nullableStringSchema,
  display_name: nullableStringSchema,
});

const taskCollaboratorUserSummarySchema = z.object({
  id: nullableNumberSchema,
  first_name: nullableStringSchema,
  last_name: nullableStringSchema,
});

const taskCollaboratorTeamSummarySchema = z.object({
  team_id: nullableNumberSchema,
  team_name: nullableStringSchema,
});

const createTaskOutputSchema = {
  task_id: nullableNumberSchema,
  title: nullableStringSchema,
  task_type: z.union([taskTypeSummarySchema, z.null()]),
  description: nullableStringSchema,
  reminder: nullableNumberSchema,
  start_date: nullableStringSchema,
  reminder_date: nullableStringSchema,
  related_to: nullableStringSchema,
  related_to_type: nullableStringSchema,
  related_to_name: nullableStringSchema,
  related_to_view_url: nullableStringSchema,
  status: nullableStringOrNumberSchema,
  owner: nullableNumberSchema,
  associated_candidates: z.array(z.string()),
  associated_companies: z.array(z.string()),
  associated_contacts: z.array(z.string()),
  associated_jobs: z.array(z.string()),
  associated_deals: z.array(z.string()),
  created_on: nullableStringSchema,
  updated_on: nullableStringSchema,
  created_by: nullableNumberSchema,
  updated_by: nullableNumberSchema,
  collaborators: z.array(taskCollaboratorSummarySchema),
  collaborator_users: z.array(taskCollaboratorUserSummarySchema),
  collaborator_teams: z.array(taskCollaboratorTeamSummarySchema),
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
  resource_url: nullableStringSchema,
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

const listNoteTypesOutputSchema = {
  returned_count: z.number().int().min(0),
  note_types: z.array(noteTypeSummarySchema),
};

const noteCollaboratorUserSummarySchema = z.object({
  id: nullableNumberSchema,
  first_name: nullableStringSchema,
  last_name: nullableStringSchema,
});

const noteCollaboratorTeamSummarySchema = z.object({
  team_id: nullableNumberSchema,
  team_name: nullableStringSchema,
});

const createNoteOutputSchema = {
  note_id: nullableNumberSchema,
  note_type: z.union([noteTypeSummarySchema, z.null()]),
  description: nullableStringSchema,
  related_to: nullableStringSchema,
  related_to_type: nullableStringSchema,
  related_to_view_url: nullableStringSchema,
  associated_candidates: z.array(z.string()),
  associated_companies: z.array(z.string()),
  associated_contacts: z.array(z.string()),
  associated_jobs: z.array(z.string()),
  associated_deals: z.array(z.string()),
  created_on: nullableStringSchema,
  updated_on: nullableStringSchema,
  created_by: nullableNumberSchema,
  updated_by: nullableNumberSchema,
  collaborator_users: z.array(noteCollaboratorUserSummarySchema),
  collaborator_teams: z.array(noteCollaboratorTeamSummarySchema),
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

const candidateJobAssignmentHiringStageHistoryItemSchema = z.object({
  job_slug: nullableStringSchema,
  job_name: nullableStringSchema,
  company_slug: nullableStringSchema,
  company_name: nullableStringSchema,
  job_status_id: nullableNumberSchema,
  job_status_label: nullableStringSchema,
  candidate_status_id: nullableNumberSchema,
  candidate_status: nullableStringSchema,
  remark: nullableStringSchema,
  updated_by: nullableNumberSchema,
  updated_on: nullableStringSchema,
});

const candidateJobAssignmentHiringStageHistoryOutputSchema = {
  candidate_slug: z.string(),
  returned_count: z.number().int().min(0),
  history: z.array(candidateJobAssignmentHiringStageHistoryItemSchema),
};

const assignedCandidateSummarySchema = z.object({
  candidate_slug: z.string(),
  first_name: nullableStringSchema,
  last_name: nullableStringSchema,
  position: nullableStringSchema,
  current_organization: nullableStringSchema,
  current_status: nullableStringSchema,
  city: nullableStringSchema,
  country: nullableStringSchema,
  updated_on: nullableStringSchema,
  stage_date: nullableStringSchema,
  status_id: nullableNumberSchema,
  status_label: nullableStringSchema,
});

const getJobAssignedCandidatesOutputSchema = {
  job_slug: z.string(),
  page: z.number().int().min(1),
  returned_count: z.number().int().min(0),
  has_more: z.boolean(),
  assigned_candidates: z.array(assignedCandidateSummarySchema),
};

const hiringStageSummarySchema = z.object({
  stage_id: nullableNumberSchema,
  label: nullableStringSchema,
});

const listCandidateHiringStagesOutputSchema = {
  returned_count: z.number().int().min(0),
  stages: z.array(hiringStageSummarySchema),
};

const listJobStatusesOutputSchema = {
  returned_count: z.number().int().min(0),
  statuses: z.array(jobStatusSummarySchema),
};

const candidateDetailOutputSchema = z.object({}).passthrough();
const companyDetailOutputSchema = z.object({}).passthrough();
const contactDetailOutputSchema = z.object({}).passthrough();
const jobDetailOutputSchema = z.object({}).passthrough();

const getCandidateDetailsInputSchema = {
  candidate_slugs: z
    .array(textFilterSchema)
    .min(1)
    .max(10)
    .describe("Candidate slugs to fetch. Max 10 per call. Duplicates are ignored."),
};

const getCompanyDetailsInputSchema = {
  company_slugs: z
    .array(textFilterSchema)
    .min(1)
    .max(10)
    .describe("Company slugs to fetch. Max 10 per call. Duplicates are ignored."),
};

const getContactDetailsInputSchema = {
  contact_slugs: z
    .array(textFilterSchema)
    .min(1)
    .max(10)
    .describe("Contact slugs to fetch. Max 10 per call. Duplicates are ignored."),
};

const candidateDetailsOutputSchema = {
  requested_count: z.number().int().min(0),
  successful_count: z.number().int().min(0),
  failed_count: z.number().int().min(0),
  candidates: z.array(candidateDetailOutputSchema),
  errors: z.array(
    z.object({
      slug: z.string(),
      error: z.string(),
      status_code: z.union([z.number().int(), z.null()]),
    }),
  ),
};

const companyDetailsOutputSchema = {
  requested_count: z.number().int().min(0),
  successful_count: z.number().int().min(0),
  failed_count: z.number().int().min(0),
  companies: z.array(companyDetailOutputSchema),
  errors: z.array(
    z.object({
      slug: z.string(),
      error: z.string(),
      status_code: z.union([z.number().int(), z.null()]),
    }),
  ),
};

const contactDetailsOutputSchema = {
  requested_count: z.number().int().min(0),
  successful_count: z.number().int().min(0),
  failed_count: z.number().int().min(0),
  contacts: z.array(contactDetailOutputSchema),
  errors: z.array(
    z.object({
      slug: z.string(),
      error: z.string(),
      status_code: z.union([z.number().int(), z.null()]),
    }),
  ),
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

const ANALYZE_JOB_PIPELINE_DEFAULTS = {
  startPage: 1,
  idleDaysThreshold: 14,
  maxActiveCandidates: 25,
  maxPlacedCandidates: 25,
  terminalStageLabels: ["Placed", "Rejected", "Offer Declined", "Withdrawn"],
  hireStageLabels: ["Placed"],
  intakeStageLabels: ["Assigned", "Applied"],
} as const;

const analyzeJobPipelineInputSchema = {
  job_slug: textFilterSchema.describe(
    "Job slug to analyze (e.g. 16734937272590003vEM). Required. If the user only gave a job name or title, FIRST call search_jobs to resolve the slug.",
  ),
  start_page: z.coerce
    .number()
    .int()
    .min(1)
    .optional()
    .describe(
      `First assignment page in the 3-page window (~300 candidates) analyzed by this call. Default ${ANALYZE_JOB_PIPELINE_DEFAULTS.startPage}. Pass next_window.start_page from a prior response to analyze the next batch.`,
    ),
  idle_days_threshold: z.coerce
    .number()
    .int()
    .min(1)
    .optional()
    .describe(
      `Days since a candidate's last hiring-stage movement before flagging as idle. Default ${ANALYZE_JOB_PIPELINE_DEFAULTS.idleDaysThreshold}.`,
    ),
  max_active_candidates: z.coerce
    .number()
    .int()
    .min(1)
    .max(100)
    .optional()
    .describe(
      `Cap on active candidates whose stage history is fetched when include_time_metrics is true (each costs one /candidates/{slug}/history call). Default ${ANALYZE_JOB_PIPELINE_DEFAULTS.maxActiveCandidates}. Ignored when include_time_metrics is false (no active histories fetched).`,
    ),
  max_placed_candidates: z.coerce
    .number()
    .int()
    .min(1)
    .max(100)
    .optional()
    .describe(
      `Cap on Placed (terminal) candidates whose stage history is fetched when include_time_metrics is true (each costs one /candidates/{slug}/history call). Default ${ANALYZE_JOB_PIPELINE_DEFAULTS.maxPlacedCandidates}. Ignored when include_time_metrics is false.`,
    ),
  terminal_stage_labels: z
    .array(textFilterSchema)
    .optional()
    .describe(
      `Stage labels treated as terminal (excluded from active analysis). Default ${JSON.stringify(ANALYZE_JOB_PIPELINE_DEFAULTS.terminalStageLabels)}. Override only when the account uses non-standard pipeline labels.`,
    ),
  include_activity: booleanLikeSchema
    .optional()
    .describe(
      "Include notes / meetings / tasks counts tied to this job (3 extra parallel calls). Default true. Auto-skipped when start_page > 1 to avoid redundant calls on follow-up windows.",
    ),
  include_time_metrics: booleanLikeSchema
    .optional()
    .describe(
      "Compute time-to-hire, time-to-stage, and time-to-first-action metrics. Default false. When false, the tool relies on stage_date from the assignments endpoint for days_in_current_stage (cheap: ~7 API calls). When true, the tool fetches per-candidate history for capped active + Placed candidates (typically +25–55 calls), enabling the time_metrics block. Set true only when the user explicitly asks for time-to-hire / time-to-stage / time-to-X.",
    ),
};

const analyzeJobPipelineStageCandidateSchema = z.object({
  candidate_slug: z.string(),
  name: nullableStringSchema,
  days_in_current_stage: nullableNumberSchema,
});

const analyzeJobPipelineStageGroupSchema = z.object({
  stage_id: nullableNumberSchema,
  label: z.string(),
  count: z.number().int().min(0),
  candidates: z.array(analyzeJobPipelineStageCandidateSchema),
});

const analyzeJobPipelineOutputSchema = {
  job: z.object({
    slug: z.string(),
    name: nullableStringSchema,
    status_label: nullableStringSchema,
    owner: nullableNumberSchema,
    owner_name: nullableStringSchema,
    company_slug: nullableStringSchema,
    created_on: nullableStringSchema,
    days_open: nullableNumberSchema,
    number_of_openings: nullableNumberSchema,
    view_url: z.string(),
  }),
  pipeline: z.object({
    window: z.object({
      start_page: z.number().int().min(1),
      end_page: z.number().int().min(1),
      analyzed_count: z.number().int().min(0),
    }),
    next_window: z.union([z.object({ start_page: z.number().int().min(1) }), z.null()]),
    total_assigned_in_window: z.number().int().min(0),
    active_count: z.number().int().min(0),
    terminal_count: z.number().int().min(0),
    terminal_stages_summary: z.record(z.string(), z.number().int().min(0)),
    stages: z.array(analyzeJobPipelineStageGroupSchema),
  }),
  bottleneck: z.union([
    z.object({
      stage_label: z.string(),
      count: z.number().int().min(0),
      median_days_in_stage: z.number(),
      reason: z.string(),
    }),
    z.null(),
  ]),
  idle_candidates: z.array(
    z.object({
      candidate_slug: z.string(),
      name: nullableStringSchema,
      current_stage: nullableStringSchema,
      days_in_current_stage: z.number().int().min(0),
    }),
  ),
  activity: z.union([
    z.object({
      notes_30d: z.number().int().min(0),
      meetings_30d: z.number().int().min(0),
      tasks_total: z.number().int().min(0),
      next_task_due_at: nullableStringSchema,
      last_note_at: nullableStringSchema,
      last_meeting_at: nullableStringSchema,
    }),
    z.null(),
  ]),
  time_metrics: z.union([
    z.object({
      time_to_hire: z.union([
        z.object({
          first_days: z.number(),
          avg_days: z.number(),
          sample_size: z.number().int().min(0),
          placements: z.array(
            z.object({
              candidate_slug: z.string(),
              name: nullableStringSchema,
              days_to_hire: z.number(),
            }),
          ),
        }),
        z.null(),
      ]),
      time_to_stage: z.record(
        z.string(),
        z.object({
          first_days: z.number(),
          avg_days: z.number(),
          sample_size: z.number().int().min(0),
        }),
      ),
      time_to_first_action: z.union([
        z.object({
          avg_days: nullableNumberSchema,
          stuck_in_intake: z.number().int().min(0),
          sample_size: z.number().int().min(0),
        }),
        z.null(),
      ]),
      coverage: z.object({
        active_history_fetched: z.number().int().min(0),
        active_total: z.number().int().min(0),
        placed_history_fetched: z.number().int().min(0),
        placed_total: z.number().int().min(0),
      }),
    }),
    z.null(),
  ]),
  truncated: z.object({
    assignments: z.literal(true).optional(),
    active_candidates: z.literal(true).optional(),
    placed_candidates: z.literal(true).optional(),
  }),
  errors: z.array(
    z.object({
      source: z.enum(["stage_history", "placed_history", "activity", "assignments"]),
      slug: z.string().optional(),
      message: z.string(),
      status_code: z.union([z.number().int(), z.null()]),
    }),
  ),
  suggested_actions: z.array(z.string()),
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
    version: "0.5.2",
  });

  server.registerTool(
    "search_candidates",
    {
      description:
        `Search Recruit CRM candidates and return compact summaries designed for large result sets. ${myRecordsOwnerFilterGuidance} Returns candidate slug values that can be used with get_candidate_details or to open Recruit CRM app links like https://app.recruitcrm.io/candidate/{slug}.`,
      inputSchema: searchCandidatesInputSchema,
      outputSchema: searchCandidatesOutputSchema,
      annotations: {
        readOnlyHint: true,
      },
    },
    async (args) => formatResult(await executeSearchCandidates(client, args)),
  );

  server.registerTool(
    "list_candidates",
    {
      description:
        "List all candidates in the account, most-recently updated first. Use this for unfiltered 'show recent candidates' requests; use search_candidates when you have filter criteria like name, owner, date, or 'my candidates' ownership. Returns compact summaries with slug values for candidate detail lookup or app links like https://app.recruitcrm.io/candidate/{slug}.",
      inputSchema: listCandidatesInputSchema,
      outputSchema: searchCandidatesOutputSchema,
      annotations: {
        readOnlyHint: true,
      },
    },
    async (args) => formatResult(await executeListCandidates(client, args)),
  );

  server.registerTool(
    "search_jobs",
    {
      description:
        `Search Recruit CRM jobs and return compact summaries designed for large result sets. ${myRecordsOwnerFilterGuidance} Returns slug, company_slug, and contact_slug values that can be used to open Recruit CRM app URLs like https://app.recruitcrm.io/job/{slug}, https://app.recruitcrm.io/company/{company_slug}, and https://app.recruitcrm.io/contact/{contact_slug}.`,
      inputSchema: searchJobsInputSchema,
      outputSchema: searchJobsOutputSchema,
      annotations: {
        readOnlyHint: true,
      },
    },
    async (args) => formatResult(await executeSearchJobs(client, args)),
  );

  server.registerTool(
    "list_jobs",
    {
      description:
        "List all jobs in the account, most-recently updated first. Use this for unfiltered 'show recent jobs' or 'show all jobs' requests; use search_jobs when you have filter criteria like company, status, name, owner, or 'my jobs' ownership. Returns compact summaries with slug, company_slug, and contact_slug values for app links.",
      inputSchema: listJobsInputSchema,
      outputSchema: searchJobsOutputSchema,
      annotations: {
        readOnlyHint: true,
      },
    },
    async (args) => formatResult(await executeListJobs(client, args)),
  );

  server.registerTool(
    "search_companies",
    {
      description:
        `Search Recruit CRM companies and return compact summaries designed for large result sets. ${myRecordsOwnerFilterGuidance} Returns company slug values for Recruit CRM company links like https://app.recruitcrm.io/company/{slug} and contact_slugs values for contact links like https://app.recruitcrm.io/contact/{contact_slug}.`,
      inputSchema: searchCompaniesInputSchema,
      outputSchema: searchCompaniesOutputSchema,
      annotations: {
        readOnlyHint: true,
      },
    },
    async (args) => formatResult(await executeSearchCompanies(client, args)),
  );

  server.registerTool(
    "list_companies",
    {
      description:
        "List all companies in the account, most-recently updated first. Use this for unfiltered 'show recent companies' or 'show all companies' requests; use search_companies when you have filter criteria like name, owner, or 'my companies' ownership. Returns compact summaries with slug and contact_slugs values for app links.",
      inputSchema: listCompaniesInputSchema,
      outputSchema: searchCompaniesOutputSchema,
      annotations: {
        readOnlyHint: true,
      },
    },
    async (args) => formatResult(await executeListCompanies(client, args)),
  );

  server.registerTool(
    "search_contacts",
    {
      description:
        `Search Recruit CRM contacts with filters and return compact summaries for large result sets. ${myRecordsOwnerFilterGuidance} At least one real filter is required: sort_by, sort_order, page, exact_search, and include_contact_info do not count by themselves. Use list_contacts for unfiltered 'show recent contacts' or 'show all contacts' requests.`,
      inputSchema: searchContactsInputSchema,
      outputSchema: searchContactsOutputSchema,
      annotations: {
        readOnlyHint: true,
      },
    },
    async (args) => formatResult(await executeSearchContacts(client, args)),
  );

  server.registerTool(
    "list_contacts",
    {
      description:
        "List all contacts in the account, most-recently updated first. Use this for unfiltered 'show recent contacts' or 'show all contacts' requests; use search_contacts when you have filter criteria like name, company, owner, date, or 'my contacts' ownership. Returns compact summaries with slug values for contact detail lookup or app links like https://app.recruitcrm.io/contact/{slug}.",
      inputSchema: listContactsInputSchema,
      outputSchema: searchContactsOutputSchema,
      annotations: {
        readOnlyHint: true,
      },
    },
    async (args) => formatResult(await executeListContacts(client, args)),
  );

  server.registerTool(
    "list_users",
    {
      description:
        "List Recruit CRM users and return compact user summaries with id, first_name, last_name, and status. Enable include_teams only when the user asks for team membership. Enable include_contact_info only when the user explicitly needs email or phone.",
      inputSchema: listUsersInputSchema,
      outputSchema: listUsersOutputSchema,
      annotations: {
        readOnlyHint: true,
      },
    },
    async (args) => formatResult(await executeListUsers(client, args)),
  );

  server.registerTool(
    "search_hotlists",
    {
      description:
        `Search Recruit CRM hotlists by related_to_type and optional name/shared filters. related_to_type is required. ${unsupportedOwnerFilterGuidance} Broad searches return compact hotlist summaries with related_count only. When name is provided, results also include related_slugs for follow-up workflows.`,
      inputSchema: searchHotlistsInputSchema,
      outputSchema: searchHotlistsOutputSchema,
      annotations: {
        readOnlyHint: true,
      },
    },
    async (args) => formatResult(await executeSearchHotlists(client, args)),
  );

  server.registerTool(
    "create_hotlist",
    {
      description:
        "Create one Recruit CRM hotlist. This tool modifies data in Recruit CRM and should only be used when the user explicitly asks to create a hotlist. Requires created_by as a Recruit CRM user id; use list_users only when a user name must be resolved to an id. Use shared: 0 unless the user explicitly asks to share the hotlist with the team.",
      inputSchema: createHotlistInputSchema,
      outputSchema: createHotlistOutputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
    },
    async (args) => formatResult(await executeCreateHotlist(client, args)),
  );

  server.registerTool(
    "add_records_to_hotlist",
    {
      description:
        "Add up to 10 Recruit CRM record slugs to an existing hotlist. This tool modifies data in Recruit CRM and should only be used when the user explicitly asks to add records to a specific hotlist. Executes sequentially, ignores duplicate input slugs, and returns partial success details instead of failing the whole batch.",
      inputSchema: addRecordsToHotlistInputSchema,
      outputSchema: addRecordsToHotlistOutputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
    },
    async (args) => formatResult(await executeAddRecordsToHotlist(client, args)),
  );

  server.registerTool(
    "search_tasks",
    {
      description:
        `Search Recruit CRM tasks and return compact summaries designed for large result sets. ${myRecordsOwnerFilterGuidance} Returns related_to and related_to_type values that can be used to open related entities in Recruit CRM app URLs like https://app.recruitcrm.io/{related_to_type}/{related_to}.`,
      inputSchema: searchTasksInputSchema,
      outputSchema: searchTasksOutputSchema,
      annotations: {
        readOnlyHint: true,
      },
    },
    async (args) => formatResult(await executeSearchTasks(client, args)),
  );

  server.registerTool(
    "list_task_types",
    {
      description:
        "List Recruit CRM task types and return compact id/label rows. Use this before create_task to resolve a requested task type label to task_type_id; if no type is requested, choose the most relevant available type before creating.",
      inputSchema: {},
      outputSchema: listTaskTypesOutputSchema,
      annotations: {
        readOnlyHint: true,
      },
    },
    async () => formatResult(await executeListTaskTypes(client)),
  );

  server.registerTool(
    "create_task",
    {
      description:
        "Create one Recruit CRM task. This tool modifies data in Recruit CRM and should only be used when explicitly requested. Use list_task_types first to resolve task_type_id; if the user requested a specific type, create only when that type exists. Requires owner_id for the assigned user and created_by for the creating user; use list_users to resolve known names or emails, otherwise ask. Requires description and supports basic HTML/rich text. Returns compact output without the related entity payload.",
      inputSchema: createTaskInputSchema,
      outputSchema: createTaskOutputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
    },
    async (args) => formatResult(await executeCreateTask(client, args)),
  );

  server.registerTool(
    "search_meetings",
    {
      description:
        `Search Recruit CRM meetings and return compact summaries designed for large result sets. ${myRecordsOwnerFilterGuidance} Returns related_to and related_to_type values that can be used to open related entities in Recruit CRM app URLs like https://app.recruitcrm.io/{related_to_type}/{related_to}.`,
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
      description:
        `Search Recruit CRM notes and return compact summaries designed for large result sets. ${unsupportedOwnerFilterGuidance} Returns related_to and related_to_type values that can be used to open related entities in Recruit CRM app URLs like https://app.recruitcrm.io/{related_to_type}/{related_to}.`,
      inputSchema: searchNotesInputSchema,
      outputSchema: searchNotesOutputSchema,
      annotations: {
        readOnlyHint: true,
      },
    },
    async (args) => formatResult(await executeSearchNotes(client, args)),
  );

  server.registerTool(
    "list_note_types",
    {
      description:
        "List Recruit CRM note types and return compact id/label rows. Use this before create_note to resolve a requested note type label to note_type_id; if no type is requested, choose the most relevant available type before creating.",
      inputSchema: {},
      outputSchema: listNoteTypesOutputSchema,
      annotations: {
        readOnlyHint: true,
      },
    },
    async () => formatResult(await executeListNoteTypes(client)),
  );

  server.registerTool(
    "create_note",
    {
      description:
        "Create one Recruit CRM note. This tool modifies data in Recruit CRM and should only be used when explicitly requested. Use list_note_types first to resolve note_type_id; if the user requested a specific type, create only when that type exists. Requires created_by as a Recruit CRM user id; use list_users to resolve a known user name or email, otherwise ask. Supports basic HTML/rich text in description and returns compact output without the related entity payload.",
      inputSchema: createNoteInputSchema,
      outputSchema: createNoteOutputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
    },
    async (args) => formatResult(await executeCreateNote(client, args)),
  );

  server.registerTool(
    "search_call_logs",
    {
      description:
        `Search Recruit CRM call logs and return compact summaries designed for large result sets. ${unsupportedOwnerFilterGuidance} Returns related_to and related_to_type values that can be used to open related entities in Recruit CRM app URLs like https://app.recruitcrm.io/{related_to_type}/{related_to}.`,
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
      description:
        "Fetch full details for up to 10 candidates in parallel by slug. Use this when the user asks for details on a specific set of candidates (e.g. after they pick a shortlist from search_candidates). If ownership matters, first use owner-scoped search_candidates. Do NOT use for bulk scans of the whole database — use search_candidates or list_candidates for that. Returns partial results: one bad slug will not fail the batch, failures are reported in the errors array with status_code.",
      inputSchema: getCandidateDetailsInputSchema,
      outputSchema: candidateDetailsOutputSchema,
      annotations: {
        readOnlyHint: true,
      },
    },
    async (args) => formatResult(await executeGetCandidateDetails(client, args)),
  );

  server.registerTool(
    "get_job_details",
    {
      description:
        "Fetch one Recruit CRM job by slug and return the raw Recruit CRM payload. If ownership matters, first use owner-scoped search_jobs. The raw payload may include resource_url and application_form_url for opening the job directly in Recruit CRM.",
      inputSchema: {
        job_slug: textFilterSchema.describe("Job slug."),
      },
      outputSchema: jobDetailOutputSchema,
      annotations: {
        readOnlyHint: true,
      },
    },
    async ({ job_slug }) => formatResult(await executeGetJobDetails(client, job_slug)),
  );

  server.registerTool(
    "get_company_details",
    {
      description:
        "Fetch full details for up to 10 companies in parallel by slug. Use this when the user asks for details on a specific set of companies (e.g. after they pick results from search_companies). If ownership matters, first use owner-scoped search_companies. Do NOT use for bulk scans of the whole database — use search_companies or list_companies for that. Returns partial results: one bad slug will not fail the batch, failures are reported in the errors array with status_code.",
      inputSchema: getCompanyDetailsInputSchema,
      outputSchema: companyDetailsOutputSchema,
      annotations: {
        readOnlyHint: true,
      },
    },
    async (args) => formatResult(await executeGetCompanyDetails(client, args)),
  );

  server.registerTool(
    "get_contact_details",
    {
      description:
        "Fetch full details for up to 10 contacts in parallel by slug. Use this when the user asks for details on a specific set of contacts (e.g. after they pick results from search_contacts). If ownership matters, first use owner-scoped search_contacts. Do NOT use for full-database scans — use search_contacts or list_contacts for that. Returns partial results: one bad slug will not fail the batch, failures are reported in the errors array with status_code.",
      inputSchema: getContactDetailsInputSchema,
      outputSchema: contactDetailsOutputSchema,
      annotations: {
        readOnlyHint: true,
      },
    },
    async (args) => formatResult(await executeGetContactDetails(client, args)),
  );

  server.registerTool(
    "get_job_assigned_candidates",
    {
      description:
        "Fetch assigned candidates for one Recruit CRM job and return compact assignment summaries. If the user says 'my job', first resolve the job through owner-scoped search_jobs. Use list_candidate_hiring_stages to resolve labels like Placed to stage ids for the status_id filter. Returns candidate_slug values that can be used to open Recruit CRM candidate URLs like https://app.recruitcrm.io/candidate/{candidate_slug}.",
      inputSchema: getJobAssignedCandidatesInputSchema,
      outputSchema: getJobAssignedCandidatesOutputSchema,
      annotations: {
        readOnlyHint: true,
      },
    },
    async ({ job_slug, page, limit, status_id }) =>
      formatResult(await executeGetJobAssignedCandidates(client, job_slug, { page, limit, status_id })),
  );

  server.registerTool(
    "list_candidate_hiring_stages",
    {
      description:
        "List Recruit CRM candidate hiring stages and return compact stage rows for resolving labels to stage ids used by get_job_assigned_candidates.status_id.",
      inputSchema: {},
      outputSchema: listCandidateHiringStagesOutputSchema,
      annotations: {
        readOnlyHint: true,
      },
    },
    async () => formatResult(await executeListCandidateHiringStages(client)),
  );

  server.registerTool(
    "list_job_statuses",
    {
      description:
        "List Recruit CRM job pipeline statuses (e.g. Open, Closed, On Hold, plus any custom statuses configured for the account). Returns compact rows with id and label so the LLM can resolve a status name (including custom labels) to the numeric job_status_id used by search_jobs.job_status. Use this whenever the user references a job status by name and the upstream filter needs the id.",
      inputSchema: {},
      outputSchema: listJobStatusesOutputSchema,
      annotations: {
        readOnlyHint: true,
      },
    },
    async () => formatResult(await executeListJobStatuses(client)),
  );

  server.registerTool(
    "get_candidate_job_assignment_hiring_stage_history",
    {
      description:
        "Fetch one candidate's job assignment hiring stage history by candidate slug. Returns compact entries with job, company, stage, remark, and update metadata.",
      inputSchema: {
        candidate_slug: textFilterSchema.describe("Candidate slug."),
      },
      outputSchema: candidateJobAssignmentHiringStageHistoryOutputSchema,
      annotations: {
        readOnlyHint: true,
      },
    },
    async ({ candidate_slug }) =>
      formatResult(await executeGetCandidateJobAssignmentHiringStageHistory(client, candidate_slug)),
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

  server.registerTool(
    "analyze_job_pipeline",
    {
      description:
        "Diagnose a single Recruit CRM job's hiring pipeline in one call: stage-by-stage candidate distribution, days_in_current_stage per active candidate (sourced from assignment-level stage_date by default — cheap, ~7 API hits), idle / at-risk candidates, bottleneck stage verdict, recent notes / meetings / tasks tied to the job, and suggested next actions. Use this for prompts like \"how's job X doing\", \"is this role stuck\", \"review my pipeline for X\", \"any bottlenecks\", \"who's been sitting too long\", \"what should I do next on this job\". For prompts that ask about time-to-hire, time-to-offer, time-to-interview, time-to-first-action, or any \"how long does it take to …\" question, set include_time_metrics=true — this fetches per-candidate /history for capped active + Placed candidates and populates the time_metrics block. Default include_time_metrics=false keeps the call cheap; only flip it on when time-based metrics are explicitly requested. Requires the job slug — if the user only gave a job name or title, FIRST call search_jobs to resolve the slug, then call this; never ask the user for a slug. If the user implies self-ownership (\"my jobs\", \"my pipeline\"), resolve their user_id via list_users first, then filter search_jobs by owner_id. Candidate slugs in the response can be hyperlinked as https://app.recruitcrm.io/candidate/{candidate_slug}. Call logs are not included because the Recruit CRM API does not support filtering call logs by job.",
      inputSchema: analyzeJobPipelineInputSchema,
      outputSchema: analyzeJobPipelineOutputSchema,
      annotations: {
        readOnlyHint: true,
      },
    },
    async (args) =>
      formatResult(await executeAnalyzeJobPipeline(client, args as AnalyzeJobPipelineInput)),
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

  return mapSearchCandidatesResult(result, {
    includeContactInfo: args.include_contact_info ?? false,
  });
}

export async function executeListCandidates(
  client: RecruitCrmClient,
  args: ListCandidatesInput,
): Promise<SearchCandidatesResult> {
  const result = await client.listCandidates({
    limit: args.limit ?? 100,
    page: args.page ?? 1,
    sort_by: args.sort_by ?? "updatedon",
    sort_order: args.sort_order ?? "desc",
  });

  return mapSearchCandidatesResult(result, {
    includeContactInfo: args.include_contact_info ?? false,
  });
}

export async function executeListJobs(client: RecruitCrmClient, args: ListJobsInput): Promise<SearchJobsResult> {
  const result = await client.listJobs({
    limit: args.limit ?? 100,
    page: args.page ?? 1,
    sort_by: args.sort_by ?? "updatedon",
    sort_order: args.sort_order ?? "desc",
  });

  return mapSearchJobsResult(result);
}

export async function executeListCompanies(
  client: RecruitCrmClient,
  args: ListCompaniesInput,
): Promise<SearchCompaniesResult> {
  const result = await client.listCompanies({
    limit: args.limit ?? 100,
    page: args.page ?? 1,
    sort_by: args.sort_by ?? "updatedon",
    sort_order: args.sort_order ?? "desc",
  });

  return mapSearchCompaniesResult(result);
}

export async function executeListContacts(
  client: RecruitCrmClient,
  args: ListContactsInput,
): Promise<SearchContactsResult> {
  const result = await client.listContacts({
    limit: args.limit ?? 100,
    page: args.page ?? 1,
    sort_by: args.sort_by ?? "updatedon",
    sort_order: args.sort_order ?? "desc",
  });

  return mapSearchContactsResult(result, {
    includeContactInfo: args.include_contact_info ?? false,
  });
}

export async function executeListUsers(client: RecruitCrmClient, args: ListUsersInput): Promise<ListUsersResult> {
  const result = await client.listUsers({
    include_teams: args.include_teams ?? false,
  });

  return mapListUsersResult(result, {
    includeTeams: args.include_teams ?? false,
    includeContactInfo: args.include_contact_info ?? false,
  });
}

export async function executeSearchJobs(client: RecruitCrmClient, args: SearchJobsInput): Promise<SearchJobsResult> {
  const result = await client.searchJobs({
    page: args.page ?? 1,
    city: args.city,
    company_name: args.company_name,
    company_slug: args.company_slug,
    contact_email: args.contact_email,
    contact_name: args.contact_name,
    contact_number: args.contact_number,
    contact_slug: args.contact_slug,
    country: args.country,
    created_from: args.created_from,
    created_to: args.created_to,
    enable_job_application_form: args.enable_job_application_form,
    exact_search: args.exact_search,
    full_address: args.full_address,
    job_category: args.job_category,
    job_skill: args.job_skill,
    job_slug: args.job_slug,
    job_status: args.job_status,
    job_type: args.job_type,
    limit: args.limit ?? 100,
    locality: args.locality,
    name: args.name,
    note_for_candidates: args.note_for_candidates,
    owner_email: args.owner_email,
    owner_id: args.owner_id,
    owner_name: args.owner_name,
    secondary_contact_email: args.secondary_contact_email,
    secondary_contact_name: args.secondary_contact_name,
    secondary_contact_number: args.secondary_contact_number,
    secondary_contact_slug: args.secondary_contact_slug,
    sort_by: args.sort_by ?? "updatedon",
    sort_order: args.sort_order ?? "desc",
    updated_from: args.updated_from,
    updated_to: args.updated_to,
  });

  return mapSearchJobsResult(result);
}

export async function executeSearchCompanies(
  client: RecruitCrmClient,
  args: SearchCompaniesInput,
): Promise<SearchCompaniesResult> {
  const result = await client.searchCompanies({
    page: args.page ?? 1,
    company_name: args.company_name,
    created_from: args.created_from,
    created_to: args.created_to,
    marked_as_off_limit: args.marked_as_off_limit,
    owner_email: args.owner_email,
    owner_id: args.owner_id,
    owner_name: args.owner_name,
    updated_from: args.updated_from,
    updated_to: args.updated_to,
    company_slug: args.company_slug,
    exact_search: args.exact_search,
    sort_by: args.sort_by ?? "updatedon",
    sort_order: args.sort_order ?? "desc",
  });

  return mapSearchCompaniesResult(result);
}

export async function executeSearchContacts(
  client: RecruitCrmClient,
  args: SearchContactsInput,
): Promise<SearchContactsResult> {
  validateSearchContactsFilters(args);

  const result = await client.searchContacts({
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
    updated_from: args.updated_from,
    updated_to: args.updated_to,
    company_slug: args.company_slug,
    contact_number: args.contact_number,
    contact_slug: args.contact_slug,
    exact_search: args.exact_search,
    sort_by: args.sort_by ?? "updatedon",
    sort_order: args.sort_order ?? "desc",
  });

  return mapSearchContactsResult(result, {
    includeContactInfo: args.include_contact_info ?? false,
  });
}

export async function executeSearchHotlists(
  client: RecruitCrmClient,
  args: SearchHotlistsInput,
): Promise<SearchHotlistsResult> {
  const result = await client.searchHotlists({
    page: args.page ?? 1,
    name: args.name,
    shared: args.shared,
    related_to_type: args.related_to_type,
  });

  return mapSearchHotlistsResult(result, {
    includeRelatedSlugs: Boolean(args.name),
  });
}

export async function executeCreateHotlist(
  client: RecruitCrmClient,
  args: CreateHotlistInput,
): Promise<CreateHotlistResult> {
  const result = await client.createHotlist(args);
  return mapCreateHotlistResult(result);
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

export async function executeListTaskTypes(client: RecruitCrmClient): Promise<ListTaskTypesResult> {
  const result = await client.listTaskTypes();

  return mapListTaskTypesResult(result);
}

export async function executeCreateTask(client: RecruitCrmClient, args: CreateTaskInput): Promise<CreateTaskResult> {
  validateRelatedFilters(args);

  const taskTypes = await client.listTaskTypes();
  validateTaskTypeId(args.task_type_id, taskTypes);

  const result = await client.createTask(args);

  return mapCreateTaskResult(result);
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

export async function executeListNoteTypes(client: RecruitCrmClient): Promise<ListNoteTypesResult> {
  const result = await client.listNoteTypes();

  return mapListNoteTypesResult(result);
}

export async function executeCreateNote(client: RecruitCrmClient, args: CreateNoteInput): Promise<CreateNoteResult> {
  const noteTypes = await client.listNoteTypes();
  validateNoteTypeId(args.note_type_id, noteTypes);

  const result = await client.createNote(args);

  return mapCreateNoteResult(result);
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
  args: GetCandidateDetailsInput,
): Promise<CandidateDetailsResult> {
  const uniqueSlugs = Array.from(new Set(args.candidate_slugs));
  const settled = await Promise.allSettled(
    uniqueSlugs.map((slug) => client.getCandidateDetails(slug)),
  );

  const candidates: CandidateDetail[] = [];
  const errors: CandidateDetailsError[] = [];

  settled.forEach((outcome, idx) => {
    const slug = uniqueSlugs[idx];
    if (outcome.status === "fulfilled") {
      candidates.push(outcome.value);
    } else {
      const reason = outcome.reason;
      errors.push({
        slug,
        error: reason instanceof Error ? reason.message : String(reason),
        status_code: reason instanceof RecruitCrmApiError ? reason.statusCode ?? null : null,
      });
    }
  });

  return {
    requested_count: uniqueSlugs.length,
    successful_count: candidates.length,
    failed_count: errors.length,
    candidates,
    errors,
  };
}

export async function executeGetJobDetails(client: RecruitCrmClient, jobSlug: string): Promise<JobDetail> {
  return client.getJobDetails(jobSlug);
}

export async function executeGetCompanyDetails(
  client: RecruitCrmClient,
  args: GetCompanyDetailsInput,
): Promise<CompanyDetailsResult> {
  const uniqueSlugs = Array.from(new Set(args.company_slugs));
  const settled = await Promise.allSettled(uniqueSlugs.map((slug) => client.getCompanyDetails(slug)));

  const companies: CompanyDetail[] = [];
  const errors: CompanyDetailsError[] = [];

  settled.forEach((outcome, idx) => {
    const slug = uniqueSlugs[idx];
    if (outcome.status === "fulfilled") {
      companies.push(outcome.value);
    } else {
      const reason = outcome.reason;
      errors.push({
        slug,
        error: reason instanceof Error ? reason.message : String(reason),
        status_code: reason instanceof RecruitCrmApiError ? reason.statusCode ?? null : null,
      });
    }
  });

  return {
    requested_count: uniqueSlugs.length,
    successful_count: companies.length,
    failed_count: errors.length,
    companies,
    errors,
  };
}

export async function executeGetContactDetails(
  client: RecruitCrmClient,
  args: GetContactDetailsInput,
): Promise<ContactDetailsResult> {
  const uniqueSlugs = Array.from(new Set(args.contact_slugs));
  const settled = await Promise.allSettled(uniqueSlugs.map((slug) => client.getContactDetails(slug)));

  const contacts: ContactDetail[] = [];
  const errors: ContactDetailsError[] = [];

  settled.forEach((outcome, idx) => {
    const slug = uniqueSlugs[idx];
    if (outcome.status === "fulfilled") {
      contacts.push(outcome.value);
    } else {
      const reason = outcome.reason;
      errors.push({
        slug,
        error: reason instanceof Error ? reason.message : String(reason),
        status_code: reason instanceof RecruitCrmApiError ? reason.statusCode ?? null : null,
      });
    }
  });

  return {
    requested_count: uniqueSlugs.length,
    successful_count: contacts.length,
    failed_count: errors.length,
    contacts,
    errors,
  };
}

export async function executeAddRecordsToHotlist(
  client: RecruitCrmClient,
  args: AddRecordsToHotlistInput,
): Promise<AddRecordsToHotlistResult> {
  const uniqueSlugs = Array.from(new Set(args.related_slugs));
  const addedSlugs: string[] = [];
  const errors: Array<{
    slug: string;
    error: string;
    status_code: number | null;
  }> = [];

  for (const slug of uniqueSlugs) {
    try {
      await client.addRecordToHotlist(args.hotlist_id, slug);
      addedSlugs.push(slug);
    } catch (error) {
      errors.push({
        slug,
        error: error instanceof Error ? error.message : String(error),
        status_code: error instanceof RecruitCrmApiError ? error.statusCode ?? null : null,
      });
    }
  }

  return {
    hotlist_id: args.hotlist_id,
    requested_count: uniqueSlugs.length,
    successful_count: addedSlugs.length,
    failed_count: errors.length,
    added_slugs: addedSlugs,
    errors,
  };
}

export async function executeGetJobAssignedCandidates(
  client: RecruitCrmClient,
  jobSlug: string,
  args: GetJobAssignedCandidatesInput,
): Promise<JobAssignedCandidatesResult> {
  const result = await client.getJobAssignedCandidates(jobSlug, {
    page: args.page ?? 1,
    limit: args.limit ?? 100,
    status_id: args.status_id,
  });

  return mapJobAssignedCandidatesResult(jobSlug, result);
}

export async function executeListCandidateHiringStages(
  client: RecruitCrmClient,
): Promise<CandidateHiringStagesResult> {
  const result = await client.listCandidateHiringStages();

  return mapCandidateHiringStagesResult(result);
}

export async function executeListJobStatuses(
  client: RecruitCrmClient,
): Promise<JobStatusesResult> {
  const result = await client.listJobStatuses();

  return mapJobStatusesResult(result);
}

export async function executeGetCandidateJobAssignmentHiringStageHistory(
  client: RecruitCrmClient,
  candidateSlug: string,
): Promise<CandidateJobAssignmentHiringStageHistoryResult> {
  const result = await client.getCandidateJobAssignmentHiringStageHistory(candidateSlug);

  return mapCandidateJobAssignmentHiringStageHistoryResult(candidateSlug, result);
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

function validateNoteTypeId(noteTypeId: number, noteTypes: RecruitCrmNoteType[]): void {
  const match = noteTypes.some((noteType) => {
    if (noteType.id === undefined || noteType.id === null || noteType.id === "") {
      return false;
    }

    return Number(noteType.id) === noteTypeId;
  });

  if (match) {
    return;
  }

  const availableTypes = noteTypes
    .slice(0, 10)
    .map((noteType) => {
      const label = noteType.label === undefined || noteType.label === null ? "Unlabeled" : String(noteType.label);
      return `${label} (${String(noteType.id ?? "no id")})`;
    })
    .join(", ");

  throw new RecruitCrmApiError(
    `Unknown note_type_id ${noteTypeId}. Call list_note_types and use one of the returned note type IDs.${availableTypes ? ` Available examples: ${availableTypes}.` : ""}`,
  );
}

function validateTaskTypeId(taskTypeId: number, taskTypes: RecruitCrmTaskType[]): void {
  const match = taskTypes.some((taskType) => {
    if (taskType.id === undefined || taskType.id === null || taskType.id === "") {
      return false;
    }

    return Number(taskType.id) === taskTypeId;
  });

  if (match) {
    return;
  }

  const availableTypes = taskTypes
    .slice(0, 10)
    .map((taskType) => {
      const label = taskType.label === undefined || taskType.label === null ? "Unlabeled" : String(taskType.label);
      return `${label} (${String(taskType.id ?? "no id")})`;
    })
    .join(", ");

  throw new RecruitCrmApiError(
    `Unknown task_type_id ${taskTypeId}. Call list_task_types and use one of the returned task type IDs.${availableTypes ? ` Available examples: ${availableTypes}.` : ""}`,
  );
}

function validateSearchContactsFilters(args: SearchContactsInput): void {
  const filterKeys: Array<keyof SearchContactsInput> = [
    "created_from",
    "created_to",
    "email",
    "first_name",
    "last_name",
    "linkedin",
    "marked_as_off_limit",
    "owner_email",
    "owner_id",
    "owner_name",
    "updated_from",
    "updated_to",
    "company_slug",
    "contact_number",
    "contact_slug",
  ];

  const hasAtLeastOneFilter = filterKeys.some((key) => args[key] !== undefined);

  if (!hasAtLeastOneFilter) {
    throw new RecruitCrmApiError(
      "search_contacts requires at least one filter. sort_by, sort_order, page, exact_search, and include_contact_info do not count by themselves.",
    );
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
    | SearchCompaniesResult
    | SearchContactsResult
    | SearchHotlistsResult
    | SearchJobsResult
    | SearchMeetingsResult
    | SearchNotesResult
    | SearchCallLogsResult
    | SearchTasksResult
    | ListUsersResult
    | ListNoteTypesResult
    | ListTaskTypesResult
    | CreateHotlistResult
    | CreateNoteResult
    | CreateTaskResult
    | CandidateDetailsResult
    | CompanyDetailsResult
    | ContactDetailsResult
    | AddRecordsToHotlistResult
    | JobDetail
    | JobAssignedCandidatesResult
    | CandidateHiringStagesResult
    | JobStatusesResult
    | CandidateJobAssignmentHiringStageHistoryResult
    | CandidateCustomFieldListResult
    | CandidateCustomFieldDetail
    | AnalyzeJobPipelineResult,
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

// =====================================================================
// analyze_job_pipeline — composite executor + helpers
// =====================================================================

const ANALYZE_JOB_PIPELINE_STAGE_HISTORY_BATCH = 10;
const ANALYZE_JOB_PIPELINE_ASSIGNED_PAGE_LIMIT = 100;
const ANALYZE_JOB_PIPELINE_PAGES_PER_WINDOW = 3;
const ANALYZE_JOB_PIPELINE_ACTIVITY_WINDOW_DAYS = 30;
const ANALYZE_JOB_PIPELINE_VIEW_URL_PREFIX = "https://app.recruitcrm.io/job/";

type AnalyzeStageHistoryItem = RecruitCrmCandidateJobAssignmentHiringStageHistoryItem;

export async function executeAnalyzeJobPipeline(
  client: RecruitCrmClient,
  args: AnalyzeJobPipelineInput,
): Promise<AnalyzeJobPipelineResult> {
  const startPage = args.start_page ?? ANALYZE_JOB_PIPELINE_DEFAULTS.startPage;
  const idleThreshold = args.idle_days_threshold ?? ANALYZE_JOB_PIPELINE_DEFAULTS.idleDaysThreshold;
  const maxActive = args.max_active_candidates ?? ANALYZE_JOB_PIPELINE_DEFAULTS.maxActiveCandidates;
  const maxPlaced = args.max_placed_candidates ?? ANALYZE_JOB_PIPELINE_DEFAULTS.maxPlacedCandidates;
  const terminalLabels = (
    args.terminal_stage_labels ?? ANALYZE_JOB_PIPELINE_DEFAULTS.terminalStageLabels
  ).map((label) => label.trim().toLowerCase());
  const hireLabels = ANALYZE_JOB_PIPELINE_DEFAULTS.hireStageLabels.map((l) => l.trim().toLowerCase());
  const intakeLabels = ANALYZE_JOB_PIPELINE_DEFAULTS.intakeStageLabels.map((l) => l.trim().toLowerCase());
  // Auto-skip activity on follow-up windows to avoid redundant calls.
  const includeActivity = startPage === 1 ? args.include_activity ?? true : false;
  // Time metrics are opt-in. When false (default), we skip ALL per-candidate /history calls
  // and use the assignments endpoint's stage_date for days_in_current_stage. ~7 calls total.
  const includeTimeMetrics = args.include_time_metrics ?? false;

  const errors: AnalyzeJobPipelineError[] = [];
  const truncated: AnalyzeJobPipelineResult["truncated"] = {};

  const [job, ownerName] = await Promise.all([
    client.getJobDetails(args.job_slug),
    fetchAnalyzeUserNameMap(client).catch(() => new Map<number, string>()),
  ]).then(([j, users]) => {
    const ownerId = toAnalyzeFiniteNumber(j.owner);
    return [j, ownerId !== null ? users.get(ownerId) ?? null : null] as const;
  });
  const jobHeader = buildAnalyzeJobHeader(args.job_slug, job, ownerName);

  const { assignments, lastFetchedPage, hasMoreAfterWindow } = await fetchAssignmentsWindow(
    client,
    args.job_slug,
    startPage,
    errors,
  );
  const endPage = lastFetchedPage ?? startPage;
  const nextWindowStartPage = hasMoreAfterWindow ? endPage + 1 : null;
  if (hasMoreAfterWindow) {
    truncated.assignments = true;
  }

  const activeAssignments: AssignedCandidateSummary[] = [];
  const placedAssignments: AssignedCandidateSummary[] = [];
  const terminalStagesSummary: Record<string, number> = {};
  for (const assignment of assignments) {
    if (isAnalyzeTerminal(assignment.status_label, terminalLabels)) {
      const key = assignment.status_label ?? "Unknown";
      terminalStagesSummary[key] = (terminalStagesSummary[key] ?? 0) + 1;
      if (isAnalyzeHired(assignment.status_label, hireLabels)) {
        placedAssignments.push(assignment);
      }
    } else {
      activeAssignments.push(assignment);
    }
  }
  const terminalCount = assignments.length - activeAssignments.length;

  // History fetching is gated by include_time_metrics. Default is OFF — we use stage_date
  // from the assignments payload for days_in_current_stage and skip all /history calls.
  let historyByCandidate: Map<string, AnalyzeStageHistoryItem[]> = new Map();
  let placedHistoryByCandidate: Map<string, AnalyzeStageHistoryItem[]> = new Map();
  let activeHistoryFetched = 0;
  let placedHistoryFetched = 0;

  if (includeTimeMetrics) {
    const candidatesForHistory = activeAssignments.slice(0, maxActive);
    if (activeAssignments.length > maxActive) {
      truncated.active_candidates = true;
    }
    if (candidatesForHistory.length > 0) {
      historyByCandidate = await fetchAnalyzeStageHistories(
        client,
        candidatesForHistory.map((a) => a.candidate_slug),
        errors,
        "stage_history",
      );
      activeHistoryFetched = candidatesForHistory.length;
    }

    const placedForHistory = placedAssignments.slice(0, maxPlaced);
    if (placedAssignments.length > maxPlaced) {
      truncated.placed_candidates = true;
    }
    if (placedForHistory.length > 0) {
      placedHistoryByCandidate = await fetchAnalyzeStageHistories(
        client,
        placedForHistory.map((a) => a.candidate_slug),
        errors,
        "placed_history",
      );
      placedHistoryFetched = placedForHistory.length;
    }
  }

  const stageGroups = buildAnalyzeStageGroups(
    activeAssignments,
    historyByCandidate,
    args.job_slug,
  );
  const idleCandidates = buildAnalyzeIdleList(stageGroups, idleThreshold);
  const bottleneck = computeAnalyzeBottleneck(stageGroups);

  const timeMetrics = includeTimeMetrics
    ? buildAnalyzeTimeMetrics({
        jobSlug: args.job_slug,
        activeAssignments,
        placedAssignments,
        historyByCandidate,
        placedHistoryByCandidate,
        intakeLabels,
        activeHistoryFetched,
        placedHistoryFetched,
      })
    : null;

  const activity = includeActivity ? await fetchAnalyzeActivity(client, args.job_slug, errors) : null;

  const suggested = buildAnalyzeSuggestedActions({
    activeCount: activeAssignments.length,
    terminalCount,
    placedCount: placedAssignments.length,
    idleCandidates,
    bottleneck,
    activity,
    timeMetrics,
    includeTimeMetrics,
    idleThreshold,
    truncated,
    startPage,
    endPage,
    analyzedCount: assignments.length,
    nextWindowStartPage,
  });

  return {
    job: jobHeader,
    pipeline: {
      window: {
        start_page: startPage,
        end_page: endPage,
        analyzed_count: assignments.length,
      },
      next_window: nextWindowStartPage !== null ? { start_page: nextWindowStartPage } : null,
      total_assigned_in_window: assignments.length,
      active_count: activeAssignments.length,
      terminal_count: terminalCount,
      terminal_stages_summary: terminalStagesSummary,
      stages: stageGroups,
    },
    bottleneck,
    idle_candidates: idleCandidates,
    activity,
    time_metrics: timeMetrics,
    truncated,
    errors,
    suggested_actions: suggested,
  };
}

function buildAnalyzeJobHeader(
  jobSlug: string,
  job: JobDetail,
  ownerName: string | null,
): AnalyzeJobPipelineResult["job"] {
  const status = job.job_status as { label?: unknown } | undefined | null;
  const statusLabel = typeof status?.label === "string" ? status.label : null;
  const createdOn = typeof job.created_on === "string" ? job.created_on : null;

  return {
    slug: jobSlug,
    name: typeof job.name === "string" ? job.name : null,
    status_label: statusLabel,
    owner: toAnalyzeFiniteNumber(job.owner),
    owner_name: ownerName,
    company_slug: typeof job.company_slug === "string" ? job.company_slug : null,
    created_on: createdOn,
    days_open: createdOn ? analyzeDaysBetween(createdOn) : null,
    number_of_openings: toAnalyzeFiniteNumber(job.number_of_openings),
    view_url: `${ANALYZE_JOB_PIPELINE_VIEW_URL_PREFIX}${jobSlug}`,
  };
}

async function fetchAnalyzeUserNameMap(
  client: RecruitCrmClient,
): Promise<Map<number, string>> {
  const users = await client.listUsers({ include_teams: false });
  const map = new Map<number, string>();
  for (const u of users) {
    const id = toAnalyzeFiniteNumber(u.id);
    if (id === null) continue;
    const first = typeof u.first_name === "string" ? u.first_name.trim() : "";
    const last = typeof u.last_name === "string" ? u.last_name.trim() : "";
    const full = `${first} ${last}`.trim();
    if (full.length > 0) map.set(id, full);
  }
  return map;
}

async function fetchAssignmentsWindow(
  client: RecruitCrmClient,
  jobSlug: string,
  startPage: number,
  errors: AnalyzeJobPipelineError[],
): Promise<{
  assignments: AssignedCandidateSummary[];
  lastFetchedPage: number | null;
  hasMoreAfterWindow: boolean;
}> {
  const out: AssignedCandidateSummary[] = [];
  let lastFetchedPage: number | null = null;
  let lastNextPageUrl: string | null = null;
  let lastDataLength = 0;

  for (let offset = 0; offset < ANALYZE_JOB_PIPELINE_PAGES_PER_WINDOW; offset += 1) {
    const page = startPage + offset;
    let result: unknown;
    try {
      result = await client.getJobAssignedCandidates(jobSlug, {
        page,
        limit: ANALYZE_JOB_PIPELINE_ASSIGNED_PAGE_LIMIT,
      });
    } catch (error) {
      errors.push(buildAnalyzeErrorEntry("assignments", error));
      // Stop the loop on mid-window failure; we don't know what's beyond.
      return { assignments: out, lastFetchedPage, hasMoreAfterWindow: false };
    }

    const dataArray = (result as { data?: unknown }).data;
    const items = Array.isArray(dataArray) ? dataArray : [];
    if (items.length === 0 && offset > 0) {
      // Empty page beyond the first attempt — stop early but still record this page as fetched.
      lastFetchedPage = page;
      lastNextPageUrl = null;
      lastDataLength = 0;
      break;
    }

    for (const raw of items) {
      const summary = mapAnalyzeRawAssignment(raw);
      if (summary) out.push(summary);
    }

    lastFetchedPage = page;
    lastDataLength = items.length;
    const nextPageUrl = (result as { next_page_url?: string | null }).next_page_url;
    lastNextPageUrl = typeof nextPageUrl === "string" && nextPageUrl.length > 0 ? nextPageUrl : null;

    if (!lastNextPageUrl && items.length < ANALYZE_JOB_PIPELINE_ASSIGNED_PAGE_LIMIT) {
      // Definitively the last page.
      break;
    }
  }

  // Determine "more beyond window" without an extra probe call:
  // - prefer next_page_url presence on the last successfully-fetched page;
  // - fall back to "page was full" heuristic when next_page_url is missing.
  const hasMoreAfterWindow =
    lastNextPageUrl !== null || lastDataLength === ANALYZE_JOB_PIPELINE_ASSIGNED_PAGE_LIMIT;

  return { assignments: out, lastFetchedPage, hasMoreAfterWindow };
}

function mapAnalyzeRawAssignment(raw: unknown): AssignedCandidateSummary | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const candidate = r.candidate as Record<string, unknown> | undefined;
  const status = r.status as Record<string, unknown> | undefined;
  const slug = candidate?.slug;
  if (typeof slug !== "string" || slug.length === 0) return null;

  return {
    candidate_slug: slug,
    first_name: typeof candidate?.first_name === "string" ? (candidate.first_name as string) : null,
    last_name: typeof candidate?.last_name === "string" ? (candidate.last_name as string) : null,
    position: typeof candidate?.position === "string" ? (candidate.position as string) : null,
    current_organization:
      typeof candidate?.current_organization === "string"
        ? (candidate.current_organization as string)
        : null,
    current_status:
      typeof candidate?.current_status === "string" ? (candidate.current_status as string) : null,
    city: typeof candidate?.city === "string" ? (candidate.city as string) : null,
    country: typeof candidate?.country === "string" ? (candidate.country as string) : null,
    updated_on:
      typeof candidate?.updated_on === "string" ? (candidate.updated_on as string) : null,
    stage_date: typeof r.stage_date === "string" ? (r.stage_date as string) : null,
    status_id: toAnalyzeFiniteNumber(status?.status_id),
    status_label: typeof status?.label === "string" ? (status.label as string) : null,
  };
}

async function fetchAnalyzeStageHistories(
  client: RecruitCrmClient,
  slugs: string[],
  errors: AnalyzeJobPipelineError[],
  errorSource: AnalyzeJobPipelineError["source"] = "stage_history",
): Promise<Map<string, AnalyzeStageHistoryItem[]>> {
  const result = new Map<string, AnalyzeStageHistoryItem[]>();
  for (let i = 0; i < slugs.length; i += ANALYZE_JOB_PIPELINE_STAGE_HISTORY_BATCH) {
    const batch = slugs.slice(i, i + ANALYZE_JOB_PIPELINE_STAGE_HISTORY_BATCH);
    const settled = await Promise.allSettled(
      batch.map((slug) => client.getCandidateJobAssignmentHiringStageHistory(slug)),
    );
    settled.forEach((outcome, idx) => {
      const slug = batch[idx];
      if (outcome.status === "fulfilled") {
        const items = (outcome.value as unknown as AnalyzeStageHistoryItem[]) ?? [];
        result.set(slug, items);
      } else {
        errors.push(buildAnalyzeErrorEntry(errorSource, outcome.reason, slug));
      }
    });
  }
  return result;
}

function buildAnalyzeStageGroups(
  active: AssignedCandidateSummary[],
  historyByCandidate: Map<string, AnalyzeStageHistoryItem[]>,
  jobSlug: string,
): AnalyzeJobPipelineStageGroup[] {
  const groupMap = new Map<string, AnalyzeJobPipelineStageGroup>();

  for (const a of active) {
    const label = a.status_label ?? "Unknown";
    const key = `${a.status_id ?? "null"}::${label}`;
    let group = groupMap.get(key);
    if (!group) {
      group = {
        stage_id: a.status_id,
        label,
        count: 0,
        candidates: [],
      };
      groupMap.set(key, group);
    }
    group.count += 1;

    const history = historyByCandidate.get(a.candidate_slug);
    const filtered = history
      ? history
          .filter((h) => typeof h.job_slug === "string" && h.job_slug === jobSlug)
          .sort((x, y) => analyzeSortDescByUpdatedOn(x, y))
      : null;

    let daysInCurrentStage: number | null = null;

    if (filtered && filtered.length > 0) {
      const latest = filtered[0];
      const currentStageId = toAnalyzeFiniteNumber(latest.candidate_status_id);
      const enteredAt =
        findAnalyzeEntryIntoCurrentStage(filtered, currentStageId) ??
        analyzeStringOrNull(latest.updated_on);
      if (enteredAt) daysInCurrentStage = analyzeDaysBetween(enteredAt);
    } else if (a.stage_date) {
      // No history fetched (or no entries match this job_slug) → use assignment-level stage_date.
      // This is the default path when include_time_metrics=false (saves N /history calls).
      daysInCurrentStage = analyzeDaysBetween(a.stage_date);
    }

    group.candidates.push({
      candidate_slug: a.candidate_slug,
      name: buildAnalyzeName(a.first_name, a.last_name),
      days_in_current_stage: daysInCurrentStage,
    });
  }

  return Array.from(groupMap.values()).sort((a, b) => b.count - a.count);
}

function findAnalyzeEntryIntoCurrentStage(
  sortedDesc: AnalyzeStageHistoryItem[],
  currentStageId: number | null,
): string | null {
  let candidateTime: string | null = null;
  for (const entry of sortedDesc) {
    const entryStageId = toAnalyzeFiniteNumber(entry.candidate_status_id);
    const updatedOn = analyzeStringOrNull(entry.updated_on);
    if (entryStageId === currentStageId && updatedOn) {
      candidateTime = updatedOn;
      continue;
    }
    if (entryStageId !== currentStageId) {
      break;
    }
  }
  return candidateTime;
}

function buildAnalyzeIdleList(
  stageGroups: AnalyzeJobPipelineStageGroup[],
  threshold: number,
): AnalyzeJobPipelineIdleCandidate[] {
  const out: AnalyzeJobPipelineIdleCandidate[] = [];
  for (const group of stageGroups) {
    for (const c of group.candidates) {
      if (c.days_in_current_stage !== null && c.days_in_current_stage > threshold) {
        out.push({
          candidate_slug: c.candidate_slug,
          name: c.name,
          current_stage: group.label,
          days_in_current_stage: c.days_in_current_stage,
        });
      }
    }
  }
  return out.sort((a, b) => b.days_in_current_stage - a.days_in_current_stage);
}

function computeAnalyzeBottleneck(
  stageGroups: AnalyzeJobPipelineStageGroup[],
): AnalyzeJobPipelineBottleneck | null {
  if (stageGroups.length === 0) return null;

  let best: { group: AnalyzeJobPipelineStageGroup; medianDays: number } | null = null;
  for (const group of stageGroups) {
    const days = group.candidates
      .map((c) => c.days_in_current_stage)
      .filter((d): d is number => typeof d === "number");
    if (days.length === 0) continue;
    const m = analyzeMedian(days);
    if (
      !best ||
      group.count > best.group.count ||
      (group.count === best.group.count && m > best.medianDays)
    ) {
      best = { group, medianDays: m };
    }
  }
  if (!best) return null;
  return {
    stage_label: best.group.label,
    count: best.group.count,
    median_days_in_stage: best.medianDays,
    reason: `Largest active stage (${best.group.count} candidates) with median ${best.medianDays}d in stage`,
  };
}

async function fetchAnalyzeActivity(
  client: RecruitCrmClient,
  jobSlug: string,
  errors: AnalyzeJobPipelineError[],
): Promise<AnalyzeJobPipelineActivity> {
  const since = analyzeIsoDaysAgo(ANALYZE_JOB_PIPELINE_ACTIVITY_WINDOW_DAYS);
  const todayMs = Date.now();

  const [notesOutcome, meetingsOutcome, tasksOutcome] = await Promise.allSettled([
    client.searchNotes({
      page: 1,
      related_to: jobSlug,
      related_to_type: "job",
      updated_from: since,
    }),
    client.searchMeetings({
      page: 1,
      related_to: jobSlug,
      related_to_type: "job",
      updated_from: since,
    }),
    client.searchTasks({
      page: 1,
      related_to: jobSlug,
      related_to_type: "job",
    }),
  ]);

  let notes30d = 0;
  let lastNoteAt: string | null = null;
  if (notesOutcome.status === "fulfilled") {
    const data = analyzeExtractDataArray(notesOutcome.value);
    notes30d = data.length;
    lastNoteAt = pickAnalyzeLatestTimestamp(data, ["updated_on", "created_on"]);
  } else {
    errors.push(buildAnalyzeErrorEntry("activity", notesOutcome.reason, "notes"));
  }

  let meetings30d = 0;
  let lastMeetingAt: string | null = null;
  if (meetingsOutcome.status === "fulfilled") {
    const data = analyzeExtractDataArray(meetingsOutcome.value);
    meetings30d = data.length;
    lastMeetingAt = pickAnalyzeLatestTimestamp(data, ["start_date", "updated_on", "created_on"]);
  } else {
    errors.push(buildAnalyzeErrorEntry("activity", meetingsOutcome.reason, "meetings"));
  }

  let tasksTotal = 0;
  let nextTaskDueAt: string | null = null;
  let nextTaskMs = Infinity;
  if (tasksOutcome.status === "fulfilled") {
    const data = analyzeExtractDataArray(tasksOutcome.value);
    tasksTotal = data.length;
    for (const raw of data) {
      if (!raw || typeof raw !== "object") continue;
      const t = raw as Record<string, unknown>;
      const due = analyzeStringOrNull(t.start_date);
      if (!due) continue;
      const ms = Date.parse(due);
      if (Number.isNaN(ms)) continue;
      if (ms >= todayMs && ms < nextTaskMs) {
        nextTaskMs = ms;
        nextTaskDueAt = due;
      }
    }
  } else {
    errors.push(buildAnalyzeErrorEntry("activity", tasksOutcome.reason, "tasks"));
  }

  return {
    notes_30d: notes30d,
    meetings_30d: meetings30d,
    tasks_total: tasksTotal,
    next_task_due_at: nextTaskDueAt,
    last_note_at: lastNoteAt,
    last_meeting_at: lastMeetingAt,
  };
}

function buildAnalyzeSuggestedActions(input: {
  activeCount: number;
  terminalCount: number;
  placedCount: number;
  idleCandidates: AnalyzeJobPipelineIdleCandidate[];
  bottleneck: AnalyzeJobPipelineBottleneck | null;
  activity: AnalyzeJobPipelineActivity | null;
  timeMetrics: AnalyzeJobPipelineTimeMetrics | null;
  includeTimeMetrics: boolean;
  idleThreshold: number;
  truncated: AnalyzeJobPipelineResult["truncated"];
  startPage: number;
  endPage: number;
  analyzedCount: number;
  nextWindowStartPage: number | null;
}): string[] {
  const out: string[] = [];

  if (input.activeCount === 0) {
    out.push(
      "No active candidates in pipeline — consider sourcing or reactivating dormant candidates.",
    );
  }

  if (input.idleCandidates.length > 0) {
    const sample = input.idleCandidates
      .slice(0, 3)
      .map((c) => c.name ?? c.candidate_slug)
      .join(", ");
    out.push(
      `${input.idleCandidates.length} candidate(s) idle >${input.idleThreshold}d (e.g. ${sample}) — push for an update or move stage.`,
    );
  }

  if (
    input.bottleneck &&
    input.bottleneck.count >= 3 &&
    input.bottleneck.median_days_in_stage >= input.idleThreshold
  ) {
    out.push(
      `Bottleneck: '${input.bottleneck.stage_label}' has ${input.bottleneck.count} candidates with median ${input.bottleneck.median_days_in_stage}d — investigate stage handoff.`,
    );
  }

  if (input.activity) {
    if (input.activity.notes_30d === 0 && input.activity.meetings_30d === 0) {
      out.push(
        "No notes or meetings logged in the last 30 days — log a status update or schedule a client touchpoint.",
      );
    }
    if (input.activity.next_task_due_at) {
      out.push(
        `Next scheduled task on this job is due ${input.activity.next_task_due_at} — confirm it's still on track.`,
      );
    }
  }

  if (input.truncated.active_candidates) {
    out.push(
      "Active-candidate stage history was truncated — re-run with a higher max_active_candidates for full coverage of time-to-stage / time-to-first-action.",
    );
  }

  if (input.truncated.placed_candidates) {
    out.push(
      "Placed-candidate stage history was truncated — re-run with a higher max_placed_candidates for full coverage of time-to-hire.",
    );
  }

  // Time-metric availability hint:
  if (!input.includeTimeMetrics && input.placedCount > 0) {
    out.push(
      `${input.placedCount} placement(s) on this job — re-run with include_time_metrics=true to compute time-to-hire (adds ${Math.min(input.placedCount, ANALYZE_JOB_PIPELINE_DEFAULTS.maxPlacedCandidates)} extra /history calls).`,
    );
  }

  // Pagination nudge — last so the LLM surfaces it after the diagnosis.
  if (input.nextWindowStartPage !== null) {
    const firstIdx = (input.startPage - 1) * ANALYZE_JOB_PIPELINE_ASSIGNED_PAGE_LIMIT + 1;
    const lastIdx = firstIdx + input.analyzedCount - 1;
    out.push(
      `Analyzed candidates ${firstIdx}–${lastIdx} of an estimated ${lastIdx}+ assigned candidates. There are more candidates beyond this batch — let me know if you want me to analyze the next ${ANALYZE_JOB_PIPELINE_ASSIGNED_PAGE_LIMIT * ANALYZE_JOB_PIPELINE_PAGES_PER_WINDOW} (start_page=${input.nextWindowStartPage}).`,
    );
  }

  return out;
}

function isAnalyzeTerminal(label: string | null, terminalLabels: string[]): boolean {
  if (!label) return false;
  return terminalLabels.includes(label.trim().toLowerCase());
}

function isAnalyzeHired(label: string | null, hireLabels: string[]): boolean {
  if (!label) return false;
  return hireLabels.includes(label.trim().toLowerCase());
}

// =====================================================================
// Time-metric helpers (only invoked when include_time_metrics is true)
// =====================================================================

function buildAnalyzeTimeMetrics(input: {
  jobSlug: string;
  activeAssignments: AssignedCandidateSummary[];
  placedAssignments: AssignedCandidateSummary[];
  historyByCandidate: Map<string, AnalyzeStageHistoryItem[]>;
  placedHistoryByCandidate: Map<string, AnalyzeStageHistoryItem[]>;
  intakeLabels: string[];
  activeHistoryFetched: number;
  placedHistoryFetched: number;
}): AnalyzeJobPipelineTimeMetrics {
  const allFetched = new Map<string, AnalyzeStageHistoryItem[]>();
  for (const [slug, items] of input.historyByCandidate) allFetched.set(slug, items);
  for (const [slug, items] of input.placedHistoryByCandidate) allFetched.set(slug, items);

  const time_to_hire = computeAnalyzeTimeToHire(
    input.placedAssignments,
    input.placedHistoryByCandidate,
    input.jobSlug,
  );

  const time_to_stage = computeAnalyzeTimeToStage(
    [...input.activeAssignments, ...input.placedAssignments],
    allFetched,
    input.jobSlug,
    input.intakeLabels,
  );

  const time_to_first_action = computeAnalyzeTimeToFirstAction(
    input.activeAssignments,
    input.historyByCandidate,
    input.jobSlug,
    input.intakeLabels,
  );

  return {
    time_to_hire,
    time_to_stage,
    time_to_first_action,
    coverage: {
      active_history_fetched: input.activeHistoryFetched,
      active_total: input.activeAssignments.length,
      placed_history_fetched: input.placedHistoryFetched,
      placed_total: input.placedAssignments.length,
    },
  };
}

function computeAnalyzeTimeToHire(
  placed: AssignedCandidateSummary[],
  histories: Map<string, AnalyzeStageHistoryItem[]>,
  jobSlug: string,
): AnalyzeJobPipelineTimeToHire | null {
  const placements: AnalyzeJobPipelineTimeToHirePlacement[] = [];
  for (const p of placed) {
    const history = histories.get(p.candidate_slug);
    if (!history) continue;
    const filtered = history
      .filter((h) => typeof h.job_slug === "string" && h.job_slug === jobSlug)
      .sort((x, y) => analyzeSortDescByUpdatedOn(x, y));
    if (filtered.length === 0) continue;
    const earliest = filtered[filtered.length - 1];
    const latest = filtered[0];
    const start = analyzeStringOrNull(earliest.updated_on);
    const end = analyzeStringOrNull(latest.updated_on);
    if (!start || !end) continue;
    const days = analyzeDaysBetween(start, end);
    if (!Number.isFinite(days) || days < 0) continue;
    placements.push({
      candidate_slug: p.candidate_slug,
      name: buildAnalyzeName(p.first_name, p.last_name),
      days_to_hire: days,
    });
  }
  if (placements.length === 0) return null;
  const sorted = [...placements].sort((a, b) => a.days_to_hire - b.days_to_hire);
  return {
    first_days: sorted[0].days_to_hire,
    avg_days: roundAnalyzeAvg(sorted.map((p) => p.days_to_hire)),
    sample_size: sorted.length,
    placements: sorted,
  };
}

function computeAnalyzeTimeToStage(
  candidates: AssignedCandidateSummary[],
  histories: Map<string, AnalyzeStageHistoryItem[]>,
  jobSlug: string,
  intakeLabels: string[],
): Record<string, AnalyzeJobPipelineTimeToStageEntry> {
  const perStage = new Map<string, number[]>();
  for (const c of candidates) {
    const history = histories.get(c.candidate_slug);
    if (!history) continue;
    const filtered = history
      .filter((h) => typeof h.job_slug === "string" && h.job_slug === jobSlug)
      .sort((x, y) => analyzeSortDescByUpdatedOn(x, y));
    if (filtered.length === 0) continue;
    const earliest = filtered[filtered.length - 1];
    const start = analyzeStringOrNull(earliest.updated_on);
    if (!start) continue;
    const seenStages = new Set<string>();
    // Walk oldest → newest. For each stage transition, capture days from start.
    for (let i = filtered.length - 1; i >= 0; i -= 1) {
      const entry = filtered[i];
      const label = analyzeStringOrNull(entry.candidate_status);
      if (!label) continue;
      if (intakeLabels.includes(label.trim().toLowerCase())) continue;
      if (seenStages.has(label)) continue;
      seenStages.add(label);
      const at = analyzeStringOrNull(entry.updated_on);
      if (!at) continue;
      const days = analyzeDaysBetween(start, at);
      if (!Number.isFinite(days) || days < 0) continue;
      const arr = perStage.get(label) ?? [];
      arr.push(days);
      perStage.set(label, arr);
    }
  }
  const out: Record<string, AnalyzeJobPipelineTimeToStageEntry> = {};
  for (const [label, vals] of perStage) {
    if (vals.length === 0) continue;
    const sorted = [...vals].sort((a, b) => a - b);
    out[label] = {
      first_days: sorted[0],
      avg_days: roundAnalyzeAvg(sorted),
      sample_size: sorted.length,
    };
  }
  return out;
}

function computeAnalyzeTimeToFirstAction(
  active: AssignedCandidateSummary[],
  histories: Map<string, AnalyzeStageHistoryItem[]>,
  jobSlug: string,
  intakeLabels: string[],
): AnalyzeJobPipelineTimeToFirstAction | null {
  if (active.length === 0) return null;
  const daysToAction: number[] = [];
  let stuck = 0;
  let sampled = 0;
  for (const a of active) {
    const history = histories.get(a.candidate_slug);
    if (!history) continue;
    const filtered = history
      .filter((h) => typeof h.job_slug === "string" && h.job_slug === jobSlug)
      .sort((x, y) => analyzeSortDescByUpdatedOn(x, y));
    if (filtered.length === 0) continue;
    sampled += 1;
    const earliest = filtered[filtered.length - 1];
    const start = analyzeStringOrNull(earliest.updated_on);
    if (!start) continue;
    // Walk oldest → newest, find first non-intake stage entry.
    let firstActionAt: string | null = null;
    for (let i = filtered.length - 1; i >= 0; i -= 1) {
      const label = analyzeStringOrNull(filtered[i].candidate_status);
      if (!label) continue;
      if (intakeLabels.includes(label.trim().toLowerCase())) continue;
      firstActionAt = analyzeStringOrNull(filtered[i].updated_on);
      break;
    }
    if (firstActionAt) {
      const d = analyzeDaysBetween(start, firstActionAt);
      if (Number.isFinite(d) && d >= 0) daysToAction.push(d);
    } else {
      stuck += 1;
    }
  }
  return {
    avg_days: daysToAction.length > 0 ? roundAnalyzeAvg(daysToAction) : null,
    stuck_in_intake: stuck,
    sample_size: sampled,
  };
}

function roundAnalyzeAvg(values: number[]): number {
  if (values.length === 0) return 0;
  const sum = values.reduce((a, b) => a + b, 0);
  return Math.round((sum / values.length) * 10) / 10;
}

function analyzeSortDescByUpdatedOn(
  a: AnalyzeStageHistoryItem,
  b: AnalyzeStageHistoryItem,
): number {
  const aTime = analyzeParseTime(a.updated_on);
  const bTime = analyzeParseTime(b.updated_on);
  return bTime - aTime;
}

function analyzeParseTime(value: unknown): number {
  const s = analyzeStringOrNull(value);
  if (!s) return 0;
  const ms = Date.parse(s);
  return Number.isNaN(ms) ? 0 : ms;
}

function analyzeStringOrNull(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function buildAnalyzeName(first: string | null, last: string | null): string | null {
  const joined = [first, last]
    .filter((v): v is string => typeof v === "string" && v.length > 0)
    .join(" ");
  return joined.length > 0 ? joined : null;
}

function analyzeDaysBetween(isoA: string, isoB: string = new Date().toISOString()): number {
  const a = Date.parse(isoA);
  const b = Date.parse(isoB);
  if (Number.isNaN(a) || Number.isNaN(b)) return 0;
  return Math.max(0, Math.floor(Math.abs(b - a) / (1000 * 60 * 60 * 24)));
}

function analyzeIsoDaysAgo(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

function analyzeMedian(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? Math.round((sorted[mid - 1] + sorted[mid]) / 2)
    : sorted[mid];
}

function toAnalyzeFiniteNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function analyzeExtractDataArray(payload: unknown): unknown[] {
  if (!payload || typeof payload !== "object") return [];
  const data = (payload as { data?: unknown }).data;
  return Array.isArray(data) ? data : [];
}

function pickAnalyzeLatestTimestamp(items: unknown[], fields: string[]): string | null {
  let best: string | null = null;
  let bestMs = -Infinity;
  for (const item of items) {
    if (!item || typeof item !== "object") continue;
    for (const field of fields) {
      const v = (item as Record<string, unknown>)[field];
      if (typeof v === "string") {
        const ms = Date.parse(v);
        if (!Number.isNaN(ms) && ms > bestMs) {
          bestMs = ms;
          best = v;
        }
        break;
      }
    }
  }
  return best;
}

function buildAnalyzeErrorEntry(
  source: AnalyzeJobPipelineError["source"],
  reason: unknown,
  slug?: string,
): AnalyzeJobPipelineError {
  return {
    source,
    slug,
    message: reason instanceof Error ? reason.message : String(reason),
    status_code:
      reason instanceof RecruitCrmApiError ? reason.statusCode ?? null : null,
  };
}
