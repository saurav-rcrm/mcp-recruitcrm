import * as z from "zod/v4";

import { RecruitCrmApiError, invalidApiResponse, mapFetchError, mapHttpError } from "../errors.js";
import type { AppConfig } from "../config.js";
import { nodeHttpTransport, type HttpTransport } from "./http.js";
import type {
  RecruitCrmCandidateCustomField,
  RecruitCrmHiringPipelineResponse,
  RecruitCrmCandidateJobAssignmentHiringStageHistoryResponse,
  RecruitCrmJobAssignedCandidatesResponse,
  RecruitCrmCallLogSearchResponse,
  CandidateDetail,
  CompanyDetail,
  ContactDetail,
  CreatedHotlist,
  CreateHotlistInput,
  GetJobAssignedCandidatesInput,
  JobDetail,
  ListCandidatesInput,
  ListCompaniesInput,
  ListContactsInput,
  ListJobsInput,
  ListUsersInput,
  RecruitCrmContactSearchResponse,
  RecruitCrmCompanySearchResponse,
  RecruitCrmHotlistSearchResponse,
  RecruitCrmJobSearchResponse,
  RecruitCrmMeetingSearchResponse,
  RecruitCrmNoteSearchResponse,
  RecruitCrmSearchResponse,
  RecruitCrmTaskSearchResponse,
  RecruitCrmUserListResponse,
  SearchCandidatesInput,
  SearchCallLogsInput,
  SearchCompaniesInput,
  SearchContactsInput,
  SearchHotlistsInput,
  SearchJobsInput,
  SearchMeetingsInput,
  SearchNotesInput,
  SearchTasksInput,
  SearchCandidateCustomFieldFilter,
} from "./types.js";

const nullableNumberOrStringSchema = z.union([z.number(), z.string(), z.null()]).optional();
const nullableStringLikeSchema = z.union([z.string(), z.number(), z.null()]).optional();

const candidateSchema = z
  .object({
    slug: z.union([z.string(), z.number()]).transform((value) => String(value)),
    first_name: nullableStringLikeSchema,
    last_name: nullableStringLikeSchema,
    current_organization: nullableStringLikeSchema,
    current_status: nullableStringLikeSchema,
    city: nullableStringLikeSchema,
    country: nullableStringLikeSchema,
    updated_on: nullableStringLikeSchema,
    position: nullableStringLikeSchema,
  })
  .passthrough();

const searchResponseSchema = z.union([
  z
    .object({
      current_page: z.coerce.number().int().positive().optional(),
      next_page_url: z.union([z.string(), z.null()]).optional(),
      data: z.array(candidateSchema),
    })
    .passthrough(),
  z.array(z.unknown()).length(0).transform(
    (): RecruitCrmSearchResponse => ({
      current_page: 1,
      next_page_url: null,
      data: [],
    }),
  ),
]);

const assignedCandidateStatusSchema = z
  .object({
    status_id: nullableNumberOrStringSchema,
    label: nullableStringLikeSchema,
  })
  .passthrough();

const assignedCandidateSchema = z
  .object({
    candidate: candidateSchema,
    stage_date: nullableStringLikeSchema,
    status: z.union([assignedCandidateStatusSchema, z.null()]).optional(),
  })
  .passthrough();

const jobAssignedCandidatesResponseSchema = z.union([
  z
    .object({
      current_page: z.coerce.number().int().positive().optional(),
      next_page_url: z.union([z.string(), z.null()]).optional(),
      data: z.array(assignedCandidateSchema),
    })
    .passthrough(),
  z.array(z.unknown()).length(0).transform(
    (): RecruitCrmJobAssignedCandidatesResponse => ({
      current_page: 1,
      next_page_url: null,
      data: [],
    }),
  ),
]);

const hiringStageSchema = z
  .object({
    stage_id: nullableNumberOrStringSchema,
    status_id: nullableNumberOrStringSchema,
    label: nullableStringLikeSchema,
  })
  .passthrough();

const hiringPipelineResponseSchema = z.array(hiringStageSchema);

const jobStatusSchema = z
  .object({
    id: nullableNumberOrStringSchema,
    label: nullableStringLikeSchema,
  })
  .passthrough();

const salaryTypeSchema = z
  .object({
    id: nullableNumberOrStringSchema,
    label: nullableStringLikeSchema,
  })
  .passthrough();

