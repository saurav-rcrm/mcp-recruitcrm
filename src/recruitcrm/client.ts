import * as z from "zod/v4";

import { invalidApiResponse, mapFetchError, mapHttpError } from "../errors.js";
import type { AppConfig } from "../config.js";
import { nodeHttpTransport, type HttpTransport } from "./http.js";
import type {
  RecruitCrmCandidateCustomField,
  CandidateDetail,
  RecruitCrmSearchResponse,
  RecruitCrmTaskSearchResponse,
  SearchCandidatesInput,
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
    updated_on: nullableStringLikeSchema,
    position: nullableStringLikeSchema,
  })
  .passthrough();

const searchResponseSchema = z
  .object({
    current_page: z.coerce.number().int().positive().optional(),
    next_page_url: z.union([z.string(), z.null()]).optional(),
    data: z.array(candidateSchema),
  })
  .passthrough();

const taskTypeSchema = z
  .object({
    id: nullableNumberOrStringSchema,
    label: nullableStringLikeSchema,
  })
  .passthrough();

const taskSchema = z
  .object({
    id: nullableNumberOrStringSchema,
    related_to: nullableStringLikeSchema,
    task_type: z.union([z.array(taskTypeSchema), z.null()]).optional(),
    related_to_type: nullableStringLikeSchema,
    related_to_name: nullableStringLikeSchema,
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
  .object({
    current_page: z.coerce.number().int().positive().optional(),
    next_page_url: z.union([z.string(), z.null()]).optional(),
    data: z.array(taskSchema),
  })
  .passthrough();

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

    return this.#requestJson("/candidates/search", searchResponseSchema, request);
  }

  async searchTasks(filters: SearchTasksInput): Promise<RecruitCrmTaskSearchResponse> {
    const request = buildSearchTasksRequest(filters);

    return this.#requestJson("/tasks/search", taskSearchResponseSchema, request);
  }

  async getCandidateDetails(candidateSlug: string): Promise<CandidateDetail> {
    return this.#requestJson(`/candidates/${encodeURIComponent(candidateSlug)}`, candidateDetailSchema);
  }

  async getCandidateCustomFields(): Promise<RecruitCrmCandidateCustomField[]> {
    return this.#requestJson("/custom-fields/candidates", candidateCustomFieldsResponseSchema);
  }

  async #requestJson<T>(
    path: string,
    schema: z.ZodType<T>,
    options: GetRequestOptions = {},
  ): Promise<T> {
    const url = new URL(`${this.#baseUrl}${path}`);

    if (options.query) {
      url.search = options.query.toString();
    }

    let response;

    try {
      response = await this.#transport({
        url,
        method: "GET",
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
      throw mapHttpError(response.statusCode);
    }

    let payload: unknown;

    try {
      payload = JSON.parse(response.bodyText);
    } catch (error) {
      throw invalidApiResponse();
    }

    const parsed = schema.safeParse(payload);

    if (!parsed.success) {
      this.#logSchemaIssues(path, parsed.error.issues);
      throw invalidApiResponse();
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

export type GetRequestOptions = {
  query?: URLSearchParams;
  jsonBody?: {
    custom_fields: SearchCandidatesCustomFieldsBody;
  };
};

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

function setStringParam(params: URLSearchParams, key: string, value: string | undefined): void {
  if (value !== undefined) {
    params.set(key, value);
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

function formatIssuePath(path: PropertyKey[]): string {
  if (path.length === 0) {
    return "<root>";
  }

  return path.map((segment) => String(segment)).join(".");
}
