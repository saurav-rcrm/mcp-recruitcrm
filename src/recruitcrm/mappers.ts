import type {
  ActivityRelatedSummary,
  AssignedCandidateSummary,
  CandidateHiringStagesResult,
  JobStatusesResult,
  RecruitCrmJobStatusListResponse,
  CallLogSummary,
  CallLogTypeSummary,
  CandidateJobAssignmentHiringStageHistoryItem,
  CandidateJobAssignmentHiringStageHistoryResult,
  CandidateSummary,
  ContactSummary,
  CreatedHotlist,
  CreatedNote,
  CreatedTask,
  CreateHotlistResult,
  CreateNoteResult,
  CreateTaskResult,
  HotlistSummary,
  CompanyOffLimitSummary,
  CompanySummary,
  JobStatusSummary,
  JobSummary,
  ListNoteTypesResult,
  ListTaskTypesResult,
  MeetingSummary,
  MeetingTypeSummary,
  NoteCollaboratorTeamSummary,
  NoteCollaboratorUserSummary,
  RecruitCrmActivityRelated,
  RecruitCrmCandidate,
  RecruitCrmCandidateJobAssignmentHiringStageHistoryItem,
  RecruitCrmCandidateJobAssignmentHiringStageHistoryResponse,
  RecruitCrmCallLog,
  RecruitCrmCallLogSearchResponse,
  RecruitCrmCallLogType,
  RecruitCrmCompany,
  RecruitCrmCompanySearchResponse,
  RecruitCrmContact,
  RecruitCrmContactSearchResponse,
  RecruitCrmHotlist,
  RecruitCrmHotlistSearchResponse,
  RecruitCrmHiringPipelineResponse,
  RecruitCrmHiringStage,
  RecruitCrmJob,
  RecruitCrmJobAssignedCandidate,
  RecruitCrmJobAssignedCandidatesResponse,
  RecruitCrmJobSearchResponse,
  RecruitCrmJobStatus,
  RecruitCrmMeeting,
  RecruitCrmMeetingSearchResponse,
  RecruitCrmMeetingType,
  HiringStageSummary,
  JobAssignedCandidatesResult,
  RecruitCrmNote,
  RecruitCrmNoteCollaboratorTeam,
  RecruitCrmNoteCollaboratorUser,
  RecruitCrmNoteSearchResponse,
  RecruitCrmNoteType,
  RecruitCrmNoteTypeListResponse,
  RecruitCrmTask,
  RecruitCrmTaskCollaborator,
  RecruitCrmTaskCollaboratorTeam,
  RecruitCrmTaskCollaboratorUser,
  RecruitCrmTaskSearchResponse,
  RecruitCrmTaskType,
  RecruitCrmTaskTypeListResponse,
  RecruitCrmUser,
  RecruitCrmUserListResponse,
  RecruitCrmUserTeam,
  RecruitCrmSearchResponse,
  ListUsersResult,
  SearchMeetingsResult,
  SearchNotesResult,
  SearchCallLogsResult,
  SearchCandidatesResult,
  SearchContactsResult,
  SearchCompaniesResult,
  SearchHotlistsResult,
  SearchJobsResult,
  SearchTasksResult,
  TaskCollaboratorSummary,
  TaskCollaboratorTeamSummary,
  TaskCollaboratorUserSummary,
  NoteSummary,
  NoteTypeSummary,
  TaskSummary,
  TaskTypeSummary,
  UserSummary,
  UserTeamSummary,
} from "./types.js";

export function mapSearchCandidatesResult(
  response: RecruitCrmSearchResponse,
  options: { includeContactInfo?: boolean } = {},
): SearchCandidatesResult {
  return {
    page: response.current_page ?? 1,
    returned_count: response.data.length,
    has_more: hasNextPage(response.next_page_url),
    candidates: response.data.map((candidate) =>
      mapCandidateSummary(candidate, options),
    ),
  };
}

export function mapSearchJobsResult(response: RecruitCrmJobSearchResponse): SearchJobsResult {
  return {
    page: response.current_page ?? 1,
    returned_count: response.data.length,
    has_more: hasNextPage(response.next_page_url),
    jobs: response.data.map(mapJobSummary),
  };
}

export function mapSearchCompaniesResult(response: RecruitCrmCompanySearchResponse): SearchCompaniesResult {
  return {
    page: response.current_page ?? 1,
    returned_count: response.data.length,
    has_more: hasNextPage(response.next_page_url),
    companies: response.data.map(mapCompanySummary),
  };
}