const jobSchema = z
  .object({
    id: nullableNumberOrStringSchema,
    slug: nullableStringLikeSchema,
    name: nullableStringLikeSchema,
    company_slug: nullableStringLikeSchema,
    contact_slug: nullableStringLikeSchema,
    secondary_contact_slugs: z.array(z.union([z.string(), z.number(), z.null()])).nullish(),
    note_for_candidates: nullableStringLikeSchema,
    number_of_openings: nullableNumberOrStringSchema,
    minimum_experience: nullableNumberOrStringSchema,
    maximum_experience: nullableNumberOrStringSchema,
    min_annual_salary: nullableNumberOrStringSchema,
    max_annual_salary: nullableNumberOrStringSchema,
    salary_type: z.union([salaryTypeSchema, z.string(), z.number(), z.null()]).optional(),
    job_status: z.union([jobStatusSchema, z.null()]).optional(),
    job_skill: nullableStringLikeSchema,
    job_type: nullableStringLikeSchema,
    pay_rate: nullableNumberOrStringSchema,
    bill_rate: nullableNumberOrStringSchema,
    job_category: nullableStringLikeSchema,
    city: nullableStringLikeSchema,
    locality: nullableStringLikeSchema,
    state: nullableStringLikeSchema,
    country: nullableStringLikeSchema,
    enable_job_application_form: z.union([z.number(), z.string(), z.boolean(), z.null()]).optional(),
    application_form_url: nullableStringLikeSchema,
    created_on: nullableStringLikeSchema,
    updated_on: nullableStringLikeSchema,
    owner: nullableNumberOrStringSchema,
  })
  .passthrough();

const jobSearchResponseSchema = z.union([
  z
    .object({
      current_page: z.coerce.number().int().positive().optional(),
      next_page_url: z.union([z.string(), z.null()]).optional(),
      data: z.array(jobSchema),
    })
    .passthrough(),
  z.array(z.unknown()).length(0).transform(
    (): RecruitCrmJobSearchResponse => ({
      current_page: 1,
      next_page_url: null,
      data: [],
    }),
  ),
]);

const companySchema = z
  .object({
    id: nullableNumberOrStringSchema,
    slug: nullableStringLikeSchema,
    company_name: nullableStringLikeSchema,
    website: nullableStringLikeSchema,
    city: nullableStringLikeSchema,
    locality: nullableStringLikeSchema,
    state: nullableStringLikeSchema,
    country: nullableStringLikeSchema,
    postal_code: nullableStringLikeSchema,
    address: nullableStringLikeSchema,
    owner: nullableNumberOrStringSchema,
    contact_slug: z
      .union([z.array(z.union([z.string(), z.number(), z.null()])), z.string(), z.number(), z.null()])
      .optional(),
    is_child_company: z.union([z.string(), z.number(), z.boolean(), z.null()]).optional(),
    is_parent_company: z.union([z.string(), z.number(), z.boolean(), z.null()]).optional(),
    child_company_slugs: z.array(z.union([z.string(), z.number(), z.null()])).nullish(),
    parent_company_slug: nullableStringLikeSchema,
    off_limit_status_id: nullableNumberOrStringSchema,
    status_label: nullableStringLikeSchema,
    off_limit_reason: nullableStringLikeSchema,
    off_limit_end_date: nullableStringLikeSchema,
    created_on: nullableStringLikeSchema,
    updated_on: nullableStringLikeSchema,
  })
  .passthrough();

const companySearchResponseSchema = z.union([
  z
    .object({
      current_page: z.coerce.number().int().positive().optional(),
      next_page_url: z.union([z.string(), z.null()]).optional(),
      data: z.array(companySchema),
    })
    .passthrough(),
  z.array(z.unknown()).length(0).transform(
    (): RecruitCrmCompanySearchResponse => ({
      current_page: 1,
      next_page_url: null,
      data: [],
    }),
  ),
]);

const contactSchema = z
  .object({
    id: nullableNumberOrStringSchema,
    slug: z.union([z.string(), z.number()]).transform((value) => String(value)),
    first_name: nullableStringLikeSchema,
    last_name: nullableStringLikeSchema,
    email: nullableStringLikeSchema,
    contact_number: nullableStringLikeSchema,
    linkedin: nullableStringLikeSchema,
    company_slug: nullableStringLikeSchema,
    additional_company_slugs: z.array(z.union([z.string(), z.number(), z.null()])).nullish(),
    designation: nullableStringLikeSchema,
    city: nullableStringLikeSchema,
    locality: nullableStringLikeSchema,
    created_on: nullableStringLikeSchema,
    updated_on: nullableStringLikeSchema,
  })
  .passthrough();

const contactSearchResponseSchema = z.union([
  z
    .object({
      current_page: z.coerce.number().int().positive().optional(),
      next_page_url: z.union([z.string(), z.null()]).optional(),
      data: z.array(contactSchema),
    })
    .passthrough(),
  z.array(z.unknown()).length(0).transform(
    (): RecruitCrmContactSearchResponse => ({
      current_page: 1,
      next_page_url: null,
      data: [],
    }),
  ),
]);

const hotlistSchema = z
  .object({
    id: nullableNumberOrStringSchema,
    name: nullableStringLikeSchema,
    related_to_type: nullableStringLikeSchema,
    related: z.union([z.string(), z.number(), z.null()]).optional(),
    shared: z.union([z.number(), z.string(), z.boolean(), z.null()]).optional(),
    created_by: nullableNumberOrStringSchema,
  })
  .passthrough();

const hotlistSearchResponseSchema = z.union([
  z
    .object({
      current_page: z.coerce.number().int().positive().optional(),
      next_page_url: z.union([z.string(), z.null()]).optional(),
      data: z.array(hotlistSchema),
    })
    .passthrough(),
  z.array(z.unknown()).length(0).transform(
    (): RecruitCrmHotlistSearchResponse => ({
      current_page: 1,
      next_page_url: null,
      data: [],
    }),
  ),
]);

