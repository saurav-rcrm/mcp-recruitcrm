export const CUSTOM_FIELD_FILTER_TYPES = [
  "equals",
  "not_equals",
  "contains",
  "not_contains",
  "available",
  "not_available",
  "greater_than",
  "less_than",
  "yes",
  "no",
] as const;

export type CustomFieldFilterType = (typeof CUSTOM_FIELD_FILTER_TYPES)[number];

export type SearchCandidateCustomFieldFilter = {
  field_id: number;
  filter_type: CustomFieldFilterType;
  filter_value?: string | number;
};

export type SearchCandidatesInput = {
  page?: number;
  created_from?: string;
  created_to?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  linkedin?: string;
  marked_as_off_limit?: boolean;
  owner_email?: string;
  owner_id?: string;
  owner_name?: string;
  state?: string;
  updated_from?: string;
  updated_to?: string;
  candidate_slug?: string;
  contact_number?: string;
  country?: string;
  exact_search?: boolean;
  sort_by?: "createdon" | "updatedon";
  sort_order?: "asc" | "desc";
  custom_fields?: SearchCandidateCustomFieldFilter[];
};

export type RecruitCrmCandidate = {
  slug: string;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  contact_number?: string | null;
  current_organization?: string | null;
  current_status?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  work_ex_year?: number | string | null;
  updated_on?: string | null;
  position?: string | null;
  status_label?: string | null;
  relevant_experience?: number | string | null;
  specialization?: string | null;
  skill?: string | null;
  language_skills?: string | null;
  notice_period?: number | string | null;
  available_from?: string | null;
  willing_to_relocate?: number | boolean | null;
  current_salary?: string | null;
  salary_expectation?: string | null;
  salary_type?: {
    id?: number | null;
    label?: string | null;
  } | null;
  currency_id?: number | string | null;
  linkedin?: string | null;
  github?: string | null;
  candidate_summary?: string | null;
  owner?: number | string | null;
};

export type RecruitCrmSearchResponse = {
  current_page?: number;
  next_page_url?: string | null;
  data: RecruitCrmCandidate[];
};

export type RecruitCrmCandidateCustomField = {
  field_id: number;
  entity_type: string;
  field_type: string;
  field_name: string;
  default_value?: string | null;
};

export type CandidateSummary = {
  slug: string;
  full_name: string;
  position: string | null;
  current_organization: string | null;
  current_status: string | null;
  status_label: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  work_ex_year: number | null;
  updated_on: string | null;
};

export type SearchCandidatesResult = {
  page: number;
  returned_count: number;
  has_more: boolean;
  candidates: CandidateSummary[];
};

export type CandidateCustomFieldSummary = {
  field_id: number;
  field_name: string;
  field_type: string;
  searchable: boolean;
  supported_filter_types: CustomFieldFilterType[];
  filter_value_required_for: CustomFieldFilterType[];
  option_count: number;
  options_preview: string[];
};

export type CandidateCustomFieldListResult = {
  returned_count: number;
  fields: CandidateCustomFieldSummary[];
};

export type CandidateCustomFieldDetail = {
  field_id: number;
  field_name: string;
  field_type: string;
  searchable: boolean;
  supported_filter_types: CustomFieldFilterType[];
  filter_value_required_for: CustomFieldFilterType[];
  option_values: string[] | null;
};

export type CandidateDetail = {
  slug: string;
  full_name: string;
  email: string | null;
  contact_number: string | null;
  position: string | null;
  current_organization: string | null;
  current_status: string | null;
  status_label: string | null;
  location: string | null;
  work_ex_year: number | null;
  relevant_experience: number | null;
  specialization: string | null;
  skill: string | null;
  language_skills: string | null;
  notice_period: number | null;
  available_from: string | null;
  willing_to_relocate: boolean | null;
  salary: {
    current: string | null;
    expectation: string | null;
    type: string | null;
    currency_id: number | null;
  };
  linkedin: string | null;
  github: string | null;
  candidate_summary: string | null;
  updated_on: string | null;
  owner: {
    id: number | null;
  };
};