export function mapSearchContactsResult(
  response: RecruitCrmContactSearchResponse,
  options: { includeContactInfo?: boolean } = {},
): SearchContactsResult {
  return {
    page: response.current_page ?? 1,
    returned_count: response.data.length,
    has_more: hasNextPage(response.next_page_url),
    contacts: response.data.map((contact) => mapContactSummary(contact, options)),
  };
}

export function mapSearchHotlistsResult(
  response: RecruitCrmHotlistSearchResponse,
  options: { includeRelatedSlugs?: boolean } = {},
): SearchHotlistsResult {
  return {
    page: response.current_page ?? 1,
    returned_count: response.data.length,
    has_more: hasNextPage(response.next_page_url),
    hotlists: response.data.map((hotlist) => mapHotlistSummary(hotlist, options)),
  };
}

export function mapListUsersResult(
  response: RecruitCrmUserListResponse,
  options: { includeTeams?: boolean; includeContactInfo?: boolean } = {},
): ListUsersResult {
  return {
    returned_count: response.length,
    users: response.map((user) => mapUserSummary(user, options)),
  };
}

export function mapCreateHotlistResult(hotlist: CreatedHotlist): CreateHotlistResult {
  return {
    hotlist_id: normalizeNumber(hotlist.id),
    name: normalizeString(hotlist.name),
    related_to_type: normalizeString(hotlist.related_to_type),
    shared: normalizeBoolean(hotlist.shared),
    created_by: normalizeNumber(hotlist.created_by),
  };
}

export function mapCandidateSummary(
  candidate: RecruitCrmCandidate,
  options: { includeContactInfo?: boolean } = {},
): CandidateSummary {
  const summary: CandidateSummary = {
    slug: candidate.slug,
    first_name: normalizeString(candidate.first_name),
    last_name: normalizeString(candidate.last_name),
    position: normalizeString(candidate.position),
    current_organization: normalizeString(candidate.current_organization),
    current_status: normalizeString(candidate.current_status),
    city: normalizeString(candidate.city),
    updated_on: normalizeString(candidate.updated_on),
  };

  if (options.includeContactInfo) {
    summary.email = normalizeString(candidate.email);
    summary.contact_number = normalizeString(candidate.contact_number);
    summary.linkedin = normalizeString(candidate.linkedin);
  }

  return summary;
}

export function mapJobSummary(job: RecruitCrmJob): JobSummary {
  return {
    id: normalizeNumber(job.id),
    slug: normalizeString(job.slug),
    name: normalizeString(job.name),
    company_slug: normalizeString(job.company_slug),
    contact_slug: normalizeString(job.contact_slug),
    secondary_contact_slugs: normalizeStringArray(job.secondary_contact_slugs),
    job_status: normalizeJobStatus(job.job_status),
    note_for_candidates: normalizeString(job.note_for_candidates),
    number_of_openings: normalizeNumber(job.number_of_openings),
    minimum_experience: normalizeNumber(job.minimum_experience),
    maximum_experience: normalizeNumber(job.maximum_experience),
    min_annual_salary: normalizeNumber(job.min_annual_salary),
    max_annual_salary: normalizeNumber(job.max_annual_salary),
    pay_rate: normalizeNumber(job.pay_rate),
    bill_rate: normalizeNumber(job.bill_rate),
    salary_type: normalizeSalaryType(job.salary_type),
    job_type: normalizeJobType(job.job_type),
    job_category: normalizeString(job.job_category),
    job_skill: normalizeString(job.job_skill),
    city: normalizeString(job.city),
    locality: normalizeString(job.locality),
    state: normalizeString(job.state),
    country: normalizeString(job.country),
    enable_job_application_form: normalizeBoolean(job.enable_job_application_form),
    application_form_url: normalizeString(job.application_form_url),
    owner: normalizeNumber(job.owner),
    created_on: normalizeString(job.created_on),
    updated_on: normalizeString(job.updated_on),
  };
}