const userTeamSchema = z
  .object({
    team_id: nullableNumberOrStringSchema,
    team_name: nullableStringLikeSchema,
  })
  .passthrough();

const userSchema = z
  .object({
    id: nullableNumberOrStringSchema,
    first_name: nullableStringLikeSchema,
    last_name: nullableStringLikeSchema,
    email: nullableStringLikeSchema,
    contact_number: nullableStringLikeSchema,
    status: nullableStringLikeSchema,
    teams: z.array(z.union([userTeamSchema, z.number()])).nullish(),
  })
  .passthrough();

const userListResponseSchema = z.array(userSchema);

const taskTypeSchema = z
  .object({
    id: nullableNumberOrStringSchema,
    label: nullableStringLikeSchema,
  })
  .passthrough();

const activityRelatedSchema = z
  .object({
    first_name: nullableStringLikeSchema,
    last_name: nullableStringLikeSchema,
    company_name: nullableStringLikeSchema,
    name: nullableStringLikeSchema,
  })
  .passthrough();

const taskSchema = z
  .object({
    id: nullableNumberOrStringSchema,
    related_to: nullableStringLikeSchema,
    task_type: z.union([taskTypeSchema, z.array(taskTypeSchema), z.null()]).optional(),
    related_to_type: nullableStringLikeSchema,
    related_to_name: nullableStringLikeSchema,
    related: z.union([activityRelatedSchema, z.null()]).optional(),
    description: nullableStringLikeSchema,
    title: nullableStringLikeSchema,
    status: nullableNumberOrStringSchema,
    start_date: nullableStringLikeSchema,
    reminder_date: nullableStringLikeSchema,
    reminder: nullableNumberOrStringSchema,
    owner: nullableNumberOrStringSchema,
    created_on: nullableStringLikeSchema,
    updated_on: nullableStringLikeSchema,
    created_by: nullableNumberOrStringSchema,
    updated_by: nullableNumberOrStringSchema,
  })
  .passthrough();

const taskSearchResponseSchema = z
  .union([
    z
      .object({
        current_page: z.coerce.number().int().positive().optional(),
        next_page_url: z.union([z.string(), z.null()]).optional(),
        data: z.array(taskSchema),
      })
      .passthrough(),
    z.array(z.unknown()).length(0).transform(
      (): RecruitCrmTaskSearchResponse => ({
        current_page: 1,
        next_page_url: null,
        data: [],
      }),
    ),
  ]);

const meetingTypeSchema = z
  .object({
    id: nullableNumberOrStringSchema,
    label: nullableStringLikeSchema,
  })
  .passthrough();

const meetingSchema = z
  .object({
    id: nullableNumberOrStringSchema,
    title: nullableStringLikeSchema,
    meeting_type: z.union([meetingTypeSchema, z.array(meetingTypeSchema), z.null()]).optional(),
    description: nullableStringLikeSchema,
    address: nullableStringLikeSchema,
    reminder: nullableNumberOrStringSchema,
    start_date: nullableStringLikeSchema,
    end_date: nullableStringLikeSchema,
    related_to: nullableStringLikeSchema,
    related_to_type: nullableStringLikeSchema,
    related: z.union([activityRelatedSchema, z.null()]).optional(),
    do_not_send_calendar_invites: z.union([z.number(), z.string(), z.boolean(), z.null()]).optional(),
    status: nullableNumberOrStringSchema,
    reminder_date: nullableStringLikeSchema,
    all_day: z.union([z.number(), z.string(), z.boolean(), z.null()]).optional(),
    owner: nullableNumberOrStringSchema,
    created_on: nullableStringLikeSchema,
    updated_on: nullableStringLikeSchema,
    created_by: nullableNumberOrStringSchema,
    updated_by: nullableNumberOrStringSchema,
  })
  .passthrough();

const meetingSearchResponseSchema = z
  .union([
    z
      .object({
        current_page: z.coerce.number().int().positive().optional(),
        next_page_url: z.union([z.string(), z.null()]).optional(),
        data: z.array(meetingSchema),
      })
      .passthrough(),
    z.array(z.unknown()).length(0).transform(
      (): RecruitCrmMeetingSearchResponse => ({
        current_page: 1,
        next_page_url: null,
        data: [],
      }),
    ),
  ]);

const noteTypeSchema = z
  .object({
    id: nullableNumberOrStringSchema,
    label: nullableStringLikeSchema,
  })
  .passthrough();

const noteSchema = z
  .object({
    id: nullableNumberOrStringSchema,
    note_type: z.union([noteTypeSchema, z.array(noteTypeSchema), z.null()]).optional(),
    description: nullableStringLikeSchema,
    related_to: nullableStringLikeSchema,
    related_to_type: nullableStringLikeSchema,
    related: z.union([activityRelatedSchema, z.null()]).optional(),
    created_on: nullableStringLikeSchema,
    updated_on: nullableStringLikeSchema,
    created_by: nullableNumberOrStringSchema,
    updated_by: nullableNumberOrStringSchema,
  })
  .passthrough();

