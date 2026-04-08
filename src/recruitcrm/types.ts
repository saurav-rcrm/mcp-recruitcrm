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

export type SearchTasksInput = {
  page?: number;
  created_from?: string;
  created_to?: string;
  owner_email?: string;
  owner_id?: string;
  owner_name?: string;
  related_to?: string;
  related_to_type?: string;
  starting_from?: string;
  starting_to?: string;
  title?: string;
  updated_from?: string;
  updated_to?: string;
};

export type RecruitCrmCandidate = {
  slug: string;
  first_name?: string | number | null;
  last_name?: string | number | null;
  email?: string | null;
  contact_number?: string | null;
  current_organization?: string | number | null;
  current_status?: string | number | null;
  city?: string | number | null;
  state?: string | null;
  country?: string | null;
  work_ex_year?: number | string | null;
  updated_on?: string | number | null;
  position?: string | number | null;
  status_label?: string | null;
  relevant_experience?: number | string | null;
  specialization?: string | null;
  skill?: string | null;
  language_skills?: string | null;
  notice_period?: number | string | null;
  available_from?: string | null;
  willing_to_relocate?: number | boolean | null;
  current_salary?: string | number | null;
  salary_expectation?: string | number | null;
  salary_type?: {
    id?: number | string | null;
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

export type RecruitCrmTaskType = {
  id?: number | string | null;
  label?: string | number | null;
  [key: string]: unknown;
};

export type RecruitCrmTask = {
  id?: number | string | null;
  related_to?: string | number | null;
  task_type?: RecruitCrmTaskType[] | null;
  related_to_type?: string | number | null;
  related_to_name?: string | number | null;
  description?: string | number | null;
  title?: string | number | null;
  status?: number | string | null;
  start_date?: string | number | null;
  reminder_date?: string | number | null;
  reminder?: number | string | null;
  owner?: number | string | null;
  created_on?: string | number | null;
  updated_on?: string | number | null;
  created_by?: number | string | null;
  updated_by?: number | string | null;
  [key: string]: unknown;
};

export type RecruitCrmTaskSearchResponse = {
  current_page?: number;
  next_page_url?: string | null;
  data: RecruitCrmTask[];
};

export type RecruitCrmCandidateDetailCustomField = {
  field_id: number;
  entity_type: string;
  field_name: string;
  field_type: string;
  value: unknown;
};

export type RecruitCrmCandidateWorkHistoryItem = {
  candidate_id: number | string | null;
  id: number | string;
  title: string | null;
  work_company_name: string | null;
  employment_type: number | string | null;
  industry_id: number | string | null;
  work_location: string | null;
  salary: number | string | null;
  is_currently_working: number | string | boolean | null;
  work_start_date: number | string | null;
  work_end_date: number | string | null;
  work_description: string | null;
};

export type RecruitCrmCandidateEducationHistoryItem = {
  candidate_id: number | string | null;
  id: number | string;
  institute_name: string | null;
  educational_qualification: string | null;
  educational_specialization: string | null;
  grade: string | null;
  education_location: string | null;
  education_start_date: number | string | null;
  education_end_date: number | string | null;
  education_description: string | null;
};

export type RecruitCrmCandidateCustomField = {
  field_id: number;
  entity_type?: string;
  field_type: string;
  field_name: string;
  default_value?: unknown;
};

export type CandidateSummary = {
  slug: string;
  first_name: string | null;
  last_name: string | null;
  position: string | null;
  current_organization: string | null;
  current_status: string | null;
  city: string | null;
  updated_on: string | null;
};

export type SearchCandidatesResult = {
  page: number;
  returned_count: number;
  has_more: boolean;
  candidates: CandidateSummary[];
};

export type TaskTypeSummary = {
  id: string | number | null;
  label: string | null;
};

export type TaskSummary = {
  id: number | null;
  related_to: string | null;
  task_type: TaskTypeSummary[] | null;
  related_to_type: string | null;
  related_to_name: string | null;
  description: string | null;
  title: string | null;
  status: number | null;
  start_date: string | null;
  reminder_date: string | null;
  reminder: number | null;
  owner: number | null;
  created_on: string | null;
  updated_on: string | null;
  created_by: number | null;
  updated_by: number | null;
};

export type SearchTasksResult = {
  page: number;
  returned_count: number;
  has_more: boolean;
  tasks: TaskSummary[];
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
  id?: number | string;
  slug?: number | string;
  resume?: unknown;
  custom_fields?: unknown[];
  work_history?: unknown[];
  education_history?: unknown[];
  [key: string]: unknown;
};