export function mapCompanySummary(company: RecruitCrmCompany): CompanySummary {
  const offLimit = mapCompanyOffLimitSummary(company);

  return {
    id: normalizeNumber(company.id),
    slug: normalizeString(company.slug),
    company_name: normalizeString(company.company_name),
    website: normalizeString(company.website),
    city: normalizeString(company.city),
    locality: normalizeString(company.locality),
    state: normalizeString(company.state),
    country: normalizeString(company.country),
    postal_code: normalizeString(company.postal_code),
    address: normalizeString(company.address),
    owner: normalizeNumber(company.owner),
    contact_slugs: normalizeStringList(company.contact_slug),
    is_child_company: normalizeYesNoBoolean(company.is_child_company),
    is_parent_company: normalizeYesNoBoolean(company.is_parent_company),
    child_company_slugs: normalizeStringArray(company.child_company_slugs),
    parent_company_slug: normalizeString(company.parent_company_slug),
    marked_as_off_limit: offLimit !== null,
    off_limit: offLimit,
    created_on: normalizeString(company.created_on),
    updated_on: normalizeString(company.updated_on),
  };
}

export function mapContactSummary(
  contact: RecruitCrmContact,
  options: { includeContactInfo?: boolean } = {},
): ContactSummary {
  const summary: ContactSummary = {
    slug: normalizeString(contact.slug) ?? "",
    first_name: normalizeString(contact.first_name),
    last_name: normalizeString(contact.last_name),
    designation: normalizeString(contact.designation),
    company_slug: normalizeString(contact.company_slug),
    additional_company_slugs: normalizeStringArray(contact.additional_company_slugs),
    city: normalizeString(contact.city),
    locality: normalizeString(contact.locality),
    updated_on: normalizeString(contact.updated_on),
  };

  if (options.includeContactInfo) {
    summary.email = normalizeString(contact.email);
    summary.contact_number = normalizeString(contact.contact_number);
    summary.linkedin = normalizeString(contact.linkedin);
  }

  return summary;
}

export function mapHotlistSummary(
  hotlist: RecruitCrmHotlist,
  options: { includeRelatedSlugs?: boolean } = {},
): HotlistSummary {
  const relatedSlugs = normalizeCommaSeparatedStringList(hotlist.related);

  const summary: HotlistSummary = {
    id: normalizeNumber(hotlist.id),
    name: normalizeString(hotlist.name),
    related_to_type: normalizeString(hotlist.related_to_type),
    shared: normalizeBoolean(hotlist.shared),
    created_by: normalizeNumber(hotlist.created_by),
    related_count: relatedSlugs.length,
  };

  if (options.includeRelatedSlugs) {
    summary.related_slugs = relatedSlugs;
  }

  return summary;
}

export function mapUserSummary(
  user: RecruitCrmUser,
  options: { includeTeams?: boolean; includeContactInfo?: boolean } = {},
): UserSummary {
  const summary: UserSummary = {
    id: normalizeNumber(user.id),
    first_name: normalizeString(user.first_name),
    last_name: normalizeString(user.last_name),
    status: normalizeString(user.status),
  };

  if (options.includeTeams) {
    summary.teams = normalizeUserTeams(user.teams);
  }

  if (options.includeContactInfo) {
    summary.email = normalizeString(user.email);
    summary.contact_number = normalizeString(user.contact_number);
  }

  return summary;
}

export function mapSearchTasksResult(response: RecruitCrmTaskSearchResponse): SearchTasksResult {
  return {
    page: response.current_page ?? 1,
    returned_count: response.data.length,
    has_more: hasNextPage(response.next_page_url),
    tasks: response.data.map(mapTaskSummary),
  };
}

export function mapListTaskTypesResult(response: RecruitCrmTaskTypeListResponse): ListTaskTypesResult {
  return {
    returned_count: response.length,
    task_types: response.map(mapTaskTypeSummary),
  };
}

export function mapCreateTaskResult(task: CreatedTask): CreateTaskResult {
  const relatedTo = normalizeString(task.related_to);
  const relatedToType = normalizeString(task.related_to_type);

  return {
    task_id: normalizeNumber(task.id),
    title: normalizeString(task.title),
    task_type: normalizeSingleTaskType(task.task_type),
    description: normalizeStringPreserveWhitespace(task.description),
    reminder: normalizeNumber(task.reminder),
    start_date: normalizeString(task.start_date),
    reminder_date: normalizeString(task.reminder_date),
    related_to: relatedTo,
    related_to_type: relatedToType,
    related_to_name: normalizeString(task.related_to_name),
    related_to_view_url: buildRecruitCrmEntityViewUrl(relatedToType, relatedTo),
    status: normalizeScalar(task.status),
    owner: normalizeNumber(task.owner),
    associated_candidates: normalizeNoteStringCollection(task.associated_candidates),
    associated_companies: normalizeNoteStringCollection(task.associated_companies),
    associated_contacts: normalizeNoteStringCollection(task.associated_contacts),
    associated_jobs: normalizeNoteStringCollection(task.associated_jobs),
    associated_deals: normalizeNoteStringCollection(task.associated_deals),
    created_on: normalizeString(task.created_on),
    updated_on: normalizeString(task.updated_on),
    created_by: normalizeNumber(task.created_by),
    updated_by: normalizeNumber(task.updated_by),
    collaborators: normalizeTaskCollaborators(task.collaborators),
    collaborator_users: normalizeTaskCollaboratorUsers(task.collaborator_users),
    collaborator_teams: normalizeTaskCollaboratorTeams(task.collaborator_teams),
  };
}