const noteSearchResponseSchema = z
  .union([
    z
      .object({
        current_page: z.coerce.number().int().positive().optional(),
        next_page_url: z.union([z.string(), z.null()]).optional(),
        data: z.array(noteSchema),
      })
      .passthrough(),
    z.array(z.unknown()).length(0).transform(
      (): RecruitCrmNoteSearchResponse => ({
        current_page: 1,
        next_page_url: null,
        data: [],
      }),
    ),
  ]);

const callLogTypeSchema = z
  .object({
    id: nullableNumberOrStringSchema,
    label: nullableStringLikeSchema,
  })
  .passthrough();

const callLogSchema = z
  .object({
    id: nullableNumberOrStringSchema,
    call_type: nullableStringLikeSchema,
    custom_call_type: z.union([callLogTypeSchema, z.array(callLogTypeSchema), z.null()]).optional(),
    call_started_on: nullableStringLikeSchema,
    contact_number: nullableStringLikeSchema,
    call_notes: nullableStringLikeSchema,
    related_to: nullableStringLikeSchema,
    related_to_type: nullableStringLikeSchema,
    related: z.union([activityRelatedSchema, z.null()]).optional(),
    duration: nullableNumberOrStringSchema,
    created_on: nullableStringLikeSchema,
    updated_on: nullableStringLikeSchema,
    created_by: nullableNumberOrStringSchema,
    updated_by: nullableNumberOrStringSchema,
  })
  .passthrough();

const callLogSearchResponseSchema = z
  .union([
    z
      .object({
        current_page: z.coerce.number().int().positive().optional(),
        next_page_url: z.union([z.string(), z.null()]).optional(),
        data: z.array(callLogSchema),
      })
      .passthrough(),
    z.array(z.unknown()).length(0).transform(
      (): RecruitCrmCallLogSearchResponse => ({
        current_page: 1,
        next_page_url: null,
        data: [],
      }),
    ),
  ]);

const candidateJobAssignmentHiringStageHistoryItemSchema = z
  .object({
    job_slug: nullableStringLikeSchema,
    job_name: nullableStringLikeSchema,
    company_slug: nullableStringLikeSchema,
    company_name: nullableStringLikeSchema,
    job_status_id: nullableNumberOrStringSchema,
    job_status_label: nullableStringLikeSchema,
    candidate_status_id: nullableNumberOrStringSchema,
    candidate_status: nullableStringLikeSchema,
    remark: nullableStringLikeSchema,
    updated_by: nullableNumberOrStringSchema,
    updated_on: nullableStringLikeSchema,
  })
  .passthrough();

const candidateJobAssignmentHiringStageHistoryResponseSchema = z.array(
  candidateJobAssignmentHiringStageHistoryItemSchema,
);

const candidateCustomFieldSchema = z
  .object({
    field_id: z.coerce.number().int().positive(),
    field_type: z.string(),
    field_name: z.string(),
    default_value: z.unknown().optional(),
  })
  .passthrough();

const candidateCustomFieldsResponseSchema = z.array(candidateCustomFieldSchema);
const candidateDetailSchema: z.ZodType<CandidateDetail> = z.object({}).passthrough();
const companyDetailSchema: z.ZodType<CompanyDetail> = z.object({}).passthrough();
const contactDetailSchema: z.ZodType<ContactDetail> = z.object({}).passthrough();
const jobDetailSchema: z.ZodType<JobDetail> = z.object({}).passthrough();

export class RecruitCrmClient {
  readonly #apiToken: string;
  readonly #baseUrl: string;
  readonly #timeoutMs: number;
  readonly #debugSchemaErrors: boolean;
  readonly #transport: HttpTransport;

  constructor(config: AppConfig, transport: HttpTransport = nodeHttpTransport) {
    this.#apiToken = config.apiToken;
    this.#baseUrl = config.baseUrl;
    this.#timeoutMs = config.timeoutMs;
    this.#debugSchemaErrors = config.debugSchemaErrors;
    this.#transport = transport;
  }

  async searchCandidates(filters: SearchCandidatesInput): Promise<RecruitCrmSearchResponse> {
    const request = buildSearchCandidatesRequest(filters);

    return this.#requestJson("/candidates/search", searchResponseSchema, request, "Candidate");
  }

  async listCandidates(filters: ListCandidatesInput): Promise<RecruitCrmSearchResponse> {
    const request = buildListPaginationRequest(filters);

    return this.#requestJson("/candidates", searchResponseSchema, request, "Candidate");
  }

