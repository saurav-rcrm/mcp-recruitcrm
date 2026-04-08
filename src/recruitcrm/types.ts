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
  entity_type: string;
  field_type: string;
  field_name: string;
  default_value?: string | null;
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
  id: number | string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  contact_number: string | null;
  gender_id: number | string | null;
  qualification_id: number | string | null;
  specialization: string | null;
  work_ex_year: number | string | null;
  candidate_dob: string | number | null;
  current_salary: number | string | null;
  salary_expectation: number | string | null;
  resume: string | null;
  willing_to_relocate: number | string | boolean | null;
  current_organization: string | null;
  current_status: string | null;
  notice_period: number | string | null;
  currency_id: number | string | null;
  slug: string;
  profile_update_link_status: number | string | null;
  profile_update_requested_on: string | null;
  profile_updated_on: string | null;
  avatar: string | null;
  facebook: string | null;
  twitter: string | null;
  linkedin: string | null;
  github: string | null;
  xing: string | null;
  created_on: string | null;
  updated_on: string | null;
  city: string | null;
  locality: string | null;
  state: string | null;
  country: string | null;
  address: string | null;
  relevant_experience: number | string | null;
  position: string | null;
  available_from: string | number | null;
  salary_type: {
    id: number | string | null;
    label: string | null;
  } | null;
  source: string | null;
  language_skills: string | null;
  skill: string | null;
  custom_fields: RecruitCrmCandidateDetailCustomField[];
  created_by: number | string | null;
  updated_by: number | string | null;
  owner: number | string | null;
  resource_url: string | null;
  is_email_opted_out: string | boolean | null;
  email_opt_out_source: string | null;
  candidate_summary: string | null;
  work_history: RecruitCrmCandidateWorkHistoryItem[];
  education_history: RecruitCrmCandidateEducationHistoryItem[];
  current_organization_slug: string | null;
  last_calllog_added_on: string | null;
  last_calllog_added_by: number | string | null;
  last_email_sent_on: string | null;
  last_email_sent_by: number | string | null;
  last_sms_sent_on: string | null;
  last_sms_sent_by: number | string | null;
  last_meeting_created_on: string | null;
  last_meeting_created_by: number | string | null;
  last_linkedin_message_sent_on: string | null;
  last_linkedin_message_sent_by: number | string | null;
  last_communication: string | null;
  postal_code: string | null;
  off_limit_status_id: number | string | null;
  status_label: string | null;
  off_limit_reason: string | null;
  off_limit_end_date: string | null;
};