export function mapSearchMeetingsResult(response: RecruitCrmMeetingSearchResponse): SearchMeetingsResult {
  return {
    page: response.current_page ?? 1,
    returned_count: response.data.length,
    has_more: hasNextPage(response.next_page_url),
    meetings: response.data.map(mapMeetingSummary),
  };
}

export function mapSearchNotesResult(response: RecruitCrmNoteSearchResponse): SearchNotesResult {
  return {
    page: response.current_page ?? 1,
    returned_count: response.data.length,
    has_more: hasNextPage(response.next_page_url),
    notes: response.data.map(mapNoteSummary),
  };
}

export function mapListNoteTypesResult(response: RecruitCrmNoteTypeListResponse): ListNoteTypesResult {
  return {
    returned_count: response.length,
    note_types: response.map(mapNoteTypeSummary),
  };
}

export function mapCreateNoteResult(note: CreatedNote): CreateNoteResult {
  const relatedTo = normalizeString(note.related_to);
  const relatedToType = normalizeString(note.related_to_type);

  return {
    note_id: normalizeNumber(note.id),
    note_type: normalizeSingleNoteType(note.note_type),
    description: normalizeStringPreserveWhitespace(note.description),
    related_to: relatedTo,
    related_to_type: relatedToType,
    related_to_view_url: buildRecruitCrmEntityViewUrl(relatedToType, relatedTo),
    associated_candidates: normalizeNoteStringCollection(note.associated_candidates),
    associated_companies: normalizeNoteStringCollection(note.associated_companies),
    associated_contacts: normalizeNoteStringCollection(note.associated_contacts),
    associated_jobs: normalizeNoteStringCollection(note.associated_jobs),
    associated_deals: normalizeNoteStringCollection(note.associated_deals),
    created_on: normalizeString(note.created_on),
    updated_on: normalizeString(note.updated_on),
    created_by: normalizeNumber(note.created_by),
    updated_by: normalizeNumber(note.updated_by),
    collaborator_users: normalizeNoteCollaboratorUsers(note.collaborator_users),
    collaborator_teams: normalizeNoteCollaboratorTeams(note.collaborator_teams),
  };
}

export function mapSearchCallLogsResult(response: RecruitCrmCallLogSearchResponse): SearchCallLogsResult {
  return {
    page: response.current_page ?? 1,
    returned_count: response.data.length,
    has_more: hasNextPage(response.next_page_url),
    call_logs: response.data.map(mapCallLogSummary),
  };
}

export function mapJobAssignedCandidatesResult(
  jobSlug: string,
  response: RecruitCrmJobAssignedCandidatesResponse,
): JobAssignedCandidatesResult {
  return {
    job_slug: jobSlug,
    page: response.current_page ?? 1,
    returned_count: response.data.length,
    has_more: hasNextPage(response.next_page_url),
    assigned_candidates: response.data.map(mapAssignedCandidateSummary),
  };
}

export function mapCandidateHiringStagesResult(
  response: RecruitCrmHiringPipelineResponse,
): CandidateHiringStagesResult {
  return {
    returned_count: response.length,
    stages: response.map(mapHiringStageSummary),
  };
}

export function mapJobStatusesResult(
  response: RecruitCrmJobStatusListResponse,
): JobStatusesResult {
  return {
    returned_count: response.length,
    statuses: response.map((status) => ({
      id: normalizeNumber(status.id),
      label: normalizeString(status.label),
    })),
  };
}

export function mapCandidateJobAssignmentHiringStageHistoryResult(
  candidateSlug: string,
  response: RecruitCrmCandidateJobAssignmentHiringStageHistoryResponse,
): CandidateJobAssignmentHiringStageHistoryResult {
  return {
    candidate_slug: candidateSlug,
    returned_count: response.length,
    history: response.map(mapCandidateJobAssignmentHiringStageHistoryItem),
  };
}