  async getJobAssignedCandidates(
    jobSlug: string,
    filters: GetJobAssignedCandidatesInput,
  ): Promise<RecruitCrmJobAssignedCandidatesResponse> {
    const request = buildGetJobAssignedCandidatesRequest(filters);

    return this.#requestJson(
      `/jobs/${encodeURIComponent(jobSlug)}/assigned-candidates`,
      jobAssignedCandidatesResponseSchema,
      request,
      "Job",
    );
  }

  async searchJobs(filters: SearchJobsInput): Promise<RecruitCrmJobSearchResponse> {
    const request = buildSearchJobsRequest(filters);

    return this.#requestJson("/jobs/search", jobSearchResponseSchema, request, "Job");
  }

  async listJobs(filters: ListJobsInput): Promise<RecruitCrmJobSearchResponse> {
    const request = buildListPaginationRequest(filters);

    return this.#requestJson("/jobs", jobSearchResponseSchema, request, "Job");
  }

  async searchCompanies(filters: SearchCompaniesInput): Promise<RecruitCrmCompanySearchResponse> {
    const request = buildSearchCompaniesRequest(filters);

    return this.#requestJson("/companies/search", companySearchResponseSchema, request, "Company");
  }

  async listCompanies(filters: ListCompaniesInput): Promise<RecruitCrmCompanySearchResponse> {
    const request = buildListPaginationRequest(filters);

    return this.#requestJson("/companies", companySearchResponseSchema, request, "Company");
  }

  async searchContacts(filters: SearchContactsInput): Promise<RecruitCrmContactSearchResponse> {
    const request = buildSearchContactsRequest(filters);

    return this.#requestJson("/contacts/search", contactSearchResponseSchema, request, "Contact");
  }

  async listContacts(filters: ListContactsInput): Promise<RecruitCrmContactSearchResponse> {
    const request = buildListPaginationRequest(filters);

    return this.#requestJson("/contacts", contactSearchResponseSchema, request, "Contact");
  }

  async searchHotlists(filters: SearchHotlistsInput): Promise<RecruitCrmHotlistSearchResponse> {
    const request = buildSearchHotlistsRequest(filters);

    return this.#requestJson("/hotlists/search", hotlistSearchResponseSchema, request, "Hotlist");
  }

  async createHotlist(input: CreateHotlistInput): Promise<CreatedHotlist> {
    return this.#requestJson(
      "/hotlists",
      hotlistSchema,
      {
        method: "POST",
        jsonBody: input,
      },
      "Hotlist",
    );
  }

  async listUsers(filters: ListUsersInput): Promise<RecruitCrmUserListResponse> {
    const request = buildListUsersRequest(filters);

    return this.#requestJson("/users", userListResponseSchema, request, "User");
  }

  async addRecordToHotlist(hotlistId: number, relatedSlug: string): Promise<void> {
    await this.#request(
      `/hotlists/${encodeURIComponent(String(hotlistId))}/add-record`,
      {
        method: "POST",
        jsonBody: {
          related: relatedSlug,
        },
      },
      "Hotlist",
    );
  }

  async searchTasks(filters: SearchTasksInput): Promise<RecruitCrmTaskSearchResponse> {
    const request = buildSearchTasksRequest(filters);

    return this.#requestJson("/tasks/search", taskSearchResponseSchema, request, "Task");
  }

  async searchMeetings(filters: SearchMeetingsInput): Promise<RecruitCrmMeetingSearchResponse> {
    const request = buildSearchMeetingsRequest(filters);

    return this.#requestJson("/meetings/search", meetingSearchResponseSchema, request, "Meeting");
  }

  async searchNotes(filters: SearchNotesInput): Promise<RecruitCrmNoteSearchResponse> {
    const request = buildSearchNotesRequest(filters);

    return this.#requestJson("/notes/search", noteSearchResponseSchema, request, "Note");
  }

  async searchCallLogs(filters: SearchCallLogsInput): Promise<RecruitCrmCallLogSearchResponse> {
    const request = buildSearchCallLogsRequest(filters);

    return this.#requestJson("/call-logs/search", callLogSearchResponseSchema, request, "Call log");
  }

  async getCandidateJobAssignmentHiringStageHistory(
    candidateSlug: string,
  ): Promise<RecruitCrmCandidateJobAssignmentHiringStageHistoryResponse> {
    return this.#requestJson(
      `/candidates/${encodeURIComponent(candidateSlug)}/history`,
      candidateJobAssignmentHiringStageHistoryResponseSchema,
      {},
      "Candidate",
    );
  }

  async getCandidateDetails(candidateSlug: string): Promise<CandidateDetail> {
    return this.#requestJson(
      `/candidates/${encodeURIComponent(candidateSlug)}`,
      candidateDetailSchema,
      {},
      "Candidate",
    );
  }

  async getCompanyDetails(companySlug: string): Promise<CompanyDetail> {
    return this.#requestJson(
      `/companies/${encodeURIComponent(companySlug)}`,
      companyDetailSchema,
      {},
      "Company",
    );
  }

  async getContactDetails(contactSlug: string): Promise<ContactDetail> {
    return this.#requestJson(
      `/contacts/${encodeURIComponent(contactSlug)}`,
      contactDetailSchema,
      {},
      "Contact",
    );
  }

  async getJobDetails(jobSlug: string): Promise<JobDetail> {
    return this.#requestJson(`/jobs/${encodeURIComponent(jobSlug)}`, jobDetailSchema, {}, "Job");
  }

  async getCandidateCustomFields(): Promise<RecruitCrmCandidateCustomField[]> {
    return this.#requestJson(
      "/custom-fields/candidates",
      candidateCustomFieldsResponseSchema,
      {},
      "Candidate custom field",
    );
  }

  async listCandidateHiringStages(): Promise<RecruitCrmHiringPipelineResponse> {
    return this.#requestJson("/hiring-pipeline", hiringPipelineResponseSchema, {}, "Hiring pipeline");
  }

  async #request(path: string, options: RequestOptions = {}, entity?: string): Promise<{ bodyText: string }> {
    const url = new URL(`${this.#baseUrl}${path}`);

    if (options.query) {
      url.search = options.query.toString();
    }

    let response;

    try {
      response = await this.#transport({
        url,
        method: options.method ?? "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${this.#apiToken}`,
        },
        jsonBody: options.jsonBody,
        timeoutMs: this.#timeoutMs,
      });
    } catch (error) {
      throw mapFetchError(error);
    }

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw mapHttpError(response.statusCode, response.bodyText, entity);
    }

    return response;
  }

  async #requestJson<T>(
    path: string,
    schema: z.ZodType<T>,
    options: RequestOptions = {},
    entity?: string,
  ): Promise<T> {
    const response = await this.#request(path, options, entity);

    let payload: unknown;

    try {
      payload = JSON.parse(response.bodyText);
    } catch {
      throw invalidApiResponse(path);
    }

    const parsed = schema.safeParse(payload);

    if (!parsed.success) {
      this.#logSchemaIssues(path, parsed.error.issues);
      throw invalidApiResponse(path, parsed.error.issues);
    }

    return parsed.data;
  }

  #logSchemaIssues(path: string, issues: Array<{ path: PropertyKey[]; message: string }>): void {
    if (!this.#debugSchemaErrors || issues.length === 0) {
      return;
    }

    const formattedIssues = issues
      .slice(0, 5)
      .map((issue) => `${formatIssuePath(issue.path)}: ${issue.message}`)
      .join("; ");
    const moreIssues = issues.length > 5 ? `; +${issues.length - 5} more` : "";

    console.error(`Recruit CRM schema mismatch for ${path}: ${formattedIssues}${moreIssues}`);
  }
}

