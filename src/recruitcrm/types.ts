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
  include_contact_info?: boolean;
};

export type ListCandidatesInput = {
  limit?: number;
  page?: number;
  sort_by?: "createdon" | "updatedon";
  sort_order?: "asc" | "desc";
  include_contact_info?: boolean;
};

export type ListJobsInput = {
  limit?: number;
  page?: number;
  sort_by?: "createdon" | "updatedon";
  sort_order?: "asc" | "desc";
};

export type ListCompaniesInput = {
  limit?: number;
  page?: number;
  sort_by?: "createdon" | "updatedon";
  sort_order?: "asc" | "desc";
};

export type SearchContactsInput = {
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
  updated_from?: string;
  updated_to?: string;
  company_slug?: string;
  contact_number?: string;
  contact_slug?: string;
  exact_search?: boolean;
  sort_by?: "createdon" | "updatedon";
  sort_order?: "asc" | "desc";
  include_contact_info?: boolean;
};

export type ListContactsInput = {
  limit?: number;
  page?: number;
  sort_by?: "createdon" | "updatedon";
  sort_order?: "asc" | "desc";
  include_contact_info?: boolean;
};

export type ListUsersInput = {
  include_teams?: boolean;
  include_contact_info?: boolean;
};

export type SearchHotlistsInput = {
  page?: number;
  name?: string;
  shared?: 0 | 1;
  related_to_type: "candidate" | "company" | "contact" | "job";
};