export function mapTaskSummary(task: RecruitCrmTask): TaskSummary {
  return {
    id: normalizeNumber(task.id),
    related_to: normalizeString(task.related_to),
    task_type: normalizeTaskTypes(task.task_type),
    related_to_type: normalizeString(task.related_to_type),
    related_to_name: normalizeString(task.related_to_name),
    related: mapActivityRelated(task.related),
    description: normalizeString(task.description),
    title: normalizeString(task.title),
    status: normalizeNumber(task.status),
    start_date: normalizeString(task.start_date),
    reminder_date: normalizeString(task.reminder_date),
    reminder: normalizeNumber(task.reminder),
    owner: normalizeNumber(task.owner),
    created_on: normalizeString(task.created_on),
    updated_on: normalizeString(task.updated_on),
    created_by: normalizeNumber(task.created_by),
    updated_by: normalizeNumber(task.updated_by),
  };
}

export function mapMeetingSummary(meeting: RecruitCrmMeeting): MeetingSummary {
  return {
    id: normalizeNumber(meeting.id),
    title: normalizeString(meeting.title),
    meeting_type: normalizeMeetingTypes(meeting.meeting_type),
    description: normalizeString(meeting.description),
    address: normalizeString(meeting.address),
    reminder: normalizeNumber(meeting.reminder),
    start_date: normalizeString(meeting.start_date),
    end_date: normalizeString(meeting.end_date),
    related_to: normalizeString(meeting.related_to),
    related_to_type: normalizeString(meeting.related_to_type),
    related: mapActivityRelated(meeting.related),
    do_not_send_calendar_invites: normalizeBoolean(meeting.do_not_send_calendar_invites),
    status: normalizeScalar(meeting.status),
    reminder_date: normalizeString(meeting.reminder_date),
    all_day: normalizeBoolean(meeting.all_day),
    owner: normalizeNumber(meeting.owner),
    created_on: normalizeString(meeting.created_on),
    updated_on: normalizeString(meeting.updated_on),
    created_by: normalizeNumber(meeting.created_by),
    updated_by: normalizeNumber(meeting.updated_by),
  };
}

export function mapNoteSummary(note: RecruitCrmNote): NoteSummary {
  return {
    id: normalizeNumber(note.id),
    note_type: normalizeNoteTypes(note.note_type),
    description: normalizeString(note.description),
    related_to: normalizeString(note.related_to),
    related_to_type: normalizeString(note.related_to_type),
    related: mapActivityRelated(note.related),
    resource_url: normalizeString(note.resource_url),
    created_on: normalizeString(note.created_on),
    updated_on: normalizeString(note.updated_on),
    created_by: normalizeNumber(note.created_by),
    updated_by: normalizeNumber(note.updated_by),
  };
}

export function mapCallLogSummary(callLog: RecruitCrmCallLog): CallLogSummary {
  return {
    id: normalizeNumber(callLog.id),
    call_type: normalizeString(callLog.call_type),
    custom_call_type: normalizeCallLogTypes(callLog.custom_call_type),
    call_started_on: normalizeString(callLog.call_started_on),
    contact_number: normalizeString(callLog.contact_number),
    call_notes: normalizeString(callLog.call_notes),
    related_to: normalizeString(callLog.related_to),
    related_to_type: normalizeString(callLog.related_to_type),
    related: mapActivityRelated(callLog.related),
    duration: normalizeScalar(callLog.duration),
    created_on: normalizeString(callLog.created_on),
    updated_on: normalizeString(callLog.updated_on),
    created_by: normalizeNumber(callLog.created_by),
    updated_by: normalizeNumber(callLog.updated_by),
  };
}

export function mapAssignedCandidateSummary(item: RecruitCrmJobAssignedCandidate): AssignedCandidateSummary {
  return {
    candidate_slug: item.candidate.slug,
    first_name: normalizeString(item.candidate.first_name),
    last_name: normalizeString(item.candidate.last_name),
    position: normalizeString(item.candidate.position),
    current_organization: normalizeString(item.candidate.current_organization),
    current_status: normalizeString(item.candidate.current_status),
    city: normalizeString(item.candidate.city),
    country: normalizeString(item.candidate.country),
    updated_on: normalizeString(item.candidate.updated_on),
    stage_date: normalizeString(item.stage_date),
    status_id: normalizeNumber(item.status?.status_id),
    status_label: normalizeString(item.status?.label),
  };
}