export type RequestOptions = {
  method?: "GET" | "POST";
  query?: URLSearchParams;
  jsonBody?: unknown;
};

export type GetRequestOptions = RequestOptions;

type SearchCandidatesCustomFieldsBody = Array<{
  field_id: number;
  filter_type: string;
  filter_value?: string | number;
}>;

export function buildSearchCandidatesRequest(filters: SearchCandidatesInput): GetRequestOptions {
  const query = new URLSearchParams();
  const page = normalizePage(filters.page);

  query.set("page", String(page));

  if (filters.candidate_slug) {
    query.set("candidate_slug", filters.candidate_slug);
    return { query };
  }

  setStringParam(query, "created_from", filters.created_from);
  setStringParam(query, "created_to", filters.created_to);
  setStringParam(query, "email", filters.email);
  setStringParam(query, "first_name", filters.first_name);
  setStringParam(query, "last_name", filters.last_name);
  setStringParam(query, "linkedin", filters.linkedin);
  setBooleanParam(query, "marked_as_off_limit", filters.marked_as_off_limit);
  setStringParam(query, "owner_email", filters.owner_email);
  setStringParam(query, "owner_id", filters.owner_id);
  setStringParam(query, "owner_name", filters.owner_name);
  setStringParam(query, "state", filters.state);
  setStringParam(query, "updated_from", filters.updated_from);
  setStringParam(query, "updated_to", filters.updated_to);
  setStringParam(query, "contact_number", filters.contact_number);
  setStringParam(query, "country", filters.country);
  setBooleanParam(query, "exact_search", filters.exact_search);
  query.set("sort_by", filters.sort_by ?? "updatedon");
  query.set("sort_order", filters.sort_order ?? "desc");

  const customFields = buildSearchCandidatesCustomFieldsBody(filters.custom_fields);

  if (!customFields) {
    return { query };
  }

  return {
    query,
    jsonBody: {
      custom_fields: customFields,
    },
  };
}

export function buildListPaginationRequest(
  filters: { limit?: number; page?: number; sort_by?: "createdon" | "updatedon"; sort_order?: "asc" | "desc" },
): GetRequestOptions {
  const query = new URLSearchParams();
  const page = normalizePage(filters.page);
  const limit = normalizeLimit(filters.limit);

  query.set("page", String(page));
  query.set("limit", String(limit));
  query.set("sort_by", filters.sort_by ?? "updatedon");
  query.set("sort_order", filters.sort_order ?? "desc");

  return { query };
}

export const buildListCandidatesRequest = buildListPaginationRequest;
export const buildListContactsRequest = buildListPaginationRequest;

export function buildSearchHotlistsRequest(filters: SearchHotlistsInput): GetRequestOptions {
  const query = new URLSearchParams();
  const page = normalizePage(filters.page);

  query.set("page", String(page));
  query.set("related_to_type", filters.related_to_type);
  setStringParam(query, "name", filters.name);
  setNumberParam(query, "shared", filters.shared);

  return { query };
}

