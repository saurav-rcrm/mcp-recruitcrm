import * as z from "zod/v4";

import { invalidApiResponse, mapFetchError, mapHttpError } from "../errors.js";
import type { AppConfig } from "../config.js";
import { nodeHttpTransport, type HttpTransport } from "./http.js";
import type {
  RecruitCrmCandidateCustomField,
  RecruitCrmSearchResponse,
  SearchCandidatesInput,
  SearchCandidateCustomFieldFilter,
} from "./types.js";

const candidateSchema = z
  .object({
    slug: z.union([z.string(), z.number()]).transform((value) => String(value)),
    first_name: z.string().nullish(),
    last_name: z.string().nullish(),
    email: z.string().nullish(),
    contact_number: z.string().nullish(),
    current_organization: z.string().nullish(),
    current_status: z.string().nullish(),
    city: z.string().nullish(),
    state: z.string().nullish(),
    country: z.string().nullish(),
    work_ex_year: z.union([z.number(), z.string()]).nullish(),
    updated_on: z.string().nullish(),
    position: z.string().nullish(),
    status_label: z.string().nullish(),
    relevant_experience: z.union([z.number(), z.string()]).nullish(),
    specialization: z.string().nullish(),
    skill: z.string().nullish(),
    language_skills: z.string().nullish(),
    notice_period: z.union([z.number(), z.string()]).nullish(),
    available_from: z.string().nullish(),
    willing_to_relocate: z.union([z.number(), z.boolean()]).nullish(),
    current_salary: z.string().nullish(),
    salary_expectation: z.string().nullish(),
    salary_type: z
      .object({
        id: z.number().nullish(),
        label: z.string().nullish(),
      })
      .nullish(),
    currency_id: z.union([z.number(), z.string()]).nullish(),
    linkedin: z.string().nullish(),
    github: z.string().nullish(),
    candidate_summary: z.string().nullish(),
    owner: z.union([z.number(), z.string()]).nullish(),
  })
  .passthrough();

const searchResponseSchema = z
  .object({
    current_page: z.number().int().positive().optional(),
    next_page_url: z.union([z.string(), z.null()]).optional(),
    data: z.array(candidateSchema),
  })
  .passthrough();

const candidateCustomFieldSchema = z
  .object({
    field_id: z.number().int().positive(),
    entity_type: z.string(),
    field_type: z.string(),
    field_name: z.string(),
    default_value: z.string().nullish(),
  })
  .passthrough();

const candidateCustomFieldsResponseSchema = z.array(candidateCustomFieldSchema);

export class RecruitCrmClient {
  readonly #apiToken: string;
  readonly #baseUrl: string;
  readonly #timeoutMs: number;
  readonly #transport: HttpTransport;

  constructor(config: AppConfig, transport: HttpTransport = nodeHttpTransport) {
    this.#apiToken = config.apiToken;
    this.#baseUrl = config.baseUrl;
    this.#timeoutMs = config.timeoutMs;
    this.#transport = transport;
  }

  async searchCandidates(filters: SearchCandidatesInput): Promise<RecruitCrmSearchResponse> {
    const request = buildSearchCandidatesRequest(filters);

    return this.#requestJson("/candidates/search", searchResponseSchema, request);
  }

  async getCandidateCustomFields(): Promise<RecruitCrmCandidateCustomField[]> {
    return this.#requestJson("/custom-fields/candidates", candidateCustomFieldsResponseSchema);
  }

  async #requestJson<T>(
    path: string,
    schema: z.ZodType<T>,
    options: SearchCandidatesRequest = {},
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
      throw invalidApiResponse();
    }

    return parsed.data;
  }
}

export type SearchCandidatesRequest = {
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

export function buildSearchCandidatesRequest(filters: SearchCandidatesInput): SearchCandidatesRequest {
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