export type CreateHotlistInput = {
  name: string;
  related_to_type: "candidate" | "company" | "contact" | "job";
  shared: 0 | 1;
  created_by: number;
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

export type SearchMeetingsInput = {
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

export type SearchNotesInput = {
  page?: number;
  added_from?: string;
  added_to?: string;
  related_to?: string;
  related_to_type?: string;
  updated_from?: string;
  updated_to?: string;
};

export type SearchCallLogsInput = {
  page?: number;
  call_type?: "CALL_OUTGOING" | "CALL_INCOMING";
  related_to?: string;
  related_to_type?: string;
  starting_from?: string;
  starting_to?: string;
  updated_from?: string;
  updated_to?: string;
};

export type SearchJobsInput = {
  page?: number;
  city?: string;
  company_name?: string;
  company_slug?: string;
  contact_email?: string;
  contact_name?: string;
  contact_number?: string;
  contact_slug?: string;
  country?: string;
  created_from?: string;
  created_to?: string;
  enable_job_application_form?: 0 | 1;
  exact_search?: boolean;
  full_address?: string;
  job_category?: string;
  job_skill?: string;
  job_slug?: string;
  job_status?: number;
  job_type?: 1 | 2 | 3 | 4;
  limit?: number;
  locality?: string;
  name?: string;
  note_for_candidates?: string;
  owner_email?: string;
  owner_id?: string;
  owner_name?: string;
  secondary_contact_email?: string;
  secondary_contact_name?: string;
  secondary_contact_number?: string;
  secondary_contact_slug?: string;
  sort_by?: "createdon" | "updatedon";
  sort_order?: "asc" | "desc";
  updated_from?: string;
  updated_to?: string;
};

export type SearchCompaniesInput = {
  page?: number;
  company_name?: string;
  created_from?: string;
  created_to?: string;
  marked_as_off_limit?: boolean;
  owner_email?: string;
  owner_id?: number;
  owner_name?: string;
  updated_from?: string;
  updated_to?: string;
  company_slug?: string;
  exact_search?: boolean;
  sort_by?: "createdon" | "updatedon";
  sort_order?: "asc" | "desc";
};

export type GetJobAssignedCandidatesInput = {
  page?: number;
  limit?: number;
  status_id?: string;
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
  country?: string | number | null;
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
  [key: string]: unknown;
};

export type RecruitCrmSearchResponse = {
  current_page?: number;
  next_page_url?: string | null;
  data: RecruitCrmCandidate[];
};

export type RecruitCrmAssignedCandidateStatus = {
  status_id?: number | string | null;
  label?: string | number | null;
  [key: string]: unknown;
};

export type RecruitCrmJobAssignedCandidate = {
  candidate: RecruitCrmCandidate;
  stage_date?: string | number | null;
  status?: RecruitCrmAssignedCandidateStatus | null;
  [key: string]: unknown;
};

export type RecruitCrmJobAssignedCandidatesResponse = {
  current_page?: number;
  next_page_url?: string | null;
  data: RecruitCrmJobAssignedCandidate[];
  [key: string]: unknown;
};

export type RecruitCrmHiringStage = {
  stage_id?: number | string | null;
  status_id?: number | string | null;
  label?: string | number | null;
  [key: string]: unknown;
};

export type RecruitCrmHiringPipelineResponse = RecruitCrmHiringStage[];

export type RecruitCrmJobStatus = {
  id?: number | string | null;
  label?: string | number | null;
  [key: string]: unknown;
};

export type RecruitCrmJob = {
  id?: number | string | null;
  slug?: string | number | null;
  name?: string | number | null;
  company_slug?: string | number | null;
  contact_slug?: string | number | null;
  secondary_contact_slugs?: Array<string | number | null> | null;
  note_for_candidates?: string | number | null;
  number_of_openings?: number | string | null;
  minimum_experience?: number | string | null;
  maximum_experience?: number | string | null;
  min_annual_salary?: number | string | null;
  max_annual_salary?: number | string | null;
  salary_type?:
    | string
    | number
    | {
        id?: number | string | null;
        label?: string | number | null;
      }
    | null;
  job_status?: RecruitCrmJobStatus | null;
  job_skill?: string | number | null;
  job_type?: string | number | null;
  pay_rate?: number | string | null;
  bill_rate?: number | string | null;
  job_category?: string | number | null;
  city?: string | number | null;
  locality?: string | number | null;
  state?: string | number | null;
  country?: string | number | null;
  enable_job_application_form?: number | string | boolean | null;
  application_form_url?: string | number | null;
  created_on?: string | number | null;
  updated_on?: string | number | null;
  owner?: number | string | null;
  [key: string]: unknown;
};

export type RecruitCrmJobSearchResponse = {
  current_page?: number;
  next_page_url?: string | null;
  data: RecruitCrmJob[];
};

export type RecruitCrmCompany = {
  id?: number | string | null;
  slug?: string | number | null;
  company_name?: string | number | null;
  website?: string | number | null;
  city?: string | number | null;
  locality?: string | number | null;
  state?: string | number | null;
  country?: string | number | null;
  postal_code?: string | number | null;
  address?: string | number | null;
  owner?: number | string | null;
  contact_slug?: string | number | Array<string | number | null> | null;
  is_child_company?: string | number | boolean | null;
  is_parent_company?: string | number | boolean | null;
  child_company_slugs?: Array<string | number | null> | null;
  parent_company_slug?: string | number | null;
  off_limit_status_id?: number | string | null;
  status_label?: string | number | null;
  off_limit_reason?: string | number | null;
  off_limit_end_date?: string | number | null;
  created_on?: string | number | null;
  updated_on?: string | number | null;
  [key: string]: unknown;
};

export type RecruitCrmCompanySearchResponse = {
  current_page?: number;
  next_page_url?: string | null;
  data: RecruitCrmCompany[];
};

export type RecruitCrmContact = {
  id?: number | string | null;
  slug?: string | number | null;
  first_name?: string | number | null;
  last_name?: string | number | null;
  email?: string | number | null;
  contact_number?: string | number | null;
  linkedin?: string | number | null;
  company_slug?: string | number | null;
  additional_company_slugs?: Array<string | number | null> | null;
  designation?: string | number | null;
  city?: string | number | null;
  locality?: string | number | null;
  created_on?: string | number | null;
  updated_on?: string | number | null;
  [key: string]: unknown;
};

export type RecruitCrmContactSearchResponse = {
  current_page?: number;
  next_page_url?: string | null;
  data: RecruitCrmContact[];
};

export type RecruitCrmHotlist = {
  id?: number | string | null;
  name?: string | number | null;
  related_to_type?: string | number | null;
  related?: string | number | null;
  shared?: number | string | boolean | null;
  created_by?: number | string | null;
  [key: string]: unknown;
};

export type RecruitCrmHotlistSearchResponse = {
  current_page?: number;
  next_page_url?: string | null;
  data: RecruitCrmHotlist[];
};

export type CreatedHotlist = RecruitCrmHotlist;

export type RecruitCrmUserTeam = {
  team_id?: number | string | null;
  team_name?: string | number | null;
  [key: string]: unknown;
};

export type RecruitCrmUser = {
  id?: number | string | null;
  first_name?: string | number | null;
  last_name?: string | number | null;
  email?: string | number | null;
  contact_number?: string | number | null;
  status?: string | number | null;
  teams?: Array<RecruitCrmUserTeam | number> | null;
  [key: string]: unknown;
};

export type RecruitCrmUserListResponse = RecruitCrmUser[];

export type RecruitCrmTaskType = {
  id?: number | string | null;
  label?: string | number | null;
  [key: string]: unknown;
};

export type RecruitCrmActivityRelated = {
  first_name?: string | number | null;
  last_name?: string | number | null;
  company_name?: string | number | null;
  name?: string | number | null;
  [key: string]: unknown;
};

export type RecruitCrmTask = {
  id?: number | string | null;
  related_to?: string | number | null;
  task_type?: RecruitCrmTaskType | RecruitCrmTaskType[] | null;
  related_to_type?: string | number | null;
  related_to_name?: string | number | null;
  related?: RecruitCrmActivityRelated | null;
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

export type RecruitCrmMeetingType = {
  id?: number | string | null;
  label?: string | number | null;
  [key: string]: unknown;
};

export type RecruitCrmMeeting = {
  id?: number | string | null;
  title?: string | number | null;
  meeting_type?: RecruitCrmMeetingType | RecruitCrmMeetingType[] | null;
  description?: string | number | null;
  address?: string | number | null;
  reminder?: number | string | null;
  start_date?: string | number | null;
  end_date?: string | number | null;
  related_to?: string | number | null;
  related_to_type?: string | number | null;
  related?: RecruitCrmActivityRelated | null;
  do_not_send_calendar_invites?: number | string | boolean | null;
  status?: number | string | null;
  reminder_date?: string | number | null;
  all_day?: number | string | boolean | null;
  owner?: number | string | null;
  created_on?: string | number | null;
  updated_on?: string | number | null;
  created_by?: number | string | null;
  updated_by?: number | string | null;
  [key: string]: unknown;
};

export type RecruitCrmMeetingSearchResponse = {
  current_page?: number;
  next_page_url?: string | null;
  data: RecruitCrmMeeting[];
};

export type RecruitCrmNoteType = {
  id?: number | string | null;
  label?: string | number | null;
  [key: string]: unknown;
};

export type RecruitCrmNote = {
  id?: number | string | null;
  note_type?: RecruitCrmNoteType | RecruitCrmNoteType[] | null;
  description?: string | number | null;
  related_to?: string | number | null;
  related_to_type?: string | number | null;
  related?: RecruitCrmActivityRelated | null;
  created_on?: string | number | null;
  updated_on?: string | number | null;
  created_by?: number | string | null;
  updated_by?: number | string | null;
  [key: string]: unknown;
};

export type RecruitCrmNoteSearchResponse = {
  current_page?: number;
  next_page_url?: string | null;
  data: RecruitCrmNote[];
};

export type RecruitCrmCallLogType = {
  id?: number | string | null;
  label?: string | number | null;
  [key: string]: unknown;
};

export type RecruitCrmCallLog = {
  id?: number | string | null;
  call_type?: string | number | null;
  custom_call_type?: RecruitCrmCallLogType | RecruitCrmCallLogType[] | null;
  call_started_on?: string | number | null;
  contact_number?: string | number | null;
  call_notes?: string | number | null;
  related_to?: string | number | null;
  related_to_type?: string | number | null;
  related?: RecruitCrmActivityRelated | null;
  duration?: number | string | null;
  created_on?: string | number | null;
  updated_on?: string | number | null;
  created_by?: number | string | null;
  updated_by?: number | string | null;
  [key: string]: unknown;
};

export type RecruitCrmCallLogSearchResponse = {
  current_page?: number;
  next_page_url?: string | null;
  data: RecruitCrmCallLog[];
};

export type RecruitCrmCandidateJobAssignmentHiringStageHistoryItem = {
  job_slug?: string | number | null;
  job_name?: string | number | null;
  company_slug?: string | number | null;
  company_name?: string | number | null;
  job_status_id?: number | string | null;
  job_status_label?: string | number | null;
  candidate_status_id?: number | string | null;
  candidate_status?: string | number | null;
  remark?: string | number | null;
  updated_by?: number | string | null;
  updated_on?: string | number | null;
  [key: string]: unknown;
};

export type RecruitCrmCandidateJobAssignmentHiringStageHistoryResponse =
  RecruitCrmCandidateJobAssignmentHiringStageHistoryItem[];

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
  email?: string | null;
  contact_number?: string | null;
  linkedin?: string | null;
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

export type ActivityRelatedSummary = {
  first_name?: string;
  last_name?: string;
  company_name?: string;
  name?: string;
};

export type TaskSummary = {
  id: number | null;
  related_to: string | null;
  task_type: TaskTypeSummary[] | null;
  related_to_type: string | null;
  related_to_name: string | null;
  related: ActivityRelatedSummary | null;
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

export type MeetingTypeSummary = {
  id: string | number | null;
  label: string | null;
};

export type MeetingSummary = {
  id: number | null;
  title: string | null;
  meeting_type: MeetingTypeSummary[] | null;
  description: string | null;
  address: string | null;
  reminder: number | null;
  start_date: string | null;
  end_date: string | null;
  related_to: string | null;
  related_to_type: string | null;
  related: ActivityRelatedSummary | null;
  do_not_send_calendar_invites: boolean | null;
  status: string | number | null;
  reminder_date: string | null;
  all_day: boolean | null;
  owner: number | null;
  created_on: string | null;
  updated_on: string | null;
  created_by: number | null;
  updated_by: number | null;
};

export type SearchMeetingsResult = {
  page: number;
  returned_count: number;
  has_more: boolean;
  meetings: MeetingSummary[];
};

export type NoteTypeSummary = {
  id: string | number | null;
  label: string | null;
};

export type NoteSummary = {
  id: number | null;
  note_type: NoteTypeSummary[] | null;
  description: string | null;
  related_to: string | null;
  related_to_type: string | null;
  related: ActivityRelatedSummary | null;
  created_on: string | null;
  updated_on: string | null;
  created_by: number | null;
  updated_by: number | null;
};

export type SearchNotesResult = {
  page: number;
  returned_count: number;
  has_more: boolean;
  notes: NoteSummary[];
};

export type CallLogTypeSummary = {
  id: string | number | null;
  label: string | null;
};

export type CallLogSummary = {
  id: number | null;
  call_type: string | null;
  custom_call_type: CallLogTypeSummary[] | null;
  call_started_on: string | null;
  contact_number: string | null;
  call_notes: string | null;
  related_to: string | null;
  related_to_type: string | null;
  related: ActivityRelatedSummary | null;
  duration: string | number | null;
  created_on: string | null;
  updated_on: string | null;
  created_by: number | null;
  updated_by: number | null;
};

export type SearchCallLogsResult = {
  page: number;
  returned_count: number;
  has_more: boolean;
  call_logs: CallLogSummary[];
};

export type JobStatusSummary = {
  id: number | null;
  label: string | null;
};

export type JobSummary = {
  id: number | null;
  slug: string | null;
  name: string | null;
  company_slug: string | null;
  contact_slug: string | null;
  secondary_contact_slugs: string[];
  job_status: JobStatusSummary | null;
  note_for_candidates: string | null;
  number_of_openings: number | null;
  minimum_experience: number | null;
  maximum_experience: number | null;
  min_annual_salary: number | null;
  max_annual_salary: number | null;
  pay_rate: number | null;
  bill_rate: number | null;
  salary_type: string | null;
  job_type: string | null;
  job_category: string | null;
  job_skill: string | null;
  city: string | null;
  locality: string | null;
  state: string | null;
  country: string | null;
  enable_job_application_form: boolean | null;
  application_form_url: string | null;
  owner: number | null;
  created_on: string | null;
  updated_on: string | null;
};

export type SearchJobsResult = {
  page: number;
  returned_count: number;
  has_more: boolean;
  jobs: JobSummary[];
};

export type CompanyOffLimitSummary = {
  status_id: number | null;
  status_label: string | null;
  reason: string | null;
  end_date: string | null;
};

export type CompanySummary = {
  id: number | null;
  slug: string | null;
  company_name: string | null;
  website: string | null;
  city: string | null;
  locality: string | null;
  state: string | null;
  country: string | null;
  postal_code: string | null;
  address: string | null;
  owner: number | null;
  contact_slugs: string[];
  is_child_company: boolean | null;
  is_parent_company: boolean | null;
  child_company_slugs: string[];
  parent_company_slug: string | null;
  marked_as_off_limit: boolean;
  off_limit: CompanyOffLimitSummary | null;
  created_on: string | null;
  updated_on: string | null;
};

export type SearchCompaniesResult = {
  page: number;
  returned_count: number;
  has_more: boolean;
  companies: CompanySummary[];
};

export type ContactSummary = {
  slug: string;
  first_name: string | null;
  last_name: string | null;
  designation: string | null;
  company_slug: string | null;
  additional_company_slugs: string[];
  city: string | null;
  locality: string | null;
  updated_on: string | null;
  email?: string | null;
  contact_number?: string | null;
  linkedin?: string | null;
};

export type SearchContactsResult = {
  page: number;
  returned_count: number;
  has_more: boolean;
  contacts: ContactSummary[];
};

export type HotlistSummary = {
  id: number | null;
  name: string | null;
  related_to_type: string | null;
  shared: boolean | null;
  created_by: number | null;
  related_count: number;
  related_slugs?: string[];
};

export type SearchHotlistsResult = {
  page: number;
  returned_count: number;
  has_more: boolean;
  hotlists: HotlistSummary[];
};

export type CreateHotlistResult = {
  hotlist_id: number | null;
  name: string | null;
  related_to_type: string | null;
  shared: boolean | null;
  created_by: number | null;
};

export type UserTeamSummary = {
  team_id: number | null;
  team_name: string | null;
};

export type UserSummary = {
  id: number | null;
  first_name: string | null;
  last_name: string | null;
  status: string | null;
  teams?: UserTeamSummary[];
  email?: string | null;
  contact_number?: string | null;
};

export type ListUsersResult = {
  returned_count: number;
  users: UserSummary[];
};

export type AssignedCandidateSummary = {
  candidate_slug: string;
  first_name: string | null;
  last_name: string | null;
  position: string | null;
  current_organization: string | null;
  current_status: string | null;
  city: string | null;
  country: string | null;
  updated_on: string | null;
  stage_date: string | null;
  status_id: number | null;
  status_label: string | null;
};

export type JobAssignedCandidatesResult = {
  job_slug: string;
  page: number;
  returned_count: number;
  has_more: boolean;
  assigned_candidates: AssignedCandidateSummary[];
};

export type HiringStageSummary = {
  stage_id: number | null;
  label: string | null;
};

export type CandidateHiringStagesResult = {
  returned_count: number;
  stages: HiringStageSummary[];
};

export type CandidateJobAssignmentHiringStageHistoryItem = {
  job_slug: string | null;
  job_name: string | null;
  company_slug: string | null;
  company_name: string | null;
  job_status_id: number | null;
  job_status_label: string | null;
  candidate_status_id: number | null;
  candidate_status: string | null;
  remark: string | null;
  updated_by: number | null;
  updated_on: string | null;
};

export type CandidateJobAssignmentHiringStageHistoryResult = {
  candidate_slug: string;
  returned_count: number;
  history: CandidateJobAssignmentHiringStageHistoryItem[];
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

export type CompanyDetail = {
  id?: number | string;
  slug?: number | string;
  contact_slug?: unknown;
  custom_fields?: unknown[];
  resource_url?: unknown;
  [key: string]: unknown;
};

export type ContactDetail = {
  id?: number | string;
  slug?: number | string;
  additional_company_slugs?: unknown;
  custom_fields?: unknown[];
  resource_url?: unknown;
  [key: string]: unknown;
};

export type GetCandidateDetailsInput = {
  candidate_slugs: string[];
};

export type GetCompanyDetailsInput = {
  company_slugs: string[];
};

export type GetContactDetailsInput = {
  contact_slugs: string[];
};

export type AddRecordsToHotlistInput = {
  hotlist_id: number;
  related_slugs: string[];
};

export type CandidateDetailsError = {
  slug: string;
  error: string;
  status_code: number | null;
};

export type CandidateDetailsResult = {
  requested_count: number;
  successful_count: number;
  failed_count: number;
  candidates: CandidateDetail[];
  errors: CandidateDetailsError[];
};

export type CompanyDetailsError = {
  slug: string;
  error: string;
  status_code: number | null;
};

export type CompanyDetailsResult = {
  requested_count: number;
  successful_count: number;
  failed_count: number;
  companies: CompanyDetail[];
  errors: CompanyDetailsError[];
};

export type ContactDetailsError = {
  slug: string;
  error: string;
  status_code: number | null;
};

export type ContactDetailsResult = {
  requested_count: number;
  successful_count: number;
  failed_count: number;
  contacts: ContactDetail[];
  errors: ContactDetailsError[];
};

export type AddRecordsToHotlistError = {
  slug: string;
  error: string;
  status_code: number | null;
};

export type AddRecordsToHotlistResult = {
  hotlist_id: number;
  requested_count: number;
  successful_count: number;
  failed_count: number;
  added_slugs: string[];
  errors: AddRecordsToHotlistError[];
};

export type JobDetail = {
  id?: number | string;
  slug?: number | string;
  job_questions?: unknown[];
  custom_fields?: unknown[];
  targetcompanies?: unknown[];
  collaborator_users?: unknown[];
  collaborator_teams?: unknown[];
  xml_feeds?: unknown[];
  [key: string]: unknown;
};