export function buildListUsersRequest(filters: Pick<ListUsersInput, "include_teams">): GetRequestOptions {
  if (!filters.include_teams) {
    return {};
  }

  const query = new URLSearchParams();
  query.set("expand", "team");

  return { query };
}

export function buildSearchJobsRequest(filters: SearchJobsInput): GetRequestOptions {
  const query = new URLSearchParams();
  const page = normalizePage(filters.page);
  const limit = normalizeLimit(filters.limit);

  query.set("page", String(page));
  query.set("limit", String(limit));

  if (filters.job_slug) {
    query.set("job_slug", filters.job_slug);
    return { query };
  }

  setStringParam(query, "city", filters.city);
  setStringParam(query, "company_name", filters.company_name);
  setStringParam(query, "company_slug", filters.company_slug);
  setStringParam(query, "contact_email", filters.contact_email);
  setStringParam(query, "contact_name", filters.contact_name);
  setStringParam(query, "contact_number", filters.contact_number);
  setStringParam(query, "contact_slug", filters.contact_slug);
  setStringParam(query, "country", filters.country);
  setStringParam(query, "created_from", filters.created_from);
  setStringParam(query, "created_to", filters.created_to);
  setNumberParam(query, "enable_job_application_form", filters.enable_job_application_form);
  setStringParam(query, "full_address", filters.full_address);
  setStringParam(query, "job_category", filters.job_category);
  setStringParam(query, "job_skill", filters.job_skill);
  setNumberParam(query, "job_status", filters.job_status);
  setNumberParam(query, "job_type", filters.job_type);
  setStringParam(query, "locality", filters.locality);
  setStringParam(query, "name", filters.name);
  setStringParam(query, "note_for_candidates", filters.note_for_candidates);
  setStringParam(query, "owner_email", filters.owner_email);
  setStringParam(query, "owner_id", filters.owner_id);
  setStringParam(query, "owner_name", filters.owner_name);
  setStringParam(query, "secondary_contact_email", filters.secondary_contact_email);
  setStringParam(query, "secondary_contact_name", filters.secondary_contact_name);
  setStringParam(query, "secondary_contact_number", filters.secondary_contact_number);
  setStringParam(query, "secondary_contact_slug", filters.secondary_contact_slug);
  setStringParam(query, "updated_from", filters.updated_from);
  setStringParam(query, "updated_to", filters.updated_to);
  setBooleanParam(query, "exact_search", filters.exact_search);
  query.set("sort_by", filters.sort_by ?? "updatedon");
  query.set("sort_order", filters.sort_order ?? "desc");

  return { query };
}

export function buildGetJobAssignedCandidatesRequest(filters: GetJobAssignedCandidatesInput): GetRequestOptions {
  const query = new URLSearchParams();
  const page = normalizePage(filters.page);
  const limit = normalizeAssignedCandidatesLimit(filters.limit);

  query.set("page", String(page));
  query.set("limit", String(limit));
  setStringParam(query, "status_id", filters.status_id);

  return { query };
}

export function buildSearchCompaniesRequest(filters: SearchCompaniesInput): GetRequestOptions {
  const query = new URLSearchParams();
  const page = normalizePage(filters.page);

  query.set("page", String(page));

  if (filters.company_slug) {
    query.set("company_slug", filters.company_slug);
    return { query };
  }

  setStringParam(query, "company_name", filters.company_name);
  setStringParam(query, "created_from", filters.created_from);
  setStringParam(query, "created_to", filters.created_to);
  setBooleanParam(query, "marked_as_off_limit", filters.marked_as_off_limit);
  setStringParam(query, "owner_email", filters.owner_email);
  setNumberParam(query, "owner_id", filters.owner_id);
  setStringParam(query, "owner_name", filters.owner_name);
  setStringParam(query, "updated_from", filters.updated_from);
  setStringParam(query, "updated_to", filters.updated_to);
  setBooleanParam(query, "exact_search", filters.exact_search);
  query.set("sort_by", filters.sort_by ?? "updatedon");
  query.set("sort_order", filters.sort_order ?? "desc");

  return { query };
}

export function buildSearchContactsRequest(filters: SearchContactsInput): GetRequestOptions {
  const query = new URLSearchParams();
  const page = normalizePage(filters.page);

  query.set("page", String(page));

  if (filters.contact_slug) {
    query.set("contact_slug", filters.contact_slug);
    return { query };
  }

  setStringParam(query, "created_from", filters.created_from);
  setStringParam(query, "created_to", filters.created_to);
  setStringParam(query, "email", filters.email);
  setStringParam(query, "first_name", filters.first_name);
  setStringParam(query, "last_name", filters.last_name);
  setStringParam(query, "linkedin", filters.linkedin);
  setBooleanParam(query, "marked_as_off_limit", filters.marked_as_off_limit);
  setStringParam(query, "owner_email", filters.owner_email);
  setStringParam(query, "owner_id", filters.owner_id);
  setStringParam(query, "owner_name", filters.owner_name);
  setStringParam(query, "updated_from", filters.updated_from);
  setStringParam(query, "updated_to", filters.updated_to);
  setStringParam(query, "company_slug", filters.company_slug);
  setStringParam(query, "contact_number", filters.contact_number);
  setBooleanParam(query, "exact_search", filters.exact_search);
  query.set("sort_by", filters.sort_by ?? "updatedon");
  query.set("sort_order", filters.sort_order ?? "desc");

  return { query };
}