export function mapHiringStageSummary(stage: RecruitCrmHiringStage): HiringStageSummary {
  return {
    stage_id: normalizeNumber(stage.stage_id ?? stage.status_id),
    label: normalizeString(stage.label),
  };
}

export function mapCandidateJobAssignmentHiringStageHistoryItem(
  item: RecruitCrmCandidateJobAssignmentHiringStageHistoryItem,
): CandidateJobAssignmentHiringStageHistoryItem {
  return {
    job_slug: normalizeString(item.job_slug),
    job_name: normalizeString(item.job_name),
    company_slug: normalizeString(item.company_slug),
    company_name: normalizeString(item.company_name),
    job_status_id: normalizeNumber(item.job_status_id),
    job_status_label: normalizeString(item.job_status_label),
    candidate_status_id: normalizeNumber(item.candidate_status_id),
    candidate_status: normalizeString(item.candidate_status),
    remark: normalizeString(item.remark),
    updated_by: normalizeNumber(item.updated_by),
    updated_on: normalizeString(item.updated_on),
  };
}

function normalizeJobStatus(jobStatus: RecruitCrmJobStatus | null | undefined): JobStatusSummary | null {
  if (jobStatus === undefined || jobStatus === null) {
    return null;
  }

  return {
    id: normalizeNumber(jobStatus.id),
    label: normalizeString(jobStatus.label),
  };
}

function hasNextPage(nextPageUrl: string | null | undefined): boolean {
  return Boolean(nextPageUrl && nextPageUrl !== "null");
}

function normalizeString(value: string | number | null | undefined): string | null {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value === "number") {
    return String(value);
  }

  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function normalizeStringPreserveWhitespace(value: string | number | null | undefined): string | null {
  if (value === undefined || value === null) {
    return null;
  }

  return typeof value === "number" ? String(value) : value;
}

function buildRecruitCrmEntityViewUrl(relatedToType: string | null, relatedTo: string | null): string | null {
  if (relatedToType === null || relatedTo === null) {
    return null;
  }

  const normalizedType = relatedToType.trim().toLowerCase();

  if (!["candidate", "company", "contact", "job", "deal"].includes(normalizedType)) {
    return null;
  }

  return `https://app.recruitcrm.io/${normalizedType}/${relatedTo}`;
}

function normalizeNumber(value: number | string | null | undefined): number | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeBoolean(value: number | string | boolean | null | undefined): boolean | null {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const trimmed = value.trim().toLowerCase();

    if (trimmed === "1" || trimmed === "true") {
      return true;
    }

    if (trimmed === "0" || trimmed === "false") {
      return false;
    }

    return null;
  }

  if (value === 1) {
    return true;
  }

  if (value === 0) {
    return false;
  }

  return null;
}

function normalizeYesNoBoolean(value: number | string | boolean | null | undefined): boolean | null {
  const normalized = normalizeBoolean(value);

  if (normalized !== null) {
    return normalized;
  }

  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim().toLowerCase();

  if (trimmed === "yes") {
    return true;
  }

  if (trimmed === "no") {
    return false;
  }

  return null;
}

function normalizeStringArray(values: Array<string | number | null> | null | undefined): string[] {
  if (!values || values.length === 0) {
    return [];
  }

  return values
    .map((value) => normalizeString(value))
    .filter((value): value is string => value !== null);
}

function normalizeUserTeams(
  teams: Array<RecruitCrmUserTeam | number> | null | undefined,
): UserTeamSummary[] {
  if (!teams || teams.length === 0) {
    return [];
  }

  return teams
    .filter((team): team is RecruitCrmUserTeam => typeof team === "object" && team !== null)
    .map((team) => ({
      team_id: normalizeNumber(team.team_id),
      team_name: normalizeString(team.team_name),
    }));
}

function normalizeStringList(
  values: string | number | Array<string | number | null> | null | undefined,
): string[] {
  if (values === undefined || values === null) {
    return [];
  }

  if (Array.isArray(values)) {
    return normalizeStringArray(values);
  }

  const normalizedValue = normalizeString(values);

  return normalizedValue === null ? [] : [normalizedValue];
}