export function buildSearchTasksRequest(filters: SearchTasksInput): GetRequestOptions {
  const query = new URLSearchParams();
  const page = normalizePage(filters.page);

  query.set("page", String(page));
  setStringParam(query, "created_from", filters.created_from);
  setStringParam(query, "created_to", filters.created_to);
  setStringParam(query, "owner_email", filters.owner_email);
  setStringParam(query, "owner_id", filters.owner_id);
  setStringParam(query, "owner_name", filters.owner_name);
  setStringParam(query, "related_to", filters.related_to);
  setStringParam(query, "related_to_type", filters.related_to_type);
  setStringParam(query, "starting_from", filters.starting_from);
  setStringParam(query, "starting_to", filters.starting_to);
  setStringParam(query, "title", filters.title);
  setStringParam(query, "updated_from", filters.updated_from);
  setStringParam(query, "updated_to", filters.updated_to);

  return { query };
}

export function buildSearchMeetingsRequest(filters: SearchMeetingsInput): GetRequestOptions {
  const query = new URLSearchParams();
  const page = normalizePage(filters.page);

  query.set("page", String(page));
  setStringParam(query, "created_from", filters.created_from);
  setStringParam(query, "created_to", filters.created_to);
  setStringParam(query, "owner_email", filters.owner_email);
  setStringParam(query, "owner_id", filters.owner_id);
  setStringParam(query, "owner_name", filters.owner_name);
  setStringParam(query, "related_to", filters.related_to);
  setStringParam(query, "related_to_type", filters.related_to_type);
  setStringParam(query, "starting_from", filters.starting_from);
  setStringParam(query, "starting_to", filters.starting_to);
  setStringParam(query, "title", filters.title);
  setStringParam(query, "updated_from", filters.updated_from);
  setStringParam(query, "updated_to", filters.updated_to);

  return { query };
}

export function buildSearchNotesRequest(filters: SearchNotesInput): GetRequestOptions {
  const query = new URLSearchParams();
  const page = normalizePage(filters.page);

  query.set("page", String(page));
  setStringParam(query, "added_from", filters.added_from);
  setStringParam(query, "added_to", filters.added_to);
  setStringParam(query, "related_to", filters.related_to);
  setStringParam(query, "related_to_type", filters.related_to_type);
  setStringParam(query, "updated_from", filters.updated_from);
  setStringParam(query, "updated_to", filters.updated_to);

  return { query };
}

export function buildSearchCallLogsRequest(filters: SearchCallLogsInput): GetRequestOptions {
  const query = new URLSearchParams();
  const page = normalizePage(filters.page);

  query.set("page", String(page));
  setStringParam(query, "call_type", filters.call_type);
  setStringParam(query, "related_to", filters.related_to);
  setStringParam(query, "related_to_type", filters.related_to_type);
  setStringParam(query, "starting_from", filters.starting_from);
  setStringParam(query, "starting_to", filters.starting_to);
  setStringParam(query, "updated_from", filters.updated_from);
  setStringParam(query, "updated_to", filters.updated_to);

  return { query };
}

function setStringParam(params: URLSearchParams, key: string, value: string | undefined): void {
  if (value !== undefined) {
    params.set(key, value);
  }
}

function setNumberParam(params: URLSearchParams, key: string, value: number | undefined): void {
  if (value !== undefined) {
    params.set(key, String(value));
  }
}

function setBooleanParam(params: URLSearchParams, key: string, value: boolean | undefined): void {
  if (value !== undefined) {
    params.set(key, String(value));
  }
}

function buildSearchCandidatesCustomFieldsBody(
  filters: SearchCandidateCustomFieldFilter[] | undefined,
): SearchCandidatesCustomFieldsBody | undefined {
  if (!filters || filters.length === 0) {
    return undefined;
  }

  return filters.map((filter) => {
    if (filter.filter_value === undefined) {
      return {
        field_id: filter.field_id,
        filter_type: filter.filter_type,
      };
    }

    return {
      field_id: filter.field_id,
      filter_type: filter.filter_type,
      filter_value: filter.filter_value,
    };
  });
}

function normalizePage(value: number | undefined): number {
  if (value === undefined || !Number.isFinite(value) || value < 1) {
    return 1;
  }

  return Math.floor(value);
}

function normalizeLimit(value: number | undefined): number {
  if (value === undefined || !Number.isFinite(value) || value < 1) {
    return 100;
  }

  return Math.floor(value);
}

function normalizeAssignedCandidatesLimit(value: number | undefined): number {
  return Math.min(normalizeLimit(value), 100);
}

function formatIssuePath(path: PropertyKey[]): string {
  if (path.length === 0) {
    return "<root>";
  }

  return path.map((segment) => String(segment)).join(".");
}