function normalizeCommaSeparatedStringList(value: string | number | null | undefined): string[] {
  const normalizedValue = normalizeString(value);

  if (normalizedValue === null) {
    return [];
  }

  return normalizedValue
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry !== "");
}

function mapCompanyOffLimitSummary(company: RecruitCrmCompany): CompanyOffLimitSummary | null {
  const statusId = normalizeNumber(company.off_limit_status_id);
  const statusLabel = normalizeString(company.status_label);
  const reason = normalizeString(company.off_limit_reason);
  const endDate = normalizeString(company.off_limit_end_date);

  if (statusId === null && statusLabel === null && reason === null && endDate === null) {
    return null;
  }

  return {
    status_id: statusId,
    status_label: statusLabel,
    reason,
    end_date: endDate,
  };
}

function normalizeTaskTypes(
  taskTypes: RecruitCrmTaskType | RecruitCrmTaskType[] | null | undefined,
): TaskTypeSummary[] | null {
  if (taskTypes === undefined || taskTypes === null) {
    return null;
  }

  const normalizedTaskTypes = Array.isArray(taskTypes) ? taskTypes : [taskTypes];

  return normalizedTaskTypes.map(mapTaskTypeSummary);
}

function normalizeSingleTaskType(
  taskTypes: RecruitCrmTaskType | RecruitCrmTaskType[] | null | undefined,
): TaskTypeSummary | null {
  if (taskTypes === undefined || taskTypes === null) {
    return null;
  }

  const taskType = Array.isArray(taskTypes) ? taskTypes[0] : taskTypes;

  return taskType === undefined ? null : mapTaskTypeSummary(taskType);
}

function mapTaskTypeSummary(taskType: RecruitCrmTaskType): TaskTypeSummary {
  return {
    id: normalizeIdentifier(taskType.id),
    label: normalizeString(taskType.label),
  };
}

function normalizeTaskCollaborators(
  collaborators: RecruitCrmTaskCollaborator[] | null | undefined,
): TaskCollaboratorSummary[] {
  if (!collaborators || collaborators.length === 0) {
    return [];
  }

  return collaborators.map((collaborator) => ({
    attendee_type: normalizeString(collaborator.attendee_type),
    attendee_id: normalizeString(collaborator.attendee_id),
    display_name: normalizeString(collaborator.display_name),
  }));
}

function normalizeTaskCollaboratorUsers(
  users: RecruitCrmTaskCollaboratorUser[] | null | undefined,
): TaskCollaboratorUserSummary[] {
  if (!users || users.length === 0) {
    return [];
  }

  return users.map((user) => ({
    id: normalizeNumber(user.id),
    first_name: normalizeString(user.first_name),
    last_name: normalizeString(user.last_name),
  }));
}

function normalizeTaskCollaboratorTeams(
  teams: Array<RecruitCrmTaskCollaboratorTeam | number | string | null> | null | undefined,
): TaskCollaboratorTeamSummary[] {
  if (!teams || teams.length === 0) {
    return [];
  }

  return teams
    .filter((team): team is RecruitCrmTaskCollaboratorTeam | number | string => team !== null)
    .map((team) => {
      if (typeof team === "number" || typeof team === "string") {
        return {
          team_id: normalizeNumber(team),
          team_name: null,
        };
      }

      return {
        team_id: normalizeNumber(team.team_id ?? team.id),
        team_name: normalizeString(team.team_name),
      };
    });
}

function normalizeIdentifier(value: number | string | null | undefined): number | string | null {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function normalizeSalaryType(
  salaryType:
    | string
    | number
    | {
        id?: number | string | null;
        label?: string | number | null;
      }
    | null
    | undefined,
): string | null {
  if (salaryType === undefined || salaryType === null) {
    return null;
  }

  if (typeof salaryType === "object") {
    return normalizeString(salaryType.label);
  }

  return normalizeString(salaryType);
}

function normalizeJobType(value: string | number | null | undefined): string | null {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value === "number") {
    return mapJobTypeCode(value);
  }

  const trimmed = value.trim();

  if (trimmed === "") {
    return null;
  }

  const numericValue = Number(trimmed);

  if (Number.isFinite(numericValue)) {
    const mapped = mapJobTypeCode(numericValue);
    return mapped ?? trimmed;
  }

  return trimmed;
}

function mapJobTypeCode(value: number): string | null {
  switch (value) {
    case 1:
      return "Part Time";
    case 2:
      return "Full Time";
    case 3:
      return "Contract";
    case 4:
      return "Contract to Permanent";
    default:
      return null;
  }
}

function normalizeMeetingTypes(
  meetingTypes: RecruitCrmMeetingType | RecruitCrmMeetingType[] | null | undefined,
): MeetingTypeSummary[] | null {
  if (meetingTypes === undefined || meetingTypes === null) {
    return null;
  }

  const normalizedMeetingTypes = Array.isArray(meetingTypes) ? meetingTypes : [meetingTypes];

  return normalizedMeetingTypes.map((meetingType) => ({
    id: normalizeIdentifier(meetingType.id),
    label: normalizeString(meetingType.label),
  }));
}

function normalizeNoteTypes(
  noteTypes: RecruitCrmNoteType | RecruitCrmNoteType[] | null | undefined,
): NoteTypeSummary[] | null {
  if (noteTypes === undefined || noteTypes === null) {
    return null;
  }

  const normalizedNoteTypes = Array.isArray(noteTypes) ? noteTypes : [noteTypes];

  return normalizedNoteTypes.map(mapNoteTypeSummary);
}

function normalizeSingleNoteType(
  noteTypes: RecruitCrmNoteType | RecruitCrmNoteType[] | null | undefined,
): NoteTypeSummary | null {
  if (noteTypes === undefined || noteTypes === null) {
    return null;
  }

  const noteType = Array.isArray(noteTypes) ? noteTypes[0] : noteTypes;

  return noteType === undefined ? null : mapNoteTypeSummary(noteType);
}

function mapNoteTypeSummary(noteType: RecruitCrmNoteType): NoteTypeSummary {
  return {
    id: normalizeIdentifier(noteType.id),
    label: normalizeString(noteType.label),
  };
}

function normalizeNoteStringCollection(
  values: Array<string | number | null> | string | number | null | undefined,
): string[] {
  if (Array.isArray(values)) {
    return normalizeStringArray(values);
  }

  return normalizeCommaSeparatedStringList(values);
}

function normalizeNoteCollaboratorUsers(
  users: RecruitCrmNoteCollaboratorUser[] | null | undefined,
): NoteCollaboratorUserSummary[] {
  if (!users || users.length === 0) {
    return [];
  }

  return users.map((user) => ({
    id: normalizeNumber(user.id),
    first_name: normalizeString(user.first_name),
    last_name: normalizeString(user.last_name),
  }));
}

function normalizeNoteCollaboratorTeams(
  teams: Array<RecruitCrmNoteCollaboratorTeam | number | string | null> | null | undefined,
): NoteCollaboratorTeamSummary[] {
  if (!teams || teams.length === 0) {
    return [];
  }

  return teams
    .filter((team): team is RecruitCrmNoteCollaboratorTeam | number | string => team !== null)
    .map((team) => {
      if (typeof team === "number" || typeof team === "string") {
        return {
          team_id: normalizeNumber(team),
          team_name: null,
        };
      }

      return {
        team_id: normalizeNumber(team.team_id ?? team.id),
        team_name: normalizeString(team.team_name),
      };
    });
}

function normalizeCallLogTypes(
  callLogTypes: RecruitCrmCallLogType | RecruitCrmCallLogType[] | null | undefined,
): CallLogTypeSummary[] | null {
  if (callLogTypes === undefined || callLogTypes === null) {
    return null;
  }

  const normalizedCallLogTypes = Array.isArray(callLogTypes) ? callLogTypes : [callLogTypes];

  return normalizedCallLogTypes.map((callLogType) => ({
    id: normalizeIdentifier(callLogType.id),
    label: normalizeString(callLogType.label),
  }));
}

function mapActivityRelated(related: RecruitCrmActivityRelated | null | undefined): ActivityRelatedSummary | null {
  if (!related) {
    return null;
  }

  const firstName = normalizeString(related.first_name);
  const lastName = normalizeString(related.last_name);

  if (firstName !== null || lastName !== null) {
    const person: ActivityRelatedSummary = {};

    if (firstName !== null) {
      person.first_name = firstName;
    }

    if (lastName !== null) {
      person.last_name = lastName;
    }

    return Object.keys(person).length > 0 ? person : null;
  }

  const companyName = normalizeString(related.company_name);

  if (companyName !== null) {
    return {
      company_name: companyName,
    };
  }

  const name = normalizeString(related.name);

  if (name !== null) {
    return {
      name,
    };
  }

  return null;
}

function normalizeScalar(value: number | string | null | undefined): string | number | null {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}
